import {
  addDoc,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
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
import { db } from '../../../firebase';
import BackSolidIcon from '../../assets/icons/white/caret-left-regular.svg';
import LoveIcon from '../../assets/live-icon/love.svg';
import MicOffIcon from '../../assets/live-icon/muted.svg';
import MicOnIcon from '../../assets/live-icon/unmuted.svg';

import KeepAwake from 'react-native-keep-awake';
import CaretDown from '../../assets/icons/white/caret-down.svg';
import CaretUp from '../../assets/icons/white/caret-up.svg';
import NoteIcon from '../../assets/live-icon/notes.svg';
import ReverseCameraIcon from '../../assets/live-icon/reverse-camera.svg';
import TruckIcon from '../../assets/live-icon/truck.svg';
import ViewersIcon from '../../assets/live-icon/viewers.svg';
import { AuthContext } from '../../auth/AuthProvider';
import { generateAgoraToken, updateLiveSessionStatusApi } from '../../components/Api/agoraLiveApi';
import CreateLiveListingScreen from './CreateLiveListingScreen'; // Import the modal component
import LiveListingsModal from './LiveListingsModal'; // Import the new modal

const LiveBroadcastScreen = ({navigation, route}) => {
  const { userInfo } = useContext(AuthContext);
  const [asyncUserInfo, setAsyncUserInfo] = useState(null);
  const rtcEngineRef = useRef(null);
  const [joined, setJoined] = useState(false);
  const [token, setToken] = useState(null);
  const [uid, setUid] = useState(null);
  const [error, setError] = useState(null);
  const [liveStats, setLiveStats] = useState({ viewerCount: 0, likeCount: 0 });
  const [sessionDetails, setSessionDetails] = useState(null);
  const [isCreateListingModalVisible, setCreateListingModalVisible] = useState(false); // New state for modal visibility
  const [isLiveListingModalVisible, setLiveListingModalVisible] = useState(false); // State for the listings modal
  const [activeListing, setActiveListing] = useState(null); // State for the currently displayed listing
  const [appId, setAppId] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  
  const [isStickyNoteModalVisible, setStickyNoteModalVisible] = useState(false);
  const [stickyNoteText, setStickyNoteText] = useState('');

  const currentUserInfo = userInfo || asyncUserInfo;
  const [isMuted, setIsMuted] = useState(false);
  const [channelName, setChannelName] = useState(null);
  const [sessionId, setSessionId] = useState(route.params?.sessionId);
  const [isLive, setIsLive] = useState(false);
  const flatListRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isJoinListExpanded, setJoinListExpanded] = useState(false);
  const [uniqueJoinedUsers, setUniqueJoinedUsers] = useState([]);
  const [lastJoinedUser, setLastJoinedUser] = useState(null);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [soldToUser, setSoldToUser] = useState(null);
  const [isCommentFocused, setIsCommentFocused] = useState(false);

  useEffect(() => {
      KeepAwake.activate();
      return () => KeepAwake.deactivate();
  }, [joined]);

  const updateLiveStatus = async (newStatus) => {
    setIsLoading(true);
    const response = await updateLiveSessionStatusApi(sessionId, newStatus);
      if (response?.success && response?.newStatus === 'live') {
        setIsLive(true);
        setIsLoading(false);
      } else {
        setIsLive(false);
        setIsLoading(false);
        if (navigation.canGoBack()) {
          navigation.goBack();
        } else {
          navigation.navigate('Live');
        }
      }
  }

  const updateLiveSessionStatus = async (newStatus) => {
    try {
      if (newStatus === 'ended') {
        Alert.alert(
          "End Live Session",
          "Are you sure you want to end the live session?",
          [
            { 
              text: "Yes",
              onPress: () => updateLiveStatus(newStatus)
            },
            { 
              text: "No",
              onPress: () => navigation.canGoBack() ? navigation.goBack() : navigation.navigate('Live')
            },
            { 
              text: "Cancel",
            }
          ]
        );
      } else {
        await updateLiveStatus(newStatus);
      }
    } catch (error) {
      console.error('Error updating live session status:', error);
    }
  }

  const fetchToken = async () => {
    try {
      // The channel name for the session is the sessionId
      const response = await generateAgoraToken(sessionId);
     
      console.log('Fetched token response:', response);
      
      if (response.token && response.appId && response.channelName) {
        setToken(response.token);
        setAppId(response.appId);
        setChannelName(response.channelName);
        setUid(response.agoraUid);
      } else {
        throw new Error(response.error || 'Invalid token response from server');
      }
      
    } catch (error) {
      console.error('Error fetching token:', error);
      setError(error.message);
    }
  };

  // Function to fetch new token and rejoin channel
  const fetchTokenAndRejoin = async () => {
    try {
      // In a real app, you would fetch a new token from your server
      // For now, we'll simulate by using the same token but this is where
      // you would make an API call to get a fresh token
      console.log('⚠️ Token expired, fetching new token');
      
      const response = await generateAgoraToken(sessionId, uid);
      console.log('Fetched token response:', response);
      if (response.token) {
        setToken(response.token);
      }
      // Rejoin channel with the new token
      if (rtcEngineRef.current) {
        console.log('🔄 Rejoining channel with new token');
        rtcEngineRef.current.renewToken(response.token);
      }
    } catch (error) {
      console.error('❌ Error fetching new token:', error);
    }
  };

  // Effect to handle permissions on mount
  useEffect(() => {
    const requestPermissions = async () => {
      if (Platform.OS === 'android') {
        const permissions = await PermissionsAndroid.requestMultiple([
          PermissionsAndroid.PERMISSIONS.CAMERA,
          PermissionsAndroid.PERMISSIONS.RECORD_AUDIO,
        ]);

        if (
          permissions[PermissionsAndroid.PERMISSIONS.CAMERA] === 'granted' &&
          permissions[PermissionsAndroid.PERMISSIONS.RECORD_AUDIO] === 'granted'
        ) {
          setPermissionsGranted(true);
        } else {
          Alert.alert('Permissions required', 'Camera and microphone permissions are required to start a broadcast.');
          navigation.goBack();
        }
      } else {
        setPermissionsGranted(true); // For iOS, assume permissions are handled by Info.plist
      }
    };
    requestPermissions();
  }, [navigation]);

  const handleSwitchCamera = () => {
    if (rtcEngineRef.current) {
      console.log('🔄 Switching camera...');
      rtcEngineRef.current.switchCamera();
    }
  };

  const handleMuteToggle = () => {
    if (rtcEngineRef.current) {
      const newMutedState = !isMuted;
      rtcEngineRef.current.muteLocalAudioStream(newMutedState);
      setIsMuted(newMutedState);
      console.log(`🎤 Audio muted: ${newMutedState}`);
    }
  };

  useEffect(() => {
    // Fetch the token when the component mounts
    fetchToken();

    // Ensure the engine is released before starting.
    // This is crucial for hot-reloading in development and for re-entering the screen.
    const cleanup = () => {
      rtcEngineRef.current?.leaveChannel();
      rtcEngineRef.current?.release();
      rtcEngineRef.current = null;
    };

    const startBroadcast = async () => {
      if (!token || !appId || !channelName) {
        console.log('Waiting for token, appId, channelName, and uid...');
        return;
      }

      // If an engine instance already exists, release it first.
      if (rtcEngineRef.current) {
        console.log('Releasing previous Agora engine instance...');
        rtcEngineRef.current.release();
      }

      const rtc = createAgoraRtcEngine();
      rtcEngineRef.current = rtc;
      rtc.initialize({
        appId: appId,
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
      rtc.setClientRole(ClientRoleType.ClientRoleBroadcaster); // Set role before joining
      rtc.setupLocalVideo({ uid: 0, renderMode: 1 }); // Use uid 0 for local video
      rtc.startPreview();
      
      console.log('🔴 Starting broadcast with token:', token.substring(0, 20) + '...');
      console.log('🔄 Channel name:', channelName);
      console.log('🔄 UID:', uid);
      
      // Join the channel
      rtc.joinChannel(token, channelName, 0, {});


      rtcEngineRef.current = rtc;
    };

    if (token && permissionsGranted) {
      startBroadcast();
    }

    return () => {
      cleanup();
    };
  }, [token, appId, channelName, permissionsGranted, sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    const sessionDocRef = doc(db, 'live', sessionId);

    const unsubscribe = onSnapshot(sessionDocRef, (doc) => {
      if (doc.exists()) {
        const data = doc.data();
        setSessionDetails(data);
        setLiveStats({
          viewerCount: data.viewerCount || 0,
          likeCount: data.likeCount || 0,
        });

        const joinNotifications = data?.joiners || [];
        
        setUniqueJoinedUsers([...new Map(joinNotifications.slice().reverse().map(item => [item.uid, item])).values()])
        setLastJoinedUser(joinNotifications.length > 0 ? joinNotifications[joinNotifications.length - 1] : null)

        setStickyNoteText(data.stickyNote || '');
      } else {
        console.log('Live session document does not exist.');
      }
    });

    // Cleanup listener on component unmount
    return () => unsubscribe();
  }, [sessionId]);

  // Effect for fetching comments
  useEffect(() => {
    if (!sessionId) return;

    const commentsCollectionRef = collection(db, 'live', sessionId, 'comments');
    const q = query(commentsCollectionRef, orderBy('createdAt', 'asc'));

    const unsubscribe = onSnapshot(q, (querySnapshot) => {
      const fetchedComments = [];
      querySnapshot.forEach((doc) => {
        fetchedComments.push({ id: doc.id, ...doc.data() });
      });
      setComments(fetchedComments);
    });

    return () => unsubscribe();
  }, [sessionId]);

  useEffect(() => {
      if (comments.length > 0) {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
  }, [comments]); // This effect runs whenever 'messages' array changes

  const handleSendComment = async () => {
    const commentToSend = newComment;
    if (commentToSend.trim() === '' || !sessionId || !currentUserInfo) return;
    setNewComment(''); // Clear input after sending

    try {
      const commentsCollectionRef = collection(db, 'live', sessionId, 'comments');
      
      await addDoc(commentsCollectionRef, {
        message: commentToSend,
        name: `${currentUserInfo.gardenOrCompanyName}`,
        avatar: currentUserInfo?.profileImage || `https://gravatar.com/avatar/19bb7c35f91e5f6c47e80697c398d70f?s=400&d=mp&r=x`, // Fallback avatar
        uid: currentUserInfo.uid,
        createdAt: serverTimestamp(),
      });
    } catch (error) {
      console.error('Error sending comment:', error);
    }
  };

  const handleOpenStickyNote = async () => {
    if (!sessionId) return;
    const sessionDocRef = doc(db, 'live', sessionId);
    const docSnap = await getDoc(sessionDocRef);
    if (docSnap.exists()) {
      setStickyNoteText(docSnap.data().stickyNote || '');
    }
    setStickyNoteModalVisible(true);
  };

    const formatViewersLikes = (data) => {
      // Use 'en-US' locale, compact notation, and 0-1 fraction digits
      const formatter = new Intl.NumberFormat('en-US', {
        notation: 'compact',
        maximumFractionDigits: 1
      });

      return formatter.format(data);
    }

  const handleSaveStickyNote = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      const sessionDocRef = doc(db, 'live', sessionId);
      await updateDoc(sessionDocRef, { stickyNote: stickyNoteText });
      setStickyNoteModalVisible(false);
    } catch (err) {
      Alert.alert('Error', 'Could not save sticky notes.');
    } finally {
      setIsLoading(false);
    }
  };
  // When a new active listing is set from the modal, update the UI
  // const handleActiveListingSet = async () => {
  //   if (sessionId) {
  //       const activeListingRes = await getActiveLiveListingApi();
            
  //     if (activeListingRes?.success) {
  //       setActiveListing(activeListingRes.data);
  //       setLoading(false);
  //     }
  //   }
    
  // };

 //get active listing
  useEffect(() => {
      if (!sessionId) return;

      const listingsCollectionRef = collection(db, 'listing');
      const q = query(
        listingsCollectionRef,
        where('isActiveLiveListing', '==', true),
        where('sellerCode', '==', currentUserInfo.uid)
      );
  
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        if (!querySnapshot.empty) {
          const activeDoc = querySnapshot.docs[0];
          console.log('Active listing found:', activeDoc.id, activeDoc.data());
          
          setActiveListing({ id: activeDoc.id, ...activeDoc.data() });
        } else {
          setActiveListing(null);
        }
      });
  
      return () => unsubscribe();
  }, [sessionId]);

  // Effect to fetch order for the active listing
  useEffect(() => {
    if (!activeListing?.id) {
      setSoldToUser(null); // Reset when there's no active listing
      return;
    }
console.log('activeListing?.id', activeListing?.id);

    const orderCollectionRef = collection(db, 'order');
    const q = query(orderCollectionRef, where('listingId', '==', activeListing.id), where('status', '==', 'Ready to Fly'));

    const unsubscribe = onSnapshot(q, async (querySnapshot) => {
      if (!querySnapshot.empty) {
        const orderData = querySnapshot.docs[0].data();
        
        const buyerQuery = query(
                          collection(db, 'buyer'),
                          where('uid', '==', orderData.buyerUid)
        );
        const buyerSnapshot = await getDocs(buyerQuery);
        if (!buyerSnapshot.empty) {
          const buyerData = buyerSnapshot.docs[0].data();
          
          setSoldToUser(`@${buyerData.username}`); 
        } else {
          setSoldToUser(null); // Buyer not found
        }
      } else {
        setSoldToUser(null); // No pending payment order found
      }
    });
    return () => unsubscribe();
  }, [activeListing]);

  return (
       <SafeAreaView style={styles.container}>
        {isLoading && (
                <Modal transparent animationType="fade">
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#699E73" />
                  </View>
                </Modal>
              )}
        <View style={styles.stream}>
          {joined ? (
            <RtcSurfaceView
              style={styles.video}
              canvas={{
                uid: 0, // Use uid 0 to render the local user's video
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
              <TouchableOpacity onPress={() => updateLiveSessionStatus('ended')} style={styles.backButton}>
                      <BackSolidIcon width={24} height={24} />
              </TouchableOpacity>
              <View style={styles.topAction}>
                <TouchableOpacity style={styles.guide} onPress={handleMuteToggle}>
                  {isMuted ? <MicOffIcon width={24} height={24} /> : <MicOnIcon width={24} height={24} />}
                </TouchableOpacity>
                <TouchableOpacity style={styles.guide} onPress={handleSwitchCamera}>
                      <ReverseCameraIcon width={19} height={19} />
                </TouchableOpacity>
                <TouchableOpacity style={styles.liveViewer}>
                      <ViewersIcon width={24} height={24} />
                      <Text style={styles.liveViewerText}>{formatViewersLikes(liveStats?.viewerCount || 0)}</Text>
                </TouchableOpacity>
              </View>
            </View>
            
        <View style={styles.actionBar}>
          <View style={styles.social}>
            <View style={styles.leftColumn}>
              {lastJoinedUser && (
                <View style={styles.joinNotificationContainer}>
                  <TouchableOpacity
                    style={styles.joinNotificationHeader}
                    onPress={() => setJoinListExpanded(!isJoinListExpanded)}>
                    {isJoinListExpanded && (<Text style={styles.joinNotificationText}>
                        Viewers who joined
                    </Text>)}
                    {!isJoinListExpanded &&(<View style={styles.joinedRow}>
                          <Image source={{ uri: lastJoinedUser.photoURL }} style={styles.avatar} />
                          <View style={styles.joinedContent}>
                            <Text style={styles.joinedName}>{lastJoinedUser.displayName}</Text>
                            <Text style={styles.joinedMessage}>👋 joined</Text>
                          </View>
                    </View>)}
                    {isJoinListExpanded ? <CaretUp width={12} height={12} color="#fff" /> : <CaretDown width={12} height={12} color="#fff" />}
                  </TouchableOpacity>
                  {isJoinListExpanded && (
                    <FlatList
                      data={uniqueJoinedUsers}
                      keyExtractor={(item) => item.id}
                      renderItem={({ item }) => (
                        // <Text style={styles.joinNotificationText}>
                        //   {item.displayName} joined 👋
                        // </Text>
                 
                         <View style={styles.commentRow}>
                          <Image source={{ uri: item.photoURL }} style={styles.avatar} />
                          <View style={styles.commentContent}>
                            <Text style={styles.chatName}>{item.displayName}</Text>
                            <Text style={styles.chatMessage}>👋 joined</Text>
                          </View>
                        </View>
                      )}
                      style={styles.joinList}
                    />
                  )}
                </View>
              )}
            <View style={styles.comments}>
              <FlatList
                ref={flatListRef}
                data={comments}
                style={{backgroundColor: 'rgba(0, 0, 0, 0.4)', borderRadius: 16}}
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
                  style={[styles.commentInput, isCommentFocused && styles.commentInputFocused]}
                  placeholder="Comment"
                  placeholderTextColor="#fff"
                  value={newComment}
                  onChangeText={setNewComment}
                  onSubmitEditing={handleSendComment}
                  onFocus={() => setIsCommentFocused(true)}
                  onBlur={() => setIsCommentFocused(false)}
                  multiline
                  blurOnSubmit={true}
                />
  
            </View>
            </View>
            <View style={styles.sideActions}>
                <TouchableOpacity style={styles.sideAction}>
                  <LoveIcon />
                  <Text style={styles.sideActionText}>{formatViewersLikes(liveStats?.likeCount || 0)}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleOpenStickyNote} style={styles.sideAction}>
                  <NoteIcon width={32} height={32} />
                  <Text style={styles.sideActionNotesText}>Notes</Text>
                </TouchableOpacity>
            </View>
          </View>
          {soldToUser && (
            <View style={styles.soldToContainer}>
              <Text style={styles.soldToText}>Sold to {soldToUser}</Text>
            </View>
          )}
          {activeListing && (
            <View style={styles.shop}>
                <View style={styles.plant}>
                  <View style={styles.plantDetails}>
                    <View style={styles.plantName}>
                      <Text style={styles.name}>{activeListing.genus}</Text>
                      <Text style={styles.name}>{activeListing.species}</Text>
                      <Text style={styles.variegation}>{activeListing.variegation} {activeListing?.variegation ? '•' : ''} {activeListing.potSize}</Text>
                    </View>
                    <View style={styles.price}>
                      <Text style={styles.plantPrice}>${activeListing.usdPrice}</Text>
                      {/* Discount logic can be added here if available in data */}
                      {/* <View style={styles.discount}>
                        <Text style={styles.discountText}>33% OFF</Text>
                      </View> */}
                    </View>
                    
                  </View>
                  <View style={styles.shipping}>
                      <View style={styles.shipDays}>
                        <TruckIcon width={24} height={24} />
                        {/* Shipping info can be added if available */}
                        <Text style={styles.shipText}>UPS 2nd Day $50 + $5 extra plant</Text>
                      </View>
                    </View>
                </View>
                <View style={styles.actionButton}>
                  {!isLive && (<TouchableOpacity onPress={() => updateLiveSessionStatus('live')} style={styles.actionButtonTouch}>
                    <Text style={styles.actionText}>Go Live</Text>
                  </TouchableOpacity>)}
                  {isLive && (<TouchableOpacity onPress={() => updateLiveSessionStatus('ended')} style={styles.actionEndButtonTouch}>
                    <Text style={styles.actionText}>End Live</Text>
                  </TouchableOpacity>)}
                </View>
            </View>
          )}
          {!activeListing && (<View style={styles.shop}>
              <Text style={{...baseFont, fontSize: 16, color: '#FFF'}}>No active listing</Text>
            </View>)}
          </View>
          </>
        )}

        {/* Render the CreateLiveListingScreen as a modal */}
        <CreateLiveListingScreen
          isVisible={isCreateListingModalVisible}
          onClose={() => setCreateListingModalVisible(false)}
          onListingCreated={() => {}}
          sessionId={sessionId}
          navigation={navigation}
        />

        <LiveListingsModal
          isVisible={isLiveListingModalVisible}
          onClose={() => setLiveListingModalVisible(false)}
          sessionId={sessionId}
          onActiveListingSet={() => {}}
        />

        <Modal
          animationType="slide"
          transparent={true}
          visible={isStickyNoteModalVisible}
          onRequestClose={() => setStickyNoteModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.stickyNoteModalContainer}>
              <Text style={styles.modalTitle}>Notes</Text>
              <TextInput
                style={styles.stickyNoteInput}
                placeholder="Write a notes for your viewers..."
                placeholderTextColor="#666"
                multiline
                value={stickyNoteText}
                onChangeText={setStickyNoteText}
              />
              <TouchableOpacity style={styles.saveButton} onPress={handleSaveStickyNote}>
                <Text style={styles.saveButtonText}>Save Notes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.closeButton} onPress={() => setStickyNoteModalVisible(false)}>
                <Text style={styles.closeButtonText}>Close</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
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
  commentInputFocused: {
    height: 80, // Or another height that fits multiple lines
    textAlignVertical: 'top', // Align text to the top
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
    borderRadius: 16
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },

  container: { 
    flex: 1,
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 1,
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
    gap: 2,
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
    height: 547,
    alignSelf: 'center',
  },
  social: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    width: 359,
    height: 353,
  },
  soldToContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginTop: -50,
  },
  soldToText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  leftColumn: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    height: '100%',
    marginTop: 250,
  },
  joinNotificationContainer: {
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
    marginBottom: 8,
    maxHeight: 180,
  },
  joinNotificationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  joinNotificationText: {
    color: '#fff',
    fontSize: 12,
    fontFamily: 'Inter',
    paddingVertical: 2,
  },
  joinList: {
    marginTop: 4,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  comments: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    gap: 16,
    width: 260,
    height: 453,
    paddingBottom: 213
  },
  commentRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    width: '100%',
  },
  joinedRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    width: '90%',
  },
  joinedContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    width: 118,
  },
  joinedName: {
    ...baseFont,
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 17,
    color: '#FFF',
  },
  joinedMessage: {
    ...baseFont,
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 22,
    flexWrap: 'wrap',
    color: '#fff',
    height: 'auto',
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
  },
  chatName: {
    ...baseFont,
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 17,
    color: '#FFF',
  },
  chatMessage: {
    ...baseFont,
    fontWeight: '500',
    fontSize: 13,
    lineHeight: 22,
    flexWrap: 'wrap',
    color: '#fff',
    height: 'auto',
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
    color: '#FFF',
    backgroundColor: 'rgba(0, 0, 0, 0.4)', 
    borderRadius: 16
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
  sideActionText: {
    ...baseFont,
    fontWeight: '600',
    fontSize: 14,
    marginTop: 4,
  },
  sideActionNotesText: {
    ...baseFont,
    fontWeight: '600',
    fontSize: 10,
    marginTop: 4,
  },
  shop: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    width: 359,
    height: 210,
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
    fontSize: 12,
    lineHeight: 24,
  },
  variegation: {
    ...baseFont,
    color: '#CDD3D4',
    fontWeight: '500',
    fontSize: 12,
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
    marginTop: 22,
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
    fontSize: 11,
    lineHeight: 20,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginTop: 22,
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
  actionEndButtonTouch: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    width: 327,
    height: 48,
    backgroundColor: '#E7522F',
    borderRadius: 12,
  },
  actionText: {
    ...baseFont,
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
  },
  stickyNoteContainer: {
    position: 'absolute',
    top: 100,
    left: 15,
    right: 15,
    backgroundColor: 'rgba(255, 249, 196, 0.9)', // Yellowish sticky note color
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E9D5A1',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  stickyNoteText: {
    color: '#333',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  stickyNoteModalContainer: {
    width: '90%',
    backgroundColor: 'white',
    backgroundColor: '#FFF9C4', // Yellowish sticky note color
    borderRadius: 16,
    padding: 20,
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 4.65,
    elevation: 8,
    // transform: [{ rotate: '-2deg' }], // Slight rotation for effect
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 20,
    color: '#424242',
    fontFamily: 'Inter-Bold', // A more fitting font if available
  },
  stickyNoteInput: {
    width: '100%',
    height: 200,
    borderWidth: 0, // Remove border
    borderRadius: 8,
    padding: 12,
    fontSize: 13,
    textAlignVertical: 'top',
    marginBottom: 20,
    color: '#333',
    backgroundColor: 'transparent', // Make input background transparent
    fontFamily: 'Inter', // A slightly more handwritten-style font would be great here
  },
  saveButton: {
    backgroundColor: '#4CAF50', // A slightly different green
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    width: '100%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 4,
  },
  saveButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  closeButton: { marginTop: 16 },
  closeButtonText: {
    color: '#616161',
    fontSize: 16,
  },
});
