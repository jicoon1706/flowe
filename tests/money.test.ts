import { MINUS, amountProblem, directionOf, formatRM, formatRMCompact, parseAmount, roundCents, splitMoney } from '../src/lib/money';
import { applyAmountKey } from '../components/ui/Numpad';
import { addFormError } from '../src/lib/addTransactionValidation';

describe('money formatter', () => {
  it('splits integer and cents with thousands separators', () => {
    expect(splitMoney(12680.42)).toEqual({ sign: '', integer: '12,680', cents: '.42' });
    expect(splitMoney(0)).toEqual({ sign: '', integer: '0', cents: '.00' });
    expect(splitMoney(1234567.5)).toEqual({ sign: '', integer: '1,234,567', cents: '.50' });
  });

  it('signs by direction, never by colour', () => {
    expect(formatRM(12.5, 'expense')).toBe(`${MINUS}RM 12.50`);
    expect(formatRM(3200, 'income')).toBe('+RM 3,200.00');
    expect(formatRM(-20.5)).toBe(`${MINUS}RM 20.50`);
    expect(formatRM(20.5)).toBe('RM 20.50');
  });

  it('rounds to whole cents without float drift', () => {
    expect(roundCents(1.005)).toBe(1.01);
    expect(roundCents(0.1 + 0.2)).toBe(0.3);
    expect(splitMoney(162.399999).cents).toBe('.40');
  });

  it('formats compact amounts', () => {
    expect(formatRMCompact(1250)).toBe('RM 1.3k');
    expect(formatRMCompact(950)).toBe('RM 950');
    expect(formatRMCompact(2_000_000)).toBe('RM 2m');
  });

  it('maps transaction types to a direction', () => {
    expect(directionOf('expense')).toBe('expense');
    expect(directionOf('income')).toBe('income');
    expect(directionOf('transfer')).toBe('none');
  });

  it('parses typed amounts', () => {
    expect(parseAmount('12.5')).toBe(12.5);
    expect(parseAmount('1,250.50')).toBe(1250.5);
    expect(parseAmount('')).toBeNull();
    expect(parseAmount('.')).toBeNull();
    expect(parseAmount('1.234')).toBeNull();
  });

  it('flags zero and too-large amounts', () => {
    expect(amountProblem(0)).toBe('zero');
    expect(amountProblem(null)).toBe('zero');
    expect(amountProblem(1_000_000)).toBe('too-large');
    expect(amountProblem(999_999.99)).toBeNull();
  });
});

describe('numpad amount entry', () => {
  it('keeps two decimals and one point', () => {
    let v = '';
    for (const k of ['1', '2', '.', '5', '0', '9'] as const) v = applyAmountKey(v, k);
    expect(v).toBe('12.50');
    expect(applyAmountKey('12.5', '.')).toBe('12.5');
    expect(applyAmountKey('', '.')).toBe('0.');
    expect(applyAmountKey('0', '7')).toBe('7');
    expect(applyAmountKey('12', 'del')).toBe('1');
  });
});

describe('add-transaction validation (section K)', () => {
  const base = { kind: 'expense' as const, amount: 12.5, accountId: 'a', toId: null };
  it('passes a complete expense', () => expect(addFormError(base)).toBeNull());
  it('asks for an amount first', () => expect(addFormError({ ...base, amount: 0 })?.saveLabel).toBe('Enter an amount'));
  it('asks for an account', () => expect(addFormError({ ...base, accountId: null })?.message).toBe('Add an account first, then save.'));
  it('needs a transfer destination', () => expect(addFormError({ ...base, kind: 'transfer' })?.field).toBe('to'));
  it('rejects the same account', () => expect(addFormError({ ...base, kind: 'transfer', toId: 'a' })?.message).toBe('Pick two different accounts.'));
  it('checks the balance and hides it while locked', () => {
    expect(addFormError({ ...base, amount: 50, available: 20, sourceName: 'Maybank' })?.message).toBe('Maybank has RM 20.00 available.');
    expect(addFormError({ ...base, amount: 50, available: 20, sourceName: 'Maybank', locked: true })?.message).toBe("Maybank doesn't have enough for this.");
  });
});
