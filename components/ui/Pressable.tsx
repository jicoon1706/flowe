import { forwardRef, useState } from 'react';
import { Pressable as RNPressable, type GestureResponderEvent, type PressableProps, type View } from 'react-native';

/**
 * Drop-in for react-native's Pressable that resolves a function `style`
 * (`({ pressed }) => …`) here and hands RN a plain style.
 *
 * NativeWind's css-interop wraps Pressable, and on Android (new arch) it drops
 * function styles entirely: no fill, no padding, no height. Use this wrapper
 * whenever `style` is a function.
 */
export const Pressable = forwardRef<View, PressableProps>(function Pressable(
  { style, onPressIn, onPressOut, ...rest },
  ref,
) {
  const [pressed, setPressed] = useState(false);
  const resolved = typeof style === 'function' ? style({ pressed, hovered: false }) : style;
  return (
    <RNPressable
      ref={ref}
      {...rest}
      style={resolved}
      onPressIn={(e: GestureResponderEvent) => {
        setPressed(true);
        onPressIn?.(e);
      }}
      onPressOut={(e: GestureResponderEvent) => {
        setPressed(false);
        onPressOut?.(e);
      }}
    />
  );
});
