import { Pressable, View } from 'react-native';
import { ArrowDownRight, ArrowUpRight, Bell, Clock, Landmark, Lock, RefreshCw, Wallet } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { accountDomain, accountMask, type AnyAccount } from '@/src/utils/accountDisplay';
import { GlassChip } from '../ui/GlassChip';
import { GlassIconButton } from '../ui/GlassIconButton';
import { LogoWell } from '../ui/LogoWell';
import { Money } from '../ui/Money';
import { Skeleton } from '../ui/Skeleton';
import { Text } from '../ui/Text';

export interface HomeHeroProps {
  name: string;
  balance: number | null;
  accounts: AnyAccount[];
  /** Month change in %, signed. Null hides the chip. */
  monthChangePct: number | null;
  masked: boolean;
  unread: boolean;
  loading: boolean;
  /** Showing cached / last-known figures (q-launch-2, st-home-error). */
  stale?: 'updating' | 'saved' | null;
  lastSynced?: string | null;
  /** "Updated just now" for 2 s after a write (o-home-live-after). */
  justUpdated?: boolean;
  onAvatar: () => void;
  onBell: () => void;
  onAccounts: () => void;
  onUnlock: () => void;
}

/** Home's gradient field: avatar + bell, Balance, change chip, stacked account cards. */
export function HomeHero({ name, balance, accounts, monthChangePct, masked, unread, loading, stale, lastSynced, justUpdated, onAvatar, onBell, onAccounts, onUnlock }: HomeHeroProps) {
  const lead = accounts.find((a) => a.type === 'bank') ?? accounts.find((a) => a.type === 'wallet') ?? accounts[0];
  const others = accounts.filter((a) => a.id !== lead?.id && a.type !== 'tabung');
  const initial = (name.trim()[0] ?? 'F').toUpperCase();

  return (
    <View style={{ height: 420 }}>
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', paddingHorizontal: 16 }}>
        {loading ? <Skeleton width={44} height={44} tone="glass" /> : (
          <Pressable onPress={onAvatar} accessibilityRole="button" accessibilityLabel={`${name || 'Profile'}, settings`} style={{ width: 44, height: 44, borderRadius: 9999, backgroundColor: colors.glass, alignItems: 'center', justifyContent: 'center' }}>
            <Text variant="body-lg" weight={600} tone="inverse">{initial}</Text>
          </Pressable>
        )}
        {loading ? <Skeleton width={44} height={44} tone="glass" /> : (
          <GlassIconButton icon={Bell} onPress={onBell} accessibilityLabel={unread ? 'Notifications, unread' : 'Notifications'} dot={unread} />
        )}
      </View>

      <View style={{ alignItems: 'center', gap: 12, marginTop: 52 }}>
        {loading ? (
          <>
            <Skeleton width={80} height={14} tone="glass" />
            <Skeleton width={240} height={56} tone="glass" />
            <Skeleton width={140} height={32} tone="glass" />
          </>
        ) : (
          <>
            <Text variant="body-lg" tone="soft">{stale === 'saved' && lastSynced ? `Balance · last synced ${lastSynced}` : 'Balance'}</Text>
            <Pressable onPress={masked ? onUnlock : undefined} disabled={!masked} accessibilityRole={masked ? 'button' : undefined} accessibilityHint={masked ? 'Unlock to show balances' : undefined}>
              <View style={{ opacity: stale === 'updating' ? 0.55 : 1 }}>
                <Money amount={balance ?? 0} variant="numeric-lg" on="gradient" smallCurrency masked={masked} />
              </View>
            </Pressable>
            {masked ? <GlassChip icon={Lock} label="Locked · tap to show" onPress={onUnlock} />
              : justUpdated ? <GlassChip icon={RefreshCw} label="Updated just now" role="status" />
              : stale === 'updating' ? <GlassChip label="Updating…" role="status" />
              : stale === 'saved' ? <GlassChip icon={Clock} label="Showing saved data" role="status" />
              : accounts.length === 0 ? <GlassChip icon={Wallet} label="No accounts yet" />
              : monthChangePct !== null ? (
                <GlassChip icon={monthChangePct < 0 ? ArrowDownRight : ArrowUpRight} label={`${Math.abs(monthChangePct).toFixed(2)}% this month`} />
              ) : null}
          </>
        )}
      </View>

      {lead || loading ? (
        <Pressable onPress={onAccounts} disabled={loading} accessibilityRole="button" accessibilityLabel="All accounts" style={{ position: 'absolute', left: 20, right: 20, bottom: 0, height: 114 }}>
          <View style={{ position: 'absolute', left: 20, right: 20, top: 0, height: 60, borderRadius: 24, backgroundColor: colors['glass-faint'] }} />
          <View style={{ position: 'absolute', left: 10, right: 10, top: 10, height: 60, borderRadius: 24, backgroundColor: colors['glass-soft'] }} />
          <View style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 92, borderRadius: 24, backgroundColor: colors.glass, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            {lead && !loading ? (
              <>
                <LogoWell domain={accountDomain(lead)} fallback={lead.type === 'wallet' ? Wallet : Landmark} on="gradient" />
                <View style={{ flex: 1 }}>
                  <Text variant="body-md" weight={500} tone="inverse" numberOfLines={1}>{lead.name}</Text>
                  {accountMask(lead) ? <Text variant="label-sm" weight={400} tone="soft" style={{ letterSpacing: 0.5 }}>{accountMask(lead)}</Text> : null}
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                  {others.slice(0, 2).map((a) => <LogoWell key={a.id} domain={accountDomain(a)} fallback={a.type === 'wallet' ? Wallet : Landmark} size={28} on="gradient" />)}
                  {others.length > 2 ? <Text variant="label-sm" weight={400} tone="soft">+{others.length - 2}</Text> : null}
                </View>
              </>
            ) : null}
          </View>
        </Pressable>
      ) : null}
    </View>
  );
}
