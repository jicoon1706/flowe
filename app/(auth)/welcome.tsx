import { View, Text, Pressable, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';

export default function Welcome() {
  const router = useRouter();
  return (
    <SafeAreaView className="flex-1 bg-background">
      <ScrollView contentContainerClassName="flex-1 px-6 max-w-md mx-auto w-full" showsVerticalScrollIndicator={false}>
        <View className="flex-1 items-center justify-center">
          <View className="w-20 h-20 rounded-2xl bg-primary items-center justify-center mb-8">
            <Feather name="credit-card" size={36} color="#000" />
          </View>
          <Text className="text-foreground text-4xl font-bold mb-2">Flowe</Text>
          <Text className="text-muted-foreground text-base mb-10">Your personal finance companion</Text>
          {[
            { icon: '💰', text: 'Track income & expenses effortlessly' },
            { icon: '📈', text: 'Build assets like the rich do' },
            { icon: '💎', text: 'Achieve financial freedom' },
          ].map((p) => (
            <View key={p.text} className="bg-card rounded-2xl px-4 py-3 mb-3 w-full flex-row items-center gap-3">
              <Text className="text-xl">{p.icon}</Text>
              <Text className="text-foreground text-sm">{p.text}</Text>
            </View>
          ))}
          <Text className="text-muted-foreground/60 text-xs italic mt-6">Inspired by Rich Dad Poor Dad</Text>
        </View>
        <Pressable
          onPress={() => router.push('/(auth)/create-pin')}
          className="bg-primary rounded-2xl py-4 mb-6 flex-row items-center justify-center gap-2 active:opacity-90"
        >
          <Text className="text-primary-foreground text-base font-bold">Get Started</Text>
          <Feather name="chevron-right" size={20} color="#000" />
        </Pressable>
      </ScrollView>
    </SafeAreaView>
  );
}