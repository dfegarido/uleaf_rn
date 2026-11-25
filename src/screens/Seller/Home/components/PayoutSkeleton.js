import React, {useEffect, useRef} from 'react';
import {Animated, StyleSheet, View} from 'react-native';

const Bone = ({width, height, radius = 8, style, opacity}) => (
  <Animated.View
    style={[styles.bone, {width, height, borderRadius: radius, opacity}, style]}
  />
);

const PayoutSkeleton = ({cards = 5, summary = true}) => {
  const pulse = useRef(new Animated.Value(0.4)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulse, {toValue: 1, duration: 800, useNativeDriver: true}),
        Animated.timing(pulse, {toValue: 0.4, duration: 800, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulse]);

  return (
    <View>
      {summary ? (
        <View style={styles.summary}>
          <Bone width={120} height={12} opacity={pulse} style={styles.onDark} />
          <Bone width={190} height={30} radius={10} opacity={pulse} style={[styles.onDark, styles.gapLg]} />
          <Bone width={210} height={12} opacity={pulse} style={[styles.onDark, styles.gapMd]} />
        </View>
      ) : null}
      {summary ? <Bone width={120} height={14} opacity={pulse} style={styles.section} /> : null}
      {Array.from({length: cards}).map((_, i) => (
        <View key={i} style={styles.card}>
          <Bone width={44} height={44} radius={12} opacity={pulse} />
          <View style={styles.body}>
            <Bone width="70%" height={14} opacity={pulse} />
            <Bone width="85%" height={11} opacity={pulse} />
            <Bone width="45%" height={11} opacity={pulse} />
          </View>
          <View style={styles.right}>
            <Bone width={72} height={16} opacity={pulse} />
            <Bone width={64} height={20} radius={10} opacity={pulse} />
          </View>
        </View>
      ))}
    </View>
  );
};

const styles = StyleSheet.create({
  bone: {backgroundColor: '#E4E7E9'},
  summary: {
    backgroundColor: '#1F5C38',
    borderRadius: 20,
    padding: 20,
    marginBottom: 24,
  },
  onDark: {backgroundColor: 'rgba(255,255,255,0.22)'},
  gapLg: {marginTop: 14},
  gapMd: {marginTop: 14},
  section: {marginBottom: 12},
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 14,
    marginBottom: 12,
    borderRadius: 16,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7E9',
  },
  body: {flex: 1, gap: 7},
  right: {alignItems: 'flex-end', gap: 8},
});

export default PayoutSkeleton;
