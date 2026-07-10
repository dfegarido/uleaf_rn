import { Platform } from 'react-native';

/**
 * Shared Modal props so Leaf Trail sheets/overlays behave the same on iOS + Android.
 * Android needs statusBarTranslucent for transparent modals to cover the status bar.
 */
export function leafTrailSheetModalProps(onRequestClose) {
  return {
    transparent: true,
    visible: true,
    animationType: Platform.OS === 'ios' ? 'fade' : 'slide',
    onRequestClose,
    presentationStyle: Platform.OS === 'ios' ? 'overFullScreen' : undefined,
    statusBarTranslucent: Platform.OS === 'android',
  };
}

export function leafTrailLoadingModalProps(onRequestClose = () => {}) {
  return {
    transparent: true,
    visible: true,
    animationType: 'fade',
    onRequestClose,
    presentationStyle: Platform.OS === 'ios' ? 'overFullScreen' : undefined,
    statusBarTranslucent: Platform.OS === 'android',
  };
}

export function leafTrailFullScreenModalProps(onRequestClose) {
  return {
    transparent: false,
    animationType: 'slide',
    onRequestClose,
    presentationStyle: Platform.OS === 'ios' ? 'fullScreen' : undefined,
    statusBarTranslucent: Platform.OS === 'android',
  };
}
