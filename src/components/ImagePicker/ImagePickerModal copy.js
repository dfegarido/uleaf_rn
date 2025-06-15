import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PermissionsAndroid,
  Alert,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import ImageResizer from '@bam.tech/react-native-image-resizer';
import RNFS from 'react-native-fs';
import {globalStyles} from '../../assets/styles/styles';

const MAX_SIZE_MB = 2;
const MAX_FILE_SIZE = MAX_SIZE_MB * 1024 * 1024;

// 🔁 Convert to PNG and resize under 2MB
const processImageAsset = async asset => {
  try {
    const {uri, fileName, type, width, height} = asset;

    let format = 'PNG';
    let resized = await ImageResizer.createResizedImage(
      uri,
      width,
      height,
      format,
      100,
      0,
    );

    let fileStat = await RNFS.stat(resized.uri);
    while (fileStat.size > MAX_FILE_SIZE) {
      const scaleFactor = Math.sqrt(MAX_FILE_SIZE / fileStat.size);
      const newWidth = Math.floor(resized.width * scaleFactor);
      const newHeight = Math.floor(resized.height * scaleFactor);

      resized = await ImageResizer.createResizedImage(
        resized.uri,
        newWidth,
        newHeight,
        format,
        100,
        0,
      );
      fileStat = await RNFS.stat(resized.uri);
    }

    return resized.uri;
  } catch (error) {
    console.error('Image processing error:', error);
    return null;
  }
};

// 🛂 Permission handling
async function requestPermissions() {
  if (Platform.OS !== 'android') return true;

  const sdkInt = parseInt(Platform.Version, 10);
  const permissions = [PermissionsAndroid.PERMISSIONS.CAMERA];

  if (sdkInt >= 33) {
    permissions.push(PermissionsAndroid.PERMISSIONS.READ_MEDIA_IMAGES);
  } else {
    permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
  }

  const granted = await PermissionsAndroid.requestMultiple(permissions);

  return Object.values(granted).every(
    result => result === PermissionsAndroid.RESULTS.GRANTED,
  );
}

const ImagePickerModal = ({onImagePicked}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Camera or media access was not granted.',
      );
      setModalVisible(false);
      return;
    }

    launchCamera({mediaType: 'photo', quality: 1}, async response => {
      setModalVisible(false);
      if (response.didCancel || response.errorCode) return;
      const asset = response.assets?.[0];
      const processedUri = await processImageAsset(asset);
      if (processedUri) {
        onImagePicked([processedUri]);
      }
    });
  };

  const handleGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Media access was not granted.');
      setModalVisible(false);
      return;
    }

    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 0, // 0 = unlimited
      },
      async response => {
        setModalVisible(false);
        if (response.didCancel || response.errorCode) return;

        const assets = response.assets || [];
        const processedUris = [];

        for (const asset of assets) {
          const processedUri = await processImageAsset(asset);
          if (processedUri) processedUris.push(processedUri);
        }

        onImagePicked(processedUris);
      },
    );
  };

  return (
    <View>
      <TouchableOpacity
        style={[globalStyles.secondaryButton]}
        onPress={() => setModalVisible(true)}>
        <Text style={[globalStyles.textMDGreyLight, {textAlign: 'center'}]}>
          Add picture(s)
        </Text>
      </TouchableOpacity>

      <Modal
        animationType="slide"
        transparent
        visible={modalVisible}
        onRequestClose={() => setModalVisible(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPressOut={() => setModalVisible(false)}>
          <View style={styles.modalContainer}>
            <TouchableOpacity style={styles.option} onPress={handleCamera}>
              <Text style={[styles.optionText, globalStyles.textMDAccentDark]}>
                📷 Take Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={handleGallery}>
              <Text style={[styles.optionText, globalStyles.textMDAccentDark]}>
                🖼️ Choose from Library
              </Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => setModalVisible(false)}>
              <Text style={styles.cancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: '#00000055',
  },
  modalContainer: {
    backgroundColor: '#fff',
    padding: 20,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
  },
  option: {
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  optionText: {
    textAlign: 'center',
  },
  cancelText: {
    marginTop: 15,
    fontSize: 16,
    color: 'red',
    textAlign: 'center',
  },
});

export default ImagePickerModal;
