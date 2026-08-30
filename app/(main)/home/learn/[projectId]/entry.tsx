import { useState, useEffect, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Image, Linking, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronLeft, Pencil, Trash2, X } from '../../../../../components/ui/icons';
import { useAuth } from '../../../../../context/AuthContext';
import { useLearn } from '../../../../../src/hooks/useLearn';
import { LoadingView } from '../../../../../components/ui/LoadingView';
import { ErrorView } from '../../../../../components/ui/ErrorView';
import { learnRepository } from '../../../../../src/repositories/learn.repository';
import { storageService } from '../../../../../src/services/storage';
import type { LearnEntry } from '../../../../../src/types';
import { isPdfPath, pdfLabel } from '../../../../../src/utils/attachments';

export default function EntryDetailScreen() {
  const router = useRouter();
  const { projectId, entryId } = useLocalSearchParams<{ projectId: string; entryId: string }>();
  const { entries, loading, error, fetchEntries } = useLearn();
  const [showMenu, setShowMenu] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<number | null>(null);
  const [imageUrls, setImageUrls] = useState<Record<string, string>>({});

  useFocusEffect(useCallback(() => {
    if (projectId) fetchEntries(projectId);
  }, [projectId, fetchEntries]));

  const entry: LearnEntry | undefined = entries.find((e: LearnEntry) => e.id === entryId);
  const entryText = entry?.body ?? '';
  const attachments = ((entry as any)?.learn_entry_images ?? []) as any[];
  // PDFs share the attachment table with photos, but only photos belong in the
  // grid/lightbox — a PDF gets a row that hands off to the system viewer.
  const entryImages = attachments.filter((a: any) => !isPdfPath(a.storage_path));
  const entryPdfs = attachments.filter((a: any) => isPdfPath(a.storage_path));
  const entryTime = entry?.created_at ? new Date(entry.created_at).toLocaleString() : '';

  // Key the effect on the actual image paths so newly added images get signed
  // URLs too (the entry id alone doesn't change when images are added/removed).
  const imagePaths = attachments.map((img: any) => img.storage_path).filter(Boolean);
  const pathsKey = imagePaths.join(',');

  useEffect(() => {
    if (imagePaths.length === 0) return;
    let cancelled = false;
    storageService.getLearnImageUrls(imagePaths).then((result) => {
      if (!cancelled && result.ok) setImageUrls((prev) => ({ ...prev, ...result.data }));
    });
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathsKey]);

  if (loading) return <LoadingView />;
  if (error) return <ErrorView error={error} onRetry={() => projectId && fetchEntries(projectId)} />;

  const handleDelete = async () => {
    if (entryId) await learnRepository.deleteEntry(entryId);
    router.back();
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text className="flex-1 text-lg font-semibold text-foreground">Entry</Text>
        <Pressable onPress={() => setShowMenu(true)} className="p-2">
          <Pencil size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4">
        {/* Entry Text */}
        <View className="mt-4 mb-4">
          <Text className="text-sm text-muted-foreground mb-2">{entryTime}</Text>
          <Text className="text-base text-foreground leading-relaxed">{entryText}</Text>
        </View>

        {/* Image Grid */}
        {entryImages.length > 0 && (
          <View className="flex-row flex-wrap justify-between mb-6">
            {entryImages.map((img: any, index: number) => (
              <Pressable
                key={index}
                onPress={() => setLightboxImage(index)}
                className="w-[48%] aspect-square rounded-xl bg-muted mb-3"
              >
                <Image
                  source={{ uri: imageUrls[img.storage_path] ?? '' }}
                  className="w-full h-full rounded-xl"
                />
              </Pressable>
            ))}
          </View>
        )}

        {/* PDF Attachments */}
        {entryPdfs.length > 0 && (
          <View className="mb-6">
            {entryPdfs.map((pdf: any) => (
              <Pressable
                key={pdf.id}
                onPress={() => {
                  const url = imageUrls[pdf.storage_path];
                  if (!url) return;
                  Linking.openURL(url).catch(() =>
                    Alert.alert('Could not open', 'No app on this device can open the PDF.')
                  );
                }}
                className="flex-row items-center bg-card border border-border rounded-xl px-4 py-3 mb-2"
              >
                <Text className="text-lg mr-3">📄</Text>
                <Text className="flex-1 text-sm text-foreground" numberOfLines={1}>
                  {pdfLabel(pdf.storage_path)}
                </Text>
              </Pressable>
            ))}
          </View>
        )}

        {/* Action Buttons */}
        <View className="flex-row mb-8">
          <Pressable
            onPress={() => router.push(`/home/learn/${projectId}/add-entry?entryId=${entryId}`)}
            className="flex-1 bg-card rounded-2xl py-3 items-center mr-2 border border-border"
          >
            <Text className="text-sm font-medium text-foreground">Edit</Text>
          </Pressable>
          <Pressable
            onPress={() => setShowDelete(true)}
            className="flex-1 bg-card rounded-2xl py-3 items-center ml-2 border border-border"
          >
            <Text className="text-sm font-medium text-expense">Delete</Text>
          </Pressable>
        </View>
      </ScrollView>

      {/* Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/60"
          onPress={() => setShowMenu(false)}
        >
          <View className="absolute bottom-20 left-4 right-4 bg-card rounded-2xl p-2">
            <Pressable
              onPress={() => {
                setShowMenu(false);
                router.push(`/home/learn/${projectId}/add-entry?entryId=${entryId}`);
              }}
              className="flex-row items-center p-3 rounded-xl"
            >
              <Pencil size={18} color="#fff" className="mr-3" />
              <Text className="text-foreground">Edit</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setShowMenu(false);
                setShowDelete(true);
              }}
              className="flex-row items-center p-3 rounded-xl"
            >
              <Trash2 size={18} color="#ff4444" className="mr-3" />
              <Text className="text-expense">Delete</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal visible={showDelete} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-card rounded-t-3xl p-6 pb-10">
            <Text className="text-lg font-semibold text-foreground mb-2">
              Delete this entry?
            </Text>
            <View className="flex-row mt-4">
              <Pressable
                onPress={() => setShowDelete(false)}
                className="flex-1 py-3 items-center"
              >
                <Text className="text-muted-foreground">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                className="flex-1 bg-expense rounded-2xl py-3 items-center"
              >
                <Text className="text-sm font-semibold text-white">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Lightbox */}
      <Modal visible={lightboxImage !== null} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/90 items-center justify-center"
          onPress={() => setLightboxImage(null)}
        >
          <Pressable
            onPress={() => setLightboxImage(null)}
            className="absolute top-12 right-4 p-2"
          >
            <X size={24} color="#fff" />
          </Pressable>
          {lightboxImage !== null && entryImages[lightboxImage] && (
            <Image
              source={{ uri: imageUrls[entryImages[lightboxImage].storage_path] ?? '' }}
              className="w-full h-full"
              resizeMode="contain"
            />
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}