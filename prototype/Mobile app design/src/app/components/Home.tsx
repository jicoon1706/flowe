import { useState } from 'react';
import { Eye, EyeOff, Bell, Lock } from 'lucide-react';
import { AffirmationCard } from './AffirmationCard';
import { AccountCards } from './AccountCards';
import { RecentTransactions } from './RecentTransactions';
import { AccountDetail, BankAccount } from './home/AccountDetail';
import { TabungDetail, TabungData } from './home/TabungDetail';
import { NewTabung } from './home/NewTabung';
import { Analysis } from './home/Analysis';
import { Learn } from './home/Learn';
import { AccountsPage } from './home/AccountsPage';
import { Notifications } from './Notifications';

type HomeSubPage =
  | 'main'
  | 'account-detail'
  | 'tabung-detail'
  | 'new-tabung'
  | 'analysis'
  | 'learn'
  | 'accounts'
  | 'notifications';

interface HomeProps {
  onAddTransaction: () => void;
  onGoToCalendar: () => void;
}

export function Home({ onAddTransaction, onGoToCalendar }: HomeProps) {
  const [subPage, setSubPage] = useState<HomeSubPage>('main');
  const [selectedAccount, setSelectedAccount] = useState<BankAccount | null>(null);
  const [selectedTabung, setSelectedTabung] = useState<TabungData | null>(null);
  const [balanceVisible, setBalanceVisible] = useState(true);

  const userName = 'Ahmad';
  const totalBalance = 4250.00;

  const goBack = () => setSubPage('main');

  const handleSelectAccount = (account: BankAccount) => {
    setSelectedAccount(account);
    setSubPage('account-detail');
  };

  const handleSelectTabung = (tabung: TabungData) => {
    setSelectedTabung(tabung);
    setSubPage('tabung-detail');
  };

  if (subPage === 'account-detail' && selectedAccount) {
    return (
      <AccountDetail
        account={selectedAccount}
        onBack={goBack}
        onAddTransaction={onAddTransaction}
      />
    );
  }

  if (subPage === 'tabung-detail' && selectedTabung) {
    return <TabungDetail tabung={selectedTabung} onBack={goBack} />;
  }

  if (subPage === 'new-tabung') {
    return <NewTabung onBack={goBack} />;
  }

  if (subPage === 'analysis') {
    return <Analysis onBack={goBack} />;
  }

  if (subPage === 'learn') {
    return <Learn onBack={goBack} />;
  }

  if (subPage === 'notifications') {
    return <Notifications onBack={goBack} />;
  }

  if (subPage === 'accounts') {
    return (
      <AccountsPage
        onBack={goBack}
        onSelectAccount={handleSelectAccount}
        onSelectTabung={handleSelectTabung}
        onNewTabung={() => setSubPage('new-tabung')}
      />
    );
  }

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const shortcutButtons = [
    { icon: '📊', label: 'Analysis', action: () => setSubPage('analysis') },
    { icon: '📚', label: 'Learn', action: () => setSubPage('learn') },
    { icon: '🐷', label: 'New Tabung', action: () => setSubPage('new-tabung') },
    { icon: '🏦', label: 'Accounts', action: () => setSubPage('accounts') },
  ];

  return (
    <div className="min-h-screen p-4 pb-6">
      {/* Top Bar */}
      <div className="flex justify-between items-center mb-6">
        <div className="flex items-center gap-2">
          <h1 className="text-xl">{getGreeting()}, {userName}</h1>
          <span className="text-2xl">👋</span>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setSubPage('notifications')}
            className="relative p-2 hover:bg-muted rounded-full transition-colors"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2.5 h-2.5 bg-primary rounded-full border-2 border-background" />
          </button>
          <button className="p-2 hover:bg-muted rounded-full transition-colors">
            <Lock className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Daily Affirmation Card */}
      <AffirmationCard />

      {/* Balance Banner */}
      <div className="bg-gradient-to-br from-card via-card to-secondary rounded-2xl p-6 mb-6 shadow-lg">
        <div className="flex items-center justify-between mb-2">
          <p className="text-muted-foreground text-sm">Total Balance</p>
          <button
            onClick={() => setBalanceVisible(!balanceVisible)}
            className="p-1 hover:bg-muted/50 rounded-full transition-colors"
          >
            {balanceVisible ? <Eye className="w-5 h-5" /> : <EyeOff className="w-5 h-5" />}
          </button>
        </div>
        <p className="text-4xl font-bold">
          RM {balanceVisible ? totalBalance.toFixed(2) : '••••••'}
        </p>
      </div>

      {/* Account Cards */}
      <AccountCards
        onSelectAccount={handleSelectAccount}
        onSelectTabung={handleSelectTabung}
      />

      {/* Shortcut Buttons */}
      <div className="grid grid-cols-4 gap-3 mb-6">
        {shortcutButtons.map((btn) => (
          <button
            key={btn.label}
            onClick={btn.action}
            className="flex flex-col items-center gap-2 p-4 bg-card rounded-xl hover:bg-muted/50 active:scale-95 transition-all"
          >
            <div className="text-2xl">{btn.icon}</div>
            <span className="text-xs">{btn.label}</span>
          </button>
        ))}
      </div>

      {/* Recent Transactions */}
      <RecentTransactions onSeeAll={onGoToCalendar} />
    </div>
  );
}
