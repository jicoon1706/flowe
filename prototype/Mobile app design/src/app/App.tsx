import { useState } from 'react';
import { Home } from './components/Home';
import { CashFlow } from './components/CashFlow';
import { Calendar } from './components/Calendar';
import { Settings } from './components/Settings';
import { BottomNav } from './components/BottomNav';
import { AddTransaction } from './components/AddTransaction';
import { AuthSetup } from './components/AuthSetup';
import { Onboarding, type OnboardingData } from './components/Onboarding';

type Page = 'home' | 'calendar' | 'cashflow' | 'settings';
type AppStage = 'auth' | 'onboarding' | 'app';

function getInitialStage(): AppStage {
  try {
    if (!localStorage.getItem('mywallet_pin')) return 'auth';
    if (!localStorage.getItem('mywallet_onboarding_done')) return 'onboarding';
    return 'app';
  } catch {
    return 'auth';
  }
}

function getSavedName(): string {
  try {
    return localStorage.getItem('mywallet_user_name') ?? 'Ahmad';
  } catch {
    return 'Ahmad';
  }
}

export default function App() {
  const [stage, setStage] = useState<AppStage>(getInitialStage);
  const [userName, setUserName] = useState<string>(getSavedName);
  const [currentPage, setCurrentPage] = useState<Page>('home');
  const [showAddTransaction, setShowAddTransaction] = useState(false);

  // ── Auth complete → move to onboarding ──
  const handleAuthComplete = (pin: string, fingerprintEnabled: boolean) => {
    try {
      localStorage.setItem('mywallet_pin', pin);
      localStorage.setItem('mywallet_fingerprint', String(fingerprintEnabled));
    } catch { /* ignore */ }
    setStage('onboarding');
  };

  // ── Onboarding complete → move to app ──
  const handleOnboardingComplete = (data: OnboardingData) => {
    try {
      localStorage.setItem('mywallet_user_name', data.name);
      localStorage.setItem('mywallet_onboarding_done', 'true');
      localStorage.setItem('mywallet_accounts', JSON.stringify(data.accounts));
    } catch { /* ignore */ }
    setUserName(data.name);
    setStage('app');
  };

  // ── Auth setup ──
  if (stage === 'auth') {
    return <AuthSetup onComplete={handleAuthComplete} />;
  }

  // ── Onboarding ──
  if (stage === 'onboarding') {
    return <Onboarding onComplete={handleOnboardingComplete} />;
  }

  // ── Main app ──
  const renderPage = () => {
    switch (currentPage) {
      case 'home':
        return (
          <Home
            onAddTransaction={() => setShowAddTransaction(true)}
            onGoToCalendar={() => setCurrentPage('calendar')}
          />
        );
      case 'calendar':
        return <Calendar onAddTransaction={() => setShowAddTransaction(true)} />;
      case 'cashflow':
        return <CashFlow />;
      case 'settings':
        return <Settings />;
      default:
        return (
          <Home
            onAddTransaction={() => setShowAddTransaction(true)}
            onGoToCalendar={() => setCurrentPage('calendar')}
          />
        );
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground max-w-md mx-auto">
      <div className="flex-1 overflow-y-auto pb-20">
        {renderPage()}
      </div>
      <BottomNav
        currentPage={currentPage}
        onPageChange={setCurrentPage}
        onAddClick={() => setShowAddTransaction(true)}
      />
      {showAddTransaction && (
        <AddTransaction onClose={() => setShowAddTransaction(false)} />
      )}
    </div>
  );
}
