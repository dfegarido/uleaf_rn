import { useIsFocused } from '@react-navigation/native';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, where } from 'firebase/firestore';
import moment from 'moment';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../../firebase';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import TrashIcon from '../../assets/icons/greydark/trash-regular.svg';
import { AuthContext } from '../../auth/AuthProvider';

const ScreenMyPurges = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  const [purges, setPurges] = useState([]);
  const [loading, setLoading] = useState(true);
  const isFocused = useIsFocused();

  useEffect(() => {
    if (!isFocused || !userInfo?.uid) {
      return;
    }

    setLoading(true);
    const liveCollectionRef = collection(db, 'live');
    const q = query(
      liveCollectionRef,
      where('createdBy', '==', userInfo.uid),
      where('liveType', '==', 'purge'),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribe = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedPurges = [];
        querySnapshot.forEach((doc) => {
          fetchedPurges.push({ id: doc.id, ...doc.data() });
        });
        setPurges(fetchedPurges);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching purges:', error);
        setLoading(false);
      },
    );

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [isFocused, userInfo?.uid]);

  const handleCardPress = (item) => {
    // Navigate based on purge status
    if (item.status === 'draft' || item.status === 'live') {
      navigation.navigate('SetUpListingsPurgeScreen', { sessionId: item.sessionId, live: item.status === 'live'});
    } 
    // else if (item.status === 'live') {
    //   navigation.navigate('LivePurgeScreen', { sessionId: item.sessionId });
    // } 
    else {
      // For 'ended' status, you might navigate to a summary screen or show an alert
      alert(`This purge session has ended.`);
    }
  };

  const handleDeletePress = (item) => {
    Alert.alert(
      'Delete Purge',
      `Are you sure you want to delete the purge "${item.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteDoc(doc(db, 'live', item.id));
            } catch (error) {
              console.error('Error deleting purge:', error);
              Alert.alert('Error', 'Could not delete the purge. Please try again.');
            }
            setLoading(false); // setLoading(false) should be inside the onPress
          },
        },
      ],
    );
  };

  const renderItem = ({ item }) => {
    const scheduledDate = item.scheduledAt ? moment(item.scheduledAt.seconds * 1000).format('MMM DD, YYYY hh:mmA') : 'Not scheduled';
    const durationText = item.duration ? `${item.duration} mins` : 'No duration set';

    return (
      <TouchableOpacity style={styles.card} onPress={() => handleCardPress(item)}>
        <ImageBackground
          source={{ uri: item.coverPhotoUrl }}
          style={styles.cardImage}
          imageStyle={{ borderRadius: 8 }}
        >
          <View style={styles.cardOverlay}>
            <View style={[styles.statusBadge, styles[`status_${item.status}`]]}>
              <Text style={styles.statusText}>{item.status}</Text>
            </View>
          </View>
        </ImageBackground>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardDate}>Scheduled for: {scheduledDate}</Text>
          <Text style={styles.cardDate}>Duration: {durationText}</Text>
          <View style={styles.deleteButtonContainer}>
            <TouchableOpacity style={styles.deleteButton} onPress={() => handleDeletePress(item)}>
              <TrashIcon width={16} height={16} />
            </TouchableOpacity>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.screen}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackSolidIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Purges</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateLiveSession', { isPurge: true })}>
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={purges}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>You have not created any purge sessions.</Text>
            </View>
          )
        }
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: '#000' },
  createButtonText: { fontSize: 16, color: '#539461', fontWeight: '600' },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: { padding: 8 },
  card: {
    flex: 1,
    margin: 8,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  cardImage: {
    width: '100%',
    height: 120,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  cardOverlay: {
    padding: 8,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  status_draft: { backgroundColor: '#64748B' },
  status_live: { backgroundColor: '#DC2626' },
  status_ended: { backgroundColor: '#16A34A' },
  statusText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
    textTransform: 'capitalize',
  },
  cardInfo: { padding: 12 },
  cardTitle: { fontWeight: '600', fontSize: 14, color: '#333', marginBottom: 4 },
  cardDate: { color: '#555', fontSize: 12 },
  deleteButtonContainer: {
    position: 'absolute',
    bottom: 8,
    right: 8,
  },
  deleteButton: {
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    padding: 6,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
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
});

export default ScreenMyPurges;
