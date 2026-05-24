import React, {useEffect, useRef} from 'react';
import {View, StyleSheet, Animated, Dimensions} from 'react-native';
import LottieView from 'lottie-react-native';

const {width: W, height: H} = Dimensions.get('window');

const PALETTE = {
  bg: '#F7F8F2',
  lightSage: '#D4E5D2',
  cream: '#F0EDE5',
  sage: '#6BA368',
};

const Loading = ({visible = true, fullscreen = false}) => {
  const fadeAnim = useRef(new Animated.Value(visible ? 1 : 0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: visible ? 1 : 0,
      duration: 300,
      useNativeDriver: true,
    }).start();
  }, [visible]);

  if (!fullscreen) {
    if (!visible) {
      return null;
    }
    return (
      <View style={styles.container}>
        <LottieView
          source={require('../../assets/lottie/loading.lottie')}
          autoPlay
          loop
          style={styles.lottie}
        />
      </View>
    );
  }

  return (
    <Animated.View
      pointerEvents={visible ? 'auto' : 'none'}
      style={[
        styles.fullscreen,
        {opacity: fadeAnim},
      ]}>
      {/* Background blobs — same organic approach as login form */}
      <View style={StyleSheet.absoluteFill} pointerEvents="none">
        <View style={styles.blobTopLeft} />
        <View style={styles.blobMidRight} />
        <View style={styles.blobBottom} />
        <View style={styles.blobCenter} />
      </View>

      <LottieView
        source={require('../../assets/lottie/loading.lottie')}
        autoPlay
        loop
        style={styles.lottie}
      />
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullscreen: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: PALETTE.bg,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 999,
  },
  // Organic background blobs — layered circles for soft gradient feel
  blobTopLeft: {
    position: 'absolute',
    top: -H * 0.08,
    left: -W * 0.25,
    width: W * 0.8,
    height: W * 0.8,
    borderRadius: 999,
    backgroundColor: PALETTE.lightSage,
    opacity: 0.35,
  },
  blobMidRight: {
    position: 'absolute',
    top: H * 0.3,
    right: -W * 0.3,
    width: W * 0.7,
    height: W * 0.7,
    borderRadius: 999,
    backgroundColor: PALETTE.cream,
    opacity: 0.4,
  },
  blobBottom: {
    position: 'absolute',
    bottom: -H * 0.1,
    left: W * 0.1,
    width: W * 0.6,
    height: W * 0.6,
    borderRadius: 999,
    backgroundColor: PALETTE.lightSage,
    opacity: 0.25,
  },
  blobCenter: {
    position: 'absolute',
    top: H * 0.45,
    left: W * 0.25,
    width: W * 0.5,
    height: W * 0.5,
    borderRadius: 999,
    backgroundColor: PALETTE.sage,
    opacity: 0.08,
  },
  lottie: {
    width: 380,
    height: 380,
  },
});

export default Loading;
