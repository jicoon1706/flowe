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

  it('ignores an alert with an amount but no word for money moving', () => {
    // The shape every promo, fee schedule and balance reminder shares.
    expect(
      parseTransactionNotification(raw('com.maybank2u.life', 'Hi there', 'Your RM 250.00 is waiting'))
    ).toBeNull();
  });

  it('ignores marketing that reads like a payment', () => {
    const promos: [string, string][] = [
      ['Fuel deal', 'Enjoy RM10 cashback when you pay with Setel'],
      ['Weekend treat', 'Get up to RM88 when you spend at selected merchants'],
      ['Big savings', 'Save RM30 on your next purchase — 50% off storewide'],
      ['New card', 'Spend and get RM200 credited. Terms apply.'],
    ];
    for (const [title, text] of promos) {
      expect(parseTransactionNotification(raw('com.setel.mobile', title, text))).toBeNull();
    }
  });

  it('ignores reminders about money that has not moved', () => {
    expect(
      parseTransactionNotification(
        raw('com.cimb.octo', 'Card statement', 'Your minimum payment of RM 150.00 is due on 15/09/2026')
      )
    ).toBeNull();
    expect(
      parseTransactionNotification(
        raw('com.maybank2u.life', 'Balance', 'Your available balance is RM 42.10')
      )
    ).toBeNull();
  });

  it('still reads a genuine cashback credit', () => {
    const result = parseTransactionNotification(
      raw('my.com.tngdigital.ewallet', 'Cashback', 'You have received RM 1.50 into your eWallet')
    );
    expect(result).toMatchObject({ amount: 1.5, type: 'income', wallet: true });
  });

  it('reads the last 4 digits from the formats banks use', () => {
    const forms = [
      'RM 10.00 debited from a/c ending 8891',
      'RM 10.00 debited from card ****8891',
      'RM 10.00 debited from account no. 8891',
    ];
    for (const text of forms) {
      expect(parseTransactionNotification(raw('com.maybank2u.life', 'Alert', text))?.accountLast4).toBe('8891');
    }
  });

  it('reports the posting package, so a pinned account can be looked up', () => {
    const result = parseTransactionNotification(
      raw('com.setel.mobile', 'Payment successful', 'You paid RM60.00 at PETRONAS Jalan Ampang')
    );
    expect(result?.packageId).toBe('com.setel.mobile');
  });

  it('is confident about the direction when only one family of words matched', () => {
    const result = parseTransactionNotification(
      raw('com.maybank2u.life', 'Transaction Alert', 'RM 45.90 has been debited from your account at ZUS COFFEE')
    );
    expect(result?.typeConfident).toBe(true);
  });

  it('is not confident when the alert reads as both a debit and a credit', () => {
    // Real wording, and the direction is then a fallback rather than a reading
    // — auto-save refuses these and shows the toggle instead.
    const result = parseTransactionNotification(
      raw('com.maybank2u.life', 'Transaction Alert', 'RM 20.00 debited, payment received by ZUS COFFEE')
    );
    expect(result?.type).toBe('expense');
    expect(result?.typeConfident).toBe(false);
  });
});
