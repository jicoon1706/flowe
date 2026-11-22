import type { ReactNode } from 'react';
import { View } from 'react-native';
import type { LucideIcon } from 'lucide-react-native';
import { colors, radius } from '@/theme/tokens';
import { Button } from './Button';
import { Text } from './Text';

export interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  body?: string;
  ctaLabel?: string;
  ctaIcon?: LucideIcon;
  onCta?: () => void;
  ctaLoading?: boolean;
  /** Replaces the icon well (photo or ghost illustration). */
  art?: ReactNode;
  /** 'gradient' when drawn on the hero field (white CTA, white text). */
  on?: 'surface' | 'gradient';
}

/** Illustration + title + one sentence + one CTA. Also used for error states ("Try again"). */
export function EmptyState({ icon: Icon, title, body, ctaLabel, ctaIcon, onCta, ctaLoading, art, on = 'surface' }: EmptyStateProps) {
  const g = on === 'gradient';
  return (
    <View style={{ alignItems: 'center', gap: 16, paddingHorizontal: 16, paddingVertical: 8 }}>
      {art ?? (Icon ? (
        <View style={{ width: 120, height: 120, borderRadius: radius.full, backgroundColor: g ? colors.glass : colors['surface-container'], alignItems: 'center', justifyContent: 'center' }}>
          <Icon size={48} color={g ? colors['on-primary'] : colors['on-surface']} strokeWidth={1.5} />
        </View>
      ) : null)}
      <Text variant="headline-md" tone={g ? 'inverse' : 'default'} align="center">{title}</Text>
      {body ? <Text variant="body-md" tone={g ? 'soft' : 'muted'} align="center">{body}</Text> : null}
      {ctaLabel && onCta ? (
        <Button label={ctaLabel} icon={ctaIcon} onPress={onCta} loading={ctaLoading} variant={g ? 'white' : 'primary'} style={{ minWidth: 200 }} />
      ) : null}
    </View>
  );
}
