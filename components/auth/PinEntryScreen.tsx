import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CircleAlert } from 'lucide-react-native';
import { GlassChip } from '../ui/GlassChip';
import { GradientFill } from '../ui/GradientFill';
import { PinDots } from '../ui/PinDots';
import { PinPad } from '../ui/PinPad';
import { Text } from '../ui/Text';
import { TopBar } from '../ui/TopBar';

export interface PinEntryScreenProps {
  title: string;
  subtitle: string;
  pin: string;
  onChange: (pin: string) => void;
  onBack?: () => void;
  /** Glass chip under the dots (mismatch / wrong PIN). Never red. */
  error?: string | null;
  errorKey?: number;
  /** Step label in the top bar ("Step 1 of 3"). */
  step?: string;
  disabled?: boolean;
}

/** Full gradient PIN screen: back, title, 6 dots, glass numpad (B2–B4, G4). */
export function PinEntryScreen({ title, subtitle, pin, onChange, onBack, error, errorKey, step, disabled }: PinEntryScreenProps) {
  const insets = useSafeAreaInsets();
  return (
    <View style={{ flex: 1, paddingTop: insets.top + 12, paddingBottom: insets.bottom + 40 }}>
      <GradientFill />
      <TopBar onBack={onBack} title={step} />
      <View style={{ alignItems: 'center', paddingHorizontal: 24, marginTop: 48, gap: 8 }}>
        <Text variant="display-md" tone="inverse" align="center" accessibilityRole="header">{title}</Text>
        <Text variant="body-md" tone="soft" align="center">{subtitle}</Text>
        <View style={{ marginTop: 32 }}><PinDots length={pin.length} errorKey={errorKey} /></View>
        {error ? <View style={{ marginTop: 12 }}><GlassChip icon={CircleAlert} role="alert" label={error} /></View> : null}
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ paddingHorizontal: 32 }}>
        <PinPad value={pin} onChange={onChange} disabled={disabled} />
      </View>
    </View>
  );
}
