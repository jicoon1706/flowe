// Edit Tabung · form values, validation, dirty check (the SQL side is covered
// by flowe-akmal/supabase/tests/tabung_edit.test.sql).
import {
  fieldOfServerError,
  followTargetDate,
  discardCopy,
  isTabungEditDirty,
  monthLabel,
  progressPct,
  savedTowardGoal,
  tabungEditValues,
  validateTabungEdit,
  type TabungEditValues,
} from '../src/lib/tabungEdit';

const base: TabungEditValues = {
  goalType: 'home',
  name: 'Tabung Rumah',
  target: 5000,
  monthlyTopup: 1000,
  fromDate: '2026-03-01',
  toDate: '2026-07-31',
  coverPath: null,
};

describe('validateTabungEdit', () => {
  it('accepts the d-tabung-edit values', () => {
    expect(validateTabungEdit(base, 4000)).toEqual({});
  });

  it('blocks a target below what is saved, with the frame copy', () => {
    expect(validateTabungEdit({ ...base, target: 3000 }, 4000)).toEqual({
      target: "Can't be lower than RM 4,000.00 saved so far",
    });
  });

  it('allows a target equal to what is saved', () => {
    expect(validateTabungEdit({ ...base, target: 4000 }, 4000)).toEqual({});
  });

  it('needs a name, a goal type, a target and a monthly top-up above 0', () => {
    const errors = validateTabungEdit({ ...base, name: '  ', goalType: null, target: null, monthlyTopup: 0 }, 0);
    expect(errors).toEqual({
      name: 'Give your Tabung a name',
      goalType: 'Choose a goal type',
      target: 'Enter a target above RM 0.00',
      monthlyTopup: 'Enter a monthly top-up above RM 0.00',
    });
  });

  it('caps the name at 40 characters', () => {
    expect(validateTabungEdit({ ...base, name: 'x'.repeat(41) }, 0).name).toBe('Keep the name to 40 characters');
  });

  it('rejects a target date before the start date', () => {
    expect(validateTabungEdit({ ...base, toDate: '2026-02-28' }, 0).dates).toBe("Target date can't be before the start date");
  });
});

describe('savedTowardGoal', () => {
  it('uses Σ top-ups by default and the balance in balance mode', () => {
    expect(savedTowardGoal('contributed', 4000, 2000)).toBe(4000);
    expect(savedTowardGoal('balance', 4000, 2000)).toBe(2000);
    expect(savedTowardGoal('balance', 4000, -5)).toBe(0);
  });
});

describe('followTargetDate', () => {
  it('ends the month the goal is reached: 5,000 ÷ 1,000 from March → July', () => {
    expect(followTargetDate(base)).toBe('2026-07-31');
  });

  it('keeps the stored date while target or monthly is missing', () => {
    expect(followTargetDate({ ...base, monthlyTopup: null, toDate: '2026-12-31' })).toBe('2026-12-31');
  });
});

describe('tabungEditValues', () => {
  it('maps the rows and falls back to Custom for an unknown goal type', () => {
    const v = tabungEditValues({
      name: 'Trip', template_type: 'boat', target_amount: 1200.005, monthly_topup: null,
      from_date: '2026-01-01', to_date: '2026-12-31', cover_path: null,
    });
    expect(v).toEqual({
      goalType: 'custom', name: 'Trip', target: 1200.01, monthlyTopup: null,
      fromDate: '2026-01-01', toDate: '2026-12-31', coverPath: null,
    });
  });
});

describe('isTabungEditDirty', () => {
  it('ignores surrounding spaces in the name, notices every other change', () => {
    expect(isTabungEditDirty(base, { ...base, name: ' Tabung Rumah ' })).toBe(false);
    expect(isTabungEditDirty(base, { ...base, target: 3000 })).toBe(true);
    expect(isTabungEditDirty(base, { ...base, coverPath: 'u/c.jpg' })).toBe(true);
  });
});

describe('fieldOfServerError', () => {
  it('maps update_tabung messages to their field', () => {
    expect(fieldOfServerError("Can't be lower than RM 4,000.00 saved so far")).toBe('target');
    expect(fieldOfServerError('Enter a target above RM 0.00')).toBe('target');
    expect(fieldOfServerError('Give your Tabung a name')).toBe('name');
    expect(fieldOfServerError('Enter a monthly top-up above RM 0.00')).toBe('monthlyTopup');
    expect(fieldOfServerError("Target date can't be before the start date")).toBe('dates');
    expect(fieldOfServerError('Choose a goal type')).toBe('goalType');
    expect(fieldOfServerError('network down')).toBeNull();
  });
});

describe('discardCopy', () => {
  it('names the new target and date (d-tabung-edit-discard)', () => {
    expect(discardCopy(base, { ...base, target: 8000, toDate: '2026-10-31' }))
      .toBe('Your new target of RM 8,000.00 and target date of Oct 2026 won’t be saved. Tabung Rumah stays at RM 5,000.00.');
  });

  it('leaves the date out when it did not move, and falls back for other edits', () => {
    expect(discardCopy(base, { ...base, target: 5500 })).toBe('Your new target of RM 5,500.00 won’t be saved. Tabung Rumah stays at RM 5,000.00.');
    expect(discardCopy(base, { ...base, name: 'Rumah' })).toBe('Your changes to Tabung Rumah won’t be saved.');
  });
});

describe('progressPct and monthLabel', () => {
  it('match the dirty preview: 80% → 50%', () => {
    expect(progressPct(4000, 5000)).toBe(80);
    expect(progressPct(4000, 8000)).toBe(50);
    expect(progressPct(4000, null)).toBe(0);
    expect(monthLabel('2026-10-31')).toBe('Oct 2026');
  });
});
