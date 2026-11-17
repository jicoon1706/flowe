import { useCallback, useEffect } from 'react';
import { useFocusEffect } from 'expo-router';
import { setStatusBarStyle } from 'expo-status-bar';

type BarStyle = 'light' | 'dark';

/** The style the focused screen asked for; overlays restore it when they close. */
let screenStyle: BarStyle = 'light';

/**
 * Sets the status-bar icon colour while the calling screen is focused and
 * restores the app default ('light', for the gradient every phone screen
 * starts with) when it loses focus. Tabs stay mounted in the background, so a
 * <StatusBar> element would keep winning after the user leaves the screen.
 * `enabled` false leaves the bar alone.
 */
export function useFocusStatusBar(style: BarStyle, enabled = true): void {
  useFocusEffect(
    useCallback(() => {
      if (!enabled) return undefined;
      screenStyle = style;
      setStatusBarStyle(style);
      return () => {
        screenStyle = 'light';
        setStatusBarStyle('light');
      };
    }, [style, enabled]),
  );
}

/**
 * For full-screen overlays drawn on the gradient (the PIN lock): light icons
 * while mounted, then back to whatever the screen underneath asked for.
 */
export function useOverlayStatusBar(): void {
  useEffect(() => {
    setStatusBarStyle('light');
    return () => setStatusBarStyle(screenStyle);
  }, []);
}
