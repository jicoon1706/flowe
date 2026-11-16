import { View } from 'react-native';
import { useRouter } from 'expo-router';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ArrowRight } from 'lucide-react-native';
import { BrandMark } from '@/components/ui/BrandMark';
import { Button } from '@/components/ui/Button';
import { GradientFill } from '@/components/ui/GradientFill';
import { IconButton } from '@/components/ui/IconButton';
import { PhotoSlot } from '@/components/ui/PhotoSlot';
import { Text } from '@/components/ui/Text';

/** (auth)/welcome — full gradient, hero photo, one primary: Get Started. */
export default function Welcome() {
  const router = useRouter();
  const insets = useSafeAreaInsets();
  const start = () => router.push('/(auth)/create-pin');
  return (
    <View style={{ flex: 1 }}>
      <GradientFill />
      <PhotoSlot photo="welcomeHero" style={{ position: 'absolute', left: 0, right: 0, top: 260, height: 520 }} />
      <View style={{ paddingTop: insets.top + 24, paddingHorizontal: 24, gap: 24 }}>
        <BrandMark size={28} wordmark />
        <Text variant="display-lg" tone="inverse" accessibilityRole="header">Know where every ringgit flows</Text>
      </View>
      <View style={{ flex: 1 }} />
      <View style={{ flexDirection: 'row', gap: 8, paddingHorizontal: 24, paddingBottom: insets.bottom + 32 }}>
        <Button label="Get Started" variant="white" onPress={start} style={{ flex: 1 }} />
        <IconButton icon={ArrowRight} accessibilityLabel="Get started" onPress={start} />
      </View>
    </View>
  );
}
