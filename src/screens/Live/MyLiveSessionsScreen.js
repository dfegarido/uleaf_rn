import { useIsFocused } from '@react-navigation/native';
import { collection, deleteDoc, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import moment from 'moment';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  FlatList,
  Image,
  ImageBackground,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../../firebase';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import EditIcon from '../../assets/icons/greydark/note-edit.svg';
import TrashIcon from '../../assets/icons/greydark/trash-regular.svg';
import UploadIcon from '../../assets/live-icon/upload.svg';
import { AuthContext } from '../../auth/AuthProvider';
import { updateLiveSession } from '../../components/Api/agoraLiveApi';
import { InputBox } from '../../components/Input';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const CARD_MARGIN = 8;
const CARD_WIDTH = (SCREEN_WIDTH - CARD_MARGIN * 6) / 2;

// Skeleton Card Component
const SkeletonCard = () => {
  const shimmerAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const animation = Animated.loop(
      Animated.sequence([
        Animated.timing(shimmerAnim, {
          toValue: 1,
          duration: 1000,
          useNativeDriver: true,
        }),
        Animated.timing(shimmerAnim, {
          toValue: 0,
          duration: 1000,
          useNativeDriver: true,
        }),
      ])
    );
    animation.start();

    return () => {
      animation.stop();
    };
  }, [shimmerAnim]);

  const opacity = shimmerAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0.3, 0.7],
  });

  return (
    <View style={styles.card}>
      <Animated.View style={[styles.skeletonImage, { opacity }]} />
      <View style={styles.cardInfo}>
        <Animated.View style={[styles.skeletonTitle, { opacity }]} />
        <Animated.View style={[styles.skeletonDate, { opacity }]} />
      </View>
    </View>
  );
};

const MyLiveSessionsScreen = ({ navigation }) => {
  const { userInfo } = useContext(AuthContext);
  const [sessions, setSessions] = useState([]);
  const [pendingRequests, setPendingRequests] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false); // For delete/save actions
  const isFocused = useIsFocused();
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [selectedSession, setSelectedSession] = useState(null);
  const [newTitle, setNewTitle] = useState('');
  const [newScheduledAt, setNewScheduledAt] = useState(new Date());
  const [newCoverPhoto, setNewCoverPhoto] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  useEffect(() => {
    // Extract uid properly (handles nested structure for suppliers)
    const uid = userInfo?.uid || userInfo?.id || userInfo?.user?.uid || userInfo?.user?.id;

    if (!isFocused || !uid) {
      return;
    }

    setLoading(true);
    const liveCollectionRef = collection(db, 'live');
    const q = query(
      liveCollectionRef,
      where('createdBy', '==', uid),
      where('liveType', '==', 'live'),
      orderBy('createdAt', 'desc'),
    );

    const unsubscribeLive = onSnapshot(
      q,
      (querySnapshot) => {
        const fetchedSessions = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status !== 'ended') {
            fetchedSessions.push({ id: doc.id, ...data });
          }
        });
        setSessions(fetchedSessions);
      },
      (error) => {
        console.error('Error fetching live sessions:', error);
      },
    );

    // Also listen for live requests (pending + approved)
    const requestsRef = collection(db, 'liveRequests');
    const qRequests = query(
      requestsRef,
      where('sellerUid', '==', uid),
      orderBy('requestedAt', 'desc'),
    );

    const unsubscribeRequests = onSnapshot(
      qRequests,
      (querySnapshot) => {
        const fetchedPending = [];
        querySnapshot.forEach((doc) => {
          const data = doc.data();
          if (data.status === 'pending' || data.status === 'approved' || data.status === 'rejected') {
            fetchedPending.push({ id: doc.id, ...data, _isPendingRequest: true });
          }
        });
        setPendingRequests(fetchedPending);
        setLoading(false);
      },
      (error) => {
        console.error('Error fetching pending live requests:', error);
        setLoading(false);
      },
    );

    // Cleanup listeners on component unmount
    return () => {
      unsubscribeLive();
      unsubscribeRequests();
    };
  }, [isFocused, userInfo?.uid, userInfo?.id, userInfo?.user?.uid, userInfo?.user?.id]);

  const handleCardPress = (item) => {
    if (item._isPendingRequest) {
      Alert.alert('Pending Approval', 'This live session is awaiting admin approval. You will be able to broadcast once it is approved.');
      return;
    }
    // Navigate based on session status
    if (item.status === 'draft' || item.status === 'live' || item.status === 'waiting') {
      navigation.navigate('LiveBroadcastScreen', { sessionId: item.sessionId });
    } else {
      // For 'ended' status, you might navigate to a summary screen or show an alert
      alert(`This live session has ended.`);
    }
  };

  const handleEditPress = (item) => {
    setSelectedSession(item);
    setNewTitle(item.title);
    if (item._isPendingRequest) {
      if (item.requestedDate?.seconds) {
        setNewScheduledAt(new Date(item.requestedDate.seconds * 1000));
      } else {
        setNewScheduledAt(new Date());
      }
    } else {
      if (item.scheduledAt?.seconds) {
        setNewScheduledAt(new Date(item.scheduledAt.seconds * 1000));
      } else {
        setNewScheduledAt(new Date());
      }
    }
    setNewCoverPhoto(null); // Reset photo on each open
    setEditModalVisible(true);
  };

  const handleDeletePress = (item) => {
    const isRequest = item._isPendingRequest;
    Alert.alert(
      isRequest ? 'Delete Request' : 'Delete Session',
      `Are you sure you want to delete the ${isRequest ? 'request' : 'session'} "${item.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setActionLoading(true);
            try {
              if (isRequest) {
                await deleteDoc(doc(db, 'liveRequests', item.id));
              } else {
                await deleteDoc(doc(db, 'live', item.id));
              }
            } catch (error) {
              console.error(`Error deleting ${isRequest ? 'request' : 'session'}:`, error);
              Alert.alert('Error', `Could not delete the ${isRequest ? 'request' : 'session'}. Please try again.`);
            } finally {
              setActionLoading(false);
            }
          },
        },
      ],
    );
  };

  const handleChoosePhoto = () => {
    launchImageLibrary(
      { mediaType: 'photo', includeBase64: true, quality: 0.5 },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          Alert.alert('Error', 'Could not select image. Please try again.');
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setNewCoverPhoto({
            uri: asset.uri,
            base64: `data:${asset.type};base64,${asset.base64}`,
            fileName: asset.fileName,
            type: asset.type,
          });
        }
      },
    );
  };

  const handleSaveChanges = async () => {
    if (!selectedSession) {
      return;
    }

    setActionLoading(true);
    try {
      if (selectedSession._isPendingRequest) {
        // Editing a live request
        if (!newTitle.trim()) {
          Alert.alert('Missing Title', 'Please enter a title.');
          setActionLoading(false);
          return;
        }

        const updates = {
          title: newTitle.trim(),
          requestedDate: newScheduledAt,
        };

        // Update sessionData cover photo if changed
        if (newCoverPhoto) {
          updates.sessionData = {
            ...(selectedSession.sessionData || {}),
            coverPhoto: newCoverPhoto.base64,
            filename: newCoverPhoto.fileName,
            mimeType: newCoverPhoto.type,
          };
        }

        // If approved and anything changed, revert to pending for re-approval
        if (selectedSession.status === 'approved') {
          updates.status = 'pending';
          updates.reviewedAt = null;
          updates.reviewedBy = null;
          updates.rejectionReason = null;
          updates.liveSessionId = null;
        }

        await updateDoc(doc(db, 'liveRequests', selectedSession.id), updates);
        Alert.alert(
          'Success',
          selectedSession.status === 'approved'
            ? 'Request updated and sent back for admin approval.'
            : 'Request updated successfully.'
        );
        setEditModalVisible(false);
      } else {
        // Editing a live session — existing behavior
        if (!newTitle.trim()) {
          Alert.alert('Missing Title', 'Please enter a title.');
          setActionLoading(false);
          return;
        }

        const sessionData = {
          title: newTitle.trim(),
          scheduledAt: newScheduledAt.toISOString(),
        };

        if (newCoverPhoto) {
          sessionData.coverPhoto = newCoverPhoto.base64;
          sessionData.filename = newCoverPhoto.fileName;
          sessionData.mimeType = newCoverPhoto.type;
        }

        await updateLiveSession(selectedSession.id, sessionData);
        Alert.alert('Success', 'Session details updated.');
        setEditModalVisible(false);
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setActionLoading(false);
    }
  };

  const renderItem = ({ item }) => {
    const isPending = item._isPendingRequest;
    const scheduledDate = isPending
      ? (item.requestedDate ? moment(item.requestedDate.seconds * 1000).format('MMM DD, YYYY hh:mmA') : 'Not scheduled')
      : (item.scheduledAt ? moment(item.scheduledAt.seconds * 1000).format('MMM DD, YYYY hh:mmA') : 'Not scheduled');
    const requestStatusText = isPending
      ? (item.status === 'pending' ? 'Pending'
        : item.status === 'approved' ? 'Approved'
        : item.status === 'rejected' ? 'Rejected'
        : item.status)
      : null;
    const displayStatus = isPending ? requestStatusText : item.status;
    const requestBadgeStyle = isPending
      ? (item.status === 'pending' ? styles.status_pending
        : item.status === 'approved' ? styles.status_approved
        : item.status === 'rejected' ? styles.status_rejected
        : styles.status_draft)
      : null;
    const badgeStyle = isPending ? requestBadgeStyle : (styles[`status_${item.status}`] || styles.status_draft);
    const coverPhotoUri = isPending
      ? (item.sessionData?.coverPhoto ? item.sessionData.coverPhoto : null)
      : item.coverPhotoUrl;

    return (
      <TouchableOpacity style={[styles.card, isPending && styles.cardPending]} onPress={() => handleCardPress(item)}>
        <ImageBackground
          source={{ uri: coverPhotoUri }}
          style={styles.cardImage}
          imageStyle={{ borderRadius: 8 }}
        >
          <View style={styles.cardOverlay}>
            <View style={[styles.statusBadge, badgeStyle]}>
              <Text style={styles.statusText}>{displayStatus}</Text>
            </View>
          </View>
        </ImageBackground>
        <View style={styles.cardInfo}>
          <Text style={styles.cardTitle} numberOfLines={1}>
            {item.title}
          </Text>
          <Text style={styles.cardDate}>Scheduled for: {scheduledDate}</Text>
          <View style={styles.deleteButtonContainer}>
            <TouchableOpacity style={styles.deleteButton} onPress={(e) => { e.stopPropagation(); handleEditPress(item);}}>
              <EditIcon width={16} height={16} />
            </TouchableOpacity>
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
      {actionLoading && (
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
        <Text style={styles.headerTitle}>My Live Sessions</Text>
        <TouchableOpacity onPress={() => navigation.navigate('CreateLiveSession', { isPurge: false })}>
          <Text style={styles.createButtonText}>Create</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={loading ? [{ id: 'skeleton-1' }, { id: 'skeleton-2' }, { id: 'skeleton-3' }, { id: 'skeleton-4' }] : [...sessions, ...pendingRequests]}
        renderItem={loading ? () => <SkeletonCard /> : renderItem}
        keyExtractor={(item) => item.id}
        numColumns={2}
        contentContainerStyle={styles.listContainer}
        ListEmptyComponent={
          !loading && sessions.length === 0 && pendingRequests.length === 0 && (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>You have not created any live sessions.</Text>
            </View>
          )
        }
      />

      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>{selectedSession?._isPendingRequest ? 'Edit Request' : 'Edit Session'}</Text>
              <TouchableOpacity onPress={() => setEditModalVisible(false)}>
                <BackSolidIcon />
              </TouchableOpacity>
            </View>
            <View style={styles.modalContent}>
              <Text style={styles.label}>Title</Text>
              <InputBox
                placeholder="Enter a catchy title"
                value={newTitle}
                setValue={setNewTitle}
              />

              <Text style={styles.label}>{selectedSession?._isPendingRequest ? 'Requested Date & Time' : 'Live Date & Time'}</Text>
              <TouchableOpacity onPress={() => setDatePickerVisibility(true)} style={styles.input}>
                <Text style={{color: '#000'}}>{newScheduledAt.toLocaleString()}</Text>
              </TouchableOpacity>

              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="datetime"
                onConfirm={(date) => {
                  setNewScheduledAt(date);
                  setDatePickerVisibility(false);
                }}
                onCancel={() => setDatePickerVisibility(false)}
                date={newScheduledAt}
                minimumDate={new Date()}
              />

              <Text style={styles.label}>Cover Photo</Text>
              <TouchableOpacity style={styles.imagePicker} onPress={handleChoosePhoto}>
                {newCoverPhoto ? (
                  <Image source={{ uri: newCoverPhoto.uri }} style={styles.coverImage} />
                ) : selectedSession?.coverPhotoUrl ? (
                  <Image source={{ uri: selectedSession.coverPhotoUrl }} style={styles.coverImage} />
                ) : selectedSession?.sessionData?.coverPhoto ? (
                  <Image source={{ uri: selectedSession.sessionData.coverPhoto }} style={styles.coverImage} />
                ) : (
                  <>
                    <UploadIcon width={48} height={48} />
                    <Text style={styles.imagePickerText}>Upload New Cover Photo</Text>
                  </>
                )}
              </TouchableOpacity>

              <TouchableOpacity style={styles.saveButton} onPress={handleSaveChanges}>
                <Text style={styles.saveButtonText}>Save Changes</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

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
  listContainer: { padding: CARD_MARGIN },
  card: {
    width: CARD_WIDTH,
    margin: CARD_MARGIN,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 1.41,
  },
  cardPending: {
    opacity: 0.85,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  // Skeleton styles
  skeletonImage: {
    width: '100%',
    height: 120,
    backgroundColor: '#E0E0E0',
    borderTopLeftRadius: 8,
    borderTopRightRadius: 8,
  },
  skeletonTitle: {
    width: '80%',
    height: 16,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
    marginBottom: 8,
  },
  skeletonDate: {
    width: '60%',
    height: 14,
    backgroundColor: '#E0E0E0',
    borderRadius: 4,
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
  status_pending: { backgroundColor: '#F59E0B' },
  status_approved: { backgroundColor: '#539461' },
  status_rejected: { backgroundColor: '#E7522F' },
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
    top: -113,
    left: 8,
    flexDirection: 'row',
    gap: 8,
  },
  deleteButton: {
    backgroundColor: '#FFFFFF',
    padding: 6,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E0E0E0',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.15,
    shadowRadius: 2,
    elevation: 3,
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
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 0,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row-reverse',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  modalContent: {
    padding: 20,
  },
  label: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
    marginTop: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 16,
    color: '#000',
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
    marginBottom: 20,
  },
  imagePickerText: { fontSize: 16, color: '#555', marginTop: 12 },
  coverImage: { width: '100%', height: '100%', borderRadius: 6 },
  saveButton: { backgroundColor: '#539461', padding: 16, borderRadius: 12, alignItems: 'center' },
  saveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
});

export default MyLiveSessionsScreen;