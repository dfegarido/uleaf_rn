import React from 'react';
import {
  ImageBackground,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';
import BackSolidIcon from '../../../../assets/iconnav/caret-left-bold.svg';

const ScanQRScreen = ({ navigation }) => {
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screenContainer}>
        {/* The overlay is dark, so a light-content status bar is appropriate */}
        <StatusBar barStyle="light-content" />

        {/* The ImageBackground serves as the camera view.
            In a real app, you would replace this with a component from a
            library like 'react-native-camera' or 'react-native-vision-camera'. */}
        <ImageBackground
          source={{ uri: 'https://i.imgur.com/gnev2kM.png' }} // Placeholder for your camera feed/image
          style={styles.backgroundImage}
        >
          {/* This view creates the dark overlay effect */}
          <View style={styles.overlay} />

          {/* Top Navigation Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <BackSolidIcon />
            </TouchableOpacity>
          </View>

          {/* This is the white square guide for the scanner */}
          <View style={styles.scannerFrame} />

          {/* Bottom Sheet with information */}
          <View style={styles.bottomSheet}>
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>Scan QR Code</Text>
            </View>
            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>
                Align the QR Code with the camera.
              </Text>
            </View>
          </View>
        </ImageBackground>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundImage: {
    flex: 1,
    // The Figma design uses absolute positioning, but flexbox achieves
    // the same full-screen effect more robustly in React Native.
  },
  // --- Overlays & Scanner ---
  overlay: {
    ...StyleSheet.absoluteFillObject, // This makes the view cover the entire parent
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent black overlay
  },
  scannerFrame: {
    position: 'absolute',
    width: 208,
    height: 208,
    top: 196,
    alignSelf: 'center',
    borderWidth: 2, // Using border instead of a background for a clean frame
    borderColor: '#FFFFFF',
    borderRadius: 16, // Added for a softer look
  },
  // --- Header Navigation ---
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    paddingTop: 10, // Adjust for status bar height if not using SafeAreaView
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6F6',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  backButtonIcon: {
    color: '#393D40',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 26, // Fine-tuning for vertical alignment
  },
  // --- Bottom Content Sheet ---
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34, // Safe area for home indicator
  },
  titleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 24,
  },
  titleText: {
    // Note: You must have the 'Inter' font linked in your project
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
  },
  noteContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  noteText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    textAlign: 'center',
    color: '#647276',
  },
});

export default ScanQRScreen;