import { useEffect, useMemo, useRef, useState } from 'react';
import { Modal, PanResponder, Pressable, View } from 'react-native';
import Animated, { FadeIn, SlideInUp, SlideOutUp } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BellRing, CalendarDays, Wallet, X } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { centeredPadding, TABLET_WIDTH, useBreakpoint } from '@/src/hooks/useBreakpoint';
import { expenseCategories, incomeCategories } from '@/constants/categories';
import { categoryIcon } from '@/constants/categoryIcons';
import { merchantCategory } from '@/src/utils/merchantLogo';
import { detectedName } from '@/src/services/autoFile';
import { formatRM } from '@/src/lib/money';
import type { AnyAccount } from '@/src/utils/accountDisplay';
import type { DetectedTransaction, SaveOverrides } from '@/src/hooks/useDetectedTransactions';
import { Button } from '../ui/Button';
import { GlassChip } from '../ui/GlassChip';
import { GlassIconButton } from '../ui/GlassIconButton';
import { GradientFill } from '../ui/GradientFill';
import { LogoWell } from '../ui/LogoWell';
import { Money } from '../ui/Money';
import { Text } from '../ui/Text';
import { useToast } from '../ui/ToastProvider';
import { DetectedTransactionForm, alertTimeLabel } from './DetectedTransactionForm';

export interface DetectedTransactionIslandProps {
  detected: DetectedTransaction | null;
  accounts: AnyAccount[];
  onSave: (detected: DetectedTransaction, values: SaveOverrides) => Promise<{ ok: boolean }>;
  onDismiss: (id: string) => void;
  /** Hides it into the pending card without discarding it. */
  onSnooze: (id: string) => void;
}

/** Collapsed island hovers this long, then steps into the pending card (m-island-collapsed: 6 s). */
const AUTO_HIDE_MS = 6000;

function suggestedValues(d: DetectedTransaction): SaveOverrides | null {
  if (!d.accountId) return null;
  const name = detectedName(d);
  return {
    name,
    type: d.parsed.type,
    accountId: d.accountId,
    category: d.parsed.type === 'expense' ? merchantCategory(name) ?? 'food' : 'salary',
  };
}

function categoryLabel(slug: string | undefined): string {
  return [...expenseCategories, ...incomeCategories].find((c) => c.id === slug)?.name ?? 'Others';
}

/**
 * The capsule that drops from the top when a bank alert is detected while Flowe
 * is open. Overlays any tab, never pushes content. Tap → expanded card;
 * Edit → DetectedTransactionForm; swipe up → pending card.
 */
export function DetectedTransactionIsland({ detected, accounts, onSave, onDismiss, onSnooze }: DetectedTransactionIslandProps) {
  const insets = useSafeAreaInsets();
  const { isTablet, width } = useBreakpoint();
  const islandInset = isTablet ? centeredPadding(width, TABLET_WIDTH.nav, 16) : 16;
  const toast = useToast();
  const [expanded, setExpanded] = useState(false);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const current = useRef(detected);
  current.current = detected;

  useEffect(() => { setExpanded(false); setEditing(false); }, [detected?.id]);

  useEffect(() => {
    if (!detected || expanded || editing || saving) return;
    const t = setTimeout(() => onSnooze(detected.id), AUTO_HIDE_MS);
    return () => clearTimeout(t);
  }, [detected, expanded, editing, saving, onSnooze]);

  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dy) > 8,
    onPanResponderRelease: (_, g) => {
      if (g.dy < -20 && current.current) onSnooze(current.current.id);
    },
  }), [onSnooze]);

  if (!detected) return null;
  const values = suggestedValues(detected);
  const name = detectedName(detected);
  const account = accounts.find((a) => a.id === detected.accountId);
  const sign = detected.parsed.type === 'income' ? 'income' : 'expense';

  const confirm = async () => {
    if (!values) { setEditing(true); return; }
    setSaving(true);
    const res = await onSave(detected, values);
    setSaving(false);
    if (res.ok) {
      setExpanded(false);
      toast.success(`Saved · ${formatRM(detected.parsed.amount)} to ${categoryLabel(values.category)}`);
    } else {
      toast.failure('Save failed. Your entry is kept.', { label: 'Retry', onPress: confirm });
    }
  };

  return (
    <>
      {!expanded && !editing ? (
        <Animated.View
          entering={SlideInUp.duration(260)}
          exiting={SlideOutUp.duration(200)}
          {...pan.panHandlers}
          style={{ position: 'absolute', top: insets.top + 8, left: islandInset, right: islandInset, zIndex: 100 }}
        >
          <Pressable
            onPress={() => setExpanded(true)}
            accessibilityRole="button"
            accessibilityLabel={`New detected transaction: ${formatRM(detected.parsed.amount)} at ${name}. Opens details.`}
            style={{ height: 60, borderRadius: 9999, overflow: 'hidden', flexDirection: 'row', alignItems: 'center', gap: 10, paddingLeft: 10, paddingRight: 8 }}
          >
            <GradientFill />
            <LogoWell merchant={name} on="gradient" />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Text variant="body-md" weight={600} tone="inverse" numberOfLines={1}>{formatRM(detected.parsed.amount)} · {name}</Text>
              <Text variant="label-sm" weight={400} tone="soft" numberOfLines={1}>Detected from {detected.sourceLabel} · now</Text>
            </View>
            <Button label="Confirm" variant="white" height={44} onPress={confirm} loading={saving} loadingLabel="Confirming…" />
          </Pressable>
        </Animated.View>
      ) : null}

      <Modal visible={expanded && !editing} transparent animationType="none" onRequestClose={() => !saving && setExpanded(false)} statusBarTranslucent>
        <Animated.View entering={FadeIn.duration(160)} style={{ flex: 1, backgroundColor: colors.scrim }}>
          <Pressable style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }} onPress={() => !saving && setExpanded(false)} accessibilityLabel="Close" />
          <Animated.View
            entering={SlideInUp.duration(220)}
            accessibilityViewIsModal
            accessibilityLabel="Detected transaction"
            style={{ marginTop: insets.top + 8, marginHorizontal: 12, borderRadius: radius.lg, overflow: 'hidden', padding: 20, gap: 16, ...(isTablet ? { width: '100%', maxWidth: TABLET_WIDTH.dialog, alignSelf: 'center' } as const : null) }}
          >
            <GradientFill />
            <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <BellRing size={14} color={colors['on-primary-soft']} strokeWidth={1.75} />
                <Text variant="label-sm" tone="soft">Detected from {detected.sourceLabel} · now</Text>
              </View>
              <GlassIconButton icon={X} onPress={() => setExpanded(false)} accessibilityLabel="Close" disabled={saving} />
            </View>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <LogoWell merchant={name} size={48} on="gradient" />
              <View style={{ flex: 1 }}>
                <Text variant="body-lg" tone="inverse" numberOfLines={1}>{name}</Text>
                <Money amount={detected.parsed.amount} direction={sign} variant="display-md" on="gradient" />
              </View>
            </View>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {values ? <GlassChip icon={categoryIcon(values.category)} label={`${categoryLabel(values.category)} · suggested`} /> : null}
              <GlassChip icon={Wallet} label={account?.name ?? 'Choose account'} />
              <GlassChip icon={CalendarDays} label={alertTimeLabel(detected.parsed.postedAt)} />
            </View>
            <View style={{ flexDirection: 'row', gap: 8 }}>
              <Button label="Confirm" variant="white" onPress={confirm} loading={saving} loadingLabel="Confirming…" style={{ flex: 1 }} />
              <Button label="Edit" variant="glass" disabled={saving} onPress={() => { setExpanded(false); setEditing(true); }} />
            </View>
            <Pressable
              onPress={() => { onDismiss(detected.id); setExpanded(false); }}
              disabled={saving}
              accessibilityRole="button"
              style={{ alignSelf: 'center', height: 44, justifyContent: 'center', paddingHorizontal: 16, opacity: saving ? 0.5 : 1 }}
            >
              <Text variant="body-md" weight={600} tone="inverse">Dismiss</Text>
            </Pressable>
          </Animated.View>
        </Animated.View>
      </Modal>

      <DetectedTransactionForm
        visible={editing}
        detected={detected}
        accounts={accounts}
        onSave={onSave}
        onDismiss={onDismiss}
        onClose={() => setEditing(false)}
      />
    </>
  );
}
