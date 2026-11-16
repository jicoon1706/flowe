import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { View } from 'react-native';
import Animated, { FadeInDown, FadeOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Toast, type ToastAction, type ToastKind } from './Toast';

export interface ToastInput {
  kind: ToastKind;
  message: string;
  action?: ToastAction;
  /** ms; defaults: success 3 s, success with an action (Undo) 5 s, failure stays until dismissed. */
  duration?: number;
}

interface ToastState extends ToastInput {
  id: number;
}

interface ToastApi {
  show: (toast: ToastInput) => void;
  success: (message: string, action?: ToastAction) => void;
  failure: (message: string, action?: ToastAction) => void;
  hide: () => void;
}

const ToastContext = createContext<ToastApi | null>(null);

/** Default lifetime: success 3 s; Undo/Open 5 s; failure sticky (null). */
export function toastDuration(t: ToastInput): number | null {
  if (t.duration !== undefined) return t.duration;
  if (t.kind === 'failure') return null;
  return t.action ? 5000 : 3000;
}

/** Hosts the single toast slot, 104 px above the bottom (clears the floating nav). */
export function ToastProvider({ children, bottomOffset = 104 }: { children: ReactNode; bottomOffset?: number }) {
  const [toast, setToast] = useState<ToastState | null>(null);
  const seq = useRef(0);
  const insets = useSafeAreaInsets();

  const hide = useCallback(() => setToast(null), []);
  const show = useCallback((t: ToastInput) => {
    seq.current += 1;
    setToast({ ...t, id: seq.current });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const ms = toastDuration(toast);
    if (ms === null) return;
    const timer = setTimeout(() => setToast((cur) => (cur?.id === toast.id ? null : cur)), ms);
    return () => clearTimeout(timer);
  }, [toast]);

  const api = useMemo<ToastApi>(() => ({
    show,
    hide,
    success: (message, action) => show({ kind: 'success', message, action }),
    failure: (message, action) => show({ kind: 'failure', message, action }),
  }), [show, hide]);

  return (
    <ToastContext.Provider value={api}>
      {children}
      <View pointerEvents="box-none" style={{ position: 'absolute', left: 16, right: 16, bottom: bottomOffset + insets.bottom / 2, alignItems: 'center' }}>
        {toast ? (
          <Animated.View key={toast.id} entering={FadeInDown.duration(180)} exiting={FadeOutDown.duration(160)} style={{ maxWidth: '100%' }}>
            <Toast
              kind={toast.kind}
              message={toast.message}
              onDismiss={hide}
              action={toast.action ? { label: toast.action.label, onPress: () => { hide(); toast.action?.onPress(); } } : undefined}
            />
          </Animated.View>
        ) : null}
      </View>
    </ToastContext.Provider>
  );
}

export function useToast(): ToastApi {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used inside <ToastProvider>');
  return ctx;
}
