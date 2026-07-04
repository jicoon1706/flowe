/**
 * Tests for the recurring service (src/services/recurring.ts).
 *
 * This module backs the "recurring due → approve/reject" popup. When a rule's
 * date arrives it is no longer auto-materialized; instead the home screen shows
 * each due rule and the user either:
 *   - approves  → approveRecurring(): create a real dated transaction AND roll
 *                 the rule's next_date forward one interval, then notify.
 *   - rejects   → skipRecurring(): roll next_date forward WITHOUT creating a
 *                 transaction (this period is skipped), then notify.
 *
 * addInterval() is the shared date-math both paths lean on (via rolledNextDate),
 * so its monthly re-anchoring / clamping is covered here too.
 */

// --- Mocks ------------------------------------------------------------------

jest.mock('@/src/lib/supabase', () => ({
  supabase: {
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'user-123' } } })),
    },
  },
}));

jest.mock('@/src/repositories/recurring.repository', () => ({
  recurringRepository: {
    advance: jest.fn(() => Promise.resolve({ ok: true, data: undefined })),
    fetchDue: jest.fn(() => Promise.resolve({ ok: true, data: [] })),
  },
}));

jest.mock('@/src/repositories/transactions.repository', () => ({
  transactionsRepository: {
    create: jest.fn(() => Promise.resolve({ ok: true, data: { id: 'tx-1' } })),
  },
}));

jest.mock('@/src/services/notifications', () => ({
  notify: jest.fn(() => Promise.resolve()),
  formatRM: jest.fn((n: number) => `RM ${Number(n).toFixed(2)}`),
}));

// --- Imports (after mocks) --------------------------------------------------

import {
  addInterval,
  occurrenceDate,
  approveRecurring,
  skipRecurring,
} from '@/src/services/recurring';
import type { RecurringRule } from '@/src/types';

const { recurringRepository } = require('@/src/repositories/recurring.repository');
const { transactionsRepository } = require('@/src/repositories/transactions.repository');
const { notify } = require('@/src/services/notifications');

// --- Fixtures ---------------------------------------------------------------

/** Build a RecurringRule with only the fields the service reads. */
function rule(overrides: Partial<RecurringRule> = {}): RecurringRule {
  return {
    id: 'rule-1',
    user_id: 'user-123',
    type: 'expense',
    name: 'Netflix',
    amount: 55,
    category: 'entertainment',
    from_account_id: 'acc-from',
    to_account_id: undefined,
    frequency: 'monthly',
    start_date: '2026-01-15',
    end_date: undefined,
    next_date: '2026-03-15',
    reminder_enabled: false,
    reminder_offset: 'none',
    status: 'active',
    last_applied_at: undefined,
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  };
}

beforeEach(() => {
  jest.clearAllMocks();
  recurringRepository.advance.mockResolvedValue({ ok: true, data: undefined });
  transactionsRepository.create.mockResolvedValue({ ok: true, data: { id: 'tx-1' } });
  notify.mockResolvedValue(undefined);
});

// --- addInterval ------------------------------------------------------------

describe('addInterval()', () => {
  it('weekly adds 7 days', () => {
    expect(addInterval('2026-03-15', 'weekly', 15)).toBe('2026-03-22');
  });

  it('weekly rolls across a month boundary', () => {
    expect(addInterval('2026-03-28', 'weekly', 28)).toBe('2026-04-04');
  });

  it('yearly adds one year', () => {
    expect(addInterval('2026-03-15', 'yearly', 15)).toBe('2027-03-15');
  });

  it('monthly adds one month re-anchored to the rule day', () => {
    expect(addInterval('2026-03-15', 'monthly', 15)).toBe('2026-04-15');
  });

  it('monthly clamps a 31st anchor to a short month, then recovers next month', () => {
    // Jan 31 -> Feb 28 (clamped)
    expect(addInterval('2026-01-31', 'monthly', 31)).toBe('2026-02-28');
    // From the clamped Feb 28, the 31 anchor restores March 31 (no drift).
    expect(addInterval('2026-02-28', 'monthly', 31)).toBe('2026-03-31');
  });

  it('monthly rolls December into next January', () => {
    expect(addInterval('2026-12-15', 'monthly', 15)).toBe('2027-01-15');
  });
});

// --- occurrenceDate ---------------------------------------------------------

describe('occurrenceDate()', () => {
  it('returns next_date when present', () => {
    expect(occurrenceDate(rule({ next_date: '2026-05-15' }))).toBe('2026-05-15');
  });

  it('falls back to start_date when next_date is missing', () => {
    expect(occurrenceDate(rule({ next_date: undefined, start_date: '2026-01-15' }))).toBe(
      '2026-01-15',
    );
  });
});

// --- approveRecurring -------------------------------------------------------

describe('approveRecurring()', () => {
  it('creates a dated transaction for the current occurrence', async () => {
    await approveRecurring(rule());
    expect(transactionsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({
        user_id: 'user-123',
        type: 'expense',
        name: 'Netflix',
        amount: 55,
        category: 'entertainment',
        from_account_id: 'acc-from',
        to_account_id: undefined,
        date: '2026-03-15',
        is_recurring: true,
        recurring_id: 'rule-1',
      }),
    );
  });

  it('rolls next_date forward one interval after a successful create', async () => {
    await approveRecurring(rule({ frequency: 'monthly', next_date: '2026-03-15', start_date: '2026-01-15' }));
    expect(recurringRepository.advance).toHaveBeenCalledWith('rule-1', '2026-04-15');
  });

  it('fires a "charged" recurring notification', async () => {
    await approveRecurring(rule());
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'recurring',
        emoji: '🔁',
        message: 'Netflix charged',
        related_entity_id: 'rule-1',
      }),
    );
  });

  it('routes an income rule through to_account_id (not from)', async () => {
    await approveRecurring(
      rule({ type: 'income', from_account_id: 'acc-from', to_account_id: 'acc-to' }),
    );
    expect(transactionsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'income', from_account_id: undefined, to_account_id: 'acc-to' }),
    );
  });

  it('defaults the category by type when the rule has none', async () => {
    await approveRecurring(rule({ category: undefined, type: 'expense' }));
    expect(transactionsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'bills' }),
    );
    jest.clearAllMocks();
    await approveRecurring(rule({ category: undefined, type: 'income', to_account_id: 'acc-to' }));
    expect(transactionsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ category: 'others' }),
    );
  });

  it('does not advance or notify when the create fails, and returns the failure', async () => {
    const failure = { ok: false as const, error: { code: 'X', message: 'insert failed' } };
    transactionsRepository.create.mockResolvedValue(failure);
    const res = await approveRecurring(rule());
    expect(res).toBe(failure);
    expect(recurringRepository.advance).not.toHaveBeenCalled();
    expect(notify).not.toHaveBeenCalled();
  });

  it('uses start_date as the occurrence when next_date is absent', async () => {
    await approveRecurring(rule({ next_date: undefined, start_date: '2026-01-15' }));
    expect(transactionsRepository.create).toHaveBeenCalledWith(
      expect.objectContaining({ date: '2026-01-15' }),
    );
    expect(recurringRepository.advance).toHaveBeenCalledWith('rule-1', '2026-02-15');
  });
});

// --- skipRecurring ----------------------------------------------------------

describe('skipRecurring()', () => {
  it('rolls next_date forward WITHOUT creating a transaction', async () => {
    await skipRecurring(rule({ frequency: 'monthly', next_date: '2026-03-15', start_date: '2026-01-15' }));
    expect(transactionsRepository.create).not.toHaveBeenCalled();
    expect(recurringRepository.advance).toHaveBeenCalledWith('rule-1', '2026-04-15');
  });

  it('fires a "skipped" recurring notification on success', async () => {
    await skipRecurring(rule());
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'recurring',
        emoji: '⏭️',
        message: 'Netflix skipped',
        related_entity_id: 'rule-1',
      }),
    );
  });

  it('does not notify when the advance fails, and returns the failure', async () => {
    const failure = { ok: false as const, error: { code: 'X', message: 'update failed' } };
    recurringRepository.advance.mockResolvedValue(failure);
    const res = await skipRecurring(rule());
    expect(res).toBe(failure);
    expect(notify).not.toHaveBeenCalled();
  });
});
