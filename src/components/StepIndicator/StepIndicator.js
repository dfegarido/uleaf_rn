import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  Easing,
  interpolate,
} from 'react-native-reanimated';

const STEP_SIZE = 32;
const LINE_HEIGHT = 2;

const StepIndicator = ({currentStep, totalSteps = 4}) => {
  const entranceProgress = useSharedValue(0);

  React.useEffect(() => {
    entranceProgress.value = withTiming(1, {duration: 600, easing: Easing.out(Easing.ease)});
  }, [currentStep]);

  const fadeUp = useAnimatedStyle(() => ({
    opacity: interpolate(entranceProgress.value, [0, 1], [0, 1]),
    transform: [
      {
        translateY: interpolate(entranceProgress.value, [0, 1], [12, 0]),
      },
    ],
  }));

  const renderSteps = () => {
    const items = [];
    for (let i = 1; i <= totalSteps; i++) {
      const isCompleted = i < currentStep;
      const isActive = i === currentStep;
      const isFuture = i > currentStep;

      items.push(
        <View key={`step-${i}`} style={styles.stepRow}>
          <Animated.View
            style={[
              styles.circle,
              isActive && styles.circleActive,
              isCompleted && styles.circleCompleted,
              isFuture && styles.circleFuture,
            ]}
          >
            <Text
              style={[
                styles.stepNumber,
                (isActive || isCompleted) && styles.stepNumberActive,
                isFuture && styles.stepNumberFuture,
              ]}>
              {i}
            </Text>
          </Animated.View>
          {i < totalSteps && (
            <View
              style={[
                styles.line,
                i < currentStep && styles.lineActive,
              ]}
            />
          )}
        </View>,
      );
    }
    return items;
  };

  return (
    <Animated.View style={[styles.container, fadeUp]}>
      {renderSteps()}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  circle: {
    width: STEP_SIZE,
    height: STEP_SIZE,
    borderRadius: STEP_SIZE / 2,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#6BA368',
    backgroundColor: '#6BA368',
  },
  circleActive: {
    borderColor: '#6BA368',
    backgroundColor: '#6BA368',
    shadowColor: '#6BA368',
    shadowOpacity: 0.3,
    shadowRadius: 6,
    shadowOffset: {width: 0, height: 2},
    elevation: 3,
  },
  circleCompleted: {
    borderColor: '#6BA368',
    backgroundColor: '#6BA368',
  },
  circleFuture: {
    borderColor: '#D1D5DB',
    backgroundColor: 'transparent',
  },
  stepNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: '#fff',
  },
  stepNumberActive: {
    color: '#fff',
  },
  stepNumberFuture: {
    color: '#9CA3AF',
  },
  line: {
    width: 40,
    height: LINE_HEIGHT,
    backgroundColor: '#E5E7EB',
    marginHorizontal: 8,
  },
  lineActive: {
    backgroundColor: '#6BA368',
  },
});

export default StepIndicator;
