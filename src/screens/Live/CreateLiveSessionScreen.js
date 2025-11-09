import React, { useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Modal,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { launchImageLibrary } from 'react-native-image-picker';
import DateTimePickerModal from "react-native-modal-datetime-picker";
import { SafeAreaView } from 'react-native-safe-area-context';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import UploadIcon from '../../assets/live-icon/upload.svg';
import { createLiveSession } from '../../components/Api/agoraLiveApi';

const CreateLiveSessionScreen = ({navigation, route}) => {
  const [title, setTitle] = useState('');
  const [duration, setDuration] = useState('');
  const [coverPhoto, setCoverPhoto] = useState(null); // { uri, base64, fileName, type }
  const [isLoading, setIsLoading] = useState(false);
  const { isPurge=false } = route.params;

  // State for date and time picker
  const [purgeDateTime, setPurgeDateTime] = useState(new Date());
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);


  const handleChoosePhoto = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        includeBase64: true,
        quality: 0.5,
      },
      (response) => {
        if (response.didCancel) {
          console.log('User cancelled image picker');
        } else if (response.errorCode) {
          console.log('ImagePicker Error: ', response.errorMessage);
          Alert.alert('Error', 'Could not select image. Please try again.');
        } else if (response.assets && response.assets.length > 0) {
          const asset = response.assets[0];
          setCoverPhoto({
            uri: asset.uri,
            base64: `data:${asset.type};base64,${asset.base64}`,
            fileName: asset.fileName,
            type: asset.type,
          });
        }
      },
    );
  };

  const showDatePicker = () => {
    setDatePickerVisibility(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisibility(false);
  };

  const handleConfirmDate = (date) => {
    console.log("A date has been picked: ", date);
    setPurgeDateTime(date);
    hideDatePicker();
  };

  const handleGoLive = async (liveType) => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your live stream.');
      return;
    }
    if (!coverPhoto) {
      Alert.alert('Missing Cover Photo', 'Please select a cover photo for your live stream.');
      return;
    }

    if (isPurge && !duration) {
      Alert.alert('Missing Duration', 'Please enter a duration for your live stream.');
      return;
    }

    if (isPurge && purgeDateTime <= new Date()) {
      Alert.alert('Invalid Date', 'Please select a future date and time for the purge.');
      return;
    }

    setIsLoading(true);
    try {
      const sessionData = {
        title: title.trim(),
        coverPhoto: coverPhoto.base64,
        filename: coverPhoto.fileName,
        mimeType: coverPhoto.type,
        liveType,
        duration: parseInt(duration, 10) || 0, // Add duration in minutes
      };

      if (isPurge) {
        sessionData.scheduledAt = purgeDateTime.toISOString();
      }
      console.log('purgeDateTime.toISOString()', purgeDateTime.toISOString());
      
      const response = await createLiveSession(sessionData);

      // Assuming the API returns a channelName or other session details
      // For now, we just navigate on success.
      if (response.success) {
        navigation.replace(liveType === 'purge' ? 'SetUpListingsPurgeScreen' : 'LiveBroadcastScreen', {
          sessionId: response.sessionId,
        });
      } else {
        throw new Error(response.message || 'Failed to create live session.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      {isLoading && (
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
        <Text style={styles.headerTitle}>Go Live</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.container}>
        <Text style={styles.label}>Live Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter a catchy title"
          placeholderTextColor="#000"
          value={title}
          onChangeText={setTitle}
        />


        {isPurge && (<>
          <Text style={styles.label}>Duration (in minutes)</Text>
          <TextInput
            style={styles.input}
            placeholder="e.g., 60"
            placeholderTextColor="#888"
            value={duration}
            onChangeText={setDuration}
            keyboardType="numeric"
          />
        </>)}
        
      {isPurge && (
       <>
          <Text style={styles.label}>Purge Date & Time</Text>
          <TouchableOpacity onPress={showDatePicker} style={styles.input}>
              <Text style={{color: '#000'}}>{purgeDateTime.toLocaleString()}</Text>
          </TouchableOpacity>
       </>
      )}

      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="datetime"
        onConfirm={handleConfirmDate}
        onCancel={hideDatePicker}
        date={purgeDateTime}
        minimumDate={new Date()}
      />

        <Text style={styles.label}>Cover Photo</Text>
        <TouchableOpacity style={styles.imagePicker} onPress={handleChoosePhoto}>
          {coverPhoto ? (
            <Image source={{ uri: coverPhoto.uri }} style={styles.coverImage} />
          ) : (
            <>
              <UploadIcon width={48} height={48} />
              <Text style={styles.imagePickerText}>Upload Cover Photo</Text>
              <Text style={styles.imagePickerSubText}>Tap to select an image</Text>
            </>
          )}
        </TouchableOpacity>
      </View>

      <View style={{flex: 1}} />

      <View style={styles.footer}>
        {!isPurge && (<TouchableOpacity style={styles.goLiveButton} onPress={() => handleGoLive('live')}>
          <Text style={styles.goLiveButtonText}>Setup Live</Text>
        </TouchableOpacity>)}

        {isPurge && (<TouchableOpacity style={styles.goLiveButton} onPress={() => handleGoLive('purge')}>
          <Text style={styles.goLiveButtonText}>Setup Live Purge</Text>
        </TouchableOpacity>)}
      </View>
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
  headerTitle: { fontSize: 20, fontWeight: 'bold' },
  container: { flex: 1, padding: 20 },
  label: { fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8 },
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
    color: '#000',
  },
  imagePicker: {
    borderWidth: 2,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 8,
    height: 200,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  imagePickerText: { fontSize: 16, color: '#555', marginTop: 12 },
  imagePickerSubText: { fontSize: 14, color: '#999', marginTop: 4 },
  coverImage: { width: '100%', height: '100%', borderRadius: 6 },
  footer: { padding: 20, borderTopWidth: 1, borderTopColor: '#E0E0E0' },
  goLiveButton: {
    backgroundColor: '#539461',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  goLivePurgeButton: {
    backgroundColor: '#539461',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginTop: 10
  },
  goLiveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CreateLiveSessionScreen;