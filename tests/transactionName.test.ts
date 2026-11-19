import { TX_NAME_MAX, clampTxName, resolveTxName } from '../src/lib/transactionName';

describe('transaction name', () => {
  it('uses the typed name, trimmed', () => {
    expect(resolveTxName('  Nasi lemak  ', 'Food & Drink')).toBe('Nasi lemak');
  });

  it('falls back when empty or only spaces', () => {
    expect(resolveTxName('', 'Food & Drink')).toBe('Food & Drink');
    expect(resolveTxName('   ', 'Transfer to Maybank')).toBe('Transfer to Maybank');
  });

  it('caps at 60 characters', () => {
    const long = 'a'.repeat(80);
    expect(clampTxName(long)).toHaveLength(TX_NAME_MAX);
    expect(resolveTxName(long, 'x')).toHaveLength(TX_NAME_MAX);
    expect(clampTxName('Makan')).toBe('Makan');
  });
});
