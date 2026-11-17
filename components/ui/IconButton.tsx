import { View, type StyleProp, type ViewStyle } from "react-native";
import { Pressable } from "@/components/ui/Pressable";
import type { LucideIcon } from "lucide-react-native";
import { colors } from "@/theme/tokens";

export interface IconButtonProps {
  icon: LucideIcon;
  onPress?: () => void;
  accessibilityLabel: string;
  /** 'white' = 52 white circle (on gradient); 'action' = #EFEFEF pill (Transfer); 'black' = 52 black circle. */
  variant?: 'white' | 'action' | 'black';
  size?: 52 | 44;
  /** Wider pill (60) for the ⇅ between Add and Scan. */
  wide?: boolean;
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}

/** Icon-only circle or pill (button-icon-circle / the ⇅ action pill). */
export function IconButton({ icon: Icon, onPress, accessibilityLabel, variant = 'white', size = 52, wide, disabled, style }: IconButtonProps) {
  const fill = variant === 'white' ? colors.surface : variant === 'black' ? colors.secondary : colors['surface-container-high'];
  const ink = variant === 'black' ? colors['on-secondary'] : colors['on-surface'];
  return (
    <Pressable
      onPress={disabled ? undefined : onPress}
      disabled={!!disabled}
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      accessibilityState={{ disabled: !!disabled }}
      style={({ pressed }) => [
        {
          width: wide ? 60 : size,
          height: size,
          borderRadius: 9999,
          backgroundColor: fill,
          alignItems: 'center',
          justifyContent: 'center',
          opacity: pressed ? 0.8 : disabled ? 0.5 : 1,
        },
        style,
      ]}
    >
      <View>
        <Icon size={wide ? 20 : 22} color={ink} strokeWidth={1.75} />
      </View>
    </Pressable>
  );
}
