import { useCallback, useState } from 'react';
import { Linking, Pressable, View } from 'react-native';
import { Image } from 'expo-image';
import { useFocusEffect, useLocalSearchParams, useRouter } from 'expo-router';
import { Ellipsis, FileText, Pen, Trash2 } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { Button } from '@/components/ui/Button';
import { ConfirmSheet } from '@/components/ui/ConfirmSheet';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { SettingsRow } from '@/components/ui/SettingsRow';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { TopBar } from '@/components/ui/TopBar';
import { useToast } from '@/components/ui/ToastProvider';
import { useLock } from '@/context/LockContext';
import { useLearnProject } from '@/src/hooks/useLearnProject';
import { isPdfPath, pdfLabel } from '@/src/utils/attachments';
import { splitEntry } from '@/src/utils/learnEntry';

/** learn/[projectId]/entry — read view. Primary: Edit. Delete = text button → confirm. */
export default function EntryScreen() {
  const router = useRouter();
  const toast = useToast();
  const { suspend } = useLock();
  const { projectId, entryId } = useLocalSearchParams<{ projectId: string; entryId: string }>();
  const { project, entries, imageUrls, loading, refresh, deleteEntry } = useLearnProject(projectId);
  const [menu, setMenu] = useState(false);
  const [deleting, setDeleting] = useState(false);
  useFocusEffect(useCallback(() => { refresh(); }, [refresh]));

  const entry = entries.find((e) => e.id === entryId);
  const { title, notes } = splitEntry(entry?.body);
  const files = entry?.learn_entry_images ?? [];
  const photos = files.filter((f) => !isPdfPath(f.storage_path));
  const pdfs = files.filter((f) => isPdfPath(f.storage_path));
  const back = () => router.replace({ pathname: '/home/learn/[projectId]', params: { projectId: projectId ?? '' } });
  const edit = () => router.push({ pathname: '/home/learn/[projectId]/add-entry', params: { projectId: projectId ?? '', entryId: entryId ?? '' } });

  const remove = async () => {
    if (!entryId) return;
    const res = await deleteEntry(entryId);
    if (!res.ok) { toast.failure('Delete failed', { label: 'Retry', onPress: remove }); return; }
    setDeleting(false);
    toast.success('Entry deleted');
    back();
  };

  const openPdf = async (path: string) => {
    const url = imageUrls[path];
    if (!url) { toast.failure('Couldn’t open the file'); return; }
    suspend();
    await Linking.openURL(url).catch(() => toast.failure('No app on this phone can open the PDF'));
  };

  return (
    <HeroScreen
      heroHeight={164}
      bottomPadding={48}
      sheetPadding={{ top: 24, horizontal: 24 }}
      hero={<TopBar onBack={back} right={<GlassIconButton icon={Ellipsis} accessibilityLabel="More options" onPress={() => setMenu(true)} disabled={!entry} />} />}
      overlay={
        <>
          <Sheet visible={menu} onClose={() => setMenu(false)}>
            <SettingsRow label="Edit entry" icon={Pen} onPress={() => { setMenu(false); edit(); }} />
            <SettingsRow label="Delete entry" icon={Trash2} onPress={() => { setMenu(false); setDeleting(true); }} />
          </Sheet>
          <ConfirmSheet
            visible={deleting}
            title="Delete this entry?"
            message={`“${title || 'Untitled'}” and its attachments are removed from ${project?.name ?? 'this project'}.`}
            confirmLabel="Delete entry"
            loadingLabel="Deleting…"
            onConfirm={remove}
            onCancel={() => setDeleting(false)}
          />
        </>
      }
    >
      {loading && !entry ? (
        <View style={{ gap: 12 }}><Skeleton width="50%" height={12} /><Skeleton width="80%" height={32} /><Skeleton height={80} radius={radius.sm} /></View>
      ) : entry ? (
        <>
          <Text variant="label-sm" tone="muted">
            {project?.name} · {new Date(entry.created_at).toLocaleDateString('en-MY', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
          </Text>
          <Text variant="display-md" accessibilityRole="header">{title || 'Untitled'}</Text>
          {notes.split(/\n{2,}/).filter(Boolean).map((para, i) => <Text key={i} variant="body-lg">{para}</Text>)}
          {photos.length ? (
            <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
              {photos.map((p) => (
                <Image key={p.id} source={{ uri: imageUrls[p.storage_path] }} style={{ width: 104, height: 104, borderRadius: radius.sm, backgroundColor: colors['surface-container'] }} contentFit="cover" accessibilityLabel="Attached photo" />
              ))}
            </View>
          ) : null}
          {pdfs.map((p) => (
            <Pressable key={p.id} onPress={() => openPdf(p.storage_path)} accessibilityRole="link" style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 52 }}>
              <View style={{ width: 40, height: 40, borderRadius: 9999, backgroundColor: colors['surface-container'], alignItems: 'center', justifyContent: 'center' }}>
                <FileText size={19} color={colors['on-surface']} strokeWidth={1.75} />
              </View>
              <Text variant="body-md" style={{ flex: 1 }} numberOfLines={1}>{pdfLabel(p.storage_path)}</Text>
            </Pressable>
          ))}
          <View style={{ flex: 1, minHeight: 24 }} />
          <View style={{ gap: 4 }}>
            <Button label="Edit" icon={Pen} onPress={edit} fullWidth />
            <Button label="Delete" variant="text" muted onPress={() => setDeleting(true)} style={{ alignSelf: 'center' }} />
          </View>
        </>
      ) : (
        <Text variant="body-md" tone="muted">This entry no longer exists.</Text>
      )}
    </HeroScreen>
  );
}
