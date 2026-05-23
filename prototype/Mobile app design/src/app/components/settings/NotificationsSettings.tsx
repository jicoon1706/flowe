import { useState } from 'react';
import { ChevronLeft, Bell, BellOff } from 'lucide-react';

interface Props {
  onBack: () => void;
}

interface NotifToggle {
  id: string;
  label: string;
  subtitle: string;
  enabled: boolean;
}

export function NotificationsSettings({ onBack }: Props) {
  const [masterEnabled, setMasterEnabled] = useState(true);
  const [quietHours, setQuietHours] = useState(false);
  const [quietFrom, setQuietFrom] = useState('22:00');
  const [quietTo, setQuietTo] = useState('07:00');

  const [notifications, setNotifications] = useState<NotifToggle[]>([
    { id: 'transactions', label: 'Transaction Alerts', subtitle: 'Get notified for every transaction', enabled: true },
    { id: 'budget', label: 'Budget Warnings', subtitle: 'Alert when you exceed 80% of budget', enabled: true },
    { id: 'recurring', label: 'Recurring Reminders', subtitle: 'Upcoming recurring payments', enabled: true },
    { id: 'weekly', label: 'Weekly Summary', subtitle: 'Your spending report every Sunday', enabled: false },
    { id: 'affirmation', label: 'Daily Affirmation', subtitle: 'Motivational finance quote each morning', enabled: true },
    { id: 'cashflow', label: 'Cash Flow Updates', subtitle: 'Monthly cash flow analysis ready', enabled: false },
  ]);

  const toggle = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, enabled: !n.enabled } : n))
    );
  };

  const ToggleSwitch = ({ enabled, onToggle, disabled = false }: { enabled: boolean; onToggle: () => void; disabled?: boolean }) => (
    <button
      onClick={onToggle}
      disabled={disabled}
      className={`relative w-12 h-6 rounded-full transition-colors ${
        disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'
      } ${enabled && !disabled ? 'bg-primary' : 'bg-muted'}`}
    >
      <span
        className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${
          enabled && !disabled ? 'translate-x-6' : 'translate-x-0'
        }`}
      />
    </button>
  );

  return (
    <div className="min-h-screen p-4 pb-6">
      <div className="flex items-center gap-3 mb-6">
        <button
          onClick={onBack}
          className="p-2 rounded-xl bg-card border border-border hover:bg-muted transition-colors"
        >
          <ChevronLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Notifications</h1>
      </div>

      {/* Master Toggle */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden mb-6">
        <div className="flex items-center justify-between p-4">
          <div className="flex items-center gap-3">
            {masterEnabled ? (
              <Bell className="w-5 h-5 text-primary" />
            ) : (
              <BellOff className="w-5 h-5 text-muted-foreground" />
            )}
            <div>
              <p className="font-semibold">Push Notifications</p>
              <p className="text-xs text-muted-foreground">
                {masterEnabled ? 'Notifications are on' : 'All notifications paused'}
              </p>
            </div>
          </div>
          <ToggleSwitch enabled={masterEnabled} onToggle={() => setMasterEnabled(!masterEnabled)} />
        </div>
      </div>

      {/* Individual Notifications */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Notification Types</h3>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          {notifications.map((notif, i) => (
            <div
              key={notif.id}
              className={`flex items-center justify-between p-4 ${
                i !== notifications.length - 1 ? 'border-b border-border' : ''
              } ${!masterEnabled ? 'opacity-50' : ''}`}
            >
              <div className="flex-1 pr-4">
                <p className="font-medium">{notif.label}</p>
                <p className="text-xs text-muted-foreground">{notif.subtitle}</p>
              </div>
              <ToggleSwitch
                enabled={notif.enabled}
                onToggle={() => toggle(notif.id)}
                disabled={!masterEnabled}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Quiet Hours */}
      <div className="mb-6">
        <h3 className="text-sm font-medium text-muted-foreground mb-3 px-2">Quiet Hours</h3>
        <div className="bg-card rounded-2xl border border-border overflow-hidden">
          <div className="flex items-center justify-between p-4 border-b border-border">
            <div>
              <p className="font-medium">Enable Quiet Hours</p>
              <p className="text-xs text-muted-foreground">Silence notifications during set times</p>
            </div>
            <ToggleSwitch enabled={quietHours} onToggle={() => setQuietHours(!quietHours)} />
          </div>

          {quietHours && (
            <>
              <div className="flex items-center justify-between p-4 border-b border-border">
                <span className="font-medium text-sm">From</span>
                <input
                  type="time"
                  value={quietFrom}
                  onChange={(e) => setQuietFrom(e.target.value)}
                  className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
              <div className="flex items-center justify-between p-4">
                <span className="font-medium text-sm">To</span>
                <input
                  type="time"
                  value={quietTo}
                  onChange={(e) => setQuietTo(e.target.value)}
                  className="bg-muted border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:outline-none focus:border-primary"
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
