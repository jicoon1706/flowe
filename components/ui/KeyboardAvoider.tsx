import { KeyboardAvoidingView, Platform } from 'react-native';
import type { ReactNode } from 'react';

interface KeyboardAvoiderProps {
  children: ReactNode;
  /**
   * Extra space to keep between the keyboard and the focused field. Screens
   * with a pinned footer (a Save button over the form) need the footer's height
   * here, or the keyboard stops exactly where the button starts.
   */
  offset?: number;
  className?: string;
}

/**
 * Lifts its content clear of the on-screen keyboard.
 *
 * Android's manifest already asks for `adjustResize`, but that only resizes the
 * *activity* window: content inside a `<Modal>` lives in its own window and is
 * left underneath the keyboard, and with edge-to-edge enabled even plain
 * screens can end up with the focused input hidden behind it. Wrapping the
 * scrollable body in this fixes both, which is why every form that takes typed
 * input uses it rather than relying on the manifest alone.
 *
 * `padding` is the correct behaviour on both platforms here: the children are
 * scroll views that should shrink, not slide, so the field the user is typing
 * in stays put instead of jumping.
 */
export function KeyboardAvoider({ children, offset = 0, className }: KeyboardAvoiderProps) {
  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={offset}
      className={className}
      style={{ flex: 1 }}
    >
      {children}
    </KeyboardAvoidingView>
  );
}
