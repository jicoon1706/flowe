import { useState } from 'react';
import { View, Text, Pressable, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Download, AlertTriangle, Database, FileText, Check, X } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { useSettings } from '@/context/SettingsContext';

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
  const { dispatch } = useSettings();

  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');
  const [dateRange, setDateRange] = useState<DateRange>('3m');
  const [exporting, setExporting] = useState(false);
  const [exported, setExported] = useState(false);
  const [showResetConfirm, setShowResetConfirm] = useState(false);
  const [resetInput, setResetInput] = useState('');

  const handleExport = () => {};
  const handleReset = () => {};

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Data" onBack={() => router.back()} />
      <View className="flex-1 px-4 pt-4">
        <View className="bg-card border border-border rounded-2xl p-5 mb-6">
          <Pressable
            onPress={handleExport}
            className="flex-row items-center gap-3 py-3"
          >
            <Download size={20} color="#a0a0a0" />
            <View className="flex-1">
              <Text className="text-foreground text-sm font-medium">Export Data</Text>
              <Text className="text-muted-foreground text-xs">Download all your data as JSON</Text>
            </View>
          </Pressable>
        </View>

        <View className="bg-card border border-border rounded-2xl p-5">
          <Pressable
            onPress={handleReset}
            className="flex-row items-center gap-3 py-3"
          >
            <AlertTriangle size={20} color="#ff4444" />
            <View className="flex-1">
              <Text className="text-destructive text-sm font-medium">Reset App</Text>
              <Text className="text-muted-foreground text-xs">Delete all data and start fresh</Text>
            </View>
          </Pressable>
        </View>
      </View>
    </SafeAreaView>
  );
}