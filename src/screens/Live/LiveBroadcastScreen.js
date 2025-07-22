import React, { useEffect, useRef, useState } from 'react';
import {
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
  RtcSurfaceView,
} from 'react-native-agora';

const APP_ID = '77bffba08cc144228a447e99bae16ec1';
const TOKEN = "007eJxTYNCU6kqdJ5U0i8f9wbfvjZtXd7zXSP98w7z2xJyeK9kMzeoKDObmSWlpSYkGFsnJhiYmRkYWiSYm5qmWlkmJqYZmqcmGe5fUZDQEMjKsCTzAwAiFID4bQ2lOamKaCQMDAN91IZY="; // your token here
const CHANNEL_NAME = 'uleaf4';

const LiveBroadcastScreen = ({navigation}) => {
  const rtcEngineRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [token, setToken] = useState(TOKEN);

  // Function to fetch new token and rejoin channel
  const fetchTokenAndRejoin = async () => {
    try {
      // In a real app, you would fetch a new token from your server
      // For now, we'll simulate by using the same token but this is where
      // you would make an API call to get a fresh token
      console.log('⚠️ Token expired, fetching new token');
      
      // For demonstration, using the same token
      const newToken = "007eJxTYNCU6kqdJ5U0i8f9wbfvjZtXd7zXSP98w7z2xJyeK9kMzeoKDObmSWlpSYkGFsnJhiYmRkYWiSYm5qmWlkmJqYZmqcmGe5fUZDQEMjKsCTzAwAiFID4bQ2lOamKaCQMDAN91IZY=";
      
      // Update token state
      setToken(newToken);
      
      // Rejoin channel with the new token
      if (rtcEngineRef.current) {
        console.log('🔄 Rejoining channel with new token');
        rtcEngineRef.current.renewToken(newToken);
      }
    } catch (error) {
      console.error('❌ Error fetching new token:', error);
    }
  };

  useEffect(() => {
    const startBroadcast = async () => {
      if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
      }

      const rtc = createAgoraRtcEngine();
      rtcEngineRef.current = rtc;
      rtc.initialize({
        appId: APP_ID,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });

      rtc.registerEventHandler({
        onJoinChannelSuccess: () => {
          console.log('✅ Joined Channel as Broadcaster');
          setJoined(true);
        },
        onTokenPrivilegeWillExpire: () => {
          console.log('⚠️ Token privilege will expire');
          fetchTokenAndRejoin();
        },
        onConnectionStateChanged: (state, reason) => {
          console.log('🔌 Connection state changed:', { state, reason });
        },
        onError: (err) => {
          console.error('❌ Agora Error:', err);
          
          // Error code 109 is token expired
          if (err === 109) {
            fetchTokenAndRejoin();
          }
        },
      });

      rtc.enableVideo();
      rtc.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      rtc.setupLocalVideo({ uid: 0, renderMode: 1 });
      rtc.startPreview();
      
      console.log('🔴 Starting broadcast with token:', token.substring(0, 20) + '...');
      console.log('🔄 Channel name:', CHANNEL_NAME);
      
      // First ensure we're not already in the channel
      try {
        rtc.leaveChannel();
      } catch (e) {
        // Ignore if not already in channel
      }
      
      // Join with new token
      rtc.joinChannel(token, CHANNEL_NAME, 0, {});


      rtcEngineRef.current = rtc;
    };

    startBroadcast();

    return () => {
      rtcEngineRef.current?.leaveChannel();
      rtcEngineRef.current?.release();
    };
  }, []);

  return (
    <View style={styles.container}>
      {joined && (
        <RtcSurfaceView
          style={styles.video}
          canvas={{ uid: 0 }}
          zOrderMediaOverlay={true}
        />
      )}
      <View style={styles.overlay}>
        <Text style={styles.label}>🔴 LIVE</Text>
        <Text style={styles.productName}>Premium Watch</Text>
        <Text style={styles.productPrice}>₱1,199 <Text style={styles.oldPrice}>₱1,799</Text></Text>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.buyButton}>
          <Text style={styles.buyText}>End Live</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default LiveBroadcastScreen;

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
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
  backButton: {marginRight: 12},
});
