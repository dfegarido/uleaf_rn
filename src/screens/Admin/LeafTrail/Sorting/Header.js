import React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const Header = ({ title, onBack }) => (
  <View style={styles.headerContainer}>
    <TouchableOpacity onPress={onBack} style={styles.backButton}>
      <Text style={styles.backIcon}>‹</Text>
    </TouchableOpacity>
    <Text style={styles.headerTitle}>{title}</Text>
  </View>
);

const styles = StyleSheet.create({
    headerContainer: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        backgroundColor: '#FFFFFF',
        height: 106,
        paddingTop: 48, // Approx status bar height
        paddingHorizontal: 16,
        flexDirection: 'row',
        alignItems: 'center',
        zIndex: 10,
    },
    backButton: {
        position: 'absolute',
        left: 16,
        top: 64, // Position correctly under status bar
    },
    backIcon: {
        fontSize: 32,
        color: '#393D40',
    },
    headerTitle: {
        flex: 1,
        textAlign: 'center',
        fontFamily: 'Inter',
        fontWeight: '700',
        fontSize: 18,
        color: '#202325',
    },
});

export default Header;