import { useState } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ChevronLeft, DotsThreeVertical, Pencil, Trash2 } from '../../../../components/ui/icons';

interface Entry {
  id: string;
  text: string;
  images: string[];
  timeAgo: string;
}

interface Project {
  id: string;
  name: string;
  emoji: string;
  entries: Entry[];
}

const MOCK_PROJECT: Project = {
  id: '1',
  name: 'Investing Notes',
  emoji: '📈',
  entries: [
    {
      id: 'e1',
      text: 'S&P 500 index fund provides diversified exposure to US large-cap equities with low expense ratios. Warren Buffett recommends this for most investors who don\'t have time to analyze individual companies.',
      images: [],
      timeAgo: '2 hours ago',
    },
    {
      id: 'e2',
      text: 'Compound interest is the 8th wonder of the world. RM1000 monthly invested at 8% annual return becomes RM 1.2M after 20 years.',
      images: ['https://placehold.co/100x100/2a2a2a/C5FF00?text=Chart'],
      timeAgo: 'Yesterday',
    },
    {
      id: 'e3',
      text: 'Rich Dad Poor Dad lesson: assets put money in your pocket. Liabilities take money out. Focus on buying assets like rental properties and dividend stocks.',
      images: [],
      timeAgo: '3 days ago',
    },
  ],
};

export default function ProjectDetailScreen() {
  const router = useRouter();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const [project, setProject] = useState(MOCK_PROJECT);
  const [showMenu, setShowMenu] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [renameText, setRenameText] = useState(project.name);

  const handleRename = () => {
    setProject({ ...project, name: renameText });
    setShowRename(false);
  };

  const handleDeleteProject = () => {
    router.back();
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <View className="flex-1 flex-row items-center">
          <Text className="text-lg font-semibold text-foreground mr-2">{project.emoji}</Text>
          <Text className="text-lg font-semibold text-foreground">{project.name}</Text>
        </View>
        <Pressable onPress={() => setShowMenu(true)} className="p-2">
          <DotsThreeVertical size={22} color="#fff" />
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} className="flex-1">
        {/* Entries List */}
        <View className="px-4 mt-4 mb-20">
          {project.entries.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-4xl mb-3">📝</Text>
              <Text className="text-foreground font-medium">Belum ada entri</Text>
              <Text className="text-muted-foreground text-sm mt-1">
                Tap '+ Tambah Entri' to add your first note
              </Text>
            </View>
          ) : (
            project.entries.map((entry) => (
              <Pressable
                key={entry.id}
                onPress={() => router.push(`/home/learn/${project.id}/entry?entryId=${entry.id}`)}
                className="bg-card rounded-2xl p-4 mb-3 border border-border"
              >
                <Text className="text-xs text-muted-foreground mb-2">{entry.timeAgo}</Text>
                <Text className="text-sm text-foreground mb-2" numberOfLines={2}>
                  {entry.text}
                </Text>
                {entry.images.length > 0 && (
                  <View className="flex-row mt-2">
                    {entry.images.slice(0, 3).map((img, idx) => (
                      <Image
                        key={idx}
                        source={{ uri: img }}
                        className="w-12 h-12 rounded-lg mr-2"
                      />
                    ))}
                    {entry.images.length > 3 && (
                      <View className="w-12 h-12 rounded-lg bg-muted items-center justify-center">
                        <Text className="text-xs text-muted-foreground">+{entry.images.length - 3}</Text>
                      </View>
                    )}
                  </View>
                )}
              </Pressable>
            ))
          )}
        </View>

        {/* FAB Add Entry */}
        <Pressable
          onPress={() => router.push(`/home/learn/${project.id}/add-entry`)}
          className="absolute bottom-6 right-6 left-6 bg-primary rounded-2xl py-3 items-center active:scale-[0.98] transition-transform"
        >
          <Text className="text-sm font-semibold text-primary-foreground">+ Tambah Entri</Text>
        </Pressable>
      </ScrollView>

      {/* More Menu Modal */}
      <Modal visible={showMenu} transparent animationType="fade">
        <Pressable
          className="flex-1 bg-black/60"
          onPress={() => setShowMenu(false)}
        >
          <View className="absolute bottom-20 left-4 right-4 bg-card rounded-2xl p-2">
            <Pressable
              onPress={() => {
                setShowMenu(false);
                setShowRename(true);
              }}
              className="flex-row items-center p-3 rounded-xl"
            >
              <Pencil size={18} color="#fff" className="mr-3" />
              <Text className="text-foreground">Rename</Text>
            </Pressable>
            <Pressable
              onPress={() => {
                setShowMenu(false);
                setShowDelete(true);
              }}
              className="flex-row items-center p-3 rounded-xl"
            >
              <Trash2 size={18} color="#ff4444" className="mr-3" />
              <Text className="text-expense">Hapus Projek</Text>
            </Pressable>
          </View>
        </Pressable>
      </Modal>

      {/* Rename Modal */}
      <Modal visible={showRename} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-card rounded-t-3xl p-6 pb-10">
            <Text className="text-lg font-semibold text-foreground mb-4">Rename Project</Text>
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-4"
              value={renameText}
              onChangeText={setRenameText}
              maxLength={50}
            />
            <View className="flex-row">
              <Pressable
                onPress={() => {
                  setShowRename(false);
                  setRenameText(project.name);
                }}
                className="flex-1 py-3 items-center"
              >
                <Text className="text-muted-foreground">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleRename}
                className="flex-1 bg-primary rounded-2xl py-3 items-center"
              >
                <Text className="text-sm font-semibold text-primary-foreground">Simpan</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Delete Confirm Modal */}
      <Modal visible={showDelete} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-card rounded-t-3xl p-6 pb-10">
            <Text className="text-lg font-semibold text-foreground mb-2">
              Hapus projek ini?
            </Text>
            <Text className="text-sm text-muted-foreground mb-4">
              Semua entri akan dipadam.
            </Text>
            <View className="flex-row">
              <Pressable
                onPress={() => setShowDelete(false)}
                className="flex-1 py-3 items-center"
              >
                <Text className="text-muted-foreground">Batal</Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteProject}
                className="flex-1 bg-expense rounded-2xl py-3 items-center"
              >
                <Text className="text-sm font-semibold text-white">Hapus</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}