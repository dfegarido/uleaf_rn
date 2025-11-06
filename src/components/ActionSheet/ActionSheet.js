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
      Animated.timing(slideAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [visible, slideAnim]);

  return (
    <Modal
      visible={visible}
      animationType="none"
      transparent
      onRequestClose={onClose}>
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <TouchableWithoutFeedback onPress={onClose}>
          <View style={styles.overlay}>
            <TouchableWithoutFeedback>
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
            </TouchableWithoutFeedback>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  keyboardAvoidingView: {
    flex: 1,
  },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    // padding: 20,
  },
});

export default ActionSheet;
