import { Home, Calendar, Plus, DollarSign, Settings } from 'lucide-react';

type Page = 'home' | 'calendar' | 'cashflow' | 'settings';

interface BottomNavProps {
  currentPage: Page;
  onPageChange: (page: Page) => void;
  onAddClick: () => void;
}

export function BottomNav({ currentPage, onPageChange, onAddClick }: BottomNavProps) {
  const navItems = [
    { id: 'home' as Page, icon: Home, label: 'Home' },
    { id: 'calendar' as Page, icon: Calendar, label: 'Calendar' },
    { id: 'add' as Page, icon: Plus, label: 'Add', isCenter: true },
    { id: 'cashflow' as Page, icon: DollarSign, label: 'Cash Flow' },
    { id: 'settings' as Page, icon: Settings, label: 'Settings' }
  ];

  return (
    <div className="fixed bottom-0 left-0 right-0 bg-card border-t border-border max-w-md mx-auto">
      <div className="flex items-center justify-around px-2 py-3">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPage === item.id;

          if (item.isCenter) {
            return (
              <button
                key={item.id}
                onClick={onAddClick}
                className="bg-primary text-primary-foreground w-14 h-14 rounded-full flex items-center justify-center shadow-lg shadow-primary/30 hover:scale-105 transition-transform -mt-8"
              >
                <Icon className="w-6 h-6" />
              </button>
            );
          }

          return (
            <button
              key={item.id}
              onClick={() => onPageChange(item.id)}
              className={`flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                isActive ? 'text-primary' : 'text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-xs">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
