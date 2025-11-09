import { useIsFocused } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../../firebase';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import {
  addViewerToLiveSession,
  getLiveListingsBySessionApi,
  removeViewerFromLiveSession
} from '../../components/Api/agoraLiveApi';

const LivePurgeScreen = ({navigation, route}) => {
  const {sessionId} = route.params;
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sessionDetails, setSessionDetails] = useState(null);
  const [timeLeft, setTimeLeft] = useState(null);
  const isFocused = useIsFocused();

  const addViewers = async () => {
     await addViewerToLiveSession(sessionId);
  }
  
  const removeViewers = async () => {
    await removeViewerFromLiveSession(sessionId);
  }

  const goBack = async () => {
    await removeViewers();
    navigation.goBack();
  }

  useEffect(() => {
    if (!sessionId || !isFocused) return;

    const sessionDocRef = doc(db, 'live', sessionId);
    const unsubscribe = onSnapshot(sessionDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSessionDetails(data);
        addViewers()
      } else {
        Alert.alert('Error', 'Session not found.', [{ text: 'OK', onPress: () => navigation.goBack() }]);
      }
    });

    return () => unsubscribe();
  }, [sessionId, isFocused, navigation]);

  useEffect(() => {
    if (!sessionDetails || sessionDetails.status !== 'live') return;

    const scheduledAt = sessionDetails.scheduledAt?.toDate();
    const durationInMs = (sessionDetails.duration || 0) * 60 * 1000;

    if (!scheduledAt || durationInMs <= 0) {
      setTimeLeft(0);
      return;
    }

    const endTime = scheduledAt.getTime() + durationInMs;

    const timer = setInterval(() => {
      const now = Date.now();
      const remaining = Math.max(0, endTime - now);
      setTimeLeft(remaining);

      if (remaining === 0) {
        clearInterval(timer);
        Alert.alert('Live Purge Ended', 'This live purge session is now over.', [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [sessionDetails, navigation]);

  useEffect(() => {
    const fetchListings = async () => {
      if (!sessionId) return;
      setLoading(true);
      try {
        const response = await getLiveListingsBySessionApi(sessionId, 'Purge');
        if (response.success) {
          setListings(response.data);
        } else {
          Alert.alert('Error', response.error || 'Failed to fetch listings.');
        }
      } catch (error) {
        Alert.alert('Error', error.message);
      } finally {
        setLoading(false);
      }
    };

    if (isFocused) {
      fetchListings();
    }
  }, [isFocused, sessionId]);

  const formatTime = (milliseconds) => {
    if (milliseconds === null) return '00:00:00';
    const totalSeconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(totalSeconds / 3600).toString().padStart(2, '0');
    const minutes = Math.floor((totalSeconds % 3600) / 60).toString().padStart(2, '0');
    const seconds = (totalSeconds % 60).toString().padStart(2, '0');
    return `${hours}:${minutes}:${seconds}`;
  };

  const renderItem = ({ item }) => (
    <View style={styles.card}>
      <Image source={{ uri: item.imagePrimary }} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.genus} {item.species}
        </Text>
        <Text style={styles.cardDetails}>
          {item.variegation} · {item.potSize}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardPrice}>${item.usdPrice}</Text>
        <Text style={styles.cardStock}>{item.availableQty} pcs</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => goBack()}>
          <BackSolidIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Live Purge</Text>
        <View style={styles.timerContainer}>
          <Text style={styles.timerText}>{formatTime(timeLeft)}</Text>
        </View>
      </View>

      <FlatList
        data={listings}
        renderItem={renderItem}
        keyExtractor={(item) => item.plantCode}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No listings available for this purge.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

export default LivePurgeScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000', flex: 1, textAlign: 'center' },
  timerContainer: {
    backgroundColor: '#DC2626',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
  },
  timerText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  listContainer: { padding: 8 },
  card: {
    flex: 1,
    margin: 8,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  cardImage: { width: '100%', height: 120 },
  cardInfo: { padding: 8 },
  cardTitle: { fontWeight: '600', fontSize: 14, color: '#333' },
  cardDetails: { color: '#555', fontSize: 12, marginTop: 2 },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
    alignItems: 'center',
  },
  cardPrice: { fontWeight: 'bold', fontSize: 16, color: '#539461' },
  cardStock: { fontSize: 12, color: '#888' },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 50,
  },
  emptyText: {
    textAlign: 'center',
    fontSize: 16,
    color: '#888',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
