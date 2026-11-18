import { Pressable, View } from 'react-native';
import { ArrowLeft, ChevronDown, Info, RefreshCw } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { CLASS_LABEL, type FinancialClass } from '@/src/lib/cashflow';
import { Button } from '../ui/Button';
import { GlassChip } from '../ui/GlassChip';
import { GlassIconButton } from '../ui/GlassIconButton';
import { Money } from '../ui/Money';
import { Skeleton } from '../ui/Skeleton';
import { Text } from '../ui/Text';

export interface NetWorthHeroProps {
  monthLabel: string;
  onBack: () => void;
  onMonth: () => void;
  onInfo: () => void;
  onClass: () => void;
  data: { netWorth: number; assets: number; liabilities: number; cls: FinancialClass; coverage: number | null } | null;
  loading: boolean;
  onRetry?: (() => void) | null;
  masked?: boolean;
}

/** "{class} · n× coverage", or "· No debts" without liabilities. */
export function classChipLabel(cls: FinancialClass, coverage: number | null): string {
  return `${CLASS_LABEL[cls]} · ${coverage === null ? 'No debts' : `${coverage}× coverage`}`;
}

/** Net worth hero (ins-cashflow): month pill, net worth, class chip, Assets | Liabilities. Sits inside the gradient. */
export function NetWorthHero({ monthLabel, onBack, onMonth, onInfo, onClass, data, loading, onRetry, masked }: NetWorthHeroProps) {
  const stat = (label: string, amount: number | null) => (
    <View style={{ flex: 1, minWidth: 0, backgroundColor: colors.glass, borderRadius: radius.md, paddingVertical: 12, paddingHorizontal: 16, gap: 6 }}>
      <Text variant="label-sm" weight={400} tone="soft">{label}</Text>
      {amount === null ? <Skeleton height={16} width={96} tone="glass" /> : <Money amount={amount} on="gradient" variant="body-lg" weight={600} masked={masked} />}
    </View>
  );
  return (
    <View style={{ gap: 20, paddingBottom: 12 }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 16 }}>
        <GlassIconButton icon={ArrowLeft} accessibilityLabel="Back" onPress={onBack} />
        <Pressable
          onPress={onMonth}
          accessibilityRole="button"
          accessibilityLabel={`Month: ${monthLabel}. Change month`}
          style={{ height: 44, paddingHorizontal: 16, borderRadius: 9999, backgroundColor: colors.glass, flexDirection: 'row', alignItems: 'center', gap: 6 }}
        >
          <Text variant="body-md" weight={500} tone="inverse">{monthLabel}</Text>
          <ChevronDown size={16} color={colors['on-primary']} strokeWidth={1.75} />
        </Pressable>
        <GlassIconButton icon={Info} accessibilityLabel="Cashflow info" onPress={onInfo} />
      </View>

      {onRetry ? (
        <View style={{ alignItems: 'center', gap: 12, paddingHorizontal: 24, paddingVertical: 24 }}>
          <Text variant="headline-md" tone="inverse" align="center">Couldn’t load this month</Text>
          <Text variant="body-md" tone="soft" align="center">Your transactions are safe. We couldn’t total them just now.</Text>
          <Button label="Try again" icon={RefreshCw} variant="white" onPress={onRetry} />
        </View>
      ) : (
        <>
          <View style={{ alignItems: 'center', gap: 10, paddingHorizontal: 16 }}>
            <Text variant="body-md" tone="soft">Net worth</Text>
            {loading || !data ? (
              <>
                <Skeleton height={48} width={220} radius={radius.sm} tone="glass" />
                <Skeleton height={32} width={180} tone="glass" />
              </>
            ) : (
              <>
                <Money amount={data.netWorth} on="gradient" variant="numeric-lg" smallCurrency masked={masked} />
                <GlassChip label={classChipLabel(data.cls, data.coverage)} align="center" onPress={onClass} accessibilityLabel={`${classChipLabel(data.cls, data.coverage)}. See cash flow patterns`} />
              </>
            )}
          </View>
          <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 12 }}>
            {stat('Assets', loading || !data ? null : data.assets)}
            {stat('Liabilities', loading || !data ? null : data.liabilities)}
          </View>
        </>
      )}
    </View>
  );
}
