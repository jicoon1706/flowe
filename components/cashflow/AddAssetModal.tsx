import { View, Text, Pressable, Modal, TextInput, ScrollView, Platform } from 'react-native';
import { useState, useEffect } from 'react';
import { X, Check, Calendar, ChevronDown, Plus } from 'lucide-react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Button } from '../ui/Button';
import { AccountSelector } from '../ui/AccountSelector';
import { useKeyboardHeight } from '../../src/hooks/useKeyboardHeight';

export interface NewAsset {
  name: string;
  type: string;
  icon: string;
  /** The asset's value *after* this edit — total, not the delta. */
  value: number;
  monthlyIncome: number;
  dateAcquired?: string;
  note?: string;
  /**
   * Set when the money for this asset comes out of one of the user's accounts:
   * the caller records a transfer of `contribution` from it, the same as
   * investing from the Transfer tab. Left unset for something already owned (a
   * house, a car), where nothing leaves an account today.
   */
  fundFromAccountId?: string;
  /**
   * How much money went *in* just now: the full value when the asset is being
   * created, or the top-up amount when an existing one is being added to. This
   * is what gets recorded against an account — never the running total, or
   * every edit would re-charge the whole balance.
   */
  contribution: number;
  /**
   * Physical amount held after this edit, for assets measured in something
   * other than ringgit (grams of gold). Undefined for the rest.
   */
  quantity?: number;
  /** Unit for `quantity`, e.g. 'g'. */
  unit?: string;
  /**
   * Month this value is recorded against, 'YYYY-MM-01'. The trend chart shows
   * the asset at this value from this month on, until a later month is
   * recorded — so August stays put when September is entered.
   */
  asOfMonth: string;
}

interface AddAssetModalProps {
  visible: boolean;
  onClose: () => void;
  onSubmit: (asset: NewAsset) => void;
  /**
   * The asset being edited. Deliberately not `NewAsset`: that shape carries
   * `contribution`, which describes an action, not a stored asset — the caller
   * has no such field to hand over.
   */
  initial?: {
    name: string;
    type: string;
    icon: string;
    value: number;
    monthlyIncome: number;
    dateAcquired?: string;
    note?: string;
    quantity?: number;
    unit?: string;
  } | null;
  /** Accounts the asset can be funded from. Empty hides the funding option. */
  accounts?: { id: string; name: string; balance: string; color: string }[];
  /**
   * Month the entry defaults to — the one the user is looking at on the Cash
   * Flow screen, so adding while viewing August records August.
   */
  defaultAsOf?: Date;
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

/**
 * Asset types that are held as a physical amount as well as a ringgit value.
 *
 * Gold is bought in ringgit (RM 100 at a time, usually the minimum) but what
 * you hold is a weight, and the rate moves between purchases — so the grams
 * have to be entered per top-up rather than derived from the value.
 */
const UNIT_FOR_TYPE: Record<string, string> = {
  gold: 'g',
};

const ACCENT = '#C5FF00';

/** Reads a possibly-empty numeric field, treating blank as zero. */
const num = (v: string) => parseFloat(v) || 0;

/** Trims trailing zeros so 1.5000 g reads as 1.5 g. */
const fmtQty = (n: number) => Number(n.toFixed(4)).toString();

export function AddAssetModal({ visible, onClose, onSubmit, initial, accounts = [], defaultAsOf }: AddAssetModalProps) {
  const isEditing = !!initial;
  const keyboardHeight = useKeyboardHeight();
  const [name, setName] = useState('');
  const [type, setType] = useState(ASSET_TYPES[0].value);
  const [value, setValue] = useState('');
  const [monthlyIncome, setMonthlyIncome] = useState('');
  const [dateAcquired, setDateAcquired] = useState<Date | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  // Which month this value belongs to in the history. Only the month matters;
  // the day is whatever the picker hands back.
  const [asOf, setAsOf] = useState<Date>(() => defaultAsOf ?? new Date());
  const [showAsOfPicker, setShowAsOfPicker] = useState(false);
  const [note, setNote] = useState('');
  // Physical amount held — only ever shown for a type with a unit (gold).
  const [quantity, setQuantity] = useState('');
  // A top-up: money added to an asset that already exists. Kept apart from
  // `value` so the running total is never retyped from memory, which is how a
  // balance quietly loses a month's contribution.
  const [topUp, setTopUp] = useState('');
  const [topUpQuantity, setTopUpQuantity] = useState('');
  // Funding this out of an account — off by default, because plenty of assets
  // are already owned and no money moves when they're first recorded.
  const [fundFromAccount, setFundFromAccount] = useState(false);
  const [fundAccountId, setFundAccountId] = useState('');

  const unit = UNIT_FOR_TYPE[type];
  // What the asset will be worth once this form is saved.
  const newTotal = num(value) + (isEditing ? num(topUp) : 0);
  const newQuantity = unit ? num(quantity) + (isEditing ? num(topUpQuantity) : 0) : undefined;
  // Money actually moving today: the whole value for a new asset, only the
  // top-up for one that already exists.
  const contribution = isEditing ? num(topUp) : num(value);
  // Nothing to charge an account for unless money is moving.
  const canFund = accounts.length > 0 && contribution > 0;

  const parseIso = (iso: string): Date | null => {
    if (!iso) return null;
    const [y, m, d] = iso.split('-').map(Number);
    const dt = new Date(y, (m ?? 1) - 1, d ?? 1);
    return isNaN(dt.getTime()) ? null : dt;
  };

  const MONTHS_SHORT = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const formatDisplayDate = (d: Date) =>
    `${d.getDate()} ${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  const formatMonth = (d: Date) => `${MONTHS_SHORT[d.getMonth()]} ${d.getFullYear()}`;
  const toMonthStart = (d: Date) =>
    `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-01`;

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
        setQuantity(initial.quantity != null ? fmtQty(initial.quantity) : '');
        setMonthlyIncome(initial.monthlyIncome ? String(initial.monthlyIncome) : '');
        setDateAcquired(parseIso(initial.dateAcquired ?? ''));
        setNote(initial.note ?? '');
      } else {
        setName('');
        setType(ASSET_TYPES[0].value);
        setValue('');
        setQuantity('');
        setMonthlyIncome('');
        setDateAcquired(null);
        setNote('');
      }
      setTopUp('');
      setTopUpQuantity('');
      setFundFromAccount(false);
      setFundAccountId('');
      setAsOf(defaultAsOf ?? new Date());
      setShowAsOfPicker(false);
    }
  }, [visible, initial, defaultAsOf]);

  const reset = () => {
    setName('');
    setType(ASSET_TYPES[0].value);
    setValue('');
    setQuantity('');
    setMonthlyIncome('');
    setDateAcquired(null);
    setNote('');
    setTopUp('');
    setTopUpQuantity('');
    setFundFromAccount(false);
    setFundAccountId('');
    setAsOf(defaultAsOf ?? new Date());
    setShowAsOfPicker(false);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  const handleSubmit = () => {
    if (!canSubmit) return;
    const selected = ASSET_TYPES.find((t) => t.value === type) ?? ASSET_TYPES[0];
    onSubmit({
      name: name.trim(),
      type,
      icon: selected.icon,
      value: newTotal,
      quantity: newQuantity,
      unit,
      monthlyIncome: num(monthlyIncome),
      dateAcquired: dateAcquired ? toIsoDate(dateAcquired) : undefined,
      asOfMonth: toMonthStart(asOf),
      note: note.trim() || undefined,
      contribution,
      fundFromAccountId: canFund && fundFromAccount ? fundAccountId : undefined,
    });
    reset();
  };

  const canSubmit =
    name.trim().length > 0 &&
    value.length > 0 &&
    // Funding was asked for but no account picked yet — nothing to take it from.
    (!canFund || !fundFromAccount || !!fundAccountId);

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
        <Pressable
          className="bg-card rounded-t-3xl max-h-[90%]"
          // A modal has its own window, which Android's adjustResize doesn't
          // touch — without this the field being typed into sits under the
          // keyboard.
          style={{ paddingBottom: keyboardHeight ? keyboardHeight : undefined }}
        >
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
            <Text className="text-sm font-semibold text-foreground mb-2">
              {isEditing ? 'Current Value (RM)' : 'Value (RM)'}
            </Text>
            <TextInput
              value={value}
              onChangeText={setValue}
              placeholder="0.00"
              placeholderTextColor="#6b7280"
              keyboardType="decimal-pad"
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-4"
            />

            {/* Value as of — which month on the trend this value belongs to. */}
            <Text className="text-sm font-semibold text-foreground mb-2">Value as of</Text>
            <Pressable
              onPress={() => setShowAsOfPicker((v) => !v)}
              className="flex-row items-center gap-3 bg-background border border-border rounded-xl px-4 py-3 mb-1"
            >
              <Calendar size={18} color="#a0a0a0" />
              <Text className="flex-1 text-foreground">{formatMonth(asOf)}</Text>
              <ChevronDown size={18} color="#a0a0a0" />
            </Pressable>
            <Text className="text-xs text-muted-foreground mb-4">
              The trend chart uses this value from {formatMonth(asOf)} onward. Earlier months keep what
              you recorded before.
            </Text>
            {showAsOfPicker && (
              <View className="mb-4">
                <DateTimePicker
                  value={asOf}
                  mode="date"
                  maximumDate={new Date()}
                  display={Platform.OS === 'ios' ? 'spinner' : 'default'}
                  onChange={(event, date) => {
                    if (Platform.OS === 'android') {
                      setShowAsOfPicker(false);
                      if (event.type === 'set' && date) setAsOf(date);
                    } else if (date) {
                      setAsOf(date);
                    }
                  }}
                  style={{ height: 216 }}
                />
                {Platform.OS === 'ios' && (
                  <Button
                    title="Done"
                    onPress={() => setShowAsOfPicker(false)}
                    variant="primary"
                    size="md"
                    className="mt-2"
                  />
                )}
              </View>
            )}

            {/* Weight, for an asset held as a physical amount. */}
            {unit && (
              <>
                <Text className="text-sm font-semibold text-foreground mb-2">
                  {isEditing ? `Current Weight (${unit})` : `Weight (${unit})`}
                </Text>
                <TextInput
                  value={quantity}
                  onChangeText={setQuantity}
                  placeholder="0.00"
                  placeholderTextColor="#6b7280"
                  keyboardType="decimal-pad"
                  className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-4"
                />
              </>
            )}

            {/* Top-up — the whole point of reopening an asset: this month's
                contribution goes on top of what's already there, so nobody has
                to add it up in their head and retype the total. */}
            {isEditing && (
              <View className="bg-background border border-border rounded-2xl p-4 mb-4">
                <View className="flex-row items-center gap-2 mb-1">
                  <Plus size={16} color={ACCENT} />
                  <Text className="text-sm font-semibold text-foreground">Add to this asset</Text>
                </View>
                <Text className="text-xs text-muted-foreground mb-3">
                  A new contribution. Leave blank if you&apos;re only correcting the value above.
                </Text>

                <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
                  Amount (RM)
                </Text>
                <TextInput
                  value={topUp}
                  onChangeText={setTopUp}
                  placeholder="0.00"
                  placeholderTextColor="#6b7280"
                  keyboardType="decimal-pad"
                  className="bg-card border border-border rounded-xl px-4 py-3 text-foreground mb-3"
                />

                {unit && (
                  <>
                    <Text className="text-xs text-muted-foreground font-medium uppercase tracking-wider mb-1.5">
                      Weight bought ({unit})
                    </Text>
                    <TextInput
                      value={topUpQuantity}
                      onChangeText={setTopUpQuantity}
                      placeholder="0.00"
                      placeholderTextColor="#6b7280"
                      keyboardType="decimal-pad"
                      className="bg-card border border-border rounded-xl px-4 py-3 text-foreground mb-1"
                    />
                    <Text className="text-[11px] text-muted-foreground mb-3">
                      The rate moves between purchases, so enter what this
                      contribution actually bought.
                    </Text>
                  </>
                )}

                {(num(topUp) > 0 || num(topUpQuantity) > 0) && (
                  <View className="border-t border-border pt-3">
                    <Text className="text-xs text-muted-foreground">New total</Text>
                    <Text className="text-base font-bold" style={{ color: ACCENT }}>
                      RM {newTotal.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                      {unit && newQuantity ? `  ·  ${fmtQty(newQuantity)} ${unit}` : ''}
                    </Text>
                  </View>
                )}
              </View>
            )}

            {/* Funding — money moved out of an account into this asset, the
                same thing a transfer into an asset does. Off for an asset the
                user already owns, and hidden entirely when nothing is moving. */}
            {canFund && (
              <>
                <Pressable
                  onPress={() => setFundFromAccount((v) => !v)}
                  className="flex-row items-center gap-3 mb-3"
                >
                  <View
                    className="w-5 h-5 rounded-md items-center justify-center border"
                    style={{
                      backgroundColor: fundFromAccount ? ACCENT : 'transparent',
                      borderColor: fundFromAccount ? ACCENT : '#3a3a3a',
                    }}
                  >
                    {fundFromAccount && <Check size={14} color="#000000" />}
                  </View>
                  <View className="flex-1">
                    <Text className="text-sm font-semibold text-foreground">
                      {isEditing ? 'Take this top-up from an account' : 'Pay for this from an account'}
                    </Text>
                    <Text className="text-xs text-muted-foreground">
                      Records a transfer of RM{' '}
                      {contribution.toLocaleString('en-US', { minimumFractionDigits: 2 })} out of
                      that account. Leave off if you already own it.
                    </Text>
                  </View>
                </Pressable>

                {fundFromAccount && (
                  <AccountSelector
                    value={fundAccountId}
                    onChange={setFundAccountId}
                    label="From Account"
                    accounts={accounts}
                  />
                )}
              </>
            )}

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
