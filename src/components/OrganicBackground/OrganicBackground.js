import React, {useEffect} from 'react';
import {View, StyleSheet, Dimensions} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withRepeat,
  withSequence,
  withTiming,
  Easing,
} from 'react-native-reanimated';
import Svg, {Ellipse, G, Path} from 'react-native-svg';

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

const TOKENS = {
  bg: '#F7F8F2',
  sage: '#6BA368',
  green1: '#7CC97C',
  green2: '#2E6B3E',
};

// Monstera leaf: slits and holes are painted in the page colour so they read as cut-outs.
const Monstera = ({size, style, color = TOKENS.sage, opacity = 0.14}) => (
  <Svg width={size} height={size} viewBox="0 0 200 200" style={[styles.leaf, style]}>
    <G opacity={opacity}>
      <Path d="M100 32 L100 2" stroke={color} strokeWidth="6" strokeLinecap="round" />
      <Path d="M100 32 C70 6 16 20 12 80 C9 140 60 190 100 196 C140 190 191 140 188 80 C184 20 130 6 100 32 Z" fill={color} />
    </G>
    <G stroke={TOKENS.bg} strokeLinecap="round" fill="none">
      <Path d="M100 40 L100 188" strokeWidth="3" />
      <Path d="M12 68 Q45 72 72 92 M14 112 Q48 112 76 126 M38 160 Q64 152 84 158" strokeWidth="8" />
      <Path d="M188 68 Q155 72 128 92 M186 112 Q152 112 124 126 M162 160 Q136 152 116 158" strokeWidth="8" />
    </G>
    <G fill={TOKENS.bg}>
      <Ellipse cx="80" cy="70" rx="5" ry="9" />
      <Ellipse cx="120" cy="70" rx="5" ry="9" />
      <Ellipse cx="86" cy="110" rx="4" ry="7" />
      <Ellipse cx="114" cy="110" rx="4" ry="7" />
    </G>
  </Svg>
);

// Full-screen auth/loading backdrop: monstera leaves drifting in from the edges.
const OrganicBackground = () => {
  const drift = useSharedValue(0);

  useEffect(() => {
    drift.value = withRepeat(
      withSequence(
        withTiming(12, {duration: 12000, easing: Easing.inOut(Easing.ease)}),
        withTiming(-12, {duration: 12000, easing: Easing.inOut(Easing.ease)}),
      ),
      -1,
      true,
    );
  }, [drift]);

  const driftStyle = useAnimatedStyle(() => ({
    transform: [{translateX: drift.value}],
  }));

  return (
    <View
      style={[StyleSheet.absoluteFill, {backgroundColor: TOKENS.bg}]}
      pointerEvents="none">
      <Animated.View style={[StyleSheet.absoluteFill, driftStyle]}>
        <Monstera size={SCREEN_W * 0.85} style={styles.leafTopLeft} />
        <Monstera size={SCREEN_W * 0.9} style={styles.leafBottomRight} />
      </Animated.View>
      <Monstera size={SCREEN_W * 0.6} style={styles.leafMidRight} color={TOKENS.green2} opacity={0.08} />
      <Monstera size={SCREEN_W * 0.45} style={styles.leafBottomLeft} color={TOKENS.green1} opacity={0.18} />
    </View>
  );
};

const styles = StyleSheet.create({
  leaf: {
    position: 'absolute',
  },
  leafTopLeft: {
    top: -SCREEN_W * 0.22,
    left: -SCREEN_W * 0.3,
    transform: [{rotate: '140deg'}],
  },
  leafMidRight: {
    top: SCREEN_H * 0.2,
    right: -SCREEN_W * 0.28,
    transform: [{rotate: '-110deg'}],
  },
  leafBottomRight: {
    bottom: -SCREEN_W * 0.3,
    right: -SCREEN_W * 0.25,
    transform: [{rotate: '-35deg'}],
  },
  leafBottomLeft: {
    bottom: SCREEN_H * 0.12,
    left: -SCREEN_W * 0.18,
    transform: [{rotate: '60deg'}],
  },
});

export default OrganicBackground;
