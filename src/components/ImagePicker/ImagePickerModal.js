import React, {useState} from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Platform,
  PermissionsAndroid,
} from 'react-native';
import {launchCamera, launchImageLibrary} from 'react-native-image-picker';
import {globalStyles} from '../../assets/styles/styles';

// 🔐 Request permissions only on Android
async function requestPermissions() {
  if (Platform.OS === 'android') {
    const cameraPermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.CAMERA,
    );

    const storagePermission = await PermissionsAndroid.request(
      PermissionsAndroid.PERMISSIONS.READ_EXTERNAL_STORAGE,
    );

    return (
      cameraPermission === PermissionsAndroid.RESULTS.GRANTED &&
      storagePermission === PermissionsAndroid.RESULTS.GRANTED
    );
  }
  return true; // iOS doesn't require runtime permission here
}

const ImagePickerModal = ({onImagePicked}) => {
  const [modalVisible, setModalVisible] = useState(false);

  const handleCamera = async () => {
    const hasPermission = await requestPermissions();
    if (!hasPermission) {
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

  const handleGallery = () => {
    launchImageLibrary(
      {
        mediaType: 'photo',
        selectionLimit: 0,
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
            Add picture(s)
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
              <Text style={styles.optionText}>📷 Take Photo</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.option} onPress={handleGallery}>
              <Text style={styles.optionText}>🖼️ Choose from Library</Text>
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
    fontSize: 18,
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
