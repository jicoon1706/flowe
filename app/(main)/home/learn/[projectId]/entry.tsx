import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronLeft, Pencil, Trash2, X } from '../../../../../components/ui/icons';
import { useAuth } from '../../../../../context/AuthContext';
import { useLearn } from '../../../../../src/hooks/useLearn';
import { LoadingView } from '../../../../../components/ui/LoadingView';
import { ErrorView } from '../../../../../components/ui/ErrorView';
import { learnRepository } from '../../../../../src/repositories/learn.repository';
import type { LearnEntry } from '../../../../../src/types';

export default function EntryDetailScreen() {
  const router = useRouter();
  const { projectId, entryId } = useLocalSearchParams<{ projectId: string; entryId: string }>();
  const { entries, loading, error, fetchEntries } = useLearn();
  const [showMenu, setShowMenu] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<number | null>(null);

  useFocusEffect(useCallback(() => {
    if (projectId) fetchEntries(projectId);
  }, [projectId, fetchEntries]));

  if (loading) return <LoadingView />;
  if (error) return <ErrorView error={error} onRetry={() => projectId && fetchEntries(projectId)} />;

  const entry: LearnEntry | undefined = entries.find((e: LearnEntry) => e.id === entryId);
  const entryText = entry?.body ?? '';
  const entryImages = (entry?.learn_entry_images ?? []) as any[];
  const entryTime = entry?.created_at ? new Date(entry.created_at).toLocaleString() : '';

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
          <View className="flex-row flex-wrap mb-6">
            {entryImages.map((img: any, index: number) => (
              <Pressable
                key={index}
                onPress={() => setLightboxImage(index)}
                className="w-[48%] aspect-square rounded-xl bg-muted mb-2 mr-[4%]"
              >
                <Image
                  source={{ uri: img.storage_path }}
                  className="w-full h-full rounded-xl"
                />
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
              source={{ uri: entryImages[lightboxImage].storage_path }}
              className="w-80 h-80 rounded-xl"
            />
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}