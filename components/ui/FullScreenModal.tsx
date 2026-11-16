import type { ReactNode } from 'react';
import { Modal, View } from 'react-native';
import { colors } from '@/theme/tokens';
import { HeroScreen } from './HeroScreen';
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
    <Modal visible={visible} animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <View style={{ flex: 1, backgroundColor: colors.surface }}>
        <HeroScreen heroHeight={176} bottomPadding={48} hero={<TopBar title={title} onBack={onClose} />}>
          {children}
        </HeroScreen>
      </View>
    </Modal>
  );
}
