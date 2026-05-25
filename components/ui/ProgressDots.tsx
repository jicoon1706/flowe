import { View } from 'react-native';

export function ProgressDots({ total, active }: { total: number; active: number }) {
  return (
    <View className="flex-row gap-2 px-6 pt-4">
      {Array.from({ length: total }).map((_, i) => (
        <View
          key={i}
          className={`h-1 flex-1 rounded-full ${i === active ? 'bg-primary' : 'bg-muted'}`}
        />
      ))}
    </View>
  );
}