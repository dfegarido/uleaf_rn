import React from 'react';
import { View, Text, StyleSheet, Image } from 'react-native';

const LoadingModal = ({ message = 'Growing your plants, please wait...' }) => {
  return (
    <View style={styles.overlay}>
      <View style={styles.content}>
        <View style={styles.iconContainer}>
          <Image 
            source={require('../../assets/gif/grow_plant.gif')} 
            style={styles.plantGif}
            resizeMode="contain"
          />
        </View>
        <Text style={styles.message}>{message}</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 9999,
  },
  content: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 32,
    alignItems: 'center',
    minWidth: 220,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  iconContainer: {
    marginBottom: 16,
    width: 150,
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  plantGif: {
    width: 200,
    height: 200,
  },
  message: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    textAlign: 'center',
  },
});

export default LoadingModal;
