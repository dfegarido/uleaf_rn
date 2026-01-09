import React, { useEffect, useRef } from 'react';
import { View, Text, Modal, TouchableOpacity, Pressable, Animated } from 'react-native';
import styles from './styles/ErrorModalStyles';

/**
 * ErrorModal - Displays a friendly reminder or message in a modal popup
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

  // Format message to be more user-friendly
  const formatMessage = (msg) => {
    if (!msg) return '';
    
    // Check for specific error messages and make them friendly
    if (msg.includes('A receiver needs an active order') && msg.includes('cutoff date')) {
      return 'Your receiver needs to place an order with at least 7 days before the flight date. Please ask them to order first, then you can join their shipping group!';
    }
    
    if (msg.includes('A receiver needs to order something')) {
      return 'Your receiver needs to place an order first before you can join their shipping group. Ask them to place an order, then try again!';
    }
    
    // Remove "Wait a sec!" and make other messages friendlier
    let friendlyMsg = msg.replace('Wait a sec!', '').trim();
    
    return friendlyMsg;
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
                <Text style={styles.emojiIcon}>ℹ️</Text>
                <Text style={styles.titleText}>{formatMessage(message)}</Text>
              </View>
            </View>
            <View style={styles.actionContainer}>
              <TouchableOpacity
                style={styles.confirmButton}
                onPress={onClose}
                activeOpacity={0.8}>
                <Text style={styles.confirmButtonText}>Got It</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
};

export default ErrorModal;

