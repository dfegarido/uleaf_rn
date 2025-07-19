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

const APP_ID = '21933735957640729e77e09a0b02f7f1';
const TOKEN = '007eJxTYOjdYPP9VUjF9qfPn6575RipZbcggj+znmme85/dDWK2azsUGIwMLY2NzY1NLU3NzUwMzI0sU83NUw0sEw2SDIzSzNMMPydWZTQEMjLMaaxkZGSAQBCfjaE0JzUxzYSBAQDPsiBi'; // your token here
const CHANNEL_NAME = 'uleaf4';

const LiveBroadcastScreen = ({navigation}) => {
  const rtcEngineRef = useRef(null);
  const [joined, setJoined] = useState(false);

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
        onError: (err) => {
          console.error('❌ Agora Error:', err);
        },
      });

      rtc.enableVideo();
      rtc.setClientRole(ClientRoleType.ClientRoleBroadcaster);
      rtc.setupLocalVideo({ uid: 0, renderMode: 1 });
      rtc.startPreview();
      rtc.joinChannel(TOKEN, CHANNEL_NAME, 0, {});


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
