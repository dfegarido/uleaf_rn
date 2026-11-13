import React from 'react';
import {Modal, View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import PinAccentIcon from '../../../../assets/icons/accent/pin.svg';

const CantPinModal = ({visible, message, onClose}) => (
  <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
    <View style={styles.overlay}>
      <View style={styles.card}>
        <View style={styles.iconCircle}>
          <PinAccentIcon width={28} height={28} />
        </View>
        <Text style={styles.title}>Can't pin this plant</Text>
        <Text style={styles.message}>{message || 'Please try again.'}</Text>
        <TouchableOpacity style={styles.button} activeOpacity={0.8} onPress={onClose}>
          <Text style={styles.buttonText}>Got it</Text>
        </TouchableOpacity>
      </View>
    </View>
  </Modal>
);

export default CantPinModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  card: {
    width: '100%',
    maxWidth: 360,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingTop: 28,
    paddingBottom: 20,
    paddingHorizontal: 24,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 16,
    shadowOffset: {width: 0, height: 6},
    elevation: 8,
  },
  iconCircle: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: '#EAF4EC',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    textAlign: 'center',
    marginBottom: 8,
  },
  message: {
    fontFamily: 'Inter',
    fontSize: 15,
    lineHeight: 22,
    color: '#647276',
    textAlign: 'center',
    marginBottom: 24,
  },
  button: {
    alignSelf: 'stretch',
    height: 48,
    borderRadius: 12,
    backgroundColor: '#539461',
    alignItems: 'center',
    justifyContent: 'center',
  },
  buttonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});
