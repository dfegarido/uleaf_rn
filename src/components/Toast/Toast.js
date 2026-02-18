import React, {useEffect, useRef} from 'react';
import {View, Text, StyleSheet, Animated} from 'react-native';

const Toast = ({visible, message, type = 'success', duration = 3000, onHide, position = 'top'}) => {
  const isBottom = position === 'bottom';
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(isBottom ? 50 : -50)).current;

  useEffect(() => {
    if (visible) {
      // Show animation (slide in: top = from -50 to 0, bottom = from 50 to 0)
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto hide after duration
      const timer = setTimeout(() => {
        hideToast();
      }, duration);

      return () => clearTimeout(timer);
    } else {
      hideToast();
    }
  }, [visible]);

  const hideToast = () => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: isBottom ? 50 : -50,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      if (onHide) {
        onHide();
      }
    });
  };

  if (!visible) return null;

  const backgroundColor = type === 'success' ? '#539461' : type === 'error' ? '#E7522F' : '#556065';

  return (
    <View style={[styles.container, isBottom ? styles.containerBottom : styles.containerTop]} pointerEvents="none">
      <Animated.View
        style={[
          styles.toast,
          isBottom ? styles.toastBottom : styles.toastTop,
          {backgroundColor},
          {
            opacity: fadeAnim,
            transform: [{translateY: slideAnim}],
          },
        ]}>
        <Text style={styles.message}>{message}</Text>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    alignItems: 'center',
    zIndex: 9999,
    pointerEvents: 'box-none',
  },
  containerTop: {
    justifyContent: 'flex-start',
  },
  containerBottom: {
    justifyContent: 'flex-end',
  },
  toast: {
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 200,
    maxWidth: '90%',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  toastTop: {
    marginTop: 60,
  },
  toastBottom: {
    marginBottom: 60,
  },
  message: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
});

export default Toast;

