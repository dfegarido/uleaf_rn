import AppImage from '../../../components/AppImage/AppImage';
import PlantListingImage from '../../../components/PlantListingImage/PlantListingImage';
import { getShopListingImageUri } from '../../../utils/plantListingImage';

import AsyncStorage from '@react-native-async-storage/async-storage';
import NetInfo from '@react-native-community/netinfo';
import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator,
  Alert,
  Animated,
  Easing,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  NativeEventEmitter,
  NativeModules,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import { ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  RtcSurfaceView,
  RtcTextureView,
} from 'react-native-agora';
import KeepAwake from 'react-native-keep-awake';
import { SafeAreaView } from 'react-native-safe-area-context';
// react-native-svg draws the Buy Now gradient fill. Chosen over react-native-linear-gradient
// because it is already proven on this build's New Architecture (Podfile :fabric_enabled,
// android newArchEnabled) and needs no native rebuild for a JS-only change.
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import BackSolidIcon from '../../../assets/icons/white/caret-left-regular.svg';
import ActiveLoveIcon from '../../../assets/live-icon/heart-filled.svg';
import CloseIcon from '../../../assets/live-icon/close-x.svg';
import GuideIcon from '../../../assets/live-icon/guide.svg';
import LoveIcon from '../../../assets/live-icon/heart-outline.svg';
import NoteIcon from '../../../assets/live-icon/notes-outline.svg';
import ShopIcon from '../../../assets/live-icon/shopv3.svg';
import TruckIcon from '../../../assets/live-icon/truck.svg';
import CartIconSelected from '../../../assets/live-icon/cart-outline.svg';
import ShareReferralIcon from '../../../assets/live-icon/share-referral.svg';
import ViewersIcon from '../../../assets/live-icon/viewers.svg';
import { AuthContext } from '../../../auth/AuthProvider';
import { addViewerToLiveSession,
  generateAgoraToken,
  getActiveLiveListingApi,
  getLiveListingsBySessionApi,
  removeViewerFromLiveSession,
  toggleLoveLiveSession,
  updateLiveSessionStatusApi
} from '../../../components/Api/agoraLiveApi';
import {
  addLiveCommentApi,
  deleteLiveCommentApi,
  getLiveCommentsApi,
  getLiveDetailApi,
  getLiveSoldToApi,
  liveOrderLookupApi,
  updateLiveCommentApi,
} from '../../../components/Api/liveApi';
import { addToCartApi } from '../../../components/Api/cartApi';
import LiveStreamAddToCartButton from '../../../components/LiveStreamAddToCartButton';
import GlassView from '../../../components/Glass/GlassView';
import { getPlantDetailApi } from '../../../components/Api/getPlantDetailApi';
import { shareLiveStream } from '../../../utils/liveShareLink';
import { getAgoraUid } from '../../../utils/getAgoraUid';
import { retryAsync } from '../../../utils/utils';
import { buildLiveChatFeed } from '../../../utils/liveChatFeed';
import CheckoutLiveModal from '../../Buyer/Checkout/CheckoutScreenLive';
import LiveShopCheckoutModal from '../../Buyer/Checkout/LiveShopCheckoutModal';
import GuideModal from './GuideModal'; // Import the new modal
import ShopModal from './ShopModal';
import {
  createPendingLiveComment,
  mergeLiveComment,
  mergeLiveCommentUpdate,
  mergeLiveCommentsFromServer,
  normalizeLiveCommentRow,
  subscribeToLiveComments,
} from '../../../utils/realtimeLiveComments';

const liveShippingLabel = listing => {
  const country = String(listing?.country || '').trim().toLowerCase();
  const currency = String(listing?.localCurrency || listing?.localcurrency || '')
    .trim()
    .toUpperCase();
  const asian =
    country === 'th' ||
    country === 'ph' ||
    country === 'id' ||
    country.includes('thailand') ||
    country.includes('philippine') ||
    country.includes('indonesia');
  const domestic =
    country === 'us' ||
    country === 'usa' ||
    country.includes('united states') ||
    (currency === 'USD' && country !== '' && !asian);
  return domestic
    ? 'UPS 2nd Day $25 + $2 extra plant'
    : 'UPS 2nd Day $50 + $5 extra plant';
};

// Builds the payload the LIVE checkout modal needs to paint its first frame from
// the live-listing row the buyer tapped. Only display fields are filled in: the
// authoritative detail (variations, exact discount, flight dates) still comes from
// getPlantDetailApi. Returns null when the row carries no plant code, in which case
// the caller falls back to the blocking flow.
const optimisticPlantDataFromListing = listing => {
  if (!listing) return null;
  const plantCode = listing.plantCode || listing.plantcode;
  if (!plantCode) return null;

  const name =
    listing.name ||
    listing.title ||
    `${listing.genus || ''} ${listing.species || ''}`.trim() ||
    'Rare Tropical Plants';
  const potSize = listing.potSize || listing.potsize || null;
  const price = listing.usdPrice ?? listing.usdprice ?? 0;
  const image = listing.imagePrimary || listing.imageprimary || null;

  return {
    plantData: {
      plantCode,
      name,
      title: name,
      genus: listing.genus || '',
      species: listing.species || '',
      variation: listing.variegation || 'Standard',
      potSize,
      size: potSize,
      imagePrimary: image,
      image,
      country: listing.country || null,
      localCurrency: listing.localCurrency || null,
      listingType: listing.listingType || listing.listingtype || null,
      accountClass: listing.accountClass || null,
      usdPrice: price,
      price,
      // listing-detail does not return a shipping method for live listings, so the
      // label falls back to its default text — pass null to keep the skeleton and the
      // real payload showing the same string instead of flipping between two.
      shippingMethod: null,
    },
    selectedPotSize: potSize,
    quantity: 1,
    totalAmount: Number(price) || 0,
  };
};

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
  const [myUid, setMyUid] = useState(null);
  const [sessionId, setSessionId] = useState(route.params?.sessionId);
  const [liveStats, setLiveStats] = useState({ viewerCount: 0, likeCount: 0 });
  const [activeListing, setActiveListing] = useState(null);
  const [sessionListingIndexMap, setSessionListingIndexMap] = useState({});
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState('');
  const flatListRef = useRef(null);
  const { userInfo } = useContext(AuthContext);
  const [asyncUserInfo, setAsyncUserInfo] = useState(null);
  const currentUserInfo = userInfo || asyncUserInfo;
  const buyerUid =
    currentUserInfo?.uid ||
    currentUserInfo?.id ||
    currentUserInfo?.user?.uid ||
    currentUserInfo?.user?.id;
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
  // The session's joiners live in `live.joiners[]` (written by addViewerToLiveSession). Kept as
  // a plain list and interleaved into the chat render below rather than mirrored into its own
  // state/UI block.
  const [joinedUsers, setJoinedUsers] = useState([]);
  const [soldToUser, setSoldToUser] = useState(null);
  const [checkOutData, setCheckOutData] = useState({});
  const [isLiveShopCheckoutVisible, setIsLiveShopCheckoutVisible] = useState(false);
  // True while the modal is open on the tapped row's data and the authoritative
  // plant detail is still in flight — the modal renders skeletons meanwhile.
  const [isLiveCheckoutPending, setIsLiveCheckoutPending] = useState(false);
  const [editingComment, setEditingComment] = useState(null);
  // Tracks the composer's focus. The rail slide below is driven off THIS, not the raw keyboard
  // events, so it stays correct on Android too — where `adjustResize` resizes the window and
  // keyboard events do not fire. The chat's collapsed height reads the same state.
  const [isCommentFocused, setIsCommentFocused] = useState(false);
  // The pill is 46pt tall but the TextInput inside it is only 20pt, so a tap on the padding —
  // which looks identical to the input — used to do nothing at all: no focus, no keyboard, and
  // the plant card stayed on screen. The whole pill now routes to the input.
  const commentInputRef = useRef(null);
  // The plant card collapses by its own measured height. A pixel target is needed because
  // `height` cannot be interpolated on this build (an AnimatedInterpolation in the tree crashed
  // RN 0.87 with "cannot add a new property"), so the value must already BE the height.
  const cardHeightRef = useRef(0);
  const cardAnimatingRef = useRef(false);
  const cardCollapse = useRef(new Animated.Value(0)).current;
  const cardFade = useRef(new Animated.Value(1)).current;
  const [cardMeasured, setCardMeasured] = useState(false);
  // Holds the rail's x-offset in POINTS (0..72). Deliberately NOT run through `interpolate()`:
  // on RN 0.87 an `AnimatedInterpolation` nested in a transform throws
  // "cannot add a new property" from `AnimatedWithChildren.__addChild` when it attaches, which
  // takes the whole screen down. A raw `Animated.Value` in the same position is fine.
  const sideRailShift = useRef(new Animated.Value(0)).current;

  useEffect(() => {
      if (!sessionId) return;
      
      // Extract uid properly (handles nested structure for suppliers)
      const userId = currentUserInfo?.uid || currentUserInfo?.id || currentUserInfo?.user?.uid || currentUserInfo?.user?.id;

      let active = true;
      let pollTimer = null;

      const loadOrder = async () => {
        if (!activeListing?.id) return; // no listing yet — don't poll without a listingId
        const res = await liveOrderLookupApi({ listingId: activeListing?.id, buyerUid: userId || null });
        if (!active) return;
        setBuyerPendingPayment(res.order || {});
      };

      loadOrder();
      pollTimer = setInterval(loadOrder, 10000);

      return () => {
        active = false;
        if (pollTimer) clearInterval(pollTimer);
      };
  }, [sessionId, activeListing, currentUserInfo?.uid, currentUserInfo?.id, currentUserInfo?.user?.uid, currentUserInfo?.user?.id]);

  useEffect(() => {
      if (!sessionId) return;

      let active = true;
      let pollTimer = null;

      const loadOrderStatus = async () => {
        if (!activeListing?.id) return; // no listing yet — don't poll without a listingId
        const res = await liveOrderLookupApi({ listingId: activeListing?.id });
        if (!active) return;
        setOrderStatus(res.order?.status || null);
      };

      loadOrderStatus();
      pollTimer = setInterval(loadOrderStatus, 10000);

      return () => {
        active = false;
        if (pollTimer) clearInterval(pollTimer);
      };
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
    // Return the RESOLVED country. This used to return the pre-resolution `null`
    // whenever the caller already supplied a country, which then clobbered it at
    // every call site (a Philippines listing rendered as the default Thailand).
    return {
      country: plantDataWithCountry.country || country,
      unitPrice,
    }
  };

  // Effect for fetching comments. The 10s poll is a FALLBACK: realtime pushes
  // inserts/edits/deletes (including the end-of-session purge) and the poll only
  // covers a dead socket. Both paths MERGE through realtimeLiveComments helpers:
  // they must agree, since either can fire first.
  useEffect(() => {
      if (!sessionId) return;

      let active = true;
      let pollTimer = null;
      let unsubscribe = null;

      const loadComments = async () => {
        const res = await getLiveCommentsApi(sessionId);
        if (!active) return;
        if (res.success) {
          // Server is authoritative: this is also how a delete or the end-of-session
          // purge reaches the UI. A just-sent local row newer than everything the
          // server returned is kept (its write predates this response).
          const server = res.comments || [];
          setComments((prev) => mergeLiveCommentsFromServer(prev, server));
        }
      };

      const applyInsert = (payload) => {
        if (!active) return;
        const row = normalizeLiveCommentRow(payload?.new || {});
        if (!row.id) return;
        setComments((prev) => mergeLiveComment(prev, row));
      };

      const applyUpdate = (payload) => {
        if (!active) return;
        const row = normalizeLiveCommentRow(payload?.new || {});
        if (!row.id) return;
        setComments((prev) => mergeLiveCommentUpdate(prev, row));
      };

      // A comment that is gone (single delete, or the bulk purge on `ended`).
      // Resync rather than guessing: the purge removes every row for the session.
      const applyDelete = () => {
        if (!active) return;
        loadComments();
      };

      loadComments();
      pollTimer = setInterval(loadComments, 10000);

      subscribeToLiveComments(sessionId, {
        onInsert: applyInsert,
        onUpdate: applyUpdate,
        onDelete: applyDelete,
      })
        .then((unsub) => {
          if (!active) {
            unsub?.().catch(() => {});
            return;
          }
          unsubscribe = unsub;
        })
        .catch((err) => {
          // Realtime unavailable (offline, token mint failed): the poll carries it.
          console.warn('live comments realtime unavailable:', err?.message || err);
        });

      return () => {
        active = false;
        if (pollTimer) clearInterval(pollTimer);
        if (unsubscribe) unsubscribe().catch(() => {});
      };
    }, [sessionId]);

  const deleteComment = async (commentId) => {
    try {
        await deleteLiveCommentApi({ sessionId, commentId });
    } catch (error) {
        console.error("Error deleting comment: ", error);
        Alert.alert('Error', 'Failed to delete comment');
    }
  };

  const startEditing = (comment) => {
    setEditingComment(comment);
    setNewComment(comment.message);
    setIsCommentFocused(true);
  };

  const handleLongPressComment = (comment) => {
    // Join notices are not the viewer's own comment: no edit/delete affordance.
    if (comment.isJoin) return;
    const userId = currentUserInfo?.uid || currentUserInfo?.id || currentUserInfo?.user?.uid || currentUserInfo?.user?.id;
    
    if (comment.uid !== userId) return; 

    Alert.alert(
      'Comment Options',
      'Choose an action',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Edit', onPress: () => startEditing(comment) },
        { text: 'Delete', style: 'destructive', onPress: () => deleteComment(comment.id) },
      ]
    );
  };

  const handleSendComment = async () => {
      const commentToSend = newComment;
      
      // Extract uid properly (handles different user object structures)
      const userId = currentUserInfo?.uid || currentUserInfo?.id || currentUserInfo?.user?.uid || currentUserInfo?.user?.id;
      
      if (commentToSend.trim() === '' || !sessionId || !userId) return;
      
      // Extract name properly (handles nested structure)
      const userName = currentUserInfo?.username || 
                       currentUserInfo?.user?.username ||
                       currentUserInfo?.displayName ||
                       currentUserInfo?.user?.displayName ||
                       `${currentUserInfo?.firstName || ''} ${currentUserInfo?.lastName || ''}`.trim() ||
                       `${currentUserInfo?.user?.firstName || ''} ${currentUserInfo?.user?.lastName || ''}`.trim() ||
                       'Anonymous';
      
      setNewComment(''); // Clear input after sending
      setEditingComment(null); // Clear editing state

      // Optimistic: show the comment the instant send is tapped. The id is
      // generated HERE and sent to the server, so the same row comes back over
      // Realtime/the poll and merges in place instead of duplicating.
      if (editingComment) {
        setComments((prev) => mergeLiveCommentUpdate(prev, { ...editingComment, message: commentToSend, pending: true }));
        try {
          await updateLiveCommentApi({ sessionId, commentId: editingComment.id, message: commentToSend });
        } catch (error) {
          console.error('Error editing comment:', error);
        }
        return;
      }

      const pendingComment = createPendingLiveComment({
        message: commentToSend,
        name: userName,
        avatar: profilePhotoUrl || currentUserInfo?.profileImage || currentUserInfo?.user?.profileImage || `https://gravatar.com/avatar/19bb7c35f91e5f6c47e80697c398d70f?s=400&d=mp&r=x`,
        uid: userId,
      });
      setComments((prev) => mergeLiveComment(prev, pendingComment));

      try {
        const res = await addLiveCommentApi({
          sessionId,
          id: pendingComment.id,
          message: commentToSend,
          name: userName,
          avatar: profilePhotoUrl || currentUserInfo?.profileImage || currentUserInfo?.user?.profileImage || `https://gravatar.com/avatar/19bb7c35f91e5f6c47e80697c398d70f?s=400&d=mp&r=x`, // Fallback avatar
          uid: userId,
        });
        if (!res.success) {
          // The write failed: drop the optimistic row so the chat doesn't show a
          // comment no one else can see.
          console.error('Error sending comment:', res.error);
          setComments((prev) => prev.filter((c) => c.id !== pendingComment.id));
        }
      } catch (error) {
        console.error('Error sending comment:', error);
        setComments((prev) => prev.filter((c) => c.id !== pendingComment.id));
      }
  };

  // Messages and join notices as ONE chronological feed. Memoised so a background poll (every
  // 10s) does not re-sort and re-render the whole list while the user is reading or typing.
  const chatFeed = useMemo(
    () => buildLiveChatFeed(comments, joinedUsers),
    [comments, joinedUsers],
  );

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
    
    if (navigation.canGoBack()) {
      navigation.goBack();
    } else {
      navigation.navigate('Live');
    }
  }

  const fetchToken = async () => {
      try {
        const buyerAvatar = await AsyncStorage.getItem('profilePhotoUrl');
        setProfilePhotoUrl(buyerAvatar);

        // Derive a stable, unique uid for THIS viewer so it never collides with
        // the broadcaster or other viewers (a uid collision makes Agora kick the
        // existing user, surfacing as "no broadcaster found").
        const userId = currentUserInfo?.uid || currentUserInfo?.id || currentUserInfo?.user?.uid || currentUserInfo?.user?.id;
        const uid = getAgoraUid(userId);
        setMyUid(uid);

        const response = await generateAgoraToken(sessionId, uid);

        if (response.token && response.appId && response.channelName) {
          setToken(response.token);
          setAppId(response.appId);
          setChannelName(response.channelName);
        } else {
          throw new Error(response.error || 'Invalid token response from server');
        }
      } catch (error) {
        console.error('Error fetching token:', error);
        setError(error.message);
      }
};

 useEffect(() => {
  if (!activeListing) return;
   loadPlantDetails();
  }, [activeListing]);


  useEffect(() => {
    if (!sessionId || !brodcasterId) return;

    let active = true;
    let pollTimer = null;

    const loadActiveListing = async () => {
      const res = await getActiveLiveListingApi(brodcasterId);
      if (!active) return;
      if (res.success && res.data) {
        console.log('Active listing found:', res.data.id, res.data);
        setActiveListing({ id: res.data.id, ...res.data });
      } else {
        setActiveListing(null);
      }
    };

    loadActiveListing();
    pollTimer = setInterval(loadActiveListing, 10000);

    return () => {
      active = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [sessionId, brodcasterId]);

  // The IG<n> label is stored on the listing (liveIgIndex), assigned once at
  // creation — same source the seller screen uses. It must NOT be derived from
  // the position in this result set: a sold or deleted listing shifts every row
  // below it, so the buyer would read a different number than the seller.
  useEffect(() => {
    if (!sessionId) return;

    let active = true;
    let pollTimer = null;

    const loadIndex = async () => {
      const res = await getLiveListingsBySessionApi(sessionId, 'Live');
      if (!active) return;
      const indexMap = {};
      (res.data || []).forEach((item) => {
        if (item.liveIgIndex == null || String(item.liveIgIndex).trim() === '') return;
        if (item.id) indexMap[item.id] = `IG${item.liveIgIndex}`;
      });
      setSessionListingIndexMap(indexMap);
    };

    loadIndex();
    pollTimer = setInterval(loadIndex, 10000);

    return () => {
      active = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [sessionId]);

  useEffect(() => {
     if (!sessionId) return;

     console.log(`Setting up poll for live session: ${sessionId}`);
     let active = true;
     let pollTimer = null;

     const loadSession = async () => {
       const res = await getLiveDetailApi(sessionId);
       if (!active) return;
       if (res.success && res.session) {
         const data = res.session;
         console.log('Live session data updated:', data);
         setLiveStats(data);

         // Authoritative broadcaster uid comes from the live session, not the
         // share URL's ?seller= param — normal navigation and deep links both
         // end up here, and the active-listing lookup filters on this uid.
         if (data.createdBy && (data.createdBy !== brodcasterId)) {
           setBrodcasterId(data.createdBy);
         }

         const joinNotifications = data?.joiners || [];

         setJoinedUsers(Array.isArray(joinNotifications) ? joinNotifications : []);
       } else {
         console.log('Live session document does not exist.');
       }
     };

     loadSession();
     pollTimer = setInterval(loadSession, 10000);

     return () => {
       active = false;
       if (pollTimer) clearInterval(pollTimer);
     };
   }, [sessionId, brodcasterId]);

  useEffect(() => {
    if (sessionId) {
      fetchToken();
    }
  }, [sessionId]);

  useEffect(() => {
    const startAgora = async () => {
      if (!token || !appId || !channelName) {
          console.log('Waiting for token, appId, and channelName...');
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
          const userId = currentUserInfo?.uid || currentUserInfo?.id || currentUserInfo?.user?.uid || currentUserInfo?.user?.id;
          if (comments.filter(a => a.message === 'Joined 👋' && a.uid === userId).length === 0) {
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
        rtc.joinChannel(token, channelName, myUid ?? 0, {
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

  const handleAddToCart = async (item) => {
    try {
      setIsLoading(true);
      const plantDatas = await loadPlantDetails(item);
      
      if (!plantDatas) {
        // loadPlantDetails handles the error alert
        return;
      }

      let country = plantDatas.country;
      if (!country) {
        const mapCurrencyToCountry = (localCurrency) => {
          if (!localCurrency) return 'ID'; 
          switch (localCurrency.toUpperCase()) {
            case 'PHP': return 'PH';
            case 'THB': return 'TH';
            case 'IDR': return 'ID';
            default: return 'ID';
          }
        };
        country = mapCurrencyToCountry(plantDatas.localCurrency);
      }

      const cartData = {
        plantCode: plantDatas.plantCode,
        quantity: 1,
        potSize: plantDatas.potSize || (plantDatas.availablePotSizes ? plantDatas.availablePotSizes[0] : null) || 'Standard',
        country: country,
        notes: `${plantDatas.genus} ${plantDatas.species} - ${plantDatas.variegation || 'Standard'}`
      };

      const response = await addToCartApi(cartData);

      if (!response.success) {
        throw new Error(response.error || 'Failed to add to cart');
      }

      Alert.alert('Success', 'Plant added to cart successfully!');

    } catch (error) {
      let errorMessage = 'Failed to add item to cart';
      if (error.message.includes('No active listing found')) {
        errorMessage = `This plant is currently not available for purchase.`;
      } else if (error.message.includes('Insufficient stock')) {
        errorMessage = 'Sorry, not enough items in stock.';
      } else if (error.message) {
        errorMessage = error.message;
      }
      const isExpired = /listing has expired/i.test(errorMessage);
      Alert.alert(isExpired ? 'Listing Expired' : 'Error', errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  // Opens the LIVE checkout modal immediately on the tapped row's display data and
  // loads the authoritative detail underneath. The modal is fed the row directly from
  // ShopModal rather than the shared `plantData`/`activeListing` state, which is what
  // used to make the tap wait on (and depend on) unrelated in-flight requests.
  const buyNow = async (item) => {
    const optimistic = optimisticPlantDataFromListing(item);

    if (!optimistic) {
      Alert.alert('Error', 'This plant is not available for purchase.');
      return;
    }

    // No blocking spinner here on purpose: the checkout modal opens straight away and
    // shows its own skeletons, so the full-screen `isLoading` Modal would be a second
    // Modal competing with it for presentation (iOS presents one at a time) — the
    // checkout sheet then silently fails to appear.
    setIsLiveCheckoutPending(true);
    setCheckOutData({
      ...optimistic,
      plantData: { ...optimistic.plantData, flightDate: null, cargoDate: null },
      plantCode: optimistic.plantData.plantCode,
      isLive: true,
    });
    setIsLiveShopCheckoutVisible(true);

    try {
      // loadPlantDetails only resolves once the detail API answered — a caught failure
      // resolves undefined, so the guard covers both the error and the retry-exhausted path.
      const plantDatas = await loadPlantDetails({ plantCode: optimistic.plantData.plantCode });
      if (!plantDatas) {
        return; // loadPlantDetails already alerted
      }

      const discountsData = await getDiscountedPrice(item, {
        ...plantDatas,
        country: plantDatas.country || optimistic.plantData.country,
      });

      setCheckOutData({
        fromBuyNow: true,
        plantData: {
          ...plantDatas,
          country: discountsData.country,
          flightDate: plantDatas?.flightDate || plantDatas?.cargoDate || null,
          cargoDate: plantDatas ? plantDatas.cargoDate : null,
        },
        selectedPotSize: plantDatas ? plantDatas.potSize : null,
        quantity: 1,
        plantCode: plantDatas ? plantDatas.plantCode : null,
        totalAmount: discountsData.unitPrice * 1,
        isLive: true,
      });
    } catch (error) {
      console.log('error', error);
      setIsLiveShopCheckoutVisible(false);
      Alert.alert('Error', 'Could not load this plant. Please try again.');
    } finally {
      // Must clear on every path: a stale `true` would leave the modal stuck on skeletons
      // for the next time it opens.
      setIsLiveCheckoutPending(false);
    }
  }

  // Effect to fetch order for the active listing
  useEffect(() => {
    if (!activeListing?.id) {
      setSoldToUser(null); // Reset when there's no active listing
      return;
    }

    let active = true;
    let pollTimer = null;

    const loadSoldTo = async () => {
      const res = await liveOrderLookupApi({ listingId: activeListing.id, status: 'Ready to Fly' });
      if (!active) return;
      if (res.success && res.order) {
        setSoldToUser(res.buyerUsername ? `@${res.buyerUsername}` : null);
      } else {
        setSoldToUser(null); // No pending payment order found
      }
    };

    loadSoldTo();
    pollTimer = setInterval(loadSoldTo, 10000);

    return () => {
      active = false;
      if (pollTimer) clearInterval(pollTimer);
    };
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

  // Duration-matched to the iOS keyboard so the rail rides the keyboard rather than racing it.
  // Driven by focus (not keyboard events) so Android, where `adjustResize` resizes the window and
  // keyboard events do not fire, lands in the same state. `useNativeDriver: false` because the
  // value drives a plain style on a JS-animated node; the move is two frames of transform either
  // way and correctness beats the marginal native win here.
  useEffect(() => {
    Animated.timing(sideRailShift, {
      toValue: isCommentFocused ? SIDE_RAIL_HIDDEN_OFFSET : 0,
      duration: 250,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [isCommentFocused, sideRailShift]);

  // The card slides down out of the column while the keyboard comes up, and back when it goes.
  // Same 250ms/curve as the rail so the three movements (rail, card, keyboard) read as one.
  // The collapsed value is 0 and the expanded value is the measured height, which is why the
  // `toValue` is inverted relative to focus.
  useEffect(() => {
    if (!cardMeasured) return;
    cardAnimatingRef.current = true;
    const timing = { duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: false };
    Animated.parallel([
      Animated.timing(cardCollapse, {
        toValue: isCommentFocused ? 0 : cardHeightRef.current,
        ...timing,
      }),
      Animated.timing(cardFade, { toValue: isCommentFocused ? 0 : 1, ...timing }),
    ]).start(({ finished }) => {
      cardAnimatingRef.current = !!finished;
    });
  }, [isCommentFocused, cardMeasured, cardCollapse, cardFade]);

  // Measure the card so the collapse knows its travel. Layout events also fire throughout the
  // animation with intermediate heights, and writing those back would fight the running
  // `timing` (and a collapsed card re-reports 0), so both are ignored.
  const onCardLayout = event => {
    const h = event.nativeEvent.layout.height;
    if (h <= 0 || cardAnimatingRef.current) return;
    cardHeightRef.current = h;
    cardCollapse.setValue(h);
    if (!cardMeasured) setCardMeasured(true);
  };

  // While the keyboard is up the chat is pinned to a fixed minimal height so the column can
  // never reach the top bar; otherwise it falls back to its resting 300pt cap. Plain state rather
  // than an animated node — `minHeight`/`maxHeight` are not interpolatable by the native module,
  // and the jump is invisible next to the keyboard's own travel.
  // No `flex` here on purpose: `flex: 1` sets flexBasis 0, and the list measured 43pt (its
  // minHeight floor) instead of the space it was given. Left alone it sizes to its content and
  // stops at styles.commentList's 300pt cap, which is what lets it take the room freed by the
  // hidden plant card while `leftColumn.paddingTop` keeps it off the back button.
  const chatHeight = { minHeight: CHAT_MIN_HEIGHT };

  // Until the card has been measured there is no height to animate to, so it renders at its
  // natural size; afterwards the animated pixel height takes over.
  const cardWrapStyle = cardMeasured
    ? { height: cardCollapse, opacity: cardFade }
    : null;

  // The rail's slide-out. Kept as a value rather than an inline style prop so the transform
  // object is not re-created on every render, and because the linter rejects style literals.
  const railSlideStyle = { transform: [{ translateX: sideRailShift }] };

  const gotoPayToBoard = async () => {
    setIsLoading(true);
    navigation.navigate('Orders', { initialTab: 'Pay to Board' });
  }

  // Dismiss on scroll/drag so the composer never strands the keyboard open over the chat.
  const dismissKeyboard = () => Keyboard.dismiss();

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
          listingDetails={checkOutData}
      />
     
      <View style={styles.stream}>
        {joined && remoteUid ? (
          Platform.OS === 'ios' ? (
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
              <RtcTextureView
                style={styles.video}
                canvas={{
                  uid: remoteUid,
                  renderMode: 1, // FIT mode
                  mirrorMode: 0  // No mirror
                }}
                zOrderMediaOverlay={true}
              />
            )
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
      
      {/* A single uniform, edge-less scrim. There is deliberately no separate bottom-weighted
          band: a 46%-tall overlay put a visible hard edge across the middle of the video
          (the "transparent black at half the screen"). Each surface keeps its own tint. */}
      <View pointerEvents="none" style={styles.scrimBase} />

      {/* Only show UI components when stream is active */}
      {joined && remoteUid && (
        <>
          <View style={styles.topBar}>
            {/* Back button and viewer count group on the LEFT, both on the same 16pt content
                line: the pill reads as a label for the stream rather than a floating control
                adrift in the middle of the video. */}
            <View style={styles.headerSideStart}>
              <TouchableOpacity onPress={() => goBack()} activeOpacity={0.8}>
                <GlassView
                  variant="control"
                  radius={14}
                  style={styles.backButton}>
                  <BackSolidIcon width={24} height={24} />
                </GlassView>
              </TouchableOpacity>
              <GlassView variant="control" radius={18} style={styles.liveViewer}>
                <ViewersIcon width={18} height={18} />
                <Text style={styles.liveViewerText}>{formatViewersLikes(liveStats?.viewerCount || 0)}</Text>
              </GlassView>
            </View>
            <View style={styles.headerSideEnd}>
              {/* <TouchableOpacity style={styles.guide} onPress={() => setIsGuideModalVisible(true)}>
                    <GuideIcon width={19} height={19} fill="#FFFFFF" />
                    <Text style={styles.guideText}>Guide</Text>
              </TouchableOpacity> */}
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
              <View style={styles.stickyNoteFooter}>
                <TouchableOpacity style={styles.stickyNoteGuideButton} onPress={() => setIsGuideModalVisible(true)}>
                  <GuideIcon style={{backgroundColor: '#539461', borderRadius: 12}} width={16} height={16} />
                  <Text style={styles.stickyNoteGuideText}>Shop guidelines</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
          
      {/* Only the action column rides the keyboard. It deliberately does NOT wrap the stream:
          KeyboardAvoidingView is a plain View, so an absolute-fill child inside it is confined
          to its (safe-area inset) box and the video letterboxes top and bottom. As a direct
          child of the SafeAreaView the stream keeps filling the whole screen.

          `padding` on BOTH platforms. Android used `height` on the assumption that
          windowSoftInputMode=adjustResize shrinks the window there, but this build is
          edge-to-edge (android/gradle.properties edgeToEdgeEnabled=true), so the DecorView
          stays 800dp and the IME is NOT subtracted from it. Under `height` that broke two
          ways: the avoider's frame never rose with the keyboard, so
          `frame.y + frame.height - keyboardY` over-counted the keyboard; and because
          `height` ALSO shrinks the view, the shrink moved the view down, which enlarged the
          next delta (traced: 203 -> 406 -> 609 -> 1015). `state.bottom` then exceeded
          `_initialFrameHeight`, so RN rendered `height: 650 - 1015 = -365` and the whole
          action column (composer, chat, product card) collapsed.

          `padding` cannot do that: it never sets an explicit height, and the non-height
          branch of `_relativeKeyboardHeight` reads the live frame, so it self-corrects to 0
          if a future config DOES resize the window. It also matches the iOS path already
          verified here. */}
      <KeyboardAvoidingView
        style={styles.keyboardAvoider}
        behavior="padding"
        keyboardVerticalOffset={0}>
      <View style={styles.actionBar}>
        <View style={styles.social}>
              <View style={styles.leftColumn}>
                {/* One feed, one list: join notices and messages interleaved by time. The
                    list is capped by styles.commentList (maxHeight) and scrolls inside that
                    box, so a long session can never push the panel over the video. */}
              <View style={styles.comments}>
                <FlatList
                  style={[styles.commentList, chatHeight]}
                  contentContainerStyle={styles.commentListContent}
                  ref={flatListRef}
                  data={chatFeed}
                  keyExtractor={(item) => item.id}
                  /* Scrolling stays; only the indicator is suppressed, as asked. */
                  showsVerticalScrollIndicator={false}
                  keyboardDismissMode="on-drag"
                  keyboardShouldPersistTaps="handled"
                  onScrollBeginDrag={dismissKeyboard}
                  renderItem={({ item }) => (
                    /* Every entry — comment or join notice alike — is one glass pill. The row
                       owns no surface of its own; GlassView supplies the fill, hairline border
                       and clip. `commentRow` is still what measures/aligns the avatar + text. */
                    <GlassView variant="chatRow" style={styles.commentRow}>
                      <TouchableOpacity
                        style={styles.commentRowTouch}
                        onLongPress={() => handleLongPressComment(item)}
                        activeOpacity={0.7}
                      >
                        <AppImage source={{ uri: item.avatar }} style={styles.avatar} />
                        {/* One wrapping line: bold name then the message, as in the reference.
                            A nested Text keeps them inline while the whole run still wraps. A join
                            notice is the same shape, so it needs no branch. */}
                        <Text style={styles.chatLine} numberOfLines={4}>
                          <Text style={styles.chatName}>{item.name}</Text>
                          <Text style={styles.chatMessage}>{`: ${item.message}`}</Text>
                        </Text>
                      </TouchableOpacity>
                    </GlassView>
                  )}
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
                  <AppImage source={{ uri: item.avatar }} style={styles.avatar} />
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
              {/*
                * This rail is a SIBLING of the chat column, not an overlay, so it cannot be
                * drawn behind the keyboard — the only way to get it out of the composer's way
                * is to slide it off the right edge. SIDE_RAIL_HIDDEN_OFFSET carries the measured
                * value; the style is a hoisted object because `StyleSheet.create` freezes its
                * values in DEV and the animated styles must stay writable.
                */}
              <Animated.View style={[styles.railWrap, railSlideStyle]}>
              <GlassView variant="rail" style={styles.sideActions}>
              <TouchableOpacity
                style={styles.sideAction}
                onPress={() => shareLiveStream(sessionId, brodcasterId)}
                accessibilityLabel="Share live">
                <View style={styles.sideActionIconWrap}>
                  <ShareReferralIcon width={26} height={26} />
                </View>
                <Text style={styles.sideActionNotesText}>Share</Text>
              </TouchableOpacity>
              {(() => {
                const userId = currentUserInfo?.uid || currentUserInfo?.id || currentUserInfo?.user?.uid || currentUserInfo?.user?.id;
                return liveStats?.lovedByUids && liveStats?.lovedByUids.includes(userId) ? (
                  <TouchableOpacity onPress={() => toggleLove()} style={styles.sideAction}>
                    <View style={styles.sideActionIconWrap}>
                      <ActiveLoveIcon width={26} height={26} />
                    </View>
                    <Text style={styles.sideActionText}>{formatViewersLikes(liveStats.likeCount)}</Text>
                  </TouchableOpacity>
                ) : (
                  <TouchableOpacity onPress={() => toggleLove()} style={styles.sideAction}>
                    <View style={styles.sideActionIconWrap}>
                      <LoveIcon width={26} height={26} />
                    </View>
                    <Text style={styles.sideActionText}>{formatViewersLikes(liveStats.likeCount)}</Text>
                  </TouchableOpacity>
                );
              })()}
              <TouchableOpacity onPress={() => setShowStickyNote(!showStickyNote)} style={styles.sideAction}>
                <View style={styles.sideActionIconWrap}>
                  <NoteIcon width={26} height={26} />
                </View>
                <Text style={styles.sideActionNotesText}>Notes</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sideAction} onPress={() => setIsShopModalVisible(true)}>
                <View style={styles.sideActionIconWrap}>
                  <ShopIcon width={26} height={26} />
                </View>
                <Text style={styles.sideActionNotesText}>Shop</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.sideAction} onPress={() => navigation.navigate('ScreenCart')}>
                <View style={styles.sideActionIconWrap}>
                  <CartIconSelected width={26} height={26} />
                </View>
                <Text style={styles.sideActionNotesText}>Cart</Text>
              </TouchableOpacity>

             
          </GlassView>
              </Animated.View>
        </View>
        {/* The comment pill belongs to the full-width column, not the 48% chat column: it
            spans the screen like the product card below it. Kept above the card so the
            reading order stays chat -> input -> product. */}
        <GlassView
            variant="pill"
            style={styles.commentPill}>
          {/* Auto-grows to a 4-line ceiling, then scrolls inside. Sizing is left to the
              NATIVE side (minHeight/maxHeight + multiline, no explicit `height` — an
              explicit height pins the native view and stops it re-measuring). Return
              still SENDS: `submitBehavior` replaces `blurOnSubmit` on a multiline input,
              whose default would be 'newline'. */}
          {/* The touchable owns the pill's padding rather than sitting inside it. Padding on the
              pill itself is OUTSIDE this child, so taps on it fell straight through: measured
              card-visible after a tap at x=28 (pill padding) and x=200,y=575 (top padding), while
              the same tap on the 20pt text band focused correctly. The pill is 46pt tall, so that
              dead band was over half of it. */}
          <TouchableWithoutFeedback onPress={() => commentInputRef.current?.focus()}>
          <View style={styles.commentPillTouch}>
          <TextInput
              ref={commentInputRef}
              style={styles.commentInput}
              placeholder="Ask a question or comment..."
              placeholderTextColor="rgba(255, 255, 255, 0.62)"
              value={newComment}
              onChangeText={setNewComment}
              onSubmitEditing={handleSendComment}
              onFocus={() => setIsCommentFocused(true)}
              onBlur={() => setIsCommentFocused(false)}
              returnKeyType="send"
              submitBehavior="blurAndSubmit"
              multiline
              // The visible 4-line cap. Also the shrink trigger: Fabric skips the
              // re-measure when the value is cleared, so crossing empty/non-empty must
              // change this prop or the box stays tall and empty after send
              // (facebook/react-native#54570, iOS Fabric).
              numberOfLines={newComment === '' ? 1 : 4}
              textAlignVertical="top"
          />
          </View>
          </TouchableWithoutFeedback>
        </GlassView>
        {soldToUser && (
          <View style={styles.soldToContainer}>
            <Text style={styles.soldToText}>Sold to {soldToUser}</Text>
          </View>
        )}
        {/* The plant card slides down and fades while typing, freeing its ~208pt for the chat.
            It is animated rather than unmounted: an instant conditional removal read as a jump,
            and the column below the chat would reflow in a single frame. Height animates by the
            card's own measured px, so no interpolation is involved. */}
        {activeListing && (
          <Animated.View
            onLayout={onCardLayout}
            style={[styles.plantCardWrap, cardWrapStyle]}
            pointerEvents={isCommentFocused ? 'none' : 'auto'}
            accessibilityElementsHidden={isCommentFocused}
            importantForAccessibility={isCommentFocused ? 'no-hide-descendants' : 'auto'}>
            <GlassView variant="dark" radius={28} style={styles.shopGlass}>
            <View style={styles.plant}>
              <View style={styles.plantDetails}>
                <PlantListingImage
                  uri={getShopListingImageUri(activeListing)}
                  style={styles.listingThumb}
                  resizeMode="cover"
                />
                <View style={styles.plantName}>
                  {/* The IG<n> index sits with the plant name it identifies, not floating in the
                      header. It is the same sessionListingIndexMap value the shop list uses. */}
                  <View style={styles.nameRow}>
                    {sessionListingIndexMap[activeListing.id] ? (
                      <View style={styles.listingIndexBadge}>
                        <Text style={styles.listingIndexBadgeText}>
                          {sessionListingIndexMap[activeListing.id]}
                        </Text>
                      </View>
                    ) : null}
                    <Text style={[styles.name, styles.nameRowText]} numberOfLines={1}>{activeListing.genus}</Text>
                  </View>
                  <Text style={styles.name} numberOfLines={2}>{activeListing.species}</Text>
                  <Text style={styles.variegation} numberOfLines={1}>
                    {activeListing.variegation} {activeListing?.variegation ? '•' : ''} {activeListing.potSize}
                  </Text>
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
                    <Text style={styles.shipText} numberOfLines={2}>{liveShippingLabel(activeListing)}</Text>
                  </View>
                </View>
            </View>
            <View style={[styles.actionButton, styles.actionButtonRow]}>
              {buyerPendingPayment?.status === 'pending_payment' && (
                <TouchableOpacity onPress={() => {gotoPayToBoard()}} style={styles.actionButtonTouch}>
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
                <>
                  <LiveStreamAddToCartButton
                    onPress={() => handleAddToCart(activeListing)}
                    variant="gradientLight"
                    radius={18}
                    style={styles.addToCartButton}
                  />
                  <TouchableOpacity
                    onPress={() => {
                      buyNow(activeListing);
                    }}
                    style={styles.buyNowButton}
                    activeOpacity={0.85}>
                    {/* The gradient is a painting layer only: the Svg is an absolute fill, so it
                        sits behind the label and contributes no layout height of its own. */}
                    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
                      <Defs>
                        <SvgLinearGradient id="buyNowGradient" x1="0" y1="0" x2="0" y2="1">
                          <Stop offset="0" stopColor="#7CC97C" />
                          <Stop offset="1" stopColor="#2E6B3E" />
                        </SvgLinearGradient>
                      </Defs>
                      <Rect x="0" y="0" width="100%" height="100%" rx="18" ry="18" fill="url(#buyNowGradient)" />
                    </Svg>
                    <Text style={[styles.actionText, styles.buyNowText]}>Buy Now</Text>
                  </TouchableOpacity>
                </>
              )} 
            </View>
            </GlassView>
          </Animated.View>
        )}
        {!activeListing && (<View style={styles.shop}>
                      <Text style={{...baseFont, fontSize: 16, color: '#FFF'}}>No active listing</Text>
                    </View>)}
          </View>
      </KeyboardAvoidingView>
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
        sessionListingIndexMap={sessionListingIndexMap}
        onBuyNow={handleBuyFromShop}
        onAddToCart={handleAddToCart}
      />

      <LiveShopCheckoutModal
        isVisible={isLiveShopCheckoutVisible}
        onClose={() => {
          setIsLiveShopCheckoutVisible(false);
          setIsLiveCheckoutPending(false);
        }}
        isPending={isLiveCheckoutPending}
        listingDetails={checkOutData}
      />
      
    </SafeAreaView>
  );
};

export default BuyerLiveStreamScreen;

// Reserved band at the top of the chat column for the header overlay, which floats on the
// stream rather than being laid out above it. Back button measures y=73..117pt on the iPhone 17
// sim; 130 clears its bottom edge with a 13pt margin.
const HEADER_CLEARANCE = 130;
// One chat row measures 36pt with its `gap`, so this floor leaves a line of context visible.
const CHAT_MIN_HEIGHT = 44;
// The rail is 56pt wide, sits 8pt from the right edge, and its left edge lands at x=322 when
// closed — so it needs 80pt to clear the 402pt screen. 100 is that plus a margin; the screen
// edge does the clipping.
const SIDE_RAIL_HIDDEN_OFFSET = 100;

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
    paddingTop: 1,
    // SafeAreaView already insets for the home indicator; a second 24pt here stacked on top of
    // it and pushed the product card ~24pt off the bottom of the screen.
    paddingBottom: 8,
    backgroundColor: '#000',
  },
  stream: {
    ...StyleSheet.absoluteFill,
    backgroundColor: '#444',
    overflow: 'hidden',
  },
  // A single flat scrim over the whole frame so white chat text keeps contrast on a bright
  // video. Kept deliberately light, and uniform: the video is the hero, so there must be no
  // band or edge anywhere in it.
  scrimBase: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
  },
  // Full-bleed transparent overlay: it positions the chat column (left) and the rail
  // (right edge) independently. A space-between row would otherwise let the rail's width
  // push the chat off-centre, and this is also the only way to pin the rail to the screen
  // edge while the 16pt-inset content below keeps its alignment line.
  social: {
    // A normal flex child of the actionBar column, NOT an absolute overlay. As an overlay it
    // inherited the whole column height and centred itself, which rode its top ~42pt up into
    // the header and ran the chat column straight through the back button and viewer pill.
    // As a flex child the column bounds it between the header above and the comment pill below.
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    // No left inset here on purpose: the chat column carries the 16pt screen inset in its own
    // padding, so its rows land on the SAME content line as the back button above and the
    // comment pill below (was 16 + 10 inside the column = ~30pt, which read as a margin).
    paddingLeft: 0,
    paddingRight: 8,
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
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 16,
    width: '100%',
  },
  // Equal-flex shoulders: the centre pill lands on the SCREEN's centre line regardless of how
  // wide the back button or the IG pill happen to be. Do not revert to space-between.
  headerSideStart: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-start',
    gap: 10,
  },
  headerSideEnd: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
  },
  // 44pt visual / tappable circle, matching the reference's floating glass back control.
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  // The two header pills group together and stay right-aligned; the back button is the only
  // thing on the left, so the group reads as centred-ish without faking a fixed offset.
  topAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  // The plant index badge that sits with the product name in the card.
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  nameRowText: {
    flexShrink: 1,
  },
  listingIndexBadge: {
    paddingHorizontal: 6,
    height: 18,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 9,
    backgroundColor: 'rgba(255, 255, 255, 0.18)',
  },
  listingIndexBadgeText: {
    color: '#fff',
    fontWeight: '700',
    fontSize: 11,
    fontFamily: 'Inter',
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
  // Compact green audience capsule. 58pt per the mockup spec; radius = height/2.
  // Compact dark capsule beside the back button, matching the reference header. It is a
  // GlassView surface, so the green fill is gone and the tint comes from the control variant.
  liveViewer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 14,
    gap: 6,
    height: 36,
    borderRadius: 18,
    marginLeft: 10,
  },
  liveViewerText: {
    ...baseFont,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
    color: '#FFFFFF',
  },
  actionBar: {
    // The full-width column: the comment pill and the product card both live here, so they
    // share one 16pt inset. The chat column + rail float separately in the absolute overlay
    // (styles.social) and are therefore NOT laid out inside this column.
    flexDirection: 'column',
    justifyContent: 'flex-end',
    paddingHorizontal: 16,
    gap: 12,
    width: '100%',
    flex: 1,
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
    // Bare left column: it HUGS its messages and grows upward from the bottom (justifyContent
    // flex-end), so a quiet chat stays a small block instead of an empty half-screen box;
    // maxHeight + flexShrink stop a busy chat from pushing past the column the parent gives it.
    // It carries NO surface of its own — the video runs edge to edge behind the messages.
    flexDirection: 'column',
    justifyContent: 'flex-end',
    // Pinned to the bottom of the row and only as tall as its messages, so a quiet chat is a
    // small card sitting on the input. A forced height:'100%' here turned it into a tall empty
    // box with the messages stranded at the bottom.
    alignSelf: 'flex-end',
    maxHeight: '100%',
    // A DEFINITE width. With only `maxWidth` the panel sized to its content, the content sized
    // to the panel, and the `flex: 1` text column resolved to zero — the avatars drew while
    // every message vanished.
    width: '66%',
    // Bare overlay: no chat surface behind the messages. The video shows straight through, so
    // any future legibility work has to live on the text itself (shadow, not a panel tint).
    backgroundColor: 'transparent',
    borderRadius: 16,
    // 16 aligns the avatars with the screen's content line (back button, comment pill); the
    // previous 10 was stacked on top of social's own 16 and read as an unindented panel.
    paddingHorizontal: 0,
    paddingVertical: 10,
    // The header (back button, viewer pill) is an absolute overlay on the stream, so the column
    // underneath it is free to grow to the very top of the screen. Reserving the header's band
    // here is what stops the chat from sliding up under the back button when the keyboard is up
    // and the list is allowed to take all the space the hidden plant card freed. Without it the
    // rows measured y=20 and y=66 against a back button at y=73..117.
    paddingTop: HEADER_CLEARANCE,
    overflow: 'hidden',
  },
  // The join notice is no longer a separate block: joiners are interleaved into the chat feed
  // above, so the old joinNotification*/joinList*/joined* styles are gone. `commentContent` IS
  // still used — by the commented-out legacy list further down the render.
  comments: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    gap: 14,
    width: '100%',
  },
  // FlatList has no intrinsic height: without flex it collapses to 0 inside the panel and the
  // chat silently renders nothing. It must own the remaining height of the panel.
  // `maxHeight` is the comment-height LIMIT the user asked for: the list stops at 300pt and
  // scrolls inside that box, so a busy session cannot fill the screen with chat. `flexShrink: 1`
  // is what lets it give height back to the input pill below it instead of overflowing.
  // Clips the plant card as it animates to zero height. The card's own shadow is clipped with
  // it, which is only visible mid-animation.
  plantCardWrap: {
    width: '100%',
    overflow: 'hidden',
  },
  // The rail is a flex child of the 48% chat column, so it needs centring once translated.
  railWrap: {
    alignSelf: 'center',
  },
  commentList: {
    width: '100%',
    borderRadius: 16,
    maxHeight: 300,
    flexShrink: 1,
  },
  commentRow: {
    // The glass pill around ONE row (GlassView takes the fill/border/radius). `alignSelf` keeps
    // it hugging its content instead of stretching to the list width, so a short comment is a
    // short pill. Gap between rows lives in `commentListContent` — a glass sibling never uses
    // margin, which would break the border clip.
    alignSelf: 'flex-start',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  // Inside the pill: avatar + text, on the row's own padding so the glass edge is not touched.
  commentRowTouch: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  // The rows need to be visually separate now that each carries its own border: a gap here
  // (not a row margin) is what keeps a glass sibling's edge clean.
  commentListContent: {
    flexGrow: 0,
    gap: 8,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: '#539461',
  },
  // The row hugs its content, so this Text must NOT be `flex: 1` — a flexed child inside a
  // shrink-to-fit row resolves to zero width and the message disappears. Its intrinsic width
  // sets the pill's width; `flexShrink` lets it wrap once the row hits `commentRow.maxWidth`.
  chatLine: {
    flexShrink: 1,
  },
  chatName: {
    ...baseFont,
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 17,
    color: '#fff',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  chatMessage: {
    ...baseFont,
    fontWeight: '400',
    fontSize: 13,
    lineHeight: 22,
    flexWrap: 'wrap',
    color: '#fff',
    height: 'auto',
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  // 46pt to match the reference pill, whose edges measure at y 625.5 and y 669.5 on an 874pt
  // screen (44pt) with a 13.5pt placeholder band. Radius at half the height keeps it a capsule.
  commentPill: {
    flexDirection: 'row',
    // Top-aligned so added lines grow DOWNWARD from the first line instead of the
    // whole text block re-centring on every keystroke.
    alignItems: 'flex-start',
    width: '100%',
    // No fixed height and no padding here: both moved to commentPillTouch so the whole capsule
    // is one touch target. 13 + one 20pt line + 13 = 46pt still, the measured reference height,
    // so the single-line look is unchanged; the pill only grows once text wraps.
    borderRadius: 23,
  },
  // Carries the pill's padding (and therefore the pill's full touch area). Same 46pt as before.
  commentPillTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  // NOT multiline: a multiline TextInput aligns its text to the TOP of the box, which left the
  // placeholder jammed against the top edge with ~34pt of empty pill below it. Single-line
  // inputs centre vertically on both platforms. `height` is kept off the pill so the row's
  // alignItems centre it in the remaining space.
  commentInput: {
    // `flex: 1` is for WIDTH only — the parent is a row, so flexBasis applies to the
    // main axis. The height is left to the native auto-grow between min/maxHeight.
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    includeFontPadding: false,
    // Top-aligned: lines accumulate downward. A single line still sits centred because
    // the pill's paddingVertical equals the leftover space.
    textAlignVertical: 'top',
    // One 20pt line up to four, then iOS scrolls inside the box.
    minHeight: 20,
    maxHeight: 80,
    color: '#FFF',
    fontFamily: 'Inter',
    letterSpacing: 0.2,
    textShadowColor: 'rgba(0, 0, 0, 0.75)',
    textShadowOffset: { width: -1, height: 1 },
    textShadowRadius: 10,
  },
  // Keyboard-avoider host. `flex: 1` is what makes iOS `behavior="padding"` lift the overlay
  // column rather than squashing it, and it keeps the `height` behaviour honest on Android.
  keyboardAvoider: {
    flex: 1,
  },
  // Hugs the 56pt rail so the Animated translate is measured from the rail's own edge.
  sideActionsWrap: {
    alignSelf: 'center',
  },
  sideActions: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    width: 56,
    paddingVertical: 14,
    paddingHorizontal: 6,
    // Narrow floating capsule. No fixed height: it sizes to its five actions so it can never
    // overflow a parent or drift, and it stays clear of the product card below.
  },
  sideAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    paddingVertical: 6,
  },
  sideActionIconWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    // The icons are fixed white with stroke-width 2 in their .svg sources, which read heavy at
    // a 32pt render. Dimming here instead of editing the assets leaves the seller screens (which
    // share notes-outline / heart-outline) untouched.
    opacity: 0.82,
  },
  shopGlass: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    width: '100%',
    // No marginBottom: this card is the last child of the column, so a bottom margin is pure
    // dead space below it. The actionBar gap already separates it from the comment pill.
  },
  // Empty-state panel used when the session has no active listing; kept as a plain
  // surface rather than glass because there is no product to read through it.
  shop: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
    borderRadius: 16,
  },
  plant: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
  },
  plantDetails: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    width: '100%',
  },
  listingThumb: {
    width: 72,
    height: 72,
    borderRadius: 10,
    backgroundColor: '#1a1a1a',
  },
  plantName: {
    flexDirection: 'column',
    gap: 2,
    flex: 1,
    flexShrink: 1,
  },
  name: {
    ...baseFont,
    fontWeight: '700',
    fontSize: 15,
    lineHeight: 19,
  },
  variegation: {
    ...baseFont,
    color: 'rgba(255, 255, 255, 0.70)',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
  },
  price: {
    flexDirection: 'column',
    alignItems: 'flex-end',
    justifyContent: 'flex-start',
    gap: 6,
    flexShrink: 0,
    paddingLeft: 8,
  },
  plantPrice: {
    ...baseFont,
    fontWeight: '800',
    fontSize: 28,
    lineHeight: 32,
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
    fontSize: 10,
    marginTop: 4,
  },
  shipping: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
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
    color: 'rgba(255, 255, 255, 0.70)',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 19,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    width: '100%',
    // 48pt, not the old 60: the pair reads as compact controls inside the product card. Every
    // child in this row must carry the same height or it overflows the row's box.
    height: 48,
  },
  // Single-child states (Pending Payment / Awaiting new item) stretch full width; the
  // two-button state keeps each child at flex:1 through this override.
  actionButtonRow: {
    justifyContent: 'space-between',
  },
  // Buy Now: the row's `gap` covers horizontal spacing but never vertical, and
  // `height: '100%'` on a child resolves against the row's auto height (the label's), not its
  // explicit 48 — which left the two pills different heights. `alignSelf: 'stretch'` and a
  // literal 48 are what actually equalise them.
  buyNowButton: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
    width: undefined,
    height: 48,
    alignSelf: 'stretch',
    borderRadius: 18,
    overflow: 'hidden',
  },
  buyNowText: {
    color: '#FFFFFF',
  },
  // Geometrically identical to `buyNowButton` so the pair never shows a size jump. The live
  // button's own base style carries a 60pt minHeight, so it has to be reset here.
  addToCartButton: {
    flex: 1,
    width: undefined,
    height: 48,
    minHeight: 48,
    alignSelf: 'stretch',
  },
  actionButtonTouch: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    flex: 1,
    height: 60,
    backgroundColor: '#55AE68',
    borderRadius: 22,
  },
  waitingButtonTouch: {
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    width: '100%',
    height: 60,
    backgroundColor: '#bdc5bfff',
    borderRadius: 22,
  },
  actionText: {
    ...baseFont,
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 20,
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
    fontSize: 12,
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
  stickyNoteFooter: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
    flexDirection: 'row',
  },
  stickyNoteGuideButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  stickyNoteGuideText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#539461',
    fontFamily: 'Inter',
  },
});