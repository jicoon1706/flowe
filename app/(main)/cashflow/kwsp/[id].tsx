import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { colors, chart, radius } from '@/theme/tokens';
import { kwspNumbers, cleanKwsp, type KwspFields } from '@/components/cashflow/KwspAssetSheet';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { GlassChip } from '@/components/ui/GlassChip';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { Money } from '@/components/ui/Money';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { TextInput } from '@/components/ui/TextInput';
import { TopBar } from '@/components/ui/TopBar';
import { useToast } from '@/components/ui/ToastProvider';
import { useLock } from '@/context/LockContext';
import { useAssets } from '@/src/hooks/useAssets';
import { dayMonthYear } from '@/src/lib/assetDisplay';
import { todayInKualaLumpur } from '@/src/lib/goldValuation';
import { KWSP_ACCOUNTS, kwspBalancesOf, kwspFormReady, kwspSplit, type KwspAccountKey } from '@/src/lib/kwsp';

/** Split bar and legend: the chart's monochrome blues, account by account. */
const SWATCH: Record<KwspAccountKey, string> = { persaraan: chart[0], sejahtera: chart[1], fleksibel: chart[2] };

/**
 * KWSP / EPF detail (mn-kwsp-detail, t-mn-kwsp-detail): total, "Updated" date,
 * split bar and legend on the gradient; the three balances (editable), the
 * Monthly contributions placeholder, Delete asset and Save changes.
 */
export default function KwspDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { locked } = useLock();
  const { assets, fetchAssets, saveKwsp, deleteAsset } = useAssets();
  const [fetched, setFetched] = useState(false);
  const [fields, setFields] = useState<KwspFields | null>(null);
  const [saving, setSaving] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);

  useFocusEffect(useCallback(() => { fetchAssets().then(() => setFetched(true)); }, [fetchAssets]));
  const asset = assets.find((a) => a.id === id && a.type === 'kwsp') ?? null;

  useEffect(() => {
    if (!asset || fields) return;
    const b = kwspBalancesOf(asset);
    setFields({ persaraan: b.persaraan.toFixed(2), sejahtera: b.sejahtera.toFixed(2), fleksibel: b.fleksibel.toFixed(2) });
  }, [asset, fields]);

  const saved = asset ? kwspBalancesOf(asset) : null;
  const split = saved ? kwspSplit(saved) : [];
  const balances = fields ? kwspNumbers(fields) : null;
  const ready = !!balances && kwspFormReady(balances);
  const updated = asset?.updated_at ? dayMonthYear(todayInKualaLumpur(new Date(asset.updated_at))) : null;

  const save = async () => {
    if (!asset || !balances || !ready || saving) return;
    setSaving(true);
    const res = await saveKwsp({ id: asset.id, ...balances });
    setSaving(false);
    if (!res.ok) { toast.failure('Couldn’t save it', { label: 'Retry', onPress: save }); return; }
    toast.success('KWSP / EPF updated');
    setFields(null);
  };

  const remove = async () => {
    if (!asset) return;
    const res = await deleteAsset(asset.id);
    if (!res.ok) { toast.failure('Delete failed', { label: 'Retry', onPress: remove }); return; }
    setConfirmDelete(false);
    toast.success('KWSP / EPF removed');
    router.back();
  };

  return (
    <HeroScreen
      tabletLayout="panel"
      heroHeight={400}
      hero={
        <View>
          <TopBar title="KWSP / EPF" onBack={() => router.back()} />
          <View style={{ alignItems: 'center', gap: 8, marginTop: 28 }}>
            {!asset ? (
              <><Skeleton width={110} height={14} tone="glass" /><Skeleton width={240} height={56} tone="glass" /></>
            ) : (
              <>
                <Text variant="body-lg" tone="soft">Total balance</Text>
                <Money amount={Number(asset.current_value)} variant="numeric-lg" on="gradient" smallCurrency masked={locked} />
                {updated ? <GlassChip label={`Updated ${updated}`} align="center" /> : null}
                <View style={{ height: 4 }} />
                <View style={{ alignSelf: 'stretch', backgroundColor: colors.surface, borderRadius: 9999, padding: 4 }}>
                  <View
                    accessible
                    accessibilityRole="image"
                    accessibilityLabel={`Split: ${split.map((s) => `${s.short} ${s.pct}%`).join(', ')}`}
                    style={{ flexDirection: 'row', gap: 3, borderRadius: 9999, overflow: 'hidden' }}
                  >
                    {split.filter((s) => s.pct > 0).map((s) => <View key={s.key} style={{ width: `${s.pct}%`, height: 14, backgroundColor: SWATCH[s.key] }} />)}
                  </View>
                </View>
                <View style={{ alignSelf: 'stretch', gap: 6 }}>
                  {split.map((s) => (
                    <View key={s.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                      <View style={{ width: 10, height: 10, borderRadius: 9999, backgroundColor: SWATCH[s.key], borderWidth: 2, borderColor: colors.surface }} />
                      <Text variant="body-md" size={13} tone="inverse" style={{ flex: 1 }}>{s.label}</Text>
                      <Money amount={s.amount} variant="body-md" size={13} weight={600} on="gradient" masked={locked} />
                      <Text variant="body-md" size={13} tone="soft" tabular style={{ width: 36, textAlign: 'right' }}>{s.pct}%</Text>
                    </View>
                  ))}
                </View>
              </>
            )}
          </View>
        </View>
      }
      overlay={
        <ConfirmSheet
          visible={confirmDelete}
          title="Remove KWSP / EPF?"
          message="It leaves your balance sheet and net worth. Transactions you made into it stay in your history."
          confirmLabel="Remove"
          loadingLabel="Removing…"
          onConfirm={remove}
          onCancel={() => setConfirmDelete(false)}
        />
      }
    >
      {fetched && !asset ? (
        <Text variant="body-md" tone="meta">This KWSP / EPF asset isn’t here. It may have been removed.</Text>
      ) : (
        <View style={{ gap: 12 }}>
          <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
            <Text variant="label-lg">Balances</Text>
            <Text variant="body-md" size={13} weight={600}>Copy from KWSP i-Akaun</Text>
          </View>
          {KWSP_ACCOUNTS.map((acc) => (
            <View key={acc.key} style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
              <Text variant="label-lg" weight={400} style={{ flex: 1 }}>{acc.label}</Text>
              <View style={{ width: 168 }}>
                <TextInput
                  accessibilityLabel={acc.label}
                  prefix="RM"
                  keyboardType="decimal-pad"
                  value={fields?.[acc.key] ?? ''}
                  editable={!!fields}
                  textAlign="right"
                  onChangeText={(v) => setFields((f) => (f ? { ...f, [acc.key]: cleanKwsp(v) } : f))}
                />
              </View>
            </View>
          ))}
          <View accessibilityLabel="Monthly contributions, coming soon" style={{ borderWidth: 2, borderStyle: 'dashed', borderColor: colors['surface-container-high'], borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 14, gap: 4 }}>
            <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
              <Text variant="body-md" weight={600}>Monthly contributions</Text>
              <View style={{ height: 22, paddingHorizontal: 8, borderRadius: 9999, backgroundColor: colors['surface-container-high'], justifyContent: 'center' }}>
                <Text variant="caption" weight={600}>Coming soon</Text>
              </View>
            </View>
            <Text variant="label-sm" weight={400} tone="muted">Majikan and ahli contributions will show here in a later update.</Text>
          </View>
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 8 }}>
            <Button label="Delete asset" variant="text" onPress={() => setConfirmDelete(true)} disabled={saving || !asset} />
            <Button label={ready ? 'Save changes' : 'Enter at least one balance'} disabled={!ready} loading={saving} loadingLabel="Saving…" onPress={save} style={{ flex: 1 }} />
          </View>
        </View>
      )}
    </HeroScreen>
  );
}
