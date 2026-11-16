import { View } from 'react-native';
import { ArrowRight, Sprout } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { formatRM } from '@/src/lib/money';
import { GradientFill } from '../ui/GradientFill';
import { Money } from '../ui/Money';
import { Text } from '../ui/Text';

export interface DiagramBox {
  label: string;
  amount: number;
  detail: string;
}

export interface CashFlowDiagramProps {
  income: DiagramBox;
  expenses: DiagramBox;
  assets: DiagramBox;
  liabilities: DiagramBox;
  /** Asset income line (e.g. "ASB dividends"). */
  assetFlow?: string | null;
  /** Liability payment line (e.g. "PTPTN RM 150/mo"). */
  liabilityFlow?: string | null;
  passiveIncome: number;
  totalExpenses: number;
}

/** Restyled cash flow diagram (m-cashflow-diagram): #F5F5F5 boxes, cobalt arrows, no category colours. Read-only. */
export function CashFlowDiagram(p: CashFlowDiagramProps) {
  const box = (b: DiagramBox) => (
    <View style={{ flex: 1, borderRadius: radius.md, backgroundColor: colors['surface-container'], paddingVertical: 12, paddingHorizontal: 14, gap: 4 }}>
      <Text variant="label-sm" tone="meta">{b.label}</Text>
      <Money amount={b.amount} on="grey" weight={600} />
      <Text variant="caption" tone="meta" numberOfLines={2}>{b.detail}</Text>
    </View>
  );
  const flow = (text: string) => (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6, height: 28 }}>
      <ArrowRight size={18} color={colors['primary-container']} strokeWidth={1.75} />
      <Text variant="caption" tone="muted">{text}</Text>
    </View>
  );
  const label = `Cash flow diagram: income ${formatRM(p.income.amount)} to expenses ${formatRM(p.expenses.amount)}; assets ${formatRM(p.assets.amount)} feeding income; liabilities ${formatRM(p.liabilities.amount)} feeding expenses.`;
  return (
    <View style={{ gap: 14 }}>
      <View accessible accessibilityRole="image" accessibilityLabel={label} style={{ gap: 4 }}>
        <Text variant="label-sm" tone="muted">Income statement</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>{box(p.income)}{box(p.expenses)}</View>
        <View style={{ flexDirection: 'row', gap: 8 }}>
          <View style={{ flex: 1 }}>{p.assetFlow ? flow(p.assetFlow) : null}</View>
          <View style={{ flex: 1 }}>{p.liabilityFlow ? flow(p.liabilityFlow) : null}</View>
        </View>
        <Text variant="label-sm" tone="muted">Balance sheet</Text>
        <View style={{ flexDirection: 'row', gap: 8 }}>{box(p.assets)}{box(p.liabilities)}</View>
      </View>
      <View style={{ borderRadius: radius.md, overflow: 'hidden', padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 }}>
        <GradientFill />
        <View style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.glass, alignItems: 'center', justifyContent: 'center' }}>
          <Sprout size={19} color={colors['on-primary']} strokeWidth={1.75} />
        </View>
        <Text variant="body-md" tone="inverse" style={{ flex: 1 }}>
          {p.passiveIncome > 0
            ? `Your assets pay ${formatRM(p.passiveIncome)} a month. Grow that line to pass your ${formatRM(p.totalExpenses)} expenses.`
            : `None of your assets pay you yet. Income-producing assets are what eventually cover your ${formatRM(p.totalExpenses)} expenses.`}
        </Text>
      </View>
    </View>
  );
}
