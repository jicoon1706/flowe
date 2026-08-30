import { parseTransactionNotification } from '../src/utils/parseTransactionNotification';

const at = Date.UTC(2026, 7, 30, 4, 15);

function raw(packageName: string, title: string, text: string) {
  return { packageName, title, text, postedAt: at };
}

describe('parseTransactionNotification', () => {
  it('reads a Maybank debit alert', () => {
    const result = parseTransactionNotification(
      raw('com.maybank2u.life', 'Transaction Alert', 'RM 45.90 has been debited from your account ending 1234 at ZUS COFFEE on 30/08/2026')
    );
    expect(result).toMatchObject({
      amount: 45.9,
      type: 'expense',
      accountLast4: '1234',
      bankId: 'maybank',
      wallet: false,
      postedAt: at,
    });
    expect(result?.merchant).toBe('ZUS COFFEE');
  });

  it('reads a Setel fuel payment as a wallet expense', () => {
    const result = parseTransactionNotification(
      raw('com.setel.mobile', 'Payment successful', 'You paid RM60.00 at PETRONAS Jalan Ampang')
    );
    expect(result).toMatchObject({ amount: 60, type: 'expense', wallet: true });
    expect(result?.bankId).toBeUndefined();
  });

  it('treats a credit alert as income', () => {
    const result = parseTransactionNotification(
      raw('com.cimb.octo', 'Credit Alert', 'MYR 3,200.00 has been credited to your account')
    );
    expect(result).toMatchObject({ amount: 3200, type: 'income', bankId: 'cimb' });
  });

  it('parses thousands separators and trailing currency', () => {
    expect(
      parseTransactionNotification(raw('com.cimb.octo', 'Alert', '1,250.75 MYR was debited'))
    ).toMatchObject({ amount: 1250.75, type: 'expense' });
  });

  it('ignores OTP and promotional notifications', () => {
    expect(
      parseTransactionNotification(raw('com.maybank2u.life', 'Your OTP', 'RM 100.00 transfer. OTP is 483920. Do not share.'))
    ).toBeNull();
    expect(
      parseTransactionNotification(raw('com.setel.mobile', 'Promo!', 'Get RM5.00 off your next fill-up'))
    ).toBeNull();
  });

  it('ignores notifications with no amount', () => {
    expect(
      parseTransactionNotification(raw('com.setel.mobile', 'Welcome', 'Your account is ready'))
    ).toBeNull();
  });

  it('ignores apps that are not a known source', () => {
    expect(
      parseTransactionNotification(raw('com.whatsapp', 'Alice', 'send me RM50.00 please'))
    ).toBeNull();
  });

  it('prefers debit when the wording is ambiguous', () => {
    // "payment received" reads as credit, but "debited" is decisive.
    const result = parseTransactionNotification(
      raw('com.maybank2u.life', 'Alert', 'RM 20.00 debited — payment received by merchant')
    );
    expect(result?.type).toBe('expense');
  });
});
