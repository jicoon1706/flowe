import { useEffect } from 'react';
import { View } from 'react-native';
import { Tabs, usePathname, useRouter } from 'expo-router';
import { LockProvider, useLock } from '@/context/LockContext';
import { DetectedTransactionsProvider, useDetected } from '@/context/DetectedTransactionsContext';
import { DetectedTransactionIsland } from '@/components/home/DetectedTransactionIsland';
import { LaunchSync } from '@/components/home/LaunchSync';
import { FloatingNav, type NavKey } from '@/components/ui/FloatingNav';
import { colors } from '@/theme/tokens';
import { isOpenWhileLocked } from '@/src/utils/lockRoutes';
import { navKeyFor, showsNav } from '@/src/utils/navRoutes';
import { startDailyBudgetSync } from '@/src/services/dailyBudget';
import { startAlerts } from '@/src/services/alerts';
import { usePushResponses } from '@/src/hooks/usePushResponses';
import { authRepository } from '@/src/repositories';

async function currentUserId(): Promise<string | undefined> {
  const res = await authRepository.getUser();
  return res.ok ? res.data?.id : undefined;
}

const HIDDEN = { href: null } as const;

/** Every route in (main); only the first four are nav destinations. */
const ROUTES = [
  'index', 'cashflow/index', 'add-transaction', 'calendar', 'settings',
  'transactions', 'cashflow/info', 'home/notifications', 'home/analysis', 'home/accounts',
  'home/account/[id]', 'home/wallet/[id]', 'home/tabung/[id]', 'home/learn/index',
  'home/learn/[projectId]', 'home/learn/[projectId]/add-entry', 'home/learn/[projectId]/entry',
  'tabung/new/index', 'tabung/new/form',
] as const;

const NAV_TARGET: Record<NavKey, '/(main)' | '/(main)/cashflow' | '/(main)/add-transaction' | '/(main)/calendar' | '/(main)/settings'> = {
  home: '/(main)',
  cashflow: '/(main)/cashflow',
  add: '/(main)/add-transaction',
  calendar: '/(main)/calendar',
  settings: '/(main)/settings',
};

function MainNav() {
  const pathname = usePathname();
  const router = useRouter();
  if (!showsNav(pathname)) return null;
  return <FloatingNav active={navKeyFor(pathname)} onNavigate={(k) => router.navigate(NAV_TARGET[k])} />;
}

/** The island hovers over any tab when a bank alert is detected. */
function DetectedTransactionOverlay() {
  const { prompt, accounts, save, dismiss, snooze } = useDetected();
  return <DetectedTransactionIsland detected={prompt} accounts={accounts} onSave={save} onDismiss={dismiss} onSnooze={snooze} />;
}

/** Raises the PIN prompt when a locked route opens; backing out returns somewhere open. */
function LockedRouteGuard() {
  const pathname = usePathname();
  const router = useRouter();
  const { locked, requireUnlock } = useLock();
  useEffect(() => {
    if (!locked || isOpenWhileLocked(pathname)) return;
    let stale = false;
    requireUnlock().then((ok) => {
      if (ok || stale) return;
      if (router.canGoBack()) router.back();
      else router.replace('/(main)');
    });
    return () => { stale = true; };
  }, [locked, pathname, requireUnlock, router]);
  return null;
}

export default function MainLayout() {
  // Every transaction write redraws the widgets and the live budget notification.
  useEffect(() => startDailyBudgetSync(), []);
  // Budget alerts, monthly summary and the daily affirmation (Settings › Notifications).
  useEffect(() => startAlerts(currentUserId), []);
  // Taps and actions on Flowe's pushes open their screen (or re-schedule / confirm).
  usePushResponses();

  return (
    <LockProvider>
      <DetectedTransactionsProvider>
        <View style={{ flex: 1, backgroundColor: colors.surface }}>
          <Tabs screenOptions={{ headerShown: false, sceneStyle: { backgroundColor: colors.surface } }} tabBar={() => null}>
            {ROUTES.map((name) => (
              <Tabs.Screen key={name} name={name} options={HIDDEN} />
            ))}
          </Tabs>
          <MainNav />
          <DetectedTransactionOverlay />
          <LockedRouteGuard />
          <LaunchSync />
        </View>
      </DetectedTransactionsProvider>
    </LockProvider>
  );
}
