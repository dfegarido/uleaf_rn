import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  ImageBackground,
  TouchableOpacity,
  StatusBar,
  TextInput,
} from 'react-native';

// Import SVG icons
import SearchIcon from '../../../assets/iconnav/search.svg';
import AvatarIcon from '../../../assets/buyer-icons/avatar.svg';
import LiveIcon from '../../../assets/iconnav/live.svg';
import SocialIcon from '../../../assets/iconnav/social.svg';

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
    thumbnail: require('../../../assets/images/wish1.png'),
    isLive: false,
    viewers: 678,
  },
  {
    id: 5,
    title: 'Succulent Arrangements',
    thumbnail: require('../../../assets/images/wish2.png'),
    isLive: false,
    viewers: 234,
  },
  {
    id: 6,
    title: 'Indoor Garden Setup',
    thumbnail: require('../../../assets/images/wish3.png'),
    isLive: false,
    viewers: 567,
  },
];

const LiveVideoCard = ({stream}) => {
  const formatViewers = count => {
    if (count >= 1000) {
      return `${(count / 1000).toFixed(1)}k`;
    }
    return count.toString();
  };

  return (
    <TouchableOpacity style={styles.videoCard}>
      <View style={styles.videoContainer}>
        <ImageBackground
          source={stream.thumbnail}
          style={styles.thumbnail}
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
      <View style={styles.details}>
        <Text style={styles.title} numberOfLines={2}>
          {stream.title}
        </Text>
      </View>
    </TouchableOpacity>
  );
};

const LiveHeader = () => {
  const [searchText, setSearchText] = useState('');

  return (
    <View style={styles.header}>
      <View style={styles.controls}>
        <View style={styles.searchContainer}>
          <View style={styles.searchField}>
            <View style={styles.textField}>
              <SearchIcon width={24} height={24} />
              <TextInput
                style={styles.searchInput}
                placeholder="Search ileafU"
                placeholderTextColor="#647276"
                value={searchText}
                onChangeText={setSearchText}
                multiline={false}
                numberOfLines={1}
              />
            </View>
          </View>
        </View>
        <TouchableOpacity style={styles.profileContainer}>
          <View style={styles.avatar}>
            <AvatarIcon width={32} height={32} />
            <View style={styles.badge}>
              <View style={styles.badgeDot} />
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const LiveScreen = () => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <LiveHeader />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.plantsContainer}>
          {liveStreams.map(stream => (
            <LiveVideoCard key={stream.id} stream={stream} />
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
    gap: 24,
    justifyContent: 'space-between',
  },
  videoCard: {
    width: 166,
    marginBottom: 8,
  },
  videoContainer: {
    width: 166,
    height: 264,
    marginBottom: 10,
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
    width: 166,
    gap: 6,
  },
  title: {
    width: 166,
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
    width: '100%',
    height: 58,
    minHeight: 58,
    backgroundColor: '#FFFFFF',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 10,
    width: '100%',
    height: 58,
  },
  searchContainer: {
    flex: 1,
    height: 40,
  },
  searchField: {
    width: '100%',
    height: 40,
    justifyContent: 'center',
  },
  textField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    textAlignVertical: 'center',
    includeFontPadding: false,
    paddingVertical: 0,
  },
  profileContainer: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 1000,
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -2,
    left: -2,
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  badgeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#E7522F',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
});

export default LiveScreen;
