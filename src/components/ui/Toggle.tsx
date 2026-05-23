import React from 'react';
import { TouchableOpacity, View, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

interface ToggleProps {
  value: boolean;
  onValueChange: (value: boolean) => void;
  disabled?: boolean;
}

export function Toggle({ value, onValueChange, disabled = false }: ToggleProps) {
  return (
    <TouchableOpacity
      onPress={() => onValueChange(!value)}
      disabled={disabled}
      activeOpacity={0.8}
    >
      <View style={[styles.toggle, value && styles.toggleOn, disabled && styles.toggleDisabled]}>
        <View style={[styles.toggleDot, value && styles.toggleDotOn]} />
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  toggle: {
    width: 44,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.border,
    justifyContent: 'center',
    padding: 2,
  },
  toggleOn: {
    backgroundColor: Colors.dark.tint,
  },
  toggleDisabled: {
    opacity: 0.5,
  },
  toggleDot: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: Colors.dark.textSecondary,
  },
  toggleDotOn: {
    backgroundColor: Colors.dark.darkBg,
    alignSelf: 'flex-end',
  },
});
