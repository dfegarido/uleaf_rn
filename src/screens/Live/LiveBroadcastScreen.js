import AppImage from '../../components/AppImage/AppImage';
import PlantListingImage from '../../components/PlantListingImage/PlantListingImage';
import GlassView from '../../components/Glass/GlassView';

import React, { useContext, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityIndicator,
  Alert,
  Animated,
  Dimensions,
  Easing,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Modal,
  PermissionsAndroid,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View
} from 'react-native';
import { ChannelProfileType,
  ClientRoleType,
  createAgoraRtcEngine,
  RtcSurfaceView,
  RtcTextureView,
} from 'react-native-agora';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Defs, LinearGradient as SvgLinearGradient, Stop, Rect } from 'react-native-svg';
import BackSolidIcon from '../../assets/icons/white/caret-left-regular.svg';
import LoveIcon from '../../assets/live-icon/heart-outline.svg';
import MicOffIcon from '../../assets/live-icon/mic-off-outline.svg';
import MicOnIcon from '../../assets/live-icon/mic-outline.svg';

import KeepAwake from 'react-native-keep-awake';
import NoteIcon from '../../assets/live-icon/notes-outline.svg';
import ReverseCameraIcon from '../../assets/live-icon/camera-flip-outline.svg';
import ListIcon from '../../assets/live-icon/list-outline.svg';
import AddIcon from '../../assets/live-icon/add-outline.svg';
import ScreenshotIcon from '../../assets/live-icon/snap-outline.svg';
import TruckIcon from '../../assets/live-icon/truck.svg';
import ViewersIcon from '../../assets/live-icon/viewers.svg';
import RNFS from 'react-native-fs';
import { AuthContext } from '../../auth/AuthProvider';
import { getB2BAccountApi } from '../../components/Api/b2bAccountApi';
import { accountClassFromUserInfo, isB2BBusinessUser } from '../../utils/b2bShell';
import { generateAgoraToken, getActiveLiveListingApi, getLiveListingsBySessionApi, updateLiveSessionStatusApi } from '../../components/Api/agoraLiveApi';
import { getAgoraUid } from '../../utils/getAgoraUid';
import { sendLiveStartedNotificationApi } from '../../components/Api/sendLiveStartedNotificationApi';
import { uploadImageToBackend } from '../../components/Api/uploadImageToBackend';
import { updateListingApi } from '../../components/Api/listingManagementApi';
import {
  addLiveCommentApi,
  deleteLiveCommentApi,
  getLiveCommentsApi,
  getLiveDetailApi,
  getLiveSellersApi,
  getLiveSoldToApi,
  sendLiveHeartbeatApi,
  updateLiveCommentApi,
  updateLiveCoverApi,
  updateLiveStickyNoteApi,
} from '../../components/Api/liveApi';
import CreateLiveListingScreen from './CreateLiveListingScreen';
import LiveListingsModal from './LiveListingsModal';
import {
  createPendingLiveComment,
  mergeLiveComment,
  mergeLiveCommentUpdate,
  mergeLiveCommentsFromServer,
  normalizeLiveCommentRow,
  subscribeToLiveComments,
} from '../../utils/realtimeLiveComments';
import { buildLiveChatFeed } from '../../utils/liveChatFeed';

const liveShippingLabel = (listing, sellerClass) => {
  const cls = String(sellerClass || '').trim().toLowerCase();
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
    cls === 'us business' ||
    cls === 'ileafu inhouse' ||
    country === 'us' ||
    country === 'usa' ||
    country.includes('united states') ||
    (currency === 'USD' && country !== '' && !asian);
  return domestic
    ? 'UPS 2nd Day $25 + $2 extra plant'
    : 'UPS 2nd Day $50 + $5 extra plant';
};

// Top-to-bottom gradient pill shared by Go Live (light green -> green) and End Live (light red ->
// red), the same treatment as the buyer's Buy Now. The Svg is an absolute-fill painting layer, so
// it sits behind the label and adds no height. Ids must differ: two Svgs can share a screen.
const GradientButton = ({ id, label, from, to, onPress }) => (
  <TouchableOpacity onPress={onPress} style={styles.gradientButton} activeOpacity={0.85}>
    <Svg style={StyleSheet.absoluteFill} width="100%" height="100%">
      <Defs>
        <SvgLinearGradient id={id} x1="0" y1="0" x2="0" y2="1">
          <Stop offset="0" stopColor={from} />
          <Stop offset="1" stopColor={to} />
        </SvgLinearGradient>
      </Defs>
      <Rect x="0" y="0" width="100%" height="100%" rx="18" ry="18" fill={`url(#${id})`} />
    </Svg>
    <Text style={styles.actionText}>{label}</Text>
  </TouchableOpacity>
);

const LiveBroadcastScreen = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  const { width: windowWidth, height: windowHeight } = Dimensions.get('window');
  const { userInfo } = useContext(AuthContext);
  const [accountClass, setAccountClass] = useState(() => accountClassFromUserInfo(userInfo));
  const isB2BSeller = isB2BBusinessUser({accountClass});
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
  const [sellerProfile, setSellerProfile] = useState(null); // Cached seller profile from Firestore
  const [isMuted, setIsMuted] = useState(false);
  const [channelName, setChannelName] = useState(null);
  const [sessionId, setSessionId] = useState(route.params?.sessionId);
  const [isLive, setIsLive] = useState(false);
  const flatListRef = useRef(null);
  const snapshotPendingRef = useRef(null);
  const thumbnailPendingRef = useRef(false);
  const thumbnailTimerRef = useRef(null);
  const [snapshotPreviewUri, setSnapshotPreviewUri] = useState(null);
  // The on-device snapshot file backing `snapshotPreviewUri`. Held in a ref (not state) because
  // the engine's snapshot callback is registered once and would read a stale closure.
  const snapshotFileRef = useRef(null);
  // The write that put the snapshot on the listing: `{plantCode, previousImagePrimary}`. The
  // preview is dropped once the 10s poll shows a DIFFERENT imagePrimary for that plant.
  const snapshotAwaitRef = useRef(null);
  const snapshotSafetyTimerRef = useRef(null);
  const [snapshotCountdown, setSnapshotCountdown] = useState(0);
  const countdownIntervalRef = useRef(null);
  // The countdown owns its own cadence and must not be restarted by the 10s
  // poll (or by its own snap, which changes imagePrimary). It reads the current
  // listing through this ref instead of depending on the object identity.
  const activeListingRef = useRef(null);
  const [isLoading, setIsLoading] = useState(false);
  // The session's joiners live in `live.joiners[]` (written by addViewerToLiveSession). Kept as
  // a plain list and interleaved into the chat render below rather than mirrored into its own
  // state/UI block.
  const [joinedUsers, setJoinedUsers] = useState([]);
  const [permissionsGranted, setPermissionsGranted] = useState(false);
  const [engineReady, setEngineReady] = useState(false);
  // Set when the channel join is observed (either via the callback or the
  // getConnectionState() fallback), so the fallback never double-fires.
  const joinedReachedRef = useRef(false);
  const [statusMessage, setStatusMessage] = useState('Starting camera…');
  const [soldToUser, setSoldToUser] = useState(null);
  const [isCommentFocused, setIsCommentFocused] = useState(false);
  const commentInputRef = useRef(null);
  // The card collapses by its own measured height: `height` cannot be interpolated on this build
  // (an AnimatedInterpolation in the tree crashed RN 0.87), so the value must already BE px.
  const cardHeightRef = useRef(0);
  const cardAnimatingRef = useRef(false);
  const cardCollapse = useRef(new Animated.Value(0)).current;
  const cardFade = useRef(new Animated.Value(1)).current;
  const [cardMeasured, setCardMeasured] = useState(false);
  // Rail x-offset in points. A raw Animated.Value, NOT interpolate(): on RN 0.87 an
  // AnimatedInterpolation nested in a transform throws "cannot add a new property".
  const sideRailShift = useRef(new Animated.Value(0)).current;
  const [sessionListingIndexMap, setSessionListingIndexMap] = useState({});
  const [sessionListingsCount, setSessionListingsCount] = useState(0);
  const [editingComment, setEditingComment] = useState(null);

  useEffect(() => {
      KeepAwake.activate();
      return () => KeepAwake.deactivate();
  }, [joined]);

  useEffect(() => {
    let active = true;
    (async () => {
      const result = await getB2BAccountApi();
      if (!active) return;
      const serverClass =
        result?.data?.account?.accountClass ||
        result?.data?.accountClass ||
        accountClassFromUserInfo(userInfo);
      if (serverClass) setAccountClass(serverClass);
    })();
    return () => {
      active = false;
    };
  }, [userInfo]);

  // Fetch seller profile from Firestore if currentUserInfo is missing profile fields
  useEffect(() => {
    const userId = currentUserInfo?.uid || currentUserInfo?.id || currentUserInfo?.user?.uid || currentUserInfo?.user?.id;
    if (!userId) return;
    // If alias already exists at root, use it; else if gardenOrCompanyName exists, no need to fetch
    if (currentUserInfo?.alias) {
      setSellerProfile({ alias: currentUserInfo.alias, gardenOrCompanyName: currentUserInfo.gardenOrCompanyName, profileImage: currentUserInfo.profileImage });
      return;
    }
    if (currentUserInfo?.gardenOrCompanyName) {
      setSellerProfile({ gardenOrCompanyName: currentUserInfo.gardenOrCompanyName, profileImage: currentUserInfo.profileImage });
      return;
    }
    // Fetch from supplier via Supabase live-sellers batch lookup
    getLiveSellersApi([userId]).then((res) => {
      if (res.success && res.sellers && res.sellers[userId]) {
        const data = res.sellers[userId];
        setSellerProfile({ alias: data.alias, gardenOrCompanyName: data.gardenOrCompanyName, profileImage: data.profileImage, firstName: data.firstName, lastName: data.lastName });
      }
    }).catch((err) => console.error('Error fetching seller profile:', err));
  }, [currentUserInfo?.uid, currentUserInfo?.id, currentUserInfo?.user?.uid, currentUserInfo?.user?.id]);

  const updateLiveStatus = async (newStatus) => {
    setIsLoading(true);
    const response = await updateLiveSessionStatusApi(sessionId, newStatus);
      if (response?.success && response?.newStatus === 'live') {
        setIsLive(true);
        setIsLoading(false);
        try {
          await sendLiveStartedNotificationApi({
            liveId: sessionId,
            title: sessionDetails?.title || '',
            sellerId: sessionDetails?.createdBy || '',
          });
        } catch (notifyError) {
          console.error('Failed to send live started notification:', notifyError.message);
        }
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
      // The channel name for the session is the sessionId.
      // Derive a stable, unique uid for THIS broadcaster so it never collides
      // with viewers joining the same channel (a uid collision makes Agora kick
      // the existing user, surfacing as "no broadcaster found" for viewers).
      const userId = currentUserInfo?.uid || currentUserInfo?.id || currentUserInfo?.user?.uid || currentUserInfo?.user?.id;
      const myUid = getAgoraUid(userId);
      setUid(myUid);

      const response = await generateAgoraToken(sessionId, myUid);
    
      console.log('Fetched token response:', response);
      
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

  // Fetch token on mount
  useEffect(() => {
    fetchToken();
  }, [sessionId]);

  // Initialize Agora engine and start broadcast when all prerequisites are ready.
  // Agora 4.x is a singleton: after release() we MUST initialize again, never skip.
  useEffect(() => {
    if (!token || !appId || !channelName || !permissionsGranted || uid == null) {
      setStatusMessage('Connecting…');
      return undefined;
    }

    let cancelled = false;
    joinedReachedRef.current = false;
    setStatusMessage('Starting camera…');
    console.log('🔴 Initializing Agora engine for broadcast…', { channelName, uid });

    const rtc = createAgoraRtcEngine();
    rtcEngineRef.current = rtc;

    // Safety net for the join callback. `onJoinChannelSuccess` is the ONLY thing
    // that clears the "Starting camera…" spinner, and on iOS it can be dropped:
    // react-native-agora's module is an RCTEventEmitter whose native events are
    // gated behind `hasListeners` (set in startObserving), which the new
    // architecture (newArchEnabled=true / RN bridgeless) does not reliably
    // trigger. The native SDK *does* join (its own log shows
    // onJoinChannelSuccess), so fall back to the native ground truth
    // getConnectionState() and let the broadcast proceed. Without this the
    // screen is permanently stuck on "Starting camera…".
    const joinedFallback = setTimeout(() => {
      if (cancelled || joinedReachedRef.current) return;
      try {
        const state = rtc.getConnectionState();
        // ConnectionStateTypeConnected === 3
        if (state === 3) {
          console.log('⚠️ onJoinChannelSuccess not received; getConnectionState() says connected');
          joinedReachedRef.current = true;
          setJoined(true);
          setStatusMessage('');
          return;
        }
      } catch (e) {
        console.warn('getConnectionState fallback failed', e);
      }
      if (!cancelled) {
        setStatusMessage('Still connecting to the live stream…');
      }
    }, 5000);

    try {
      rtc.initialize({
        appId,
        channelProfile: ChannelProfileType.ChannelProfileLiveBroadcasting,
      });
    } catch (e) {
      console.warn('Agora initialize (may already be initialized):', e);
    }

    rtc.registerEventHandler({
      onJoinChannelSuccess: () => {
        if (cancelled) return;
        joinedReachedRef.current = true;
        console.log('✅ Joined Channel as Broadcaster');
        try {
          rtc.enableLocalVideo(true);
          rtc.startPreview();
        } catch (e) {
          console.warn('post-join preview restart failed', e);
        }
        setJoined(true);
        setStatusMessage('');
      },
      onLocalVideoStateChanged: (source, state, reason) => {
        console.log('📹 Local video state:', { source, state, reason });
        if (state === 3) {
          // LocalVideoStreamStateFailed with
          // LocalVideoStreamReasonDeviceNotFound (8): there is no camera to
          // capture from — always the case on the iOS Simulator, which ships
          // no camera device. That is NOT a reason to block the broadcast:
          // audio publishing and channel presence are unaffected, so carry on
          // and surface it as a non-blocking notice instead of dying on a
          // "Starting camera…" spinner that never clears.
          setStatusMessage(
            reason === 8
              ? 'No camera on this device — streaming audio only'
              : `Camera unavailable (${reason}) — streaming audio only`,
          );
        }
      },
      onTokenPrivilegeWillExpire: () => fetchTokenAndRejoin(),
      onConnectionStateChanged: (state, reason) => {
        console.log('🔌 Connection state changed:', { state, reason });
      },
      onError: (err) => {
        console.error('❌ Agora Error:', err);
        setStatusMessage(`Agora error: ${err}`);
        if (err === 109) fetchTokenAndRejoin();
      },
      onSnapshotTaken: (_connection, _uid, filePath, width, height, errCode) => {
        if (errCode !== 0) {
          console.warn('[Snapshot] Failed, errCode:', errCode);
          snapshotPendingRef.current = null;
          thumbnailPendingRef.current = false;
          return;
        }
        const isThumbnail = thumbnailPendingRef.current;
        thumbnailPendingRef.current = false;
        if (isThumbnail) {
          handleLiveThumbnailUpload(filePath);
          return;
        }
        const fileUri = Platform.OS === 'android' ? `file://${filePath}` : filePath;
        releaseSnapshotFile(snapshotFileRef.current);
        snapshotFileRef.current = filePath;
        setSnapshotPreviewUri(fileUri);
        const pending = snapshotPendingRef.current;
        snapshotPendingRef.current = null;
        if (!pending) return;
        handleSnapshotUpload(filePath, pending);
      },
    });

    rtc.setClientRole(ClientRoleType.ClientRoleBroadcaster);
    rtc.enableAudio();
    rtc.enableVideo();
    rtc.enableLocalVideo(true);
    rtc.setVideoEncoderConfiguration({
      dimensions: { width: 720, height: 1280 },
      frameRate: 15,
      bitrate: 1130,
      orientationMode: 0,
    });
    rtc.startPreview();

    if (!cancelled) {
      setEngineReady(true);
    }

    rtc.joinChannel(token, channelName, uid, {
      clientRoleType: ClientRoleType.ClientRoleBroadcaster,
      publishCameraTrack: true,
      publishMicrophoneTrack: true,
      autoSubscribeAudio: true,
      autoSubscribeVideo: false,
    });

    return () => {
      cancelled = true;
      clearTimeout(joinedFallback);
      console.log('🧹 Leaving live channel (keep Agora engine)');
      setEngineReady(false);
      setJoined(false);
      try {
        rtc.stopPreview();
      } catch (_) {}
      try {
        rtc.leaveChannel();
      } catch (_) {}
      rtcEngineRef.current = null;
    };
  }, [permissionsGranted, appId, channelName, token, uid]);

  useEffect(() => {
    if (!sessionId) return;

    let active = true;
    let pollTimer = null;

    const loadSession = async () => {
      const res = await getLiveDetailApi(sessionId);
      if (!active) return;
      if (res.success && res.session) {
        const data = res.session;
        setSessionDetails(data);
        setLiveStats({
          viewerCount: data.viewerCount || 0,
          likeCount: data.likeCount || 0,
        });

        const joinNotifications = data.joiners || [];
        setJoinedUsers(Array.isArray(joinNotifications) ? joinNotifications : []);
        setStickyNoteText(data.stickyNote || '');

        // Heartbeat: keep this session visible as "live" to buyers while the
        // seller is actively broadcasting. Fire only when status is live.
        if (data.status === 'live') {
          sendLiveHeartbeatApi(sessionId).catch((e) => console.error('Heartbeat failed:', e?.message));
        }
      } else {
        console.log('Live session document does not exist.');
      }
    };

    loadSession();
    // Poll for live viewer/like/joiner updates (realtime bridge).
    pollTimer = setInterval(loadSession, 10000);

    return () => {
      active = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [sessionId]);

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

  useEffect(() => {
      if (comments.length > 0) {
        flatListRef.current?.scrollToEnd({ animated: true });
      }
  }, [comments]); // This effect runs whenever 'messages' array changes

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
    // Join notices are not the broadcaster's own comment: no edit/delete affordance.
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
    if (commentToSend.trim() === '' || !sessionId || !currentUserInfo) return;
    
    // Extract uid properly (handles nested structure for suppliers)
    const userId = currentUserInfo?.uid || currentUserInfo?.id || currentUserInfo?.user?.uid || currentUserInfo?.user?.id;
    if (!userId) {
      console.error('Error sending comment: uid not found in currentUserInfo');
      return;
    }
    
    const userName = sellerProfile?.alias ||
                     currentUserInfo?.alias ||
                     currentUserInfo?.user?.alias ||
                     currentUserInfo?.gardenOrCompanyName || 
                     currentUserInfo?.user?.gardenOrCompanyName || 
                     currentUserInfo?.username || 
                     currentUserInfo?.user?.username ||
                     (currentUserInfo?.firstName ? `${currentUserInfo.firstName} ${currentUserInfo?.lastName || ''}`.trim() : null) ||
                     (currentUserInfo?.user?.firstName ? `${currentUserInfo.user.firstName} ${currentUserInfo?.user?.lastName || ''}`.trim() : null) ||
                     'Anonymous';
    
    // Extract avatar properly
    const userAvatar = currentUserInfo?.profileImage || currentUserInfo?.user?.profileImage || `https://gravatar.com/avatar/19bb7c35f91e5f6c47e80697c398d70f?s=400&d=mp&r=x`;
    
    setNewComment(''); // Clear input after sending
    setEditingComment(null); // Clear editing state

    // Optimistic: show the comment the instant send is tapped. The id is
    // generated HERE and sent to the server, so the same row comes back over
    // Realtime/the poll and merges in place instead of duplicating.
    if (editingComment) {
      const optimistic = {
        ...editingComment,
        message: commentToSend,
        pending: true,
      };
      setComments((prev) => mergeLiveCommentUpdate(prev, optimistic));
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
      avatar: userAvatar,
      uid: userId,
    });
    setComments((prev) => mergeLiveComment(prev, pendingComment));

    try {
      const res = await addLiveCommentApi({
        sessionId,
        id: pendingComment.id,
        message: commentToSend,
        name: userName,
        avatar: userAvatar,
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

  const handleOpenStickyNote = async () => {
    if (!sessionId) return;
    const res = await getLiveDetailApi(sessionId);
    if (res.success && res.session) {
      setStickyNoteText(res.session.stickyNote || '');
    }
    setStickyNoteModalVisible(true);
  };

  // Messages and join notices as ONE chronological feed. Memoised so the background poll does
  // not re-sort and re-render the whole list while the broadcaster is reading or typing.
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

  const handleSaveStickyNote = async () => {
    if (!sessionId) return;
    setIsLoading(true);
    try {
      await updateLiveStickyNoteApi(sessionId, stickyNoteText);
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

  const handleLiveThumbnailUpload = async (filePath) => {
    try {
      const fileUri = Platform.OS === 'android' ? `file://${filePath}` : filePath;
      const imageUrl = await uploadImageToBackend(fileUri);
      if (!imageUrl) throw new Error('Upload returned empty URL');
      await updateLiveCoverApi(sessionId, imageUrl);
      console.log('[LiveThumb] Updated session coverPhotoUrl:', imageUrl);
    } catch (err) {
      console.error('[LiveThumb] Upload/update failed:', err?.message || err);
    } finally {
      try { await RNFS.unlink(filePath); } catch (_) {}
    }
  };

  const captureLiveThumbnail = () => {
    const engine = rtcEngineRef.current;
    if (!engine || !joined) return;
    const filePath = `${RNFS.CachesDirectoryPath}/live_thumb_${sessionId}_${Date.now()}.jpg`;
    thumbnailPendingRef.current = true;
    engine.takeSnapshot(0, filePath);
  };

  // Delete a snapshot temp file only AFTER the thumb has let go of it. Clearing the preview
  // starts a 250ms local -> remote cross-fade whose outgoing layer is still this file, so an
  // immediate unlink can blank the thumb mid-fade.
  const releaseSnapshotFile = (filePath, delayMs = 3000) => {
    if (!filePath) return;
    setTimeout(() => {
      RNFS.unlink(filePath).catch(() => {});
    }, delayMs);
  };

  // Drop the preview (the thumb falls through to the remote photo with a cross-fade) and
  // schedule the file for deletion.
  const clearSnapshotPreview = () => {
    if (snapshotSafetyTimerRef.current) {
      clearTimeout(snapshotSafetyTimerRef.current);
      snapshotSafetyTimerRef.current = null;
    }
    snapshotAwaitRef.current = null;
    releaseSnapshotFile(snapshotFileRef.current);
    snapshotFileRef.current = null;
    setSnapshotPreviewUri(null);
  };

  const handleSnapshotUpload = async (filePath, plantCode) => {
    const previousImagePrimary = activeListingRef.current?.imagePrimary ?? null;
    try {
      console.log('[Snapshot] Uploading image for', plantCode);
      const fileUri = Platform.OS === 'android' ? `file://${filePath}` : filePath;
      const imageUrl = await uploadImageToBackend(fileUri);
      if (!imageUrl) throw new Error('Upload returned empty URL');
      console.log('[Snapshot] Uploaded, updating listing imagePrimary:', imageUrl);
      // updateListingApi never throws: a failed write comes back as { success: false }.
      const result = await updateListingApi({ plantCode, imagePrimary: imageUrl });
      if (!result?.success) {
        throw new Error(result?.error || 'Listing update failed');
      }
      console.log('[Snapshot] Listing updated successfully');
      // Keep the local frame on the card until the poll delivers the new remote photo, so the
      // thumb makes ONE hand-off. Safety net if the poll never shows a different photo.
      snapshotAwaitRef.current = { plantCode, previousImagePrimary };
      if (snapshotSafetyTimerRef.current) clearTimeout(snapshotSafetyTimerRef.current);
      snapshotSafetyTimerRef.current = setTimeout(clearSnapshotPreview, 30000);
    } catch (err) {
      console.error('[Snapshot] Upload/update failed:', err?.message || err);
      clearSnapshotPreview();
    }
  };

  const captureAndUploadSnapshot = (listing) => {
    const engine = rtcEngineRef.current;
    if (!engine) {
      console.warn('[Snapshot] No Agora engine, skipping');
      return;
    }
    const plantCode = listing.plantCode;
    const filePath = `${RNFS.CachesDirectoryPath}/live_snapshot_${plantCode}_${Date.now()}.jpg`;
    snapshotPendingRef.current = plantCode;
    const result = engine.takeSnapshot(0, filePath);
    if (result < 0) {
      console.warn('[Snapshot] takeSnapshot returned error:', result);
      snapshotPendingRef.current = null;
    }
  };

  // "Snap" side button: capture the plant photo immediately, on the tap. No
  // countdown, no loop — the tap IS the trigger. Cancels any countdown that
  // happens to be pending so a just-taken photo is not snapped again 8s later.
  const handleManualSnapshot = () => {
    const listing = activeListingRef.current;
    if (!listing) {
      console.warn('[Snapshot] Snap pressed with no active listing, skipping');
      return;
    }
    stopSnapshotCountdown();
    setSnapshotCountdown(0);
    if (snapshotPendingRef.current) return;
    captureAndUploadSnapshot(listing);
    console.log('[Snapshot] Snap pressed — captured', listing.plantCode);
  };

  const stopSnapshotCountdown = () => {
    if (countdownIntervalRef.current) {
      clearInterval(countdownIntervalRef.current);
      countdownIntervalRef.current = null;
    }
  };

  // Runs ONE 8s countdown: at 0 the plant photo is snapped and uploaded, then
  // the counter stops. It is armed by exactly two events — the seller pressing
  // Go Live, and the active listing changing — and never re-arms itself, so a
  // live listing cannot keep re-snapping (and re-uploading) on a timer.
  const startSnapshotCountdown = () => {
    stopSnapshotCountdown();

    const COUNTDOWN_S = 8;
    let remaining = COUNTDOWN_S;
    setSnapshotCountdown(remaining);

    countdownIntervalRef.current = setInterval(() => {
      remaining -= 1;

      if (remaining > 0) {
        setSnapshotCountdown(remaining);
        return;
      }

      // Countdown finished: hide the counter and refresh the plant photo, then
      // stop. Re-arming is the caller's job (next Go Live / listing switch).
      stopSnapshotCountdown();
      setSnapshotCountdown(0);
      const listing = activeListingRef.current;
      if (listing && !snapshotPendingRef.current) {
        captureAndUploadSnapshot(listing);
        console.log('[Snapshot] Countdown reached 0 — snapped', listing.plantCode);
      }
    }, 1000);
  };

  //get active listing
  useEffect(() => {
      if (!sessionId) return;

      let active = true;
      let pollTimer = null;

      const toCamel = (r) => ({
        id: r.id,
        plantCode: r.plantcode || r.plantCode || '',
        imagePrimary: r.imageprimary || r.imagePrimary || null,
        genus: r.genus || '',
        species: r.species || '',
        variegation: r.variegation || '',
        potSize: r.potsize || r.potSize || '',
        usdPrice: r.usdprice || r.usdPrice || 0,
        country: r.country || '',
        localCurrency: r.localcurrency || r.localCurrency || '',
        sellerCode: r.sellercode || r.sellerCode || '',
        status: r.status || '',
        sessionId: r.sessionid || r.sessionId || '',
      });

      const loadActive = async () => {
        const res = await getActiveLiveListingApi();
        if (!active) return;
        if (res && res.success && res.data) {
          const next = toCamel(res.data);
          const awaiting = snapshotAwaitRef.current;
          if (
            awaiting &&
            awaiting.plantCode === next.plantCode &&
            next.imagePrimary !== awaiting.previousImagePrimary
          ) {
            clearSnapshotPreview();
          }
          // The 10s poll rebuilds this object every tick, which would restart
          // the snapshot-countdown effect below (and re-fire its capture) on
          // every poll. Keep the previous object when nothing the countdown or
          // the card depends on has changed.
          setActiveListing((prev) =>
            prev &&
            prev.id === next.id &&
            prev.plantCode === next.plantCode &&
            prev.imagePrimary === next.imagePrimary &&
            prev.status === next.status
              ? prev
              : next,
          );
        } else {
          setActiveListing(null);
        }
      };

      loadActive();
      pollTimer = setInterval(loadActive, 10000);

      return () => {
        active = false;
        if (pollTimer) clearInterval(pollTimer);
      };
  }, [sessionId]);

  useEffect(() => {
    if (!sessionId) return;

    let active = true;
    let pollTimer = null;

    const loadListings = async () => {
      const res = await getLiveListingsBySessionApi(sessionId, 'Live');
      if (!active) return;
      const listings = [...((res && res.data) || [])].sort((a, b) => {
        const ta = new Date(a.createdAt || 0).getTime();
        const tb = new Date(b.createdAt || 0).getTime();
        return ta - tb;
      });
      // The IG number is stored per listing (liveigindex) and assigned once at
      // creation, so it must NOT be derived from position here: a sold/deleted
      // listing would otherwise renumber everything below it. Creation order is
      // kept for display; the number comes from the row.
      const indexMap = {};
      listings.forEach((item) => {
        if (item.liveIgIndex == null || String(item.liveIgIndex).trim() === '') return;
        const code = `IG${item.liveIgIndex}`;
        if (item.id) indexMap[item.id] = code;
        if (item.plantCode) indexMap[item.plantCode] = code;
      });
      setSessionListingIndexMap(indexMap);
      setSessionListingsCount(listings.length);
    };

    loadListings();
    pollTimer = setInterval(loadListings, 10000);

    return () => {
      active = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [sessionId]);

  // Driven by focus (not keyboard events) so Android, where adjustResize does not fire them,
  // lands in the same state. Same 250ms curve as the buyer so rail, card and keyboard read as one.
  useEffect(() => {
    const timing = { duration: 250, easing: Easing.out(Easing.cubic), useNativeDriver: false };
    Animated.timing(sideRailShift, {
      toValue: isCommentFocused ? SIDE_RAIL_HIDDEN_OFFSET : 0,
      ...timing,
    }).start();
  }, [isCommentFocused, sideRailShift]);

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
      cardAnimatingRef.current = !finished;
    });
  }, [isCommentFocused, cardMeasured, cardCollapse, cardFade]);

  // Layout events also fire mid-animation with intermediate heights (and a collapsed card
  // re-reports 0); writing those back would fight the running timing, so they are ignored.
  const onCardLayout = (event) => {
    const h = event.nativeEvent.layout.height;
    if (h <= 0 || cardAnimatingRef.current) return;
    cardHeightRef.current = h;
    cardCollapse.setValue(h);
    if (!cardMeasured) setCardMeasured(true);
  };

  // Natural size until measured; afterwards the animated pixel height takes over.
  const cardWrapStyle = cardMeasured ? { height: cardCollapse, opacity: cardFade } : null;
  // Hoisted: the linter rejects style literals and the transform must stay one stable object.
  const railSlideStyle = { transform: [{ translateX: sideRailShift }] };

  useEffect(() => {
    // Track the active listing for the countdown without restarting it.
    activeListingRef.current = activeListing;
  }, [activeListing]);

  // No thumb left to hold the file on unmount, so it can go at once.
  useEffect(
    () => () => {
      if (snapshotSafetyTimerRef.current) clearTimeout(snapshotSafetyTimerRef.current);
      if (snapshotFileRef.current) RNFS.unlink(snapshotFileRef.current).catch(() => {});
    },
    [],
  );

  useEffect(() => {
    clearSnapshotPreview();
    setSnapshotCountdown(0);
    stopSnapshotCountdown();
    // Arm the one-shot counter only while the seller is actually live. The
    // effect re-runs on the two intended trigger events: pressing Go Live
    // (isLive false -> true) and the active listing changing.
    if (!activeListing || !joined || !isLive) return;

    console.log(
      '[Snapshot] Watching listing',
      activeListing.plantCode,
      '— 8s countdown (one shot)',
    );

    startSnapshotCountdown();

    return stopSnapshotCountdown;
  }, [activeListing?.id, activeListing?.plantCode, joined, isLive]);

  // Periodic live thumbnail capture — updates the session's coverPhotoUrl
  // so the buyer's shop screen shows a fresh preview of what's currently on stream
  useEffect(() => {
    if (!joined || !isLive) {
      if (thumbnailTimerRef.current) {
        clearInterval(thumbnailTimerRef.current);
        thumbnailTimerRef.current = null;
      }
      return;
    }

    captureLiveThumbnail();
    thumbnailTimerRef.current = setInterval(captureLiveThumbnail, 30000);

    return () => {
      if (thumbnailTimerRef.current) {
        clearInterval(thumbnailTimerRef.current);
        thumbnailTimerRef.current = null;
      }
    };
  }, [joined, isLive, sessionId]);

  // Effect to fetch order for the active listing
  useEffect(() => {
    if (!activeListing?.id) {
      setSoldToUser(null); // Reset when there's no active listing
      return;
    }

    let active = true;
    let pollTimer = null;

    const loadSoldTo = async () => {
      const res = await getLiveSoldToApi(activeListing.id);
      if (!active) return;
      setSoldToUser(res.success ? res.soldToUser : null);
    };

    loadSoldTo();
    pollTimer = setInterval(loadSoldTo, 10000);

    return () => {
      active = false;
      if (pollTimer) clearInterval(pollTimer);
    };
  }, [activeListing]);

  const localCanvas = { uid: 0, renderMode: 1, mirrorMode: 0 };

  return (
       <View style={styles.container}>
        {isLoading && (
                <Modal transparent animationType="fade">
                  <View style={styles.loadingOverlay}>
                    <ActivityIndicator size="large" color="#699E73" />
                  </View>
                </Modal>
              )}
        <View
          pointerEvents="none"
          style={[styles.stream, { width: windowWidth, height: windowHeight }]}>
          {engineReady ? (
            Platform.OS === 'android' ? (
              <RtcTextureView
                style={{ width: windowWidth, height: windowHeight }}
                canvas={localCanvas}
              />
            ) : (
              <RtcSurfaceView
                style={{ width: windowWidth, height: windowHeight }}
                canvas={localCanvas}
              />
            )
          ) : (
            <View style={styles.connectingContainer}>
              <ActivityIndicator size="large" color="#FFFFFF" />
              <Text style={styles.connectingText}>
                {error || statusMessage || 'Connecting to live stream...'}
              </Text>
            </View>
          )}
        </View>

        {snapshotCountdown > 0 && (
          <View style={styles.snapshotOverlay} pointerEvents="none">
            <View style={styles.snapshotBadge}>
              <Text style={styles.snapshotPrepareText}>Prepare for snapshot</Text>
              <Text style={styles.snapshotCountdownText}>{snapshotCountdown}</Text>
            </View>
          </View>
        )}

        {!!statusMessage && engineReady && (
          <View style={styles.statusBanner} pointerEvents="none">
            <Text style={styles.connectingText}>{statusMessage}</Text>
          </View>
        )}

        {/* One flat scrim over the whole frame so white chat text keeps contrast on a bright
            video; uniform on purpose (no band or edge), same as the buyer screen. */}
        <View pointerEvents="none" style={styles.scrimBase} />

        <View
          collapsable={false}
          pointerEvents="box-none"
          style={[
            styles.overlay,
            {
              paddingTop: Math.max(insets.top, 8),
              paddingBottom: Math.max(insets.bottom, 12),
            },
          ]}>
            <View style={styles.topBar}>
              <TouchableOpacity onPress={() => updateLiveSessionStatus('ended')} activeOpacity={0.8}>
                <GlassView variant="control" radius={14} style={styles.backButton}>
                  <BackSolidIcon width={24} height={24} />
                </GlassView>
              </TouchableOpacity>
              <View style={styles.topAction}>
                <TouchableOpacity onPress={handleMuteToggle} activeOpacity={0.8}>
                  <GlassView variant="control" radius={14} style={styles.guide}>
                    {isMuted ? <MicOffIcon width={24} height={24} /> : <MicOnIcon width={24} height={24} />}
                  </GlassView>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleSwitchCamera} activeOpacity={0.8}>
                  <GlassView variant="control" radius={14} style={styles.guide}>
                    <ReverseCameraIcon width={24} height={24} />
                  </GlassView>
                </TouchableOpacity>
                <GlassView variant="control" radius={18} style={styles.liveViewer}>
                  <ViewersIcon width={18} height={18} />
                  <Text style={styles.liveViewerText}>{formatViewersLikes(liveStats?.viewerCount || 0)}</Text>
                </GlassView>
              </View>
            </View>
        {joined && (
        <KeyboardAvoidingView style={styles.keyboardAvoider} behavior="padding" keyboardVerticalOffset={0}>
        <View style={styles.actionBar}>
          <View style={styles.social}>
            <View style={styles.leftColumn}>
              {/* One feed, one list: join notices and messages interleaved by time. The list is
                  capped by its own maxHeight and scrolls inside that box. */}
            <View style={styles.comments}>
              <FlatList
                ref={flatListRef}
                data={chatFeed}
                style={[styles.commentList, styles.commentListFloor]}
                keyExtractor={(item) => item.id}
                keyboardDismissMode="on-drag"
                keyboardShouldPersistTaps="handled"
                onScrollBeginDrag={Keyboard.dismiss}
                /* Scrolling stays; only the indicator is suppressed, as asked. */
                showsVerticalScrollIndicator={false}
                contentContainerStyle={styles.commentListContent}
                renderItem={({ item }) => (
                  /* Every entry — comment or join notice alike — is one glass pill. */
                  <GlassView variant="chatRow" style={styles.commentRow}>
                    <TouchableOpacity
                      style={styles.commentRowTouch}
                      onLongPress={() => handleLongPressComment(item)}
                      activeOpacity={0.7}
                    >
                      <AppImage source={{ uri: item.avatar }} style={styles.avatar} />
                      <View style={styles.commentContent}>
                        <Text style={styles.chatName}>{item.name}</Text>
                        <Text style={styles.chatMessage}>{item.message}</Text>
                      </View>
                    </TouchableOpacity>
                  </GlassView>
                )}
              />
            </View>
            </View>
            {/* A sibling of the chat column, so it cannot be drawn behind the keyboard: it slides
                off the right edge while the composer is focused, as on the buyer screen. */}
            <Animated.View style={[styles.railWrap, railSlideStyle]}>
            <GlassView variant="rail" style={styles.sideActions}>
                <TouchableOpacity style={styles.sideAction}>
                  <View style={styles.sideActionIconWrap}>
                    <LoveIcon width={26} height={26} />
                  </View>
                  <Text style={styles.sideActionText}>{formatViewersLikes(liveStats?.likeCount || 0)}</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleOpenStickyNote} style={styles.sideAction}>
                  <View style={styles.sideActionIconWrap}>
                    <NoteIcon width={26} height={26} />
                  </View>
                  <Text style={styles.sideActionNotesText}>Notes</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={handleManualSnapshot} style={styles.sideAction}>
                  <View style={styles.sideActionIconWrap}>
                    <ScreenshotIcon width={26} height={26} />
                  </View>
                  <Text style={styles.sideActionNotesText}>Snap</Text>
                </TouchableOpacity>
                {isB2BSeller ? (
                  <TouchableOpacity
                    onPress={() => navigation.navigate('ScreenB2BListingEdit')}
                    style={styles.sideAction}>
                    <Text style={styles.sideActionNotesText}>USD</Text>
                  </TouchableOpacity>
                ) : (
                  <>
                    <TouchableOpacity onPress={() => setLiveListingModalVisible(true)} style={styles.sideAction}>
                      <View style={styles.sideActionIconWrap}>
                        <ListIcon width={26} height={26} />
                      </View>
                      <Text style={styles.sideActionNotesText}>List</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={() => setCreateListingModalVisible(true)} style={styles.sideAction}>
                      <View style={styles.sideActionIconWrap}>
                        <AddIcon width={26} height={26} />
                      </View>
                      <Text style={styles.sideActionNotesText}>Add</Text>
                    </TouchableOpacity>
                  </>
                )}
            </GlassView>
            </Animated.View>
          </View>
        {/* Full-width, like the buyer: spans the screen above the card. Glass pill owns the surface; the TouchableWithoutFeedback owns the padding so
            the whole capsule is one touch target. No explicit height: the input auto-grows
            between minHeight and maxHeight (a fixed height pins the native view). */}
        <GlassView variant="pill" style={styles.commentPill}>
          <TouchableWithoutFeedback onPress={() => commentInputRef.current?.focus()}>
            <View style={styles.commentPillTouch}>
              <TextInput
                ref={commentInputRef}
                style={styles.commentInput}
                placeholder="Comment"
                placeholderTextColor="rgba(255, 255, 255, 0.62)"
                value={newComment}
                onChangeText={setNewComment}
                onSubmitEditing={handleSendComment}
                onFocus={() => setIsCommentFocused(true)}
                onBlur={() => setIsCommentFocused(false)}
                returnKeyType="send"
                submitBehavior="blurAndSubmit"
                multiline
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
          {/* Slides down and fades while typing, freeing its height for the chat. Animated, not
              unmounted, so the column does not reflow in one frame. */}
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
                    {(snapshotPreviewUri || activeListing.imagePrimary) && (
                      <PlantListingImage
                        uri={activeListing.imagePrimary}
                        localUri={snapshotPreviewUri}
                        style={styles.listingThumb}
                        resizeMode="cover"
                      />
                    )}
                    <View style={styles.plantName}>
                      <View style={{flexDirection: 'row', alignItems: 'center', gap: 6}}>
                        {(sessionListingIndexMap[activeListing.id] || sessionListingIndexMap[activeListing.plantCode]) && (
                          <View style={styles.igBadge}>
                            <Text style={styles.igBadgeText}>
                              {sessionListingIndexMap[activeListing.id] || sessionListingIndexMap[activeListing.plantCode]}
                            </Text>
                          </View>
                        )}
                        <Text style={styles.name}>{activeListing.genus}</Text>
                      </View>
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
                        <Text style={styles.shipText}>{liveShippingLabel(activeListing, accountClass)}</Text>
                      </View>
                    </View>
                </View>
                <View style={styles.actionButton}>
                  {!isLive && (
                    <GradientButton
                      id="goLiveGradient"
                      label="Go Live"
                      from="#7CC97C"
                      to="#2E6B3E"
                      onPress={() => updateLiveSessionStatus('live')}
                    />
                  )}
                  {isLive && (
                    <GradientButton
                      id="endLiveGradient"
                      label="End Live"
                      from="#F28B73"
                      to="#C23B1E"
                      onPress={() => updateLiveSessionStatus('ended')}
                    />
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
        )}
        </View>

        {/* Render the CreateLiveListingScreen as a modal */}
        <CreateLiveListingScreen
          isVisible={isCreateListingModalVisible}
          onClose={() => setCreateListingModalVisible(false)}
          onListingCreated={() => setLiveListingModalVisible(true)}
          sessionId={sessionId}
          navigation={navigation}
          nextIgIndex={
            sessionDetails?.lastIgIndex != null
              ? Number(sessionDetails.lastIgIndex) + 1
              : sessionListingsCount + 1
          }
        />

        <LiveListingsModal
          isVisible={isLiveListingModalVisible}
          onClose={() => setLiveListingModalVisible(false)}
          sessionId={sessionId}
          onActiveListingSet={() => {}}
          onAddListing={() => {
            setLiveListingModalVisible(false);
            setCreateListingModalVisible(true);
          }}
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
      </View>
    );
};

export default LiveBroadcastScreen;

// Rail is 56pt wide and 15pt from the edge; 100 clears it, the screen edge does the clipping.
const SIDE_RAIL_HIDDEN_OFFSET = 100;

const baseFont = {
  fontFamily: 'Inter',
  fontStyle: 'normal',
  color: '#FFFFFF',
};

const styles = StyleSheet.create({
  // A single flat scrim over the whole frame (same value as the buyer screen). Above the video
  // (zIndex 0) and below the overlay (zIndex 20), so it tints the frame but never the chrome.
  scrimBase: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 10,
    elevation: 10,
    backgroundColor: 'rgba(0, 0, 0, 0.12)',
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
    backgroundColor: '#000',
  },
  stream: {
    position: 'absolute',
    top: 0,
    left: 0,
    zIndex: 0,
    elevation: 0,
    backgroundColor: '#000',
  },
  overlay: {
    ...StyleSheet.absoluteFill,
    zIndex: 20,
    elevation: 20,
    justifyContent: 'flex-start',
  },
  statusBanner: {
    position: 'absolute',
    top: 80,
    left: 16,
    right: 16,
    zIndex: 21,
    elevation: 21,
    alignItems: 'center',
  },
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
    width: '100%',
  },
  // 44pt circle, the buyer's floating glass back control (GlassView owns fill/border).
  backButton: {
    width: 44,
    height: 44,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 22,
  },
  topAction: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 8,
  },
  guide: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 44,
    height: 36,
    borderRadius: 18,
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
    paddingHorizontal: 14,
    gap: 6,
    height: 36,
    borderRadius: 18,
  },
  liveViewerText: {
    ...baseFont,
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 18,
  },
  actionBar: {
    // Fills what the top bar leaves, so the chat column is bounded between the header and the
    // card instead of being pushed down by a spacer plus hand-tuned margins.
    flex: 1,
    flexDirection: 'column',
    alignItems: 'flex-end',
    // 15 = the top bar's inset, so the chat, composer and card share one content line.
    paddingHorizontal: 15,
    gap: 12,
    width: '100%',
  },
  social: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    width: '100%',
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
  // Hugs its messages and grows upward from the bottom; bounded by `social` (flex: 1), so it
  // can never reach the top bar. Replaces marginTop 250 / height 453 / paddingBottom 213.
  leftColumn: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignSelf: 'stretch',
  },
  comments: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    gap: 14,
    width: '100%',
    flexShrink: 1,
  },
  // The chat list. `maxHeight` is the hard cap the user asked for; `flexShrink: 1` is what makes
  // it safe — this container is a FIXED 453 tall with 213 bottom padding, so only 240 of content
  // box is left and the list shares it with the 38pt input + 16 gap. Without the shrink the list
  // would spill out of the container instead of scrolling, because RN children default to
  // flexShrink 0.
  // No surface of its own: each row is its own glass pill, so a panel behind them would show
  // through as a dark slab. `maxHeight` is the cap; `flexShrink` lets it give height back to the
  // composer below instead of spilling.
  commentList: {
    width: '100%',
    borderRadius: 16,
    maxHeight: 300,
    flexShrink: 1,
  },
  commentRow: {
    // The glass pill around ONE row (GlassView takes the fill/border/radius).
    alignSelf: 'flex-start',
    maxWidth: '100%',
    overflow: 'hidden',
  },
  // Inside the pill: avatar + text, on the row's own padding so the glass edge is not touched.
  commentRowTouch: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  // Separates the rows: a gap here, not a row margin, keeps each glass edge clean.
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
  commentContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    // Hugs the text and shrinks once the row hits its max width, so a long unbroken comment
    // wraps inside the pill instead of running under its edge (was a fixed 228).
    flexShrink: 1,
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
  commentPill: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    width: '100%',
    borderRadius: 23,
  },
  // Carries the pill's padding so the whole capsule is one touch target: 13 + one 20pt line + 13.
  commentPillTouch: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 13,
    paddingHorizontal: 20,
  },
  commentInput: {
    flex: 1,
    fontSize: 15,
    lineHeight: 20,
    paddingVertical: 0,
    paddingTop: 0,
    paddingBottom: 0,
    includeFontPadding: false,
    textAlignVertical: 'top',
    minHeight: 20,
    maxHeight: 80,
    color: '#FFF',
    fontFamily: 'Inter',
    letterSpacing: 0.2,
  },
  // Narrow floating capsule centred beside the chat (social's alignItems: 'center'); sizes to
  // its actions, no fixed height.
  sideActions: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    width: 56,
    paddingVertical: 14,
    paddingHorizontal: 6,
  },
  sideAction: {
    justifyContent: 'center',
    alignItems: 'center',
    width: 56,
    paddingVertical: 6,
  },
  // Same 34pt icon box and dimming as the buyer rail: the outline icons are fixed white at
  // stroke 2, which reads heavy at 26pt without the 0.82.
  sideActionIconWrap: {
    width: 34,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
    opacity: 0.82,
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
  snapshotOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    // Non-blocking: the whole layer ignores touches (pointerEvents="none") and
    // paints no backdrop, so the seller can still use the comment box, the
    // right-rail buttons and the listing card while the counter runs.
    zIndex: 30,
    elevation: 30,
  },
  snapshotBadge: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.55)',
  },
  snapshotPrepareText: {
    ...baseFont,
    fontSize: 13,
    fontWeight: '600',
    color: 'rgba(255, 255, 255, 0.85)',
    marginBottom: 2,
  },
  snapshotCountdownText: {
    ...baseFont,
    fontSize: 44,
    fontWeight: '800',
    color: '#FFFFFF',
    lineHeight: 50,
  },
  keyboardAvoider: {
    flex: 1,
  },
  // Hugs the rail so the translate is measured from its own edge.
  railWrap: {
    alignSelf: 'center',
  },
  // One chat row is ~36pt with its gap: the floor keeps a line of context while the card is gone.
  commentListFloor: {
    minHeight: 44,
  },
  // Clips the card as it animates to zero height.
  plantCardWrap: {
    width: '100%',
    overflow: 'hidden',
  },
  shopGlass: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    width: '100%',
  },
  // Empty-state panel (no active listing): plain, there is no product to read through glass.
  shop: {
    flexDirection: 'column',
    alignItems: 'center',
    padding: 16,
    gap: 12,
    width: '100%',
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
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
    gap: 8,
    width: '100%',
  },
  listingThumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: '#1a1a1a',
  },
  igBadge: {
    backgroundColor: '#333',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  igBadgeText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 11,
  },
  plantName: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
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
    flexShrink: 0,
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
    width: '100%',
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
    gap: 8,
    width: '100%',
    height: 48,
  },
  // Radius and clipping match the buyer's Buy Now; the colour comes from the Svg gradient.
  gradientButton: {
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 48,
    borderRadius: 18,
    overflow: 'hidden',
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
