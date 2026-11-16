import { useCallback, useState } from 'react';
import { Share, View } from 'react-native';
import { useFocusEffect, useRouter } from 'expo-router';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import { Download, Scale, Trash2, Upload } from 'lucide-react-native';
import { SettingsScreen } from '@/components/settings/SettingsScreen';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { Text } from '@/components/ui/Text';
import { TextInput } from '@/components/ui/TextInput';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useLock } from '@/context/LockContext';
import { useAccounts } from '@/src/hooks/useAccounts';
import { accountsRepository, assetsRepository, authRepository, liabilitiesRepository, transactionsRepository } from '@/src/repositories';
import { exportTransactionsCsv, importTransactionsCsv } from '@/src/services/dataTransfer';
import { MAX_IMPORT_BYTES } from '@/src/lib/csv';
import { verifyPin } from '@/src/lib/pinVerify';
import { flags } from '@/src/lib/secureStore';
import { refreshGate } from '../../_layout';

/** settings/data — export, import, recalculate, reset (typed RESET + PIN). */
export default function DataScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { suspend } = useLock();
  const { accounts, fetchAccounts } = useAccounts();
  const [busy, setBusy] = useState<'export' | 'import' | 'recalc' | null>(null);
  const [resetting, setResetting] = useState(false);
  const [typed, setTyped] = useState('');
  const [pin, setPin] = useState('');
  const [pinError, setPinError] = useState<string | null>(null);
  const [txCount, setTxCount] = useState(0);

  useFocusEffect(useCallback(() => {
    fetchAccounts();
    transactionsRepository.countAll().then((r) => { if (r.ok) setTxCount(r.data); });
  }, [fetchAccounts]));

  const exportCsv = async () => {
    setBusy('export');
    const res = await exportTransactionsCsv();
    setBusy(null);
    if (!res.ok) { toast.failure('Couldn’t export', { label: 'Retry', onPress: exportCsv }); return; }
    suspend();
    try {
      const shared = await Share.share({ title: 'Flowe transactions.csv', message: res.data.csv });
      if (shared.action === Share.sharedAction) toast.success(`Exported ${res.data.count} transaction${res.data.count === 1 ? '' : 's'}`);
    } catch {
      toast.failure('Couldn’t open the export', { label: 'Retry', onPress: exportCsv });
    }
  };

  const importCsv = async () => {
    if (!user) return;
    suspend();
    const picked = await DocumentPicker.getDocumentAsync({ type: ['text/csv', 'text/comma-separated-values', 'text/plain'], copyToCacheDirectory: true });
    if (picked.canceled) return;
    const asset = picked.assets[0];
    if (asset.size != null && asset.size > MAX_IMPORT_BYTES) { toast.failure('File too large · max 5 MB', { label: 'Pick another', onPress: importCsv }); return; }
    setBusy('import');
    let text: string;
    try {
      text = await new File(asset.uri).text();
    } catch {
      setBusy(null);
      toast.failure('Couldn’t read that file', { label: 'Pick another', onPress: importCsv });
      return;
    }
    const res = await importTransactionsCsv(user.id, text, accounts);
    setBusy(null);
    if (!res.ok) { toast.failure('Couldn’t read that file', { label: 'Pick another', onPress: importCsv }); return; }
    const { imported, skipped } = res.data;
    toast.success(`Imported ${imported} transaction${imported === 1 ? '' : 's'}${skipped ? ` · ${skipped} skipped` : ''}`);
    fetchAccounts();
  };

  const recalc = async () => {
    setBusy('recalc');
    const res = await transactionsRepository.recalculateBalances();
    setBusy(null);
    if (!res.ok) { toast.failure('Couldn’t recalculate', { label: 'Retry', onPress: recalc }); return; }
    toast.success(`Balances rebuilt for ${res.data} account${res.data === 1 ? '' : 's'}`);
  };

  const reset = async () => {
    if (!(await verifyPin(pin, user?.id))) { setPinError('Wrong PIN. Try again.'); setPin(''); return; }
    const results = await Promise.all([accountsRepository.softDeleteAllAccounts(), assetsRepository.softDeleteAll(), liabilitiesRepository.softDeleteAll()]);
    if (results.some((r) => !r.ok)) { toast.failure('Reset failed', { label: 'Retry', onPress: reset }); return; }
    await authRepository.signOut();
    await flags.unsetPin();
    setResetting(false);
    refreshGate();
    router.replace('/(auth)/welcome');
  };

  const banks = accounts.filter((a) => a.type !== 'tabung').length;
  const tabung = accounts.length - banks;

  return (
    <SettingsScreen
      title="Data"
      overlay={
        <ConfirmSheet
          visible={resetting}
          icon={Trash2}
          title="Reset all data?"
          message={`This removes ${banks} account${banks === 1 ? '' : 's'}, ${txCount} transaction${txCount === 1 ? '' : 's'} and ${tabung} Tabung, and signs this phone out. It can’t be undone.`}
          confirmLabel="Reset everything"
          loadingLabel="Resetting…"
          cancelLabel="Export first"
          confirmDisabled={typed.trim().toUpperCase() !== 'RESET' || pin.length !== 6}
          onConfirm={reset}
          onCancel={() => { setResetting(false); exportCsv(); }}
        >
          <TextInput label="Type RESET to confirm" value={typed} onChangeText={setTyped} autoCapitalize="characters" autoCorrect={false} />
          <TextInput label="PIN" value={pin} onChangeText={(v) => { setPin(v.replace(/\D/g, '').slice(0, 6)); setPinError(null); }} keyboardType="number-pad" secureTextEntry maxLength={6} error={pinError} />
        </ConfirmSheet>
      }
    >
      <SettingsRow label="Export" value={busy === 'export' ? 'Preparing…' : 'CSV of all transactions'} icon={Upload} onPress={exportCsv} disabled={!!busy} />
      <SettingsRow label="Import" value={busy === 'import' ? 'Importing…' : 'From a Flowe CSV'} icon={Download} onPress={importCsv} disabled={!!busy} />
      <SettingsRow label="Recalculate balances" value={busy === 'recalc' ? 'Working…' : 'Rebuild account balances from transactions'} icon={Scale} onPress={recalc} disabled={!!busy} />
      <SettingsRow label="Reset all data" value="Deletes accounts, transactions and Tabung" icon={Trash2} onPress={() => { setTyped(''); setPin(''); setPinError(null); setResetting(true); }} />
      <View style={{ height: 4 }} />
      <Text variant="label-sm" weight={400} tone="muted">Your data is stored in your Flowe account. Export regularly if you switch devices.</Text>
    </SettingsScreen>
  );
}
