import React, { useRef } from 'react';
import { View, PanResponder, StyleSheet } from 'react-native';

/**
 * Simple Progress Bar - Alternative to Slider
 * Touch or drag anywhere on the bar to seek to that position
 * More user-friendly with larger touch target and drag support
 */
const SimpleProgressBar = ({ 
  currentTime = 0, 
  duration = 0, 
  onSeek,
  onSlidingStart,
  onSlidingComplete
}) => {
  const progress = duration > 0 ? currentTime / duration : 0;
  const containerWidth = useRef(0);
  const isDragging = useRef(false);

  const calculateSeekTime = (locationX) => {
    if (!duration || containerWidth.current === 0) return 0;
    const newProgress = Math.max(0, Math.min(1, locationX / containerWidth.current));
    return newProgress * duration;
  };

  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: () => true,
      
      onPanResponderGrant: (event) => {
        isDragging.current = true;
        if (onSlidingStart) onSlidingStart();
        
        const locationX = event.nativeEvent.locationX;
        const newTime = calculateSeekTime(locationX);
        if (onSeek) onSeek(newTime);
      },
      
      onPanResponderMove: (event) => {
        const locationX = event.nativeEvent.locationX;
        const newTime = calculateSeekTime(locationX);
        if (onSeek) onSeek(newTime);
      },
      
      onPanResponderRelease: () => {
        isDragging.current = false;
        if (onSlidingComplete) onSlidingComplete();
      },
    })
  ).current;

  return (
    <View 
      style={styles.container}
      onLayout={(event) => {
        containerWidth.current = event.nativeEvent.layout.width;
      }}
      {...panResponder.panHandlers}
    >
      {/* Background bar */}
      <View style={styles.backgroundBar} />
      
      {/* Progress bar */}
      <View style={[styles.progressBar, { width: `${progress * 100}%` }]} />
      
      {/* Thumb - larger and more visible */}
      <View style={[styles.thumb, { left: `${progress * 100}%` }]} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 44, // Larger touch target
    justifyContent: 'center',
    flex: 1,
    paddingHorizontal: 0,
  },
  backgroundBar: {
    height: 6, // Thicker for better visibility
    backgroundColor: 'rgba(255, 255, 255, 0.25)',
    borderRadius: 3,
  },
  progressBar: {
    position: 'absolute',
    height: 6,
    backgroundColor: '#539461', // Brand green color
    borderRadius: 3,
  },
  thumb: {
    position: 'absolute',
    width: 20, // Larger thumb
    height: 20,
    borderRadius: 10,
    backgroundColor: '#FFFFFF',
    marginLeft: -10,
    borderWidth: 3,
    borderColor: '#539461', // Green border
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.4,
    shadowRadius: 4,
    elevation: 8,
  },
});

export default SimpleProgressBar;
