import React, { useEffect, useRef, useState } from 'react';
import { Animated, Dimensions, PanResponder, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { RtcSurfaceView, RtcTextureView } from 'react-native-agora';

const { width: SCREEN_W, height: SCREEN_H } = Dimensions.get('window');
// Spec 4.4: ~36% of the width, 16:9 portrait, left 16, top ~16% of the height.
const BOX_W = Math.round(SCREEN_W * 0.36);
const BOX_H = Math.round((BOX_W * 16) / 9);
const START = { x: 16, y: Math.round(SCREEN_H * 0.16) };
const EDGE = 8;

const clamp = (v, min, max) => Math.min(Math.max(v, min), max);
// Keep the box inside the safe area: never under the status bar, notch or home indicator.
const clampPos = (p, insets) => ({
  x: clamp(p.x, EDGE, SCREEN_W - BOX_W - EDGE),
  y: clamp(p.y, insets.top + EDGE, SCREEN_H - BOX_H - insets.bottom - EDGE),
});

// Where this viewer last dropped the box, kept for the app session so it stays put when the
// box unmounts (partner drops and rejoins) or the screen is reopened. Local only: each viewer
// places it on their own screen.
let lastPos = START;

// One-time "you can drag this" hint, per device. Got it or a first drag hides it for good.
const HINT_KEY = 'cohostBoxDragHintSeen';
let hintSeen = false;
const markHintSeen = () => {
  hintSeen = true;
  AsyncStorage.setItem(HINT_KEY, '1').catch(() => {});
};

/**
 * The second broadcaster in a co-hosted live, in a bordered box over the stream: the co-host on
 * the seller's and buyers' screens, the seller on the co-host's screen. The viewer can drag it
 * anywhere on screen. Render it after the full-screen video and before the chat overlay.
 */
const CohostVideoBox = ({ uid, onPress }) => {
  const onPressRef = useRef(onPress);
  onPressRef.current = onPress;
  const insets = useSafeAreaInsets();
  const insetsRef = useRef(insets);
  insetsRef.current = insets;
  const pos = useRef(new Animated.ValueXY(lastPos)).current;
  const [showHint, setShowHint] = useState(false);
  const hasVideo = uid != null;

  useEffect(() => {
    if (!hasVideo || hintSeen) return undefined;
    let alive = true;
    AsyncStorage.getItem(HINT_KEY)
      .then((v) => {
        if (v) hintSeen = true;
        else if (alive) setShowHint(true);
      })
      .catch(() => {});
    return () => {
      alive = false;
    };
  }, [hasVideo]);

  const dismissHint = () => {
    setShowHint(false);
    markHintSeen();
  };

  const pan = useRef(
    PanResponder.create({
      // Only claim real drags, so a tap underneath still behaves as before.
      // With onPress (buyer: tap to switch) the box takes every touch; otherwise only drags.
      onStartShouldSetPanResponder: () => !!onPressRef.current,
      onMoveShouldSetPanResponder: (_, g) => Math.abs(g.dx) > 4 || Math.abs(g.dy) > 4,
      // Keep the drag once started, so the chat list or a parent can't steal it midway.
      onPanResponderTerminationRequest: () => false,
      onPanResponderGrant: () => {
        pos.setOffset(lastPos);
        pos.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: (_, g) => {
        const next = clampPos({ x: lastPos.x + g.dx, y: lastPos.y + g.dy }, insetsRef.current);
        pos.setValue({ x: next.x - lastPos.x, y: next.y - lastPos.y });
      },
      onPanResponderRelease: (_, g) => {
        dismissHintRef.current();
        if (Math.abs(g.dx) < 6 && Math.abs(g.dy) < 6 && onPressRef.current) {
          pos.flattenOffset();
          pos.setValue(lastPos);
          onPressRef.current();
          return;
        }
        pos.flattenOffset();
        lastPos = clampPos({ x: lastPos.x + g.dx, y: lastPos.y + g.dy }, insetsRef.current);
        pos.setValue(lastPos);
      },
      onPanResponderTerminate: () => {
        pos.flattenOffset();
        pos.setValue(lastPos);
      },
    }),
  ).current;

  // The PanResponder is created once; read the latest dismiss through a ref.
  const dismissHintRef = useRef(dismissHint);
  dismissHintRef.current = dismissHint;

  if (!hasVideo) return null;
  const canvas = { uid, renderMode: 1, mirrorMode: 0 };
  const VideoView = Platform.OS === 'android' ? RtcTextureView : RtcSurfaceView;
  return (
    <Animated.View
      {...pan.panHandlers}
      style={[styles.box, { transform: pos.getTranslateTransform() }]}
      accessibilityLabel="Co-host video, drag to move">
      <VideoView key={uid} style={styles.video} canvas={canvas} zOrderMediaOverlay pointerEvents="none" />
      {onPress ? (
        // Switch icon (buyer): tapping anywhere on the box swaps the main and small video.
        <View style={styles.switchBadge} pointerEvents="none">
          <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
            <Path
              d="M7 4 3 8l4 4M3 8h14M17 20l4-4-4-4M21 16H7"
              stroke="#FFF"
              strokeWidth={2.2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </Svg>
        </View>
      ) : null}
      {showHint ? (
        <View style={styles.hint}>
          <Text style={styles.hintText}>{onPress ? 'Drag to move, tap to switch' : 'Drag to move'}</Text>
          <TouchableOpacity onPress={dismissHint} style={styles.hintBtn} accessibilityRole="button">
            <Text style={styles.hintBtnText}>Got it</Text>
          </TouchableOpacity>
        </View>
      ) : null}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  box: {
    position: 'absolute',
    left: 0,
    top: 0,
    width: BOX_W,
    height: BOX_H,
    borderWidth: 2,
    borderColor: '#9EF01A',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    // Above all live UI (overlay 20, banners 21-30) so it is never hidden while dragged;
    // below the in-screen sheets (50) and toasts (60).
    zIndex: 45,
    elevation: 45,
  },
  video: {
    width: '100%',
    height: '100%',
  },
  switchBadge: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(0,0,0,0.55)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  hint: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    paddingVertical: 8,
    paddingHorizontal: 8,
    backgroundColor: 'rgba(0,0,0,0.65)',
    alignItems: 'center',
    gap: 6,
  },
  hintText: { color: '#FFF', fontSize: 12, fontWeight: '600', textAlign: 'center' },
  hintBtn: { backgroundColor: '#9EF01A', borderRadius: 12, paddingHorizontal: 14, paddingVertical: 4 },
  hintBtnText: { color: '#1A1A1A', fontSize: 12, fontWeight: '700' },
});

export default CohostVideoBox;
