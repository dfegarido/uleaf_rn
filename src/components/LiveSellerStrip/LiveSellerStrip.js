import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import React, { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Animated, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../../firebase';
import { formatElapsedTime } from '../../utils/formatElapsedTime';
import LiveIcon from '../../assets/iconnav/live.svg';

const CARD_WIDTH = 150;
const CARD_HEIGHT = 220;

const LiveSellerCard = ({ stream, displayName, onPress }) => {
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const [elapsed, setElapsed] = useState(() => formatElapsedTime(stream.createdAt));

  useEffect(() => {
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    blink.start();
    return () => blink.stop();
  }, [blinkAnim]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(formatElapsedTime(stream.createdAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [stream.createdAt]);

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}>
      {stream.coverPhotoUrl ? (
        <ImageBackground
          source={{ uri: stream.coverPhotoUrl }}
          style={styles.cardImage}
          imageStyle={styles.cardImageStyle}>
          <Animated.View style={[styles.liveBadge, { opacity: blinkAnim }]}>
            <LiveIcon width={14} height={14} />
            <Text style={styles.liveBadgeText}>Live</Text>
          </Animated.View>
        </ImageBackground>
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          <Animated.View style={[styles.liveBadge, { opacity: blinkAnim }]}>
            <LiveIcon width={14} height={14} />
            <Text style={styles.liveBadgeText}>Live</Text>
          </Animated.View>
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.sellerName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.elapsedTime}>{elapsed}</Text>
      </View>
    </TouchableOpacity>
  );
};

const LiveSellerStrip = ({ navigation }) => {
  const [liveStreams, setLiveStreams] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const q = query(
      collection(db, 'live'),
      where('status', '==', 'live'),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const streams = snapshot.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));
      setLiveStreams(streams);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Now</Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={{ flexGrow: 0 }}>
          {[1, 2, 3].map((i) => (
            <View key={i} style={[styles.card, styles.skeletonCard]}>
              <View style={[styles.cardImage, styles.skeletonImage]}>
                <ActivityIndicator color="#CDD3D4" />
              </View>
            </View>
          ))}
        </ScrollView>
      </View>
    );
  }

  if (liveStreams.length === 0) return null;

  const visibleStreams = liveStreams.slice(0, 3);

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>Live Now</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('OngoingLiveListScreen')}
          activeOpacity={0.6}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        style={{ flexGrow: 0 }}>
        {visibleStreams.map((stream) => (
          <LiveSellerCard
            key={stream.id}
            stream={stream}
            displayName={
              stream.title || 'Live Stream'
            }
            onPress={() =>
              navigation.navigate(
                stream.liveType === 'purge'
                  ? 'LivePurgeScreen'
                  : 'BuyerLiveStreamScreen',
                {
                  sessionId: stream.sessionId,
                  broadcasterId: stream.createdBy,
                },
              )
            }
          />
        ))}
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 10,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingRight: 12,
  },
  sectionTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: '#393D40',
  },
  viewAllText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#539461',
    fontFamily: 'Inter',
  },
  scrollContent: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'flex-start',
    paddingHorizontal: 10,
  },
  card: {
    width: CARD_WIDTH,
    flexDirection: 'column',
  },
  cardImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
    overflow: 'hidden',
  },
  cardImageStyle: {
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  cardImagePlaceholder: {
    backgroundColor: '#F5F5F5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  noImageText: {
    fontSize: 14,
    color: '#9AA4A8',
    fontWeight: '500',
    fontFamily: 'Inter',
  },
  liveBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: '#E7522F',
    borderRadius: 8,
    zIndex: 1,
  },
  liveBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    color: '#FFFFFF',
  },
  cardInfo: {
    paddingTop: 6,
    paddingHorizontal: 4,
  },
  sellerName: {
    fontFamily: 'Inter',
    fontWeight: '900',
    fontSize: 14,
    color: '#202325',
  },
  elapsedTime: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    color: '#7F8D91',
    marginTop: 2,
  },
  skeletonCard: {
    opacity: 0.7,
  },
  skeletonImage: {
    backgroundColor: '#E8ECED',
    alignItems: 'center',
    justifyContent: 'center',
  },
});

export default LiveSellerStrip;
