import { useCallback, useState } from 'react';
import { Pressable, ScrollView, View } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { CalendarDays, FileText, Folder, ImagePlus, Paperclip, X } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { AccountPill } from '@/components/ui/AccountPill';
import { Button } from '@/components/ui/Button';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { Text } from '@/components/ui/Text';
import { TextInput } from '@/components/ui/TextInput';
import { TopBar } from '@/components/ui/TopBar';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useLock } from '@/context/LockContext';
import { learnRepository } from '@/src/repositories/learn.repository';
import { storageService } from '@/src/services/storage';
import { isPdfPath, pdfLabel } from '@/src/utils/attachments';
import { joinEntry, splitEntry } from '@/src/utils/learnEntry';
import type { LearnEntryWithImages } from '@/src/types';

type ExistingFile = { kind: 'existing'; id: string; storagePath: string; uri: string; isPdf: boolean };
type NewFile = { kind: 'new'; uri: string; base64: string; isPdf: boolean; label?: string };
type FormFile = ExistingFile | NewFile;

const MAX_FILES = 10;
const MAX_PDF_BYTES = 10 * 1024 * 1024;

/** learn/[projectId]/add-entry — Title, date, project, Notes, attachments. Primary: Save entry. */
export default function AddEntryScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { suspend } = useLock();
  const { projectId, entryId } = useLocalSearchParams<{ projectId: string; entryId?: string }>();
  const editing = !!entryId && entryId.length > 0;
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [projectName, setProjectName] = useState('');
  const [createdAt, setCreatedAt] = useState<string | null>(null);
  const [files, setFiles] = useState<FormFile[]>([]);
  const [removed, setRemoved] = useState<{ id: string; storagePath: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [titleError, setTitleError] = useState<string | null>(null);

  // Tab screen: reload on every focus so a previous edit never lingers.
  useFocusEffect(useCallback(() => {
    setTitle(''); setNotes(''); setFiles([]); setRemoved([]); setCreatedAt(null); setTitleError(null);
    let cancelled = false;
    if (projectId) learnRepository.fetchProject(projectId).then((r) => { if (!cancelled && r.ok) setProjectName(r.data.name); });
    if (editing && projectId) {
      learnRepository.fetchEntries(projectId).then(async (r) => {
        if (cancelled || !r.ok) return;
        const entry = (r.data as LearnEntryWithImages[]).find((e) => e.id === entryId);
        if (!entry) return;
        const existing = entry.learn_entry_images ?? [];
        const urls = await storageService.getLearnImageUrls(existing.map((i) => i.storage_path));
        if (cancelled) return;
        const split = splitEntry(entry.body);
        setTitle(split.title);
        setNotes(split.notes);
        setCreatedAt(entry.created_at);
        setFiles(existing.map((i) => ({ kind: 'existing' as const, id: i.id, storagePath: i.storage_path, uri: urls.ok ? urls.data[i.storage_path] ?? '' : '', isPdf: isPdfPath(i.storage_path) })));
      });
    }
    return () => { cancelled = true; };
  }, [projectId, entryId, editing]));

  const pickPhotos = async () => {
    const perm = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!perm.granted) { toast.failure('Photo access is off', { label: 'Try again', onPress: pickPhotos }); return; }
    suspend();
    const res = await ImagePicker.launchImageLibraryAsync({ mediaTypes: ['images'], quality: 0.7, base64: true, allowsMultipleSelection: true, selectionLimit: MAX_FILES - files.length });
    if (res.canceled) return;
    const picked: NewFile[] = res.assets.filter((a) => !!a.base64).map((a) => ({ kind: 'new', uri: a.uri, base64: a.base64 ?? '', isPdf: false }));
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES));
  };

  const pickPdfs = async () => {
    suspend();
    const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', multiple: true, copyToCacheDirectory: true });
    if (res.canceled) return;
    const picked: NewFile[] = [];
    for (const asset of res.assets.slice(0, MAX_FILES - files.length)) {
      if (asset.size != null && asset.size > MAX_PDF_BYTES) { toast.failure('File too large · max 10 MB', { label: 'Pick another', onPress: pickPdfs }); continue; }
      try {
        picked.push({ kind: 'new', uri: asset.uri, base64: await new File(asset.uri).base64(), isPdf: true, label: asset.name });
      } catch {
        toast.failure('Couldn’t read that file', { label: 'Pick another', onPress: pickPdfs });
      }
    }
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES));
  };

  const removeFile = (index: number) => {
    const f = files[index];
    if (f.kind === 'existing') setRemoved((r) => [...r, { id: f.id, storagePath: f.storagePath }]);
    setFiles(files.filter((_, i) => i !== index));
  };

  const save = async () => {
    if (!user || !projectId) return;
    if (!title.trim() && !notes.trim() && !files.length) { setTitleError('Add a title or a note'); return; }
    setSaving(true);
    try {
      const body = joinEntry(title, notes);
      let target = editing ? entryId : undefined;
      if (target) {
        const up = await learnRepository.updateEntry(target, body);
        if (!up.ok) { toast.failure('Save failed. Your entry is kept.', { label: 'Retry', onPress: save }); return; }
      } else {
        const created = await learnRepository.createEntry(projectId, user.id, body);
        if (!created.ok) { toast.failure('Save failed. Your entry is kept.', { label: 'Retry', onPress: save }); return; }
        target = created.data.id;
      }
      let removeFailed = false;
      for (const r of removed) {
        const row = await learnRepository.removeImage(r.id);
        if (!row.ok) { removeFailed = true; continue; }
        await storageService.deleteLearnImage(r.storagePath);
      }
      let uploadFailed = 0;
      for (const f of files) {
        if (f.kind !== 'new') continue;
        const id = Crypto.randomUUID();
        const ext = f.isPdf ? 'pdf' : 'jpg';
        const up = f.isPdf ? await storageService.uploadLearnPdf(user.id, target ?? '', id, f.base64) : await storageService.uploadLearnImage(user.id, target ?? '', id, f.base64);
        if (!up.ok) { uploadFailed += 1; continue; }
        await learnRepository.attachImage(target ?? '', `${user.id}/${target}/${id}.${ext}`);
      }
      if (removeFailed) toast.failure('Some attachments couldn’t be removed');
      else if (uploadFailed) toast.failure(`${uploadFailed} attachment${uploadFailed > 1 ? 's' : ''} didn’t upload`);
      else toast.success(editing ? 'Entry updated' : 'Entry saved');
      setFiles([]); setRemoved([]);
      router.replace(editing
        ? { pathname: '/home/learn/[projectId]/entry', params: { projectId, entryId: target ?? '' } }
        : { pathname: '/home/learn/[projectId]', params: { projectId } });
    } finally {
      setSaving(false);
    }
  };

  const dateLabel = createdAt ? new Date(createdAt).toLocaleDateString('en-MY', { day: 'numeric', month: 'short' }) : 'Today';

  return (
    <HeroScreen
      contentWidth="form"
      heroHeight={164}
      bottomPadding={32}
      sheetPadding={{ top: 24, horizontal: 24 }}
      hero={<TopBar title={editing ? 'Edit entry' : 'New entry'} onBack={() => router.back()} close />}
    >
      <TextInput label="Title" value={title} onChangeText={(t) => { setTitle(t); setTitleError(null); }} error={titleError} autoCapitalize="sentences" />
      <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
        <AccountPill label={dateLabel} plainIcon={CalendarDays} accessibilityLabel={`Date: ${dateLabel}`} />
        <AccountPill label={projectName || 'Project'} plainIcon={Folder} accessibilityLabel={`Project: ${projectName}`} />
      </View>
      <TextInput label="Notes" value={notes} onChangeText={setNotes} area numberOfLines={10} />
      {files.length ? (
        <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
          {files.map((f, i) => (
            <View key={`${f.kind}-${i}`} style={{ width: 88, height: 88, borderRadius: radius.sm, backgroundColor: colors['surface-container'], overflow: 'hidden', alignItems: 'center', justifyContent: 'center' }}>
              {f.isPdf ? (
                <View style={{ alignItems: 'center', gap: 4, padding: 6 }}>
                  <FileText size={22} color={colors['on-surface']} strokeWidth={1.75} />
                  <Text variant="caption" numberOfLines={2} align="center">{f.kind === 'new' ? f.label ?? 'PDF' : pdfLabel(f.storagePath)}</Text>
                </View>
              ) : (
                <Image source={{ uri: f.uri }} style={{ width: 88, height: 88 }} contentFit="cover" accessibilityLabel="Attached photo" />
              )}
              <Pressable onPress={() => removeFile(i)} accessibilityRole="button" accessibilityLabel="Remove attachment" hitSlop={8} style={{ position: 'absolute', top: 4, right: 4, width: 28, height: 28, borderRadius: 9999, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' }}>
                <X size={14} color={colors['on-surface']} strokeWidth={2} />
              </Pressable>
            </View>
          ))}
        </ScrollView>
      ) : null}
      <View style={{ flexDirection: 'row', gap: 8 }}>
        <Button label="Photo" icon={ImagePlus} variant="action" height={44} onPress={pickPhotos} disabled={files.length >= MAX_FILES} />
        <Button label="PDF" icon={Paperclip} variant="action" height={44} onPress={pickPdfs} disabled={files.length >= MAX_FILES} />
      </View>
      <View style={{ flex: 1, minHeight: 16 }} />
      <Button label="Save entry" onPress={save} loading={saving} loadingLabel="Saving…" fullWidth />
    </HeroScreen>
  );
}
