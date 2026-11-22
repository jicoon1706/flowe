import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAssets } from '@/src/hooks/useAssets';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { dayMonthYear, gramsText } from '@/src/lib/assetDisplay';
import { DEFAULT_GOLD_PURITY, goldFormReady, goldGainLoss, goldValue, todayInKualaLumpur } from '@/src/lib/goldValuation';
import { formatRM, parseAmount } from '@/src/lib/money';
import type { Asset, GoldPurity } from '@/src/types';
import { Button } from '../ui/Button';
import { SegmentedToggle } from '../ui/SegmentedToggle';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { TextInput } from '../ui/TextInput';
import { useToast } from '../ui/ToastProvider';
import { AssetTypeRow, SheetHeader, ValuePreview } from './AssetFormParts';
import { GainLossTag } from './GainLossTag';

export interface GoldAssetSheetProps {
  visible: boolean;
  /** Edit an existing Gold asset; null to add one. */
  initial: Asset | null;
  /** "Update price" on a stale row: focus PG Buy price (mn-gold-stale). */
  focusPrice?: boolean;
  onClose: () => void;
  onSaved: (asset: Asset, created: boolean) => void;
  /** Add only: back to the type picker. */
  onChangeType?: () => void;
  onDelete?: () => void;
}

const PURITIES = [{ value: '999' as const, label: '999' }, { value: '916' as const, label: '916' }];
/** Money as typed text: up to 2 decimals. */
const cleanMoney = (raw: string) => raw.replace(/[^\d.]/g, '').replace(/^(\d*\.?\d{0,2}).*$/, '$1');
/** Grams: up to 4 decimals (assets.quantity is numeric(16,4)). */
const cleanGrams = (raw: string) => raw.replace(/[^\d.]/g, '').replace(/^(\d*\.?\d{0,4}).*$/, '$1');
const text2 = (n: number | null | undefined) => (n === null || n === undefined ? '' : Number(n).toFixed(2));

/**
 * Gold form (mn-gold-empty / -filled, t-mn-gold-*): value = grams × PG Buy
 * price, live; save_gold_asset stores the same and stamps today's price date.
 */
export function GoldAssetSheet({ visible, initial, focusPrice = false, onClose, onSaved, onChangeType, onDelete }: GoldAssetSheetProps) {
  const toast = useToast();
  const { saveGold } = useAssets();
  const { isTablet } = useBreakpoint();
  const editing = !!initial;
  const [name, setName] = useState('');
  const [grams, setGrams] = useState('');
  const [purity, setPurity] = useState<GoldPurity>(DEFAULT_GOLD_PURITY);
  const [price, setPrice] = useState('');
  const [cost, setCost] = useState('');
  const [nameError, setNameError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setName(initial?.name ?? '');
    setGrams(initial?.quantity ? gramsText(Number(initial.quantity)) : '');
    setPurity(initial?.purity ?? DEFAULT_GOLD_PURITY);
    setPrice(text2(initial?.price_per_gram));
    setCost(text2(initial?.cost));
    setNameError(null);
  }, [visible, initial]);

  const g = grams === '' ? null : Number(grams);
  const p = parseAmount(price);
  const c = cost.trim() === '' ? null : parseAmount(cost);
  const ready = goldFormReady({ grams: g, pricePerGram: p, cost: c });
  const value = ready ? goldValue(g ?? 0, p ?? 0) : 0;
  const gain = ready ? goldGainLoss(value, c) : null;

  const save = async () => {
    if (!ready || saving) return;
    if (!name.trim()) { setNameError('Give the asset a name'); return; }
    setSaving(true);
    const res = await saveGold({ id: initial?.id, name: name.trim(), grams: g ?? 0, purity, pricePerGram: p ?? 0, cost: c });
    setSaving(false);
    if (!res.ok) { toast.failure('Couldn’t save it', { label: 'Retry', onPress: save }); return; }
    onSaved(res.data, !editing);
  };

  const costField = <TextInput label="Cost (optional)" prefix="RM" keyboardType="decimal-pad" placeholder="0.00" value={cost} onChangeText={(v) => setCost(cleanMoney(v))} />;

  return (
    <Sheet visible={visible} onClose={onClose} scroll dismissible={!saving}>
      <SheetHeader title={editing ? 'Edit asset' : 'Add asset'} onClose={onClose} />
      <View style={{ gap: 10 }}>
        <AssetTypeRow type="gold" onChange={onChangeType} />
        {/* Tablet: Name | Cost side by side (t-mn-gold-*); phone: Name alone, Cost after the price (mn-gold-*). */}
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <TextInput label="Name" placeholder="e.g. Public Gold GAP" value={name} maxLength={40} error={nameError} autoFocus={!editing && !focusPrice} onChangeText={(v) => { setName(v); setNameError(null); }} />
          </View>
          {isTablet ? <View style={{ flex: 1 }}>{costField}</View> : null}
        </View>
        <View style={{ flexDirection: 'row', gap: 12, alignItems: 'flex-end' }}>
          <View style={{ flex: 1 }}>
            <TextInput label="Grams held" keyboardType="decimal-pad" placeholder="0.0" suffix="g" value={grams} onChangeText={(v) => setGrams(cleanGrams(v))} />
          </View>
          <View style={{ flex: 1, gap: 8 }}>
            <Text variant="label-sm" tone="muted">Purity</Text>
            <SegmentedToggle options={PURITIES} value={String(purity) as '999' | '916'} onChange={(v) => setPurity(Number(v) as GoldPurity)} accessibilityLabel="Purity" />
          </View>
        </View>
        <View style={{ gap: 4 }}>
          <TextInput
            label="PG Buy price"
            labelAside={`Price as of ${dayMonthYear(todayInKualaLumpur())}`}
            prefix="RM"
            suffix="/ g"
            keyboardType="decimal-pad"
            placeholder="0.00"
            autoFocus={focusPrice}
            value={price}
            onChangeText={(v) => setPrice(cleanMoney(v))}
          />
          <Text variant="label-sm" weight={400} tone="muted">Use Public Gold’s buy price (the price they pay you), not the sell price.</Text>
        </View>
        {isTablet ? null : costField}
        <ValuePreview label="Current value" aside={ready ? `${gramsText(g ?? 0)} g × ${formatRM(p ?? 0)}` : undefined} value={value} empty={!ready}>
          {!ready ? (
            <Text variant="label-sm" weight={400} tone="muted">Fills in as you enter grams and PG Buy price.</Text>
          ) : gain ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', alignItems: 'center', gap: 8 }}>
              <GainLossTag gain={gain} />
              <Text variant="label-sm" weight={400} tone="muted">unrealised vs {formatRM(c ?? 0)} paid</Text>
            </View>
          ) : null}
        </ValuePreview>
        <View style={{ flexDirection: 'row', gap: 8, alignItems: 'center' }}>
          {editing && onDelete ? <Button label="Delete asset" variant="text" onPress={onDelete} disabled={saving} /> : null}
          <Button
            label={!ready ? 'Enter grams and price' : editing ? 'Save changes' : 'Add asset'}
            disabled={!ready}
            loading={saving}
            loadingLabel="Saving…"
            onPress={save}
            style={{ flex: 1 }}
          />
        </View>
      </View>
    </Sheet>
  );
}
