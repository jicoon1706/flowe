import { useState } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Switch } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Check } from '../../../../components/ui/icons';

const ICONS = ['🐷', '💰', '🏠', '🎁', '🚗', '🚀', '🌴', '🏢', '🚂', '🎯', '💎', '⭐'];
const COLORS = ['#6bcf7f', '#ffd93d', '#00d4ff', '#C5FF00', '#f472b6', '#a78bfa', '#34d399', '#fb923c'];

const TEMPLATE_DEFAULTS: Record<string, { name: string; emoji: string; color: string }> = {
  tabungRaya: { name: 'Tabung Raya', emoji: '🎉', color: '#6bcf7f' },
  emergency: { name: 'Emergency Fund', emoji: '🛡️', color: '#ffd93d' },
  holiday: { name: 'Holiday', emoji: '✈️', color: '#00d4ff' },
  gadget: { name: 'New Gadget', emoji: '📱', color: '#C5FF00' },
  downPayment: { name: 'Down Payment', emoji: '🏠', color: '#6bcf7f' },
  custom: { name: '', emoji: '🐷', color: '#6bcf7f' },
};

export default function TabungFormScreen() {
  const router = useRouter();
  const { template } = useLocalSearchParams<{ template?: string }>();
  const templateKey = template || 'custom';
  const defaults = TEMPLATE_DEFAULTS[templateKey] || TEMPLATE_DEFAULTS.custom;

  const [name, setName] = useState(defaults.name);
  const [target, setTarget] = useState('');
  const [date, setDate] = useState('');
  const [selectedIcon, setSelectedIcon] = useState(defaults.emoji);
  const [selectedColor, setSelectedColor] = useState(defaults.color);
  const [autoSave, setAutoSave] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  // Calculate weeks and weekly needed
  const targetNum = parseFloat(target.replace(/,/g, '') || '0');
  const weeks = date ? Math.ceil((new Date(date).getTime() - Date.now()) / (7 * 24 * 60 * 60 * 1000)) : 0;
  const weeklyNeeded = weeks > 0 && targetNum > 0 ? targetNum / weeks : 0;

  const canCreate = name.trim().length > 0 && targetNum > 0;

  const handleCreate = () => {
    if (!canCreate) return;
    setShowSuccess(true);
    setTimeout(() => {
      router.replace('/');
    }, 2000);
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text className="text-xl font-semibold text-foreground">New Tabung</Text>
      </View>

      {showSuccess ? (
        <View className="flex-1 items-center justify-center">
          <View className="w-20 h-20 rounded-full bg-primary/20 items-center justify-center mb-4">
            <Check size={40} color="#C5FF00" />
          </View>
          <Text className="text-xl font-bold text-foreground mb-2">Tabung Created!</Text>
          <Text className="text-sm text-muted-foreground text-center px-8">
            Save RM {weeklyNeeded.toFixed(2)} weekly to reach your goal
          </Text>
          <Pressable
            onPress={() => router.push('/')}
            className="mt-6 bg-primary rounded-2xl px-6 py-3"
          >
            <Text className="text-primary-foreground font-semibold">Back to Home</Text>
          </Pressable>
        </View>
      ) : (
        <>
          <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4">
            {/* Live Preview */}
            <View
              className="mt-4 rounded-2xl p-5 border"
              style={{ borderColor: selectedColor + '40', backgroundColor: '#2a2a2a' }}
            >
              <View className="flex-row items-center mb-3">
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center mr-3"
                  style={{ backgroundColor: selectedColor + '20' }}
                >
                  <Text className="text-2xl">{selectedIcon}</Text>
                </View>
                <View>
                  <Text className="text-sm font-medium text-foreground">
                    {name || 'New Tabung'}
                  </Text>
                  <Text className="text-xs text-muted-foreground">
                    {target ? `RM ${target}` : 'RM 0'}
                  </Text>
                </View>
              </View>
              <View className="h-2 bg-muted rounded-full overflow-hidden">
                <View
                  className="h-full rounded-full"
                  style={{ width: '10%', backgroundColor: selectedColor }}
                />
              </View>
            </View>

            {/* Form Fields */}
            <View className="mt-4">
              <Text className="text-xs text-muted-foreground mb-1">Name</Text>
              <TextInput
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground mb-4"
                placeholder="Tabung name"
                placeholderTextColor="#888"
                value={name}
                onChangeText={setName}
              />
            </View>

            <View>
              <Text className="text-xs text-muted-foreground mb-1">Target Amount (RM)</Text>
              <TextInput
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground mb-4"
                placeholder="0.00"
                placeholderTextColor="#888"
                keyboardType="numeric"
                value={target}
                onChangeText={setTarget}
              />
            </View>

            <View>
              <Text className="text-xs text-muted-foreground mb-1">Target Date</Text>
              <TextInput
                className="bg-card border border-border rounded-xl px-4 py-3 text-foreground mb-2"
                placeholder="YYYY-MM-DD"
                placeholderTextColor="#888"
                value={date}
                onChangeText={setDate}
              />
              {weeklyNeeded > 0 && (
                <Text className="text-xs text-muted-foreground mb-4">
                  Save RM {weeklyNeeded.toFixed(2)} weekly ({weeks} weeks)
                </Text>
              )}
            </View>

            {/* Icon Picker */}
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground mb-2">Icon</Text>
              <View className="flex-row flex-wrap">
                {ICONS.map((icon) => (
                  <Pressable
                    key={icon}
                    onPress={() => setSelectedIcon(icon)}
                    className={`w-12 h-12 rounded-xl items-center justify-center m-1 ${
                      selectedIcon === icon ? 'bg-primary/20 border-2 border-primary' : 'bg-card'
                    }`}
                  >
                    <Text className="text-xl">{icon}</Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Color Picker */}
            <View className="mb-4">
              <Text className="text-xs text-muted-foreground mb-2">Color</Text>
              <View className="flex-row flex-wrap">
                {COLORS.map((color) => (
                  <Pressable
                    key={color}
                    onPress={() => setSelectedColor(color)}
                    className="w-10 h-10 rounded-full m-1 items-center justify-center"
                    style={{
                      backgroundColor: color,
                      borderWidth: selectedColor === color ? 3 : 0,
                      borderColor: '#fff',
                    }}
                  />
                ))}
              </View>
            </View>

            {/* Auto-save Toggle */}
            <View className="flex-row items-center justify-between mb-6">
              <View>
                <Text className="text-sm text-foreground">Auto-save</Text>
                <Text className="text-xs text-muted-foreground">Monthly automatic savings</Text>
              </View>
              <Switch
                value={autoSave}
                onValueChange={setAutoSave}
                trackColor={{ false: '#404040', true: '#C5FF00' }}
                thumbColor="#fff"
              />
            </View>
          </ScrollView>

          {/* Create Button */}
          <View className="px-4 pb-6">
            <Pressable
              onPress={handleCreate}
              disabled={!canCreate}
              className={`rounded-2xl py-3 items-center ${
                canCreate ? 'bg-primary' : 'bg-muted'
              }`}
            >
              <Text
                className={`text-sm font-semibold ${
                  canCreate ? 'text-primary-foreground' : 'text-muted-foreground'
                }`}
              >
                Create Tabung
              </Text>
            </Pressable>
          </View>
        </>
      )}
    </SafeAreaView>
  );
}