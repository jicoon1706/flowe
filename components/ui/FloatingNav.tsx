import { Pressable, View } from 'react-native';
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { CalendarDays, ChartPie, House, Plus, Settings2, type LucideIcon } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { centeredPadding, TABLET_WIDTH, useBreakpoint } from '@/src/hooks/useBreakpoint';

export type NavKey = 'home' | 'cashflow' | 'add' | 'calendar' | 'settings';

const ITEMS: { key: NavKey; label: string; icon: LucideIcon }[] = [
  { key: 'home', label: 'Home', icon: House },
  { key: 'cashflow', label: 'Cashflow', icon: ChartPie },
  { key: 'add', label: 'Add transaction', icon: Plus },
  { key: 'calendar', label: 'Calendar', icon: CalendarDays },
  { key: 'settings', label: 'Settings', icon: Settings2 },
];

export interface FloatingNavProps {
  active: NavKey | null;
  onNavigate: (key: NavKey) => void;
}

/**
 * Floating #EFEFEF pill inset 24 from the edges; the active item is a black
 * circle with a white icon. The list fades out under it (white fade, 120 px).
 */
export function FloatingNav({ active, onNavigate }: FloatingNavProps) {
  const insets = useSafeAreaInsets();
  const bottom = Math.max(24, insets.bottom + 8);
  const { isTablet, width } = useBreakpoint();
  // Tablet: the pill (and its centre + key) stays centred at a phone-like width.
  const inset = isTablet ? centeredPadding(width, TABLET_WIDTH.nav, 24) : 24;
  return (
    <View pointerEvents="box-none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0, height: 96 + bottom }}>
      <Svg pointerEvents="none" style={{ position: 'absolute', left: 0, right: 0, bottom: 0 }} width="100%" height={96 + bottom}>
        <Defs>
          <LinearGradient id="navFade" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor={colors.surface} stopOpacity={0} />
            <Stop offset="0.55" stopColor={colors.surface} stopOpacity={1} />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#navFade)" />
      </Svg>
      <View
        accessibilityRole="tablist"
        style={{
          position: 'absolute',
          left: inset,
          right: inset,
          bottom,
          height: 60,
          borderRadius: 9999,
          backgroundColor: colors['surface-container-high'],
          paddingHorizontal: 4,
          flexDirection: 'row',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}
      >
        {ITEMS.map(({ key, label, icon: Icon }) => {
          const on = key === active;
          return (
            <Pressable
              key={key}
              onPress={() => onNavigate(key)}
              accessibilityRole="tab"
              accessibilityLabel={label}
              accessibilityState={{ selected: on }}
              style={({ pressed }) => ({
                width: 52,
                height: 52,
                borderRadius: 9999,
                backgroundColor: on ? colors.secondary : 'transparent',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: pressed ? 0.7 : 1,
              })}
            >
              <Icon size={22} color={on ? colors['on-secondary'] : colors['on-surface']} strokeWidth={1.75} />
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}
