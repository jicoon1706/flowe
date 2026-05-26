import { useState } from 'react';
import { View, Text, TextInput, Pressable } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { OnboardingProgress } from '../../components/ui/OnboardingProgress';
import { useOnboarding } from '../../context/OnboardingContext';

export default function Name() {
  const { state, dispatch } = useOnboarding();
  const [value, setValue] = useState(state.name);
  const router = useRouter();
  const trimmed = value.trim();
  const enabled = trimmed.length > 0;

  function next() {
    if (!enabled) return;
    dispatch({ type: 'SET_NAME', name: trimmed });
    router.push('/(onboarding)/accounts');
  }

  return (
    <SafeAreaView className="flex-1 bg-background">
      <OnboardingProgress step={1} />
      <View className="flex-1 px-6 max-w-md mx-auto w-full">
        <View className="items-center mt-8 mb-6">
          <View className="w-20 h-20 rounded-2xl bg-secondary items-center justify-center">
            <Text className="text-4xl">👋</Text>
          </View>
        </View>
        <Text className="text-foreground text-3xl font-bold text-center">What should we{'\n'}call you?</Text>
        <Text className="text-muted-foreground text-sm text-center mt-2">We&apos;ll use your name to personalise your experience</Text>
        <View className="bg-card border-2 border-primary rounded-2xl mt-8 flex-row items-center px-4">
          <TextInput
            value={value}
            onChangeText={setValue}
            placeholder="e.g. Ahmad, Siti, Lee..."
            placeholderTextColor="#a0a0a0"
            maxLength={30}
            autoCapitalize="words"
            autoFocus
            className="flex-1 text-foreground text-lg py-4"
          />
          {value.length > 0 && (
            <Pressable onPress={() => setValue('')} className="p-2">
              <Feather name="x" size={18} color="#a0a0a0" />
            </Pressable>
          )}
        </View>
        <Text className="text-muted-foreground/70 text-xs text-center mt-3">This is stored only on your device</Text>
      </View>
      <View className="px-6 pb-8">
        <Pressable
          onPress={next}
          disabled={!enabled}
          className={`rounded-2xl py-4 flex-row items-center justify-center gap-2 ${enabled ? 'bg-primary active:opacity-90' : 'bg-muted'}`}
        >
          <Text className={`font-bold ${enabled ? 'text-primary-foreground' : 'text-muted-foreground'}`}>Next</Text>
          <Feather name="chevron-right" size={20} color={enabled ? '#000' : '#a0a0a0'} />
        </Pressable>
      </View>
    </SafeAreaView>
  );
}