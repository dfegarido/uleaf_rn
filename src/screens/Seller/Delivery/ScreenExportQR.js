import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  Platform,
  Dimensions,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';

// Import icons - using a placeholder for the back arrow and action icon
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import DownloadIcon from '../../../assets/icons/accent/download.svg';

const ScreenExportQR = ({navigation}) => {
  const insets = useSafeAreaInsets();

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.content}>
        <View style={styles.controls}>
          {/* Back Button */}
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <BackIcon width={24} height={24} />
          </TouchableOpacity>

          {/* Navbar Right */}
          <View style={styles.navbarRight}>
            {/* Search - Hidden by default */}
            <View style={[styles.searchButton, {display: 'none'}]}>
              {/* Search icon would go here */}
            </View>

            {/* Action Button */}
            <TouchableOpacity style={styles.actionButton}>
              <DownloadIcon width={24} height={24} />
            </TouchableOpacity>

            {/* Profile - Hidden by default */}
            <View style={[styles.profileButton, {display: 'none'}]}>
              {/* Profile content would go here */}
            </View>

            {/* Page - Hidden by default */}
            <View style={[styles.pageButton, {display: 'none'}]}>
              {/* Page content would go here */}
            </View>

            {/* Link - Hidden by default */}
            <View style={[styles.linkButton, {display: 'none'}]}>
              {/* Link content would go here */}
            </View>
          </View>

          {/* Title */}
          <Text style={styles.title}>Export QR Code</Text>
        </View>
      </View>

      {/* Main Content Area */}
      <View style={styles.mainContent}>
        <Text style={styles.placeholderText}>QR Code Export Content Goes Here</Text>
      </View>
    </SafeAreaView>
  );
};

export default ScreenExportQR;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  content: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: Dimensions.get('window').width,
    height: 58,
    minHeight: 58,
    alignSelf: 'stretch',
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
    width: Dimensions.get('window').width,
    height: 58,
    minHeight: 58,
    alignSelf: 'stretch',
    position: 'relative',
  },
  backButton: {
    width: 24,
    height: 24,
    zIndex: 0,
  },
  navbarRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: 319,
    height: 40,
    flex: 1,
    zIndex: 1,
  },
  searchButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  profileButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    width: 40,
    height: 40,
  },
  pageButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 6,
    width: 33,
    height: 32,
    minHeight: 32,
    borderRadius: 1000,
  },
  linkButton: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 8,
    width: 54,
    height: 22,
  },
  title: {
    position: 'absolute',
    width: 240,
    height: 24,
    left: Dimensions.get('window').width / 2 - 240 / 2 + 0.5,
    top: 14,
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
    zIndex: 2,
  },
  mainContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  placeholderText: {
    fontSize: 16,
    color: '#666',
  },
});
