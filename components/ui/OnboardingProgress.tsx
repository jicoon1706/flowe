import { View, Text } from 'react-native';
import { Feather } from '@expo/vector-icons';

export function OnboardingProgress({ step }: { step: 1 | 2 }) {
  return (
    <View className="flex-row items-center px-6 pt-4 gap-3">
      <View className={`w-7 h-7 rounded-full items-center justify-center ${step >= 1 ? 'bg-primary' : 'bg-muted'}`}>
        {step > 1
          ? <Feather name="check" size={16} color="#000" />
          : <Text className="text-primary-foreground font-bold">1</Text>}
      </View>
      <Text className={`${step === 1 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>Your Name</Text>
      <View className={`h-0.5 flex-1 rounded-full ${step >= 2 ? 'bg-primary' : 'bg-muted'}`} />
      <View className={`w-7 h-7 rounded-full items-center justify-center ${step >= 2 ? 'bg-primary' : 'bg-muted'}`}>
        <Text className={step >= 2 ? 'text-primary-foreground font-bold' : 'text-muted-foreground font-bold'}>2</Text>
      </View>
      <Text className={`${step === 2 ? 'text-foreground font-semibold' : 'text-muted-foreground'}`}>Accounts</Text>
    </View>
  );
}