import React, { useEffect, useRef, useState } from 'react';
import {
  FlatList,
  Image,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import {
  ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine
} from 'react-native-agora';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import GuideIcon from '../../../assets/live-icon/guide.svg';
import LoveIcon from '../../../assets/live-icon/love.svg';
import ShareIcon from '../../../assets/live-icon/share.svg';
import ShopIcon from '../../../assets/live-icon/shop.svg';
import TruckIcon from '../../../assets/live-icon/truck.svg';
import ViewersIcon from '../../../assets/live-icon/viewers.svg';

const APP_ID = '21933735957640729e77e09a0b02f7f1';
const TOKEN = '007eJxTYOjdYPP9VUjF9qfPn6575RipZbcggj+znmme85/dDWK2azsUGIwMLY2NzY1NLU3NzUwMzI0sU83NUw0sEw2SDIzSzNMMPydWZTQEMjLMaaxkZGSAQBCfjaE0JzUxzYSBAQDPsiBi'; // your token here
const CHANNEL_NAME = 'uleaf4';

const BuyerLiveStreamScreen = ({navigation}) => {
  const [joined, setJoined] = useState(false);
  const rtcEngineRef = useRef(null);
  const [remoteUid, setRemoteUid] = useState(0);
  const [viewerCount, setViewerCount] = useState(0);

  // Mocked chat messages
  const chatData = [
    { id: '1', name: 'Chloe Bennett', message: 'Joined 👋', avatar: 'https://i.pravatar.cc/40?img=1' },
    { id: '2', name: 'Ashley Carter', message: 'Leaf it to this plant to steal the show 😁', avatar: 'https://i.pravatar.cc/40?img=2' },
    { id: '3', name: 'Dylan Brooks', message: 'Look at those variegated leaves, absolute stunner!😍', avatar: 'https://i.pravatar.cc/40?img=3' },
  ];

  useEffect(() => {
    const startAgora = async () => {
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
          console.log('✅ Joined Channel as viewer');
          setJoined(true);
        },
        onUserJoined: (uid) => {
          console.log('👤 Remote user joined:', uid);
          rtc.setupRemoteVideo({ uid: uid.localUid, renderMode: 1 }); // ✅
          setRemoteUid(uid.localUid);
          setViewerCount((prev) => prev + 1);
        },
        onUserOffline: (uid, reason) => {
          console.log('Broadcaster left:', uid);
          setRemoteUid(null);
          setJoined(false);
          setViewerCount((prev) => Math.max(prev - 1, 0));
        },
        onRemoteVideoStateChanged: (uid, state, reason, elapsed) => {
          console.log('📹 Remote video state:', { uid, state, reason, elapsed });
        },
        onError: (err) => {
          console.error('❌ Agora Error:', err);
        },

      });
      
      rtc.enableVideo();
      rtc.setClientRole(ClientRoleType.ClientRoleAudience);
      
      rtc.joinChannel(TOKEN, CHANNEL_NAME, 0, {});
      rtcEngineRef.current = rtc;
    }

    startAgora();

    return () => {
      const engine = rtcEngineRef.current;
      if (engine) {
        engine.leaveChannel();
        engine.release();
        rtcEngineRef.current = null;
      }
    };
  }, []);

  return (
     <View style={styles.container}>
      <View style={styles.stream}>
        {joined && remoteUid ? (
        <RtcSurfaceView
            style={styles.video}
            canvas={{ uid: remoteUid }}
            zOrderMediaOverlay={true}
          />
        ) : (
          <Text style={styles.connectingText}>Connecting to live stream...</Text>
        )}

      </View>
      <View style={styles.topBar}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                <BackSolidIcon width={24} height={24} color="#333" />
        </TouchableOpacity>
        <View style={styles.topAction}>
          <TouchableOpacity style={styles.guide}>
                <GuideIcon width={19} height={19} />
                <Text style={styles.guideText}>Guide</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.liveViewer}>
                <ViewersIcon width={24} height={24} />
                <Text style={styles.liveViewerText}>232</Text>
          </TouchableOpacity>
        </View>

      </View>
      <View style={styles.actionBar}>
        <View style={styles.social}>
          <View style={styles.comments}>
            <FlatList
              data={chatData}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <View style={styles.commentRow}>
                  <Image source={{ uri: item.avatar }} style={styles.avatar} />
                  <View style={styles.commentContent}>
                    <Text style={styles.chatName}>{item.name}</Text>
                    <Text style={styles.chatMessage}>{item.message}</Text>
                  </View>
                </View>
              )}
            />
            <TextInput
              style={styles.commentInput}
              placeholder="Comment"
              placeholderTextColor="#888"
            />

          </View>
          <View style={styles.sideActions}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.sideAction}>
                <LoveIcon width={40} height={40} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.sideAction}>
                <ShareIcon width={40} height={40} />
              </TouchableOpacity>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.sideAction}>
                <ShopIcon width={40} height={40} />
              </TouchableOpacity>
          </View>
        </View>
        <View style={styles.shop}>
            <View style={styles.plant}>
              <View style={styles.plantDetails}>
                <View style={styles.plantName}>
                  <Text style={styles.name}>Coriandrum Sativum</Text>
                  <Text style={styles.variegation}>Inner Variegated · 2”–4”</Text>
                </View>
                <View style={styles.price}>
                  <Text style={styles.plantPrice}>$48.95</Text>
                  <View style={styles.discount}>
                    <Text style={styles.discountText}>33% OFF</Text>
                  </View>
                </View>
                
              </View>
              <View style={styles.shipping}>
                  <View style={styles.shippingType}>
                    <Text style={styles.shippingDetails}>Grower’s Choice</Text>
                  </View>
                  <View style={styles.shipDays}>
                    <TruckIcon width={24} height={24} />
                    <Text style={styles.shipText}>UPS 2nd Day $50</Text>
                  </View>
                </View>
            </View>
            <View style={styles.actionButton}>
              <TouchableOpacity style={styles.actionButtonTouch}>
                <Text style={styles.actionText}>Buy Now</Text>
              </TouchableOpacity>
            </View>
        </View>
      </View>
    </View>
  );
};

export default BuyerLiveStreamScreen;

const baseFont = {
  fontFamily: 'Inter',
  fontStyle: 'normal',
  color: '#FFFFFF',
};

const styles = StyleSheet.create({
  container: { 
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 48,
    paddingBottom: 34,
    backgroundColor: '#000',
  },
  stream: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: '#444',
  },
  video: { flex: 1 },
  connectingText: {
    ...baseFont,
    fontWeight: '500',
    fontSize: 16,
    marginTop: 200,
    alignSelf: 'center',
  },
  topBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 15,
    gap: 12,
    width: 375,
    height: 58,
    alignSelf: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 4,
    height: 32,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 12,
  },
  topAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 178,
    height: 34,
  },
  guide: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    height: 34,
    backgroundColor: '#414649',
    borderRadius: 12,
  },
  guideIcon: { width: 34, height: 34 },
  guideText: {
    ...baseFont,
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    marginLeft: 3,
  },
  liveViewer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 4,
    paddingHorizontal: 12,
    gap: 6,
    width: 85,
    height: 34,
    backgroundColor: '#539461',
    borderRadius: 12,
  },
  liveViewerText: {
    ...baseFont,
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
  },
  actionBar: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    paddingHorizontal: 8,
    gap: 12,
    width: 375,
    height: 447,
    alignSelf: 'center',
  },
  social: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    width: 359,
    height: 253,
  },
  comments: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    gap: 16,
    width: 260,
    height: 253,
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    width: 260,
    height: 41,
    marginVertical: 15,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: '#539461',
  },
  commentContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    width: 228,
    height: 41,
  },
  chatName: {
    ...baseFont,
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 17,
  },
  chatMessage: {
    ...baseFont,
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
  },
  commentInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
    paddingHorizontal: 16,
    gap: 8,
    width: 260,
    height: 38,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  sideActions: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingHorizontal: 8,
    gap: 20,
    width: 56,
    height: 160,
  },
  sideAction: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
  },
  shop: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    width: 359,
    height: 182,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 16,
  },
  plant: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    width: 327,
    height: 90,
  },
  plantDetails: {
    flexDirection: 'row',
    gap: 8,
    width: 327,
    height: 50,
  },
  plantName: {
    flexDirection: 'column',
    gap: 4,
    width: 247,
    height: 50,
  },
  name: {
    ...baseFont,
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
  },
  variegation: {
    ...baseFont,
    color: '#CDD3D4',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
  },
  price: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    gap: 6,
    width: 72,
    height: 50,
  },
  plantPrice: {
    ...baseFont,
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
  },
  discount: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 6,
    width: 71,
    height: 20,
    backgroundColor: '#FFE7E2',
    borderRadius: 6,
  },
  discountText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#E7522F',
  },
  shipping: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 327,
    height: 28,
  },
  shippingType: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.24)',
    borderRadius: 8,
  },
  shippingDetails: {
    ...baseFont,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
  },
  shipDays: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 2,
    paddingHorizontal: 8,
    gap: 6,
    borderRadius: 8,
  },
  shipText: {
    ...baseFont,
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    width: 327,
    height: 48,
  },
  actionButtonTouch: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    width: 327,
    height: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
  },
  actionText: {
    ...baseFont,
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
  },
});
