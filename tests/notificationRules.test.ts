import {
  bannerAllowed,
  budgetThresholdsToSend,
  dayBefore,
  flagForType,
  milestoneToSend,
  parseReminderTime,
  previousMonth,
} from '../src/lib/notificationRules';

describe('bannerAllowed (settings.notif_* gating)', () => {
  it('maps every type to its switch', () => {
    expect(flagForType('alert')).toBe('notif_alert');
    expect(flagForType('liability')).toBe('notif_asset');
    expect(flagForType('cashflow')).toBe('notif_cashflow');
    expect(flagForType('note')).toBeNull();
  });

  it('treats unloaded settings and null columns as on', () => {
    expect(bannerAllowed('expense', null)).toBe(true);
    expect(bannerAllowed('expense', { notif_expense: null as unknown as boolean })).toBe(true);
  });

  it('blocks a type whose switch is off', () => {
    expect(bannerAllowed('recurring', { notif_recurring: false })).toBe(false);
    expect(bannerAllowed('expense', { notif_recurring: false })).toBe(true);
  });

  it('blocks affirmations when daily affirmations are off', () => {
    expect(bannerAllowed('affirmation', { notif_affirmation: true, show_affirmations: false })).toBe(false);
  });

  it('never blocks notes and projects', () => {
    expect(bannerAllowed('project', { notif_cashflow: false })).toBe(true);
  });
});

describe('budgetThresholdsToSend (80 % / 100 % of the daily limit)', () => {
  it('sends nothing without a limit', () => {
    expect(budgetThresholdsToSend(500, null, [])).toEqual([]);
    expect(budgetThresholdsToSend(500, 0, [])).toEqual([]);
  });

  it('sends 80 % once spend reaches it', () => {
    expect(budgetThresholdsToSend(79.99, 100, [])).toEqual([]);
    expect(budgetThresholdsToSend(80, 100, [])).toEqual([80]);
  });

  it('does not repeat a threshold already sent today', () => {
    expect(budgetThresholdsToSend(90, 100, [80])).toEqual([]);
    expect(budgetThresholdsToSend(100, 100, [80])).toEqual([100]);
  });

  it('sends both, 100 % first, when one write jumps past both', () => {
    expect(budgetThresholdsToSend(150, 100, [])).toEqual([100, 80]);
  });
});

describe('milestoneToSend (every 20 % toward a Tabung goal)', () => {
  it('waits for the first 20 %', () => {
    expect(milestoneToSend(19, [])).toBeNull();
    expect(milestoneToSend(20, [])).toBe(20);
  });

  it('announces only the highest new step', () => {
    expect(milestoneToSend(65, [20])).toBe(60);
  });

  it('never announces a step again, and never goes backwards after a pay-out', () => {
    expect(milestoneToSend(60, [20, 60])).toBeNull();
    expect(milestoneToSend(40, [20, 60])).toBeNull();
  });

  it('caps at 100 % even past the goal', () => {
    expect(milestoneToSend(130, [80])).toBe(100);
    expect(milestoneToSend(140, [80, 100])).toBeNull();
  });

  it('matches the Tabung example: RM 1,000 in a month on a RM 5,000 goal is a 20 % step each month', () => {
    const sent: number[] = [];
    const announced = [20, 40, 60, 80].map((pct) => {
      const step = milestoneToSend(pct, sent);
      if (step !== null) sent.push(step);
      return step;
    });
    expect(announced).toEqual([20, 40, 60, 80]);
  });
});

describe('date helpers', () => {
  it('previousMonth crosses the year', () => {
    expect(previousMonth('2026-01')).toBe('2025-12');
    expect(previousMonth('2026-11')).toBe('2026-10');
  });

  it('dayBefore crosses month and year ends', () => {
    expect(dayBefore('2026-03-01')).toBe('2026-02-28');
    expect(dayBefore('2027-01-01')).toBe('2026-12-31');
  });

  it('parseReminderTime reads HH:MM and HH:MM:SS, rejects junk', () => {
    expect(parseReminderTime('08:30')).toEqual({ hour: 8, minute: 30 });
    expect(parseReminderTime('21:05:00')).toEqual({ hour: 21, minute: 5 });
    expect(parseReminderTime(null)).toBeNull();
    expect(parseReminderTime('25:00')).toBeNull();
  });
});

describe('recurring push copy (canvas push · android · all 8 types)', () => {
  const { dayBeforePush, dueTodayPush, hrefForNotification } = require('../src/lib/notificationRules');

  it('names the bill, amount, account and date the day before', () => {
    expect(dayBeforePush({ name: 'Netflix', amount: 55, accountName: 'Maybank Savings' }, '2026-11-16')).toEqual({
      title: 'Netflix is due tomorrow',
      body: 'RM 55.00 from Maybank Savings on 16 Nov.',
    });
  });

  it('groups the bills due on one day with their total', () => {
    expect(dueTodayPush([
      { name: 'Netflix', amount: 55 },
      { name: 'Spotify', amount: 14.9 },
      { name: 'Unifi', amount: 140 },
    ])).toEqual({ title: '3 bills due today', body: 'Netflix, Spotify, Unifi · RM 209.90' });
  });

  it('names a single bill due today', () => {
    expect(dueTodayPush([{ name: 'Netflix', amount: 55, accountName: 'Maybank Savings' }])).toEqual({
      title: 'Netflix is due today',
      body: 'RM 55.00 from Maybank Savings.',
    });
  });

  it('opens the same screen as the in-app inbox', () => {
    expect(hrefForNotification('milestone', 't-1')).toBe('/home/tabung/t-1');
    expect(hrefForNotification('alert')).toBe('/settings/budget');
  });
});
