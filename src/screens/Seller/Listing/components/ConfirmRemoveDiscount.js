import React from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';

const {width} = Dimensions.get('window');

const ConfirmRemoveDiscount = ({visible, onConfirm, onCancel}) => {
  return (
    <Modal
      transparent
      animationType="fade"
      visible={visible}
      onRequestClose={onCancel}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.contentContainer}>
            <Text style={styles.title}>Remove discount?</Text>

            <TouchableOpacity style={styles.confirmButton} onPress={onConfirm}>
              <Text style={styles.confirmText}>Confirm Remove</Text>
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

export default ConfirmRemoveDiscount;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: width * 0.85,
    // backgroundColor: '#fff',
    // borderRadius: 16,
    // paddingVertical: 24,
    // paddingHorizontal: 20,
    // alignItems: 'center',
    // shadowColor: '#000',
    // shadowOpacity: 0.1,
    // shadowRadius: 10,
    // elevation: 5,
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
    borderBottomWidth: 1,
    borderBottomColor: '#ddd',
    paddingVertical: 10,
  },
  message: {
    fontSize: 15,
    color: '#555',
    textAlign: 'center',
    paddingVertical: 10,
  },
  confirmButton: {
    paddingVertical: 12,
    width: '100%',
    alignItems: 'center',
  },
  confirmText: {
    color: '#E75224',
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
