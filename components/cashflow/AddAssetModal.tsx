import { View, Text, Pressable, Modal, TextInput, ScrollView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { X, Check, Calendar, ChevronDown } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../ui/Button';

export interface NewAsset {
  name: string;
  type: string;
  icon: string;
  value: number;
  monthlyIncome: number;
  dateAcquired?: string;
  note?: string;
}

interface AddAssetModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (asset: NewAsset) => void;
  initial?: NewAsset | null;
}

const ASSET_TYPES = [
  { value: 'real_estate', label: 'Real Estate', icon: '🏠' },
  { value: 'stocks', label: 'Stocks / ETF', icon: '📈' },
  { value: 'unit_trust', label: 'Unit Trust', icon: '🛡️' },
  { value: 'fixed_deposit', label: 'Fixed Deposit', icon: '🏦' },
  { value: 'asb', label: 'ASB / ASB2', icon: '🐷' },
  { value: 'gold', label: 'Gold', icon: '🪙' },
  { value: 'vehicle', label: 'Vehicle', icon: '🚗' },
  { value: 'business', label: 'Business', icon: '💼' },
  { value: 'others', label: 'Others', icon: '📦' },
];

const ACCENT = '#C5FF00';

export function AddAssetModal({ visible, onClose, onSubmit, initial }: AddAssetModalProps) {
  const isEditing = !!initial;
  const [name, setName] = useState('');
  const [type, setType] = useState(ASSET_TYPES[0].value);
  const [value, setValue] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [dateAcquired, setDateAcquired] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState('');

  const parseIso = (iso: string): Date | null => {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatDisplayDate = (d: Date) =>
    `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;

  const toIsoDate = (d: Date) => {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${y}-${m}-${day}`;
  };

  useEffect(() => {
    if (visible) {
      if (initial) {
        setName(initial.name);
        setType(initial.type);
        setValue(String(initial.value));
        setMonthlyIncome(initial.monthlyIncome ? String(initial.monthlyIncome) : '');
        setDateAcquired(parseIso(initial.dateAcquired ?? ''));
        setNote(initial.note ?? '');
      } else {
        setName('');
        setType(ASSET_TYPES[0].value);
        setValue('');
        setMonthlyIncome('');
        setDateAcquired(null);
        setNote('');
      }
    }
  }, [visible, initial]);

  const reset = () => {
    setName('');
    setType(ASSET_TYPES[0].label);
    setValue('');
    setMonthlyIncome('');
    setDateAcquired(null);
    setNote('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim() || !value) return;
    const selected = ASSET_TYPES.find((t) => t.value === type) ?? ASSET_TYPES[0];
    onSubmit({
      name: name.trim(),
      type,
      icon: selected.icon,
      value: parseFloat(value) || 0,
      monthlyIncome: parseFloat(monthlyIncome) || 0,
      dateAcquired: dateAcquired ? toIsoDate(dateAcquired) : undefined,
      note: note.trim() || undefined,
    });
    reset();
  };

  const canSubmit = name.trim().length > 0 && value.length > 0;

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={handleClose}
      statusBarTranslucent
      navigationBarTranslucent
    >
      <View className="flex-1 bg-black/60 justify-end">
        <Pressable className="flex-1" onPress={handleClose} />
        <Pressable className="bg-card rounded-t-3xl max-h-[90%]">
          <View className="w-12 h-1 bg-border rounded-full mx-auto mt-3 mb-2" />

          {/* Header */}
          <View className="flex-row items-center justify-between px-6 py-3">
            <Text className="text-lg font-bold text-foreground">{isEditing ? 'Edit Asset' : 'Add Asset'}</Text>
            <Pressable onPress={handleClose} className="p-1">
              <X size={22} color="#a0a0a0" />
            </Pressable>
          </View>

          <ScrollView
            className="px-6"
            contentContainerStyle={{ paddingBottom: 40 }}
            showsVerticalScrollIndicator={false}
            keyboardShouldPersistTaps="handled"
          >
            {/* Asset Name */}
            <Text className="text-sm font-semibold text-foreground mb-2">Asset Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Amanah Saham, Rumah Taman Melati"
              placeholderTextColor="#6b7280"
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-4"
            />

            {/* Asset Type */}
            <Text className="text-sm font-semibold text-foreground mb-2">Asset Type</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {ASSET_TYPES.map((t) => {
                const active = type === t.value;
                return (
                  <Pressable
                    key={t.value}
                    onPress={() => setType(t.value)}
                    className="flex-row items-center gap-1.5 px-3 py-2 rounded-full border"
                    style={{
                      backgroundColor: active ? ACCENT : '#00000033',
                      borderColor: active ? ACCENT : '#3a3a3a',
                    }}
                  >
                    <Text className="text-sm">{t.icon}</Text>
                    <Text
                      className="text-xs font-semibold"
                      style={{ color: active ? '#000000' : '#e5e5e5' }}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Current Value */}
            <Text className="text-sm font-semibold text-foreground mb-2">Current Value (RM)</Text>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="0.00"
              placeholderTextColor="#6b7280"
              keyboardType="decimal-pad"
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-4"
            />

            {/* Monthly Income */}
            <Text className="text-sm font-semibold text-foreground mb-2">
              Monthly Income from this asset{' '}
              <Text className="text-muted-foreground font-normal">(optional)</Text>
            </Text>
            <TextInput
              value={monthlyIncome}
              onChangeText={setMonthlyIncome}
              placeholder="e.g. rental income, dividend"
              placeholderTextColor="#6b7280"
              keyboardType="decimal-pad"
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-1"
            />
            <Text className="text-xs text-primary mb-4">
              This counts toward your passive income score
            </Text>

            {/* Date Acquired */}
            <Text className="text-sm font-semibold text-foreground mb-2">
              Date Acquired <Text className="text-muted-foreground font-normal">(optional)</Text>
            </Text>
            <Pressable
              onPress={() => setShowDatePicker(true)}
              className="flex-row items-center gap-3 bg-background border border-border rounded-xl px-4 py-3 mb-4"
            >
              <Calendar size={18} color="#a0a0a0" />
              <Text
                className="flex-1"
                style={{ color: dateAcquired ? '#ffffff' : '#6b7280' }}
              >
                {dateAcquired ? formatDisplayDate(dateAcquired) : 'dd/mm/yyyy'}
              </Text>
              <ChevronDown size={18} color="#a0a0a0" />
            </Pressable>

            {showDatePicker && (
              <View className="mb-4">
                <DateTimePicker
                  value={dateAcquired ?? new Date()}
                  mode="date"
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    if (Platform.OS === 'android') {
                      setShowDatePicker(false);
                      if (event.type === 'set' && date) setDateAcquired(date);
                    } else if (date) {
                      setDateAcquired(date);
                    }
                  }}
                  style={{ height: 216 }}
                />
                {Platform.OS === 'ios' && (
                  <View className="flex-row gap-2 mt-2">
                    <Button
                      title="Clear"
                      onPress={() => {
                        setDateAcquired(null);
                        setShowDatePicker(false);
                      }}
                      variant="secondary"
                      size="md"
                      className="flex-1"
                    />
                    <Button
                      title="Done"
                      onPress={() => setShowDatePicker(false)}
                      variant="primary"
                      size="md"
                      className="flex-1"
                    />
                  </View>
                )}
              </View>
            )}

            {/* Note */}
            <Text className="text-sm font-semibold text-foreground mb-2">
              Note <Text className="text-muted-foreground font-normal">(optional)</Text>
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Any notes about this asset"
              placeholderTextColor="#6b7280"
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-5"
            />

            {/* Submit */}
            <Pressable
              onPress={handleSubmit}
              disabled={!canSubmit}
              className="flex-row items-center justify-center gap-2 rounded-2xl py-4"
              style={{
                backgroundColor: canSubmit ? ACCENT : ACCENT + '40',
              }}
            >
              <Check size={18} color="#000000" />
              <Text className="text-base font-bold text-black">{isEditing ? 'Save Changes' : 'Add Asset'}</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </View>
    </Modal>
  );
}
