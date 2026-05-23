import { Pressable, Text, View, ActivityIndicator } from 'react-native';

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'destructive';
type ButtonSize = 'sm' | 'md' | 'lg';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: ButtonVariant;
  size?: ButtonSize;
  disabled?: boolean;
  loading?: boolean;
  className?: string;
  icon?: React.ReactNode;
}

const variantClasses: Record<ButtonVariant, string> = {
  primary: 'bg-primary text-primary-foreground',
  secondary: 'bg-secondary text-foreground border border-border',
  ghost: 'bg-transparent text-muted-foreground',
  destructive: 'bg-destructive text-destructive-foreground',
};

const sizeClasses: Record<ButtonSize, string> = {
  sm: 'py-2 px-3 rounded-xl',
  md: 'py-3 px-4 rounded-2xl',
  lg: 'py-4 px-6 rounded-2xl',
};

export function Button({
  title,
  onPress,
  variant = 'primary',
  size = 'md',
  disabled = false,
  loading = false,
  className = '',
  icon,
}: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      accessible
      accessibilityLabel={title}
      accessibilityRole="button"
      className={`
        ${variantClasses[variant]}
        ${sizeClasses[size]}
        flex-row items-center justify-center gap-2
        ${disabled ? 'opacity-50 cursor-not-allowed' : 'active:scale-[0.98]'}
        transition-all
        ${className}
      `}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? '#000' : '#fff'} />
      ) : (
        <>
          {icon}
          <Text
            className={`
              text-base font-semibold
              ${variant === 'primary' ? 'text-primary-foreground' : ''}
              ${variant === 'secondary' || variant === 'ghost' ? 'text-foreground' : ''}
              ${variant === 'destructive' ? 'text-destructive-foreground' : ''}
            `}
          >
            {title}
          </Text>
        </>
      )}
    </Pressable>
  );
}