import { View, Text, Pressable, Modal, TextInput, ScrollView } from 'react-native';
import { useState, useEffect } from 'react';
import { X, Check } from 'lucide-react-native';

export interface NewLiability {
  name: string;
  type: string;
  icon: string;
  amountOwed: number;
  monthlyPayment: number;
  interestRate?: number;
  note?: string;
}

interface AddLiabilityModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (liability: NewLiability) => void;
  initial?: NewLiability | null;
}

const LIABILITY_TYPES = [
  { value: 'mortgage', label: 'Mortgage', icon: '🏠' },
  { value: 'car_loan', label: 'Car Loan', icon: '🚗' },
  { value: 'credit_card', label: 'Credit Card', icon: '💳' },
  { value: 'study_loan', label: 'Study Loan', icon: '🎓' },
  { value: 'medical_loan', label: 'Medical Loan', icon: '💊' },
  { value: 'business_loan', label: 'Business Loan', icon: '💼' },
  { value: 'others', label: 'Others', icon: '📦' },
];

const ACCENT = '#ff6b6b';

export function AddLiabilityModal({ visible, onClose, onSubmit, initial }: AddLiabilityModalProps) {
  const isEditing = !!initial;
  const [name, setName] = useState('');
  const [type, setType] = useState(LIABILITY_TYPES[0].value);
  const [amountOwed, setAmountOwed] = useState('');
  const [monthlyPayment, setMonthlyPayment] = useState('');
  const [interestRate, setInterestRate] = useState('');
  const [note, setNote] = useState('');

  useEffect(() => {
    if (visible) {
      if (initial) {
        setName(initial.name);
        setType(initial.type);
        setAmountOwed(String(initial.amountOwed));
        setMonthlyPayment(String(initial.monthlyPayment));
        setInterestRate(initial.interestRate ? String(initial.interestRate) : '');
        setNote(initial.note ?? '');
      } else {
        setName('');
        setType(LIABILITY_TYPES[0].value);
        setAmountOwed('');
        setMonthlyPayment('');
        setInterestRate('');
        setNote('');
      }
    }
  }, [visible, initial]);

  const reset = () => {
    setName('');
    setType(LIABILITY_TYPES[0].value);
    setAmountOwed('');
    setMonthlyPayment('');
    setInterestRate('');
    setNote('');
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!name.trim() || !amountOwed || !monthlyPayment) return;
    const selected = LIABILITY_TYPES.find((t) => t.value === type) ?? LIABILITY_TYPES[0];
    onSubmit({
      name: name.trim(),
      type,
      icon: selected.icon,
      amountOwed: parseFloat(amountOwed) || 0,
      monthlyPayment: parseFloat(monthlyPayment) || 0,
      interestRate: interestRate ? parseFloat(interestRate) : undefined,
      note: note.trim() || undefined,
    });
    reset();
  };

  const canSubmit = name.trim().length > 0 && amountOwed.length > 0 && monthlyPayment.length > 0;

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
            <Text className="text-lg font-bold text-foreground">{isEditing ? 'Edit Liability' : 'Add Liability'}</Text>
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
            {/* Liability Name */}
            <Text className="text-sm font-semibold text-foreground mb-2">Liability Name</Text>
            <TextInput
              value={name}
              onChangeText={setName}
              placeholder="e.g. Housing Loan CIMB, Car Loan Maybank"
              placeholderTextColor="#6b7280"
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-4"
            />

            {/* Liability Type */}
            <Text className="text-sm font-semibold text-foreground mb-2">Liability Type</Text>
            <View className="flex-row flex-wrap gap-2 mb-4">
              {LIABILITY_TYPES.map((t) => {
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
                      style={{ color: active ? '#ffffff' : '#e5e5e5' }}
                    >
                      {t.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Total Amount Owed */}
            <Text className="text-sm font-semibold text-foreground mb-2">Total Amount Owed (RM)</Text>
            <TextInput
              value={amountOwed}
              onChangeText={setAmountOwed}
              placeholder="0.00"
              placeholderTextColor="#6b7280"
              keyboardType="decimal-pad"
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-4"
            />

            {/* Monthly Payment */}
            <Text className="text-sm font-semibold text-foreground mb-2">Monthly Payment (RM)</Text>
            <TextInput
              value={monthlyPayment}
              onChangeText={setMonthlyPayment}
              placeholder="0.00"
              placeholderTextColor="#6b7280"
              keyboardType="decimal-pad"
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-4"
            />

            {/* Interest Rate */}
            <Text className="text-sm font-semibold text-foreground mb-2">
              Interest Rate (%){' '}
              <Text className="text-muted-foreground font-normal">(optional)</Text>
            </Text>
            <TextInput
              value={interestRate}
              onChangeText={setInterestRate}
              placeholder="e.g. 4.2"
              placeholderTextColor="#6b7280"
              keyboardType="decimal-pad"
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-4"
            />

            {/* Note */}
            <Text className="text-sm font-semibold text-foreground mb-2">
              Note <Text className="text-muted-foreground font-normal">(optional)</Text>
            </Text>
            <TextInput
              value={note}
              onChangeText={setNote}
              placeholder="Any notes about this liability"
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
              <Check size={18} color="#ffffff" />
              <Text className="text-base font-bold text-white">{isEditing ? 'Save Changes' : 'Add Liability'}</Text>
            </Pressable>
          </ScrollView>
        </Pressable>
      </View>
    </Modal>
  );
}
