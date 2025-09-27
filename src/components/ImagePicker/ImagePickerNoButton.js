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

// ✅ Request only CAMERA permission - Android photo picker handles media access without persistent permissions
async function requestCameraPermission() {
  if (Platform.OS !== 'android') return true;

  const granted = await PermissionsAndroid.request(
    PermissionsAndroid.PERMISSIONS.CAMERA,
    {
      title: 'Camera Permission',
      message: 'This app needs access to camera to take photos.',
      buttonNeutral: 'Ask Me Later',
      buttonNegative: 'Cancel',
      buttonPositive: 'OK',
    },
  );

  return granted === PermissionsAndroid.RESULTS.GRANTED;
}

const ImagePickerNoButton = ({
  visible,
  onRequestClose,
  onImagePicked,
  limit = 0,
}) => {
  const handleCamera = async () => {
    const hasPermission = await requestCameraPermission();
    if (!hasPermission) {
      Alert.alert(
        'Permission Denied',
        'Camera access was not granted.',
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
