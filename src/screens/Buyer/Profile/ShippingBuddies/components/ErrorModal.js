import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable, Animated } from 'react-native';
import styles from './styles/ErrorModalStyles';

/**
 * ErrorModal - Displays an error message in a modal popup
 */
const ErrorModal = ({
  visible,
  message,
  onClose,
}) => {
  const scaleAnim = useRef(new Animated.Value(0)).current;
  const opacityAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
      // Start animation when modal becomes visible
      Animated.parallel([
        Animated.spring(scaleAnim, {
          toValue: 1,
          useNativeDriver: true,
          tension: 50,
          friction: 7,
        }),
        Animated.timing(opacityAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Reset animation when modal is hidden
      scaleAnim.setValue(0);
      opacityAnim.setValue(0);
    }
  }, [visible, scaleAnim, opacityAnim]);

  const animatedStyle = {
    transform: [{ scale: scaleAnim }],
    opacity: opacityAnim,
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={onClose}>
      <Pressable style={styles.modalOverlay} onPress={onClose}>
        <Animated.View style={[styles.modalContainer, animatedStyle]}>
          <Pressable onPress={(e) => e.stopPropagation()}>
            <View style={styles.popover}>
              <View style={styles.textContainer}>
                <Text style={styles.titleText}>{message}</Text>
              </View>
            </View>
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.cancelButton}
                onPress={onClose}
                activeOpacity={0.8}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

export default ErrorModal;

