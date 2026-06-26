import { useState, useCallback, useRef } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Image, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import * as ImagePicker from 'expo-image-picker';
import * as Crypto from 'expo-crypto';
import { ChevronLeft, X, FilePlus } from '../../../../../components/ui/icons';
import { useAuth } from '../../../../../context/AuthContext';
import { useLock } from '../../../../../context/LockContext';
import { useLearn } from '../../../../../src/hooks/useLearn';
import { LoadingView } from '../../../../../components/ui/LoadingView';
import { learnRepository } from '../../../../../src/repositories/learn.repository';
import { storageService } from '../../../../../src/services/storage';

// Images in the form are either already-saved (loaded when editing) or freshly
// picked (need uploading on save). Keeping them in one list keeps the grid and
// the MAX_IMAGES count correct.
type ExistingImage = { kind: 'existing'; id: string; storagePath: string; uri: string };
type NewImage = { kind: 'new'; uri: string; base64: string };
type FormImage = ExistingImage | NewImage;

const MAX_IMAGES = 10;

export default function AddEntryScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { projectId, entryId } = useLocalSearchParams<{ projectId: string; entryId?: string }>();
  const { loading, createEntry } = useLearn();
  const { suspend: suspendLock } = useLock();
  const [text, setText] = useState('');
  const [images, setImages] = useState<FormImage[]>([]);
  const [removed, setRemoved] = useState<{ id: string; storagePath: string }[]>([]);
  const [saving, setSaving] = useState(false);
  // Load existing images only once per edit session so returning from the photo
  // picker doesn't wipe freshly picked (unsaved) images.
  const loadedRef = useRef(false);

  useFocusEffect(useCallback(() => {
    if (entryId) {
      if (loadedRef.current) return;
      loadedRef.current = true;
      // Load existing entry (text + already-saved images) for edit
      learnRepository.fetchEntries(projectId!).then(async (result) => {
        if (!result.ok) return;
        const entry = result.data.find((e: any) => e.id === entryId);
        if (!entry) return;
        setText(entry.body ?? '');
        const existing = ((entry as any).learn_entry_images ?? []) as any[];
        const paths = existing.map((i) => i.storage_path).filter(Boolean);
        const urlsResult = await storageService.getLearnImageUrls(paths);
        const urls = urlsResult.ok ? urlsResult.data : {};
        setImages(
          existing.map((i) => ({
            kind: 'existing' as const,
            id: i.id,
            storagePath: i.storage_path,
            uri: urls[i.storage_path] ?? '',
          }))
        );
      });
    } else {
      // New entry: start with a clean form so the previous entry doesn't linger
      setText('');
      setImages([]);
      setRemoved([]);
    }
  }, [entryId, projectId]));

  if (loading) return <LoadingView />;

  const canSave = (text.trim().length > 0 || images.length > 0) && !saving;

  const handleRemoveImage = (index: number) => {
    const img = images[index];
    // Remember already-saved images so we can delete them on save.
    if (img.kind === 'existing') {
      setRemoved((prev) => [...prev, { id: img.id, storagePath: img.storagePath }]);
    }
    setImages(images.filter((_, i) => i !== index));
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

    const remaining = MAX_IMAGES - images.length;
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.7,
      base64: true,
      allowsMultipleSelection: true,
      selectionLimit: remaining,
    });

    if (result.canceled) return;
    const picked: NewImage[] = result.assets
      .filter((asset) => !!asset.base64)
      .map((asset) => ({ kind: 'new', uri: asset.uri, base64: asset.base64! }));
    if (picked.length === 0) return;
    setImages((prev) => [...prev, ...picked].slice(0, MAX_IMAGES));
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

      // Delete images the user removed while editing.
      for (const r of removed) {
        await learnRepository.removeImage(r.id);
        await storageService.deleteLearnImage(r.storagePath);
      }

      // Upload only the newly picked images.
      for (const image of images) {
        if (image.kind !== 'new') continue;
        const imageId = Crypto.randomUUID();
        const upload = await storageService.uploadLearnImage(user.id, targetEntryId!, imageId, image.base64);
        if (!upload.ok) continue;
        await learnRepository.attachImage(targetEntryId!, `${user.id}/${targetEntryId}/${imageId}.jpg`);
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
        <Text className="text-xl font-semibold text-foreground">Add Entry</Text>
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

        {/* Image Grid */}
        <View className="mt-4">
          <Text className="text-xs text-muted-foreground mb-2">Images</Text>
          <View className="flex-row flex-wrap">
            {images.map((img, index) => (
              <View key={index} className="relative mr-2 mb-2">
                <Image
                  source={{ uri: img.uri }}
                  className="w-20 h-20 rounded-xl"
                />
                <Pressable
                  onPress={() => handleRemoveImage(index)}
                  className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-expense items-center justify-center"
                >
                  <X size={12} color="#fff" />
                </Pressable>
              </View>
            ))}
            {images.length < MAX_IMAGES && (
              <Pressable
                onPress={handlePickImage}
                className="w-20 h-20 rounded-xl border-2 border-dashed border-border items-center justify-center mb-2"
              >
                <FilePlus size={20} color="#888" />
                <Text className="text-xs text-muted-foreground mt-1">Add</Text>
              </Pressable>
            )}
          </View>
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
