import { useEffect, useState } from 'react';
import { Keyboard, Platform } from 'react-native';

/**
 * Height of the on-screen keyboard, or 0 when it's closed.
 *
 * Bottom sheets sit in their own `<Modal>` window, which Android's
 * `adjustResize` does not resize — so a field near the bottom of a sheet ends
 * up underneath the keyboard and the user can't see what they're typing.
 * Padding the sheet by this value lifts it clear without restructuring the
 * layout or fighting `KeyboardAvoidingView` inside a modal.
 */
export function useKeyboardHeight(): number {
  const [height, setHeight] = useState(0);

  useEffect(() => {
    // `Will*` fires before the animation on iOS, giving a smooth lift; Android
    // only ever emits the `Did*` pair.
    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const show = Keyboard.addListener(showEvent, (e) => setHeight(e.endCoordinates.height));
    const hide = Keyboard.addListener(hideEvent, () => setHeight(0));

    return () => {
      show.remove();
      hide.remove();
    };
  }, []);

  return height;
}
