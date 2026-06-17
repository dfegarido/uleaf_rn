import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import { Alert, Animated, Image, ImageBackground, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../../firebase';
import { formatElapsedTime } from '../../utils/formatElapsedTime';
import LiveIcon from '../../assets/iconnav/live.svg';

const formatScheduledTime = (scheduledAt) => {
  if (!scheduledAt) return 'Date TBD';
  const date = scheduledAt.seconds ? new Date(scheduledAt.seconds * 1000) : new Date(scheduledAt);
  const now = moment().startOf('day');
  const target = moment(date).startOf('day');
  if (target.isSame(now, 'day')) {
    return `Today, ${moment(date).format('h:mmA')}`;
  }
  if (target.isSame(now.clone().add(1, 'day'), 'day')) {
    return `Tomorrow, ${moment(date).format('h:mmA')}`;
  }
  return moment(date).format('MMM DD, h:mmA');
};

const getUpcomingBadgeText = (scheduledAt) => {
  if (!scheduledAt) return 'Date TBD';
  const targetMs = scheduledAt.seconds ? scheduledAt.seconds * 1000 : new Date(scheduledAt).getTime();
  const diff = targetMs - Date.now();
  if (diff <= 0) return 'Live now';
  if (diff > 60 * 60 * 1000) return formatScheduledTime(scheduledAt);
  const minutes = Math.floor(diff / 60000);
  const seconds = Math.floor((diff % 60000) / 1000);
  return `Live in ${minutes}:${seconds.toString().padStart(2, '0')}`;
};

const CARD_WIDTH = 150;
const CARD_HEIGHT = 220;

const LiveSellerCard = ({ stream, displayName, onPress }) => {
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const [elapsed, setElapsed] = useState(() => formatElapsedTime(stream.createdAt));
  const isWaiting = stream.status === 'waiting';
  const isUpcoming = stream.status === 'draft';
  const [upcomingText, setUpcomingText] = useState(() => getUpcomingBadgeText(stream.scheduledAt));

  const scheduledMs = stream.scheduledAt?.seconds ? stream.scheduledAt.seconds * 1000 : 0;
  const isCountdown = isUpcoming && scheduledMs > 0 && scheduledMs - Date.now() <= 60 * 60 * 1000;

  useEffect(() => {
    if (isWaiting || isUpcoming) return;
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    blink.start();
    return () => blink.stop();
  }, [blinkAnim, isWaiting, isUpcoming]);

  useEffect(() => {
    const timer = setInterval(() => {
      setElapsed(formatElapsedTime(stream.createdAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [stream.createdAt]);

  // Countdown tick for upcoming streams within 1 hour
  useEffect(() => {
    if (!isUpcoming || !stream.scheduledAt) return;
    const interval = setInterval(() => {
      setUpcomingText(getUpcomingBadgeText(stream.scheduledAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [isUpcoming, stream.scheduledAt]);

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
          {isUpcoming ? (
            <View style={[styles.upcomingBadge, isCountdown && styles.countdownBadge]}>
              <Text style={[styles.upcomingBadgeText, isCountdown && styles.countdownBadgeText]}>{upcomingText}</Text>
            </View>
          ) : isWaiting ? (
            <View style={styles.waitingBadge}>
              <Text style={styles.waitingBadgeText}>Waiting</Text>
            </View>
          ) : (
            <Animated.View style={[styles.liveBadge, { opacity: blinkAnim }]}>
              <LiveIcon width={14} height={14} color="#FFFFFF" />
              <Text style={styles.liveBadgeText}>Live</Text>
            </Animated.View>
          )}
        </ImageBackground>
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          {isUpcoming ? (
            <View style={[styles.upcomingBadge, isCountdown && styles.countdownBadge]}>
              <Text style={[styles.upcomingBadgeText, isCountdown && styles.countdownBadgeText]}>{upcomingText}</Text>
            </View>
          ) : isWaiting ? (
            <View style={styles.waitingBadge}>
              <Text style={styles.waitingBadgeText}>Waiting</Text>
            </View>
          ) : (
            <Animated.View style={[styles.liveBadge, { opacity: blinkAnim }]}>
              <LiveIcon width={14} height={14} color="#FFFFFF" />
              <Text style={styles.liveBadgeText}>Live</Text>
            </Animated.View>
          )}
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.sellerName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.elapsedTime}>{isUpcoming ? upcomingText : elapsed}</Text>
      </View>
    </TouchableOpacity>
  );
};

const LiveSellerStrip = ({ navigation }) => {
  const [liveStreams, setLiveStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const slideAnim = useRef(new Animated.Value(60)).current;
  const phase = loading || liveStreams.length === 0 ? 'fallback' : 'live';

  useEffect(() => {
    slideAnim.setValue(60);
    Animated.timing(slideAnim, {
      toValue: 0,
      duration: 500,
      useNativeDriver: true,
      easing: (x) => Math.sqrt(1 - Math.pow(x - 1, 2)), // easeOutCirc
    }).start();
  }, [phase, slideAnim]);

  useEffect(() => {
    const q = query(
      collection(db, 'live'),
      where('status', 'in', ['live', 'waiting', 'draft']),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const streams = snapshot.docs.map((d) => ({
          id: d.id,
          ...d.data(),
        }));

        // Sort: live first, then waiting, then draft (by scheduledAt ascending)
        streams.sort((a, b) => {
          const statusOrder = { live: 0, waiting: 1, draft: 2 };
          if (statusOrder[a.status] !== statusOrder[b.status]) {
            return statusOrder[a.status] - statusOrder[b.status];
          }
          if (a.status === 'draft' && b.status === 'draft') {
            const aTime = a.scheduledAt?.seconds || 0;
            const bTime = b.scheduledAt?.seconds || 0;
            return aTime - bTime;
          }
          return 0;
        });

        setLiveStreams(streams);
        setLoading(false);
      },
      (error) => {
        console.error('LiveSellerStrip onSnapshot error:', error);
        setLoading(false);
      },
    );

    return () => unsubscribe();
  }, []);

  const animatedSectionStyle = {
    transform: [{ translateX: slideAnim }],
  };

  if (loading || liveStreams.length === 0) {
    return (
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>Live Sales</Text>
        <Animated.View style={animatedSectionStyle}>
          <View style={styles.scrollContent}>
            <Image
              source={require('../../assets/images/upcomming_live.jpg')}
              style={styles.placeholderImage}
              resizeMode="cover"
            />
            <Image
              source={require('../../assets/images/meedong.png')}
              style={styles.placeholderImage}
              resizeMode="cover"
            />
          </View>
        </Animated.View>
      </View>
    );
  }

  const visibleStreams = liveStreams.slice(0, 3);

  return (
    <View style={styles.section}>
      <View style={styles.titleRow}>
        <Text style={styles.sectionTitle}>Live Sales</Text>
        <TouchableOpacity
          onPress={() => navigation.navigate('Live')}
          activeOpacity={0.6}>
          <Text style={styles.viewAllText}>View All</Text>
        </TouchableOpacity>
      </View>
      <Animated.View style={animatedSectionStyle}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
          style={{ flexGrow: 0 }}>
          {visibleStreams.map((stream) => (
            <LiveSellerCard
              key={stream.id}
              stream={stream}
              displayName={stream.title || 'Live Stream'}
              onPress={() => {
                if (stream.status === 'waiting') {
                  Alert.alert('Waiting for the Broadcaster...');
                  return;
                }
                if (stream.status === 'draft') {
                  const time = formatScheduledTime(stream.scheduledAt);
                  Alert.alert('Upcoming Live', `This live is scheduled for ${time}. Come back then!`);
                  return;
                }
                navigation.navigate(
                  stream.liveType === 'purge'
                    ? 'LivePurgeScreen'
                    : 'BuyerLiveStreamScreen',
                  {
                    sessionId: stream.sessionId,
                    broadcasterId: stream.createdBy,
                  },
                );
              }}
            />
          ))}
        </ScrollView>
      </Animated.View>
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
  waitingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: '#D4A017',
    borderRadius: 8,
    zIndex: 1,
  },
  waitingBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    color: '#FFFFFF',
  },
  upcomingBadge: {
    position: 'absolute',
    top: 8,
    left: 8,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
    borderRadius: 8,
    zIndex: 1,
  },
  upcomingBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    color: '#FFFFFF',
  },
  countdownBadge: {
    backgroundColor: '#E7522F',
  },
  countdownBadgeText: {
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
  placeholderImage: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 12,
  },
});

export default LiveSellerStrip;
