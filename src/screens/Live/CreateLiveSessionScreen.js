import { useNavigation } from '@react-navigation/native';
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
import { SafeAreaView } from 'react-native-safe-area-context';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import UploadIcon from '../../assets/live-icon/upload.svg';
import { createLiveSession } from '../../components/Api/agoraLiveApi';

const CreateLiveSessionScreen = () => {
  const navigation = useNavigation();
  const [title, setTitle] = useState('');
  const [coverPhoto, setCoverPhoto] = useState(null); // { uri, base64, fileName, type }
  const [isLoading, setIsLoading] = useState(false);

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

  const handleGoLive = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your live stream.');
      return;
    }
    if (!coverPhoto) {
      Alert.alert('Missing Cover Photo', 'Please select a cover photo for your live stream.');
      return;
    }

    setIsLoading(true);
    try {
      const response = await createLiveSession({
        title: title.trim(),
        coverPhoto: coverPhoto.base64,
        filename: coverPhoto.fileName,
        mimeType: coverPhoto.type,
      });

      // Assuming the API returns a channelName or other session details
      // For now, we just navigate on success.
      if (response.success) {
        navigation.navigate('LiveBroadcastScreen', {
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

      <View style={styles.footer}>
        <TouchableOpacity style={styles.goLiveButton} onPress={handleGoLive}>
          <Text style={styles.goLiveButtonText}>Go Live</Text>
        </TouchableOpacity>
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
  goLiveButtonText: { color: '#fff', fontSize: 18, fontWeight: 'bold' },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default CreateLiveSessionScreen;