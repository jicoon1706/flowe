import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, Pencil, Trash2, X } from '../../../../../components/ui/icons';

interface Entry {
  id: string;
  text: string;
  images: string[];
  timeAgo: string;
}

const MOCK_ENTRY: Entry = {
  id: 'e1',
  text: 'S&P 500 index fund provides diversified exposure to US large-cap equities with low expense ratios. Warren Buffett recommends this for most investors who don\'t have time to analyze individual companies. The fund has historically returned about 10% annually before inflation.',
  images: [],
  timeAgo: '2 hours ago',
};

export default function EntryDetailScreen() {
  const router = useRouter();
  const { projectId, entryId } = useLocalSearchParams<{ projectId: string; entryId: string }>();
  const [entry] = useState<Entry>(MOCK_ENTRY);
  const [showMenu, setShowMenu] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [lightboxImage, setLightboxImage] = useState<number | null>(null);

  const handleDelete = () => {
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
        <Text className="flex-1 text-lg font-semibold text-foreground">Entri</Text>
        <Pressable onPress={() => setShowMenu(true)} className="p-2">
          <Pencil size={20} color="#fff" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1 px-4">
        {/* Entry Text */}
        <View className="mt-4 mb-4">
          <Text className="text-sm text-muted-foreground mb-2">{entry.timeAgo}</Text>
          <Text className="text-base text-foreground leading-relaxed">{entry.text}</Text>
        </View>

        {/* Image Grid */}
        {entry.images.length > 0 && (
          <View className="flex-row flex-wrap mb-6">
            {entry.images.map((img, index) => (
              <Pressable
                key={index}
                onPress={() => setLightboxImage(index)}
                className="w-[48%] aspect-square rounded-xl bg-muted mb-2 mr-[4%]"
              >
                <Image
                  source={{ uri: img }}
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
              Hapus entri ini?
            </Text>
            <View className="flex-row mt-4">
              <Pressable
                onPress={() => setShowDelete(false)}
                className="flex-1 py-3 items-center"
              >
                <Text className="text-muted-foreground">Batal</Text>
              </Pressable>
              <Pressable
                onPress={handleDelete}
                className="flex-1 bg-expense rounded-2xl py-3 items-center"
              >
                <Text className="text-sm font-semibold text-white">Hapus</Text>
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
          {lightboxImage !== null && entry.images[lightboxImage] && (
            <Image
              source={{ uri: entry.images[lightboxImage] }}
              className="w-80 h-80 rounded-xl"
            />
          )}
        </Pressable>
      </Modal>
    </SafeAreaView>
  );
}