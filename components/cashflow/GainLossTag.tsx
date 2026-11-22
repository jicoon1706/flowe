import { View } from 'react-native';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react-native';
import { status } from '@/theme/tokens';
import type { GainLoss } from '@/src/lib/goldValuation';
import { gainLossText } from '@/src/lib/assetDisplay';
import { Text } from '../ui/Text';

/**
 * Gold's unrealised gain / loss: "−RM 375.00 · −5.4%" (mn-gold-filled,
 * t-mn-assets-saved). The only coloured tag in the product.
 */
export function GainLossTag({ gain }: { gain: GainLoss }) {
  const loss = gain.amount < 0;
  const fg = loss ? status['on-loss'] : status['on-gain'];
  const Arrow = loss ? ArrowDownRight : ArrowUpRight;
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, height: 22, paddingHorizontal: 8, borderRadius: 9999, backgroundColor: loss ? status['loss-container'] : status['gain-container'], alignSelf: 'flex-start' }}>
      <Arrow size={12} color={fg} strokeWidth={1.75} />
      <Text variant="label-sm" weight={600} tone="inherit" tabular style={{ color: fg }}>{gainLossText(gain)}</Text>
    </View>
  );
}
