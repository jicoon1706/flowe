import { useEffect, useState } from 'react';
import Animated, { FadeOut } from 'react-native-reanimated';
import { accountsRepository } from '@/src/repositories/accounts.repository';
import { LaunchScreen } from '../ui/LaunchScreen';

/** The splash never holds the app longer than this (q-launch-1). */
const MAX_MS = 1500;

/**
 * Launch step 1 (q-launch-1): the splash gains a thin glass progress bar while
 * accounts load — at most 1.5 s, then it fades and Home shows the last-known
 * figures with "Updating…" until the live ones land (q-launch-2).
 */
export function LaunchSync() {
  const [visible, setVisible] = useState(true);
  const [progress, setProgress] = useState(0.2);
  const [label, setLabel] = useState('Syncing…');

  useEffect(() => {
    let done = false;
    const finish = () => { if (!done) { done = true; setProgress(1); setTimeout(() => setVisible(false), 200); } };
    const timer = setTimeout(finish, MAX_MS);
    const tick = setTimeout(() => setProgress(0.55), 300);
    accountsRepository.fetchAllActive().then((r) => {
      if (r.ok) setLabel(`Syncing ${r.data.length} account${r.data.length === 1 ? '' : 's'}…`);
      finish();
    });
    return () => { clearTimeout(timer); clearTimeout(tick); done = true; };
  }, []);

  if (!visible) return null;
  return (
    <Animated.View exiting={FadeOut.duration(240)} style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, zIndex: 300 }} pointerEvents="none">
      <LaunchScreen syncingLabel={label} progress={progress} />
    </Animated.View>
  );
}
