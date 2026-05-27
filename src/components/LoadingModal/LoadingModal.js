import React from 'react';
import { View, Text, StyleSheet, Image, ActivityIndicator } from 'react-native';

const LoadingModal = ({ message = 'Preparing your plant data...' }) => {
  const showReceivingHint = message.toLowerCase().includes('plant');

  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <View style={styles.badge}>
          <Text style={styles.badgeText}>For Receiving</Text>
        </View>

        <View style={styles.iconContainer}>
          <Image
            source={require('../../assets/gif/grow_plant.gif')}
            style={styles.plantGif}
            resizeMode="contain"
          />
          <View style={styles.spinnerWrap}>
            <ActivityIndicator size="small" color="#2E7D32" />
          </View>
        </View>

        <Text style={styles.message}>{message}</Text>
        {showReceivingHint ? (
          <Text style={styles.subMessage}>
            We are syncing incoming plants and preparing this list.
          </Text>
        ) : null}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(22, 30, 26, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingVertical: 24,
    paddingHorizontal: 20,
    alignItems: 'center',
    width: '82%',
    maxWidth: 340,
    shadowColor: '#102018',
    shadowOffset: {
      width: 0,
      height: 10,
    },
    shadowOpacity: 0.2,
    shadowRadius: 16,
    elevation: 10,
    borderWidth: 1,
    borderColor: '#E7F4EA',
  },
  badge: {
    backgroundColor: '#E7F4EA',
    borderRadius: 999,
    paddingHorizontal: 10,
    paddingVertical: 4,
    marginBottom: 10,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#1F6F3D',
    letterSpacing: 0.2,
  },
  iconContainer: {
    marginBottom: 10,
    width: 132,
    height: 132,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantGif: {
    width: 132,
    height: 132,
  },
  spinnerWrap: {
    position: 'absolute',
    right: 4,
    bottom: 10,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: '#F4FBF6',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D3EEDA',
  },
  message: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1E2A22',
    textAlign: 'center',
    lineHeight: 22,
  },
  subMessage: {
    marginTop: 6,
    fontSize: 13,
    fontWeight: '500',
    color: '#5D6C61',
    textAlign: 'center',
    lineHeight: 18,
  },
});

export default LoadingModal;
