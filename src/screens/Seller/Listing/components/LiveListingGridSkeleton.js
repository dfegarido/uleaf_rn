import React, {useRef, useEffect} from 'react';
import {Animated, Dimensions, StyleSheet, View} from 'react-native';

const SCREEN_PADDING = 16;
const GAP = 6;
const NUM_COLUMNS = 3;
const cardWidth =
  (Dimensions.get('window').width - SCREEN_PADDING * 2 - (NUM_COLUMNS - 1) * GAP) /
  NUM_COLUMNS;

const SkeletonBox = ({width, height, style}) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {toValue: 1, duration: 800, useNativeDriver: true}),
        Animated.timing(pulseAnim, {toValue: 0.3, duration: 800, useNativeDriver: true}),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [pulseAnim]);

  return (
    <Animated.View
      style={[
        {width, height, backgroundColor: '#E4E7E9', borderRadius: 8, opacity: pulseAnim},
        style,
      ]}
    />
  );
};

const SkeletonCard = () => (
  <View style={styles.card}>
    {/* Square image placeholder */}
    <SkeletonBox width={cardWidth} height={cardWidth} style={{borderRadius: 0}} />
    {/* Body: index + genus + species */}
    <View style={styles.body}>
      <SkeletonBox width={20} height={10} style={{marginBottom: 6}} />
      <SkeletonBox width={cardWidth * 0.75} height={11} style={{marginBottom: 4}} />
      <SkeletonBox width={cardWidth * 0.55} height={11} />
    </View>
    {/* Set Active button placeholder */}
    <SkeletonBox
      width={cardWidth - 16}
      height={30}
      style={{borderRadius: 20, marginHorizontal: 8, marginBottom: 8}}
    />
  </View>
);

const LiveListingGridSkeleton = ({cardCount = 12}) => {
  const rows = [];
  for (let i = 0; i < cardCount; i += NUM_COLUMNS) {
    rows.push(
      <View key={i} style={styles.row}>
        {Array.from({length: NUM_COLUMNS}).map((_, col) => (
          <SkeletonCard key={col} />
        ))}
      </View>,
    );
  }

  return (
    <View style={styles.container}>
      {rows}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: SCREEN_PADDING,
    paddingTop: 4,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: GAP,
  },
  card: {
    width: cardWidth,
    backgroundColor: '#fff',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E4E7E9',
    overflow: 'hidden',
  },
  body: {
    padding: 8,
  },
});

export default LiveListingGridSkeleton;
