import React, {useEffect, useState} from 'react';
import {
  Alert,
  Linking,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {getAppVersionApi} from '../Api/appVersionApi';
import {isAppUpdateRequired} from '../../utils/utils';
import {version as appVersion} from '../../../package.json';

const DEFAULT_TITLE = 'A Greener ileafU is here!';
const DEFAULT_BODY =
  'Fresh features planted 🪴🌿 and pesky bugs resolved. Update for the best leafy experience.';
const DEFAULT_CTA = 'Update now';

const AppUpdateCard = ({
  title = DEFAULT_TITLE,
  body = DEFAULT_BODY,
  ctaText = DEFAULT_CTA,
  style,
}) => {
  const [showUpdateCard, setShowUpdateCard] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const response = await getAppVersionApi();
        if (cancelled || !response?.success) return;
        const {minimumVersion, currentVersion} = response?.data?.data || {};
        const required =
          isAppUpdateRequired(appVersion, minimumVersion) ||
          isAppUpdateRequired(appVersion, currentVersion);
        if (required) {
          setShowUpdateCard(true);
        }
      } catch (error) {
        console.error('Error checking app version:', error);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleUpdatePress = async () => {
    const url =
      Platform.OS === 'ios'
        ? 'https://apps.apple.com/us/app/ileafu/id6749962372'
        : 'https://play.google.com/store/apps/details?id=com.ileafu';

    try {
      await Linking.openURL(url);
    } catch (error) {
      console.error('Error opening store URL:', error);
      Alert.alert('Error', 'Could not open the app store. Please try again.');
    }
  };

  if (!showUpdateCard) {
    return null;
  }

  return (
    <View style={style}>
      <View style={styles.card}>
        <TouchableOpacity
          onPress={() => setShowUpdateCard(false)}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          style={styles.closeButton}>
          <Text style={styles.closeText}>✕</Text>
        </TouchableOpacity>

        <View style={styles.content}>
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.body}>{body}</Text>
          <View style={styles.buttonRow}>
            <TouchableOpacity
              onPress={handleUpdatePress}
              activeOpacity={0.8}
              style={styles.ctaButton}>
              <Text style={styles.ctaText}>{ctaText}</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.decorativeCircle}>
          <Text style={styles.decorativeIcon}>🌿</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#0F3D24',
    borderRadius: 16,
    padding: 18,
    flexDirection: 'row',
    alignItems: 'center',
    overflow: 'hidden',
    position: 'relative',
    minHeight: 150,
  },
  closeButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 2,
    padding: 4,
  },
  closeText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  content: {
    flex: 1,
    paddingRight: 12,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: '#FFFFFF',
    marginBottom: 6,
  },
  body: {
    fontSize: 13,
    color: '#D6E5DA',
    marginBottom: 14,
    lineHeight: 18,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: 10,
  },
  ctaButton: {
    backgroundColor: '#9FE870',
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 10,
  },
  ctaText: {
    color: '#0F3D24',
    fontSize: 14,
    fontWeight: '700',
  },
  decorativeCircle: {
    width: 90,
    height: 90,
    borderRadius: 45,
    backgroundColor: '#1F5A36',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    right: -20,
    bottom: -20,
  },
  decorativeIcon: {
    fontSize: 36,
  },
});

export default AppUpdateCard;
