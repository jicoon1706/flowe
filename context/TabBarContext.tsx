import { createContext, useContext, useState, ReactNode } from 'react';

interface TabBarContextValue {
  hiddenRoutes: string[];
  hideTabBar: (route: string) => void;
  showTabBar: (route: string) => void;
  isTabBarHidden: (route: string) => boolean;
}

const TabBarContext = createContext<TabBarContextValue | null>(null);

export function TabBarProvider({ children }: { children: ReactNode }) {
  const [hiddenRoutes, setHiddenRoutes] = useState<string[]>([]);

  const hideTabBar = (route: string) => {
    setHiddenRoutes((prev) => (prev.includes(route) ? prev : [...prev, route]));
  };

  const showTabBar = (route: string) => {
    setHiddenRoutes((prev) => prev.filter((r) => r !== route));
  };

  const isTabBarHidden = (route: string) => hiddenRoutes.includes(route);

  return (
    <TabBarContext.Provider value={{ hiddenRoutes, hideTabBar, showTabBar, isTabBarHidden }}>
      {children}
    </TabBarContext.Provider>
  );
}

export function useTabBar() {
  const context = useContext(TabBarContext);
  if (!context) {
    throw new Error('useTabBar must be used within a TabBarProvider');
  }
  return context;
}