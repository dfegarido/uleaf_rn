import React from 'react';
import { Dimensions, Platform, StyleSheet, View } from 'react-native';
import { RtcSurfaceView, RtcTextureView } from 'react-native-agora';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
// Spec 4.4: ~36% of the width, 16:9 portrait, left 16, top ~25% of the height.
const BOX_W = Math.round(SCREEN_W * 0.36);
const BOX_H = Math.round((BOX_W * 16) / 9);

/**
 * The second broadcaster in a co-hosted live, in a bordered box over the stream: the co-host on
 * the seller's and buyers' screens, the seller on the co-host's screen. Non-interactive.
 * Render it after the full-screen video and before the chat overlay.
 */
const CohostVideoBox = ({ uid }) => {
  if (uid == null) return null;
  const canvas = { uid, renderMode: 1, mirrorMode: 0 };
  const VideoView = Platform.OS === 'android' ? RtcTextureView : RtcSurfaceView;
  return (
    <View pointerEvents="none" style={styles.box}>
      <VideoView style={styles.video} canvas={canvas} zOrderMediaOverlay />
    </View>
  );
};

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    left: 16,
    top: Math.round(SCREEN_H * 0.16),
    width: BOX_W,
    height: BOX_H,
    borderWidth: 2,
    borderColor: '#9EF01A',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    zIndex: 15,
    elevation: 15,
  },
  video: {
    width: '100%',
    height: '100%',
  },
});

export default CohostVideoBox;
