import { collection,
  doc,
  getDoc,
  onSnapshot,
  query,
  where
} from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import { Dimensions,
  ImageBackground,
  ScrollView,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../../firebase';
import { AuthContext } from '../../auth/AuthProvider';

// Import SVG icons
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import { globalStyles } from '../../assets/styles/styles';

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

const LiveSellerScreen = ({navigation}) => {
  const [dimensions, setDimensions] = useState(getScreenDimensions());
  const [ongoingCount, setOngoingCount] = useState(0);
  const [upcomingCount, setUpcomingCount] = useState(0);
  const [liveFlagResolved, setLiveFlagResolved] = useState(null);
  const { userInfo } = useContext(AuthContext);

  const resolvedLiveFlagRaw =
    userInfo?.liveFlag ??
    userInfo?.user?.liveFlag ??
    userInfo?.data?.liveFlag ??
    null;
  const resolvedUid =
    userInfo?.uid ||
    userInfo?.id ||
    userInfo?.user?.uid ||
    userInfo?.user?.id ||
    null;

  const canUseLiveSale =
    typeof liveFlagResolved === 'string' &&
    liveFlagResolved.trim().toLowerCase() === 'yes';

  useEffect(() => {
    const subscription = Dimensions.addEventListener('change', ({window}) => {
      const newDimensions = getScreenDimensions();
      setDimensions(newDimensions);
    });

    return () => subscription?.remove();
  }, []);

  useEffect(() => {
    let cancelled = false;

    const resolveLiveFlag = async () => {
      if (resolvedLiveFlagRaw !== undefined && resolvedLiveFlagRaw !== null) {
        setLiveFlagResolved(resolvedLiveFlagRaw);
        return;
      }

      if (!resolvedUid) {
        setLiveFlagResolved(null);
        return;
      }

      try {
        const supplierSnap = await getDoc(doc(db, 'supplier', resolvedUid));
        if (!cancelled && supplierSnap.exists()) {
          const supplierData = supplierSnap.data();
          setLiveFlagResolved(supplierData?.liveFlag ?? null);
        }
      } catch (e) {
        if (!cancelled) {
          console.warn('[LiveSellerScreen] Failed to resolve liveFlag:', e?.message);
          setLiveFlagResolved(null);
        }
      }
    };

    resolveLiveFlag();
    return () => {
      cancelled = true;
    };
  }, [resolvedLiveFlagRaw, resolvedUid]);

  useEffect(() => {
    // Guard: don't run queries if uid is not available
    if (!resolvedUid) {
      console.log('LiveScreen: uid not available yet, skipping queries');
      return;
    }

    const liveCollectionRef = collection(db, 'live');

    // Listener for ongoing sessions
    const ongoingQuery = query(liveCollectionRef, where('createdBy', '==', resolvedUid), where('liveType', '==', 'live'));
    const unsubscribeOngoing = onSnapshot(ongoingQuery, (snapshot) => {
      setOngoingCount(snapshot.size);
    });

    // Listener for upcoming (scheduled) sessions
    const upcomingQuery = query(liveCollectionRef, where('createdBy', '==', resolvedUid), where('liveType', '==', 'purge'));
    const unsubscribeUpcoming = onSnapshot(upcomingQuery, (snapshot) => {
      setUpcomingCount(snapshot.size);
    });

    // Cleanup listeners on component unmount
    return () => {
      unsubscribeOngoing();
      unsubscribeUpcoming();
    };
  }, [resolvedUid]);


  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackSolidIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Management</Text>
        {/* This empty view is for centering the title */}
        <View style={{ width: 24 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.contentContainer}
        showsVerticalScrollIndicator={false}>
        {canUseLiveSale ? (
          <View style={styles.cardContainer}>
            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('MyLiveSessionsScreen')}>
              <ImageBackground
                source={require('../../assets/live-icon/listLive.png')}
                style={styles.cardBackground}
                imageStyle={styles.cardImage}>
                <Text style={styles.cardCount}>{ongoingCount} Live</Text>
              </ImageBackground>
            </TouchableOpacity>

            <TouchableOpacity style={styles.card} onPress={() => navigation.navigate('ScreenMyPurges')}>
              <ImageBackground
                source={require('../../assets/live-icon/listPurge.png')}
                style={styles.cardBackground}
                imageStyle={styles.cardImage}>
                <Text style={styles.cardCount}>{upcomingCount} Purge</Text>
              </ImageBackground>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.requestContainer}>
            <View style={styles.requestIconCircle}>
              <Text style={styles.requestIconText}>LIVE</Text>
            </View>
            <Text style={styles.requestTitle}>Go Live with iLeafU</Text>
            <Text style={styles.requestDescription}>
              Request permission to host live sales and purge events. Our team will review and approve your request.
            </Text>
            <TouchableOpacity
              style={styles.requestButton}
              onPress={() => navigation.navigate('RequestLiveScreen')}>
              <Text style={styles.requestButtonText}>Request to Go Live</Text>
            </TouchableOpacity>
          </View>
        )}
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
  requestContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  requestIconCircle: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#E8F5E9',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  requestIconText: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#539461',
  },
  requestTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#000',
    marginBottom: 12,
    textAlign: 'center',
  },
  requestDescription: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 22,
  },
  requestButton: {
    backgroundColor: '#539461',
    paddingVertical: 16,
    paddingHorizontal: 32,
    borderRadius: 12,
    width: '100%',
    alignItems: 'center',
  },
  requestButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  // Header styles
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
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

export default LiveSellerScreen;
