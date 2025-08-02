import { addDoc, collection, doc, updateDoc } from 'firebase/firestore';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  RtcSurfaceView
} from 'react-native-agora';
import { AGORA_APP_ID } from '../../../config';
import { db } from '../../../firebase';
import { AuthContext } from '../../auth/AuthProvider';

const LiveBroadcastScreen = ({ navigation }) => {
  const rtcEngineRef = useRef(null);
  const { userInfo } = useContext(AuthContext);
  const [joined, setJoined] = useState(false);
  const [liveId, setLiveId] = useState('');
  const [loading, setLoading] = useState(true);
  const timeoutRef = useRef(null);

  // Generate a unique channel name based on user and time
  const channelName = `live_${userInfo.uid}_${Date.now()}`;

  // --- Firestore Logic ---

  const saveLiveSession = async () => {
    try {
      const streamData = {
        sellerId: userInfo.uid,
        channelName,
        productInfo: {
          name: 'Coriandrun Sativum',
          price: '$48.95',
          type: 'Inner Variegated',
          dimension: '2”–4”',
          ups: 'UPS 2nd Day $50',
        },
        isLive: true,
        startedAt: new Date(),
        liveTitle: 'Rare Philodendron Collection',
        thumbnail: 'https://plus.unsplash.com/premium_photo-1675864663002-c330710c6ba0?q=80&w=687&auto=format&fit=crop&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%33D%3D',
        views: 0,
      };

      const liveStream = await addDoc(collection(db, 'liveStreams'), streamData);
      setLiveId(liveStream.id);
    } catch (error) {
      console.error('Error saving live session:', error);
    }
  };

  const updateLiveStream = async () => {
    try {
      if (liveId) {
        await updateDoc(doc(db, 'liveStreams', liveId), {
          isLive: false,
          endedAt: new Date(),
          videoUrl:
            'http://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4',
        });
      }
      navigation.goBack();
    } catch (error) {
      console.error('Error updating live stream:', error);
      navigation.goBack();
    }
  };

  // --- Agora Logic ---

  const joinChannelWithToken = async (token) => {
    const rtc = rtcEngineRef.current;
    if (!rtc) {
      console.error('❌ Agora engine not initialized.');
      return;
    }
    
    // First ensure we're not already in the channel to prevent errors
    try {
      await rtc.leaveChannel();
    } catch (e) {
      // Ignore if not already in channel
      console.log('Not in a channel, safe to join.');
    }

    if (!token) {
      console.error('❌ Token is not available, cannot join channel.');
      setLoading(false); // Stop loading if token is missing
      return;
    }
    
    console.log('🔴 Starting broadcast...');
    console.log('🔄 Channel name:', channelName);
    console.log('🔑 Using token:', token.substring(0, 20) + '...');
    
    try {
      await rtc.joinChannel(token, channelName, userInfo.uid, {});
    } catch (e) {
      console.error('❌ Error joining channel:', e);
      setLoading(false); // Stop loading if joining fails
      // Consider showing an error message to the user here
    }
  };

  const fetchToken = async () => {
    try {
      console.log('🚀 Fetching new token...');
      const response = await fetch(
        `https://a329c26dcdb8.ngrok-free.app/api/agora-token?channelName=${channelName}&uid=${userInfo.uid}&isSubscriber=false`
      );
      const data = await response.json();
      const newToken = data.token;
      
      console.log('✅ Token fetched successfully.');
      return newToken;
    } catch (error) {
      console.error('❌ Error fetching token:', error);
      return null;
    }
  };

  useEffect(() => {
    // This is the main asynchronous setup function for the component
    const startBroadcast = async () => {
      setLoading(true);

      // Request permissions
      if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
      }
      
      // Initialize Agora engine
      const rtc = createAgoraRtcEngine();
      rtcEngineRef.current = rtc;
      rtc.initialize({
        appId: AGORA_APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });

      // Register event handlers
      rtc.registerEventHandler({
        onJoinChannelSuccess: async () => {
          console.log('✅ Joined Channel as Broadcaster');
          setJoined(true);
          setLoading(false);
          // Clear the timeout as we've successfully joined
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }
          // Save the live session to Firestore after successfully joining the channel
          await saveLiveSession();
        },
        onTokenPrivilegeWillExpire: async () => {
          console.log('⚠️ Token privilege will expire. Fetching new token...');
          const newToken = await fetchToken();
          if (newToken) {
            rtcEngineRef.current?.renewToken(newToken);
          }
        },
        onConnectionStateChanged: (state, reason) => {
          console.log('🔌 Connection state changed:', { state, reason });
        },
        onError: async (err) => {
          console.error('❌ Agora Error:', err);
          setLoading(false); // Stop loading on any Agora error
          
          // Clear the timeout as an error occurred
          if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
          }

          // Error code 109 is token expired. Error code 110 is invalid token.
          if (err.code === 109 || err.code === 110) {
            const newToken = await fetchToken();
            if (newToken) {
              rtcEngineRef.current?.renewToken(newToken);
            }
          } else {
            await updateLiveStream();
          }
        },
      });

      // Enable video and set role
      rtc.enableVideo();
      rtc.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      rtc.setupLocalVideo({ uid: userInfo.uid, renderMode: 1 });
      rtc.startPreview();

      // Fetch the token and join the channel
      const token = await fetchToken();
      if (token) {
        joinChannelWithToken(token);
        // Set a timeout to handle potential failures
        timeoutRef.current = setTimeout(() => {
          console.error('❌ Timeout: Failed to join channel after 15 seconds.');
          setLoading(false);
        }, 15000);
      } else {
        setLoading(false);
        console.error('❌ Failed to fetch token. Cannot start broadcast.');
        // Consider showing an error message to the user here
      }
    };

    if (userInfo && userInfo.uid) {
      startBroadcast();
    } else {
      console.error('User info is not available. Cannot start broadcast.');
      setLoading(false);
      // Handle the case where user info is missing
    }

    // Cleanup function for when the component unmounts
    return () => {
      rtcEngineRef.current?.leaveChannel();
      rtcEngineRef.current?.release();
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, [userInfo]); // Re-run effect if userInfo changes

  return (
    <View style={styles.container}>
      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#ffffff" />
          <Text style={styles.loadingText}>Starting Live Stream...</Text>
        </View>
      ) : (
        <>
          {joined && (
            <RtcSurfaceView
              style={styles.video}
              canvas={{ uid: userInfo.uid }}
              zOrderMediaOverlay={true}
            />
          )}
          <View style={styles.overlay}>
            <Text style={styles.label}>🔴 LIVE</Text>
            <Text style={styles.productName}>Premium Watch</Text>
            <Text style={styles.productPrice}>
              ₱1,199 <Text style={styles.oldPrice}>₱1,799</Text>
            </Text>
            <TouchableOpacity onPress={updateLiveStream} style={styles.buyButton}>
              <Text style={styles.buyText}>End Live</Text>
            </TouchableOpacity>
          </View>
        </>
      )}
    </View>
  );
};

export default LiveBroadcastScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    color: '#fff',
    marginTop: 10,
    fontSize: 16,
  },
  video: { flex: 1 },
  overlay: {
    position: 'absolute',
    bottom: 20,
    left: 20,
    right: 20,
    backgroundColor: '#ffffffdd',
    padding: 16,
    borderRadius: 12,
  },
  label: { fontSize: 14, color: 'red', marginBottom: 6 },
  productName: { fontSize: 18, fontWeight: 'bold' },
  productPrice: { fontSize: 16, color: '#e53935' },
  oldPrice: {
    textDecorationLine: 'line-through',
    color: '#999',
    marginLeft: 6,
  },
  buyButton: {
    marginTop: 12,
    backgroundColor: '#ff5252',
    paddingVertical: 10,
    borderRadius: 8,
    alignItems: 'center',
  },
  buyText: { color: '#fff', fontWeight: 'bold' },
});

