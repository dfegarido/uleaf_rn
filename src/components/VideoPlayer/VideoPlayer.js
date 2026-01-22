import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Dimensions,
  Platform,
  StatusBar,
} from 'react-native';
import Video from 'react-native-video';
import Slider from '@react-native-community/slider';
import Svg, { Path } from 'react-native-svg';
import { formatDuration } from '../../utils/videoCompression';

/**
 * VideoPlayer Component
 * Full-featured video player with play/pause/seek/mute/fullscreen controls
 * Compatible with Android and iOS
 */

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Play Icon SVG Component
const PlayIcon = ({ width = 80, height = 80, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16.6582 9.28638C18.098 10.1862 18.8178 10.6361 19.0647 11.2122C19.2803 11.7152 19.2803 12.2847 19.0647 12.7878C18.8178 13.3638 18.098 13.8137 16.6582 14.7136L9.896 18.94C8.29805 19.9387 7.49907 20.4381 6.83973 20.385C6.26501 20.3388 5.73818 20.0469 5.3944 19.584C5 19.053 5 18.1108 5 16.2264V7.77357C5 5.88919 5 4.94701 5.3944 4.41598C5.73818 3.9531 6.26501 3.66111 6.83973 3.6149C7.49907 3.5619 8.29805 4.06126 9.896 5.05998L16.6582 9.28638Z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
      fill={color}
    />
  </Svg>
);

// Pause Icon SVG Component (two vertical bars)
const PauseIcon = ({ width = 80, height = 80, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M8 5V19M16 5V19"
      stroke={color}
      strokeWidth="3"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Skip Backward Icon SVG Component
const SkipBackwardIcon = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 52 52" fill={color}>
    <Path d="M26,7.9V2.6c0-0.5,0.6-0.8,1.1-0.5l10.3,8.5c0.4,0.3,0.4,0.9,0,1.2l-10.3,8.4c-0.4,0.4-1.1,0-1.1-0.4v-5.4 c-8,0-14.6,6.5-14.6,14.6S18,43.5,26,43.5c8,0,14.6-6.5,14.6-14.6c0-2.3-0.5-4.5-1.5-6.5c0,0,0-0.1-0.1-0.2 c-0.2-0.4-0.4-0.9-0.6-1.2c-0.3-0.5-0.6-1.3,0-1.8c0.6-0.5,3.1-2.6,3.3-2.7c0.2-0.1,0.9-0.8,1.6,0.2c0.4,0.6,0.9,1.5,1.3,2.2 c0,0.1,0.1,0.1,0.1,0.2c0.2,0.3,0.3,0.6,0.4,0.7l0,0c1.3,2.7,2,5.8,2,9.1c0,11.6-9.4,21-21,21S5,40.6,5,29S14.4,7.9,26,7.9z" />
  </Svg>
);

// Skip Forward Icon SVG Component
const SkipForwardIcon = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 52 52" fill={color}>
    <Path d="M26,7.9V2.6c0-0.5-0.6-0.8-1.1-0.5l-10.3,8.5c-0.4,0.3-0.4,0.9,0,1.2l10.3,8.4c0.4,0.4,1.1,0,1.1-0.4v-5.4 c8,0,14.6,6.5,14.6,14.6S34,43.5,26,43.5c-8,0-14.6-6.5-14.6-14.6c0-2.3,0.5-4.5,1.5-6.5c0,0,0-0.1,0.1-0.2 c0.2-0.4,0.4-0.9,0.6-1.2c0.3-0.5,0.6-1.3,0-1.8c-0.6-0.5-3.1-2.6-3.3-2.7c-0.2-0.1-0.9-0.8-1.6,0.2c-0.4,0.6-0.9,1.5-1.3,2.2 c0,0.1-0.1,0.1-0.1,0.2c-0.2,0.3-0.3,0.6-0.4,0.7l0,0c-1.3,2.7-2,5.8-2,9.1c0,11.6,9.4,21,21,21s21-9.4,21-21S37.6,7.9,26,7.9z" />
  </Svg>
);

// Volume Icon SVG Component
const VolumeIcon = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16.0004 9.00009C16.6281 9.83575 17 10.8745 17 12.0001C17 13.1257 16.6281 14.1644 16.0004 15.0001M18 5.29177C19.8412 6.93973 21 9.33459 21 12.0001C21 14.6656 19.8412 17.0604 18 18.7084M4.6 9.00009H5.5012C6.05213 9.00009 6.32759 9.00009 6.58285 8.93141C6.80903 8.87056 7.02275 8.77046 7.21429 8.63566C7.43047 8.48353 7.60681 8.27191 7.95951 7.84868L10.5854 4.69758C11.0211 4.17476 11.2389 3.91335 11.4292 3.88614C11.594 3.86258 11.7597 3.92258 11.8712 4.04617C12 4.18889 12 4.52917 12 5.20973V18.7904C12 19.471 12 19.8113 11.8712 19.954C11.7597 20.0776 11.594 20.1376 11.4292 20.114C11.239 20.0868 11.0211 19.8254 10.5854 19.3026L7.95951 16.1515C7.60681 15.7283 7.43047 15.5166 7.21429 15.3645C7.02275 15.2297 6.80903 15.1296 6.58285 15.0688C6.32759 15.0001 6.05213 15.0001 5.5012 15.0001H4.6C4.03995 15.0001 3.75992 15.0001 3.54601 14.8911C3.35785 14.7952 3.20487 14.6422 3.10899 14.4541C3 14.2402 3 13.9601 3 13.4001V10.6001C3 10.04 3 9.76001 3.10899 9.54609C3.20487 9.35793 3.35785 9.20495 3.54601 9.10908C3.75992 9.00009 4.03995 9.00009 4.6 9.00009Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Muted Volume Icon SVG Component
const MutedVolumeIcon = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16 9.50009L21 14.5001M21 9.50009L16 14.5001M4.6 9.00009H5.5012C6.05213 9.00009 6.32759 9.00009 6.58285 8.93141C6.80903 8.87056 7.02275 8.77046 7.21429 8.63566C7.43047 8.48353 7.60681 8.27191 7.95951 7.84868L10.5854 4.69758C11.0211 4.17476 11.2389 3.91335 11.4292 3.88614C11.594 3.86258 11.7597 3.92258 11.8712 4.04617C12 4.18889 12 4.52917 12 5.20973V18.7904C12 19.471 12 19.8113 11.8712 19.954C11.7597 20.0776 11.594 20.1376 11.4292 20.114C11.239 20.0868 11.0211 19.8254 10.5854 19.3026L7.95951 16.1515C7.60681 15.7283 7.43047 15.5166 7.21429 15.3645C7.02275 15.2297 6.80903 15.1296 6.58285 15.0688C6.32759 15.0001 6.05213 15.0001 5.5012 15.0001H4.6C4.03995 15.0001 3.75992 15.0001 3.54601 14.8911C3.35785 14.7952 3.20487 14.6422 3.10899 14.4541C3 14.2402 3 13.9601 3 13.4001V10.6001C3 10.04 3 9.76001 3.10899 9.54609C3.20487 9.35793 3.35785 9.20495 3.54601 9.10908C3.75992 9.00009 4.03995 9.00009 4.6 9.00009Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const VideoPlayer = ({ 
  videoUrl, 
  visible, 
  onClose, 
  autoPlay = false,
  showControls = true,
  style = {},
}) => {
  const videoRef = useRef(null);
  const [paused, setPaused] = useState(!autoPlay);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Controls are always visible - no auto-hide
  const showControlsOverlay = true;

  const handlePlayPause = () => {
    setPaused(!paused);
  };

  const handleMute = () => {
    setIsMuted(!isMuted);
  };

  const handleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  const handleSeek = (value) => {
    if (videoRef.current) {
      videoRef.current.seek(value);
    }
    setCurrentTime(value);
  };

  const handleSkipBackward = () => {
    const newTime = Math.max(0, currentTime - 10);
    handleSeek(newTime);
  };

  const handleSkipForward = () => {
    const newTime = Math.min(duration, currentTime + 10);
    handleSeek(newTime);
  };

  const handleLoad = (data) => {
    setDuration(data.duration);
    setIsLoading(false);
  };

  const handleProgress = (data) => {
    setCurrentTime(data.currentTime);
  };

  const handleEnd = () => {
    setPaused(true);
    setCurrentTime(0);
    if (videoRef.current) {
      videoRef.current.seek(0);
    }
  };

  const handleError = (err) => {
    console.error('Video playback error:', err);
    setError('Failed to load video');
    setIsLoading(false);
  };

  const handleBuffer = ({ isBuffering }) => {
    setIsLoading(isBuffering);
  };

  // Reset state when modal closes
  useEffect(() => {
    if (!visible) {
      setPaused(true);
      setCurrentTime(0);
      setDuration(0);
      setIsLoading(true);
      setError(null);
      if (videoRef.current) {
        videoRef.current.seek(0);
      }
    }
  }, [visible]);

  // Don't render anything if modal is not visible
  if (!visible || !videoUrl) {
    return null;
  }

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
      supportedOrientations={['portrait', 'landscape']}
    >
      <View style={styles.modalContainer}>
        <StatusBar hidden={isFullscreen} />
        
        {/* Close Button (Top Right) */}
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          activeOpacity={0.8}>
          <Text style={styles.closeButtonText}>✕</Text>
        </TouchableOpacity>

        {/* Video Container */}
        <View
          style={[
            styles.videoContainer,
            isFullscreen && styles.videoContainerFullscreen,
          ]}>
          
          {/* Video Player */}
          <Video
            ref={videoRef}
            source={{ uri: videoUrl }}
            style={[
              styles.video,
              isFullscreen && styles.videoFullscreen,
              style,
            ]}
            paused={paused}
            muted={isMuted}
            resizeMode="contain"
            onLoad={handleLoad}
            onProgress={handleProgress}
            onEnd={handleEnd}
            onError={handleError}
            onBuffer={handleBuffer}
            repeat={false}
            playInBackground={false}
            playWhenInactive={false}
            ignoreSilentSwitch="ignore"
          />

          {/* Loading Indicator */}
          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
            </View>
          )}

          {/* Error Message */}
          {error && (
            <View style={styles.errorContainer}>
              <Text style={styles.errorText}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => {
                  setError(null);
                  setIsLoading(true);
                }}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* Center Play/Pause Button - Always visible when paused */}
          {paused && !error && (
            <TouchableOpacity
              style={styles.centerPlayButton}
              onPress={handlePlayPause}
              activeOpacity={0.8}>
              <PlayIcon width={60} height={60} color="#FFFFFF" />
            </TouchableOpacity>
          )}

          {/* Controls Overlay */}
          {showControls && showControlsOverlay && !error && (
            <View style={styles.controlsOverlay}>
              {/* Bottom Controls */}
              <View style={styles.bottomControls}>
                {/* Timeline Slider */}
                <View style={styles.timelineContainer}>
                  <Text style={styles.timeText}>{formatDuration(currentTime)}</Text>
                  <Slider
                    style={styles.slider}
                    value={currentTime}
                    minimumValue={0}
                    maximumValue={duration}
                    onValueChange={handleSeek}
                    minimumTrackTintColor="#539461"
                    maximumTrackTintColor="#FFFFFF33"
                    thumbTintColor="#539461"
                  />
                  <Text style={styles.timeText}>{formatDuration(duration)}</Text>
                </View>

                {/* Control Buttons */}
                <View style={styles.controlButtons}>
                  {/* Skip Backward -10 seconds */}
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleSkipBackward}
                    activeOpacity={0.8}>
                    <View style={styles.skipButtonContainer}>
                      <SkipBackwardIcon width={24} height={24} color="#FFFFFF" />
                      <Text style={styles.controlButtonLabel}>-10s</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Play/Pause Button */}
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handlePlayPause}
                    activeOpacity={0.8}>
                    {paused ? (
                      <PlayIcon width={24} height={24} color="#FFFFFF" />
                    ) : (
                      <PauseIcon width={24} height={24} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>

                  {/* Skip Forward +10 seconds */}
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleSkipForward}
                    activeOpacity={0.8}>
                    <View style={styles.skipButtonContainer}>
                      <SkipForwardIcon width={24} height={24} color="#FFFFFF" />
                      <Text style={styles.controlButtonLabel}>+10s</Text>
                    </View>
                  </TouchableOpacity>

                  {/* Mute Button */}
                  <TouchableOpacity
                    style={styles.controlButton}
                    onPress={handleMute}
                    activeOpacity={0.8}>
                    {isMuted ? (
                      <MutedVolumeIcon width={24} height={24} color="#FFFFFF" />
                    ) : (
                      <VolumeIcon width={24} height={24} color="#FFFFFF" />
                    )}
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButton: {
    position: 'absolute',
    top: Platform.OS === 'ios' ? 50 : 20,
    right: 20,
    zIndex: 100,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: 'bold',
  },
  videoContainer: {
    width: SCREEN_WIDTH,
    height: SCREEN_HEIGHT, // 100% full screen
    backgroundColor: '#000',
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoContainerFullscreen: {
    width: SCREEN_HEIGHT,
    height: SCREEN_WIDTH,
    transform: [{ rotate: '90deg' }],
  },
  video: {
    width: '100%',
    height: '100%',
    backgroundColor: '#000',
  },
  videoFullscreen: {
    width: '100%',
    height: '100%',
  },
  videoPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  videoPlaceholderText: {
    color: '#FFFFFF',
    fontSize: 16,
  },
  loadingContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  errorContainer: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.8)',
    padding: 20,
  },
  errorText: {
    color: '#FFFFFF',
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 20,
  },
  retryButton: {
    backgroundColor: '#539461',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  controlsOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    zIndex: 10,
  },
  centerPlayButton: {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: [{ translateX: -40 }, { translateY: -40 }],
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: 'rgba(83, 148, 97, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.5,
    shadowRadius: 5,
    elevation: 10,
    zIndex: 20,
  },
  centerPlayButtonText: {
    color: '#FFFFFF',
    fontSize: 32,
    fontWeight: 'bold',
  },
  bottomControls: {
    padding: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
  },
  timelineContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  timeText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '500',
    minWidth: 45,
    textAlign: 'center',
  },
  slider: {
    flex: 1,
    marginHorizontal: 8,
  },
  controlButtons: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
  },
  controlButton: {
    minWidth: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  skipButtonContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  controlButtonText: {
    color: '#FFFFFF',
    fontSize: 20,
    fontWeight: 'bold',
  },
  controlButtonLabel: {
    color: '#FFFFFF',
    fontSize: 10,
    marginTop: -4,
    fontWeight: '500',
  },
});

export default VideoPlayer;
