import { collection, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../../../firebase';

import CalendarWhiteIcon from '../../../assets/buyer-icons/calendar-white.svg';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';

const getScreenDimensions = () => {
  const { width: screenWidth } = Dimensions.get('window');
  const HORIZONTAL_PADDING = 30;
  const GAP = 13;
  const availableWidth = screenWidth - HORIZONTAL_PADDING;
  const cardWidth = (availableWidth - GAP) / 2;
  return { screenWidth, HORIZONTAL_PADDING, GAP, CARD_WIDTH: cardWidth };
};

const UpcomingVideoCard = ({ stream, cardWidth, index }) => {
  const cardHeight = 312;
  const thumbnailHeight = 264;
  const isLeftColumn = index % 2 === 0;

  const cardStyle = {
    width: cardWidth,
    height: cardHeight,
    marginRight: isLeftColumn ? 13 : 0,
    marginBottom: 24,
  };

  return (
    <TouchableOpacity
      style={[styles.videoCard, cardStyle]}
      onPress={() => {
        /* No action for upcoming streams yet */
      }}>
      <View style={styles.videoContainer}>
        <ImageBackground
          source={{ uri: stream.thumbnail }}
          style={[styles.thumbnail, { width: cardWidth, height: thumbnailHeight }]}
          imageStyle={styles.thumbnailImage}>
          <View style={styles.bottomOverlay}>
            <View style={styles.dateContainer}>
              <CalendarWhiteIcon width={16} height={16} />
              <Text style={styles.dateText}>{stream.scheduledAt}</Text>
            </View>
          </View>
          {stream.liveType === 'purge' && (
            <View style={styles.topOverlayPurge}>
              <View style={styles.liveStatusPurgeLeft}>
                <Text style={styles.livePurgeLabel}>Live Purge</Text>
              </View>
            </View>
          )}
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

const UpcomingLiveListScreen = ({ navigation }) => {
  const [dimensions, setDimensions] = useState(getScreenDimensions());
  const [upcomingStreams, setUpcomingStreams] = useState([]);

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
      where('status', '==', 'draft'),
      orderBy('scheduledAt', 'asc'),
    );

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedStreams = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        fetchedStreams.push({
          id: doc.id,
          title: data.title || 'Untitled Stream',
          thumbnail: data.coverPhotoUrl || require('../../../assets/images/plant1.png'),
          scheduledAt: data.scheduledAt
            ? moment(data.scheduledAt.seconds * 1000).format('MMM DD, YYYY hh:mmA')
            : 'Date TBD',
          liveType: data.liveType || 'live',
        });
      });
      setUpcomingStreams(fetchedStreams);
    });

    return () => unsubscribe();
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
        <Text style={styles.headerTitle}>Upcoming Live Sales and Purges</Text>
        <View style={{ width: 24 }} />
      </View>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.plantsContainer, { paddingHorizontal: dimensions.HORIZONTAL_PADDING / 2 }]}>
          {upcomingStreams.map((stream, index) => (
            <UpcomingVideoCard
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
    justifyContent: 'space-between',
  },
  thumbnailImage: {
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  bottomOverlay: {
    padding: 8,
  },
  dateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    gap: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
    borderRadius: 8,
    alignSelf: 'flex-start',
  },
  dateText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#FFFFFF',
  },
  topOverlayPurge: {
    padding: 8,
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
  livePurgeLabel: {
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

export default UpcomingLiveListScreen;
