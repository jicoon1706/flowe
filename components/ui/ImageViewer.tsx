import { useEffect, useRef, useState } from 'react';
import { FlatList, View, useWindowDimensions, type NativeScrollEvent, type NativeSyntheticEvent } from 'react-native';
import { Image } from 'expo-image';
import { Gesture, GestureDetector, GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { runOnJS, useAnimatedStyle, useSharedValue, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ChevronLeft, ChevronRight, X } from 'lucide-react-native';
import { colors } from '@/theme/tokens';
import { clampViewerIndex } from '@/src/utils/imageViewer';
import { GlassIconButton } from './GlassIconButton';
import { SystemModal } from './SystemModal';
import { Text } from './Text';

export interface ImageViewerImage {
  uri: string | undefined;
  /** Stable key (row id); falls back to the index. */
  key?: string;
}

export interface ImageViewerProps {
  images: ImageViewerImage[];
  /** Photo to show; null keeps the viewer closed. */
  index: number | null;
  onClose: () => void;
}

/** Drag distance (px) past which a swipe down closes the viewer. */
const CLOSE_DISTANCE = 120;

/**
 * Full-screen photo viewer: swipe or chevrons to page, X / Android back / swipe down to close.
 * Photos are drawn whole (contain) on black, inside the safe area.
 */
export function ImageViewer({ images, index, onClose }: ImageViewerProps) {
  const start = clampViewerIndex(index, images.length);
  return (
    <SystemModal visible={start !== null} animationType="fade" onRequestClose={onClose}>
      <ImageViewerContent images={images} start={start} onClose={onClose} />
    </SystemModal>
  );
}

/** Rendered inside the modal's own SafeAreaProvider, so the insets are the modal window's. */
function ImageViewerContent({ images, start, onClose }: { images: ImageViewerImage[]; start: number | null; onClose: () => void }) {
  const visible = start !== null;
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();
  const list = useRef<FlatList<ImageViewerImage>>(null);
  const [current, setCurrent] = useState(start ?? 0);
  const dragY = useSharedValue(0);

  // Each open starts at the tapped photo with the drag reset.
  useEffect(() => {
    if (start === null) return;
    setCurrent(start);
    dragY.value = 0;
  }, [start, dragY]);

  const goTo = (i: number) => {
    const next = clampViewerIndex(i, images.length);
    if (next === null) return;
    setCurrent(next);
    list.current?.scrollToIndex({ index: next, animated: true });
  };

  const onScrollEnd = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
    const next = clampViewerIndex(e.nativeEvent.contentOffset.x / width, images.length);
    if (next !== null) setCurrent(next);
  };

  // Vertical only: fails as soon as the finger moves sideways, so paging keeps working.
  const swipeDown = Gesture.Pan()
    .activeOffsetY(16)
    .failOffsetX([-16, 16])
    .onUpdate((e) => { dragY.value = Math.max(0, e.translationY); })
    .onEnd((e) => {
      if (e.translationY > CLOSE_DISTANCE || e.velocityY > 1200) runOnJS(onClose)();
      else dragY.value = withTiming(0, { duration: 160 });
    });

  const pageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: dragY.value }],
    opacity: 1 - Math.min(dragY.value / (CLOSE_DISTANCE * 3), 0.6),
  }));

  const count = images.length;
  return (
    <GestureHandlerRootView style={{ flex: 1, backgroundColor: colors.secondary }}>
        <GestureDetector gesture={swipeDown}>
          <Animated.View style={[{ flex: 1 }, pageStyle]}>
            {visible ? (
              <FlatList
                ref={list}
                data={images}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                initialScrollIndex={start}
                getItemLayout={(_, i) => ({ length: width, offset: width * i, index: i })}
                keyExtractor={(item, i) => item.key ?? String(i)}
                onMomentumScrollEnd={onScrollEnd}
                renderItem={({ item, index: i }) => (
                  <View style={{ width, height, paddingTop: insets.top + 64, paddingBottom: insets.bottom + 64, paddingLeft: insets.left, paddingRight: insets.right }}>
                    <Image
                      source={item.uri ? { uri: item.uri } : undefined}
                      style={{ flex: 1 }}
                      contentFit="contain"
                      accessibilityLabel={`Photo ${i + 1} of ${count}`}
                    />
                  </View>
                )}
              />
            ) : null}
          </Animated.View>
        </GestureDetector>

        <View
          pointerEvents="box-none"
          style={{ position: 'absolute', top: insets.top + 8, left: insets.left + 16, right: insets.right + 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}
        >
          <View style={{ width: 44 }} />
          <Text variant="label-lg" tone="inverse" tabular accessibilityLiveRegion="polite" accessibilityLabel={`Photo ${current + 1} of ${count}`}>
            {current + 1} / {count}
          </Text>
          <GlassIconButton icon={X} accessibilityLabel="Close photo viewer" onPress={onClose} />
        </View>

        {current > 0 ? (
          <View style={{ position: 'absolute', left: insets.left + 16, top: height / 2 - 22 }}>
            <GlassIconButton icon={ChevronLeft} accessibilityLabel="Previous photo" onPress={() => goTo(current - 1)} />
          </View>
        ) : null}
        {current < count - 1 ? (
          <View style={{ position: 'absolute', right: insets.right + 16, top: height / 2 - 22 }}>
            <GlassIconButton icon={ChevronRight} accessibilityLabel="Next photo" onPress={() => goTo(current + 1)} />
          </View>
        ) : null}
    </GestureHandlerRootView>
  );
}
