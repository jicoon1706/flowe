import { useState, useCallback } from 'react';
import { View, Text, ScrollView, Pressable, TextInput, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { ChevronLeft } from '../../../../components/ui/icons';
import { useAuth } from '../../../../context/AuthContext';
import { useLearn } from '../../../../src/hooks/useLearn';
import { LoadingView } from '../../../../components/ui/LoadingView';
import { ErrorView } from '../../../../components/ui/ErrorView';

interface Project {
  id: string;
  name: string;
  emoji: string;
  entriesCount: number;
  lastUpdated: string;
  latestEntry: string;
}

export default function LearnIndexScreen() {
  const router = useRouter();
  const { user } = useAuth();
  const { projects: hookProjects, loading, error, createProject, fetchEntries } = useLearn();
  const [showModal, setShowModal] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [localProjects, setLocalProjects] = useState<Project[]>([]);

  useFocusEffect(useCallback(() => {
    // hookProjects are empty from useLearn, local state is source of truth for now
    // Projects come from learn_projects table - local state drives UI until fetchProjects is added
  }, []));

  if (loading) return <LoadingView />;

  const projects = localProjects.length > 0 ? localProjects : [];
  const totalEntries = projects.reduce((sum, p) => sum + p.entriesCount, 0);

  const handleCreateProject = async () => {
    if (!newProjectName.trim() || !user) return;
    const result = await createProject(user.id, newProjectName.trim());
    if (result.ok) {
      const newProject: Project = {
        id: result.data.id,
        name: result.data.name,
        emoji: '📁',
        entriesCount: 0,
        lastUpdated: 'Just now',
        latestEntry: '',
      };
      setLocalProjects(prev => [...prev, newProject]);
      setNewProjectName('');
      setShowModal(false);
      router.push(`/home/learn/${result.data.id}`);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-background" edges={['top']}>
      {/* Header */}
      <View className="flex-row items-center px-4 py-3 border-b border-border">
        <Pressable onPress={() => router.back()} className="mr-3">
          <ChevronLeft size={24} color="#fff" />
        </Pressable>
        <Text className="text-xl font-semibold text-foreground">Personal Finance Notes</Text>
      </View>

      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Stats Card */}
        <View className="mx-4 mt-4 bg-card rounded-2xl p-4 border border-border">
          <View className="flex-row">
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground">Projects</Text>
              <Text className="text-lg font-bold text-foreground">{projects.length}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground">Entries</Text>
              <Text className="text-lg font-bold text-foreground">{totalEntries}</Text>
            </View>
            <View className="flex-1">
              <Text className="text-xs text-muted-foreground">Images</Text>
              <Text className="text-lg font-bold text-foreground">0</Text>
            </View>
          </View>
        </View>

        {/* Add Project Button */}
        <View className="px-4 mt-4">
          <Pressable
            onPress={() => setShowModal(true)}
            className="flex-row items-center justify-center bg-card rounded-2xl py-3 border border-dashed border-border"
            style={{ borderStyle: 'dashed' }}
          >
            <Text className="text-primary font-semibold">+ Add Project</Text>
          </Pressable>
        </View>

        {/* Projects List */}
        <View className="px-4 mt-4 mb-6">
          {projects.length === 0 ? (
            <View className="items-center py-12">
              <Text className="text-4xl mb-3">📁</Text>
              <Text className="text-foreground font-medium">No projects yet</Text>
              <Text className="text-muted-foreground text-sm mt-1">
                Create your first project to start tracking
              </Text>
            </View>
          ) : (
            projects.map((project) => (
              <Pressable
                key={project.id}
                onPress={() => router.push(`/home/learn/${project.id}`)}
                className="bg-card rounded-2xl p-4 mb-3 border border-border"
              >
                <View className="flex-row items-center mb-2">
                  <Text className="text-2xl mr-3">{project.emoji}</Text>
                  <View className="flex-1">
                    <Text className="text-sm font-medium text-foreground">{project.name}</Text>
                    <Text className="text-xs text-muted-foreground mt-0.5">
                      {project.entriesCount} entries • Updated {project.lastUpdated}
                    </Text>
                  </View>
                </View>
                {project.latestEntry ? (
                  <Text className="text-xs text-muted-foreground" numberOfLines={2}>
                    {project.latestEntry}
                  </Text>
                ) : null}
              </Pressable>
            ))
          )}
        </View>
      </ScrollView>

      {/* Create Project Modal */}
      <Modal visible={showModal} transparent animationType="slide">
        <View className="flex-1 justify-end bg-black/60">
          <View className="bg-card rounded-t-3xl p-6 pb-10">
            <Text className="text-lg font-semibold text-foreground mb-4">New Project</Text>
            <TextInput
              className="bg-background border border-border rounded-xl px-4 py-3 text-foreground mb-4"
              placeholder="Project name"
              placeholderTextColor="#888"
              value={newProjectName}
              onChangeText={setNewProjectName}
              maxLength={50}
            />
            <View className="flex-row">
              <Pressable
                onPress={() => {
                  setShowModal(false);
                  setNewProjectName('');
                }}
                className="flex-1 py-3 items-center"
              >
                <Text className="text-muted-foreground">Cancel</Text>
              </Pressable>
              <Pressable
                onPress={handleCreateProject}
                className="flex-1 bg-primary rounded-2xl py-3 items-center"
              >
                <Text className="text-sm font-semibold text-primary-foreground">Create Project</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}