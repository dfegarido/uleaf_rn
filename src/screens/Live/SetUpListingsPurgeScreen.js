import { useIsFocused } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import React, { useContext, useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../../firebase';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import EditIcon from '../../assets/icons/greydark/note-edit.svg';
import UploadIcon from '../../assets/live-icon/upload.svg';
import { AuthContext } from '../../auth/AuthProvider';
import { getLiveListingsBySessionApi, updateLiveSession, updateLiveSessionStatusApi } from '../../components/Api/agoraLiveApi';
import { InputBox } from '../../components/Input';

const SetUpListingsPurgeScreen = ({navigation, route}) => {
  const {sessionId} = route.params;
  const { userInfo } = useContext(AuthContext);
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();
  const [isLive, setIsLive] = useState(false);
  const [sessionDetails, setSessionDetails] = useState(null);

  // Edit Modal State
  const [isEditModalVisible, setEditModalVisible] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newDuration, setNewDuration] = useState('');
  const [newScheduledAt, setNewScheduledAt] = useState(new Date());
  const [newCoverPhoto, setNewCoverPhoto] = useState(null);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const updateLiveStatus = async (newStatus) => {
    setLoading(true);
    const response = await updateLiveSessionStatusApi(sessionId, newStatus);
      if (response?.success && response?.newStatus === 'live') {
        setIsLive(true);
        setLoading(false);
      } else {
        setIsLive(false);
        setLoading(false);
      }
  }

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

  useEffect(() => {
    if (!sessionId) return;

    const sessionDocRef = doc(db, 'live', sessionId);
    const unsubscribe = onSnapshot(sessionDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSessionDetails(data);
        setNewTitle(data.title);
        setNewDuration(data.duration?.toString() || '');
        if (data.scheduledAt?.toDate) {
          setNewScheduledAt(data.scheduledAt.toDate());
        }
      } else {
        console.log('Session document does not exist.');
      }
    });

    return () => unsubscribe();
  }, [sessionId]);

  useEffect(() => {
    if (isFocused) {
      fetchListings();
    }
  }, [isFocused, sessionId]);


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
    if (!newTitle.trim()) {
      Alert.alert('Missing Title', 'Please enter a title.');
      return;
    }

    setLoading(true);
    try {
      const sessionData = {
        title: newTitle.trim(),
        duration: parseInt(newDuration, 10) || 0,
        scheduledAt: newScheduledAt.toISOString(),
      };

      if (newCoverPhoto) {
        sessionData.coverPhoto = newCoverPhoto.base64;
        sessionData.filename = newCoverPhoto.fileName;
        sessionData.mimeType = newCoverPhoto.type;
      }

      const response = await updateLiveSession(sessionId, sessionData);

      if (response.success) {
        Alert.alert('Success', 'Session details updated.');
        setEditModalVisible(false);
      } else {
        throw new Error(response.message || 'Failed to update session.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  const updateLiveSessionStatus = async (newStatus) => {
    try {
      if (newStatus === 'ended') {
        Alert.alert(
          "End Live Session",
          "Are you sure you want to end the live session?",
          [
            { 
              text: "Yes",
              onPress: () => updateLiveStatus(newStatus)
            },
            { 
              text: "Cancel",
            }
          ]
        );
      } else {
        await updateLiveStatus(newStatus);
      }
    } catch (error) {
      console.error('Error updating live session status:', error);
    }
  }

  const renderItem = ({item}) => (
    <View style={styles.card}>
      <Image source={{uri: item.imagePrimary}} style={styles.cardImage} />
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
        <Text style={styles.headerTitle}>Setup Purge</Text>
        {sessionDetails?.status === 'draft' ? (
          <TouchableOpacity onPress={() => setEditModalVisible(true)}>
            <EditIcon width={24} height={24} />
          </TouchableOpacity>
        ) : <View style={{width: 24}} />}
      </View>

      <View style={styles.container}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() =>
            navigation.navigate('ScreenSingleSellLive', {isPurge:true, sessionId})
          }>
          <Text style={styles.createButtonText}>Create Listing</Text>
        </TouchableOpacity>

        <FlatList
          data={listings}
          renderItem={renderItem}
          keyExtractor={item => item.plantCode}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No listings created for this purge session yet.
            </Text>
          }
          onRefresh={fetchListings}
          refreshing={loading}
        />
      </View>

      <View style={styles.footer}>
        {!isLive && (<TouchableOpacity onPress={() => updateLiveSessionStatus('live')} style={styles.goLiveButton}>
          <Text style={styles.goLiveButtonText}>Go Live</Text>
        </TouchableOpacity>)}
        {isLive && (<TouchableOpacity onPress={() => updateLiveSessionStatus('ended')} style={styles.goLiveButton}>
          <Text style={styles.goLiveButtonText}>End Live</Text>
        </TouchableOpacity>)}
      </View>

      <Modal
        animationType="slide"
        transparent={true}
        visible={isEditModalVisible}
        onRequestClose={() => setEditModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Edit Session</Text>
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

              <Text style={styles.label}>Duration (in minutes)</Text>
              <InputBox
                placeholder="e.g., 60"
                value={newDuration}
                setValue={setNewDuration}
                keyboardType="numeric"
              />

              <Text style={styles.label}>Purge Date & Time</Text>
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
                ) : sessionDetails?.coverPhotoUrl ? (
                  <Image source={{ uri: sessionDetails.coverPhotoUrl }} style={styles.coverImage} />
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
  screen: {flex: 1, backgroundColor: '#fff'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {fontSize: 20, fontWeight: 'bold', color: '#000'},
  container: {flex: 1, padding: 20},
  createButton: {
    backgroundColor: '#414649',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  createButtonText: {color: '#fff', fontSize: 18, fontWeight: 'bold'},
  listContainer: {paddingBottom: 20},
  card: {
    flex: 1,
    margin: 8,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  cardImage: {width: '100%', height: 120},
  cardInfo: {padding: 8},
  cardTitle: {fontWeight: '600', fontSize: 14, color: '#333'},
  cardDetails: {color: '#555', fontSize: 12, marginTop: 2},
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
    alignItems: 'center',
  },
  cardPrice: {fontWeight: 'bold', fontSize: 16, color: '#539461'},
  cardStock: {fontSize: 12, color: '#888'},
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
  footer: {padding: 20, borderTopWidth: 1, borderTopColor: '#E0E0E0'},
  goLiveButton: {
    backgroundColor: '#539461',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  goLiveButtonText: {color: '#fff', fontSize: 18, fontWeight: 'bold'},
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
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
    maxHeight: '100%',
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

export default SetUpListingsPurgeScreen;
