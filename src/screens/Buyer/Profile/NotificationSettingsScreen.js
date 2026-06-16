import React, { useContext, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';

import { AuthContext } from '../../../auth/AuthProvider';
import { useNotificationPermission } from '../../../hooks/useNotificationPermission';
import NotificationService from '../../../services/notifications/NotificationService';
import { addTokenToBuyer, removeTokenFromBuyer } from '../../../services/notifications/buyerFcmTokens';
import Loading from '../../../components/Loading';

import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';

// Inline bell icon — keeps the screen self-contained; matches the greydark
// style used by the other profile menu icons.
const BellIcon = ({ width = 24, height = 24, fill = '#556065' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 3C10.3431 3 9 4.34315 9 6V6.35418C6.67084 7.15088 5 9.34783 5 12V16L3 18V19H21V18L19 16V12C19 9.34783 17.3292 7.15088 15 6.35418V6C15 4.34315 13.6569 3 12 3Z"
      fill={fill}
    />
    <Path
      d="M10 20.5C10 21.3284 10.6716 22 11.5 22H12.5C13.3284 22 14 21.3284 14 20.5V20H10V20.5Z"
      fill={fill}
    />
  </Svg>
);

const NotificationSettingsScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const { userInfo } = useContext(AuthContext);
  const { status, disabled, setDisabled } = useNotificationPermission();
  const [busy, setBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Wait for the hook to read AsyncStorage so the initial toggle state matches
  // what was persisted, rather than defaulting to "on" briefly.
  useEffect(() => {
    setHydrated(true);
  }, [disabled]);

  const uid = userInfo?.uid || userInfo?.user?.uid;

  const handleToggle = async (next) => {
    if (busy) return;
    setBusy(true);
    try {
      if (!next) {
        // Turning OFF: persist flag first so registerWithoutPrompting skips
        // on the next login, then remove the token from Firestore so we stop
        // sending pushes immediately.
        await setDisabled(true);
        if (uid) {
          try {
            await NotificationService.removeToken(uid, removeTokenFromBuyer);
          } catch (e) {
            // eslint-disable-next-line no-console
            console.warn('[NotificationSettings] removeToken failed', e);
          }
        }
      } else {
        // Turning ON: clear the flag, then ask the OS to grant permission.
        // If the user denies the OS prompt, the local toggle reverts.
        await setDisabled(false);
        if (uid) {
          const result = await NotificationService.requestPermissionAndRegister(
            uid,
            { writeToken: addTokenToBuyer, removeToken: removeTokenFromBuyer },
          );
          if (result?.status === 'denied') {
            await setDisabled(true);
            Alert.alert(
              'Notifications disabled',
              'You denied notification permission. You can change this later in your phone’s settings.',
            );
          }
        }
      }
    } catch (e) {
      // eslint-disable-next-line no-console
      console.warn('[NotificationSettings] toggle failed', e);
      Alert.alert('Something went wrong', 'Please try again.');
    } finally {
      setBusy(false);
    }
  };

  const osDenied = hydrated && status === 'denied';

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar backgroundColor="#DFECDF" barStyle="dark-content" />

      <View style={[styles.header, { paddingTop: Math.min(insets.top, 40) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <LeftIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Notification Settings</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView
        style={styles.content}
        contentContainerStyle={{ paddingBottom: 32 }}
        showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Preferences</Text>

          <View style={styles.row}>
            <View style={styles.rowLeft}>
              <View style={styles.iconContainer}>
                <BellIcon width={22} height={22} fill="#393D40" />
              </View>
              <View style={styles.rowText}>
                <Text style={styles.rowTitle}>Push Notifications</Text>
                <Text style={styles.rowSubtitle}>
                  Get a push notification every time a seller starts a live sale.
                </Text>
              </View>
            </View>
            <TouchableOpacity
              accessibilityRole="switch"
              accessibilityState={{ checked: !disabled }}
              onPress={() => {
                if (busy) return;
                if (!disabled) {
                  Alert.alert(
                    'Turn off notifications?',
                    'You will no longer receive alerts for live sales. You can turn this back on at any time.',
                    [
                      { text: 'Cancel', style: 'cancel' },
                      { text: 'Turn off', style: 'destructive', onPress: () => handleToggle(false) },
                    ],
                  );
                } else {
                  handleToggle(true);
                }
              }}
              style={[styles.toggleTrack, !disabled && styles.toggleTrackOn]}
              disabled={busy}>
              <View style={[styles.toggleThumb, !disabled && styles.toggleThumbOn]} />
            </TouchableOpacity>
          </View>

          {hydrated && disabled && (
            <Text style={styles.helperText}>
              Push notifications are off. Toggle on to receive alerts when sellers go live.
            </Text>
          )}

          {hydrated && !disabled && osDenied && (
            <Text style={styles.helperText}>
              Notifications are turned off in your phone’s settings. Update
              your system settings to receive push alerts again.
            </Text>
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>About</Text>
          <Text style={styles.aboutText}>
            When push notifications are on, we'll send you a push every time
            any seller starts a live sale. You can turn this off at any time.
          </Text>
        </View>
      </ScrollView>

      <Loading visible={busy} fullscreen />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#DFECDF',
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'flex-start',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    fontFamily: 'Inter',
  },
  headerSpacer: { width: 32, height: 32 },
  content: { flex: 1, backgroundColor: '#FFFFFF' },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: '#7F8D91',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
    paddingHorizontal: 4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#F7F8F8',
    borderRadius: 12,
    padding: 14,
    minHeight: 72,
  },
  rowLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 12,
  },
  iconContainer: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#E4E7E9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  rowText: { flex: 1 },
  rowTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    fontFamily: 'Inter',
  },
  rowSubtitle: {
    fontSize: 13,
    color: '#556065',
    marginTop: 2,
    lineHeight: 18,
  },
  // Simple custom toggle (no extra deps)
  toggleTrack: {
    width: 46,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#CDD3D4',
    padding: 2,
    justifyContent: 'center',
  },
  toggleTrackOn: { backgroundColor: '#539461' },
  toggleThumb: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    transform: [{ translateX: 0 }],
  },
  toggleThumbOn: { transform: [{ translateX: 18 }] },
  helperText: {
    fontSize: 13,
    color: '#7F8D91',
    marginTop: 10,
    paddingHorizontal: 4,
    lineHeight: 18,
  },
  aboutText: {
    fontSize: 14,
    color: '#556065',
    lineHeight: 20,
    paddingHorizontal: 4,
  },
});

export default NotificationSettingsScreen;
