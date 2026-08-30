import { View, TextInput, Pressable } from 'react-native';
import { Search, X } from './icons';

interface SearchBarProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  className?: string;
}

/** Single-line filter input used by the calendar and account transaction lists. */
export function SearchBar({ value, onChangeText, placeholder = 'Search', className = '' }: SearchBarProps) {
  return (
    <View
      className={`flex-row items-center bg-card border border-border rounded-xl px-3 py-2.5 ${className}`}
    >
      <Search size={18} color="#a0a0a0" />
      <TextInput
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#6b7280"
        autoCorrect={false}
        autoCapitalize="none"
        returnKeyType="search"
        className="flex-1 ml-2 text-foreground p-0"
      />
      {value.length > 0 && (
        <Pressable onPress={() => onChangeText('')} hitSlop={8} className="ml-2">
          <X size={16} color="#a0a0a0" />
        </Pressable>
      )}
    </View>
  );
}
