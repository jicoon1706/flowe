import { useMemo, useState } from 'react';
import { PanResponder, View } from 'react-native';
import { BellRing } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { categoryIcon } from '@/constants/categoryIcons';
import { expenseCategories, incomeCategories } from '@/constants/categories';
import { detectedName } from '@/src/services/autoFile';
import { merchantCategory } from '@/src/utils/merchantLogo';
import { formatRM } from '@/src/lib/money';
import type { AnyAccount } from '@/src/utils/accountDisplay';
import type { DetectedTransaction, SaveOverrides } from '@/src/hooks/useDetectedTransactions';
import { Button } from '../ui/Button';
import { Chip } from '../ui/Chip';
import { LogoWell } from '../ui/LogoWell';
import { SectionHeader } from '../ui/SectionHeader';
import { Text } from '../ui/Text';
import { useToast } from '../ui/ToastProvider';
import { DetectedTransactionForm } from './DetectedTransactionForm';

export interface PendingEntriesCardProps {
  pending: DetectedTransaction[];
  accounts: AnyAccount[];
  onSave: (d: DetectedTransaction, v: SaveOverrides) => Promise<{ ok: boolean }>;
  onDismiss: (id: string) => void;
}

const LABEL: Record<string, string> = Object.fromEntries([...expenseCategories, ...incomeCategories].map((c) => [c.id, c.name]));

function minutesAgo(postedAt: number): string {
  const m = Math.max(0, Math.round((Date.now() - postedAt) / 60000));
  if (m < 1) return 'just now';
  if (m < 60) return `${m} min ago`;
  const h = Math.round(m / 60);
  return h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
}

function suggestion(d: DetectedTransaction): SaveOverrides | null {
  if (!d.accountId) return null;
  const name = detectedName(d);
  return { name, type: d.parsed.type, accountId: d.accountId, category: d.parsed.type === 'expense' ? merchantCategory(name) ?? 'food' : 'salary' };
}

/**
 * Detected payments waiting on Home (core-home / m-pending-2 / pending stack):
 * one card; a ghost card behind for 2; a deck with "Confirm all" for 3+.
 * Swipe sideways for the next card. Confirm (black) = 1 tap.
 */
export function PendingEntriesCard({ pending, accounts, onSave, onDismiss }: PendingEntriesCardProps) {
  const toast = useToast();
  const [index, setIndex] = useState(0);
  const [busy, setBusy] = useState<string | null>(null);
  const [editing, setEditing] = useState<DetectedTransaction | null>(null);
  const count = pending.length;
  const i = count ? index % count : 0;
  const item = pending[i];

  const pan = useMemo(() => PanResponder.create({
    onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 12 && Math.abs(g.dx) > Math.abs(g.dy),
    onPanResponderRelease: (_, g) => {
      if (g.dx < -40) setIndex((n) => n + 1);
      else if (g.dx > 40) setIndex((n) => (n > 0 ? n - 1 : 0));
    },
  }), []);

  if (!item) return null;
  const sug = suggestion(item);
  const name = detectedName(item);
  const account = accounts.find((a) => a.id === item.accountId);

  const confirm = async (d: DetectedTransaction) => {
    const v = suggestion(d);
    if (!v) { setEditing(d); return; }
    setBusy(d.id);
    const res = await onSave(d, v);
    setBusy(null);
    if (res.ok) toast.success(`Saved · ${formatRM(d.parsed.amount)} to ${LABEL[v.category ?? ''] ?? 'Others'}`);
    else toast.failure('Save failed. Your entry is kept.', { label: 'Retry', onPress: () => confirm(d) });
  };

  const confirmAll = async () => {
    setBusy('all');
    let failed = 0;
    for (const d of pending) {
      const v = suggestion(d);
      if (!v) continue;
      const res = await onSave(d, v);
      if (!res.ok) failed += 1;
    }
    setBusy(null);
    if (failed) toast.failure(`${failed} couldn’t be saved`, { label: 'Retry', onPress: confirmAll });
    else toast.success('All confirmed');
  };

  return (
    <View style={{ gap: 12 }}>
      {count >= 3 ? <SectionHeader title={`${count} to review`} actionLabel="Confirm all" onAction={busy ? undefined : confirmAll} /> : null}
      <View {...pan.panHandlers} style={{ paddingTop: count >= 3 ? 16 : count === 2 ? 8 : 0 }}>
        {count >= 3 ? <View style={{ position: 'absolute', left: 32, right: 32, top: 0, height: 40, borderRadius: radius.md, backgroundColor: colors['surface-container-high'] }} /> : null}
        {count >= 2 ? <View style={{ position: 'absolute', left: 16, right: 16, top: count >= 3 ? 8 : 0, height: 40, borderRadius: radius.md, backgroundColor: colors['surface-container'], opacity: 0.9 }} /> : null}
        <View
          accessibilityLabel={`Detected payment ${i + 1} of ${count}: ${formatRM(item.parsed.amount)} at ${name}`}
          style={{ borderRadius: radius.md, backgroundColor: colors['surface-container'], padding: 16, gap: 14 }}
        >
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
              <BellRing size={14} color={colors['on-surface-variant-aa']} strokeWidth={1.75} />
              <Text variant="label-sm" tone="meta">Detected · {minutesAgo(item.parsed.postedAt)}</Text>
            </View>
            {count >= 2 ? <Text variant="label-sm" tone="meta">{i + 1} of {count}</Text> : null}
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
            <LogoWell merchant={name} on="grey" />
            <View style={{ flex: 1, gap: 6 }}>
              <Text variant="body-lg" numberOfLines={2}>
                <Text variant="body-lg" weight={600} tabular>{formatRM(item.parsed.amount)}</Text>
                {` · ${name}${account ? ` · ${account.name}` : ''}`}
              </Text>
              {sug ? (
                <View style={{ alignSelf: 'flex-start' }}>
                  <Chip label={`${LABEL[sug.category ?? ''] ?? 'Others'} · suggested`} icon={categoryIcon(sug.category)} on="white" height={28} onPress={() => setEditing(item)} />
                </View>
              ) : null}
            </View>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <Button label="Confirm" onPress={() => confirm(item)} loading={busy === item.id} loadingLabel="Confirming…" disabled={!!busy && busy !== item.id} style={{ minWidth: 150 }} />
            <Button label="Edit" variant="white" disabled={!!busy} onPress={() => setEditing(item)} />
            <View style={{ flex: 1 }} />
            <Button label="Dismiss" variant="text" muted disabled={!!busy} onPress={() => onDismiss(item.id)} />
          </View>
        </View>
      </View>
      <DetectedTransactionForm visible={!!editing} detected={editing} accounts={accounts} onSave={onSave} onDismiss={onDismiss} onClose={() => setEditing(null)} />
    </View>
  );
}
