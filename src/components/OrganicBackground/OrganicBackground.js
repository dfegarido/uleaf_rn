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

const {width: SCREEN_W, height: SCREEN_H} = Dimensions.get('window');

const TOKENS = {
  bg: '#F7F8F2',
  lightSage: '#D4E5D2',
  cream: '#F0EDE5',
};

const OrganicBackground = () => {
  const blobDrift = useSharedValue(0);

  useEffect(() => {
    blobDrift.value = withRepeat(
      withSequence(
        withTiming(20, {duration: 12000, easing: Easing.inOut(Easing.ease)}),
        withTiming(-20, {duration: 12000, easing: Easing.inOut(Easing.ease)}),
      ),
      -1,
      true,
    );
  }, []);

  const blobStyle = useAnimatedStyle(() => ({
    transform: [{translateX: blobDrift.value}],
  }));

  return (
    <View
      style={[StyleSheet.absoluteFill, {backgroundColor: TOKENS.bg}]}
      pointerEvents="none">
      <Animated.View style={[styles.blob1, blobStyle]} />
      <Animated.View style={[styles.blob2, blobStyle]} />
      <Animated.View style={[styles.blob3]} />
    </View>
  );
};

const styles = StyleSheet.create({
  blob1: {
    position: 'absolute',
    top: -SCREEN_H * 0.06,
    left: -SCREEN_W * 0.22,
    width: SCREEN_W * 0.75,
    height: SCREEN_W * 0.75,
    borderRadius: 999,
    backgroundColor: TOKENS.lightSage,
    opacity: 0.3,
  },
  blob2: {
    position: 'absolute',
    top: SCREEN_H * 0.22,
    right: -SCREEN_W * 0.28,
    width: SCREEN_W * 0.65,
    height: SCREEN_W * 0.65,
    borderRadius: 999,
    backgroundColor: TOKENS.cream,
    opacity: 0.35,
  },
  blob3: {
    position: 'absolute',
    bottom: -SCREEN_H * 0.1,
    left: SCREEN_W * 0.12,
    width: SCREEN_W * 0.55,
    height: SCREEN_W * 0.55,
    borderRadius: 999,
    backgroundColor: TOKENS.lightSage,
    opacity: 0.22,
  },
});

export default OrganicBackground;
