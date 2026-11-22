import { useEffect, useState } from 'react';
import { View } from 'react-native';
import { useAssets } from '@/src/hooks/useAssets';
import { KWSP_ACCOUNTS, kwspFormReady, kwspTotal, type KwspAccountKey } from '@/src/lib/kwsp';
import { parseAmount } from '@/src/lib/money';
import type { Asset } from '@/src/types';
import { Button } from '../ui/Button';
import { Sheet } from '../ui/Sheet';
import { Text } from '../ui/Text';
import { TextInput } from '../ui/TextInput';
import { useToast } from '../ui/ToastProvider';
import { AssetTypeRow, SheetHeader, ValuePreview } from './AssetFormParts';

export type KwspFields = Record<KwspAccountKey, string>;

const EMPTY: KwspFields = { persaraan: '', sejahtera: '', fleksibel: '' };
/** RM as typed: up to 2 decimals, 9 integer digits. */
export const cleanKwsp = (raw: string) => raw.replace(/[^\d.]/g, '').replace(/^(\d{0,9}\.?\d{0,2}).*$/, '$1');
export const kwspNumbers = (f: KwspFields) => ({
  persaraan: f.persaraan.trim() === '' ? 0 : parseAmount(f.persaraan) ?? 0,
  sejahtera: f.sejahtera.trim() === '' ? 0 : parseAmount(f.sejahtera) ?? 0,
  fleksibel: f.fleksibel.trim() === '' ? 0 : parseAmount(f.fleksibel) ?? 0,
});

/**
 * Add KWSP / EPF (mn-kwsp-empty / -filled, t-mn-kwsp-*): three balances,
 * total = their sum (save_kwsp_asset). No name, no monthly income.
 */
export function KwspAssetSheet({ visible, onClose, onSaved, onChangeType }: { visible: boolean; onClose: () => void; onSaved: (asset: Asset) => void; onChangeType?: () => void }) {
  const toast = useToast();
  const { saveKwsp } = useAssets();
  const [fields, setFields] = useState<KwspFields>(EMPTY);
  const [saving, setSaving] = useState(false);

  useEffect(() => { if (visible) setFields(EMPTY); }, [visible]);

  const balances = kwspNumbers(fields);
  const ready = kwspFormReady(balances);

  const save = async () => {
    if (!ready || saving) return;
    setSaving(true);
    const res = await saveKwsp(balances);
    setSaving(false);
    if (!res.ok) { toast.failure('Couldn’t save it', { label: 'Retry', onPress: save }); return; }
    onSaved(res.data);
  };

  const field = (key: KwspAccountKey) => {
    const acc = KWSP_ACCOUNTS.find((a) => a.key === key)!;
    return (
      <TextInput
        label={acc.label}
        prefix="RM"
        keyboardType="decimal-pad"
        placeholder="0.00"
        autoFocus={key === 'persaraan'}
        value={fields[key]}
        onChangeText={(v) => setFields((f) => ({ ...f, [key]: cleanKwsp(v) }))}
      />
    );
  };

  return (
    <Sheet visible={visible} onClose={onClose} scroll dismissible={!saving}>
      <SheetHeader title="Add asset" onClose={onClose} />
      <View style={{ gap: 10 }}>
        <AssetTypeRow type="kwsp" onChange={onChangeType} />
        <Text variant="body-md" size={13} tone="muted" style={{ paddingHorizontal: 4 }}>Copy balances from KWSP i-Akaun.</Text>
        {field('persaraan')}
        <View style={{ flexDirection: 'row', gap: 12 }}>
          <View style={{ flex: 1 }}>{field('sejahtera')}</View>
          <View style={{ flex: 1 }}>{field('fleksibel')}</View>
        </View>
        <ValuePreview label="Total balance" aside={ready ? '3 accounts' : undefined} value={kwspTotal(balances)} empty={!ready}>
          {!ready ? <Text variant="label-sm" weight={400} tone="muted">Adds up the 3 accounts as you type.</Text> : null}
        </ValuePreview>
        <Button label={ready ? 'Add asset' : 'Enter at least one balance'} disabled={!ready} loading={saving} loadingLabel="Saving…" onPress={save} />
      </View>
    </Sheet>
  );
}
