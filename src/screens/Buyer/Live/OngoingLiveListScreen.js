import React, { useEffect, useState } from 'react';
import { Alert,
  Dimensions,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import LiveIcon from '../../../assets/iconnav/live.svg';
import SocialIcon from '../../../assets/iconnav/social.svg';
import { getLiveStreamsApi, normalizeLiveRow } from '../../../components/Api/liveApi';
import { subscribeToLiveStreams } from '../../../utils/realtimeLive';

const getScreenDimensions = () => {
  const { width: screenWidth } = Dimensions.get('window');
  const HORIZONTAL_PADDING = 30;
  const GAP = 13;
  const availableWidth = screenWidth - HORIZONTAL_PADDING;
  const cardWidth = (availableWidth - GAP) / 2;
  return { screenWidth, HORIZONTAL_PADDING, GAP, CARD_WIDTH: cardWidth };
};

const LiveVideoCard = ({ navigation, stream, cardWidth, index }) => {
  const formatViewers = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const cardHeight = 312;
  const thumbnailHeight = 264;
  const isLeftColumn = index % 2 === 0;

  const cardStyle = {
    width: cardWidth,
    height: cardHeight,
    marginRight: isLeftColumn ? 13 : 0,
    marginBottom: 24,
  };

  const goTo = (stream) => {
    if (stream.status === 'live') {
      navigation.navigate(
          stream.liveType === 'purge' ? 'LivePurgeScreen' : 'BuyerLiveStreamScreen',
          {
            sessionId: stream.sessionId,
            broadcasterId: stream.createdBy,
          },
      )
    } else {
      Alert.alert('Waiting for the Broadcaster...');
    }
  }


  return (
    <TouchableOpacity
      onPress={() =>
        goTo(stream)
      }
      style={[styles.videoCard, cardStyle]}>
      <View style={styles.videoContainer}>
        <ImageBackground
          source={{ uri: stream.thumbnail }}
          style={[styles.thumbnail, { width: cardWidth, height: thumbnailHeight }]}
          imageStyle={styles.thumbnailImage}>
          {stream.status === 'live' && (<View style={styles.topOverlay}>
            <View style={styles.liveStatusLeft}>
              <LiveIcon width={16} height={16} color="#FFFFFF" />
              <Text style={styles.liveLabel}>{stream.liveType === 'live' ? 'Live' : 'Live Purge'}</Text>
            </View>
            <View style={styles.viewersContainer}>
              <SocialIcon width={16} height={16} />
              <Text style={styles.viewerCount}>{formatViewers(stream.viewers)}</Text>
            </View>
          </View>)}
          {stream.status === 'waiting' && (<View style={styles.topOverlay}>
            <View style={styles.viewersContainer}>
              <Text style={styles.viewerCount}>Waiting for the Broadcaster...</Text>
            </View>
          </View>)}
          {/* {stream.liveType === 'purge' && (
            <View style={styles.topOverlayPurge}>
              <View style={styles.liveStatusPurgeLeft}>
                <Text style={styles.livePurgeLabel}>Purge</Text>
              </View>
            </View>
          )} */}
        </ImageBackground>
      </View>
      <View style={styles.titleDetails}>
        <Text style={styles.titleText} numberOfLines={2}>
          {stream.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const OngoingLiveListScreen = ({ navigation }) => {
  const [dimensions, setDimensions] = useState(getScreenDimensions());
  const [liveStreams, setLiveStreams] = useState([]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', () => {
      setDimensions(getScreenDimensions());
    });
    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    let active = true;
    let unsubscribeRealtime = null;

    // Map a normalized stream row into the LiveVideoCard's expected shape.
    const toCard = (row) => ({
      id: row.id,
      title: row.title || 'Untitled Stream',
      thumbnail: row.coverPhotoUrl,
      sessionId: row.sessionId || '',
      status: row.status,
      viewers: row.totalViewers || 0,
      createdBy: row.createdBy || '',
      liveType: row.liveType || 'live',
    });

    const loadOngoing = async () => {
      const res = await getLiveStreamsApi();
      if (!active) return;
      if (res.success) {
        const ongoing = res.streams
          .filter((s) => s.status === 'live' || s.status === 'waiting')
          .sort((a, b) => (b.createdAt?.seconds || 0) - (a.createdAt?.seconds || 0))
          .map(toCard);
        setLiveStreams(ongoing);
      } else {
        console.error('OngoingLiveListScreen loadOngoing error:', res.error);
      }
    };

    loadOngoing();

    subscribeToLiveStreams({
      onInsert: (payload) => {
        if (!active || !payload?.new) return;
        const row = normalizeLiveRow(payload.new);
        if (row.status !== 'live' && row.status !== 'waiting') return;
        setLiveStreams((prev) => {
          const next = [...prev];
          const idx = next.findIndex((s) => s.id === row.id);
          if (idx >= 0) next[idx] = toCard(row);
          else next.push(toCard(row));
          return next;
        });
      },
      onUpdate: (payload) => {
        if (!active || !payload?.new) return;
        const row = normalizeLiveRow(payload.new);
        setLiveStreams((prev) => {
          if (row.status !== 'live' && row.status !== 'waiting') {
            return prev.filter((s) => s.id !== row.id);
          }
          const idx = prev.findIndex((s) => s.id === row.id);
          if (idx < 0) return prev;
          const next = [...prev];
          next[idx] = toCard(row);
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
      .catch((e) => console.error('OngoingLiveListScreen realtime subscribe error:', e));

    return () => {
      active = false;
      if (unsubscribeRealtime) unsubscribeRealtime();
    };
  }, []);

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => {
          if (navigation.canGoBack()) {
            navigation.goBack();
          } else {
            navigation.navigate('LiveScreen');
          }
        }}>
          <BackSolidIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Ongoing Live Sale/Purge</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.plantsContainer, { paddingHorizontal: dimensions.HORIZONTAL_PADDING / 2 }]}>
          {liveStreams.map((stream, index) => (
            <LiveVideoCard
              navigation={navigation}
              key={stream.id}
              stream={stream}
              cardWidth={dimensions.CARD_WIDTH}
              index={index}
            />
          ))}
        </View>
      </ScrollView>
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
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#202325',
  },
  scrollView: {
    flex: 1,
    backgroundColor: '#F5F6F6',
  },
  contentContainer: {
    paddingTop: 24,
    paddingBottom: 150,
  },
  plantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'flex-start',
  },
  videoCard: {
    flexDirection: 'column',
  },
  videoContainer: {
    marginBottom: 8,
  },
  thumbnail: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailImage: {
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  topOverlay: {
    position: 'absolute',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 8,
    width: '100%',
    top: 0,
    zIndex: 1,
  },
  topOverlayPurge: {
    position: 'absolute',
    padding: 8,
    width: '100%',
    top: 220,
    zIndex: 1,
  },
  liveStatusLeft: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: '#539461',
    borderRadius: 8,
  },
  liveStatusPurgeLeft: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: '#a23514ff',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  liveLabel: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#FFFFFF',
  },
  livePurgeLabel: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#FFFFFF',
  },
  viewersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
    borderRadius: 8,
  },
  viewerCount: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#FFFFFF',
  },
  titleDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    height: 40,
  },
  titleText: {
    fontFamily: 'Inter',
    fontWeight: '900',
    fontSize: 14,
    lineHeight: 19.6,
    color: '#202325',
    flex: 1,
  },
});

export default OngoingLiveListScreen;
