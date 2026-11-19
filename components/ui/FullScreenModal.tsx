import type { ReactNode } from 'react';
import { View } from 'react-native';
import { colors } from '@/theme/tokens';
import { HeroScreen } from './HeroScreen';
import { SystemModal } from './SystemModal';
import { TopBar } from './TopBar';

export interface FullScreenModalProps {
  visible: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
}

/** A read-only full screen opened from another (diagram, patterns): gradient title bar + white sheet. */
export function FullScreenModal({ visible, title, onClose, children }: FullScreenModalProps) {
  return (
    <SystemModal visible={visible} animationType="slide" onRequestClose={onClose}>
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <HeroScreen heroHeight={176} bottomPadding={48} contentWidth="form" hero={<TopBar title={title} onBack={onClose} />}>
          {children}
        </HeroScreen>
      </View>
    </SystemModal>
  );
}
