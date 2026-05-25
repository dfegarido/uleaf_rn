import {
  collection,
  doc,
  getDoc,
  onSnapshot,
  orderBy,
  query,
  where,
} from 'firebase/firestore';
import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Dimensions,
  FlatList,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../../../firebase';
import LiveIcon from '../../../assets/iconnav/live.svg';
import SocialIcon from '../../../assets/iconnav/social.svg';
import CalendarBlankIcon from '../../../assets/icons/greylight/calendar-blank-regular.svg';
import Wishicon from '../../../assets/buyer-icons/wish-list.svg';
import Avatar from '../../../components/Avatar/Avatar';
import SearchHeader from '../../../components/Header/SearchHeader';
import { resolveSellerDisplayName } from '../../../utils/resolveSellerAlias';
import { useNavigation } from '@react-navigation/native';

const getScreenDimensions = () => {
  const { width: screenWidth } = Dimensions.get('window');
  const HORIZONTAL_PADDING = 24;
  const GAP = 12;
  const availableWidth = screenWidth - HORIZONTAL_PADDING;
  const cardWidth = (availableWidth - GAP) / 2;
  return { screenWidth, HORIZONTAL_PADDING, GAP, CARD_WIDTH: cardWidth };
};

const CHIP_FILTERS = [
  { key: 'all', label: 'All' },
  { key: 'live', label: 'Live', leftIcon: LiveIcon },
  { key: 'upcoming', label: 'Upcoming', leftIcon: CalendarBlankIcon },
];

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

const formatViewers = (count) => {
  if (!count) return '0';
  if (count >= 1000) {
    return `${(count / 1000).toFixed(1)}k`;
  }
  return count.toString();
};

const ShimmerSkeleton = ({ cardWidth, index }) => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;
  const isLeftColumn = index % 2 === 0;
  const thumbnailHeight = cardWidth * 1.25;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, { toValue: 1, duration: 1000, useNativeDriver: true }),
        Animated.timing(shimmerAnim, { toValue: 0, duration: 1000, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.4, 0.8],
  });

  const skeletonCardStyle = {
    width: cardWidth,
    marginRight: isLeftColumn ? 12 : 0,
    marginBottom: 20,
  };

  return (
    <View style={[styles.card, skeletonCardStyle]}>
      <Animated.View style={[styles.thumbnail, { width: cardWidth, height: thumbnailHeight, opacity }]}>
        <View style={[styles.skeletonThumbnail, { width: cardWidth, height: thumbnailHeight }]} />
      </Animated.View>
      <View style={styles.skeletonMeta}>
        <View style={styles.skeletonAvatar} />
        <View style={styles.skeletonLines}>
          <View style={styles.skeletonLine} />
          <View style={styles.skeletonLineShort} />
        </View>
      </View>
    </View>
  );
};

const LiveFeedCard = ({ stream, cardWidth, index, sellerMap, onPress }) => {
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const translateYAnim = useRef(new Animated.Value(20)).current;
  const isLive = stream.status === 'live';
  const isWaiting = stream.status === 'waiting';
  const isUpcoming = stream.status === 'draft';
  const [upcomingText, setUpcomingText] = useState(() => getUpcomingBadgeText(stream.scheduledAt));

  const thumbnailHeight = cardWidth * 1.25;
  const isLeftColumn = index % 2 === 0;

  const cardStyle = {
    width: cardWidth,
    marginRight: isLeftColumn ? 12 : 0,
    marginBottom: 20,
  };

  useEffect(() => {
    if (!isLive) return;
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    blink.start();
    return () => blink.stop();
  }, [blinkAnim, isLive]);

  // Countdown tick for upcoming streams within 1 hour
  useEffect(() => {
    if (!isUpcoming || !stream.scheduledAt) return;
    const interval = setInterval(() => {
      setUpcomingText(getUpcomingBadgeText(stream.scheduledAt));
    }, 1000);
    return () => clearInterval(interval);
  }, [isUpcoming, stream.scheduledAt]);

  // Entrance animation
  useEffect(() => {
    const delay = index * 80;
    const timer = setTimeout(() => {
      Animated.parallel([
        Animated.timing(fadeAnim, { toValue: 1, duration: 400, useNativeDriver: true }),
        Animated.timing(translateYAnim, { toValue: 0, duration: 400, useNativeDriver: true }),
      ]).start();
    }, delay);
    return () => clearTimeout(timer);
  }, [fadeAnim, translateYAnim, index]);

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.96,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 6,
      tension: 120,
      useNativeDriver: true,
    }).start();
  };

  const seller = sellerMap[stream.createdBy] || {};
  const sellerName = resolveSellerDisplayName(seller);

  const scheduledMs = stream.scheduledAt?.seconds ? stream.scheduledAt.seconds * 1000 : 0;
  const isCountdown = isUpcoming && scheduledMs > 0 && scheduledMs - Date.now() <= 60 * 60 * 1000;

  return (
    <Animated.View
      style={[
        cardStyle,
        { opacity: fadeAnim, transform: [{ scale: scaleAnim }, { translateY: translateYAnim }] },
      ]}>
      <TouchableOpacity
        style={styles.card}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.7}>
        <View style={styles.thumbnailContainer}>
          <ImageBackground
            source={{ uri: stream.coverPhotoUrl || undefined }}
            style={[styles.thumbnail, { width: cardWidth, height: thumbnailHeight }]}
            imageStyle={styles.thumbnailImage}
            resizeMode="cover">
            <View style={styles.topOverlay}>
              <View style={styles.badgeRow}>
                {isLive && (
                  <Animated.View style={[styles.liveBadge, { opacity: blinkAnim }]}>
                    <LiveIcon width={12} height={12} color="#FFFFFF" />
                    <Text style={styles.liveBadgeText}>Live</Text>
                  </Animated.View>
                )}
                {isWaiting && (
                  <View style={styles.waitingBadge}>
                    <Text style={styles.waitingBadgeText}>Waiting</Text>
                  </View>
                )}
                {isUpcoming && (
                  <View style={[styles.timeBadge, isCountdown && styles.countdownBadge]}>
                    <Text style={[styles.timeBadgeText, isCountdown && styles.countdownBadgeText]}>{upcomingText}</Text>
                  </View>
                )}
              </View>
              <View style={styles.badgeRow}>
                <View style={styles.countBadge}>
                  <SocialIcon width={12} height={12} />
                  <Text style={styles.countBadgeText}>{formatViewers(stream.totalViewers || 0)}</Text>
                </View>
              </View>
            </View>

            <View style={styles.bottomOverlay}>
              <Text style={styles.cardTitle} numberOfLines={2}>
                {stream.title || 'Untitled Stream'}
              </Text>
            </View>
          </ImageBackground>
        </View>

        <View style={styles.sellerRow}>
          <Avatar size={28} imageUri={seller.profileImage || seller.profilePhotoUrl} rounded />
          <View style={styles.sellerTextColumn}>
            <Text style={styles.sellerName} numberOfLines={1}>
              {sellerName}
            </Text>
            <Text style={styles.categoryText}>Plants</Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );
};

const AnimatedChip = ({ chip, active, onPress }) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;

  const handlePressIn = () => {
    Animated.spring(scaleAnim, {
      toValue: 0.92,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 5,
      tension: 150,
      useNativeDriver: true,
    }).start();
  };

  return (
    <Animated.View style={{ transform: [{ scale: scaleAnim }] }}>
      <TouchableOpacity
        style={[styles.chip, active && styles.chipActive]}
        onPress={onPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={0.8}>
        {chip.leftIcon && (
          <View style={styles.chipIconWrapper}>
            <chip.leftIcon
              width={16}
              height={16}
              color={active ? '#FFFFFF' : '#647276'}
            />
          </View>
        )}
        <Text style={[styles.chipText, active && styles.chipTextActive]}>
          {chip.label}
        </Text>
      </TouchableOpacity>
    </Animated.View>
  );
};

const LiveScreen = () => {
  const [dimensions, setDimensions] = useState(getScreenDimensions());
  const [streams, setStreams] = useState([]);
  const [sellerMap, setSellerMap] = useState({});
  const sellerMapRef = useRef({});
  const [filter, setFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  useEffect(() => {
    sellerMapRef.current = sellerMap;
  }, [sellerMap]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setDimensions(getScreenDimensions());
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    const liveCollectionRef = collection(db, 'live');
    const q = query(
      liveCollectionRef,
      where('status', 'in', ['live', 'waiting', 'draft']),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedStreams = [];
      querySnapshot.forEach((document) => {
        const data = document.data();
        fetchedStreams.push({
          id: document.id,
          title: data.title || 'Untitled Stream',
          coverPhotoUrl: data.coverPhotoUrl,
          sessionId: data.sessionId || '',
          status: data.status,
          totalViewers: data.totalViewers || 0,
          createdBy: data.createdBy || '',
          liveType: data.liveType || 'live',
          scheduledAt: data.scheduledAt || null,
          createdAt: data.createdAt || null,
        });
      });

      // Sort: live first, then waiting, then draft (draft sorted by scheduledAt ascending)
      fetchedStreams.sort((a, b) => {
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

      setStreams(fetchedStreams);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  // Fetch seller info for unique createdBy UIDs
  useEffect(() => {
    const fetchSellers = async () => {
      const uids = [...new Set(streams.map((s) => s.createdBy).filter(Boolean))];
      if (uids.length === 0) return;

      const newMap = { ...sellerMapRef.current };
      const missingUids = uids.filter((uid) => !newMap[uid]);
      if (missingUids.length === 0) return;

      // Firestore 'in' queries max 10 items
      const chunks = [];
      for (let i = 0; i < missingUids.length; i += 10) {
        chunks.push(missingUids.slice(i, i + 10));
      }

      for (const chunk of chunks) {
        // We have to fetch individually because we don't know the queryable field name
        // and supplier doc ID is the UID
        await Promise.all(
          chunk.map(async (uid) => {
            try {
              const supplierDocRef = doc(db, 'supplier', uid);
              const docSnap = await getDoc(supplierDocRef);
              if (docSnap.exists()) {
                const data = docSnap.data();
                newMap[uid] = {
                  alias: data.alias || '',
                  gardenOrCompanyName: data.gardenOrCompanyName || '',
                  profileImage: data.profileImage || data.profilePhotoUrl || '',
                };
              }
            } catch (e) {
              console.error('Error fetching seller profile:', e);
            }
          }),
        );
      }

      setSellerMap(newMap);
    };

    fetchSellers();
  }, [streams]);

  const horizontalRef = useRef(null);
  const PAGE_FILTERS = ['all', 'live', 'upcoming'];

  const getStreamsForFilter = (filterKey) =>
    streams.filter((stream) => {
      if (filterKey === 'all') return true;
      if (filterKey === 'live') return stream.status === 'live' || stream.status === 'waiting';
      if (filterKey === 'upcoming') return stream.status === 'draft';
      return true;
    });

  const handleChipPress = (key) => {
    setFilter(key);
    const index = PAGE_FILTERS.indexOf(key);
    if (horizontalRef.current && index >= 0) {
      horizontalRef.current.scrollToOffset({
        offset: index * dimensions.screenWidth,
        animated: true,
      });
    }
  };

  const handleMomentumScrollEnd = (event) => {
    const offsetX = event.nativeEvent.contentOffset.x;
    const pageIndex = Math.round(offsetX / dimensions.screenWidth);
    const newFilter = PAGE_FILTERS[pageIndex];
    if (newFilter && newFilter !== filter) {
      setFilter(newFilter);
    }
  };

  const renderPage = ({ item: filterKey }) => {
    const pageStreams = getStreamsForFilter(filterKey);

    return (
      <ScrollView
        style={[styles.pageScrollView, { width: dimensions.screenWidth }]}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}
        nestedScrollEnabled>
        {loading && streams.length === 0 && (
          <View style={[styles.grid, { paddingHorizontal: dimensions.HORIZONTAL_PADDING / 2 }]}>
            {[0, 1, 2, 3].map((i) => (
              <ShimmerSkeleton
                key={`skeleton-${i}`}
                cardWidth={dimensions.CARD_WIDTH}
                index={i}
              />
            ))}
          </View>
        )}

        {!loading && pageStreams.length === 0 && (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>
              {filterKey === 'upcoming'
                ? 'No upcoming live sales or purges at this time.'
                : filterKey === 'live'
                  ? 'There is no ongoing live sale or live purge at this time.'
                  : 'No live streams available at this time.'}
            </Text>
          </View>
        )}

        <View style={[styles.grid, { paddingHorizontal: dimensions.HORIZONTAL_PADDING / 2 }]}>
          {pageStreams.map((stream, index) => (
            <LiveFeedCard
              key={stream.id}
              stream={stream}
              cardWidth={dimensions.CARD_WIDTH}
              index={index}
              sellerMap={sellerMap}
              onPress={() => handleCardPress(stream)}
            />
          ))}
        </View>
      </ScrollView>
    );
  };

  const handleCardPress = (stream) => {
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
      stream.liveType === 'purge' ? 'LivePurgeScreen' : 'BuyerLiveStreamScreen',
      {
        sessionId: stream.sessionId,
        broadcasterId: stream.createdBy,
      },
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.searchContainer}>
          <SearchHeader
            readOnly
            placeholder="Search live and upcoming..."
            onPress={() => navigation.navigate('ScreenLiveSearch')}
          />
        </View>
        <View style={styles.headerIcons}>
          <View style={styles.iconButton}>
            <Wishicon width={40} height={40} />
          </View>
          <TouchableOpacity
            style={styles.iconButton}
            onPress={() => navigation.navigate('ScreenProfile')}>
            <Avatar size={40} rounded />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.chipRow}>
        {CHIP_FILTERS.map((chip) => {
          const active = filter === chip.key;
          return (
            <AnimatedChip
              key={chip.key}
              chip={chip}
              active={active}
              onPress={() => handleChipPress(chip.key)}
            />
          );
        })}
      </View>

      <FlatList
        ref={horizontalRef}
        style={styles.pageScrollView}
        data={PAGE_FILTERS}
        renderItem={renderPage}
        keyExtractor={(item) => item}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        scrollEventThrottle={16}
        onMomentumScrollEnd={handleMomentumScrollEnd}
        keyboardShouldPersistTaps="handled"
        initialScrollIndex={PAGE_FILTERS.indexOf(filter)}
        getItemLayout={(_, index) => ({
          length: dimensions.screenWidth,
          offset: dimensions.screenWidth * index,
          index,
        })}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 13,
    zIndex: 10001,
    elevation: 10001,
  },
  searchContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 209,
    height: 40,
    flex: 1,
    zIndex: 10000,
    elevation: 10000,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginHorizontal: 4,
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F5F6F6',
  },
  pageScrollView: {
    flex: 1,
    backgroundColor: '#F5F6F6',
  },
  contentContainer: {
    paddingTop: 12,
    paddingBottom: 150,
  },
  chipRow: {
    flexDirection: 'row',
    gap: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#F5F6F6',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
  },
  chipActive: {
    backgroundColor: '#539461',
    borderColor: '#539461',
  },
  chipText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 13,
    color: '#647276',
  },
  chipTextActive: {
    color: '#FFFFFF',
  },
  chipIconWrapper: {
    marginRight: 4,
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  card: {
    flexDirection: 'column',
  },
  thumbnailContainer: {
    marginBottom: 8,
  },
  thumbnail: {
    borderRadius: 12,
    overflow: 'hidden',
    justifyContent: 'space-between',
  },
  thumbnailImage: {
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  topOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 8,
    zIndex: 1,
  },
  badgeRow: {
    flexDirection: 'row',
    gap: 6,
  },
  liveBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: '#E7522F',
    borderRadius: 8,
  },
  liveBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 11,
    color: '#FFFFFF',
  },
  waitingBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: '#D4A017',
    borderRadius: 8,
  },
  waitingBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 11,
    color: '#FFFFFF',
  },
  timeBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
    borderRadius: 8,
  },
  timeBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 11,
    color: '#FFFFFF',
  },
  countdownBadge: {
    backgroundColor: '#E7522F',
  },
  countdownBadgeText: {
    color: '#FFFFFF',
  },
  countBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 3,
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
    borderRadius: 8,
  },
  countBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 11,
    color: '#FFFFFF',
  },
  bottomOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    padding: 8,
    paddingTop: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.35)',
    zIndex: 1,
  },
  cardTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 13,
    color: '#FFFFFF',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 4,
    lineHeight: 18,
  },
  sellerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
  },
  sellerTextColumn: {
    flexDirection: 'column',
    flex: 1,
  },
  sellerName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 13,
    color: '#202325',
  },
  categoryText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 11,
    color: '#7F8D91',
    marginTop: 1,
  },
  emptyState: {
    paddingVertical: 40,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#647276',
    textAlign: 'center',
  },
  skeletonMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 4,
    marginTop: 4,
  },
  skeletonAvatar: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E8ECED',
  },
  skeletonLines: {
    flex: 1,
    gap: 4,
  },
  skeletonLine: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E8ECED',
    width: '80%',
  },
  skeletonLineShort: {
    height: 10,
    borderRadius: 5,
    backgroundColor: '#E8ECED',
    width: '60%',
  },
  skeletonThumbnail: {
    borderRadius: 12,
    backgroundColor: '#E8ECED',
  },
});

export default LiveScreen;
