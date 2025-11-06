import {
  collection,
  onSnapshot,
  orderBy,
  query
} from 'firebase/firestore';
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

// Import SVG icons
import CalendarWhiteIcon from '../../../assets/buyer-icons/calendar-white.svg';
import LiveIcon from '../../../assets/iconnav/live.svg';
import SocialIcon from '../../../assets/iconnav/social.svg';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import AvatarIcon from '../../../assets/images/avatar.svg';
import { InputGroupLeftIcon } from '../../../components/InputGroup/Left';

// Get screen dimensions with proper 2-column layout calculation
const getScreenDimensions = () => {
  const {width: screenWidth} = Dimensions.get('window');
  const HORIZONTAL_PADDING = 30; // 15px on each side
  const GAP = 12; // Gap between columns
  const MIN_CARD_WIDTH = 140; // Minimum card width for small screens
  const MAX_CARD_WIDTH = 200; // Maximum card width for large screens

  // Calculate available width for content
  const availableWidth = screenWidth - HORIZONTAL_PADDING;

  // Calculate card width for exactly 2 columns with gap
  let cardWidth = (availableWidth - GAP) / 2;

  // Ensure card width is within acceptable bounds
  cardWidth = Math.max(MIN_CARD_WIDTH, Math.min(MAX_CARD_WIDTH, cardWidth));

  return {
    screenWidth,
    HORIZONTAL_PADDING,
    GAP,
    CARD_WIDTH: cardWidth,
    availableWidth,
  };
};

// Initialize with current dimensions
let {screenWidth, HORIZONTAL_PADDING, GAP, CARD_WIDTH, availableWidth} =
  getScreenDimensions();

const LiveVideoCard = ({navigation, stream, cardWidth, index, totalItems}) => {
  const formatViewers = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Fixed dimensions based on CSS specifications
  const cardHeight = 312; // Total height from CSS: 264px (video) + 8px (gap) + 40px (details) = 312px
  const thumbnailWidth = 166; // Fixed width from CSS
  const thumbnailHeight = 264; // Fixed height from CSS

  // Calculate if this item should be in the left column
  // For 2-column layout: left column items have even indices (0, 2, 4, ...)
  const isLeftColumn = index % 2 === 0;
  
  const cardStyle = {
    width: thumbnailWidth,
    height: cardHeight,
    marginRight: isLeftColumn ? 13 : 0, // 13px gap between columns as per CSS
    marginBottom: 24, // 24px vertical gap as per CSS
  };

  return (
    <TouchableOpacity 
      onPress={stream.isLive ? () => navigation.navigate(stream.liveType === 'purge' ? 'BuyerLivePurgeScreen' : 'BuyerLiveStreamScreen', {
          sessionId: stream.sessionId,
          broadcasterId: stream.createdBy,
        }) : () => {}} 
      style={[styles.videoCard, cardStyle]}
    >
      {/* Video container */}
      <View style={styles.videoContainer}>
        <View style={styles.thumbnailContainer}>
          <ImageBackground
            source={{uri:stream.thumbnail}}
            style={[styles.thumbnail, {width: thumbnailWidth, height: thumbnailHeight}]}
            imageStyle={styles.thumbnailImage}
          >
            {/* Status + Viewer overlay at top */}
            <View style={styles.topOverlay}>
              {stream.isLive ? (
                <View style={styles.liveStatusLeft}>
                  <LiveIcon width={16} height={16} />
                  <Text style={styles.liveLabel}>Live</Text>
                </View>
              ) : (
                <View style={styles.emptySpace} />
              )}
              <View style={styles.viewersContainer}>
                <SocialIcon width={16} height={16} />
                <Text style={styles.viewerCount}>
                  {formatViewers(stream.viewers)}
                </Text>
              </View>
            </View>

            {/* Date Time overlay at bottom - only for non-live streams */}
            {!stream.isLive && (
              <View style={styles.bottomOverlay}>
                <View style={styles.dateContainer}>
                  <CalendarWhiteIcon width={16} height={16} />
                  <Text style={styles.dateText}>{stream.createdAt}</Text>
                </View>
              </View>
            )}
          </ImageBackground>
        </View>
      </View>
      
      {/* Title section */}
      <View style={styles.titleDetails}>
        <View style={styles.titleContainer}>
          <Text style={styles.titleText} numberOfLines={2}>
            {stream.title}
          </Text>
        </View>
      </View>
    </TouchableOpacity>
  );
};

const LiveHeader = ({navigation}) => {
  const [searchText, setSearchText] = useState('');

  return (
    <View style={styles.header}>
      <View style={{flex: 1}}>
        <InputGroupLeftIcon
          IconLeftComponent={SearchIcon}
          placeholder={'Search ileafU'}
          value={searchText}
          onChangeText={setSearchText}
        />
      </View>

      <View style={styles.headerIcons}>
        <TouchableOpacity
          style={styles.iconButton}
          onPress={() => navigation.navigate('ScreenProfile')}>
          <AvatarIcon width={40} height={40} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const LiveTabs = ({activeTab, setActiveTab}) => {
  return (
    <View style={styles.tabsContainer}>
      <View style={styles.tabsContent}>
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'recaps' && styles.activeTab]}
          onPress={() => setActiveTab('recaps')}>
          <View style={styles.tabContent}>
            <Text style={[styles.tabTitle, activeTab === 'recaps' && styles.activeTabTitle]}>
              Live Recaps
            </Text>
          </View>
          <View style={[styles.tabIndicator, activeTab === 'recaps' && styles.activeTabIndicator]} />
        </TouchableOpacity>
        
        <TouchableOpacity 
          style={[styles.tab, activeTab === 'upcoming' && styles.activeTab]}
          onPress={() => setActiveTab('upcoming')}>
          <View style={styles.tabContent}>
            <Text style={[styles.tabTitle, activeTab === 'upcoming' && styles.activeTabTitle]}>
              Upcoming
            </Text>
          </View>
          <View style={[styles.tabIndicator, activeTab === 'upcoming' && styles.activeTabIndicator]} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const LiveScreen = ({navigation}) => {
  const [dimensions, setDimensions] = useState(getScreenDimensions());
  const [activeTab, setActiveTab] = useState('recaps');
  const [liveStreams, setLiveStreams] = useState([]);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      const newDimensions = getScreenDimensions();
      setDimensions(newDimensions);
      // Update global variables for StyleSheet
      screenWidth = newDimensions.screenWidth;
      HORIZONTAL_PADDING = newDimensions.HORIZONTAL_PADDING;
      GAP = newDimensions.GAP;
      CARD_WIDTH = newDimensions.CARD_WIDTH;
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    const liveCollectionRef = collection(db, 'live');
    const q = query(liveCollectionRef, orderBy('status', 'desc'), orderBy('createdAt', 'desc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedLiveStreams = [];
      querySnapshot.forEach((doc) => {
        const data = doc.data();
        
        const mutatedData = {
          title: data.title || 'Untitled Stream',
          thumbnail: data.coverPhotoUrl || require('../../../assets/images/plant1.png'),
          status: data.status || 'draft',
          createdAt: moment(data.createdAt.seconds * 1000).format('MMM-DD hh:mmA'),
          sessionId: data.sessionId || '',
          id: doc.id,
          isLive: data.status === 'live',
          viewers: formatViewers(data.totalViewers || 0),
          createdBy: data.createdBy || '',
        };
        fetchedLiveStreams.push(mutatedData);
      });
      setLiveStreams(fetchedLiveStreams);
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, []);

  const formatViewers = (viewers) => {
    // Use 'en-US' locale, compact notation, and 0-1 fraction digits
    const formatter = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    });

    return formatter.format(viewers);
  }

  const dynamicStyles = StyleSheet.create({
    plantsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      alignContent: 'flex-start',
      paddingTop: 12,
      paddingHorizontal: 15,
      paddingBottom: 16,
      justifyContent: 'center',
    },
  });

  // Filter streams based on active tab
  const filteredStreams = activeTab === 'recaps' 
    ? liveStreams.filter(stream => stream.status === 'ended' || stream.status === 'live') 
    : liveStreams.filter(stream => stream.status === 'draft');

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <LiveHeader navigation={navigation} />
      <LiveTabs activeTab={activeTab} setActiveTab={setActiveTab} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.plantsContainer, dynamicStyles.plantsContainer]}>
          {filteredStreams.map((stream, index) => (
            <LiveVideoCard 
              navigation={navigation} 
              key={stream.id} 
              stream={stream} 
              cardWidth={166} 
              index={index} 
              totalItems={filteredStreams.length}
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
  scrollView: {
    flex: 1,
  },
  contentContainer: {
    paddingTop: 0,
    paddingBottom: 150,
    minHeight: 812,
  },
  plantsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'flex-start',
    alignContent: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 15,
    paddingBottom: 16,
    justifyContent: 'center',
  },
  videoCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 166,
    height: 312, // Updated to match CSS specifications
    marginBottom: 16,
  },
  videoContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 166,
    height: 264,
    marginBottom: 8, // 8px gap as per CSS
  },
  thumbnailContainer: {
    position: 'relative',
    width: 166,
    height: 264,
  },
  thumbnail: {
    width: 166,
    height: 264,
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
    gap: 8,
    width: 166,
    height: 40,
    left: 0,
    top: 0,
    zIndex: 1,
  },
  bottomOverlay: {
    position: 'absolute',
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    gap: 8,
    width: 166,
    height: 40,
    left: 0,
    top: 224, // 264 - 40 = 224
    zIndex: 2,
  },
  liveStatusLeft: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    gap: 4,
    width: 64,
    height: 24,
    minHeight: 22,
    backgroundColor: '#539461',
    borderRadius: 8,
  },
  emptySpace: {
    width: 64,
    height: 24,
    // Empty space to maintain layout when no live status
  },
  liveStatus: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    gap: 4,
    width: 64,
    height: 24,
    minHeight: 22,
    backgroundColor: '#539461',
    borderRadius: 8,
  },
  liveLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    width: 31,
    height: 20,
  },
  viewersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    gap: 4,
    width: 68,
    height: 24,
    minHeight: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
    borderRadius: 8,
  },
  viewerCount: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    width: 32,
    height: 20,
  },
  dateContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 2,
    paddingHorizontal: 8,
    gap: 4,
    width: 144,
    height: 24,
    minHeight: 24,
    backgroundColor: 'rgba(0, 0, 0, 0.64)',
    borderRadius: 8,
  },
  dateText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
    width: 122,
    height: 20,
  },
  // Title section styles
  titleDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 166,
    height: 40,
  },
  titleContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    width: 166,
    height: 40,
    alignSelf: 'stretch',
  },
  titleText: {
    width: 166,
    height: 40,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '900',
    fontSize: 14,
    lineHeight: 19.6, // 140% of 14px = 19.6px
    color: '#202325',
    flex: 1,
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 13,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginHorizontal: 4,
    alignItems: 'center',
  },
  // Tab styles
  tabsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingTop: 8,
    paddingHorizontal: 15,
    paddingBottom: 0,
    gap: 24,
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#CDD3D4',
    backgroundColor: '#FFFFFF',
  },
  tabsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 24,
    height: 40,
    flex: 1,
  },
  tab: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: 140,
    height: 40,
    minHeight: 40,
  },
  tabContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    width: '100%',
    height: 24,
  },
  tabTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#647276',
    width: '100%',
  },
  activeTabTitle: {
    fontWeight: '500',
    color: '#23C16B',
  },
  tabIndicator: {
    width: 140,
    height: 3,
    maxHeight: 3,
    backgroundColor: '#FFFFFF',
    opacity: 0,
  },
  activeTabIndicator: {
    backgroundColor: '#202325',
    opacity: 1,
  },
});

export default LiveScreen;
