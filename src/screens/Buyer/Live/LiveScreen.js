import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
  TextInput,
  Dimensions,
} from 'react-native';

// Import SVG icons
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import AvatarIcon from '../../../assets/images/avatar.svg';
import LiveIcon from '../../../assets/iconnav/live.svg';
import SocialIcon from '../../../assets/iconnav/social.svg';
import {InputGroupLeftIcon} from '../../../components/InputGroup/Left';

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
  
  return {screenWidth, HORIZONTAL_PADDING, GAP, CARD_WIDTH: cardWidth, availableWidth};
};

// Initialize with current dimensions
let {screenWidth, HORIZONTAL_PADDING, GAP, CARD_WIDTH, availableWidth} = getScreenDimensions();

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
];

const LiveVideoCard = ({stream, cardWidth, index}) => {
  const formatViewers = (count) => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  const cardHeight = cardWidth * 1.6; // Maintain aspect ratio
  
  // Add right margin only to left column items (even indices)
  const isLeftColumn = index % 2 === 0;
  const cardStyle = {
    width: cardWidth,
    marginRight: isLeftColumn ? GAP : 0,
    marginBottom: 16,
  };

  return (
    <TouchableOpacity style={[styles.videoCard, cardStyle]}>
      <View style={[styles.videoContainer, {width: cardWidth, height: cardHeight}]}>
        <ImageBackground
          source={stream.thumbnail}
          style={[styles.thumbnail, {width: cardWidth, height: cardHeight}]}
          imageStyle={styles.thumbnailImage}>
          <View style={styles.overlay}>
            {stream.isLive && (
              <View style={styles.liveStatus}>
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
        </ImageBackground>
      </View>
      <View style={[styles.details, {width: cardWidth}]}>
        <Text style={[styles.title, {width: cardWidth}]} numberOfLines={2}>
          {stream.title}
        </Text>
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
          placeholder={'Search I Leaf U'}
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

const LiveScreen = ({navigation}) => {
  const [dimensions, setDimensions] = useState(getScreenDimensions());

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
    videoCard: {
      width: dimensions.CARD_WIDTH,
      marginBottom: 8,
    },
    videoContainer: {
      width: dimensions.CARD_WIDTH,
      height: dimensions.CARD_WIDTH * 1.6,
      marginBottom: 10,
    },
    thumbnail: {
      width: dimensions.CARD_WIDTH,
      height: dimensions.CARD_WIDTH * 1.6,
      borderRadius: 12,
      overflow: 'hidden',
    },
  });

  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <LiveHeader navigation={navigation} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={[styles.plantsContainer, dynamicStyles.plantsContainer]}>
          {liveStreams.map((stream, index) => (
            <LiveVideoCard key={stream.id} stream={stream} cardWidth={dimensions.CARD_WIDTH} index={index} />
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
    marginBottom: 8,
  },
  videoContainer: {
    marginBottom: 10,
  },
  thumbnail: {
    borderRadius: 12,
    overflow: 'hidden',
  },
  thumbnailImage: {
    borderRadius: 12,
    backgroundColor: '#F5F5F5',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 8,
    gap: 8,
    height: 40,
  },
  liveStatus: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
    backgroundColor: '#539461',
    borderRadius: 8,
    minHeight: 24,
  },
  liveLabel: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  viewersContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    gap: 4,
    backgroundColor: 'rgba(32, 35, 37, 0.6)',
    borderRadius: 8,
    minHeight: 24,
  },
  viewerCount: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  details: {
    gap: 6,
  },
  title: {
    height: 40,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20, // 140% of 14px
    color: '#202325',
    flexGrow: 1,
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
});

export default LiveScreen;
