import { useCallback, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useFocusEffect, useRouter, type Href } from 'expo-router';
import { Banknote, ChevronDown, ChevronRight, ChevronUp, Plus, RefreshCw, Shield } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { assetTypeOption, liabilityTypeOption } from '@/constants/balanceSheetTypes';
import { AssetSheet, type AssetInput } from '@/components/cashflow/AssetSheet';
import { AssetTypePickerSheet } from '@/components/cashflow/AssetTypePickerSheet';
import { BalanceRow } from '@/components/cashflow/BalanceRow';
import { GainLossTag } from '@/components/cashflow/GainLossTag';
import { GoldAssetSheet } from '@/components/cashflow/GoldAssetSheet';
import { KwspAssetSheet } from '@/components/cashflow/KwspAssetSheet';
import { NetWorthBreakdownPanel } from '@/components/cashflow/NetWorthBreakdownPanel';
import { CashFlowPatternDiagram } from '@/components/cashflow/CashFlowPatternDiagram';
import { LiabilitySheet, type LiabilityInput } from '@/components/cashflow/LiabilitySheet';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { FullScreenModal } from '@/components/ui/FullScreenModal';
import { GlassChip } from '@/components/ui/GlassChip';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { Money } from '@/components/ui/Money';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { TopBar } from '@/components/ui/TopBar';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useLock } from '@/context/LockContext';
import { useAccounts } from '@/src/hooks/useAccounts';
import { useAssets } from '@/src/hooks/useAssets';
import { useNetWorthBreakdown } from '@/src/hooks/useNetWorthBreakdown';
import { assetGainLoss, assetRowLabel, assetSubtitle, staleDays } from '@/src/lib/assetDisplay';
import { isPricedGold, todayInKualaLumpur } from '@/src/lib/goldValuation';
import { Pressable } from '@/components/ui/Pressable';
import { useLiabilities } from '@/src/hooks/useLiabilities';
import { useRecurring } from '@/src/hooks/useRecurring';
import { useTransactions } from '@/src/hooks/useTransactions';
import { transactionsRepository } from '@/src/repositories/transactions.repository';
import { CLASS_LABEL, coverRatio, financialClass } from '@/src/lib/cashflow';
import { formatRM } from '@/src/lib/money';
import { sumBalances, spendableAccounts, type AnyAccount } from '@/src/utils/accountDisplay';
import { localYMD } from '@/src/utils/date';
import type { Asset, AssetType, Liability } from '@/src/types';

/**
 * cashflow/info (mn-*, t-mn-*, spec §5.4.4): net worth from net_worth_breakdown() with the
 * Breakdown panel; Assets and Liabilities lists (Gold with grams, purity, price
 * date, gain / loss and the stale nudge; KWSP with its 3 accounts); Add asset
 * starts at the type picker; Gold and KWSP have their own forms. The class
 * chip opens the cash flow patterns.
 */
export default function CashflowInfoScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { locked } = useLock();
  const now = new Date();
  const { expenses, loading: txLoading, refetch } = useTransactions(now.getFullYear(), now.getMonth() + 1);
  const { assets, loading: aLoading, error: aError, fetchAssets, createAsset, updateAsset, deleteAsset } = useAssets();
  const { liabilities, loading: lLoading, error: lError, fetchLiabilities, createLiability, updateLiability, deleteLiability } = useLiabilities();
  const { accounts, fetchAccounts } = useAccounts();
  const { createRecurring } = useRecurring();
  const [assetSheet, setAssetSheet] = useState<{ initial: Asset | null } | null>(null);
  const [liabSheet, setLiabSheet] = useState<{ initial: Liability | null } | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<{ kind: 'asset' | 'liability'; id: string; name: string } | null>(null);
  const [patterns, setPatterns] = useState(false);
  const [fetched, setFetched] = useState(false);
  const { data: worth, refresh: refreshWorth } = useNetWorthBreakdown();
  const [picker, setPicker] = useState(false);
  const [pickedType, setPickedType] = useState<AssetType | null>(null);
  const [gold, setGold] = useState<{ initial: Asset | null; focusPrice?: boolean } | null>(null);
  const [kwspAdd, setKwspAdd] = useState(false);
  const [breakdown, setBreakdown] = useState(false);

  const load = useCallback(async () => {
    await Promise.all([fetchAssets(), fetchLiabilities(), fetchAccounts(), refetch(), refreshWorth()]);
    setFetched(true);
  }, [fetchAssets, fetchLiabilities, fetchAccounts, refetch, refreshWorth]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const all = accounts as AnyAccount[];
  const cash = sumBalances(all);
  const assetValue = assets.reduce((s, a) => s + Number(a.current_value), 0);
  const totalAssets = cash + assetValue;
  const totalLiab = liabilities.reduce((s, l) => s + Number(l.amount_owed), 0);
  const passive = assets.reduce((s, a) => s + Number(a.monthly_income || 0), 0);
  const totalExpenses = expenses.reduce((s, t) => s + Number(t.amount), 0);
  const cls = financialClass(totalAssets, passive, totalExpenses);
  const ratio = coverRatio(totalAssets, totalLiab);
  const firstLoad = (aLoading || lLoading || txLoading) && !fetched;
  const today = todayInKualaLumpur();
  const netWorth = worth ? worth.net_worth : totalAssets - totalLiab;

  // t-mn-asset-type-picker → Gold / KWSP forms, or the single-value sheet with that type.
  const pick = (t: AssetType) => {
    setPicker(false);
    if (t === 'gold') setGold({ initial: null });
    else if (t === 'kwsp') setKwspAdd(true);
    else { setPickedType(t); setAssetSheet({ initial: null }); }
  };
  const backToPicker = () => { setGold(null); setKwspAdd(false); setPicker(true); };
  const openAsset = (a: Asset) => {
    if (isPricedGold(a)) setGold({ initial: a });
    else if (a.type === 'kwsp') router.push(`/cashflow/kwsp/${a.id}` as Href);
    else setAssetSheet({ initial: a });
  };
  // t-mn-assets-saved: "{name} added" with Undo (Undo removes it again).
  const valuedSaved = (asset: Asset, created: boolean) => {
    setGold(null);
    setKwspAdd(false);
    load();
    const name = asset.type === 'kwsp' ? 'KWSP / EPF' : asset.name;
    if (!created) { toast.success('Asset updated'); return; }
    toast.success(`${name} added`, {
      label: 'Undo',
      onPress: async () => {
        const res = await deleteAsset(asset.id);
        if (!res.ok) toast.failure('Couldn’t undo it');
        load();
      },
    });
  };

  const saveAsset = async (a: AssetInput) => {
    if (!user) return false;
    const editing = assetSheet?.initial;
    const res = editing
      ? await updateAsset(editing.id, { name: a.name, type: a.type, icon: a.iconKey, current_value: a.value, quantity: a.quantity, unit: a.unit, monthly_income: a.monthlyIncome, note: a.note }, a.asOfMonth)
      : await createAsset({ user_id: user.id, name: a.name, type: a.type, icon: a.iconKey, current_value: a.value, quantity: a.quantity, unit: a.unit, monthly_income: a.monthlyIncome, note: a.note, as_of_month: a.asOfMonth });
    if (!res.ok) { toast.failure(editing ? 'Couldn’t save asset' : 'Couldn’t add asset', { label: 'Retry', onPress: () => saveAsset(a) }); return false; }
    if (a.fundFromAccountId && a.contribution > 0) {
      const tx = await transactionsRepository.create({
        user_id: user.id, type: 'transfer', name: editing ? `Top-up ${a.name}` : `Into ${a.name}`, amount: a.contribution,
        category: a.name, from_account_id: a.fundFromAccountId, date: localYMD(new Date()), asset_id: editing ? editing.id : res.ok ? (res.data as Asset).id : undefined,
      });
      if (!tx.ok) toast.failure('Asset saved, but the account wasn’t charged');
    }
    toast.success(editing ? 'Asset updated' : `Asset added · ${a.name}`);
    load();
    return true;
  };

  const saveLiability = async (l: LiabilityInput) => {
    if (!user) return false;
    const editing = liabSheet?.initial;
    const res = editing
      ? await updateLiability(editing.id, { name: l.name, type: l.type, icon: l.iconKey, amount_owed: l.amountOwed, monthly_payment: l.monthlyPayment, interest_rate: l.interestRate }, l.asOfMonth)
      : await createLiability({ user_id: user.id, name: l.name, type: l.type, icon: l.iconKey, amount_owed: l.amountOwed, monthly_payment: l.monthlyPayment, interest_rate: l.interestRate, as_of_month: l.asOfMonth });
    if (!res.ok) { toast.failure(editing ? 'Couldn’t save liability' : 'Couldn’t add liability', { label: 'Retry', onPress: () => saveLiability(l) }); return false; }
    if (l.addRecurring) {
      const next = new Date(now.getFullYear(), now.getMonth() + 1, 1);
      const rule = await createRecurring({ user_id: user.id, type: 'expense', name: l.name, amount: l.monthlyPayment, category: 'bills', frequency: 'monthly', start_date: localYMD(next), next_date: localYMD(next) });
      if (!rule.ok) toast.failure('Saved, but the recurring bill wasn’t added');
    }
    toast.success(editing ? 'Liability updated' : `Liability added · ${l.name}`);
    load();
    return true;
  };

  const remove = async () => {
    if (!confirmDelete) return;
    const res = confirmDelete.kind === 'asset' ? await deleteAsset(confirmDelete.id) : await deleteLiability(confirmDelete.id);
    if (!res.ok) { toast.failure('Delete failed', { label: 'Retry', onPress: remove }); return; }
    setConfirmDelete(null);
    toast.success(`${confirmDelete.name} removed`);
    load();
  };

  return (
    <HeroScreen
      tabletLayout="panel"
      refreshControl={<RefreshControl refreshing={(aLoading || lLoading) && fetched} onRefresh={load} tintColor={colors['on-primary']} />}
      hero={
        <View>
          <TopBar title="Cashflow info" onBack={() => router.back()} />
          <View style={{ alignItems: 'center', gap: 12, marginTop: 28 }}>
            {firstLoad ? (
              <><Skeleton width={90} height={14} tone="glass" /><Skeleton width={240} height={56} tone="glass" /></>
            ) : (
              <>
                <Text variant="body-lg" tone="soft">Net worth</Text>
                <Money amount={netWorth} variant="numeric-lg" on="gradient" smallCurrency masked={locked} size={breakdown ? 48 : undefined} />
                <GlassChip icon={Shield} label={`${CLASS_LABEL[cls]}${ratio ? ` · assets cover ${ratio}× debts` : ''}`} onPress={() => setPatterns(true)} accessibilityLabel={`${CLASS_LABEL[cls]}. Show cash flow patterns`} />
                {worth ? (
                  <Pressable
                    accessibilityRole="button"
                    accessibilityState={{ expanded: breakdown }}
                    onPress={() => setBreakdown((b) => !b)}
                    style={({ pressed }) => ({ flexDirection: 'row', alignItems: 'center', gap: 8, height: 44, paddingLeft: 16, paddingRight: 14, borderRadius: 9999, backgroundColor: colors.glass, opacity: pressed ? 0.8 : 1 })}
                  >
                    <Text variant="body-md" weight={600} tone="inverse">{breakdown ? 'Hide breakdown' : 'Breakdown'}</Text>
                    {breakdown ? <ChevronUp size={16} color={colors['on-primary']} strokeWidth={1.75} /> : <ChevronDown size={16} color={colors['on-primary']} strokeWidth={1.75} />}
                  </Pressable>
                ) : null}
                {worth && breakdown ? <NetWorthBreakdownPanel data={worth} masked={locked} /> : null}
              </>
            )}
          </View>
        </View>
      }
      overlay={
        <>
          <AssetTypePickerSheet visible={picker} onClose={() => setPicker(false)} onPick={pick} />
          <GoldAssetSheet visible={!!gold} initial={gold?.initial ?? null} focusPrice={gold?.focusPrice} onClose={() => setGold(null)} onSaved={valuedSaved} onChangeType={gold?.initial ? undefined : backToPicker}
            onDelete={() => { const a = gold?.initial; if (a) { setGold(null); setConfirmDelete({ kind: 'asset', id: a.id, name: a.name }); } }} />
          <KwspAssetSheet visible={kwspAdd} onClose={() => setKwspAdd(false)} onSaved={(a) => valuedSaved(a, true)} onChangeType={backToPicker} />
          <AssetSheet visible={!!assetSheet} initial={assetSheet?.initial ?? null} initialType={pickedType ?? undefined} accounts={spendableAccounts(all)} onClose={() => { setAssetSheet(null); setPickedType(null); }} onSubmit={saveAsset}
            onDelete={() => { const a = assetSheet?.initial; if (a) { setAssetSheet(null); setConfirmDelete({ kind: 'asset', id: a.id, name: a.name }); } }} />
          <LiabilitySheet visible={!!liabSheet} initial={liabSheet?.initial ?? null} onClose={() => setLiabSheet(null)} onSubmit={saveLiability}
            onDelete={() => { const l = liabSheet?.initial; if (l) { setLiabSheet(null); setConfirmDelete({ kind: 'liability', id: l.id, name: l.name }); } }} />
          <ConfirmSheet
            visible={!!confirmDelete}
            title={`Remove ${confirmDelete?.name ?? ''}?`}
            message={`It leaves your balance sheet and net worth. Transactions you made into it stay in your history.`}
            confirmLabel="Remove"
            loadingLabel="Removing…"
            onConfirm={remove}
            onCancel={() => setConfirmDelete(null)}
          />
          <FullScreenModal visible={patterns} title="Cash flow patterns" onClose={() => setPatterns(false)}>
            <CashFlowPatternDiagram current={cls} />
          </FullScreenModal>
        </>
      }
    >
      {(aError || lError) && !assets.length && !liabilities.length && fetched ? (
        <EmptyState icon={RefreshCw} title="Couldn’t load your balance sheet" body="Check your connection and try again." ctaLabel="Try again" onCta={load} />
      ) : null}
      <BalanceSheetLists
        worth={worth}
        assets={assets}
        liabilities={liabilities}
        today={today}
        masked={locked}
        onAddAsset={() => setPicker(true)}
        onAddLiability={() => setLiabSheet({ initial: null })}
        onOpenCash={() => router.push('/home/accounts')}
        onOpenAsset={openAsset}
        onUpdatePrice={(a) => setGold({ initial: a, focusPrice: true })}
        onOpenLiability={(l) => setLiabSheet({ initial: l })}
      />
    </HeroScreen>
  );
}

interface BalanceSheetListsProps {
  worth: ReturnType<typeof useNetWorthBreakdown>['data'];
  assets: Asset[];
  liabilities: Liability[];
  today: string;
  masked: boolean;
  onAddAsset: () => void;
  onAddLiability: () => void;
  onOpenCash: () => void;
  onOpenAsset: (a: Asset) => void;
  onUpdatePrice: (a: Asset) => void;
  onOpenLiability: (l: Liability) => void;
}

/** mn-assets-saved / t-mn-assets-saved: Assets (cash, then each asset), Liabilities, "How net worth is counted". */
function BalanceSheetLists({ worth, assets, liabilities, today, masked, onAddAsset, onAddLiability, onOpenCash, onOpenAsset, onUpdatePrice, onOpenLiability }: BalanceSheetListsProps) {
  const cash = worth?.groups.find((g) => g.key === 'cash');
  const header = (title: string, total: number | null, cta: string, onPress: () => void) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 }}>
      <View style={{ gap: 2 }}>
        <Text variant="headline-md" accessibilityRole="header">{title}</Text>
        {total !== null ? <Text variant="body-md" size={13} tone="muted" tabular>{masked ? 'RM •••••' : formatRM(total)}</Text> : null}
      </View>
      <Button label={cta} icon={Plus} variant="action" height={44} onPress={onPress} />
    </View>
  );
  return (
    <View style={{ gap: 12 }}>
      {header('Assets', worth?.total_assets ?? null, 'Add asset', onAddAsset)}
      <BalanceRow icon={Banknote} title="Cash in accounts" subtitle={`${worth?.cash_accounts ?? 0} accounts`} label="Cash in accounts" amount={<Money amount={cash?.total ?? 0} weight={600} masked={masked} />} onPress={onOpenCash} />
      {assets.map((a) => {
        const opt = assetTypeOption(a.type);
        const gain = assetGainLoss(a);
        const days = staleDays(a, today);
        return (
          <BalanceRow
            key={a.id}
            icon={opt.icon}
            title={a.name}
            subtitle={assetSubtitle(a, opt.label)}
            label={assetRowLabel(a, days, gain)}
            amount={<Money amount={Number(a.current_value)} weight={600} masked={masked} />}
            tag={gain && days === null ? <GainLossTag gain={gain} /> : null}
            onPress={() => onOpenAsset(a)}
            stale={days !== null ? { days, onUpdate: () => onUpdatePrice(a) } : undefined}
          />
        );
      })}
      <View style={{ height: 4 }} />
      {header('Liabilities', worth?.total_liabilities ?? null, 'Add liability', onAddLiability)}
      {liabilities.map((l) => {
        const opt = liabilityTypeOption(l.type);
        return <BalanceRow key={l.id} icon={opt.icon} title={l.name} subtitle={opt.label} label={l.name} amount={<Money amount={Number(l.amount_owed)} weight={600} masked={masked} />} onPress={() => onOpenLiability(l)} />;
      })}
      <View style={{ flexDirection: 'row', gap: 10, backgroundColor: colors['surface-container'], borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16 }}>
        <ChevronRight size={18} color={colors['on-surface']} strokeWidth={1.75} />
        <View style={{ flex: 1, gap: 4 }}>
          <Text variant="body-md" weight={600}>How net worth is counted</Text>
          <Text variant="body-md" size={13} tone="muted">Gold uses Public Gold’s buyback price. KWSP counts all 3 accounts.</Text>
        </View>
      </View>
    </View>
  );
}
