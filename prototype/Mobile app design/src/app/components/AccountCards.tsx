import { BankAccount } from './home/AccountDetail';
import { TabungData } from './home/TabungDetail';

const ACCOUNTS_DATA = [
  { id: 'maybank', type: 'bank' as const, name: 'Maybank', balance: 2850.00, icon: '🏦', accountNumber: '1122 3344 5566', color: '#ffd93d' },
  { id: 'raya', type: 'tabung' as const, name: 'Tabung Raya', saved: 300, target: 500, daysLeft: 12, icon: '🌙' },
  { id: 'cimb', type: 'bank' as const, name: 'CIMB', balance: 1200.00, icon: '🏦', accountNumber: '9988 7766 5544', color: '#ff6b6b' },
  { id: 'wallet', type: 'wallet' as const, name: 'Cash Wallet', balance: 200.00, icon: '👛', color: '#6bcf7f' },
];

interface Props {
  onSelectAccount: (account: BankAccount) => void;
  onSelectTabung: (tabung: TabungData) => void;
}

export function AccountCards({ onSelectAccount, onSelectTabung }: Props) {
  return (
    <div className="mb-6">
      <h3 className="text-sm font-medium mb-3 text-muted-foreground">Accounts</h3>
      <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-hide">
        {ACCOUNTS_DATA.map((account) => (
          <button
            key={account.id}
            onClick={() => {
              if (account.type === 'tabung') {
                onSelectTabung(account as unknown as TabungData);
              } else {
                onSelectAccount(account as BankAccount);
              }
            }}
            className="min-w-[200px] bg-card rounded-2xl p-4 border border-border hover:border-primary/50 active:bg-muted transition-all text-left"
          >
            <div className="flex items-center gap-2 mb-3">
              <span className="text-2xl">{account.icon}</span>
              <span className="text-sm font-medium">{account.name}</span>
            </div>

            {account.type === 'tabung' ? (
              (() => {
                const t = account as typeof ACCOUNTS_DATA[1];
                const pct = Math.round((t.saved / t.target) * 100);
                return (
                  <>
                    <div className="mb-2">
                      <div className="flex justify-between text-xs mb-1">
                        <span className="text-muted-foreground">Progress</span>
                        <span className="text-primary font-medium">{pct}%</span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div className="h-full bg-primary transition-all" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <div className="flex justify-between items-end">
                      <div>
                        <p className="text-xs text-muted-foreground">Saved</p>
                        <p className="text-lg font-bold">RM {t.saved}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-muted-foreground">Target</p>
                        <p className="text-sm">RM {t.target}</p>
                      </div>
                    </div>
                    <p className="text-xs text-primary mt-2">{t.daysLeft} days left</p>
                  </>
                );
              })()
            ) : (
              (() => {
                const a = account as BankAccount;
                return (
                  <div>
                    <p className="text-xs text-muted-foreground mb-1">Balance</p>
                    <p className="text-2xl font-bold">RM {a.balance.toFixed(2)}</p>
                  </div>
                );
              })()
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
