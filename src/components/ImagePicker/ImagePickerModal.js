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
import {globalStyles} from '../../assets/styles/styles';

// ✅ Platform-aware, version-safe permission request
async function requestPermissions() {
  if (Platform.OS !== 'android') return true;

  const sdkInt = parseInt(Platform.Version, 10);
  const permissions = [PermissionsAndroid.PERMISSIONS.CAMERA];

  if (sdkInt < 33) {
    permissions.push(PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE);
  }
  // For Android 13+ (API 33+), we'll rely on the built-in photo picker which doesn't need READ_MEDIA_IMAGES

  const granted = await PermissionsAndroid.requestMultiple(permissions);

  const allGranted = Object.values(granted).every(
    result => result === PermissionsAndroid.RESULTS.GRANTED,
  );

  return allGranted;
}

const ImagePickerModal = ({onImagePicked, limit = 0}) => {
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

    launchCamera({mediaType: 'photo', quality: 1}, response => {
      setModalVisible(false);
      if (response.didCancel || response.errorCode) return;
      const uri = response.assets?.[0]?.uri;
      onImagePicked([uri]);
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
        selectionLimit: limit, // ✅ use the provided limit (0 means unlimited)
      },
      response => {
        setModalVisible(false);
        if (response.didCancel || response.errorCode) return;
        const uris = response.assets?.map(asset => asset.uri);
        onImagePicked(uris);
      },
    );
  };

  return (
    <View>
      <TouchableOpacity
        style={[globalStyles.secondaryButton]}
        onPress={() => setModalVisible(true)}>
        <View>
          <Text style={[globalStyles.textMDGreyLight, {textAlign: 'center'}]}>
            {/* Add picture{limit > 0 ? 's' : ''} */}
            Add picture
          </Text>
        </View>
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
              <Text style={[styles.optionText, globalStyles.textMDGreyDark]}>
                📷 Take Photo
              </Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={handleGallery}>
              <Text style={[styles.optionText, globalStyles.textMDGreyDark]}>
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
