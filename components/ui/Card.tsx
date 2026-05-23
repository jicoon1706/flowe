import { View, ViewProps } from 'react-native';

interface CardProps extends ViewProps {
  variant?: 'default' | 'gradient';
}

export function Card({ className = '', variant = 'default', children, ...props }: CardProps) {
  return (
    <View
      className={`
        ${variant === 'gradient' ? 'bg-gradient-to-br from-card via-card to-secondary' : 'bg-card'}
        border border-border rounded-2xl p-5
        ${className}
      `}
      {...props}
    >
      {children}
    </View>
  );
}