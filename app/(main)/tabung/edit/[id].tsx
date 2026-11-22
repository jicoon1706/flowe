import { useCallback, useEffect, useMemo, useState } from 'react';
import { BackHandler, Image, Platform, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { ArrowRight, CalendarDays, Check, Image as ImageIcon } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { TABUNG_GOALS } from '@/constants/tabungGoals';
import { AccountPill } from '@/components/ui/AccountPill';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { InlineError } from '@/components/ui/InlineError';
import { Pressable } from '@/components/ui/Pressable';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { TextInput } from '@/components/ui/TextInput';
import { TopBar } from '@/components/ui/TopBar';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useBreakpoint } from '@/src/hooks/useBreakpoint';
import { useTabungEdit } from '@/src/hooks/useTabungEdit';
import { useTabungProgress } from '@/src/hooks/useTabungProgress';
import { dayMonthYear } from '@/src/lib/assetDisplay';
import { formatRM, parseAmount } from '@/src/lib/money';
import {
  discardCopy,
  followTargetDate,
  isTabungEditDirty,
  monthLabel,
  progressPct,
  savedTowardGoal,
  tabungEditValues,
  validateTabungEdit,
  visibleEditErrors,
  type TabungEditErrors,
  type TabungEditValues,
  type TabungGoalType,
} from '@/src/lib/tabungEdit';
import { endOfMonth } from '@/src/lib/tabungPlan';
import { localYMD } from '@/src/utils/date';

/** Money as typed: up to 2 decimals, 9 integer digits. */
const cleanMoney = (raw: string) => raw.replace(/[^\d.]/g, '').replace(/^(\d{0,9}\.?\d{0,2}).*$/, '$1');
const text2 = (n: number | null) => (n === null ? '' : n.toFixed(2));
const ymdDate = (ymd: string) => { const [y, m, d] = ymd.split('-').map(Number); return new Date(y, m - 1, d); };

/** "Edited" beside a changed field's label (n-tabung-edit-dirty). */
function Edited() {
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
      <View style={{ width: 6, height: 6, borderRadius: 9999, backgroundColor: colors.secondary }} />
      <Text variant="caption" weight={600}>Edited</Text>
    </View>
  );
}

/**
 * Edit Tabung (n-tabung-edit, t-n-tabung-edit and their -dirty, -error,
 * -discard, -saving states; the phone draws goal pills and shorter date
 * pills): goal type, name, target, monthly top-up, dates
 * (target date follows target ÷ monthly top-up), cover photo. Back / Cancel
 * with changes asks to discard; a save returns to the Tabung with Undo.
 */
export default function EditTabungScreen() {
  const { id = '' } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { account, tabung, progress } = useTabungProgress(id);
  const edit = useTabungEdit(id);
  const { isTablet } = useBreakpoint();

  const initial = useMemo<TabungEditValues | null>(
    () => (account && tabung ? tabungEditValues({ ...tabung, name: account.name }) : null),
    [account, tabung],
  );
  const saved = tabung && progress ? savedTowardGoal(tabung.progress_mode ?? 'contributed', progress.contributed, progress.balance) : 0;

  const [goal, setGoal] = useState<TabungGoalType | null>(null);
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [monthly, setMonthly] = useState('');
  const [from, setFrom] = useState('');
  /** null = the target date follows target ÷ monthly; else the date picked. */
  const [pickedTo, setPickedTo] = useState<string | null>(null);
  const [cover, setCover] = useState<string | null>(null);
  const [coverSrc, setCoverSrc] = useState<{ path: string; url: string | null } | null>(null);
  const [uploaded, setUploaded] = useState<string[]>([]);
  const [picking, setPicking] = useState<'from' | 'to' | null>(null);
  const [askDiscard, setAskDiscard] = useState(false);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    if (!initial || loaded) return;
    setGoal(initial.goalType);
    setName(initial.name);
    setTarget(text2(initial.target));
    setMonthly(text2(initial.monthlyTopup));
    setFrom(initial.fromDate);
    setPickedTo(initial.toDate);
    setCover(initial.coverPath);
    setLoaded(true);
  }, [initial, loaded]);

  const { coverUrl } = edit;
  useEffect(() => {
    if (!cover) return;
    let live = true;
    coverUrl(cover).then((url) => { if (live) setCoverSrc({ path: cover, url }); });
    return () => { live = false; };
  }, [cover, coverUrl]);

  const t = target.trim() === '' ? null : parseAmount(target);
  const m = monthly.trim() === '' ? null : parseAmount(monthly);
  const toDate = initial ? pickedTo ?? followTargetDate({ target: t, monthlyTopup: m, fromDate: from, toDate: initial.toDate }) : '';
  const values: TabungEditValues = { goalType: goal, name, target: t, monthlyTopup: m, fromDate: from, toDate, coverPath: cover };
  const dirty = !!initial && loaded && isTabungEditDirty(initial, values);
  const changed = {
    name: !!initial && name.trim() !== initial.name.trim(),
    target: !!initial && t !== initial.target,
    monthlyTopup: !!initial && m !== initial.monthlyTopup,
  };
  const rules = loaded ? validateTabungEdit(values, saved) : {};
  const shown: TabungEditErrors = initial && loaded ? visibleEditErrors(initial, values, saved, edit.errors) : { ...edit.errors };
  const valid = Object.keys(rules).length === 0;
  const dateMoved = !!initial && toDate.slice(0, 7) !== initial.toDate.slice(0, 7);
  const follow = () => setPickedTo(null);

  const leave = useCallback(async () => {
    await Promise.all(uploaded.map((p) => edit.discardCover(p)));
    router.back();
  }, [uploaded, edit, router]);
  const close = useCallback(() => {
    if (dirty) { setAskDiscard(true); return true; }
    router.back();
    return true;
  }, [dirty, router]);
  useFocusEffect(useCallback(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', close);
    return () => sub.remove();
  }, [close]));

  const save = async () => {
    if (!initial || !dirty || !valid || edit.saving) return;
    const res = await edit.save(initial, values, saved);
    if (!res.ok) {
      if (res.error.code !== 'VALIDATION' && res.error.code !== '23514') toast.failure('Couldn’t save Tabung', { label: 'Retry', onPress: save });
      return;
    }
    await Promise.all(uploaded.filter((p) => p !== values.coverPath).map((p) => edit.discardCover(p)));
    const what = values.target !== initial.target ? `${values.name.trim()} target is now ${formatRM(values.target ?? 0)}` : `${values.name.trim()} updated`;
    let undone = false;
    // n-tabung-edit-saved: back on the Tabung, "Saved · …" with Undo.
    toast.success(`Saved · ${what}`, {
      label: 'Undo',
      onPress: async () => {
        undone = true;
        const back = await edit.undo(res.data);
        if (!back.ok) toast.failure('Couldn’t undo it');
      },
    });
    setTimeout(() => { if (!undone) edit.finalize(); }, 5500);
    router.back();
  };

  const pickCover = async () => {
    if (!user) return;
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true });
    const asset = res.canceled ? null : res.assets[0];
    if (!asset?.base64) return;
    const up = await edit.uploadCover(user.id, asset.base64);
    if (!up.ok) { toast.failure('Couldn’t add the photo', { label: 'Retry', onPress: pickCover }); return; }
    setUploaded((u) => [...u, up.data]);
    setCover(up.data);
  };

  const onDate = (e: DateTimePickerEvent, d?: Date) => {
    const which = picking;
    if (Platform.OS !== 'ios' || e.type === 'dismissed') setPicking(null);
    if (!d || e.type !== 'set' || !which) return;
    if (which === 'from') { setFrom(localYMD(d)); follow(); }
    else setPickedTo(endOfMonth(localYMD(d).slice(0, 7)));
  };

  const coverUri = cover && coverSrc?.path === cover ? coverSrc.url : null;

  return (
    <HeroScreen
      tabletLayout="panel"
      contentWidth="form"
      bottomPadding={32}
      sheetPadding={{ top: isTablet ? 24 : 20, horizontal: isTablet ? 24 : 16 }}
      hero={
        isTablet ? (
          <View style={{ paddingBottom: 40 }}>
            <TopBar title={account?.name ?? ''} onBack={close} />
            <Text variant="display-md" tone="inverse" style={{ paddingHorizontal: 24, marginTop: 28 }} accessibilityRole="header">Edit Tabung</Text>
          </View>
        ) : (
          <View style={{ paddingBottom: 12 }}>
            <TopBar title="Edit Tabung" onBack={close} />
          </View>
        )
      }
      overlay={
        <ConfirmSheet
          visible={askDiscard}
          title="Discard changes?"
          message={initial ? discardCopy(initial, values) : ''}
          confirmLabel="Keep editing"
          cancelLabel="Discard"
          onConfirm={() => setAskDiscard(false)}
          onCancel={() => { setAskDiscard(false); leave(); }}
        />
      }
    >
      {!loaded ? (
        <View style={{ gap: 16 }}>
          <Skeleton width="100%" height={152} />
          <Skeleton width="100%" height={52} />
          <Skeleton width="100%" height={52} />
        </View>
      ) : (
        <View style={{ gap: isTablet ? 18 : 10 }}>
          <View style={{ gap: 8 }}>
            <Text variant="label-sm" tone="muted">Goal type</Text>
            <View accessibilityRole="radiogroup" accessibilityLabel="Goal type" style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {TABUNG_GOALS.map((g) => {
                const on = goal === g.key;
                return (
                  <Pressable
                    key={g.key}
                    accessibilityRole="radio"
                    accessibilityState={{ checked: on }}
                    onPress={() => setGoal(g.key)}
                    style={{ width: '32%', height: isTablet ? 72 : 44, borderRadius: isTablet ? radius.md : 9999, borderWidth: 2, borderColor: on ? colors.secondary : 'transparent', backgroundColor: colors['surface-container'], flexDirection: 'row', alignItems: 'center', gap: isTablet ? 10 : 6, paddingHorizontal: isTablet ? 12 : 10 }}
                  >
                    {isTablet ? (
                      <View style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                        <g.icon size={19} color={colors['on-surface']} strokeWidth={1.75} />
                      </View>
                    ) : (
                      <g.icon size={16} color={colors['on-surface']} strokeWidth={1.75} />
                    )}
                    <Text variant="body-md" size={isTablet ? undefined : 13} weight={600} numberOfLines={1} style={{ flexShrink: 1 }}>{g.key === 'raya' ? 'Raya' : g.label}</Text>
                  </Pressable>
                );
              })}
            </View>
            {shown.goalType ? <InlineError message={shown.goalType} /> : null}
          </View>

          <TextInput
            label="Name"
            placeholder="e.g. Tabung Rumah"
            value={name}
            maxLength={40}
            error={shown.name}
            labelAside={changed.name && !shown.name ? <Edited /> : undefined}
            highlight={changed.name}
            onChangeText={(v) => { setName(v); edit.clearError('name'); }}
          />
          <View style={{ flexDirection: 'row', gap: 8, alignItems: 'flex-start' }}>
            <View style={{ flex: 1 }}>
              <TextInput
                label="Target"
                prefix="RM"
                keyboardType="decimal-pad"
                value={target}
                error={shown.target}
                labelAside={changed.target ? <Edited /> : undefined}
                highlight={changed.target}
                onChangeText={(v) => { setTarget(cleanMoney(v)); follow(); edit.clearError('target'); }}
              />
            </View>
            <View style={{ flex: 1 }}>
              <TextInput
                label="Monthly top-up"
                prefix="RM"
                keyboardType="decimal-pad"
                value={monthly}
                error={shown.monthlyTopup}
                labelAside={changed.monthlyTopup ? <Edited /> : undefined}
                highlight={changed.monthlyTopup}
                onChangeText={(v) => { setMonthly(cleanMoney(v)); follow(); edit.clearError('monthlyTopup'); }}
              />
            </View>
          </View>

          <View style={{ gap: 8 }}>
            <Text variant="label-sm" tone="muted">Dates</Text>
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, alignItems: 'center' }}>
              <AccountPill label={isTablet ? `Start: ${dayMonthYear(from)}` : dayMonthYear(from)} plainIcon={CalendarDays} onPress={() => setPicking('from')} accessibilityLabel="Start date" />
              <AccountPill label={isTablet ? `Target: ${monthLabel(toDate)}` : monthLabel(toDate)} plainIcon={CalendarDays} onPress={() => setPicking('to')} accessibilityLabel="Target date" />
              {dateMoved ? (
                <View style={{ height: 20, paddingHorizontal: 8, borderRadius: 9999, backgroundColor: colors.secondary, justifyContent: 'center' }}>
                  <Text variant="caption" weight={600} tone="inverse">Updated</Text>
                </View>
              ) : null}
            </View>
            {shown.dates ? (
              <InlineError message={shown.dates} />
            ) : !isTablet ? null : (
              <Text variant="label-sm" weight={400} tone="meta">
                {dateMoved && pickedTo === null && t && m ? `Target date moved: ${formatRM(t)} ÷ ${formatRM(m)} a month.` : 'Target date follows target ÷ monthly top-up.'}
              </Text>
            )}
          </View>
          {picking ? (
            <DateTimePicker
              value={ymdDate(picking === 'from' ? from : toDate)}
              mode="date"
              maximumDate={picking === 'from' ? new Date() : undefined}
              minimumDate={picking === 'to' ? ymdDate(from) : undefined}
              display={Platform.OS === 'ios' ? 'inline' : 'default'}
              onChange={onDate}
            />
          ) : null}

          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: colors['surface-container'], borderRadius: radius.md, paddingVertical: 4, paddingRight: 4, paddingLeft: 12 }}>
            <View style={{ width: 36, height: 36, borderRadius: 9999, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {coverUri ? <Image source={{ uri: coverUri }} style={{ width: 36, height: 36 }} accessibilityIgnoresInvertColors /> : <ImageIcon size={18} color={colors['on-surface']} strokeWidth={1.75} />}
            </View>
            <View style={{ flex: 1 }}>
              <Text variant="body-md" weight={600}>Cover photo</Text>
              <Text variant="label-sm" weight={400} tone="meta">{isTablet ? 'Optional · shows on the Tabung card' : 'Optional'}</Text>
            </View>
            {cover ? (
              <Button label="Remove photo" variant="white" height={44} onPress={() => setCover(null)} />
            ) : (
              <Button label="Add photo" variant="white" height={44} loading={edit.uploading} onPress={pickCover} />
            )}
          </View>

          <Pressable accessibilityRole="link" onPress={() => router.back()} style={{ alignSelf: 'flex-start', minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 6 }}>
            <Text variant="body-md" size={13} weight={500} tone="meta">Progress mode &amp; delete are in Settings</Text>
            <ArrowRight size={14} color={colors['on-surface-variant-aa']} strokeWidth={1.75} />
          </Pressable>

          {changed.target && t && !shown.target && initial ? (
            <View accessibilityRole="text" style={{ flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors['surface-container'], borderRadius: radius.md, paddingVertical: 8, paddingHorizontal: 14 }}>
              <View style={{ width: 28, height: 28, borderRadius: 9999, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                <Check size={14} color={colors['on-surface']} strokeWidth={1.75} />
              </View>
              <Text variant="body-md" size={13} style={{ flex: 1 }}>
                <Text variant="body-md" size={13} weight={600}>Progress: {progressPct(saved, initial.target)}% → {progressPct(saved, t)}%</Text>
                <Text variant="body-md" size={13} tone="meta"> · {formatRM(saved)} of {formatRM(t)}</Text>
              </Text>
            </View>
          ) : null}

          <View style={{ flexDirection: 'row', gap: 8 }}>
            <Button label="Cancel" variant="action" onPress={close} />
            <Button label="Save changes" disabled={!dirty || !valid} loading={edit.saving} loadingLabel="Saving…" onPress={save} style={{ flex: 1 }} />
          </View>
        </View>
      )}
    </HeroScreen>
  );
}
