import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  SafeAreaView,
  ActivityIndicator,
  Image,
} from 'react-native';
import {useEffect, useState} from 'react';
import {checkMaintenanceApi} from '../../components/Api/maintenanceApi';

const MaintenanceScreen = () => {
  const [isMaintenanceMode, setIsMaintenanceMode] = useState(true);
  const [maintenanceMessage, setMaintenanceMessage] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkMaintenanceStatus();
    
    // Check every 30 seconds if still in maintenance
    const interval = setInterval(() => {
      checkMaintenanceStatus();
    }, 30000); // 30 seconds

    return () => clearInterval(interval);
  }, []);

  const checkMaintenanceStatus = async () => {
    try {
      const response = await checkMaintenanceApi();
      
      if (response.success && response.data?.maintenance) {
        const {enabled, message} = response.data.maintenance;
        setIsMaintenanceMode(enabled);
        setMaintenanceMessage(message || 'The app is under maintenance. Please check back later.');
        
        // If maintenance is off, allow normal app usage
        if (!enabled) {
          console.log('✅ Maintenance mode disabled, allowing normal app access');
        }
      }
    } catch (error) {
      console.error('Error checking maintenance status:', error);
      // If we can't check, assume maintenance is still on
      setIsMaintenanceMode(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#539461" />
          <Text style={styles.loadingText}>Checking maintenance status...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (!isMaintenanceMode) {
    // If maintenance is off, don't show this screen
    return null;
  }

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.content}>
        {/* Icon/Logo with green accent */}
        <View style={styles.iconContainer}>
          <View style={styles.iconInner}>
            <Text style={styles.iconText}>🔧</Text>
          </View>
        </View>

        {/* Title */}
        <Text style={styles.title}>Under Maintenance</Text>

        {/* Message */}
        <Text style={styles.message}>{maintenanceMessage}</Text>

        {/* Subtitle */}
        <Text style={styles.subtitle}>
          We're currently performing scheduled maintenance to improve your experience.
        </Text>

        {/* Additional info with green accent card */}
        <View style={styles.infoContainer}>
          <View style={styles.infoIconContainer}>
            <Text style={styles.infoIconText}>🌿</Text>
          </View>
          <Text style={styles.infoText}>
            We'll be back shortly. Thank you for your patience!
          </Text>
        </View>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#647276', // greySoft
    fontFamily: 'Inter',
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
    marginBottom: 32,
    lineHeight: 24,
  },
  infoContainer: {
    backgroundColor: '#FFFFFF', // primaryLight
    padding: 24,
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    borderLeftWidth: 4,
    borderLeftColor: '#539461', // accent green accent
    shadowColor: '#539461', // green shadow
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  infoIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#F2F7F3', // bgCardSurfaceLightAccent
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    alignSelf: 'center',
  },
  infoIconText: {
    fontSize: 24,
  },
  infoText: {
    fontSize: 14,
    color: '#647276', // greySoft
    fontFamily: 'Inter',
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default MaintenanceScreen;

