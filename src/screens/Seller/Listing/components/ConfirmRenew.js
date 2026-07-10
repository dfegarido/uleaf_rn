import React from 'react';
import { Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const {width} = Dimensions.get('window');

const ConfirmRenew = ({
  visible,
  onUpdatePictures,
  onCancel,
}) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.contentContainer}>
            <Text style={styles.title}>Renew expired listing?</Text>

            <Text style={styles.message}>
              To renew this listing, update the photos first. Fresh pictures help buyers trust the listing.
            </Text>

            <TouchableOpacity
              style={styles.confirmButton}
              onPress={onUpdatePictures}>
              <Text style={styles.confirmText}>Update pictures & renew</Text>
            </TouchableOpacity>
          </View>
          <View style={[styles.contentContainer, {marginTop: 10}]}>
            <TouchableOpacity style={styles.cancelButton} onPress={onCancel}>
              <Text style={styles.cancelText}>Back</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

export default ConfirmRenew;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
  },
  contentContainer: {
    backgroundColor: '#fff',
    width: '100%',
    paddingVertical: 10,
    borderRadius: 16,
  },
  title: {
    fontSize: 17,
    fontWeight: '600',
    textAlign: 'center',
    color: '#000',
    paddingTop: 8,
  },
  message: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  confirmButton: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  confirmText: {
    color: '#539461',
    fontSize: 16,
    fontWeight: '600',
  },
  cancelButton: {
    paddingVertical: 4,
    width: '100%',
    alignItems: 'center',
  },
  cancelText: {
    color: '#000',
    fontSize: 16,
  },
});
