import { View, Text } from 'react-native';

interface BadgeProps {
  label: string;
  variant?: 'default' | 'primary' | 'success' | 'warning' | 'danger';
}

const variantStyles = {
  default: 'bg-secondary text-foreground',
  primary: 'bg-primary/10 text-primary border border-primary/20',
  success: 'bg-income/10 text-income',
  warning: 'bg-yellow-500/10 text-yellow-500',
  danger: 'bg-destructive/10 text-destructive',
};

export function Badge({ label, variant = 'default' }: BadgeProps) {
  return (
    <View className={`px-2 py-0.5 rounded-full ${variantStyles[variant]}`}>
      <Text className="text-xs font-medium">{label}</Text>
    </View>
  );
}