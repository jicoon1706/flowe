import type { ReactNode, ReactElement } from 'react';
import type { RefreshControlProps } from 'react-native';
import { useRouter } from 'expo-router';
import { HeroScreen } from '../ui/HeroScreen';
import { Text } from '../ui/Text';
import { TopBar } from '../ui/TopBar';

export interface SettingsScreenProps {
  title: string;
  children: ReactNode;
  overlay?: ReactNode;
  refreshControl?: ReactElement<RefreshControlProps>;
}

/** Settings sub-screen frame (G2…G15): short gradient with back + display-md title, white sheet. */
export function SettingsScreen({ title, children, overlay, refreshControl }: SettingsScreenProps) {
  const router = useRouter();
  return (
    <HeroScreen
      heroHeight={180}
      overlay={overlay}
      refreshControl={refreshControl}
      sheetPadding={{ top: 20 }}
      contentWidth="form"
      hero={
        <>
          <TopBar onBack={() => router.back()} />
          <Text variant="display-md" tone="inverse" style={{ paddingHorizontal: 24, marginTop: 12 }} accessibilityRole="header">{title}</Text>
        </>
      }
    >
      {children}
    </HeroScreen>
  );
}
