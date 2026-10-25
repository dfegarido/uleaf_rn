import { Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

// The tab bars were sized for the iPhone home indicator (height 80 / paddingBottom 30). This build
// draws edge-to-edge on Android, so 3-button navigation sat on top of the labels. On Android the
// bottom padding follows the real navigation bar; iOS keeps the tuned values.
const CONTENT_HEIGHT = 50;

export default function useTabBarInsetStyle() {
  const insets = useSafeAreaInsets();
  if (Platform.OS !== 'android') return { height: 80, paddingBottom: 30 };
  const paddingBottom = Math.max(insets.bottom, 8) + 4;
  return { height: CONTENT_HEIGHT + paddingBottom, paddingBottom };
}
