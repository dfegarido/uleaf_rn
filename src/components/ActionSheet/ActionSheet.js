import React, {useEffect, useRef} from 'react';
import {
  Modal,
  View,
  StyleSheet,
  TouchableWithoutFeedback,
  Dimensions,
  Animated,
  KeyboardAvoidingView,
  Platform,
  Easing,
} from 'react-native';

const {height: screenHeight} = Dimensions.get('window');

const ActionSheet = ({visible, onClose, children, heightPercent = '30%'}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;

  // Calculate height from percentage string or use as-is if it's a number
  const getHeight = () => {
    if (typeof heightPercent === 'string' && heightPercent.endsWith('%')) {
      const percent = parseFloat(heightPercent);
      return (screenHeight * percent) / 100;
    }
    return typeof heightPercent === 'number' ? heightPercent : screenHeight * 0.3;
  };

  const sheetHeight = getHeight();

  useEffect(() => {
    if (visible) {
      slideAnim.setValue(0);
      Animated.spring(slideAnim, {
        toValue: 1,
        useNativeDriver: true,
        tension: 68,
        friction: 12,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 240,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  const overlayOpacity = slideAnim.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 1],
  });

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <View style={styles.container}>
          <TouchableWithoutFeedback onPress={onClose}>
            <Animated.View
              style={[
                styles.overlay,
                {
                  opacity: overlayOpacity,
                },
              ]}
            />
          </TouchableWithoutFeedback>
          <Animated.View
            style={[
              styles.sheet,
              {height: sheetHeight},
              {
                transform: [
                  {
                    translateY: slideAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [sheetHeight, 0], // Start below screen, slide to position
                    }),
                  },
                ],
              },
            ]}>
            {children}
          </Animated.View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  container: {
    flex: 1,
    position: 'relative',
  },
  overlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  sheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // padding: 20,
  },
});

export default ActionSheet;
