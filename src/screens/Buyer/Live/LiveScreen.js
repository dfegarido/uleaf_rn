import {
  collection,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  Alert,
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
import { db } from '../../../../firebase';

// Import SVG icons
import AvatarIcon from '../../../assets/images/avatar.svg';
import { globalStyles } from '../../../assets/styles/styles';

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

const LiveHeader = ({navigation}) => {
  const [searchText, setSearchText] = useState('');

  return (
    <View style={styles.header}>
      <View style={{flex: 1}}>
        {/* <InputGroupLeftIcon
          IconLeftComponent={SearchIcon}
          placeholder={'Search ileafU'}
          value={searchText}
          onChangeText={setSearchText}
        /> */}
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
  const [ongoingCount, setOngoingCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      const newDimensions = getScreenDimensions();
      setDimensions(newDimensions);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    const liveCollectionRef = collection(db, 'live');
    
    // Listener for ongoing sessions
    const ongoingQuery = query(liveCollectionRef, where('status', 'in', ['live', 'waiting']));
    const unsubscribeOngoing = onSnapshot(ongoingQuery, (snapshot) => {
      setOngoingCount(snapshot.size);
    });

    // Listener for upcoming (scheduled) sessions
    const upcomingQuery = query(liveCollectionRef, where('status', 'in', ['draft']));
    const unsubscribeUpcoming = onSnapshot(upcomingQuery, (snapshot) => {
      setUpcomingCount(snapshot.size);
    });

    // Cleanup listeners on component unmount
    return () => {
      unsubscribeOngoing();
      unsubscribeUpcoming();
    };
  }, []);

  const goTo = (liveType) => {
    if (liveType === 'ongoing') {
      if (ongoingCount > 0) {
        navigation.navigate('OngoingLiveListScreen');
      } else {
        Alert.alert('There is no ongoing live sale or live purge at this time.');
      }
      
    } else if (liveType === 'upcoming') {
      if (upcomingCount > 0) {
        navigation.navigate('OngoingLiveListScreen');
      } else {
        Alert.alert('There are no upcoming live sales or purges at this time.');
      }
    }
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <LiveHeader navigation={navigation} />
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        <View style={styles.cardContainer}>
          <TouchableOpacity style={styles.card} onPress={() => goTo('ongoing')}>
            <ImageBackground
              source={require('../../../assets/live-icon/ongoing-live.png')}
              style={styles.cardBackground}
              imageStyle={styles.cardImage}>
              {/* <Text style={styles.cardTitle}>Ongoing Live Sale/Purge</Text> */}
              <Text style={styles.cardCount}>{ongoingCount} Live</Text>
            </ImageBackground>
          </TouchableOpacity>

          <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('UpcomingLiveListScreen')}>
            <ImageBackground
              source={require('../../../assets/live-icon/upcoming-live.png')}
              style={styles.cardBackground}
              imageStyle={styles.cardImage}>
              {/* <Text style={styles.cardTitle}>Upcoming Live Sales and Purges</Text> */}
              <Text style={styles.cardCount}>{upcomingCount} Upcoming</Text>
            </ImageBackground>
          </TouchableOpacity>
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
    backgroundColor: '#F5F6F6',
  },
  contentContainer: {
    padding: 20,
  },
  card: {
    width: '100%',
    height: 270,
    borderRadius: 12,
    marginBottom: 20,
    overflow: 'hidden',
  },
  cardBackground: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'flex-start',
    padding: 20,
  },
  cardImage: {
    borderRadius: 12,
    borderStyle: 'solid',
    borderWidth: 1,
    borderColor: '#1f1c1cff'
  },
  cardTitle: {
    ...globalStyles.textXL,
    color: '#FFFFFF',
    fontWeight: 'bold',
    textAlign: 'center',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: {width: -1, height: 1},
    textShadowRadius: 10,
  },
  cardCount: {
    ...globalStyles.textMD,
    color: '#FFFFFF',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
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
