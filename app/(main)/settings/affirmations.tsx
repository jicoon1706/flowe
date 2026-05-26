import { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Heart, Plus, X } from 'lucide-react-native';
import { ScreenHeader } from '../../../components/ui/ScreenHeader';
import { Chip } from '../../../components/ui/Chip';
import { Toggle } from '../../../components/ui/Toggle';
import { useAuth } from '../../../context/AuthContext';
import { useAffirmations } from '../../../src/hooks/useAffirmations';
import { affirmationsRepository } from '../../../src/repositories/affirmations.repository';
import { supabase } from '../../../src/lib/supabase';
import { LoadingView } from '../../../components/ui/LoadingView';
import { ErrorView } from '../../../components/ui/ErrorView';

const CATEGORIES = ['All', 'Saving', 'Investing', 'Mindset', 'Awareness'] as const;
const CATEGORY_TO_DB: Record<string, string> = {
  All: 'all', Saving: 'saving', Investing: 'investing', Mindset: 'mindset', Awareness: 'awareness',
};
const DB_TO_CATEGORY: Record<string, typeof CATEGORIES[number]> = {
  all: 'All', saving: 'Saving', investing: 'Investing', mindset: 'Mindset', awareness: 'Awareness',
};

export default function AffirmationsScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { userAffirmations, loading, error, fetchUserAffirmations, addUserAffirmation } = useAffirmations();
  const [showOnHome, setShowOnHome] = useState(false);
  const [dailyReminder, setDailyReminder] = useState('08:00');
  const [categoryPreference, setCategoryPreference] = useState<string>('All');
  const [words, setWords] = useState<{ id: string; text: string; category: string }[]>([]);
  const [inputText, setInputText] = useState('');

  useEffect(() => {
    if (user) fetchUserAffirmations(user.id);
  }, [user, fetchUserAffirmations]);

  useEffect(() => {
    setWords(userAffirmations.map(w => ({ id: w.id, text: w.text, category: w.category })));
  }, [userAffirmations]);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('settings')
      .select('show_affirmations, daily_reminder_time, affirmation_category')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (!data) return;
        setShowOnHome(!!data.show_affirmations);
        if (data.daily_reminder_time) setDailyReminder(String(data.daily_reminder_time).slice(0, 5));
        if (data.affirmation_category) setCategoryPreference(DB_TO_CATEGORY[data.affirmation_category] ?? 'All');
      });
  }, [user]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView error={error} onRetry={() => user && fetchUserAffirmations(user.id)} />;

  const persist = async (patch: Record<string, any>) => {
    if (!user) return;
    await supabase.from('settings').update({ ...patch, updated_at: new Date().toISOString() }).eq('user_id', user.id);
  };

  const update = (patch: { showOnHome?: boolean; dailyReminder?: string; categoryPreference?: string }) => {
    if (patch.showOnHome !== undefined) {
      setShowOnHome(patch.showOnHome);
      persist({ show_affirmations: patch.showOnHome });
    }
    if (patch.dailyReminder !== undefined) {
      setDailyReminder(patch.dailyReminder);
      if (/^\d{2}:\d{2}$/.test(patch.dailyReminder)) persist({ daily_reminder_time: patch.dailyReminder + ':00' });
    }
    if (patch.categoryPreference !== undefined) {
      setCategoryPreference(patch.categoryPreference);
      persist({ affirmation_category: CATEGORY_TO_DB[patch.categoryPreference] ?? 'all' });
    }
  };

  const addWord = async () => {
    if (!inputText.trim() || !user) return;
    const catUi = categoryPreference === 'All' ? 'Mindset' : categoryPreference;
    const cat = (CATEGORY_TO_DB[catUi] ?? 'mindset') as any;
    const result = await addUserAffirmation(user.id, inputText.trim(), cat);
    if (result.ok) {
      setInputText('');
      await fetchUserAffirmations(user.id);
    } else {
      Alert.alert('Failed to add', result.error.message);
    }
  };

  const removeWord = async (id: string) => {
    setWords(prev => prev.filter(w => w.id !== id));
    const result = await affirmationsRepository.removeUserAffirmation(id);
    if (!result.ok) {
      Alert.alert('Failed to remove', result.error.message);
      if (user) await fetchUserAffirmations(user.id);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      <ScreenHeader title="Affirmations" onBack={() => router.back()} />
      <View className="flex-1 px-4 pt-4">
        <View className="bg-card border border-border rounded-2xl p-5 mb-6">
          {/* Show on Home */}
          <View className="flex-row items-center justify-between py-3">
            <View className="flex-row items-center gap-3">
              <Heart size={20} color="#a0a0a0" />
              <Text className="text-foreground text-base">Show on Home</Text>
            </View>
            <Toggle
              value={showOnHome}
              onValueChange={v => update({ showOnHome: v })}
            />
          </View>

          <View className="border-t border-border my-1" />

          {/* Daily Reminder */}
          <View className="py-3">
            <Text className="text-foreground text-base mb-2">Daily Reminder</Text>
            <View className="flex-row items-center gap-2">
              <View className="bg-input-background border border-border rounded-xl px-4 py-2">
                <TextInput
                  value={dailyReminder}
                  onChangeText={v => update({ dailyReminder: v })}
                  className="text-foreground text-sm outline-none"
                  placeholder="08:00"
                  placeholderTextColor="#a0a0a0"
                  maxLength={5}
                />
              </View>
              <Text className="text-xs text-muted-foreground">HH:MM</Text>
            </View>
          </View>

          <View className="border-t border-border my-1" />

          {/* Category Preference */}
          <View className="py-3">
            <Text className="text-foreground text-base mb-3">Category Preference</Text>
            <View className="flex-row flex-wrap gap-2">
              {CATEGORIES.map(cat => (
                <Chip
                  key={cat}
                  label={cat}
                  selected={categoryPreference === cat}
                  onPress={() => update({ categoryPreference: cat })}
                />
              ))}
            </View>
          </View>
        </View>

        {/* Add Affirmation Input */}
        <View className="bg-card border border-border rounded-2xl p-5 mb-6">
          <View className="py-3">
            <Text className="text-foreground text-base mb-3">Affirmation Words</Text>
            <View className="flex-row items-center gap-2">
              <View className="flex-1 bg-input-background border border-border rounded-xl px-4 py-2">
                <TextInput
                  value={inputText}
                  onChangeText={setInputText}
                  className="text-foreground text-sm outline-none"
                  placeholder="Add affirmation..."
                  placeholderTextColor="#a0a0a0"
                />
              </View>
              <TouchableOpacity onPress={addWord} className="bg-primary rounded-xl p-3">
                <Plus size={20} color="#000" />
              </TouchableOpacity>
            </View>
          </View>

          <View className="border-t border-border my-1" />

          {/* Words List */}
          <View className="py-3">
            <Text className="text-foreground text-base mb-3">Your Affirmations</Text>
            <View className="flex-row flex-wrap gap-2">
              {words.map(word => (
                <View
                  key={word.id}
                  className="bg-card border border-border rounded-xl px-3 py-2 flex-row items-start gap-2"
                  style={{ width: '100%' }}
                >
                  <Text className="text-foreground text-sm flex-1 flex-shrink" style={{ flexShrink: 1 }}>
                    {word.text}
                  </Text>
                  <View className="bg-primary/20 rounded-lg px-2 py-0.5 shrink-0">
                    <Text className="text-primary text-xs">{word.category}</Text>
                  </View>
                  <TouchableOpacity onPress={() => removeWord(word.id)} className="ml-1 shrink-0">
                    <X size={14} color="#a0a0a0" />
                  </TouchableOpacity>
                </View>
              ))}
            </View>
          </View>
        </View>
      </View>
    </SafeAreaView>
  );
}