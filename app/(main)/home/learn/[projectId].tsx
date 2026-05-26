import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, Modal, TextInput, Image } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { ChevronLeft, DotsThreeVertical, Pencil, Trash2 } from '../../../../components/ui/icons';
import { useAuth } from '../../../../context/AuthContext';
import { useLearn } from '../../../../src/hooks/useLearn';
import { LoadingView } from '../../../../components/ui/LoadingView';
import { ErrorView } from '../../../../components/ui/ErrorView';
import { learnRepository } from '../../../../src/repositories/learn.repository';
import type { LearnEntry } from '../../../../src/types';

interface Project {
  id: string;
  name: string;
  emoji: string;
  entries: { id: string; text: string; images: string[]; timeAgo: string }[];
}

export default function ProjectDetailScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { entries, loading, error, fetchEntries } = useLearn();
  const [projectName, setProjectName] = useState('Loading...');
  const [showMenu, setShowMenu] = useState(false);
  const [showRename, setShowRename] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [renameText, setRenameText] = useState(projectName);

  useFocusEffect(useCallback(() => {
    if (projectId) {
      fetchEntries(projectId);
      // Fetch project name
      learnRepository.fetchEntries(projectId).then(() => {}); // entries call already
    }
  }, [projectId, fetchEntries]));

  if (loading) return <LoadingView />;

  const handleRename = async () => {
    await learnRepository.renameProject(projectId!, renameText);
    setProjectName(renameText);
    setShowRename(false);
  };

  const handleDeleteProject = async () => {
    await learnRepository.deleteProject(projectId!);
    router.back();
  };

  const project: Project = {
    id: projectId!,
    name: projectName,
    emoji: '📁',
    entries: entries.map((e: LearnEntry) => ({
      id: e.id,
      text: e.body ?? '',
      images: (e.learn_entry_images ?? []).map((img: any) => img.storage_path ?? ''),
      timeAgo: e.updated_at ? new Date(e.updated_at).toLocaleString() : 'Recently',
    })),
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
              <Text className="text-foreground font-medium">No entries yet</Text>
              <Text className="text-muted-foreground text-sm mt-1">
                {"Tap '+ Add Entry' to add your first note"}
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
          <Text className="text-sm font-semibold text-primary-foreground">+ Add Entry</Text>
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
              <Text className="text-expense">Delete Project</Text>
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
                  setRenameText(projectName);
                }}
                className="flex-1 py-3 items-center"
              >
                <Text className="text-muted-foreground">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleRename}
                className="flex-1 bg-primary rounded-2xl py-3 items-center"
              >
                <Text className="text-sm font-semibold text-primary-foreground">Save</Text>
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
              Delete this project?
            </Text>
            <Text className="text-sm text-muted-foreground mb-4">
              All entries will be deleted.
            </Text>
            <View className="flex-row">
              <Pressable
                onPress={() => setShowDelete(false)}
                className="flex-1 py-3 items-center"
              >
                <Text className="text-muted-foreground">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleDeleteProject}
                className="flex-1 bg-expense rounded-2xl py-3 items-center"
              >
                <Text className="text-sm font-semibold text-white">Delete</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}