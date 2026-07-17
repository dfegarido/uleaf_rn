import { Platform, StatusBar } from 'react-native';

/** Android status-bar fallback when cutout mode overlays but insets.top is 0. */
const ANDROID_MIN_HEADER_TOP = 32;

/**
 * Top padding for admin / Leaf Trail screen headers below the status bar.
 */
export function getAdminHeaderTopPadding(insets = { top: 0 }) {
  const safeTop = Number(insets?.top) || 0;

  if (Platform.OS === 'android') {
    const statusBar = Number(StatusBar.currentHeight) || 0;
    return Math.max(safeTop, statusBar, ANDROID_MIN_HEADER_TOP);
  }

  return Math.max(safeTop, 12);
}
