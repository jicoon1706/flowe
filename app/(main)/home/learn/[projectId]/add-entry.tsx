import { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Image, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { ChevronLeft, X, FilePlus } from '../../../../../components/ui/icons';
import { useAuth } from '../../../../../context/AuthContext';
import { useLock } from '../../../../../context/LockContext';
import { useLearn } from '../../../../../src/hooks/useLearn';
import { LoadingView } from '../../../../../components/ui/LoadingView';
import { learnRepository } from '../../../../../src/repositories/learn.repository';
import { storageService } from '../../../../../src/services/storage';
import { isPdfPath, pdfLabel } from '../../../../../src/utils/attachments';

// Attachments in the form are either already-saved (loaded when editing) or
// freshly picked (need uploading on save), and each is a photo or a PDF.
// Keeping them in one list keeps the grid order and the MAX_FILES count correct.
type ExistingFile = { kind: 'existing'; id: string; storagePath: string; uri: string; isPdf: boolean; label?: string };
type NewFile = { kind: 'new'; uri: string; base64: string; isPdf: boolean; label?: string };
type FormFile = ExistingFile | NewFile;

const MAX_FILES = 10;
// Supabase Storage rejects very large uploads and base64 balloons memory on
// device, so cap PDFs at something a receipt/statement comfortably fits in.
const MAX_PDF_BYTES = 10 * 1024 * 1024;

export default function AddEntryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { projectId, entryId } = useLocalSearchParams<{ projectId: string; entryId?: string }>();
  const { loading, createEntry } = useLearn();
  const { suspend: suspendLock } = useLock();
  const [text, setText] = useState('');
  const [files, setFiles] = useState<FormFile[]>([]);
  const [removed, setRemoved] = useState<{ id: string; storagePath: string }[]>([]);
  const [saving, setSaving] = useState(false);
  // Which entry the form currently holds. Expo Router reuses this screen for
  // every `/add-entry?entryId=…` push, so a plain "already loaded" boolean left
  // the previously edited entry's text and images on screen when a *different*
  // entry was opened. Keying on the id reloads whenever the target changes.
  const loadedForRef = useRef<string | null>(null);

  useFocusEffect(useCallback(() => {
    const target = entryId ?? null;
    if (loadedForRef.current === target) return;
    loadedForRef.current = target;

    if (!target) {
      // New entry: start from a clean form so the last entry doesn't linger.
      setText('');
      setFiles([]);
      setRemoved([]);
      return;
    }

    // Switching entries: clear first so the previous entry is never shown
    // against the new one's id while the fetch is in flight.
    setText('');
    setFiles([]);
    setRemoved([]);

    let cancelled = false;
    learnRepository.fetchEntries(projectId!).then(async (result) => {
      if (cancelled || !result.ok) return;
      const entry = result.data.find((e: any) => e.id === target);
      if (!entry) return;
      const existing = ((entry as any).learn_entry_images ?? []) as any[];
      const paths = existing.map((i) => i.storage_path).filter(Boolean);
      const urlsResult = await storageService.getLearnImageUrls(paths);
      if (cancelled) return;
      const urls = urlsResult.ok ? urlsResult.data : {};
      setText(entry.body ?? '');
      setFiles(
        existing.map((i) => ({
          kind: 'existing' as const,
          id: i.id,
          storagePath: i.storage_path,
          uri: urls[i.storage_path] ?? '',
          isPdf: isPdfPath(i.storage_path),
        }))
      );
    });

    return () => { cancelled = true; };
  }, [entryId, projectId]));

  if (loading) return <LoadingView />;

  const canSave = (text.trim().length > 0 || files.length > 0) && !saving;

  const handleRemoveFile = (index: number) => {
    const file = files[index];
    // Remember already-saved files so we can delete them on save.
    if (file.kind === 'existing') {
      setRemoved((prev) => [...prev, { id: file.id, storagePath: file.storagePath }]);
    }
    setFiles(files.filter((_, i) => i !== index));
  };

  const handlePickImage = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Permission needed', 'Please allow photo access to add images.');
      return;
    }

    // Opening the picker backgrounds the app; tell the lock to skip the
    // re-lock so the user isn't asked for PIN/biometric on return.
    suspendLock();

    const remaining = MAX_FILES - files.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });

    if (result.canceled) return;
    const picked: NewFile[] = result.assets
      .filter((asset) => !!asset.base64)
      .map((asset) => ({ kind: 'new', uri: asset.uri, base64: asset.base64!, isPdf: false }));
    if (picked.length === 0) return;
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES));
  };

  const handlePickPdf = async () => {
    suspendLock();

    const result = await DocumentPicker.getDocumentAsync({
      type: 'application/pdf',
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (result.canceled) return;

    const remaining = MAX_FILES - files.length;
    const picked: NewFile[] = [];
    for (const asset of result.assets.slice(0, remaining)) {
      if (asset.size != null && asset.size > MAX_PDF_BYTES) {
        Alert.alert('File too large', `"${asset.name}" is over 10 MB.`);
        continue;
      }
      try {
        const base64 = await new File(asset.uri).base64();
        picked.push({ kind: 'new', uri: asset.uri, base64, isPdf: true, label: asset.name });
      } catch {
        Alert.alert('Could not read file', `"${asset.name}" could not be opened.`);
      }
    }
    if (picked.length === 0) return;
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES));
  };

  const handleOpenPdf = async (file: FormFile) => {
    if (!file.uri) return;
    await Linking.openURL(file.uri).catch(() => {
      Alert.alert('Could not open', 'No app on this device can open the PDF.');
    });
  };

  const handleSave = async () => {
    if (!canSave || !user) return;
    setSaving(true);
    try {
      let targetEntryId = entryId;

      if (targetEntryId) {
        await learnRepository.updateEntry(targetEntryId, text);
      } else {
        const result = await createEntry(projectId!, user.id, text);
        if (!result.ok) {
          Alert.alert('Error', 'Could not save entry.');
          return;
        }
        targetEntryId = result.data.id;
      }

      // Delete files the user removed while editing.
      for (const r of removed) {
        await learnRepository.removeImage(r.id);
        await storageService.deleteLearnImage(r.storagePath);
      }

      // Upload only the newly picked files.
      for (const file of files) {
        if (file.kind !== 'new') continue;
        const fileId = Crypto.randomUUID();
        const extension = file.isPdf ? 'pdf' : 'jpg';
        const upload = file.isPdf
          ? await storageService.uploadLearnPdf(user.id, targetEntryId!, fileId, file.base64)
          : await storageService.uploadLearnImage(user.id, targetEntryId!, fileId, file.base64);
        if (!upload.ok) continue;
        await learnRepository.attachImage(targetEntryId!, `${user.id}/${targetEntryId}/${fileId}.${extension}`);
      }

      router.back();
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text className="text-xl font-semibold text-foreground">{entryId ? 'Edit Entry' : 'Add Entry'}</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4">
        {/* Text Area */}
        <View className="mt-4">
          <Text className="text-xs text-muted-foreground mb-2">Note</Text>
          <TextInput
            className="bg-card border border-border rounded-xl px-4 py-3 text-foreground min-h-[120]"
            placeholder="What did you learn?"
            placeholderTextColor="#888"
            value={text}
            onChangeText={setText}
            multiline
            textAlignVertical="top"
          />
        </View>

        {/* Attachment Grid */}
        <View className="mt-4">
          <Text className="text-xs text-muted-foreground mb-2">Attachments</Text>
          <View className="flex-row flex-wrap">
            {files.map((file, index) => (
              <View key={index} className="relative mr-2 mb-2">
                {file.isPdf ? (
                  <Pressable
                    onPress={() => handleOpenPdf(file)}
                    className="w-20 h-20 rounded-xl bg-card border border-border items-center justify-center px-1"
                  >
                    <Text className="text-lg">📄</Text>
                    <Text className="text-[10px] text-muted-foreground mt-1" numberOfLines={2}>
                      {file.kind === 'new' ? file.label ?? 'PDF' : pdfLabel(file.storagePath, file.label)}
                    </Text>
                  </Pressable>
                ) : (
                  <Image source={{ uri: file.uri }} className="w-20 h-20 rounded-xl" />
                )}
                <Pressable
                  onPress={() => handleRemoveFile(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-expense items-center justify-center"
                >
                  <X size={12} color="#fff" />
                </Pressable>
              </View>
            ))}
          </View>

          {files.length < MAX_FILES && (
            <View className="flex-row mt-1">
              <Pressable
                onPress={handlePickImage}
                className="flex-1 flex-row items-center justify-center rounded-xl border-2 border-dashed border-border py-3 mr-2"
              >
                <FilePlus size={16} color="#888" />
                <Text className="text-xs text-muted-foreground ml-2">Add photo</Text>
              </Pressable>
              <Pressable
                onPress={handlePickPdf}
                className="flex-1 flex-row items-center justify-center rounded-xl border-2 border-dashed border-border py-3 ml-2"
              >
                <Text className="text-sm">📄</Text>
                <Text className="text-xs text-muted-foreground ml-2">Add PDF</Text>
              </Pressable>
            </View>
          )}
        </View>
      </ScrollView>

      {/* Save Button */}
      <View className="px-4 pb-6">
        <Pressable
          onPress={handleSave}
          disabled={!canSave}
          className={`rounded-2xl py-3 items-center ${
            canSave ? 'bg-primary' : 'bg-muted'
          }`}
        >
          <Text
            className={`text-sm font-semibold ${
              canSave ? 'text-primary-foreground' : 'text-muted-foreground'
            }`}
          >
            {saving ? 'Saving...' : 'Save'}
          </Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}
