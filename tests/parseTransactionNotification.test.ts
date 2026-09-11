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

  it('reads an alert that names no verb, only an amount and a merchant', () => {
    // The wording some banks actually use — nothing says "debited" or "paid".
    const result = parseTransactionNotification(
      raw('com.hlb.connect', 'Transaction Alert', 'RM 20.00 at ZUS COFFEE on 30/08/2026')
    );
    expect(result).toMatchObject({ amount: 20, type: 'expense', typeConfident: false });
    expect(result?.merchant).toBe('ZUS COFFEE');
  });

  it('reads a DuitNow / "successful" alert without a direction word', () => {
    const result = parseTransactionNotification(
      raw('com.maybank2u.life', 'DuitNow QR', 'DuitNow QR RM 15.00 to KEDAI RUNCIT ALI successful')
    );
    expect(result).toMatchObject({ amount: 15, type: 'expense', typeConfident: false });
  });

  it('is not fooled by the balance printed after the movement', () => {
    // Balance last — the common trailer.
    expect(
      parseTransactionNotification(
        raw('com.maybank2u.life', 'Transaction Alert', 'RM 45.90 debited from a/c ending 1234 at ZUS COFFEE. Available balance: RM 1,234.56')
      )
    ).toMatchObject({ amount: 45.9, type: 'expense', typeConfident: true });
    // Balance first — the amount read must still be the movement.
    expect(
      parseTransactionNotification(
        raw('com.cimb.octo', 'Alert', 'Avail Bal RM 950.00 after RM 50.00 debited at 99 SPEEDMART')
      )
    ).toMatchObject({ amount: 50, type: 'expense' });
    expect(
      parseTransactionNotification(
        raw('my.com.tngdigital.ewallet', 'Payment', 'You paid RM 12.00 at SHELL. RM 88.00 left in your eWallet')
      )
    ).toMatchObject({ amount: 12, type: 'expense' });
  });

  it('still ignores an alert that names nothing but a balance', () => {
    expect(
      parseTransactionNotification(raw('com.maybank2u.life', 'Balance', 'Your available balance is RM 42.10'))
    ).toBeNull();
    expect(
      parseTransactionNotification(raw('com.cimb.octo', 'Card', 'Outstanding balance: RM 1,500.00'))
    ).toBeNull();
  });

  it('does not mistake a merchant name for a security code', () => {
    const result = parseTransactionNotification(
      raw('com.grabtaxi.passenger', 'Payment successful', 'You paid RM88.00 at HOTPOT HOUSE')
    );
    expect(result).toMatchObject({ amount: 88, type: 'expense' });
    expect(
      parseTransactionNotification(raw('com.maybank2u.life', 'OTP', 'Your OTP for RM 100.00 transfer is 483920'))
    ).toBeNull();
  });

  it('keeps a debit alert that mentions reward points', () => {
    expect(
      parseTransactionNotification(
        raw('com.cimb.octo', 'Card Alert', 'RM 120.00 charged to card ****4321 at LOTUS. You earned 12 reward points')
      )
    ).toMatchObject({ amount: 120, type: 'expense', accountLast4: '4321' });
  });

  it('takes the user at their word when they answered from the shade', () => {
    const odd = { ...raw('com.maybank2u.life', 'Hi there', 'Your RM 250.00 is waiting'), confirmed: true };
    expect(parseTransactionNotification(odd)).toMatchObject({ amount: 250, type: 'expense' });
    // Even then, there has to be an amount to file.
    expect(
      parseTransactionNotification({ ...raw('com.setel.mobile', 'Welcome', 'Your account is ready'), confirmed: true })
    ).toBeNull();
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
