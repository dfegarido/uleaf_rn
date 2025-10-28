import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  TouchableOpacity,
  Linking,
  Platform,
  Image,
} from 'react-native';

const UpdateRequiredScreen = ({updateUrl, message}) => {
  const handleUpdate = async () => {
    let url;
    
    if (Platform.OS === 'ios') {
      // Try to get URL from updateUrl object
      url = updateUrl?.ios || updateUrl?.[Platform.OS];
      
      // Fallback to correct iOS App Store URL
      if (!url) {
        url = 'https://apps.apple.com/us/app/ileafu/id6749962372';
      }
    } else {
      // Android
      url = updateUrl?.android || updateUrl?.[Platform.OS] || 
        'https://play.google.com/store/apps/details?id=com.ileafu';
    }
    
    console.log('Opening update URL:', url, 'Platform:', Platform.OS);
    
    try {
      const supported = await Linking.canOpenURL(url);
      if (supported) {
        await Linking.openURL(url);
      } else {
        console.log("Can't open URL:", url);
        // Fallback to browser URL format
        const fallbackUrl = Platform.OS === 'ios' 
          ? 'https://apps.apple.com/us/app/ileafu/id6749962372'
          : 'https://play.google.com/store/apps/details?id=com.ileafu';
        await Linking.openURL(fallbackUrl);
      }
    } catch (error) {
      console.error('Error opening update URL:', error);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icon/Logo */}
        <View style={styles.iconContainer}>
          <View style={styles.iconInner}>
            <Text style={styles.iconText}>📱</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Update Required</Text>

        {/* Message */}
        <Text style={styles.message}>
          {message || 'A new version of the app is available. Please update to continue.'}
        </Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          Update now to get the latest features and improvements.
        </Text>

        {/* Update Button */}
        <TouchableOpacity style={styles.updateButton} onPress={handleUpdate}>
          <Text style={styles.updateButtonText}>
            Update Now
          </Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F5', // App's bgMuted equivalent
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    backgroundColor: '#DFECDF', // bgLightAccent - light green background
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 32,
    shadowColor: '#539461', // accent green
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  iconInner: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#F2F7F3', // bgCardSurfaceLightAccent
    justifyContent: 'center',
    alignItems: 'center',
  },
  iconText: {
    fontSize: 50,
  },
  title: {
    fontSize: 32,
    fontWeight: '700',
    color: '#202325', // primaryDark
    fontFamily: 'Inter',
    marginBottom: 16,
    textAlign: 'center',
  },
  message: {
    fontSize: 18,
    fontWeight: '600',
    color: '#539461', // accent green
    fontFamily: 'Inter',
    marginBottom: 24,
    textAlign: 'center',
    lineHeight: 28,
  },
  subtitle: {
    fontSize: 16,
    color: '#647276', // greySoft
    fontFamily: 'Inter',
    textAlign: 'center',
    marginBottom: 48,
    lineHeight: 24,
  },
  updateButton: {
    backgroundColor: '#539461', // accent green
    paddingVertical: 16,
    paddingHorizontal: 48,
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
    shadowColor: '#539461',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 6,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
});

export default UpdateRequiredScreen;

