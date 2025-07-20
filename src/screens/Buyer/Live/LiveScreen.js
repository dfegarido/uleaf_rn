import React, { useEffect, useState } from 'react';
import {
  Dimensions,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';

// Import SVG icons
import LiveIcon from '../../../assets/iconnav/live.svg';
import SocialIcon from '../../../assets/iconnav/social.svg';
import CalendarWhiteIcon from '../../../assets/buyer-icons/calendar-white.svg';
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

// Mock data for live streams
const liveStreams = [
  {
    id: 1,
    title: 'Monstera Deliciosa Propagation',
    thumbnail: require('../../../assets/images/plant1.png'),
    isLive: true,
    viewers: 1234,
  },
  {
    id: 2,
    title: 'Rare Philodendron Collection',
    thumbnail: require('../../../assets/images/plant2.png'),
    isLive: false,
    viewers: 856,
  },
  {
    id: 3,
    title: 'Fiddle Leaf Fig Care Tips',
    thumbnail: require('../../../assets/images/plant3.png'),
    isLive: false,
    viewers: 423,
  },
  {
    id: 4,
    title: 'Orchid Repotting Guide',
    thumbnail: require('../../../assets/images/plant1.png'),
    isLive: false,
    viewers: 678,
  },
  {
    id: 5,
    title: 'Succulent Arrangements',
    thumbnail: require('../../../assets/images/plant2.png'),
    isLive: false,
    viewers: 234,
  },
  {
    id: 6,
    title: 'Indoor Garden Setup',
    thumbnail: require('../../../assets/images/plant3.png'),
    isLive: false,
    viewers: 567,
  },
  {
    id: 7,
    title: 'Snake Plant Care Workshop',
    thumbnail: require('../../../assets/images/plant1.png'),
    isLive: true,
    viewers: 892,
  },
  {
    id: 8,
    title: 'Pothos Propagation Tips',
    thumbnail: require('../../../assets/images/plant2.png'),
    isLive: true,
    viewers: 1567,
  },
  {
    id: 9,
    title: 'Air Plant Collection Tour',
    thumbnail: require('../../../assets/images/plant3.png'),
    isLive: true,
    viewers: 743,
  },
  {
    id: 10,
    title: 'Calathea Care Secrets',
    thumbnail: require('../../../assets/images/plant1.png'),
    isLive: true,
    viewers: 456,
  },
];

const LiveVideoCard = ({navigation, stream, cardWidth, index, totalItems}) => {
  const formatViewers = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  // Fixed dimensions based on CSS specifications
  const cardHeight = 264; // Fixed height from CSS
  const thumbnailWidth = 166; // Fixed width from CSS
  const thumbnailHeight = 264; // Fixed height from CSS

  // Calculate if this item should be in the left column
  // For 2-column layout: left column items have even indices (0, 2, 4, ...)
  const isLeftColumn = index % 2 === 0;
  
  const cardStyle = {
    width: thumbnailWidth,
    height: cardHeight,
    marginRight: isLeftColumn ? 12 : 0, // 12px gap between columns
    marginBottom: 16,
  };

  return (
    <TouchableOpacity 
      onPress={() => navigation.navigate('BuyerLiveStreamScreen')} 
      style={[styles.videoCard, cardStyle]}
    >
      <View style={styles.thumbnailContainer}>
        <ImageBackground
          source={stream.thumbnail}
          style={[styles.thumbnail, {width: thumbnailWidth, height: thumbnailHeight}]}
          imageStyle={styles.thumbnailImage}
        >
          {/* Status + Viewer overlay at top */}
          <View style={styles.topOverlay}>
            {stream.isLive && (
              <View style={styles.liveStatusLeft}>
                <LiveIcon width={16} height={16} />
                <Text style={styles.liveLabel}>Live</Text>
              </View>
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
                <Text style={styles.dateText}>Dec-15 12:00AM</Text>
              </View>
            </View>
          )}
        </ImageBackground>
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

  const dynamicStyles = StyleSheet.create({
    plantsContainer: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      alignItems: 'flex-start',
      alignContent: 'flex-start',
      paddingHorizontal: 15,
      paddingTop: 12,
      paddingBottom: 16,
      justifyContent: 'center',
    },
  });

  // Filter streams based on active tab
  const filteredStreams = activeTab === 'recaps' 
    ? liveStreams.filter(stream => !stream.isLive) 
    : liveStreams.filter(stream => stream.isLive);

  return (
    <View style={styles.container}>
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
    </View>
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
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 16,
    justifyContent: 'center',
  },
  videoCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 10,
    width: 166,
    height: 264,
    marginBottom: 16,
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
    width: 28,
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
    width: 108,
    height: 20,
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
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#647276',
    width: '100%',
  },
  activeTabTitle: {
    fontWeight: '600',
    color: '#202325',
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
