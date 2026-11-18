// AUDIT-2026-11 B1: a rule whose pending occurrence is past its end date must
// not be offered for approval any more.

let mockRows: any[] = [];
jest.mock('../src/lib/supabase', () => ({
  supabase: {
    from: () => {
      const builder: any = {
        select: () => builder,
        eq: () => builder,
        lte: async () => ({ data: mockRows, error: null }),
      };
      return builder;
    },
  },
}));

import { isWithinEndDate, recurringRepository } from '../src/repositories/recurring.repository';

const rule = (over: Record<string, unknown>) => ({ start_date: '2026-01-15', next_date: '2026-11-15', end_date: null, ...over }) as any;

describe('isWithinEndDate()', () => {
  it('keeps a rule with no end date', () => {
    expect(isWithinEndDate(rule({}))).toBe(true);
  });

  it('keeps the last occurrence on the end date itself', () => {
    expect(isWithinEndDate(rule({ next_date: '2026-11-15', end_date: '2026-11-15' }))).toBe(true);
  });

  it('drops an occurrence after the end date', () => {
    expect(isWithinEndDate(rule({ next_date: '2026-12-15', end_date: '2026-11-30' }))).toBe(false);
  });

  it('uses start_date before the first run', () => {
    expect(isWithinEndDate(rule({ next_date: null, start_date: '2026-12-01', end_date: '2026-11-30' }))).toBe(false);
  });
});

test('fetchDue leaves out rules that have ended', async () => {
  mockRows = [
    rule({ id: 'open', end_date: null }),
    rule({ id: 'last', next_date: '2026-11-15', end_date: '2026-11-15' }),
    rule({ id: 'ended', next_date: '2026-11-15', end_date: '2026-10-31' }),
  ];
  const res = await recurringRepository.fetchDue('2026-11-18');
  expect(res.ok).toBe(true);
  expect(res.ok && res.data.map((r) => r.id)).toEqual(['open', 'last']);
});
