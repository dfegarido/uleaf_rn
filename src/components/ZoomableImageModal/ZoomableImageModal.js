import React from 'react';
import {
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  useWindowDimensions,
} from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import CloseIcon from '../../assets/icons/white/x-regular.svg';
import AppImage from '../AppImage/AppImage';

/** Full-screen photo viewer with pinch / double-tap zoom. */
const ZoomableImageModal = ({ uri, visible, onClose }) => {
  const { width, height } = useWindowDimensions();
  const insets = useSafeAreaInsets();

  return (
    <Modal
      visible={visible && !!uri}
      transparent
      animationType="fade"
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      statusBarTranslucent={Platform.OS === 'android'}
    >
      <View style={styles.backdrop}>
        <ImageZoom
          cropWidth={width}
          cropHeight={height}
          imageWidth={width}
          imageHeight={height}
          minScale={1}
          maxScale={5}
          doubleClickInterval={250}
          enableSwipeDown
          onSwipeDown={onClose}
        >
          <AppImage source={{ uri }} style={{ width, height }} resizeMode="contain" />
        </ImageZoom>
        <TouchableOpacity
          style={[styles.close, { top: Math.max(insets.top, 12) + 8 }]}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close image"
        >
          <CloseIcon width={24} height={24} fill="#fff" />
        </TouchableOpacity>
        <Text style={[styles.hint, { bottom: Math.max(insets.bottom, 12) + 16 }]}>
          Pinch or double-tap to zoom · Swipe down to close
        </Text>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: '#000000' },
  close: {
    position: 'absolute',
    right: 20,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
  hint: {
    position: 'absolute',
    alignSelf: 'center',
    fontFamily: 'Inter',
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
});

export default ZoomableImageModal;
