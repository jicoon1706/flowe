import { useState, useCallback } from 'react';
import { View, Text, Pressable, TextInput, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Download, AlertTriangle, Database, FileText, Check, Trash2 } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { useAssets } from '../../../src/hooks/useAssets';
import { useLiabilities } from '../../../src/hooks/useLiabilities';
import { useTransactions } from '../../../src/hooks/useTransactions';
import { LoadingView } from '../../../components/ui/LoadingView';
import { ErrorView } from '../../../components/ui/ErrorView';
import { flags } from '../../../src/lib/secureStore';
import { refreshGate } from '../../_layout';

type ExportFormat = 'csv' | 'pdf';
type DateRange = '1m' | '3m' | '1y' | 'all';

const DATE_RANGE_LABELS: Record<DateRange, string> = {
  '1m': 'This Month',
  '3m': 'Last 3 Months',
  '1y': 'Last Year',
  'all': 'All Time',
};

export default function DataScreen() {
  const router = useRouter();
  const now = new Date();
  const { assets, loading: assetsLoading, error: assetsError, fetchAssets } = useAssets();
  const { liabilities, loading: liabLoading, error: liabError, fetchLiabilities } = useLiabilities();
  const { transactions, loading: txLoading, error: txError, fetch } = useTransactions(now.getFullYear(), now.getMonth() + 1);

  useFocusEffect(useCallback(() => {
    fetchAssets();
    fetchLiabilities();
    fetch();
  }, []));

  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dateRange, setDateRange] = useState<DateRange>('1m');
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetInput, setResetInput] = useState('');

  const handleExport = () => {
    setExporting(true);
    setTimeout(() => {
      setExporting(false);
      setExported(true);
      setTimeout(() => setExported(false), 3000);
    }, 1500);
  };

  const handleReset = async () => {
    if (resetInput.toLowerCase() !== 'reset') return;
    setShowResetConfirm(false);
    setResetInput('');
    await flags.unsetPin();
    refreshGate();
    router.replace('/(auth)/welcome');
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Data & Storage" onBack={() => router.back()} />

      <ScrollView
        className="flex-1"
        contentContainerClassName="px-4 py-6"
        showsVerticalScrollIndicator={false}
      >
        {/* Storage Summary Card */}
        <View className="bg-card border border-border rounded-2xl p-5 mb-6">
          <View className="flex-row items-center gap-3 mb-5">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
              <Database size={20} color="#C5FF00" />
            </View>
            <Text className="text-lg font-semibold text-foreground">Storage Summary</Text>
          </View>

          <View className="flex-row">
            <View className="flex-1 bg-muted rounded-xl py-4 items-center">
              <Text className="text-2xl font-bold text-primary">{transactions.length}</Text>
              <Text className="text-xs text-muted-foreground mt-1">Transactions</Text>
            </View>
            <View className="w-3" />
            <View className="flex-1 bg-muted rounded-xl py-4 items-center">
              <Text className="text-2xl font-bold text-primary">{assets.length}</Text>
              <Text className="text-xs text-muted-foreground mt-1">Assets</Text>
            </View>
            <View className="w-3" />
            <View className="flex-1 bg-muted rounded-xl py-4 items-center">
              <Text className="text-2xl font-bold text-primary">{liabilities.length}</Text>
              <Text className="text-xs text-muted-foreground mt-1">Liabilities</Text>
            </View>
          </View>
        </View>

        {/* Export Data Card */}
        <View className="bg-card border border-border rounded-2xl p-5 mb-6">
          <View className="flex-row items-center gap-3 mb-5">
            <View className="w-10 h-10 rounded-xl bg-primary/10 items-center justify-center">
              <Download size={20} color="#C5FF00" />
            </View>
            <Text className="text-lg font-semibold text-foreground">Export Data</Text>
          </View>

          {/* Format Selection */}
          <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Format
          </Text>
          <View className="flex flex-row gap-3 mb-5">
            {(['csv', 'pdf'] as ExportFormat[]).map((fmt) => (
              <Pressable
                key={fmt}
                onPress={() => setExportFormat(fmt)}
                className={`flex-1 flex flex-row items-center justify-center gap-2 py-4 rounded-2xl border ${
                  exportFormat === fmt
                    ? 'bg-primary border-primary'
                    : 'bg-muted border-border'
                }`}
              >
                <FileText size={18} color={exportFormat === fmt ? '#000' : '#a0a0a0'} />
                <Text className={`font-semibold text-sm ${exportFormat === fmt ? 'text-black' : 'text-muted-foreground'}`}>
                  {fmt.toUpperCase()}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Date Range Selection */}
          <Text className="text-xs font-medium text-muted-foreground uppercase tracking-wider mb-3">
            Date Range
          </Text>
          <View className="grid grid-cols-2 gap-3 mb-6">
            {(Object.keys(DATE_RANGE_LABELS) as DateRange[]).map((range) => (
              <Pressable
                key={range}
                onPress={() => setDateRange(range)}
                className={`py-3 px-4 rounded-xl text-sm border ${
                  dateRange === range
                    ? 'bg-primary/15 border-primary'
                    : 'bg-muted border-border'
                }`}
              >
                <Text className={`text-center font-medium ${dateRange === range ? 'text-primary' : 'text-muted-foreground'}`}>
                  {DATE_RANGE_LABELS[range]}
                </Text>
              </Pressable>
            ))}
          </View>

          {/* Export Button */}
          <Pressable
            onPress={handleExport}
            disabled={exporting}
            className={`py-4 rounded-2xl font-bold text-base flex flex-row items-center justify-center gap-2 ${
              exporting || exported ? 'bg-primary/70' : 'bg-primary'
            }`}
          >
            {exported ? (
              <>
                <Check size={22} color="#000" />
                <Text className="text-black font-bold">Exported!</Text>
              </>
            ) : exporting ? (
              <>
                <View className="w-5 h-5 border-2 border-black/40 border-t-black rounded-full animate-spin" />
                <Text className="text-black font-bold">Exporting...</Text>
              </>
            ) : (
              <>
                <Download size={22} color="#000" />
                <Text className="text-black font-bold">Export {exportFormat.toUpperCase()}</Text>
              </>
            )}
          </Pressable>
        </View>

        {/* Danger Zone Card */}
        <View className="bg-red-500/5 border border-red-500/20 rounded-2xl p-5 mb-6">
          <View className="flex-row items-center gap-3 mb-4">
            <View className="w-10 h-10 rounded-xl bg-red-500/10 items-center justify-center">
              <Trash2 size={20} color="#ff4444" />
            </View>
            <View>
              <Text className="text-base font-semibold text-red-400">Danger Zone</Text>
              <Text className="text-xs text-muted-foreground">Irreversible actions</Text>
            </View>
          </View>

          <View className="bg-red-500/10 rounded-xl p-4 mb-4">
            <View className="flex-row items-start gap-3">
              <AlertTriangle size={18} color="#ff4444" className="mt-0.5" />
              <View className="flex-1">
                <Text className="text-sm font-semibold text-red-400 mb-1">Reset App</Text>
                <Text className="text-xs text-muted-foreground leading-5">
                  This will permanently delete all your transactions, categories, settings and data. This action cannot be undone.
                </Text>
              </View>
            </View>
          </View>

          <Pressable
            onPress={() => setShowResetConfirm(true)}
            className="py-3.5 bg-red-500/15 border border-red-500/30 rounded-xl"
          >
            <Text className="text-red-400 font-semibold text-sm text-center">Reset All Data</Text>
          </Pressable>
        </View>

        {/* Footer spacing */}
        <View className="h-4" />
      </ScrollView>

      {/* Reset Confirmation Modal */}
      {showResetConfirm && (
        <View className="absolute inset-0 bg-black/80 z-50 flex items-center justify-center p-6">
          <View className="bg-card border border-border rounded-3xl p-6 w-full max-w-sm">
            {/* Icon */}
            <View className="w-20 h-20 bg-red-500/10 rounded-full items-center justify-center mx-auto mb-5">
              <AlertTriangle size={40} color="#ff4444" />
            </View>

            {/* Title & Description */}
            <View className="text-center mb-6">
              <Text className="text-xl font-bold text-foreground mb-2">Reset App?</Text>
              <Text className="text-sm text-muted-foreground leading-6">
                All data will be permanently deleted. Type <Text className="text-red-400 font-bold">{'"reset"'}</Text> to confirm.
              </Text>
            </View>

            {/* Input */}
            <TextInput
              value={resetInput}
              onChangeText={setResetInput}
              placeholder={'Type "reset"'}
              placeholderTextColor="#606060"
              className="w-full bg-background border border-border rounded-2xl px-4 py-4 text-center text-foreground font-mono text-base mb-5"
              autoCapitalize="none"
              autoCorrect={false}
            />

            {/* Buttons */}
            <View className="flex flex-row gap-3">
              <Pressable
                onPress={() => { setShowResetConfirm(false); setResetInput(''); }}
                className="flex-1 py-3.5 bg-muted border border-border rounded-2xl"
              >
                <Text className="text-foreground font-semibold text-sm text-center">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleReset}
                disabled={resetInput.toLowerCase() !== 'reset'}
                className={`flex-1 py-3.5 rounded-2xl ${resetInput.toLowerCase() === 'reset' ? 'bg-red-500' : 'bg-red-500/30'}`}
              >
                <Text className="text-white font-semibold text-sm text-center">Reset</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
    </SafeAreaView>
  );
}