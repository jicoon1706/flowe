import { mostUsedFunding, monthsLeft, onTrackMonthly, tabungProgress, usualAmount, type TabungFlow } from '../src/lib/tabungProgress';

/** RM 1,000 in and RM 500 out every month for four months. */
function fourMonths(): TabungFlow[] {
  const flows: TabungFlow[] = [];
  for (const m of ['2026-07', '2026-08', '2026-09', '2026-10']) {
    flows.push({ type: 'tabung_topup', amount: 1000, date: `${m}-01` });
    flows.push({ type: 'tabung_withdraw', amount: 500, date: `${m}-20` });
  }
  return flows;
}

describe('tabungProgress — contributed rule', () => {
  it('RM 1,000 in / RM 500 out per month gives 80% after 4 months with balance RM 2,000', () => {
    const p = tabungProgress({ target: 5000, fromDate: '2026-07-01', balance: 2000, flows: fourMonths() });
    expect(p.contributed).toBe(4000);
    expect(p.paidOut).toBe(2000);
    expect(p.balance).toBe(2000);
    expect(p.percent).toBe(80);
    expect(p.progress).toBeCloseTo(0.8);
    expect(p.reached).toBe(false);
    expect(p.remaining).toBe(1000);
  });

  it('never goes down when money is paid out', () => {
    const before = tabungProgress({ target: 5000, fromDate: '2026-07-01', balance: 1000, flows: fourMonths().slice(0, 1) });
    const after = tabungProgress({ target: 5000, fromDate: '2026-07-01', balance: 500, flows: fourMonths().slice(0, 2) });
    expect(after.progress).toBeGreaterThanOrEqual(before.progress);
  });

  it('ignores flows before from_date', () => {
    const p = tabungProgress({ target: 1000, fromDate: '2026-09-01', balance: 0, flows: fourMonths() });
    expect(p.contributed).toBe(2000);
    expect(p.months.map((m) => m.month)).toEqual(['2026-09', '2026-10']);
  });

  it('builds a month strip whose "toward goal" only climbs', () => {
    const p = tabungProgress({ target: 5000, fromDate: '2026-07-01', balance: 2000, flows: fourMonths() });
    expect(p.months.map((m) => m.towardGoal)).toEqual([1000, 2000, 3000, 4000]);
    expect(p.months.every((m) => m.paidOut === 500 && m.toppedUp === 1000)).toBe(true);
  });

  it('reaches the goal at 100% while the balance is lower (goal reached state)', () => {
    const flows: TabungFlow[] = [...fourMonths(), { type: 'tabung_topup', amount: 1000, date: '2026-11-01' }];
    const p = tabungProgress({ target: 5000, fromDate: '2026-07-01', balance: 2500, flows });
    expect(p.reached).toBe(true);
    expect(p.percent).toBe(100);
    expect(p.progress).toBe(1);
    expect(p.balance).toBe(2500);
  });

  it('caps the ring at 1 but reports the real percent above 100', () => {
    const p = tabungProgress({ target: 1000, fromDate: '2026-07-01', balance: 0, flows: fourMonths() });
    expect(p.progress).toBe(1);
    expect(p.percent).toBe(400);
  });

  it('has no progress without a target', () => {
    const p = tabungProgress({ target: 0, fromDate: '2026-07-01', balance: 2000, flows: fourMonths() });
    expect(p.progress).toBe(0);
    expect(p.reached).toBe(false);
  });
});

describe('tabungProgress — balance mode', () => {
  it('uses saved_amount ÷ target', () => {
    const p = tabungProgress({ target: 5000, fromDate: '2026-07-01', balance: 2000, mode: 'balance', flows: fourMonths() });
    expect(p.percent).toBe(40);
    expect(p.contributed).toBe(4000);
  });
});

describe('tabung helpers', () => {
  it('counts months left inclusive of this month', () => {
    expect(monthsLeft('2027-12-31', new Date(2026, 10, 17))).toBe(14);
    expect(monthsLeft('2026-01-01', new Date(2026, 10, 17))).toBe(1);
  });

  it('spreads the remaining amount over the months left', () => {
    expect(onTrackMonthly(1400, '2027-12-31', new Date(2026, 10, 17))).toBe(100);
    expect(onTrackMonthly(0, '2027-12-31')).toBe(0);
  });

  it('finds the usual amount', () => {
    expect(usualAmount(fourMonths(), 'tabung_topup')).toBe(1000);
    expect(usualAmount(fourMonths(), 'tabung_withdraw')).toBe(500);
    expect(usualAmount([], 'tabung_topup')).toBeNull();
  });

  it('finds the account that funded a Tabung most', () => {
    expect(mostUsedFunding([
      { type: 'tabung_topup', from_account_id: 'a' },
      { type: 'tabung_topup', from_account_id: 'b' },
      { type: 'tabung_topup', from_account_id: 'b' },
      { type: 'tabung_withdraw', from_account_id: 'a' },
    ])).toBe('b');
  });
});
