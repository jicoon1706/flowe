import { useCallback, useState } from 'react';
import { RefreshControl, View } from 'react-native';
import { Pressable } from '@/components/ui/Pressable';
import { useFocusEffect, useRouter } from 'expo-router';
import { BookOpen, Plus, RefreshCw } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { LEARN_COVERS } from '@/constants/photos';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { GlassIconButton } from '@/components/ui/GlassIconButton';
import { HeroScreen } from '@/components/ui/HeroScreen';
import { ResponsiveGrid } from '@/src/components/ui/ResponsiveGrid';
import { PhotoSlot } from '@/components/ui/PhotoSlot';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { TextInput } from '@/components/ui/TextInput';
import { TopBar } from '@/components/ui/TopBar';
import { useToast } from '@/components/ui/ToastProvider';
import { useAuth } from '@/context/AuthContext';
import { useLearn } from '@/src/hooks/useLearn';
import type { LearnProjectWithEntries } from '@/src/types';

function lastLabel(iso?: string): string {
  if (!iso) return '';
  return new Date(iso).toLocaleDateString('en-MY', { weekday: 'short' });
}

/** home/learn — projects with Unsplash covers (first 3); tap → project; "+" new project. */
export default function LearnScreen() {
  const router = useRouter();
  const toast = useToast();
  const { user } = useAuth();
  const { projects, loading, error, fetchProjects, createProject } = useLearn();
  const [creating, setCreating] = useState(false);
  const [name, setName] = useState('');
  const [saving, setSaving] = useState(false);
  const [fetched, setFetched] = useState(false);

  const load = useCallback(async () => { if (user) { await fetchProjects(user.id); setFetched(true); } }, [user, fetchProjects]);
  useFocusEffect(useCallback(() => { load(); }, [load]));

  const list = projects as LearnProjectWithEntries[];
  const totalEntries = list.reduce((s, p) => s + (p.learn_entries?.length ?? 0), 0);
  const lastEntry = list.flatMap((p) => p.learn_entries ?? []).sort((a, b) => b.updated_at.localeCompare(a.updated_at))[0];

  const create = async () => {
    if (!user || !name.trim()) return;
    setSaving(true);
    const res = await createProject(user.id, name.trim());
    setSaving(false);
    if (!res.ok) { toast.failure('Couldn’t create project', { label: 'Retry', onPress: create }); return; }
    setCreating(false);
    setName('');
    router.push(`/home/learn/${res.data.id}`);
  };

  const firstLoad = loading && !fetched;

  return (
    <HeroScreen
      heroHeight={240}
      refreshControl={<RefreshControl refreshing={loading && fetched} onRefresh={load} tintColor={colors['on-primary']} />}
      hero={
        <View>
          <TopBar title="Learn" onBack={() => router.back()} right={<GlassIconButton icon={Plus} accessibilityLabel="New project" onPress={() => setCreating(true)} />} />
          <View style={{ paddingHorizontal: 24, marginTop: 20, gap: 4 }}>
            {firstLoad ? <Skeleton width={160} height={32} tone="glass" /> : (
              <>
                <Text variant="display-md" tone="inverse">{list.length} project{list.length === 1 ? '' : 's'}</Text>
                <Text variant="body-md" tone="soft">{totalEntries} entr{totalEntries === 1 ? 'y' : 'ies'}{lastEntry ? ` · last on ${lastLabel(lastEntry.updated_at)}` : ''}</Text>
              </>
            )}
          </View>
        </View>
      }
      overlay={
        <Sheet visible={creating} onClose={() => setCreating(false)} title="New project" dismissible={!saving}>
          <View style={{ gap: 16 }}>
            <TextInput label="Project name" value={name} onChangeText={setName} autoFocus autoCapitalize="sentences" returnKeyType="done" onSubmitEditing={create} placeholder="e.g. Budgeting 101" />
            <Button label="Create project" onPress={create} loading={saving} disabled={!name.trim()} fullWidth />
          </View>
        </Sheet>
      }
    >
      {firstLoad ? (
        <View style={{ gap: 20 }} accessibilityLabel="Loading projects">
          {/* Same grid as the loaded list: one column on phone, two on tablet (t-q-skel-learn). */}
          <ResponsiveGrid gap={16} rowGap={20}>
            {[0, 1, 2].map((i) => (
              <View key={i} style={{ gap: 10 }}>
                <Skeleton height={120} radius={radius.md} />
                <Skeleton width="50%" height={14} />
                <Skeleton height={6} />
              </View>
            ))}
          </ResponsiveGrid>
        </View>
      ) : error && !list.length ? (
        <EmptyState icon={RefreshCw} title="Couldn’t load your projects" body="Check your connection and try again." ctaLabel="Try again" onCta={load} />
      ) : !list.length ? (
        <EmptyState icon={BookOpen} title="Start a learning project" body="Keep notes on what you learn about money, one project at a time." ctaLabel="New project" ctaIcon={Plus} onCta={() => setCreating(true)} />
      ) : (
        <ResponsiveGrid gap={16}>
          {list.map((p, i) => {
            const n = p.learn_entries?.length ?? 0;
            return (
              <Pressable key={p.id} onPress={() => router.push(`/home/learn/${p.id}`)} accessibilityRole="link" accessibilityLabel={`${p.name}, ${n} entries`} style={({ pressed }) => ({ gap: 10, opacity: pressed ? 0.8 : 1 })}>
                {i < 3 ? <PhotoSlot photo={LEARN_COVERS[i]} style={{ height: 120, borderRadius: radius.md }} /> : null}
                <View>
                  <Text variant="body-lg" weight={500}>{p.name}</Text>
                  <Text variant="label-sm" tone="muted">{n} entr{n === 1 ? 'y' : 'ies'}</Text>
                </View>
              </Pressable>
            );
          })}
        </ResponsiveGrid>
      )}
    </HeroScreen>
  );
}
