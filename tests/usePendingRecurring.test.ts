/**
 * Tests for usePendingRecurring (src/hooks/usePendingRecurring.ts).
 *
 * This hook drives the home-screen "recurring due" popup. It fetches the rules
 * whose date has arrived (today or earlier), and lets the user approve/reject
 * each one — optimistically dropping a rule from the pending list only when the
 * underlying service call succeeds. Failures leave the item in place so it can
 * be retried.
 */

// --- Mocks ------------------------------------------------------------------

jest.mock('@/src/repositories/recurring.repository', () => ({
  recurringRepository: {
    fetchDue: jest.fn(),
  },
}));

jest.mock('@/src/services/recurring', () => ({
  approveRecurring: jest.fn(),
  skipRecurring: jest.fn(),
}));

// --- Imports (after mocks) --------------------------------------------------

import { act, renderHook, waitFor } from '@testing-library/react-native';
import { usePendingRecurring } from '@/src/hooks/usePendingRecurring';
import type { RecurringRule } from '@/src/types';

const { recurringRepository } = require('@/src/repositories/recurring.repository');
const { approveRecurring, skipRecurring } = require('@/src/services/recurring');

// --- Fixtures ---------------------------------------------------------------

function rule(overrides: Partial<RecurringRule> = {}): RecurringRule {
  return {
    id: 'rule-1',
    user_id: 'user-123',
    type: 'expense',
    name: 'Netflix',
    amount: 55,
    category: 'entertainment',
    frequency: 'monthly',
    start_date: '2026-01-15',
    next_date: '2026-03-15',
    reminder_enabled: false,
    reminder_offset: 'none',
    status: 'active',
    created_at: '2026-01-01T00:00:00Z',
    updated_at: '2026-01-01T00:00:00Z',
    ...overrides,
  } as RecurringRule;
}

const ok = { ok: true as const, data: undefined };
const fail = { ok: false as const, error: { code: 'X', message: 'boom' } };

beforeEach(() => {
  jest.clearAllMocks();
  recurringRepository.fetchDue.mockResolvedValue({ ok: true, data: [] });
  approveRecurring.mockResolvedValue(ok);
  skipRecurring.mockResolvedValue(ok);
});

// --- fetchPending -----------------------------------------------------------

describe('fetchPending()', () => {
  it('starts with an empty, not-loading state', () => {
    const { result } = renderHook(() => usePendingRecurring());
    expect(result.current.pending).toEqual([]);
    expect(result.current.loading).toBe(false);
    expect(result.current.acting).toBe(false);
  });

  it('queries due rules for today (local YYYY-MM-DD) and populates pending', async () => {
    const due = [rule({ id: 'a' }), rule({ id: 'b' })];
    recurringRepository.fetchDue.mockResolvedValue({ ok: true, data: due });
    const { result } = renderHook(() => usePendingRecurring());

    await act(async () => {
      await result.current.fetchPending();
    });

    expect(result.current.pending).toEqual(due);
    const today = recurringRepository.fetchDue.mock.calls[0][0];
    expect(today).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it('leaves pending untouched when the fetch fails', async () => {
    recurringRepository.fetchDue.mockResolvedValue(fail);
    const { result } = renderHook(() => usePendingRecurring());

    await act(async () => {
      await result.current.fetchPending();
    });

    expect(result.current.pending).toEqual([]);
    expect(result.current.loading).toBe(false);
  });
});

// --- approve ----------------------------------------------------------------

describe('approve()', () => {
  async function seed() {
    recurringRepository.fetchDue.mockResolvedValue({
      ok: true,
      data: [rule({ id: 'a' }), rule({ id: 'b' })],
    });
    const hook = renderHook(() => usePendingRecurring());
    await act(async () => {
      await hook.result.current.fetchPending();
    });
    return hook;
  }

  it('drops the approved rule from pending on success', async () => {
    const { result } = await seed();

    await act(async () => {
      await result.current.approve(rule({ id: 'a' }));
    });

    expect(approveRecurring).toHaveBeenCalledWith(expect.objectContaining({ id: 'a' }));
    expect(result.current.pending.map((r) => r.id)).toEqual(['b']);
  });

  it('keeps the rule in pending when approval fails', async () => {
    approveRecurring.mockResolvedValue(fail);
    const { result } = await seed();

    await act(async () => {
      await result.current.approve(rule({ id: 'a' }));
    });

    expect(result.current.pending.map((r) => r.id)).toEqual(['a', 'b']);
  });

  it('returns the service Result to the caller', async () => {
    const { result } = await seed();
    let res: any;
    await act(async () => {
      res = await result.current.approve(rule({ id: 'a' }));
    });
    expect(res).toBe(ok);
  });

  it('clears the acting flag after the action settles', async () => {
    const { result } = await seed();
    await act(async () => {
      await result.current.approve(rule({ id: 'a' }));
    });
    await waitFor(() => expect(result.current.acting).toBe(false));
  });
});

// --- reject -----------------------------------------------------------------

describe('reject()', () => {
  async function seed() {
    recurringRepository.fetchDue.mockResolvedValue({
      ok: true,
      data: [rule({ id: 'a' }), rule({ id: 'b' })],
    });
    const hook = renderHook(() => usePendingRecurring());
    await act(async () => {
      await hook.result.current.fetchPending();
    });
    return hook;
  }

  it('drops the rejected rule from pending on success', async () => {
    const { result } = await seed();

    await act(async () => {
      await result.current.reject(rule({ id: 'b' }));
    });

    expect(skipRecurring).toHaveBeenCalledWith(expect.objectContaining({ id: 'b' }));
    expect(result.current.pending.map((r) => r.id)).toEqual(['a']);
  });

  it('keeps the rule in pending when the skip fails', async () => {
    skipRecurring.mockResolvedValue(fail);
    const { result } = await seed();

    await act(async () => {
      await result.current.reject(rule({ id: 'b' }));
    });

    expect(result.current.pending.map((r) => r.id)).toEqual(['a', 'b']);
  });
});
