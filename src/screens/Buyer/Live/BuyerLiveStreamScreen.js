import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import {
  addDoc,
  collection,
  doc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  serverTimestamp,
  where,
} from 'firebase/firestore';
import React, { useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
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
  RtcSurfaceView
} from 'react-native-agora';
import KeepAwake from 'react-native-keep-awake';
import { SafeAreaView } from 'react-native-safe-area-context';
import { db } from '../../../../firebase';
import CaretDown from '../../../assets/icons/white/caret-down.svg';
import BackSolidIcon from '../../../assets/icons/white/caret-left-regular.svg';
import CaretUp from '../../../assets/icons/white/caret-up.svg';
import ActiveLoveIcon from '../../../assets/live-icon/active-love.svg';
import CloseIcon from '../../../assets/live-icon/close-x.svg';
import GuideIcon from '../../../assets/live-icon/guide.svg';
import LoveIcon from '../../../assets/live-icon/love.svg';
import NoteIcon from '../../../assets/live-icon/notes.svg';
import ShopIcon from '../../../assets/live-icon/shopv3.svg';
import TruckIcon from '../../../assets/live-icon/truck.svg';
import ViewersIcon from '../../../assets/live-icon/viewers.svg';
import { AuthContext } from '../../../auth/AuthProvider';
import {
  addViewerToLiveSession,
  generateAgoraToken,
  removeViewerFromLiveSession,
  toggleLoveLiveSession,
  updateLiveSessionStatusApi
} from '../../../components/Api/agoraLiveApi';
import { getPlantDetailApi } from '../../../components/Api/getPlantDetailApi';
import { retryAsync } from '../../../utils/utils';
import CheckoutLiveModal from '../../Buyer/Checkout/CheckoutScreenLive';
import GuideModal from './GuideModal'; // Import the new modal
import ShopModal from './ShopModal';

const BuyerLiveStreamScreen = ({navigation, route}) => {
  const [joined, setJoined] = useState(false);
  const rtcEngineRef = useRef(null);
  const [remoteUid, setRemoteUid] = useState(null);
  const [viewerCount, setViewerCount] = useState(0);
  const [error, setError] = useState(null);
  const [sessionEnded, setSessionEnded] = useState(false);
  const [appId, setAppId] = useState(null);
  const [channelName, setChannelName] = useState(null);
  const [token, setToken] = useState(null);
  const [sessionId, setSessionId] = useState(route.params?.sessionId);
  const [liveStats, setLiveStats] = useState({ viewerCount: 0, likeCount: 0 });
  const [activeListing, setActiveListing] = useState(null);
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const flatListRef = useRef(null);
  const { userInfo } = useContext(AuthContext);
  const [asyncUserInfo, setAsyncUserInfo] = useState(null);
  const currentUserInfo = userInfo || asyncUserInfo;
  const [unitPrice, setUnitPrice] = useState(null);
  const [plantDataCountry, setPlantDataCountry] = useState(null);
  const [isPlantDetailLiveModalVisible, setPlantDetailLiveModalVisible] = useState(false);
  const [isGuideModalVisible, setIsGuideModalVisible] = useState(false);
  const [isShopModalVisible, setIsShopModalVisible] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);
  const [brodcasterId, setBrodcasterId] = useState(route.params?.broadcasterId);
  const [plantData, setPlantData] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [buyerPendingPayment, setBuyerPendingPayment] = useState(false);
  const [showStickyNote, setShowStickyNote] = useState(false);
  const [profilePhotoUrl, setProfilePhotoUrl] = useState(null);
  const [isJoinListExpanded, setJoinListExpanded] = useState(false);
  const [uniqueJoinedUsers, setUniqueJoinedUsers] = useState([]);
  const [lastJoinedUser, setLastJoinedUser] = useState(null);
  const [soldToUser, setSoldToUser] = useState(null);
  const [isCommentFocused, setIsCommentFocused] = useState(false);

  useEffect(() => {
      if (!sessionId) return;
  
      const orderCollectionRef = collection(db, 'order');
      
      const q = query(orderCollectionRef, where('buyerUid', '==' , currentUserInfo?.uid || null), where('listingId', '==' , activeListing?.id || null));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedOrders = [];
        querySnapshot.forEach((doc) => {
          fetchedOrders.push({ id: doc.id, ...doc.data() });
        });
        setBuyerPendingPayment(fetchedOrders[0] || {});
      });
      
      return () => unsubscribe();
  }, [sessionId, activeListing]);

  useEffect(() => {
      if (!sessionId) return;
  
      const orderCollectionRef = collection(db, 'order');
      
      const q = query(orderCollectionRef, where('listingId', '==' , activeListing?.id || null));
      const unsubscribe = onSnapshot(q, (querySnapshot) => {
        const fetchedOrders = [];
        querySnapshot.forEach((doc) => {
          fetchedOrders.push({ id: doc.id, ...doc.data() });
        });
        setOrderStatus(fetchedOrders[0]?.status || null);
      });
      
      return () => unsubscribe();
  }, [sessionId, activeListing]);


  const getDiscountedPrice = async (item=null, plantDatas=null) => {
    const priceData = item || activeListing;
    
    // Preferred fields per spec
    const original = parseFloat(priceData.originalPrice ?? priceData.usdPrice ?? 0) || 0;
    let current = parseFloat(priceData.usdPriceNew ?? priceData.finalPrice ?? priceData.usdPrice ?? original) || 0;

    // Guard: if current is 0 but original exists, fallback to original
    if (current === 0 && original > 0) current = original;

    let deduction = 0;
    let discountPercent = 0;
    if (original > 0 && current < original) {
      deduction = original - current;
      discountPercent = (deduction / original) * 100;
    }

    const discountedPriceData = current.toFixed(2);
    const unitPrice = parseFloat(discountedPriceData);
    
    setUnitPrice(unitPrice);

    // Ensure plantData has a country code
    const plantDataWithCountry = plantDatas ? { ...plantDatas } : { ...plantData };
    // If country is missing, try to determine it from currency
    let country = null;
    if (!plantDataWithCountry.country) {
      const mapCurrencyToCountry = (localCurrency) => {
        if (!localCurrency) return 'ID'; // Default to Indonesia
          
        switch (localCurrency.toUpperCase()) {
          case 'PHP':
            return 'PH';
          case 'THB':
            return 'TH';
          case 'IDR':
            return 'ID';
          default:
            return 'ID'; // Default to Indonesia
        }
      };
      country = await mapCurrencyToCountry(plantDataWithCountry.localCurrency);
      plantDataWithCountry.country = country;
    }
    setPlantDataCountry(plantDataWithCountry)
    return {
      country,
      unitPrice
    }
  };

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

  const handleSendComment = async () => {
      const commentToSend = newComment;
      
      if (commentToSend.trim() === '' || !sessionId || !currentUserInfo.uid) return;
      setNewComment(''); // Clear input after sending
      try {
        const commentsCollectionRef = collection(db, 'live', sessionId, 'comments');
        
        await addDoc(commentsCollectionRef, {
          message: commentToSend,
          name: `${currentUserInfo.username}`,
          avatar: profilePhotoUrl || `https://gravatar.com/avatar/19bb7c35f91e5f6c47e80697c398d70f?s=400&d=mp&r=x`, // Fallback avatar
          uid: currentUserInfo.uid,
          createdAt: serverTimestamp(),
        });
        
      } catch (error) {
        console.error('Error sending comment:', error);
      }
  };

  const formatViewersLikes = (data) => {
    // Use 'en-US' locale, compact notation, and 0-1 fraction digits
    const formatter = new Intl.NumberFormat('en-US', {
      notation: 'compact',
      maximumFractionDigits: 1
    });

    return formatter.format(data);
  }

  const toggleLove = async () => {
    // Increment like count locally for demo purposes
    await toggleLoveLiveSession(sessionId);
  }

  const addViewers = async () => {
    await addViewerToLiveSession(sessionId, profilePhotoUrl);
  }

  const removeViewers = async () => {
    await removeViewerFromLiveSession(sessionId);
  }

  const goBack = async () => {
    setIsLoading(true);
    await removeViewers();
    setIsLoading(false);
    navigation.goBack();
  }

  const fetchToken = async () => {
      try {
        const buyerAvatar = await AsyncStorage.getItem('profilePhotoUrl');
        setProfilePhotoUrl(buyerAvatar);

        const response = await generateAgoraToken(channelName);
        // console.log('Fetched token response:', response);
        
        setToken(response.token);
        setAppId(response.appId);
        setChannelName(response.channelName);
        
      } catch (error) {
        console.error('Error fetching token:', error);
      }
 };

 useEffect(() => {
  if (!activeListing) return;
   loadPlantDetails();
  }, [activeListing]);


  useEffect(() => {
    if (!sessionId || !brodcasterId) return;

    const listingsCollectionRef = collection(db, 'listing');
    const q = query(
      listingsCollectionRef,
      where('sellerCode', '==', brodcasterId),
      where('isActiveLiveListing', '==', true)
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
  }, [sessionId, brodcasterId]);

  useEffect(() => {
     if (!sessionId) return;
 
     console.log(`Setting up snapshot listener for live session: ${sessionId}`);
     const sessionDocRef = doc(db, 'live', sessionId);
 
     const unsubscribe = onSnapshot(sessionDocRef, (doc) => {
       if (doc.exists()) {
         const data = doc.data();
         console.log('Live session data updated:', data);
         setLiveStats(data);

         const joinNotifications = data?.joiners || [];
        
         setUniqueJoinedUsers([...new Map(joinNotifications.slice().reverse().map(item => [item.uid, item])).values()])
         setLastJoinedUser(joinNotifications.length > 0 ? joinNotifications[joinNotifications.length - 1] : null)
       } else {
         console.log('Live session document does not exist.');
       }
     });
 
     // Cleanup listener on component unmount
     return () => unsubscribe();
   }, [sessionId]);

  useEffect(() => {
    fetchToken();
    const startAgora = async () => {
      if (!token) {
          console.log('Waiting for token...');
          return;
      }

      const rtc = createAgoraRtcEngine();
      rtcEngineRef.current = rtc;
      rtc.initialize({
        appId: appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });
      
      // Additional configuration for video
      rtc.enableVideo();
      
      // Set default video encoder configuration for better quality
      rtc.setVideoEncoderConfiguration({
        dimensions: {
          width: 640,
          height: 360
        },
        frameRate: 15,
        bitrate: 800
      });
      
      // Enable dual stream mode for better performance
      rtc.enableDualStreamMode(true);
      
      // Set audio profile
      rtc.setAudioProfile({
        profile: 0, // Standard
        scenario: 1 // Game Streaming
      });
      setNewComment('');
      rtc.registerEventHandler({
        onJoinChannelSuccess: (connection, elapsed) => {
          console.log('✅ Joined Channel as viewer:', connection, 'Elapsed:', elapsed);
          setJoined(true);
          addViewers();
          if (comments.filter(a => a.message === 'Joined 👋' && a.uid === currentUserInfo.uid).length === 0) {
            handleSendComment();
            setNewComment('');
          }
        },
        onUserJoined: (connection, remoteUid) => {
          console.log('👤 Remote user joined:', connection, 'uid:', remoteUid);
          
          try {
            // Setup remote video with different parameters
            rtcEngineRef.current.setupRemoteVideo({
              uid: remoteUid,
              renderMode: 1, // FIT mode
              mirrorMode: 0  // No mirror
            });
            
            // Subscribe to this remote user's video stream
            rtcEngineRef.current.setRemoteVideoStreamType(remoteUid, 0); // 0 = high stream
            
            setRemoteUid(remoteUid);
            setViewerCount((prev) => prev + 1);
            
            console.log('Remote video setup complete for UID:', remoteUid);
          } catch (err) {
            console.error('Error setting up remote video:', err);
            setError('Error setting up remote video: ' + err.message);
          }
        },
        onUserOffline: (connection, remoteUid) => {
          console.log('Broadcaster left:', remoteUid);
          setRemoteUid(null);
          setSessionEnded(true);
          setViewerCount((prev) => Math.max(prev - 1, 0));
          navigation.navigate('Live');
        },
        onRemoteVideoStateChanged: (uid, state, reason, elapsed) => {
          
          // Handle different video states
          if (state === 0) { // STOPPED
            console.log('Remote video STOPPED for uid:', uid);
          } else if (state === 1) { // STARTING
            console.log('Remote video STARTING for uid:', uid);
          } else if (state === 2) { // DECODING
            console.log('Remote video DECODING for uid:', uid);
          } else if (state === 3) { // FROZEN
            console.log('Remote video FROZEN for uid:', uid);
          }
        },
        onError: (err) => {
          console.error('❌ Agora Error:', err);
          setError('Agora Error: ' + (err.message || err));
        },
        onRemoteVideoStats: (stats) => {
          // console.log('📊 Remote Video Stats:', stats);
        },
        onRemoteAudioStats: (stats) => {
          // console.log('🔊 Remote Audio Stats:', stats);
        },
        onWarning: (warn) => {
          console.warn('⚠️ Agora Warning:', warn);
        },
        onConnectionStateChanged: (state, reason) => {
          console.log('🔌 Connection state changed:', state, 'reason:', reason);
        }

      });
      
      rtc.enableVideo();
      rtc.setClientRole(ClientRoleType.ClientRoleAudience);
      
      // Log to help with debugging
      console.log('Joining channel:', channelName);
      console.log('Using token:', token ? 'Token provided' : 'No token');
      
      try {
        // Join the channel with specific options
        rtc.joinChannel(token, channelName, 0, {
          autoSubscribeVideo: true,
          autoSubscribeAudio: true,
          publishLocalAudio: false,
          publishLocalVideo: false
        });
        
        console.log('joinChannel called successfully');
        rtcEngineRef.current = rtc;
      } catch (err) {
        console.error('Error joining channel:', err);
        setError('Failed to join channel: ' + err.message);
      }
    }

    startAgora();

    return () => {
      const engine = rtcEngineRef.current;
      if (engine) {
        console.log('Leaving channel and releasing Agora engine');
        engine.leaveChannel();
        engine.unregisterEventHandler();
        engine.release();
        rtcEngineRef.current = null;
      }
    };
  }, [token, appId, channelName]);

  const endLiveSession = () => {
      updateLiveSessionStatusApi(sessionId, 'ended');
      navigation.navigate('Live');
  };

  useEffect(() => {
    // Timeout if no broadcaster is found
    if (joined && !remoteUid && !sessionEnded) {
      const timer = setTimeout(() => {
        // Re-check remoteUid before navigating
        if (!remoteUid) {
          endLiveSession();
          console.log('No broadcaster found after 8 seconds. Navigating to Live screen.');
          Alert.alert('No broadcaster found. Live session has ended.');
        }
      }, 8000); // 8 seconds

      return () => clearTimeout(timer);
    }
  }, [joined, remoteUid, navigation, sessionEnded]);

  useEffect(() => {
        if (comments.length > 0) {
          flatListRef.current?.scrollToEnd({ animated: true });
        }
  }, [comments]); // This effect runs whenever 'messages' array changes

  const loadPlantDetails = async (item=null) => {
      try {
        let netState = await NetInfo.fetch();
        if (!netState.isConnected || !netState.isInternetReachable) {
          throw new Error('No internet connection.');
        }
  
        const res = await retryAsync(() => getPlantDetailApi(item?.plantCode || activeListing.plantCode), 3, 1000);
  
        if (!res?.success) {
          throw new Error(res?.error || 'Failed to load plant details');
        }
        // Extract the nested data object from the response
        
        setPlantData(res.data);
        getDiscountedPrice();

        return res.data;
      } catch (error) {
        setIsLoading(false);
        Alert.alert('Error', error.message);
      }
  };

  const buyNow = async (item) => {
    // removeViewers();
    try {
      setIsLoading(true);
      const plantDatas = await loadPlantDetails(item);
      const discountsData = await getDiscountedPrice(item, plantDatas);

      setTimeout(() => {
        setIsLoading(false);  
            const data = {
              fromBuyNow: true,
              plantData: {
                ...plantDatas,
                country: discountsData.country,
                flightDate: plantDatas.flightDate || plantDatas.cargoDate || null,
                cargoDate: plantDatas ? plantDatas.cargoDate : null,
              },
              selectedPotSize: plantDatas ? plantDatas.potSize : null,
              quantity: 1,
              plantCode: plantDatas ? plantDatas.plantCode : null,
              totalAmount: discountsData.unitPrice * 1,
              isLive: true,
            };
            
            navigation.navigate('CheckoutScreen', data);
      }, 3000);
    } catch (error) {
      console.log('error', error);
      setIsLoading(false);
    }
    
  }

  // Effect to fetch order for the active listing
  useEffect(() => {
    if (!activeListing?.id) {
      setSoldToUser(null); // Reset when there's no active listing
      return;
    }
  
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

  // Effect to keep the screen awake during the live stream
  useEffect(() => {
    KeepAwake.activate();
    return () => KeepAwake.deactivate();
  }, [joined, remoteUid]);

  const handleBuyFromShop = (item) => {
    // Logic to handle buying an item from the shop modal
    setIsShopModalVisible(false);
    buyNow(item);
    
  };
  return (
     <SafeAreaView style={styles.container}>
      {isLoading && (
                      <Modal transparent animationType="fade">
                        <View style={styles.loadingOverlay}>
                          <ActivityIndicator size="large" color="#699E73" />
                        </View>
                      </Modal>
                    )}
       <CheckoutLiveModal
          isVisible={isPlantDetailLiveModalVisible}
          onClose={() => setPlantDetailLiveModalVisible(false)}
          listingDetails={{
            fromBuyNow: true,
            plantData: {
              ...plantDataCountry,
              flightDate: activeListing ? activeListing.flightDate : null,
              cargoDate: activeListing ? activeListing.cargoDate : null,
            },
            selectedPotSize: activeListing ? activeListing.potSize : null,
            quantity: 1,
            plantCode: activeListing ? activeListing.plantCode : null,
            totalAmount: unitPrice * 1,
          }}
      />
     
      <View style={styles.stream}>
        {joined && remoteUid ? (
          <RtcSurfaceView
            style={styles.video}
            canvas={{
              uid: remoteUid,
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
      {joined && remoteUid && (
        <>
          <View style={styles.topBar}>
            <TouchableOpacity onPress={() => goBack()} style={styles.backButton}>
                    <BackSolidIcon width={24} height={24} />
            </TouchableOpacity>
            <View style={styles.topAction}>
              <TouchableOpacity style={styles.guide} onPress={() => setIsGuideModalVisible(true)}>
                    <GuideIcon width={19} height={19} />
                    <Text style={styles.guideText}>Guide</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.liveViewer}>
                    <ViewersIcon width={24} height={24} />
                    <Text style={styles.liveViewerText}>{formatViewersLikes(liveStats?.viewerCount || 0)}</Text>
              </TouchableOpacity>
            </View>
          </View>

          {showStickyNote && (
            <View style={styles.stickyNoteContainer}>
              <Text style={styles.stickyNoteTitle}>Notes</Text>
              <TouchableOpacity onPress={() => setShowStickyNote(false)} style={styles.stickyNoteCloseButton}>
                <CloseIcon width={16} height={16} color="#333" />
              </TouchableOpacity>
              <ScrollView showsVerticalScrollIndicator={true}>
                <Text style={styles.stickyNoteText}>{liveStats?.stickyNote || ''}</Text>
              </ScrollView>
            </View>
          )}
          
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
          {/* <View style={styles.comments}>
            <FlatList
              ref={flatListRef}
              data={comments}
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
              placeholderTextColor="#fff"
              value={newComment}
              onChangeText={setNewComment}
              onSubmitEditing={handleSendComment}
            />

          </View> */}
          <View style={styles.sideActions}>
              {liveStats?.lovedByUids && liveStats?.lovedByUids.includes(currentUserInfo.uid) ? (<TouchableOpacity onPress={() => toggleLove()} style={styles.sideAction}>
                <ActiveLoveIcon />
                <Text style={styles.sideActionText}>{formatViewersLikes(liveStats.likeCount)}</Text>
              </TouchableOpacity>) : 
              (<TouchableOpacity onPress={() => toggleLove()} style={styles.sideAction}>
                <LoveIcon />
                <Text style={styles.sideActionText}>{formatViewersLikes(liveStats.likeCount)}</Text>
              </TouchableOpacity>
              )}
              <TouchableOpacity onPress={() => setShowStickyNote(!showStickyNote)} style={styles.sideAction}>
                <NoteIcon width={32} height={32} />
                <Text style={styles.sideActionNotesText}>Notes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sideAction} onPress={() => setIsShopModalVisible(true)}>
                 <ShopIcon width={32} height={32} />
                <Text style={styles.sideActionNotesText}>Shop</Text>
              </TouchableOpacity>

             
          </View>
        </View>
        {soldToUser && (
          <View style={styles.soldToContainer}>
            <Text style={styles.soldToText}>Sold to {soldToUser}</Text>
          </View>
        )}
        {activeListing && (<View style={styles.shop}>
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
                  <View style={styles.shippingType}>
                    <Text style={styles.shippingDetails}>{activeListing.listingType}</Text>
                  </View>
                  <View style={styles.shipDays}>
                    <TruckIcon width={24} height={24} />
                    <Text style={styles.shipText}>UPS 2nd Day $50 + $5 extra plant</Text>
                  </View>
                </View>
            </View>
            <View style={styles.actionButton}>
              {buyerPendingPayment?.status === 'pending_payment' && (
                <TouchableOpacity onPress={() => {
                }} style={styles.actionButtonTouch}>
                  <Text style={styles.actionText}>Pending Payment</Text>
                </TouchableOpacity>
              )} 

              {orderStatus === 'Ready to Fly' && (
                <TouchableOpacity onPress={() => {
                }} style={styles.waitingButtonTouch}>
                  <Text style={styles.actionText}>Awaiting new item</Text>
                </TouchableOpacity>
              )} 

              {!orderStatus && (
               <TouchableOpacity onPress={() => {
                  buyNow(activeListing);
                }} style={styles.actionButtonTouch}>
                  <Text style={styles.actionText}>Buy Now</Text>
                </TouchableOpacity>
              )} 
            </View>
        </View>)}
        {!activeListing && (<View style={styles.shop}>
                      <Text style={{...baseFont, fontSize: 16, color: '#FFF'}}>No active listing</Text>
                    </View>)}
          </View>
        </>
      )}
       <GuideModal
        isVisible={isGuideModalVisible}
        onClose={() => setIsGuideModalVisible(false)}
      />
      <ShopModal
        isVisible={isShopModalVisible}
        onClose={() => setIsShopModalVisible(false)}
        broadcasterId={brodcasterId}
        onBuyNow={handleBuyFromShop}
      />
    </SafeAreaView>
  );
};

export default BuyerLiveStreamScreen;

const baseFont = {
  fontFamily: 'Inter',
  fontStyle: 'normal',
  color: '#FFFFFF',
};

const styles = StyleSheet.create({
  stickyNoteTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    fontFamily: 'Inter-Bold',
    marginBottom: 8,
    paddingRight: 30, // Ensure title doesn't overlap with close button
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  sideActionNotesText: {
    ...baseFont,
    fontWeight: '600',
    fontSize: 10,
    marginTop: 4,
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
    // marginBottom: 16,
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
    color: '#fff',
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
  },
  commentInputFocused: {
    height: 80, // Or another height that fits multiple lines
    textAlignVertical: 'top', // Align text to the top
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
    fontSize: 13,
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
  sideActionText: {
    ...baseFont,
    fontWeight: '600',
    fontSize: 14,
    marginTop: 4,
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
  waitingButtonTouch: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    width: 327,
    height: 48,
    backgroundColor: '#bdc5bfff',
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
    top: 140,
    right: 10,
    maxHeight: 200,
    width: '60%', // Occupy a portion of the right side
    backgroundColor: '#FFE7E2', // Yellowish sticky note color
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#e7c2bbff',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
    zIndex: 10,
    // transform: [{ rotate: '2deg' }], // Slight rotation for effect
  },
  stickyNoteText: {
    color: '#333',
    fontSize: 14,
    fontFamily: 'Inter',
  },
  stickyNoteCloseButton: {
    position: 'absolute',
    top: 8,
    right: 8,
    zIndex: 1,
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderRadius: 12,
    padding: 4,
  },
});
