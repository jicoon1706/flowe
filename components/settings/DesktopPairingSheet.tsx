import { useCallback, useEffect, useState } from 'react';
import { View } from 'react-native';
import { RefreshCw } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { Button } from '@/components/ui/Button';
import { InlineError } from '@/components/ui/InlineError';
import { Sheet } from '@/components/ui/Sheet';
import { Skeleton } from '@/components/ui/Skeleton';
import { Text } from '@/components/ui/Text';
import { edgeFunctionsService, type DesktopPairingCode } from '@/src/services/edgeFunctions';

interface DesktopPairingSheetProps {
  visible: boolean;
  onClose: () => void;
}

function remaining(expiresAt: string, now: number): string {
  const s = Math.max(0, Math.round((new Date(expiresAt).getTime() - now) / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}

/**
 * Settings › Security › Use Flowe on desktop. Shows a one-time code to type
 * on the computer, followed by the same PIN as this phone.
 */
export function DesktopPairingSheet({ visible, onClose }: DesktopPairingSheetProps) {
  const [pairing, setPairing] = useState<DesktopPairingCode | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    const res = await edgeFunctionsService.createDesktopPairingCode();
    setLoading(false);
    if (res.ok) setPairing(res.data);
    else { setPairing(null); setError('Couldn’t get a code. Check your connection and try again.'); }
  }, []);

  useEffect(() => {
    if (visible) load();
    else setPairing(null);
  }, [visible, load]);

  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [visible]);

  const expired = pairing ? new Date(pairing.expiresAt).getTime() <= now : false;

  return (
    <Sheet visible={visible} onClose={onClose} title="Use Flowe on desktop" testID="desktop-pairing">
      <View style={{ gap: 16 }}>
        <Text variant="body-md" tone="meta">
          Open Flowe Desktop on your computer and type this code, then your PIN.
        </Text>
        <View style={{ backgroundColor: colors['surface-container'], borderRadius: radius.sm, paddingVertical: 24, alignItems: 'center', gap: 8 }}>
          {loading ? (
            <Skeleton width={200} height={40} radius={radius.sm} />
          ) : pairing && !expired ? (
            <>
              <Text variant="display-md" tabular accessibilityLabel={`Code ${pairing.code.split('').join(' ')}`} selectable>{pairing.code}</Text>
              <Text variant="label-sm" tone="meta" tabular>Expires in {remaining(pairing.expiresAt, now)}</Text>
            </>
          ) : (
            <Text variant="body-md" tone="meta">{expired ? 'This code has expired.' : 'No code yet.'}</Text>
          )}
        </View>
        {error ? <InlineError message={error} /> : null}
        <Button label={pairing && !expired ? 'New code' : 'Get a code'} variant={pairing && !expired ? 'action' : 'primary'} icon={RefreshCw} loading={loading} onPress={load} fullWidth />
        <Text variant="caption" tone="meta">The code works once, for 5 minutes. Fingerprint unlock stays on this phone.</Text>
      </View>
    </Sheet>
  );
}
