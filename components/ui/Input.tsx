import { TextInput, View, Text, TextInputProps } from 'react-native';

interface InputProps extends TextInputProps {
  label?: string;
  error?: string;
  icon?: React.ReactNode;
}

export function Input({ label, error, icon, className = '', ...props }: InputProps) {
  return (
    <View className="gap-1.5">
      {label && (
        <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider">
          {label}
        </Text>
      )}
      <View className="flex-row items-center bg-input-background border border-border rounded-xl px-4 py-3">
        {icon && <View className="mr-3">{icon}</View>}
        <TextInput
          className={`flex-1 text-base text-foreground placeholder:text-muted-foreground/50 outline-none ${className}`}
          placeholderTextColor="#a0a0a0"
          {...props}
        />
      </View>
      {error && <Text className="text-xs text-red-400 mt-1">{error}</Text>}
    </View>
  );
}