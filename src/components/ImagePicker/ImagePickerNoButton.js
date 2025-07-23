import React from 'react';
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

const ImagePickerNoButton = ({
  visible,
  onRequestClose,
  onImagePicked,
  limit = 0,
}) => {
  const handleCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Camera or media access was not granted.',
      );
      onRequestClose?.();
      return;
    }

    launchCamera({mediaType: 'photo', quality: 1}, response => {
      onRequestClose?.();
      if (response.didCancel || response.errorCode) return;
      const uri = response.assets?.[0]?.uri;
      onImagePicked([uri]);
    });
  };

  const handleGallery = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
      Alert.alert('Permission Denied', 'Media access was not granted.');
      onRequestClose?.();
      return;
    }

    launchImageLibrary(
      {mediaType: 'photo', selectionLimit: limit},
      response => {
        onRequestClose?.();
        if (response.didCancel || response.errorCode) return;
        const uris = response.assets?.map(asset => asset.uri);
        onImagePicked(uris);
      },
    );
  };

  return (
    <Modal
      animationType="slide"
      transparent
      visible={visible}
      onRequestClose={onRequestClose}>
      <TouchableOpacity
        style={styles.modalOverlay}
        activeOpacity={1}
        onPressOut={onRequestClose}>
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
          <TouchableOpacity onPress={onRequestClose}>
            <Text style={styles.cancelText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </TouchableOpacity>
    </Modal>
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

export default ImagePickerNoButton;
