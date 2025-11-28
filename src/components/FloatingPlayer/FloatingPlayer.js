import React, { useRef, useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Animated,
  PanResponder,
  Platform,
} from 'react-native';
import { RtcSurfaceView, RtcTextureView } from 'react-native-agora';
import { useFloatingPlayer } from '../../contexts/FloatingPlayerContext';
import { useNavigation } from '@react-navigation/native';
import { doc, onSnapshot } from 'firebase/firestore';
import { db } from '../../../firebase';

// SVG Icons
import CloseIcon from '../../assets/live-icon/close-x.svg';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

// Portrait aspect ratio (9:16 like phone screen)
const MINI_PLAYER_WIDTH = 140;
const MINI_PLAYER_HEIGHT = 249; // 16:9 ratio vertically (like TikTok/Instagram)
const MARGIN = 16;

const FloatingPlayer = () => {
  const { isVisible, isMinimized, streamData, remoteUid, streamEnded, hideFloatingPlayer, toggleMinimize, markStreamEnded } = useFloatingPlayer();
  const navigation = useNavigation();

  // Position state
  const pan = useRef(new Animated.ValueXY({ 
    x: SCREEN_WIDTH - MINI_PLAYER_WIDTH - MARGIN, 
    y: SCREEN_HEIGHT - MINI_PLAYER_HEIGHT - 100 
  })).current;

  const [isDragging, setIsDragging] = useState(false);

  // Listen for live session status changes
  useEffect(() => {
    if (!streamData?.sessionId || !isVisible) return;

    console.log('[FloatingPlayer] Setting up live session listener for:', streamData.sessionId);
    
    const sessionDocRef = doc(db, 'live', streamData.sessionId);
    const unsubscribe = onSnapshot(sessionDocRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        console.log('[FloatingPlayer] Live session status:', data.status);
        
        if (data.status === 'ended') {
          console.log('[FloatingPlayer] Live session ended, showing message');
          markStreamEnded();
        }
      } else {
        console.log('[FloatingPlayer] Live session document no longer exists');
        markStreamEnded();
      }
    });

    return () => {
      console.log('[FloatingPlayer] Cleaning up live session listener');
      unsubscribe();
    };
  }, [streamData?.sessionId, isVisible, markStreamEnded]);

  // Pan responder for dragging
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        // Only start dragging if moved more than 5px
        return Math.abs(gestureState.dx) > 5 || Math.abs(gestureState.dy) > 5;
      },
      onPanResponderGrant: () => {
        setIsDragging(true);
        pan.setOffset({
          x: pan.x._value,
          y: pan.y._value,
        });
        pan.setValue({ x: 0, y: 0 });
      },
      onPanResponderMove: Animated.event(
        [null, { dx: pan.x, dy: pan.y }],
        { useNativeDriver: false }
      ),
      onPanResponderRelease: (_, gestureState) => {
        setIsDragging(false);
        pan.flattenOffset();

        // Get final position
        let finalX = pan.x._value;
        let finalY = pan.y._value;

        // Snap to edges with boundaries
        const maxX = SCREEN_WIDTH - MINI_PLAYER_WIDTH - MARGIN;
        const maxY = SCREEN_HEIGHT - MINI_PLAYER_HEIGHT - MARGIN;

        // Constrain to screen bounds
        finalX = Math.max(MARGIN, Math.min(finalX, maxX));
        finalY = Math.max(MARGIN, Math.min(finalY, maxY));

        // Snap to nearest edge (left or right)
        if (finalX < SCREEN_WIDTH / 2) {
          finalX = MARGIN;
        } else {
          finalX = maxX;
        }

        // Animate to final position
        Animated.spring(pan, {
          toValue: { x: finalX, y: finalY },
          useNativeDriver: false,
          friction: 7,
        }).start();
      },
    })
  ).current;

  const handleClose = () => {
    hideFloatingPlayer();
  };

  const handleExpand = () => {
    if (streamData?.sessionId) {
      // Navigate back to full live screen
      navigation.navigate('BuyerLiveStreamScreen', {
        sessionId: streamData.sessionId,
        broadcasterId: streamData.broadcasterId,
        fromFloating: true,
      });
      hideFloatingPlayer();
    }
  };

  if (!isVisible || !isMinimized) {
    return null;
  }

  console.log('[FloatingPlayer Render] RemoteUid:', remoteUid, 'Visible:', isVisible, 'Minimized:', isMinimized);

  if (!remoteUid) {
    console.warn('[FloatingPlayer] No remoteUid available');
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          transform: [{ translateX: pan.x }, { translateY: pan.y }],
        },
        isDragging && styles.dragging,
      ]}
      {...panResponder.panHandlers}
    >
      <View style={styles.videoContainer}>
        {streamEnded ? (
          <View style={styles.endedContainer}>
            <Text style={styles.endedTitle}>Live Ended</Text>
            <Text style={styles.endedMessage}>This live stream has ended</Text>
            <TouchableOpacity onPress={handleClose} style={styles.endedButton}>
              <Text style={styles.endedButtonText}>Close</Text>
            </TouchableOpacity>
          </View>
        ) : remoteUid ? (
          Platform.OS === 'ios' ? (
            <RtcSurfaceView
              style={styles.video}
              canvas={{
                uid: remoteUid,
                renderMode: 1, // FIT mode
                mirrorMode: 0,
              }}
              zOrderMediaOverlay={false}
            />
          ) : (
            <RtcTextureView
              style={styles.video}
              canvas={{
                uid: remoteUid,
                renderMode: 1, // FIT mode
                mirrorMode: 0,
              }}
              zOrderMediaOverlay={false}
            />
          )
        ) : (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading...</Text>
          </View>
        )}

        {/* Overlay controls */}
        <View style={styles.overlayTop}>
          <View style={styles.liveIndicator}>
            <View style={styles.liveDot} />
            <Text style={styles.liveText}>LIVE</Text>
          </View>
          <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
            <CloseIcon width={16} height={16} color="#FFF" />
          </TouchableOpacity>
        </View>

        <View style={styles.overlayBottom}>
          <Text style={styles.streamTitle} numberOfLines={1}>
            {streamData?.title || 'Live Stream'}
          </Text>
          <TouchableOpacity onPress={handleExpand} style={styles.expandButton}>
            <Text style={styles.expandText}>⛶</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    width: MINI_PLAYER_WIDTH,
    height: MINI_PLAYER_HEIGHT,
    zIndex: 9999,
    elevation: 10,
  },
  dragging: {
    opacity: 0.9,
  },
  videoContainer: {
    flex: 1,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    borderWidth: 2,
    borderColor: '#539461',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  video: {
    flex: 1,
  },
  overlayTop: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  liveIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(231, 76, 60, 0.9)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  liveDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#FFF',
    marginRight: 4,
  },
  liveText: {
    color: '#FFF',
    fontSize: 10,
    fontWeight: 'bold',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  overlayBottom: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
  },
  streamTitle: {
    flex: 1,
    color: '#FFF',
    fontSize: 11,
    fontWeight: '600',
    marginRight: 8,
  },
  expandButton: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: 'rgba(83, 148, 97, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  expandText: {
    color: '#FFF',
    fontSize: 16,
    fontWeight: 'bold',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#000',
  },
  loadingText: {
    color: '#FFF',
    fontSize: 12,
  },
  endedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#1a1a1a',
    padding: 20,
  },
  endedTitle: {
    color: '#FFF',
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  endedMessage: {
    color: '#CCC',
    fontSize: 13,
    textAlign: 'center',
    marginBottom: 20,
  },
  endedButton: {
    backgroundColor: '#539461',
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  endedButtonText: {
    color: '#FFF',
    fontSize: 14,
    fontWeight: '600',
  },
});

export default FloatingPlayer;

