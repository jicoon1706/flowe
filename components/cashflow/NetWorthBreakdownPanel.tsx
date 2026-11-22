import { View } from 'react-native';
import { colors, radius } from '@/theme/tokens';
import { assetTypeOption } from '@/constants/balanceSheetTypes';
import type { NetWorthBreakdown } from '@/src/types';
import { Money } from '../ui/Money';
import { Text } from '../ui/Text';

/** Types drawn with a "New" tag (mn-networth-breakdown). */
const NEW_TYPES = new Set(['gold', 'kwsp']);

/** "Assets by type" on the hero when Breakdown is open (mn-networth-breakdown, t-mn-networth-breakdown). */
export function NetWorthBreakdownPanel({ data, masked = false }: { data: NetWorthBreakdown; masked?: boolean }) {
  const names = data.liabilities.map((l) => l.name).join(', ');
  return (
    <View style={{ alignSelf: 'stretch', backgroundColor: colors['glass-faint'], borderRadius: radius.md, paddingVertical: 14, paddingHorizontal: 16, gap: 10 }}>
      <Text variant="label-sm" tone="soft">Assets by type</Text>
      {data.groups.map((g) => {
        const label = g.key === 'cash' ? 'Cash in accounts' : assetTypeOption(g.key).label;
        const pct = g.share_pct.toFixed(1);
        return (
          <View key={g.key} style={{ gap: 6 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
              <View style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                <Text variant="body-md" size={13} tone="inverse">{label}</Text>
                {NEW_TYPES.has(g.key) ? (
                  <View style={{ height: 20, paddingHorizontal: 7, borderRadius: 9999, backgroundColor: colors.surface, justifyContent: 'center' }}>
                    <Text variant="caption" weight={600} style={{ color: colors.primary }}>New</Text>
                  </View>
                ) : null}
              </View>
              <Money amount={g.total} variant="body-md" size={13} weight={600} on="gradient" masked={masked} />
              <Text variant="label-sm" weight={400} tone="soft" tabular style={{ width: 44, textAlign: 'right' }}>{pct}%</Text>
            </View>
            <View accessible accessibilityRole="image" accessibilityLabel={`${label}: ${pct}% of assets`} style={{ height: 6, borderRadius: 9999, backgroundColor: colors.glass }}>
              <View style={{ width: `${g.share_pct}%`, height: 6, borderRadius: 9999, backgroundColor: colors['on-primary'] }} />
            </View>
          </View>
        );
      })}
      <View style={{ height: 1, backgroundColor: colors.glass }} />
      <Line label="Total assets" amount={data.total_assets} masked={masked} />
      {data.liabilities.length ? <Line label={`Liabilities · ${names}`} amount={-data.total_liabilities} masked={masked} /> : null}
      <Line label="Net worth" amount={data.net_worth} strong masked={masked} />
    </View>
  );
}

function Line({ label, amount, strong = false, masked }: { label: string; amount: number; strong?: boolean; masked: boolean }) {
  return (
    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' }}>
      <Text variant="body-md" size={13} weight={strong ? 600 : 500} tone="inverse">{label}</Text>
      <Money amount={amount} variant="body-md" size={strong ? 14 : 13} weight={strong ? 600 : 500} on="gradient" masked={masked} />
    </View>
  );
}
