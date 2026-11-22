import { useMemo, useState } from 'react';
import { View } from 'react-native';
import { useLocalSearchParams, useRouter, type Href } from 'expo-router';
import { ChevronDown, CircleAlert, SquarePen, Sparkle, X } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { expenseCategories } from '@/constants/categories';
import { EditGroupsSheet } from '@/components/split/EditGroupsSheet';
import { PartDot, SplitBar, partFill } from '@/components/split/SplitBar';
import { Button } from '@/components/ui/Button';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { MonthPickerSheet } from '@/components/ui/MonthPickerSheet';
import { Money } from '@/components/ui/Money';
import { Pressable } from '@/components/ui/Pressable';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { TopBar } from '@/components/ui/TopBar';
import { useLock } from '@/context/LockContext';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { useIncomeSplit } from '@/src/hooks/useIncomeSplit';
import { guideLabel, incomeUsedPct, overspentBy, pct1, pctShort, SPLIT_DISCLAIMER, SPLIT_GROUP_LABEL, SPLIT_GROUP_SHORT, suggestionCopy } from '@/src/lib/incomeSplit';
import { groupNote, rowName, splitBar, type SplitPart } from '@/src/lib/incomeSplitView';
import { formatRM } from '@/src/lib/money';
import type { IncomeSplit, IncomeSplitRow } from '@/src/types';

type Group = 'needs' | 'wants' | 'invest';

const monthFromParam = (m?: string): Date => {
  const [y, mo] = (m ?? '').split('-').map(Number);
  const n = new Date();
  return y && mo ? new Date(y, mo - 1, 1) : new Date(n.getFullYear(), n.getMonth(), 1);
};
const monthKey = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
const label = (c: string) => expenseCategories.find((x) => x.id === c)?.name ?? c;

/**
 * cashflow/split (spec §5.4.5; mo-split / t-mo-split, -bucket, -over, -empty): the
 * month's income split. Hero with the 100% bar, four group cards (tap one to
 * filter), All categories, Suggestions; Edit groups in the top bar.
 */
export default function IncomeSplitScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ month?: string }>();
  const { locked } = useLock();
  const { isTablet } = useBreakpoint();
  const [month, setMonth] = useState(() => monthFromParam(params.month));
  const [picker, setPicker] = useState(false);
  const [editing, setEditing] = useState(false);
  const [selected, setSelected] = useState<Group | null>(null);
  const { data, loading, error, refresh } = useIncomeSplit(month);
  const monthLong = month.toLocaleDateString('en-MY', { month: 'long', year: 'numeric' });
  const bar = data ? splitBar(data) : null;
  const over = data ? overspentBy(data) : 0;

  return (
    <HeroScreen
      tabletLayout="panel"
      panelColumn={100000}
      sheetPadding={{ horizontal: isTablet ? 24 : 16 }}
      hero={
        <View>
          <TopBar
            title="Income split"
            onBack={() => router.back()}
            right={!isTablet ? (
              <GlassIconButton icon={SquarePen} accessibilityLabel="Edit groups" onPress={() => setEditing(true)} />
            ) : (
              <Pressable
                accessibilityRole="button"
                onPress={() => setEditing(true)}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingLeft: 12, paddingRight: 16, borderRadius: 9999, backgroundColor: colors.glass, opacity: pressed ? 0.8 : 1 })}
              >
                <SquarePen size={20} color={colors['on-primary']} strokeWidth={1.75} />
                <Text variant="body-md" weight={600} tone="inverse">Edit groups</Text>
              </Pressable>
            )}
          />
          {!isTablet ? (
            <View style={{ marginTop: 6, gap: 8, alignItems: 'center', paddingHorizontal: 4 }}>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel="Month"
                onPress={() => setPicker(true)}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingLeft: 16, paddingRight: 14, borderRadius: 9999, backgroundColor: colors.glass, opacity: pressed ? 0.8 : 1 })}
              >
                <Text variant="body-md" weight={600} tone="inverse">{monthLong}</Text>
                <ChevronDown size={16} color={colors['on-primary']} strokeWidth={1.75} />
              </Pressable>
              <Text variant="body-md" tone="soft" style={{ marginTop: 2 }}>Income · {monthLong}</Text>
              {data ? <Money amount={data.income} variant="numeric-lg" size={48} on="gradient" smallCurrency masked={locked} /> : <Skeleton width={200} height={48} tone="glass" />}
              {data && over > 0 ? (
                <View accessibilityRole="text" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 9999, backgroundColor: colors.glass }}>
                  <CircleAlert size={14} color={colors['on-primary']} strokeWidth={1.75} />
                  <Text variant="label-sm" tone="inverse">Overspent {formatRM(over)} · {pctShort(incomeUsedPct(data))} of income used</Text>
                </View>
              ) : null}
              {data?.state === 'empty' ? (
                <>
                  <View style={{ alignSelf: 'stretch', height: 24, borderRadius: 9999, borderWidth: 2, borderStyle: 'dashed', borderColor: colors['on-primary-muted'], marginTop: 4 }} />
                  <Text variant="body-md" tone="soft">No income logged this month yet.</Text>
                </>
              ) : bar ? (
                <>
                  {bar.incomeAt !== null ? <View style={{ height: 14 }} /> : null}
                  <View style={{ alignSelf: 'stretch', backgroundColor: colors.surface, borderRadius: 9999, padding: 4 }}>
                    <SplitBar model={bar} height={14} />
                  </View>
                  {data ? <Text variant="body-md" size={13} tone="soft">{guideLabel(data.targets)}</Text> : null}
                </>
              ) : null}
            </View>
          ) : (
          <View style={{ marginTop: 16, gap: 12 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end', gap: 16, flexWrap: 'wrap' }}>
              <View style={{ gap: 10, alignItems: 'flex-start' }}>
                <Pressable
                  accessibilityRole="button"
                  accessibilityLabel="Month"
                  onPress={() => setPicker(true)}
                  style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingLeft: 16, paddingRight: 14, borderRadius: 9999, backgroundColor: colors.glass, opacity: pressed ? 0.8 : 1 })}
                >
                  <Text variant="body-md" weight={600} tone="inverse">{monthLong}</Text>
                  <ChevronDown size={16} color={colors['on-primary']} strokeWidth={1.75} />
                </Pressable>
                <Text variant="body-lg" tone="soft">Income · {monthLong}</Text>
                {data ? <Money amount={data.income} variant="numeric-lg" on="gradient" smallCurrency masked={locked} /> : <Skeleton width={240} height={56} tone="glass" />}
              </View>
              {data && data.state !== 'empty' ? (
                <View style={{ alignItems: 'flex-end', gap: 8 }}>
                  {over > 0 ? (
                    <View accessibilityRole="text" style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 32, paddingHorizontal: 12, borderRadius: 9999, backgroundColor: colors.glass }}>
                      <CircleAlert size={14} color={colors['on-primary']} strokeWidth={1.75} />
                      <Text variant="body-md" size={13} weight={500} tone="inverse">Overspent {formatRM(over)} · {pctShort(incomeUsedPct(data))} of income used</Text>
                    </View>
                  ) : null}
                  <Text variant="body-md" size={13} tone="soft">{guideLabel(data.targets)}</Text>
                </View>
              ) : null}
            </View>
            {data?.state === 'empty' ? (
              <>
                <View style={{ paddingTop: 16 }}>
                  <View style={{ height: 28, borderRadius: 9999, borderWidth: 2, borderStyle: 'dashed', borderColor: colors['on-primary-muted'] }} />
                </View>
                <Text variant="body-md" tone="soft">No income logged this month yet.</Text>
              </>
            ) : bar ? (
              <View style={{ paddingTop: bar.incomeAt !== null ? 26 : 16 }}>
                <View style={{ backgroundColor: colors.surface, borderRadius: 9999, padding: 4 }}>
                  <SplitBar model={bar} height={18} />
                </View>
              </View>
            ) : null}
          </View>
          )}
        </View>
      }
      overlay={
        <>
          <MonthPickerSheet visible={picker} onClose={() => setPicker(false)} value={month} onChange={(m) => { setMonth(m); setSelected(null); }} />
          <EditGroupsSheet visible={editing} onClose={() => setEditing(false)} onSaved={refresh} pillWidth={isTablet ? 240 : 198} />
        </>
      }
    >
      {loading ? (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', gap: 12 }}>{[0, 1, 2, 3].map((i) => <View key={i} style={{ flex: 1 }}><Skeleton width="100%" height={112} /></View>)}</View>
          <Skeleton width="100%" height={240} />
        </View>
      ) : error && !data ? (
        <Pressable accessibilityRole="button" onPress={refresh}><Text variant="body-md" tone="meta">Couldn’t load this month · Try again</Text></Pressable>
      ) : data?.state === 'empty' ? (
        <EmptyBody month={month} phone={!isTablet} onAdd={() => router.push({ pathname: '/add-transaction', params: { type: 'income', nonce: String(Date.now()) } })} />
      ) : data ? (
        <SplitBody split={data} month={month} selected={selected} onSelect={setSelected} masked={locked} phone={!isTablet} />
      ) : null}
    </HeroScreen>
  );
}

function SplitBody({ split, month, selected, onSelect, masked, phone }: { split: IncomeSplit; month: Date; selected: Group | null; onSelect: (g: Group | null) => void; masked: boolean; phone: boolean }) {
  const router = useRouter();
  const { accounts } = useAccounts();
  const b = split.buckets!;
  const rows = useMemo(() => (selected ? split.rows.filter((r) => r.group === selected) : split.rows), [split.rows, selected]);
  const tabungs = accounts.filter((a) => a.type === 'tabung');
  const monthName = month.toLocaleDateString('en-MY', { month: 'long' });
  const toTabung = () => router.push((tabungs.length === 1 ? `/home/tabung/${tabungs[0].id}` : '/home/accounts') as Href);
  const openRow = (r: IncomeSplitRow) => {
    if (r.kind === 'tabung') router.push(`/home/tabung/${r.key.replace(/^tabung:/, '')}` as Href);
    else router.push({ pathname: '/transactions', params: { month: monthKey(month), ...(r.category ? { category: r.category } : {}) } });
  };

  return (
    <View style={{ gap: 12 }}>
      <View accessibilityRole="radiogroup" accessibilityLabel="Groups" style={{ flexDirection: 'row', flexWrap: phone ? 'wrap' : 'nowrap', gap: phone ? 8 : 12 }}>
        {(['needs', 'wants', 'invest'] as const).map((g) => (
          <GroupCard key={g} half={phone} part={g} amount={b[g].amount} note={groupNote(g, b[g].pct, split.targets[g])} fill={b[g].pct} guide={split.targets[g]} pressed={selected === g} onPress={() => onSelect(selected === g ? null : g)} masked={masked} />
        ))}
        <GroupCard half={phone} part="left" title={b.left.amount < 0 ? 'Overspent' : SPLIT_GROUP_LABEL.left} amount={b.left.amount} note={groupNote('left', b.left.pct)} fill={Math.max(0, b.left.pct)} masked={masked} />
      </View>
      <View style={{ flexDirection: phone ? 'column' : 'row', gap: phone ? 12 : 24, alignItems: phone ? 'stretch' : 'flex-start' }}>
        <View style={{ flex: phone ? undefined : 1, minWidth: 0 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8, marginTop: 8, minHeight: 44 }}>
            <Text variant="label-lg" size={17} accessibilityRole="header">{selected ? `${SPLIT_GROUP_LABEL[selected]} · ${rows.length} ${rows.length === 1 ? 'category' : 'categories'}` : 'All categories'}</Text>
            {selected ? (
              <Pressable accessibilityRole="button" onPress={() => onSelect(null)} style={{ height: 44, flexDirection: 'row', alignItems: 'center', gap: 4 }}>
                <Text variant="body-md" weight={600}>Show all</Text>
                <X size={14} color={colors['on-surface']} strokeWidth={1.75} />
              </Pressable>
            ) : (
              <Text variant="label-sm" weight={400} tone="muted">Tap a row to see its transactions</Text>
            )}
          </View>
          {rows.map((r) => {
            const name = rowName(r, label);
            return (
              <Pressable
                key={r.key}
                accessibilityRole="link"
                accessibilityLabel={`${name}, ${SPLIT_GROUP_LABEL[r.group]}, ${formatRM(r.amount)}, open transactions`}
                onPress={() => openRow(r)}
                style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 56, borderBottomWidth: 1, borderBottomColor: colors['surface-container'], opacity: pressed ? 0.7 : 1 })}
              >
                <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                  <Text variant="label-lg" weight={400} numberOfLines={1}>{name}</Text>
                  <Text variant="label-sm" tone="muted">{SPLIT_GROUP_SHORT[r.group]}</Text>
                </View>
                <View style={{ alignItems: 'flex-end', gap: 4 }}>
                  <Money amount={r.amount} variant="label-lg" weight={600} masked={masked} />
                  <Text variant="label-sm" weight={400} tone="muted" tabular>{pct1(r.pct)}</Text>
                </View>
              </Pressable>
            );
          })}
          {rows.length === 0 ? <Text variant="body-md" tone="meta" style={{ paddingVertical: 16 }}>Nothing in this group this month.</Text> : null}
        </View>
        <View style={{ width: phone ? undefined : 280, gap: 10 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, marginTop: 8, minHeight: 44 }}>
            <Text variant="label-lg" size={17} accessibilityRole="header">Suggestions</Text>
            <Text variant="label-sm" weight={400} tone="muted">{split.suggestions.length} of 3</Text>
          </View>
          {split.suggestions.map((s) => {
            const copy = suggestionCopy(s, monthName, label);
            const go = copy.target === 'tabung' ? toTabung : () => router.push({ pathname: '/transactions', params: { month: monthKey(month), category: copy.category ?? '' } });
            return (
              <View key={s.kind} style={{ backgroundColor: colors['surface-container'], borderRadius: radius.md, padding: 14, gap: 10 }}>
                <View style={{ flexDirection: 'row', gap: 10 }}>
                  <View style={{ width: 32, height: 32, borderRadius: 9999, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkle size={16} color={colors['on-surface']} strokeWidth={1.75} />
                  </View>
                  <View style={{ flex: 1, gap: 4 }}>
                    <Text variant="label-lg">{copy.title}</Text>
                    <Text variant="body-md" size={13} tone="muted">{copy.body}</Text>
                  </View>
                </View>
                <Button label={copy.action} variant="white" height={44} onPress={go} style={{ alignSelf: 'flex-start' }} />
              </View>
            );
          })}
          <Text variant="label-sm" weight={400} tone="muted">{SPLIT_DISCLAIMER}</Text>
        </View>
      </View>
    </View>
  );
}

function GroupCard({ part, title, amount, note, fill, guide, pressed, onPress, masked, half = false }: {
  part: SplitPart; title?: string; amount: number; note: string; fill: number; guide?: number; pressed?: boolean; onPress?: () => void; masked: boolean;
  /** Phone: two cards a row (mo-split). */
  half?: boolean;
}) {
  const name = title ?? SPLIT_GROUP_LABEL[part];
  const body = (
    <>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <PartDot part={part} />
        <Text variant="label-sm" weight={600} numberOfLines={1} style={{ flexShrink: 1 }}>{name}</Text>
      </View>
      <Money amount={amount} variant="body-lg" size={18} weight={500} masked={masked} />
      <Text variant="caption" tone="muted">{note}</Text>
      <View style={{ flex: 1 }} />
      {part === 'left' ? (
        <View style={{ height: 6, borderRadius: 9999, backgroundColor: colors['surface-container'], overflow: 'hidden' }}>
          <View style={{ width: `${Math.min(100, fill)}%`, height: 6, backgroundColor: colors['on-surface-variant'] + '55' }} />
        </View>
      ) : (
        <View accessible accessibilityRole="image" accessibilityLabel={`${name} ${fill.toFixed(1)}% of income, guide ${guide}%`} style={{ height: 6, borderRadius: 9999, backgroundColor: colors['surface-container'] }}>
          <View style={{ width: `${Math.min(100, fill)}%`, height: 6, borderRadius: 9999, ...partFill(part) }} />
          <View style={{ position: 'absolute', left: `${guide ?? 0}%`, top: -4, width: 2, height: 14, borderRadius: 1, backgroundColor: colors.secondary }} />
        </View>
      )}
    </>
  );
  const style = {
    ...(half ? { width: '48.6%' as const } : { flex: 1 }), minWidth: 0, minHeight: 112, gap: 6, borderRadius: radius.md, backgroundColor: colors.surface,
    borderWidth: pressed ? 2 : 1, borderColor: pressed ? colors.secondary : colors['surface-container-high'], padding: pressed ? 11 : 12,
  } as const;
  if (!onPress) return <View style={style}>{body}</View>;
  return <Pressable accessibilityRole="radio" accessibilityState={{ checked: !!pressed }} onPress={onPress} style={style}>{body}</Pressable>;
}

function EmptyBody({ month, onAdd, phone }: { month: Date; onAdd: () => void; phone: boolean }) {
  const monthName = month.toLocaleDateString('en-MY', { month: 'long' });
  return (
    <View style={{ gap: 12 }}>
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: phone ? 8 : 12 }} accessibilityElementsHidden>
        {[0, 1, 2, 3].map((i) => <View key={i} style={{ ...(phone ? { width: '48.6%' as const } : { flex: 1 }), height: phone ? 72 : 96, borderRadius: radius.md, borderWidth: 2, borderStyle: 'dashed', borderColor: colors['on-surface-variant'] + '55' }} />)}
      </View>
      <View style={{ alignItems: 'center', gap: phone ? 8 : 10, paddingTop: phone ? 8 : 24, paddingHorizontal: phone ? 8 : 80 }}>
        <Text variant={phone ? 'label-lg' : 'headline-md'} size={phone ? 17 : undefined} align="center">Log your income to see where it goes</Text>
        <Text variant="body-md" size={phone ? 14 : 15} tone="muted" align="center">Once {monthName}’s salary or other income is in, Flowe splits it into Needs, Wants, Invest &amp; save and what’s left.</Text>
        {phone ? null : <Button label="Add income" onPress={onAdd} style={{ width: 280, marginTop: 8 }} />}
      </View>
      {phone ? <Button label="Add income" onPress={onAdd} fullWidth style={{ marginTop: 4 }} /> : null}
    </View>
  );
}
