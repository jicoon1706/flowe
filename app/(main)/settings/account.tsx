import { View, Text, TextInput, Pressable } from 'react-native';
import { useState } from 'react';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { User } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { useSettings } from '@/context/SettingsContext';

export default function AccountScreen() {
  const router = useRouter();
  const { state, dispatch } = useSettings();
  const [name, setName] = useState(state.profile.displayName);

  const handleSave = () => {
    dispatch({ type: 'UPDATE_PROFILE', payload: { displayName: name } });
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Account" onBack={() => router.back()} />
      <View className="flex-1 px-4 pt-4">
        {/* Avatar */}
        <View className="items-center mb-8">
          <View className="w-24 h-24 rounded-2xl bg-primary items-center justify-center mb-3">
            <User size={40} color="#000000" />
          </View>
          <Text className="text-sm text-muted-foreground">Tap to change photo</Text>
        </View>

        {/* Form */}
        <View className="bg-card border border-border rounded-2xl p-5">
          <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
            Display Name
          </Text>
          <View className="bg-input-background border border-border rounded-xl px-4 py-3">
            <TextInput
              value={name}
              onChangeText={setName}
              maxLength={30}
              className="text-base text-foreground outline-none"
              placeholderTextColor="#a0a0a0"
            />
          </View>
        </View>

        {/* Save Button */}
        <Pressable
          onPress={handleSave}
          className="bg-primary text-primary-foreground rounded-2xl py-4 items-center mt-6 active:scale-[0.98] transition-transform"
        >
          <Text className="text-base font-bold text-black">Save</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}