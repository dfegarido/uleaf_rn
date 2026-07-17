import React, { useEffect, useRef } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  TouchableWithoutFeedback,
} from 'react-native';
import Svg, { Path } from 'react-native-svg';

const BellIcon = ({ width = 64, height = 64, fill = '#539461' }) => (
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

const NotificationPermissionPrompt = ({
  visible,
  onEnable,
  onDismiss,
}) => {
  const scaleAnim = useRef(new Animated.Value(0.92)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 80,
          useNativeDriver: true,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 220,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.timing(scaleAnim, {
        toValue: 0.96,
        duration: 180,
        useNativeDriver: true,
      }).start();
      Animated.timing(opacityAnim, {
        toValue: 0,
        duration: 180,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, opacityAnim, scaleAnim]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onDismiss}>
      <TouchableWithoutFeedback onPress={onDismiss}>
        <View style={styles.overlay}>
          <Animated.View
            style={[
              styles.container,
              {
                opacity: opacityAnim,
                transform: [{ scale: scaleAnim }],
              },
            ]}>
            <View style={styles.iconWrapper}>
              <BellIcon width={56} height={56} fill="#539461" />
              <View style={styles.badgeDot} />
            </View>

            <Text style={styles.title}>Stay Updated with Live Notifications</Text>
            <Text style={styles.subtitle}>Notifications are currently turned off.</Text>
            <Text style={styles.message}>
              Enable notifications to receive real-time updates about your orders,
              delivery status, promotions, and important announcements. When
              notifications are enabled, you'll receive live notifications instantly,
              so you never miss an important update.
            </Text>

            <TouchableOpacity
              activeOpacity={0.85}
              style={styles.primaryButton}
              onPress={onEnable}>
              <Text style={styles.primaryButtonText}>Enable Notifications</Text>
            </TouchableOpacity>

            <TouchableOpacity
              activeOpacity={0.7}
              style={styles.secondaryButton}
              onPress={onDismiss}>
              <Text style={styles.secondaryButtonText}>Not Now</Text>
            </TouchableOpacity>
          </Animated.View>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    paddingHorizontal: 24,
  },
  container: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 28,
    width: '100%',
    maxWidth: 360,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.18,
    shadowRadius: 20,
    elevation: 10,
  },
  iconWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F2F7F3',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 20,
  },
  badgeDot: {
    position: 'absolute',
    top: 26,
    right: 26,
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#E74C3C',
    borderWidth: 2,
    borderColor: '#F2F7F3',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#202325',
    textAlign: 'center',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#7F8D91',
    textAlign: 'center',
    marginBottom: 12,
  },
  message: {
    fontSize: 14,
    color: '#556065',
    textAlign: 'center',
    lineHeight: 21,
    marginBottom: 24,
  },
  primaryButton: {
    width: '100%',
    backgroundColor: '#539461',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 12,
  },
  primaryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  secondaryButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  secondaryButtonText: {
    color: '#7F8D91',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default NotificationPermissionPrompt;
