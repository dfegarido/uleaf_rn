import React, {useEffect, useRef} from 'react';
import {View, Text, Image, StyleSheet, Animated, Easing} from 'react-native';
import Svg, {Circle, Path, Defs, LinearGradient as SvgGradient, Stop} from 'react-native-svg';
import LinearGradient from 'react-native-linear-gradient';
import OrganicBackground from '../OrganicBackground/OrganicBackground';

const PALETTE = {
  bg: '#F7F8F2',
  green1: '#7CC97C',
  green2: '#2E6B3E',
  deep: '#1F4D2B',
  muted: '#5D6E5D',
};

const ORBIT = 180;

// Dotted flight path with a plane riding it, borrowed from the logo's travel line.
const Orbit = ({size, plane = true, color}) => (
  <Svg width={size} height={size} viewBox="0 0 180 180">
    <Defs>
      <SvgGradient id="orbit" x1="0" y1="0" x2="1" y2="1">
        <Stop offset="0" stopColor={PALETTE.green1} />
        <Stop offset="1" stopColor={PALETTE.green2} />
      </SvgGradient>
    </Defs>
    <Circle
      cx="90"
      cy="90"
      r="80"
      fill="none"
      stroke={color || 'url(#orbit)'}
      strokeWidth={plane ? 2.6 : 9}
      strokeLinecap="round"
      strokeDasharray={plane ? '0.1 10' : '0.1 30'}
    />
    {plane ? (
      <Path
        transform="translate(90 10) rotate(90)"
        d="M0-9 L2 -2 L9 1 L9 3 L2 1.5 L1.5 6 L4 8 L4 9.5 L0 8.5 L-4 9.5 L-4 8 L-1.5 6 L-2 1.5 L-9 3 L-9 1 L-2 -2 Z"
        fill={PALETTE.green2}
      />
    ) : (
      <Circle cx="90" cy="10" r="12" fill={color || PALETTE.green2} />
    )}
  </Svg>
);

const loop = anim => Animated.loop(anim);

// `title`/`message` let each caller say what's loading (e.g. "Welcome back" on login).
// `size` shrinks the inline spinner for tight spots like a button or a status row.
const Loading = ({visible = true, fullscreen = false, size = 40, color, title, message}) => {
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;
  const spin = useRef(new Animated.Value(0)).current;
  const float = useRef(new Animated.Value(0)).current;
  const slide = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();

    if (!visible) {
      return;
    }
    const anims = Animated.parallel([
      loop(Animated.timing(spin, {toValue: 1, duration: fullscreen ? 3200 : 1200, easing: Easing.linear, useNativeDriver: true})),
      loop(
        Animated.sequence([
          Animated.timing(float, {toValue: 1, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
          Animated.timing(float, {toValue: 0, duration: 1200, easing: Easing.inOut(Easing.sin), useNativeDriver: true}),
        ]),
      ),
      loop(Animated.timing(slide, {toValue: 1, duration: 1400, easing: Easing.inOut(Easing.quad), useNativeDriver: true})),
    ]);
    anims.start();
    return () => anims.stop();
  }, [visible, fullscreen, fadeAnim, spin, float, slide]);

  const rotate = spin.interpolate({inputRange: [0, 1], outputRange: ['0deg', '360deg']});

  if (!fullscreen) {
    if (!visible) {
      return null;
    }
    return (
      <View style={styles.container} accessibilityRole="progressbar" accessibilityLabel={message || 'Loading'}>
        <Animated.View style={{transform: [{rotate}]}}>
          <Orbit size={size} plane={false} color={color} />
        </Animated.View>
      </View>
    );
  }

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      accessibilityRole="progressbar"
      accessibilityLabel={[title, message].filter(Boolean).join('. ') || 'Loading'}
      style={[
        styles.fullscreen,
        {opacity: fadeAnim},
      ]}>
      <OrganicBackground />

      <View style={styles.badge}>
        <Animated.View style={[StyleSheet.absoluteFill, {transform: [{rotate}]}]}>
          <Orbit size={ORBIT} />
        </Animated.View>
        <Animated.View
          style={[
            styles.glass,
            {transform: [{translateY: float.interpolate({inputRange: [0, 1], outputRange: [3, -3]})}]},
          ]}>
          <Image source={require('../../assets/images/login-logo.png')} style={styles.logo} />
        </Animated.View>
      </View>

      {title ? <Text style={styles.title}>{title}</Text> : null}
      {message ? <Text style={styles.message}>{message}</Text> : null}

      <View style={styles.bar}>
        <Animated.View
          style={[
            styles.barFill,
            {transform: [{translateX: slide.interpolate({inputRange: [0, 1], outputRange: [-64, 144]})}]},
          ]}>
          <LinearGradient
            colors={[PALETTE.green1, PALETTE.green2]}
            start={{x: 0, y: 0}}
            end={{x: 1, y: 0}}
            style={StyleSheet.absoluteFill}
          />
        </Animated.View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreen: {
    ...StyleSheet.absoluteFill,
    backgroundColor: PALETTE.bg,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  badge: {
    width: ORBIT,
    height: ORBIT,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 28,
  },
  glass: {
    width: 124,
    height: 124,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255,255,255,0.8)',
    borderWidth: 1,
    borderColor: 'rgba(83,148,97,0.18)',
    shadowColor: PALETTE.deep,
    shadowOffset: {width: 0, height: 12},
    shadowOpacity: 0.16,
    shadowRadius: 18,
    elevation: 8,
  },
  logo: {
    width: 100,
    height: 100,
    resizeMode: 'contain',
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 20,
    fontWeight: '700',
    color: PALETTE.deep,
    textAlign: 'center',
  },
  message: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: PALETTE.muted,
    marginTop: 6,
    textAlign: 'center',
  },
  bar: {
    width: 144,
    height: 4,
    borderRadius: 99,
    marginTop: 24,
    overflow: 'hidden',
    backgroundColor: 'rgba(83,148,97,0.16)',
  },
  barFill: {
    width: 64,
    height: 4,
    borderRadius: 99,
    overflow: 'hidden',
  },
});

export default Loading;
