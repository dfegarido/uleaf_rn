import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
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
  createAgoraRtcEngine,
  RtcSurfaceView,
} from 'react-native-agora';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import LoveIcon from '../../assets/live-icon/love.svg';
import ReverseCameraIcon from '../../assets/live-icon/reverse-camera.svg';
import ShareIcon from '../../assets/live-icon/share.svg';
import ShopIcon from '../../assets/live-icon/shop.svg';
import TruckIcon from '../../assets/live-icon/truck.svg';
import ViewersIcon from '../../assets/live-icon/viewers.svg';
import { AuthContext } from '../../auth/AuthProvider';
import { generateAgoraToken } from '../../components/Api/agoraLiveApi';
import CreateLiveListingScreen from './CreateLiveListingScreen'; // Import the modal component

const APP_ID = '8ebb97041b6840eab002f6c0335488f6';

const LiveBroadcastScreen = ({navigation, route}) => {
  const { userInfo } = useContext(AuthContext);
  const [asyncUserInfo, setAsyncUserInfo] = useState(null);
  const rtcEngineRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [token, setToken] = useState('');
  const [uid, setUid] = useState(userInfo.uid);
  const [error, setError] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [isCreateListingModalVisible, setCreateListingModalVisible] = useState(false); // New state for modal visibility

    // Mocked chat messages
  const chatData = [
    { id: '1', name: 'Chloe Bennett', message: 'Joined 👋', avatar: 'https://i.pravatar.cc/40?img=1' },
    { id: '2', name: 'Ashley Carter', message: 'Leaf it to this plant to steal the show 😁', avatar: 'https://i.pravatar.cc/40?img=2' },
    { id: '3', name: 'Dylan Brooks', message: 'Look at those variegated leaves, absolute stunner!😍', avatar: 'https://i.pravatar.cc/40?img=3' },
  ];
  
  const currentUserInfo = userInfo || asyncUserInfo;
  const [channelName, setChannelName] = useState('ileafU');
  const [sessionId, setSessionId] = useState(route.params?.sessionId);


  const fetchToken = async () => {
    try {
      const response = await generateAgoraToken(channelName);
      
      console.log('New token:', response);
      
      // Update token state
      setToken(response.token);
      
    } catch (error) {
      console.error('Error fetching token:', error);
    }
  };

  // Function to fetch new token and rejoin channel
  const fetchTokenAndRejoin = async () => {
    try {
      // In a real app, you would fetch a new token from your server
      // For now, we'll simulate by using the same token but this is where
      // you would make an API call to get a fresh token
      console.log('⚠️ Token expired, fetching new token');
      
      const response = await generateAgoraToken(channelName);
      setToken(response.token);
      // Rejoin channel with the new token
      if (rtcEngineRef.current) {
        console.log('🔄 Rejoining channel with new token');
        rtcEngineRef.current.renewToken(response.token);
      }
    } catch (error) {
      console.error('❌ Error fetching new token:', error);
    }
  };

  useEffect(() => {
    // Fetch the token when the component mounts
    setUid(userInfo.uid);
    fetchToken();

    // Ensure the engine is released before starting.
    // This is crucial for hot-reloading in development and for re-entering the screen.
    const cleanup = () => {
      rtcEngineRef.current?.leaveChannel();
      rtcEngineRef.current?.release();
    };

    const startBroadcast = async () => {
      // Do not proceed if the token is not yet available.
      if (!token) {
        console.log('Waiting for token...');
        return;
      }

      if (Platform.OS === 'android') {
        await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);
      }

      // If an engine instance already exists, release it first.
      if (rtcEngineRef.current) {
        console.log('Releasing previous Agora engine instance...');
        rtcEngineRef.current.release();
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
          
          // Error codes 109 (Token Expired) and 110 (Invalid Token)
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
      console.log('🔄 Channel name:', channelName);
      
      // Join the channel
      rtc.joinChannel(token, channelName, 0, {});


      rtcEngineRef.current = rtc;
    };

    startBroadcast();

    return () => {
      cleanup();
    };
  }, [token, channelName]); // Re-run this effect if the token or channelName changes

  return (
       <SafeAreaView style={styles.container}>
        <View style={styles.stream}>
          {joined ? (
            <RtcSurfaceView
              style={styles.video}
              canvas={{
                uid: 0,
                renderMode: 1, // FIT mode
                mirrorMode: 0  // No mirror
              }}
              zOrderMediaOverlay={true}
            />
          ) : (
            <View style={styles.connectingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.connectingText}>
                {error ? 
                  `Error: ${error}` : 
                  (joined ? "Waiting for broadcaster to start stream..." : "Connecting to live stream...")}
              </Text>
            </View>
          )}
        </View>
        
        {/* Only show UI components when stream is active */}
        {joined && (
          <>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
                      <BackSolidIcon width={24} height={24} color="#333" />
              </TouchableOpacity>
              <View style={styles.topAction}>
                <TouchableOpacity style={styles.guide}>
                      <ReverseCameraIcon width={19} height={19} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.liveViewer}>
                      <ViewersIcon width={24} height={24} />
                      <Text style={styles.liveViewerText}>{viewerCount}</Text>
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
                  <LoveIcon />
                  <Text>0</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={() => navigation.goBack()} style={styles.sideAction}>
                  <ShareIcon onPress={() => setCreateListingModalVisible(true)} />
                </TouchableOpacity>
                <TouchableOpacity 
                  style={styles.sideAction}
                >
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
          </>
        )}

        {/* Render the CreateLiveListingScreen as a modal */}
        <CreateLiveListingScreen
          isVisible={isCreateListingModalVisible}
          onClose={() => setCreateListingModalVisible(false)}
          sessionId={sessionId}
          navigation={navigation}
        />
      </SafeAreaView>
    );
};

export default LiveBroadcastScreen;

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
    alignSelf: 'center',
    marginTop: 16,
  },
  connectingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#444',
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
    justifyContent: 'flex-end',
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
