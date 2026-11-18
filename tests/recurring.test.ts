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
    skipOccurrence: jest.fn(() => Promise.resolve({ ok: true, data: true })),
    approveOccurrence: jest.fn(() => Promise.resolve({ ok: true, data: 'tx-1' })),
    fetchDue: jest.fn(() => Promise.resolve({ ok: true, data: [] })),
  },
}));

jest.mock('@/src/repositories/transactions.repository', () => ({
  transactionsRepository: {
    create: jest.fn(() => Promise.resolve({ ok: true, data: { id: 'tx-1' } })),
  },
  notifyTransactionsChanged: jest.fn(),
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
const { transactionsRepository, notifyTransactionsChanged } = require('@/src/repositories/transactions.repository');
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
  recurringRepository.skipOccurrence.mockResolvedValue({ ok: true, data: true });
  recurringRepository.approveOccurrence.mockResolvedValue({ ok: true, data: 'tx-1' });
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

  // AUDIT-2026-11 B3: 29 Feb used to roll over to 1 Mar and stay there.
  it('yearly keeps a 29 Feb rule in February and returns to the 29th in leap years', () => {
    expect(addInterval('2028-02-29', 'yearly', 29)).toBe('2029-02-28');
    expect(addInterval('2029-02-28', 'yearly', 29)).toBe('2030-02-28');
    expect(addInterval('2031-02-28', 'yearly', 29)).toBe('2032-02-29');
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
//
// Since AUDIT #21 the transaction row, its category/account routing and the
// balance move are done inside the approve_recurring_occurrence SQL function
// (supabase/migrations/20261116_audit_sql.sql), which Jest can't run. These
// specs cover the app side: which occurrence and next date it asks for, and
// what it does with each answer.

describe('approveRecurring()', () => {
  it('approves the current occurrence and asks for the next one in one call', async () => {
    await approveRecurring(rule({ frequency: 'monthly', next_date: '2026-03-15', start_date: '2026-01-15' }));
    expect(recurringRepository.approveOccurrence).toHaveBeenCalledTimes(1);
    expect(recurringRepository.approveOccurrence).toHaveBeenCalledWith('rule-1', '2026-03-15', '2026-04-15');
  });

  it('never creates the transaction or advances the rule as separate requests', async () => {
    await approveRecurring(rule());
    expect(transactionsRepository.create).not.toHaveBeenCalled();
    expect(recurringRepository.skipOccurrence).not.toHaveBeenCalled();
  });

  it('uses start_date as the occurrence when next_date is absent', async () => {
    await approveRecurring(rule({ next_date: undefined, start_date: '2026-01-15' }));
    expect(recurringRepository.approveOccurrence).toHaveBeenCalledWith('rule-1', '2026-01-15', '2026-02-15');
  });

  it('keeps month-end anchoring for the next date', async () => {
    await approveRecurring(rule({ frequency: 'monthly', start_date: '2026-01-31', next_date: '2026-02-28' }));
    expect(recurringRepository.approveOccurrence).toHaveBeenCalledWith('rule-1', '2026-02-28', '2026-03-31');
  });

  it('fires a "charged" notification and tells listeners on success', async () => {
    const res = await approveRecurring(rule());
    expect(res).toEqual({ ok: true, data: 'tx-1' });
    expect(notifyTransactionsChanged).toHaveBeenCalledTimes(1);
    expect(notify).toHaveBeenCalledWith(
      expect.objectContaining({
        type: 'recurring',
        emoji: '🔁',
        message: 'Netflix charged',
        related_entity_id: 'rule-1',
      }),
    );
  });

  it('treats an already-approved occurrence as success without a notification', async () => {
    recurringRepository.approveOccurrence.mockResolvedValue({ ok: true, data: null });
    const res = await approveRecurring(rule());
    expect(res).toEqual({ ok: true, data: null });
    expect(notify).not.toHaveBeenCalled();
    expect(notifyTransactionsChanged).not.toHaveBeenCalled();
  });

  it('returns a failure unchanged and does not notify', async () => {
    const failure = { ok: false as const, error: { code: 'X', message: 'rpc failed' } };
    recurringRepository.approveOccurrence.mockResolvedValue(failure);
    const res = await approveRecurring(rule());
    expect(res).toBe(failure);
    expect(notify).not.toHaveBeenCalled();
    expect(notifyTransactionsChanged).not.toHaveBeenCalled();
  });
});

// --- skipRecurring ----------------------------------------------------------

describe('skipRecurring()', () => {
  it('rolls next_date forward WITHOUT creating a transaction', async () => {
    await skipRecurring(rule({ frequency: 'monthly', next_date: '2026-03-15', start_date: '2026-01-15' }));
    expect(transactionsRepository.create).not.toHaveBeenCalled();
    expect(recurringRepository.skipOccurrence).toHaveBeenCalledWith('rule-1', '2026-03-15', '2026-04-15');
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

  it('does not notify when another device already moved the rule', async () => {
    recurringRepository.skipOccurrence.mockResolvedValue({ ok: true, data: false });
    const res = await skipRecurring(rule());
    expect(res.ok).toBe(true);
    expect(notify).not.toHaveBeenCalled();
  });

  it('does not notify when the skip fails, and returns the failure', async () => {
    const failure = { ok: false as const, error: { code: 'X', message: 'update failed' } };
    recurringRepository.skipOccurrence.mockResolvedValue(failure);
    const res = await skipRecurring(rule());
    expect(res).toBe(failure);
    expect(notify).not.toHaveBeenCalled();
  });
});
