// Edit Tabung on a Tabung saved without a monthly top-up (AUDIT-2026-11-22 T1, T2).
//
// T1: every Tabung saved before migration 20261124 (and any created without a
// monthly amount) has tabung_accounts.monthly_topup = null. The form loads it as
// an empty field, the "monthly top-up > 0" rule fails, Save stays disabled, and
// the screen only drew errors for fields the user changed, so nothing said why.
// T2: Undo on the saved toast runs after Edit Tabung has gone back; the Tabung
// screen behind it must hear about the write and re-read.
const mockRpc = jest.fn(async (..._args: unknown[]) => ({ data: null as unknown, error: null as unknown }));
jest.mock('../src/lib/supabase', () => ({ supabase: { rpc: (...args: unknown[]) => mockRpc(...args) } }));

import {
  tabungEditValues,
  undoValues,
  validateTabungEdit,
  visibleEditErrors,
  type TabungEditValues,
} from '../src/lib/tabungEdit';
import { accountsRepository, onTabungChanged } from '../src/repositories/accounts.repository';

// A row as stored before migration 20261124: no monthly top-up, no cover.
const legacyRow = {
  name: 'Tabung Raya',
  template_type: 'raya',
  target_amount: 3000,
  monthly_topup: null,
  from_date: '2026-01-01',
  to_date: '2026-12-31',
  cover_path: null,
};

describe('Edit Tabung · Tabung with no monthly top-up stored (T1)', () => {
  const initial = tabungEditValues(legacyRow);
  const renamed: TabungEditValues = { ...initial, name: 'Tabung Raya 2027' };

  it('loads the missing monthly top-up as an empty field that blocks Save', () => {
    expect(initial.monthlyTopup).toBeNull();
    expect(validateTabungEdit(renamed, 0).monthlyTopup).toBe('Enter a monthly top-up above RM 0.00');
  });

  it('says why Save is blocked, although the user only changed the name', () => {
    const shown = visibleEditErrors(initial, renamed, 0);
    expect(shown.monthlyTopup).toBe('Enter a monthly top-up above RM 0.00');
    expect(shown.name).toBeUndefined();
  });

  it('every rule that blocks Save is on screen', () => {
    const noTarget = tabungEditValues({ ...legacyRow, target_amount: 0 });
    const v = { ...noTarget, name: 'X' };
    expect(Object.keys(visibleEditErrors(noTarget, v, 0)).sort()).toEqual(Object.keys(validateTabungEdit(v, 0)).sort());
  });

  it('clears once a monthly top-up is entered, and the save sends it', async () => {
    const fixed: TabungEditValues = { ...renamed, monthlyTopup: 250 };
    expect(visibleEditErrors(initial, fixed, 0)).toEqual({});
    const res = await accountsRepository.updateTabung({
      accountId: 'tab-1',
      goalType: fixed.goalType ?? 'custom',
      name: fixed.name,
      target: fixed.target ?? 0,
      monthlyTopup: fixed.monthlyTopup ?? 0,
      fromDate: fixed.fromDate,
      toDate: fixed.toDate,
      coverPath: fixed.coverPath,
    });
    expect(res.ok).toBe(true);
    expect(mockRpc).toHaveBeenCalledWith('update_tabung', expect.objectContaining({
      p_account_id: 'tab-1', p_name: 'Tabung Raya 2027', p_monthly_topup: 250, p_target: 3000,
    }));
  });

  it('untouched valid fields still show nothing (no error on open for a complete Tabung)', () => {
    const complete = tabungEditValues({ ...legacyRow, monthly_topup: 250 });
    expect(visibleEditErrors(complete, complete, 0)).toEqual({});
  });

  it('keeps server errors', () => {
    const complete = tabungEditValues({ ...legacyRow, monthly_topup: 250 });
    expect(visibleEditErrors(complete, complete, 0, { target: 'Can’t be lower than RM 10.00 saved so far' }).target).toMatch(/saved so far/);
  });
});

describe('Edit Tabung · the Tabung screen hears a save or Undo (T2)', () => {
  const req = { accountId: 'tab-1', goalType: 'raya' as const, name: 'A', target: 10, monthlyTopup: 1, fromDate: '2026-01-01', toDate: '2026-12-31', coverPath: null };

  it('notifies listeners after a successful write', async () => {
    const heard = jest.fn();
    const stop = onTabungChanged(heard);
    mockRpc.mockResolvedValueOnce({ data: null, error: null });
    await accountsRepository.updateTabung(req);
    expect(heard).toHaveBeenCalledWith('tab-1');
    stop();
  });

  it('stays quiet when the write fails', async () => {
    const heard = jest.fn();
    const stop = onTabungChanged(heard);
    mockRpc.mockResolvedValueOnce({ data: null, error: { code: '23514', message: 'Enter a monthly top-up above RM 0.00' } });
    const res = await accountsRepository.updateTabung(req);
    expect(res.ok).toBe(false);
    expect(heard).not.toHaveBeenCalled();
    stop();
  });
});

describe('Edit Tabung · Undo on a Tabung that had no monthly top-up (T3)', () => {
  const previous = tabungEditValues(legacyRow);
  const written: TabungEditValues = { ...previous, name: 'Raya 2027', monthlyTopup: 250 };

  it('restores the name but keeps a monthly top-up the server will accept', () => {
    const back = undoValues(previous, written);
    expect(back.name).toBe('Tabung Raya');
    expect(back.monthlyTopup).toBe(250);
    expect(validateTabungEdit(back, 0)).toEqual({});
  });

  it('restores every field when the old values were valid', () => {
    const full = { ...previous, monthlyTopup: 100 };
    expect(undoValues(full, { ...full, target: 9000, monthlyTopup: 300 })).toEqual(full);
  });

  it('keeps the new target when the old one was 0', () => {
    const noTarget = tabungEditValues({ ...legacyRow, target_amount: 0, monthly_topup: 100 });
    expect(undoValues(noTarget, { ...noTarget, target: 4000 }).target).toBe(4000);
  });
});
