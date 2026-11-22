import { useCallback, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { BookOpen, Ellipsis, FileText, Image as ImageIcon, Pen, Plus, RefreshCw, Trash2 } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { LEARN_COVERS } from '@/constants/photos';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassChip } from '@/components/ui/GlassChip';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { ResponsiveContainer } from '@/components/ui/ResponsiveContainer';
import { PhotoSlot } from '@/components/ui/PhotoSlot';
import { SectionHeader } from '@/components/ui/SectionHeader';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { TextInput } from '@/components/ui/TextInput';
import { TopBar } from '@/components/ui/TopBar';
import { useToast } from '@/components/ui/ToastProvider';
import { useLearnProject } from '@/src/hooks/useLearnProject';
import { isPdfPath } from '@/src/utils/attachments';
import { splitEntry } from '@/src/utils/learnEntry';

/** home/learn/[projectId] — entries; Primary: Add entry (black). ⋯ = rename, delete. */
export default function LearnProjectScreen() {
  const router = useRouter();
  const toast = useToast();
  const { projectId } = useLocalSearchParams<{ projectId: string }>();
  const { project, entries, loading, error, refresh, rename, remove } = useLearnProject(projectId);
  const [menu, setMenu] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [newName, setNewName] = useState('');
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const doRename = async () => {
    const res = await rename(newName.trim());
    if (!res.ok) { toast.failure('Couldn’t rename project', { label: 'Retry', onPress: doRename }); return; }
    setRenaming(false);
    refresh();
  };
  const doDelete = async () => {
    const res = await remove();
    if (!res.ok) { toast.failure('Delete failed', { label: 'Retry', onPress: doDelete }); return; }
    setDeleting(false);
    toast.success(`${project?.name ?? 'Project'} deleted`);
    router.replace('/home/learn');
  };

  const firstLoad = loading && !project;

  return (
    <HeroScreen
      contentWidth="form"
      heroColumn={false}
      heroHeight={300}
      refreshControl={<RefreshControl refreshing={loading && !!project} onRefresh={refresh} tintColor={colors['on-primary']} />}
      hero={
        <View style={{ flex: 1 }}>
          <PhotoSlot photo={LEARN_COVERS[0]} style={{ position: 'absolute', left: 0, right: 0, top: -80, bottom: -24 }} />
          <ResponsiveContainer variant="form" style={{ flex: 1 }}>
            <TopBar onBack={() => router.replace('/home/learn')} right={<GlassIconButton icon={Ellipsis} accessibilityLabel="More options" onPress={() => setMenu(true)} disabled={!project} />} />
            <View style={{ paddingHorizontal: 24, marginTop: 64, gap: 8 }}>
              {firstLoad ? <Skeleton width={200} height={32} tone="glass" /> : (
                <>
                  <Text variant="display-md" tone="inverse" accessibilityRole="header">{project?.name}</Text>
                  <GlassChip icon={BookOpen} label={`${entries.length} entr${entries.length === 1 ? 'y' : 'ies'}`} />
                </>
              )}
            </View>
          </ResponsiveContainer>
        </View>
      }
      overlay={
        <>
          <Sheet visible={menu} onClose={() => setMenu(false)} title={project?.name}>
            <SettingsRow label="Rename project" icon={Pen} onPress={() => { setMenu(false); setNewName(project?.name ?? ''); setRenaming(true); }} />
            <SettingsRow label="Delete project" icon={Trash2} onPress={() => { setMenu(false); setDeleting(true); }} />
          </Sheet>
          <Sheet visible={renaming} onClose={() => setRenaming(false)} title="Rename project">
            <View style={{ gap: 16 }}>
              <TextInput label="Project name" value={newName} onChangeText={setNewName} autoFocus />
              <Button label="Save" onPress={doRename} disabled={!newName.trim()} fullWidth />
            </View>
          </Sheet>
          <ConfirmSheet
            visible={deleting}
            title={`Delete ${project?.name ?? 'this project'}?`}
            message={`Its ${entries.length} entr${entries.length === 1 ? 'y' : 'ies'} are deleted with it. This can’t be undone.`}
            confirmLabel="Delete project"
            loadingLabel="Deleting…"
            onConfirm={doDelete}
            onCancel={() => setDeleting(false)}
          />
        </>
      }
    >
      <SectionHeader title="Entries" />
      {firstLoad ? (
        <View style={{ gap: 12 }}>
          {[0, 1, 2].map((i) => <View key={i} style={{ flexDirection: 'row', gap: 12 }}><Skeleton width={40} height={40} /><View style={{ flex: 1, gap: 6 }}><Skeleton width="60%" height={14} /><Skeleton width="30%" height={10} /></View></View>)}
        </View>
      ) : error && !entries.length ? (
        <EmptyState icon={RefreshCw} title="Couldn’t load entries" body="Check your connection and try again." ctaLabel="Try again" onCta={refresh} />
      ) : !entries.length ? (
        <Text variant="body-md" tone="muted">No entries yet. Add your first note below.</Text>
      ) : (
        <View>
          {entries.map((e) => {
            const { title } = splitEntry(e.body);
            const files = e.learn_entry_images ?? [];
            const icon = files.some((f) => !isPdfPath(f.storage_path)) ? ImageIcon : FileText;
            return (
              <SettingsRow
                key={e.id}
                label={title || 'Untitled'}
                value={new Date(e.created_at).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short' })}
                icon={icon}
                onPress={() => router.push({ pathname: '/home/learn/[projectId]/entry', params: { projectId: projectId ?? '', entryId: e.id } })}
              />
            );
          })}
        </View>
      )}
      <Button label="Add entry" icon={Plus} onPress={() => router.push({ pathname: '/home/learn/[projectId]/add-entry', params: { projectId: projectId ?? '', entryId: '' } })} fullWidth style={{ marginTop: 8 }} />
    </HeroScreen>
  );
}
