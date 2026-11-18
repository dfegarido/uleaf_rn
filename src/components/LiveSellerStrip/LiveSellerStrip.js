import moment from 'moment';
import React, { useEffect, useRef, useState } from 'react';
import {
  Alert,
  Animated,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { formatElapsedTime } from '../../utils/formatElapsedTime';
import LiveIcon from '../../assets/iconnav/live.svg';
import { getLiveStreamsApi, normalizeLiveRow, isVisibleLiveStream } from '../Api/liveApi';
import { subscribeToLiveStreams } from '../../utils/realtimeLive';

const scheduledDate = (scheduledAt) => {
  if (!scheduledAt) return null;
  return scheduledAt.seconds ? new Date(scheduledAt.seconds * 1000) : new Date(scheduledAt);
};

const formatScheduledTime = (scheduledAt) => {
  const date = scheduledDate(scheduledAt);
  if (!date || Number.isNaN(date.getTime())) return 'Date TBD';
  const now = moment().startOf('day');
  const target = moment(date).startOf('day');
  if (target.isSame(now, 'day')) {
    return `Today, ${moment(date).format('h:mm A')}`;
  }
  if (target.isSame(now.clone().add(1, 'day'), 'day')) {
    return `Tomorrow, ${moment(date).format('h:mm A')}`;
  }
  return moment(date).format('MMM DD, h:mm A');
};

/** Bottom-card countdown, e.g. "Starts in 12m 20s". */
const getStartsInText = (scheduledAt) => {
  const date = scheduledDate(scheduledAt);
  if (!date || Number.isNaN(date.getTime())) return 'Starts soon';
  const diff = date.getTime() - Date.now();
  if (diff <= 0) return 'Starting now';
  const totalSeconds = Math.floor(diff / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `Starts in ${hours}h ${minutes}m`;
  }
  return `Starts in ${minutes}m ${seconds.toString().padStart(2, '0')}s`;
};

const liveDetailCopy = (stream) => {
  if (stream?.status === 'waiting' || stream?.status === 'draft') {
    return 'This live sale is scheduled and not on air yet. Come back at the start time to join, or tap Notify Me for a reminder when it begins.';
  }
  return 'Live sale details.';
};

const CARD_WIDTH = 150;
const CARD_HEIGHT = 220;

const LiveSellerCard = ({ stream, displayName, onPress }) => {
  const blinkAnim = useRef(new Animated.Value(1)).current;
  const [elapsed, setElapsed] = useState(() => formatElapsedTime(stream.createdAt));
  // Buyer live-list maps approved `waiting` → `draft` (upcoming).
  const isUpcoming = stream.status === 'draft' || stream.status === 'waiting';
  const scheduledLabel = formatScheduledTime(stream.scheduledAt);
  const [startsInText, setStartsInText] = useState(() => getStartsInText(stream.scheduledAt));

  useEffect(() => {
    if (isUpcoming) return;
    const blink = Animated.loop(
      Animated.sequence([
        Animated.timing(blinkAnim, { toValue: 0.3, duration: 600, useNativeDriver: true }),
        Animated.timing(blinkAnim, { toValue: 1, duration: 600, useNativeDriver: true }),
      ]),
    );
    blink.start();
    return () => blink.stop();
  }, [blinkAnim, isUpcoming]);

  useEffect(() => {
    if (isUpcoming) return;
    const timer = setInterval(() => {
      setElapsed(formatElapsedTime(stream.createdAt));
    }, 1000);
    return () => clearInterval(timer);
  }, [stream.createdAt, isUpcoming]);

  useEffect(() => {
    if (!isUpcoming || !stream.scheduledAt) return;
    const tick = () => setStartsInText(getStartsInText(stream.scheduledAt));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [isUpcoming, stream.scheduledAt]);

  const statusOverlay = isUpcoming ? (
    <>
      <View style={styles.scheduleBadge}>
        <Text style={styles.scheduleBadgeText}>{scheduledLabel}</Text>
      </View>
      <View style={styles.upcomingBottomBar}>
        <Text style={styles.startsInText} numberOfLines={1}>
          {startsInText}
        </Text>
      </View>
    </>
  ) : (
    <Animated.View style={[styles.liveBadge, { opacity: blinkAnim }]}>
      <LiveIcon width={14} height={14} color="#FFFFFF" />
      <Text style={styles.liveBadgeText}>Live</Text>
    </Animated.View>
  );

  return (
    <TouchableOpacity
      style={styles.card}
      onPress={onPress}
      activeOpacity={0.7}>
      {stream.coverPhotoUrl ? (
        <View style={styles.cardImage}>
          {/* RN 0.87 deprecates ImageBackground; the supported equivalent is a View
              with an absolutely positioned Image, which is how ImageBackground itself
              is implemented. `style.width/height` are mirrored onto the Image and
              `cardImageStyle` is applied last, matching ImageBackground's own order. */}
          <Image
            source={{ uri: stream.coverPhotoUrl }}
            style={[
              StyleSheet.absoluteFill,
              { width: styles.cardImage.width, height: styles.cardImage.height },
              styles.cardImageStyle,
            ]}
            resizeMode="cover"
          />
          {statusOverlay}
        </View>
      ) : (
        <View style={[styles.cardImage, styles.cardImagePlaceholder]}>
          {statusOverlay}
          <Text style={styles.noImageText}>No Image</Text>
        </View>
      )}
      <View style={styles.cardInfo}>
        <Text style={styles.sellerName} numberOfLines={1}>
          {displayName}
        </Text>
        <Text style={styles.elapsedTime}>
          {isUpcoming ? scheduledLabel : elapsed}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const LiveSellerStrip = ({ navigation }) => {
  const [liveStreams, setLiveStreams] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedStream, setSelectedStream] = useState(null);
  const [detailCountdown, setDetailCountdown] = useState('');
  const slideAnim = useRef(new Animated.Value(60)).current;
  const phase = loading || liveStreams.length === 0 ? 'fallback' : 'live';

  useEffect(() => {
    if (!selectedStream?.scheduledAt) {
      setDetailCountdown('');
      return undefined;
    }
    const tick = () => setDetailCountdown(getStartsInText(selectedStream.scheduledAt));
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [selectedStream]);

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
    let active = true;
    let unsubscribeRealtime = null;
    let pollTimer = null;

    const loadStreams = async () => {
      const res = await getLiveStreamsApi();
      if (!active) return;
      if (res.success) {
        const streams = res.streams
          .filter(isVisibleLiveStream)
          .sort((a, b) => {
            const statusOrder = { live: 0, waiting: 1, draft: 2 };
            if (statusOrder[a.status] !== statusOrder[b.status]) {
              return statusOrder[a.status] - statusOrder[b.status];
            }
            if (a.status === 'draft' && b.status === 'draft') {
              return (a.scheduledAt?.seconds || 0) - (b.scheduledAt?.seconds || 0);
            }
            return 0;
          });
        setLiveStreams(streams);
      } else {
        console.error('LiveSellerStrip loadStreams error:', res.error);
      }
      setLoading(false);
    };

    loadStreams();

    // Safety net: the strip lives on the long-lived Shop screen, so a session
    // that ends must never be able to linger as a "Live" card. Realtime removes
    // it immediately; this periodic re-fetch covers a dropped socket or an
    // expired realtime token.
    pollTimer = setInterval(loadStreams, 60 * 1000);

    subscribeToLiveStreams({
      onInsert: (payload) => {
        if (!active || !payload?.new) return;
        const row = normalizeLiveRow(payload.new);
        if (!isVisibleLiveStream(row)) return;
        setLiveStreams((prev) => {
          if (prev.some((s) => s.id === row.id)) return prev;
          const next = [...prev, row];
          return next;
        });
      },
      onUpdate: (payload) => {
        if (!active || !payload?.new) return;
        const row = normalizeLiveRow(payload.new);
        setLiveStreams((prev) => {
          const idx = prev.findIndex((s) => s.id === row.id);
          if (idx < 0) return prev;
          if (!isVisibleLiveStream(row)) {
            // Ended or went stale -> drop from the strip.
            return prev.filter((s) => s.id !== row.id);
          }
          const next = [...prev];
          next[idx] = row;
          return next;
        });
      },
      onDelete: (payload) => {
        if (!active || !payload?.old) return;
        setLiveStreams((prev) => prev.filter((s) => s.id !== payload.old.id));
      },
    })
      .then((unsub) => {
        if (active) unsubscribeRealtime = unsub;
        else unsub();
      })
      .catch((e) => console.error('LiveSellerStrip realtime subscribe error:', e));

    return () => {
      active = false;
      if (pollTimer) clearInterval(pollTimer);
      if (unsubscribeRealtime) unsubscribeRealtime();
    };
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
                if (stream.status === 'waiting' || stream.status === 'draft') {
                  setSelectedStream(stream);
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

      <Modal
        visible={!!selectedStream}
        transparent
        animationType="slide"
        onRequestClose={() => setSelectedStream(null)}>
        <View style={styles.detailOverlay}>
          <TouchableOpacity
            style={styles.detailBackdrop}
            activeOpacity={1}
            onPress={() => setSelectedStream(null)}
          />
          <View style={styles.detailSheet}>
            <View style={styles.detailHandle} />
            <View style={styles.detailHeader}>
              <Text style={styles.detailSection}>Upcoming Live</Text>
              <TouchableOpacity
                onPress={() => setSelectedStream(null)}
                hitSlop={{top: 12, bottom: 12, left: 12, right: 12}}>
                <Text style={styles.detailClose}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView
              showsVerticalScrollIndicator={false}
              contentContainerStyle={styles.detailScroll}>
              <View style={styles.detailImageWrap}>
                {selectedStream?.coverPhotoUrl ? (
                  <Image
                    source={{uri: selectedStream.coverPhotoUrl}}
                    style={styles.detailImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={[styles.detailImage, styles.detailImagePlaceholder]}>
                    <Text style={styles.noImageText}>No Image</Text>
                  </View>
                )}
                <View style={styles.detailImageSchedule}>
                  <Text style={styles.detailImageScheduleText}>
                    {formatScheduledTime(selectedStream?.scheduledAt)}
                  </Text>
                </View>
              </View>

              <Text style={styles.detailTitle}>
                {selectedStream?.title || 'Live Stream'}
              </Text>

              <View style={styles.detailInfoBlock}>
                <View style={styles.detailInfoRow}>
                  <Text style={styles.detailInfoLabel}>Scheduled</Text>
                  <Text style={styles.detailInfoValue}>
                    {formatScheduledTime(selectedStream?.scheduledAt)}
                  </Text>
                </View>
                {detailCountdown ? (
                  <View style={styles.detailInfoRow}>
                    <Text style={styles.detailInfoLabel}>Starts</Text>
                    <Text style={styles.detailInfoValue}>{detailCountdown}</Text>
                  </View>
                ) : null}
              </View>

              <Text style={styles.detailDescription}>
                {selectedStream ? liveDetailCopy(selectedStream) : ''}
              </Text>
            </ScrollView>

            <View style={styles.detailFooter}>
              <TouchableOpacity
                style={styles.notifyButton}
                activeOpacity={0.85}
                onPress={() => {
                  Alert.alert(
                    'Notify Me',
                    "We'll remind you when this live starts.",
                  );
                }}>
                <Text style={styles.notifyButtonText}>Notify Me</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  scheduleBadge: {
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
    maxWidth: CARD_WIDTH - 16,
  },
  scheduleBadgeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    color: '#FFFFFF',
  },
  upcomingBottomBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    paddingVertical: 8,
    backgroundColor: 'rgba(17, 17, 17, 0.78)',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255, 255, 255, 0.16)',
    zIndex: 2,
  },
  startsInText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 11,
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
  detailOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
  },
  detailBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  detailSheet: {
    maxHeight: '85%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    overflow: 'hidden',
  },
  detailHandle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#D0D5D8',
    marginTop: 10,
    marginBottom: 8,
  },
  detailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 10,
  },
  detailSection: {
    fontSize: 13,
    fontWeight: '700',
    color: '#539461',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  detailClose: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6B777B',
  },
  detailScroll: {
    paddingHorizontal: 20,
    paddingBottom: 16,
  },
  detailImageWrap: {
    width: '100%',
    height: 210,
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#F5F5F5',
  },
  detailImage: {
    width: '100%',
    height: '100%',
  },
  detailImagePlaceholder: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  detailImageSchedule: {
    position: 'absolute',
    top: 10,
    left: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
    paddingVertical: 4,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  detailImageScheduleText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
  },
  detailTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: '#202325',
    marginBottom: 14,
  },
  detailInfoBlock: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#E6EAEB',
    paddingVertical: 4,
    marginBottom: 14,
  },
  detailInfoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 10,
  },
  detailInfoLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F8D91',
  },
  detailInfoValue: {
    flex: 1,
    marginLeft: 16,
    textAlign: 'right',
    fontSize: 14,
    fontWeight: '700',
    color: '#202325',
  },
  detailDescription: {
    fontSize: 15,
    lineHeight: 22,
    color: '#556065',
  },
  detailFooter: {
    paddingHorizontal: 20,
    paddingTop: 12,
    paddingBottom: 24,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#E6EAEB',
  },
  notifyButton: {
    backgroundColor: '#539461',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  notifyButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
});

export default LiveSellerStrip;
