import { useState } from 'react';
import {
  ChevronRight, User, Lock, Bell, DollarSign, FileText, Heart, Download, RotateCcw,
  Fingerprint, RefreshCw
} from 'lucide-react';
import { AccountSettings } from './settings/AccountSettings';
import { ChangePIN } from './settings/ChangePIN';
import { SecuritySettings } from './settings/SecuritySettings';
import { NotificationsSettings } from './settings/NotificationsSettings';
import { CategoriesSettings } from './settings/CategoriesSettings';
import { RecurringPaymentsSettings } from './settings/RecurringPaymentsSettings';
import { AffirmationsSettings } from './settings/AffirmationsSettings';
import { DataSettings } from './settings/DataSettings';

type SubPage =
  | 'main'
  | 'account'
  | 'change-pin'
  | 'security'
  | 'notifications'
  | 'categories'
  | 'recurring-payments'
  | 'affirmations'
  | 'data';

export function Settings() {
  const [currentSubPage, setCurrentSubPage] = useState<SubPage>('main');

  const goTo = (page: SubPage) => setCurrentSubPage(page);
  const goBack = () => setCurrentSubPage('main');

  if (currentSubPage === 'account') return <AccountSettings onBack={goBack} />;
  if (currentSubPage === 'change-pin') return <ChangePIN onBack={goBack} />;
  if (currentSubPage === 'security') return <SecuritySettings onBack={goBack} onChangePIN={() => goTo('change-pin')} />;
  if (currentSubPage === 'notifications') return <NotificationsSettings onBack={goBack} />;
  if (currentSubPage === 'categories') return <CategoriesSettings onBack={goBack} />;
  if (currentSubPage === 'recurring-payments') return <RecurringPaymentsSettings onBack={goBack} />;
  if (currentSubPage === 'affirmations') return <AffirmationsSettings onBack={goBack} />;
  if (currentSubPage === 'data') return <DataSettings onBack={goBack} />;

  const settingsGroups: {
    title: string;
    items: {
      icon: React.ElementType;
      label: string;
      value?: string;
      destructive?: boolean;
      action?: SubPage;
    }[];
  }[] = [
    {
      title: 'Account',
      items: [
        { icon: User, label: 'Display Name', value: 'Ahmad', action: 'account' },
      ],
    },
    {
      title: 'Security',
      items: [
        { icon: Lock, label: 'Change PIN', action: 'change-pin' },
        { icon: Fingerprint, label: 'Fingerprint', value: 'Enabled', action: 'security' },
        { icon: Lock, label: 'Auto-lock Timer', value: '5 minutes', action: 'security' },
      ],
    },
    {
      title: 'App Settings',
      items: [
        { icon: DollarSign, label: 'Currency', value: 'RM (locked)' },
        { icon: Bell, label: 'Notifications', action: 'notifications' },
        { icon: FileText, label: 'Manage Categories', action: 'categories' },
        { icon: RefreshCw, label: 'Recurring Payments', action: 'recurring-payments' },
        { icon: FileText, label: 'Balance Visibility', value: 'Show on open', action: 'data' },
      ],
    },
    {
      title: 'Affirmations',
      items: [
        { icon: Heart, label: 'Show on Home', value: 'Enabled', action: 'affirmations' },
        { icon: Bell, label: 'Daily Reminder', value: '8:00 AM', action: 'affirmations' },
        { icon: Heart, label: 'Category Preference', value: 'All', action: 'affirmations' },
      ],
    },
    {
      title: 'Data',
      items: [
        { icon: Download, label: 'Export Data', action: 'data' },
        { icon: RotateCcw, label: 'Reset App', destructive: true, action: 'data' },
      ],
    },
  ];

  return (
    <div className="min-h-screen p-4 pb-6">
      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
      </div>

      {/* Profile Card */}
      <button
        onClick={() => goTo('account')}
        className="w-full bg-gradient-to-br from-primary/20 to-primary/10 rounded-2xl p-5 mb-6 border border-primary/30 flex items-center gap-4 hover:from-primary/25 hover:to-primary/15 transition-colors text-left"
      >
        <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
          <User className="w-8 h-8 text-black" />
        </div>
        <div className="flex-1">
          <h2 className="text-xl font-bold">Ahmad</h2>
          <p className="text-sm text-muted-foreground">MyWallet User</p>
          <p className="text-xs text-primary mt-1">Tap to edit profile →</p>
        </div>
      </button>

      {/* Settings Groups */}
      <div className="space-y-6">
        {settingsGroups.map((group, groupIdx) => (
          <div key={groupIdx}>
            <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">
              {group.title}
            </h3>
            <div className="bg-card rounded-2xl border border-border overflow-hidden">
              {group.items.map((item, itemIdx) => {
                const Icon = item.icon;
                return (
                  <button
                    key={itemIdx}
                    onClick={() => item.action && goTo(item.action)}
                    className={`w-full flex items-center justify-between p-4 transition-colors ${
                      item.action ? 'hover:bg-muted active:bg-muted/80' : 'cursor-default'
                    } ${itemIdx !== group.items.length - 1 ? 'border-b border-border' : ''} ${
                      item.destructive ? 'text-red-500' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Icon className="w-5 h-5" />
                      <span className="font-medium">{item.label}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {item.value && (
                        <span className="text-sm text-muted-foreground">{item.value}</span>
                      )}
                      {item.action && (
                        <ChevronRight className="w-5 h-5 text-muted-foreground" />
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* App Info */}
      <div className="mt-8 text-center text-sm text-muted-foreground">
        <p>MyWallet v1.0.0</p>
        <p className="mt-1">Personal Finance Tracker</p>
      </div>
    </div>
  );
}
