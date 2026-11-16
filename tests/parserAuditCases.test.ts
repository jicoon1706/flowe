import { parseTransactionNotification } from '../src/utils/parseTransactionNotification';

const raw = (text: string) => ({ packageName: 'com.maybank2u.life', title: 'Maybank', text, postedAt: 0 });

// AUDIT #14: "credit card" / "debit card" name a card, not a direction.
describe('card names do not count as direction words', () => {
  it('a credit-card charge is a confident expense', () => {
    expect(parseTransactionNotification(raw('Your credit card ending 1234 was charged RM 50.00 at ZUS COFFEE.')))
      .toMatchObject({ type: 'expense', typeConfident: true, accountLast4: '1234' });
  });

  it('a refund to a debit card is a confident income', () => {
    expect(parseTransactionNotification(raw('RM 12.00 refunded to your debit card ending 9876.')))
      .toMatchObject({ type: 'income', typeConfident: true });
  });

  it('Malay card names too', () => {
    expect(parseTransactionNotification(raw('Kad kredit anda dicaj RM 30.00. Pembayaran di KFC.')))
      .toMatchObject({ type: 'expense', typeConfident: true });
  });

  it('a real credit is still read as income', () => {
    expect(parseTransactionNotification(raw('RM 100.00 has been credited to your account ending 1234.')))
      .toMatchObject({ type: 'income', typeConfident: true });
  });
});

