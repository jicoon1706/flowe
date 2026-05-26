import { useState } from 'react';
import { View, Text, TextInput, Pressable, ScrollView } from 'react-native';
import { Feather } from '@expo/vector-icons';
import DateTimePicker from '@react-native-community/datetimepicker';
import type { DraftTabung } from '../../src/types/onboarding';
import { TABUNG_ICONS, type TabungIcon } from '../../constants/banks';

const ICON_EMOJI: Record<TabungIcon, string> = {
  piggy: '🐷',
  coin: '🪙',
  home: '🏠',
  gift: '🎁',
  car: '🚗',
  rocket: '🚀',
  palm: '🌴',
  building: '🏢',
  train: '🚆',
  target: '🎯',
};

interface TabungFormProps {
  onAdd: (draft: DraftTabung) => void;
  linkedBankIds?: string[];
}

export function TabungForm({ onAdd, linkedBankIds = [] }: TabungFormProps) {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState<TabungIcon>('piggy');
  const [target, setTarget] = useState('');
  const [fromDate, setFromDate] = useState(new Date());
  const [toDate, setToDate] = useState(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
  const [linkedBankId, setLinkedBankId] = useState<string>('');
  const [showFromPicker, setShowFromPicker] = useState(false);
  const [showToPicker, setShowToPicker] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  function validate(): boolean {
    const e: Record<string, string> = {};
    if (!name.trim()) e.name = 'Please enter a name';
    const t = parseFloat(target);
    if (!target || isNaN(t) || t <= 0) e.target = 'Target must be greater than 0';
    if (toDate < fromDate) e.toDate = 'End date must be after start date';
    setErrors(e);
    return Object.keys(e).length === 0;
  }

  function submit() {
    if (!validate()) return;
    onAdd({
      kind: 'tabung',
      name: name.trim(),
      icon,
      target: parseFloat(target),
      fromDate: fromDate.toISOString().split('T')[0],
      toDate: toDate.toISOString().split('T')[0],
      linkedBankId: linkedBankId || undefined,
    });
    setName('');
    setIcon('piggy');
    setTarget('');
    setFromDate(new Date());
    setToDate(new Date(Date.now() + 365 * 24 * 60 * 60 * 1000));
    setLinkedBankId('');
    setErrors({});
  }

  function formatDate(d: Date) {
    return d.toLocaleDateString('en-MY', { day: '2-digit', month: 'short', year: 'numeric' });
  }

  return (
    <ScrollView className="gap-4" showsVerticalScrollIndicator={false}>
      {/* Icon picker */}
      <View>
        <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-2">Icon</Text>
        <View className="flex-row flex-wrap gap-2">
          {TABUNG_ICONS.map((ic) => (
            <Pressable
              key={ic}
              onPress={() => setIcon(ic)}
              className={`w-12 h-12 rounded-xl items-center justify-center ${
                icon === ic ? 'bg-primary/20 border-2 border-primary' : 'bg-card border border-border'
              }`}
            >
              <Text className="text-2xl">{ICON_EMOJI[ic]}</Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Name */}
      <View>
        <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Tabung Name</Text>
        <TextInput
          value={name}
          onChangeText={setName}
          placeholder="e.g. Umrah Fund, Holiday Trip"
          placeholderTextColor="#a0a0a0"
          maxLength={30}
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
        />
        {errors.name && <Text className="text-xs text-red-400 mt-1">{errors.name}</Text>}
      </View>

      {/* Target */}
      <View>
        <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Target Amount (RM)</Text>
        <TextInput
          value={target}
          onChangeText={(v) => setTarget(v.replace(/[^0-9.]/g, ''))}
          placeholder="0.00"
          placeholderTextColor="#a0a0a0"
          keyboardType="decimal-pad"
          maxLength={12}
          className="bg-card border border-border rounded-xl px-4 py-3 text-foreground"
        />
        {errors.target && <Text className="text-xs text-red-400 mt-1">{errors.target}</Text>}
      </View>

      {/* From date */}
      <View>
        <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Start Date</Text>
        <Pressable onPress={() => setShowFromPicker(true)} className="bg-card border border-border rounded-xl px-4 py-3 flex-row items-center justify-between">
          <Text className="text-foreground">{formatDate(fromDate)}</Text>
          <Feather name="calendar" size={16} color="#a0a0a0" />
        </Pressable>
        {showFromPicker && (
          <DateTimePicker
            value={fromDate}
            mode="date"
            onChange={(_, d) => { setShowFromPicker(false); if (d) setFromDate(d); }}
          />
        )}
      </View>

      {/* To date */}
      <View>
        <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">Target Date</Text>
        <Pressable onPress={() => setShowToPicker(true)} className="bg-card border border-border rounded-xl px-4 py-3 flex-row items-center justify-between">
          <Text className="text-foreground">{formatDate(toDate)}</Text>
          <Feather name="calendar" size={16} color="#a0a0a0" />
        </Pressable>
        {errors.toDate && <Text className="text-xs text-red-400 mt-1">{errors.toDate}</Text>}
        {showToPicker && (
          <DateTimePicker
            value={toDate}
            mode="date"
            minimumDate={fromDate}
            onChange={(_, d) => { setShowToPicker(false); if (d) setToDate(d); }}
          />
        )}
      </View>

      <Pressable
        onPress={submit}
        className="bg-primary rounded-2xl py-3.5 flex-row items-center justify-center gap-2 active:opacity-90"
      >
        <Feather name="plus" size={18} color="#000" />
        <Text className="text-primary-foreground font-bold">Add Account</Text>
      </Pressable>
    </ScrollView>
  );
}