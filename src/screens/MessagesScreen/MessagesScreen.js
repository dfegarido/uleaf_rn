import {
  addDoc,
  arrayRemove,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  updateDoc,
  where,
} from 'firebase/firestore';
import moment from 'moment';
import React, { useContext, useEffect, useState } from 'react';
import {
  Alert,
  FlatList,
  Image,
  StatusBar,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path, G, Circle } from 'react-native-svg';
import { db } from '../../../firebase';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import { AuthContext } from '../../auth/AuthProvider';
import GroupChatModal from '../../components/GroupChatModal/GroupChatModal';
import NewMessageModal from '../../components/NewMessageModal/NewMessageModal';
import { sendGroupChatNotificationApi } from '../../components/Api/sendGroupChatNotificationApi';

// Pre-load and cache the default avatar image to prevent RCTImageView errors
const DefaultAvatar = require('../../assets/images/AvatarBig.png');

// Group Icon Component
const GroupIcon = ({ width = 24, height = 24, color = '#000000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Circle 
      cx="9" 
      cy="9" 
      r="3" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <Path 
      d="M12.2679 9C12.5332 8.54063 12.97 8.20543 13.4824 8.06815C13.9947 7.93086 14.5406 8.00273 15 8.26795C15.4594 8.53317 15.7946 8.97 15.9319 9.48236C16.0691 9.99472 15.9973 10.5406 15.7321 11C15.4668 11.4594 15.03 11.7946 14.5176 11.9319C14.0053 12.0691 13.4594 11.9973 13 11.7321C12.5406 11.4668 12.2054 11.03 12.0681 10.5176C11.9309 10.0053 12.0027 9.45937 12.2679 9L12.2679 9Z" 
      stroke={color} 
      strokeWidth="2"
    />
    <Path 
      d="M13.8816 19L12.9013 19.1974L13.0629 20H13.8816V19ZM17.7202 17.9042L18.6627 17.5699L17.7202 17.9042ZM11.7808 15.7105L11.176 14.9142L10.0194 15.7927L11.2527 16.5597L11.7808 15.7105ZM16.8672 18H13.8816V20H16.8672V18ZM16.7777 18.2384C16.7707 18.2186 16.7642 18.181 16.7725 18.1354C16.7804 18.0921 16.7982 18.0593 16.8151 18.0383C16.8474 17.9982 16.874 18 16.8672 18V20C18.0132 20 19.1414 18.9194 18.6627 17.5699L16.7777 18.2384ZM14 16C15.6416 16 16.4027 17.1811 16.7777 18.2384L18.6627 17.5699C18.1976 16.2588 16.9485 14 14 14V16ZM12.3857 16.5069C12.7702 16.2148 13.282 16 14 16V14C12.8381 14 11.9028 14.3622 11.176 14.9142L12.3857 16.5069ZM11.2527 16.5597C12.2918 17.206 12.7271 18.3324 12.9013 19.1974L14.8619 18.8026C14.644 17.7204 14.0374 15.9364 12.309 14.8614L11.2527 16.5597Z" 
      fill={color}
    />
    <Path 
      d="M9 15C12.5715 15 13.5919 17.5512 13.8834 19.0089C13.9917 19.5504 13.5523 20 13 20H5C4.44772 20 4.00829 19.5504 4.11659 19.0089C4.4081 17.5512 5.42846 15 9 15Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <Path 
      d="M19 3V7" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
    <Path 
      d="M21 5L17 5" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round"
    />
  </Svg>
);

// New Message Icon Component
const NewMessageIcon = ({ width = 24, height = 24, color = '#000000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      fill={color}
      d="M19.186 2.09c.521.25 1.136.612 1.625 1.101.49.49.852 1.104 1.1 1.625.313.654.11 1.408-.401 1.92l-7.214 7.213c-.31.31-.688.541-1.105.675l-4.222 1.353a.75.75 0 0 1-.943-.944l1.353-4.221a2.75 2.75 0 0 1 .674-1.105l7.214-7.214c.512-.512 1.266-.714 1.92-.402zm.211 2.516a3.608 3.608 0 0 0-.828-.586l-6.994 6.994a1.002 1.002 0 0 0-.178.241L9.9 14.102l2.846-1.496c.09-.047.171-.107.242-.178l6.994-6.994a3.61 3.61 0 0 0-.586-.828zM4.999 5.5A.5.5 0 0 1 5.47 5l5.53.005a1 1 0 0 0 0-2L5.5 3A2.5 2.5 0 0 0 3 5.5v12.577c0 .76.082 1.185.319 1.627.224.419.558.754.977.978.442.236.866.318 1.627.318h12.154c.76 0 1.185-.082 1.627-.318.42-.224.754-.559.978-.978.236-.442.318-.866.318-1.627V13a1 1 0 1 0-2 0v5.077c0 .459-.021.571-.082.684a.364.364 0 0 1-.157.157c-.113.06-.225.082-.684.082H5.923c-.459 0-.57-.022-.684-.082a.363.363 0 0 1-.157-.157c-.06-.113-.082-.225-.082-.684V5.5z"
    />
  </Svg>
);

// Format timestamp to compact notation (1m, 1h, 1d)
const formatTimeAgo = (timestamp) => {
  if (!timestamp) return '';
  
  const now = moment();
  const then = moment(timestamp.toDate());
  const diffMinutes = now.diff(then, 'minutes');
  const diffHours = now.diff(then, 'hours');
  const diffDays = now.diff(then, 'days');
  const diffWeeks = now.diff(then, 'weeks');
  const diffMonths = now.diff(then, 'months');
  const diffYears = now.diff(then, 'years');
  
  if (diffMinutes < 1) return 'now';
  if (diffMinutes < 60) return `${diffMinutes}m`;
  if (diffHours < 24) return `${diffHours}h`;
  if (diffDays < 7) return `${diffDays}d`;
  if (diffWeeks < 4) return `${diffWeeks}w`;
  if (diffMonths < 12) return `${diffMonths}mo`;
  return `${diffYears}y`;
};

const MessagesScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  
  // Calculate proper bottom padding for tab bar + safe area
  const tabBarHeight = 80; // Tab bar height (including the prominent center button)
  const safeBottomPadding = Math.max(insets.bottom, 16); // iPhone home indicator area
  const totalBottomPadding = tabBarHeight + safeBottomPadding + 24; // Extra 24px for spacing
  
  const {userInfo} = useContext(AuthContext);
  // Handle admin API response structure: userInfo.data.* or regular userInfo.user.* or flat userInfo.*
  // Use username instead of firstName/lastName
  const userName = userInfo?.data?.username || userInfo?.user?.username || userInfo?.username || 
                   userInfo?.data?.email || userInfo?.user?.email || userInfo?.email || 'User';
  
  // Check if user is an admin
  const isAdmin = userInfo?.data?.role === 'admin' || userInfo?.data?.role === 'sub_admin' || userInfo?.role === 'admin' || userInfo?.role === 'sub_admin';
  
  // Check if user is a buyer (buyers can see public groups)
  const isBuyer = 
    userInfo?.user?.userType === 'buyer' || 
    userInfo?.data?.userType === 'buyer' ||
    userInfo?.userType === 'buyer';
  
  // Check if user is a seller (supplier) - sellers cannot see public groups unless invited
  const isSeller = 
    userInfo?.user?.userType === 'supplier' || 
    userInfo?.data?.userType === 'supplier' ||
    userInfo?.userType === 'supplier' ||
    userInfo?.user?.gardenOrCompanyName !== undefined ||
    userInfo?.data?.gardenOrCompanyName !== undefined ||
    userInfo?.gardenOrCompanyName !== undefined;

  const [messages, setMessages] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [groupChatModalVisible, setGroupChatModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  // Map of uid -> image source (either {uri: ...} or local numeric require)
  const [avatarMap, setAvatarMap] = useState({});
  // Map of uid -> username (fetched from Firestore)
  const [usernameMap, setUsernameMap] = useState({});
  // Tab selection: 'messages' (default), 'unread', 'groups'
  const [selectedTab, setSelectedTab] = useState('messages');

  // Fetch avatars and usernames from buyer, admin, and supplier collections for given chats' participant UIDs
  async function fetchAvatarsForChats(chats = []) {
    try {
      if (!Array.isArray(chats) || chats.length === 0) return;

      // Collect unique other participant UIDs
      const uidsToFetch = new Set();
      
      // Handle admin API response: userInfo.data.uid, regular nested: userInfo.user.uid, or flat: userInfo.uid
      const currentUserUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';
      
      chats.forEach(chat => {
        const participants = chat.participants || [];

        participants.forEach(p => {
          const uid = p && p.uid;
          if (uid && uid !== currentUserUid ) {
            uidsToFetch.add(uid);
          }
        });
      });

      if (uidsToFetch.size === 0) return;

      // Fetch each user doc from buyer, admin, or supplier collections and update avatarMap and usernameMap
      const avatarUpdates = {};
      const usernameUpdates = {};
      
      for (const uid of uidsToFetch) {
        try {
          // Skip if we already have this user's data in both maps
          if (avatarMap[uid] && usernameMap[uid]) {
            continue;
          }

          // Try buyer collection first
          let userDocRef = doc(db, 'buyer', uid);
          let userSnap = await getDoc(userDocRef);
          
          // If not found in buyer, try admin collection
          if (!userSnap.exists()) {
            userDocRef = doc(db, 'admin', uid);
            userSnap = await getDoc(userDocRef);
          }
          
          // If not found in admin, try supplier collection
          if (!userSnap.exists()) {
            userDocRef = doc(db, 'supplier', uid);
            userSnap = await getDoc(userDocRef);
          }

          if (userSnap.exists()) {
            const data = userSnap.data();
            
            // Get avatar
            const url = data?.profilePhotoUrl || data?.profileImage || null;
            if (url && typeof url === 'string') {
              avatarUpdates[uid] = { uri: url };
            } else {
              avatarUpdates[uid] = DefaultAvatar;
            }
            
            // Get username - prefer username, fallback to email
            const username = data?.username || data?.email || null;
            if (username) {
              usernameUpdates[uid] = username;
            }
          } else {
            avatarUpdates[uid] = DefaultAvatar;
          }
        } catch (err) {
          console.warn(`Error fetching data for ${uid}:`, err);
          avatarUpdates[uid] = DefaultAvatar;
        }
      }

      if (Object.keys(avatarUpdates).length > 0) {
        setAvatarMap(prev => ({...prev, ...avatarUpdates}));
      }
      if (Object.keys(usernameUpdates).length > 0) {
        setUsernameMap(prev => ({...prev, ...usernameUpdates}));
      }
    } catch (err) {
      console.warn('Error in fetchAvatarsForChats:', err);
      // silent failure
    }
  }

  useEffect(() => {
    setLoading(true);
    
    // Handle admin API response: userInfo.data.uid, regular nested: userInfo.user.uid, or flat: userInfo.uid
    const currentUserUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';
    
    if (!userInfo || !currentUserUid) {
      setLoading(false);
      return;
    }

    try {
      // For admins: fetch their own direct messages + ALL group chats separately
      // For non-admins: fetch only chats where they're a participant
      const memberChatsQuery = query(
        collection(db, 'chats'),
        where('participantIds', 'array-contains', currentUserUid),
        orderBy('timestamp', 'desc'),
      );

      // Admins also see ALL group chats (both private and public) for moderation
      let allGroupChatsQuery = null;
      console.log('🔍 [MessagesScreen] isAdmin:', isAdmin);
      if (isAdmin) {
        try {
          console.log('📊 [MessagesScreen] Admin detected - setting up query for ALL group chats');
          allGroupChatsQuery = query(
            collection(db, 'chats'),
            where('type', '==', 'group'),
            orderBy('timestamp', 'desc'),
          );
        } catch (error) {
          console.log('❌ [MessagesScreen] Could not create all group chats query:', error);
        }
      }

      // For buyers (non-admins), also fetch public groups where they're not members
      let publicGroupsQuery = null;
      if (isBuyer && !isAdmin) {
        try {
          publicGroupsQuery = query(
            collection(db, 'chats'),
            where('type', '==', 'group'),
            where('isPublic', '==', true),
            orderBy('timestamp', 'desc'),
          );
        } catch (error) {
          // If query fails (e.g., missing index), we'll just show member chats
          console.log('Could not fetch public groups (index may be missing):', error);
        }
      }

      // Subscribe to member chats
      const unsubscribeMemberChats = onSnapshot(
        memberChatsQuery,
        {includeMetadataChanges: true},
        async (memberSnapshot) => {
          try {
            const memberChats = memberSnapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));

            // For admins: fetch ALL group chats for moderation
            let allGroupChats = [];
            if (allGroupChatsQuery && isAdmin) {
              try {
                console.log('🔄 [MessagesScreen] Fetching ALL group chats for admin...');
                const allGroupsSnapshot = await getDocs(allGroupChatsQuery);
                allGroupChats = allGroupsSnapshot.docs
                  .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                  }));
                console.log(`✅ [MessagesScreen] Fetched ${allGroupChats.length} group chats for admin`);
                console.log('📋 [MessagesScreen] Group chat names:', allGroupChats.map(c => c.name || 'Unnamed'));
              } catch (error) {
                console.log('❌ [MessagesScreen] Error fetching all group chats for admin:', error);
              }
            } else {
              console.log('⏭️ [MessagesScreen] Skipping group chats fetch - allGroupChatsQuery:', !!allGroupChatsQuery, 'isAdmin:', isAdmin);
            }

            // For buyers: fetch public groups where they're not members
            // Sellers can only see public groups if they are invited
            let publicGroups = [];
            if (publicGroupsQuery && (isBuyer || isSeller)) {
              try {
                const publicSnapshot = await getDocs(publicGroupsQuery);
                publicGroups = publicSnapshot.docs
                  .map(doc => ({
                    id: doc.id,
                    ...doc.data(),
                  }))
                  .filter(chat => {
                    const participantIds = Array.isArray(chat.participantIds) ? chat.participantIds : [];
                    const invitedUsers = Array.isArray(chat.invitedUsers) ? chat.invitedUsers : [];
                    
                    // Filter out groups where user is already a member
                    if (participantIds.includes(currentUserUid)) {
                      return false;
                    }
                    
                    // For sellers: only show if they are invited
                    if (isSeller && !invitedUsers.includes(currentUserUid)) {
                      return false;
                    }
                    
                    // For buyers: show all public groups (they can request to join)
                    return true;
                  });
              } catch (error) {
                console.log('Error fetching public groups:', error);
              }
            }

            // Combine member chats, all group chats (for admins), and public groups (deduplicate by id)
            const allChatsMap = new Map();
            memberChats.forEach(chat => allChatsMap.set(chat.id, chat));
            allGroupChats.forEach(chat => {
              if (!allChatsMap.has(chat.id)) {
                allChatsMap.set(chat.id, chat);
              }
            });
            publicGroups.forEach(chat => {
              if (!allChatsMap.has(chat.id)) {
                allChatsMap.set(chat.id, chat);
              }
            });

            const allChats = Array.from(allChatsMap.values());
            // Sort by timestamp (most recent first)
            allChats.sort((a, b) => {
              const aTime = a.timestamp?.toDate?.() || new Date(0);
              const bTime = b.timestamp?.toDate?.() || new Date(0);
              return bTime - aTime;
            });

            console.log(`📱 [MessagesScreen] Total chats to display: ${allChats.length}`);
            console.log(`   - Member chats: ${memberChats.length}`);
            console.log(`   - All group chats (admin): ${allGroupChats.length}`);
            console.log(`   - Public groups: ${publicGroups.length}`);

            setMessages(allChats);
            // Fire-and-forget: populate avatarMap for participant UIDs we don't yet have
            fetchAvatarsForChats(allChats).catch(() => {});
          } catch (error) {
            console.error('Error processing chat data:', error);
          } finally {
            setLoading(false);
          }
        },
        error => {
          setLoading(false);
        },
      );

      return unsubscribeMemberChats;
    } catch (error) {
      setLoading(false);
    }
  }, [userInfo, isBuyer, isSeller, isAdmin]);

  

  const markChatAsRead = async item => {
    try {
      // Ensure we have an id to update
      if (!item || !item.id) {
        return;
      }

      // Handle admin API response: userInfo.data.uid, regular nested: userInfo.user.uid, or flat: userInfo.uid
      const currentUserUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';
      
      // Sanitize navigation params to ensure ChatScreen receives expected fields
      const safeParams = {
        id: item.id,
        participantIds: Array.isArray(item.participantIds) ? item.participantIds : [],
        participants: Array.isArray(item.participants) ? item.participants : [],
        avatarUrl: item.avatarUrl || '',
        name: item.name || (item.participants && item.participants[0] && item.participants[0].name) || 'Chat',
        type: item.type || 'private', // Include chat type for ChatScreen
      };

      // Navigate immediately for instant response
      navigation.navigate('ChatScreen', safeParams);

      // Mark as read in the background (fire-and-forget)
      updateDoc(doc(db, 'chats', item.id), {
        unreadBy: arrayRemove(currentUserUid),
      }).catch(error => {
        console.error('Error marking chat as read:', error);
        // Silently fail - navigation already happened
      });
    } catch (error) {
      console.error('Error navigating to chat:', error);
      // Fallback: still attempt to navigate with minimal params
      navigation.navigate('ChatScreen', { id: item?.id });
    }
  };

  const createChat = async user => {
    setModalVisible(false);

    try {
      // Validate user data before proceeding
      if (!user || !user.uid) {
        throw new Error('Invalid user data');
      }

      // Handle admin API response: userInfo.data.uid, regular nested: userInfo.user.uid, or flat: userInfo.uid
      const currentUserUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';
      
      // Ensure userInfo exists
      if (!userInfo || !currentUserUid) {
        throw new Error('Your user profile is not available');
      }
      
      // First check if a private chat already exists with this user
      // Only check for private chats with exactly 2 participants
      const existingChatQuery = query(
        collection(db, 'chats'),
        where('participantIds', 'array-contains', currentUserUid),
        where('type', '==', 'private'),
      );

      const existingChatsSnapshot = await getDocs(existingChatQuery);
      let existingChat = null;

      existingChatsSnapshot.forEach(doc => {
        const chatData = doc.data();
        // Ensure it's a private chat with exactly 2 participants
        if (chatData.type === 'private' && 
            chatData.participantIds && 
            chatData.participantIds.length === 2 &&
            chatData.participantIds.includes(user.uid)) {
          existingChat = {id: doc.id, ...chatData};
        }
      });

      // If chat exists, navigate to it
      if (existingChat) {
        navigation.navigate('ChatScreen', existingChat);
        return;
      }

      // Otherwise create a new chat
      // First make sure we have valid data for all required fields
      const currentUserAvatar = userInfo?.data?.profileImage || userInfo?.data?.profilePhotoUrl || userInfo?.profileImage || userInfo?.profilePhotoUrl || '';
      const otherUserAvatar = user.avatarUrl || '';

      let chatData = {
        participants: [
          {
            uid: currentUserUid || '',
            avatarUrl: currentUserAvatar || '', // Ensure empty string if null/undefined
            name: userName || 'User',
          },
          {
            uid: user.uid || '',
            avatarUrl: otherUserAvatar || '', // Ensure empty string if null/undefined
            name: user.name || 'Contact',
          },
        ],
        participantIds: [currentUserUid, user.uid].filter(Boolean), // Remove any undefined/null values
        lastMessage: '',
        timestamp: new Date(),
  unreadBy: [user.uid].filter(Boolean), // Remove any undefined/null values
  // Pre-fill chat-level avatar and name with the other participant where possible
  avatarUrl: otherUserAvatar || '',
  name: user.name || '',
        type: 'private',
      };

  // creating new chat

      try {
        const addChat = await addDoc(collection(db, 'chats'), chatData);
  // chat created

        const docRef = doc(db, 'chats', addChat.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const newChatData = {id: docSnap.id, ...docSnap.data()};
          navigation.navigate('ChatScreen', newChatData);
        } else {
          throw new Error('Failed to get created chat document');
        }
      } catch (firestoreError) {
        // Log the full Firestore error for debugging (kept out of user alert)
        console.error('createChat: Firestore error creating chat document:', firestoreError);
        Alert.alert(
          'Error',
          'Failed to create chat. There might be an issue with the user data.',
        );
      }
    } catch (error) {
      // Log unexpected errors for debugging
      console.error('createChat: unexpected error:', error);
      Alert.alert('Error', 'Failed to create chat. Please try again.');
    }
  };

  const handleCreateGroup = async ({name, selectedUsers}) => {
    setGroupChatModalVisible(false);

    try {
      // Handle admin API response: userInfo.data.uid, regular nested: userInfo.user.uid, or flat: userInfo.uid
      const currentUserUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';
      
      // Ensure userInfo exists
      if (!userInfo || !currentUserUid) {
        throw new Error('Your user profile is not available');
      }

      // Create participants array including the current user
      const allParticipantIds = [currentUserUid, ...selectedUsers.map(u => u.uid)];
      const allParticipants = [
        {
          uid: currentUserUid,
          avatarUrl: userInfo?.data?.profileImage || userInfo?.data?.profilePhotoUrl || userInfo?.profileImage || userInfo?.profilePhotoUrl || '',
          name: userName,
        },
        ...selectedUsers.map(u => ({
          uid: u.uid,
          avatarUrl: u.avatarUrl || '',
          name: u.name,
        }))
      ];

      // Prepare group chat data
      const groupChatData = {
        participants: allParticipants,
        participantIds: allParticipantIds,
        lastMessage: '',
        timestamp: new Date(),
        name: name,
        type: 'group',
        isPublic: false, // Default to private - only admins can change this in settings
      };

      // Create the group chat
      try {
        const addChat = await addDoc(collection(db, 'chats'), groupChatData);
        
        const docRef = doc(db, 'chats', addChat.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const newChatData = {id: docSnap.id, ...docSnap.data()};
          await sendGroupChatNotificationApi(allParticipantIds, name);
          navigation.navigate('ChatScreen', newChatData);
        } else {
          throw new Error('Failed to get created chat document');
        }
      } catch (firestoreError) {
        console.error('handleCreateGroup: Firestore error creating chat document:', firestoreError);
        Alert.alert(
          'Error',
          'Failed to create group chat. Please try again.',
        );
      }
    } catch (error) {
      console.error('handleCreateGroup: unexpected error:', error);
      Alert.alert('Error', 'Failed to create group chat. Please try again.');
    }
  };

  // Helper function to check if an avatar source is valid (not default)
  const isValidAvatar = (source) => {
    if (!source) return false;
    // If it's the default avatar (numeric require), it's not valid
    if (typeof source === 'number') return false;
    // If it's an object with uri, check if it's a valid URL
    if (typeof source === 'object' && source.uri) {
      return typeof source.uri === 'string' && source.uri.trim() !== '' && source.uri.startsWith('http');
    }
    // If it's a string, check if it's a valid URL
    if (typeof source === 'string') {
      return source.trim() !== '' && source.startsWith('http');
    }
    return false;
  };

  // Helper to normalize avatar source format
  const normalizeAvatarSource = (source) => {
    if (!source) return DefaultAvatar;
    if (typeof source === 'string' && source.startsWith('http')) {
      return { uri: source };
    }
    if (typeof source === 'object' && source.uri) {
      return source;
    }
    return DefaultAvatar;
  };

  // Component to render two overlapping avatar circles for group chats
  // Requirements: 
  // - Container: 48×48 (same size as single avatar)
  // - Each avatar: 24×24 (half size)
  // - One avatar at bottom-left corner
  // - One avatar at top-right corner
  // - They overlap diagonally in the center
  const GroupAvatar = ({avatarSources, size = 48}) => {
    // Filter to get valid avatars first
    const validAvatars = avatarSources.filter(isValidAvatar);
    
    // Get first 2 avatars (valid ones first, then fill with defaults if needed)
    const avatarsToShow = [];
    for (let i = 0; i < 2; i++) {
      if (i < validAvatars.length) {
        avatarsToShow.push(normalizeAvatarSource(validAvatars[i]));
      } else {
        // Fill with default avatar if we don't have enough valid ones
        avatarsToShow.push(DefaultAvatar);
      }
    }
    
    const containerSize = size; // 48×48 (same as single avatar)
    const avatarSize = size / 1.3; // 24×24 (half size for each avatar in group)
    const radius = avatarSize / 2; // 12px radius for 24×24 avatar
    
    return (
      <View style={[styles.groupAvatarOverlapContainer, {width: containerSize, height: containerSize}]}>
        {/* First avatar (bottom left corner) */}
        <Image 
          source={avatarsToShow[0]} 
          style={[
            styles.groupAvatarOverlap,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: radius,
              position: 'absolute',
              left: 0,
              bottom: 0,
              zIndex: 1,
            }
          ]}
          resizeMode="cover"
        />
        {/* Second avatar (top right corner, overlapping diagonally) */}
        <Image 
          source={avatarsToShow[1]} 
          style={[
            styles.groupAvatarOverlap,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: radius,
              position: 'absolute',
              right: 0,
              top: 0,
              zIndex: 2,
            }
          ]}
          resizeMode="cover"
        />
      </View>
    );
  };

  const renderItem = ({item}) => {
  // Add null check to handle potential undefined participants
  const participants = item.participants || [];
  const chatType = item.type || 'private';
  
  // Handle both admin (nested user) and regular user structures
  const currentUserUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';
  
  // For group chats, use the group name; for private chats, use the other participant's username
  let displayName;
  if (chatType === 'group') {
    displayName = item.name;
  } else {
    // Get the other participant
    const otherParticipant = participants.find(p => p.uid !== currentUserUid) || participants[0];
    const otherUid = otherParticipant?.uid;
    // Prefer username from usernameMap (fetched from Firestore), fallback to stored name
    displayName = (otherUid && usernameMap[otherUid]) || otherParticipant?.name;
  }
  
  // For private chats: get the other participant's avatar
  // For group chats: get up to 4 participants' avatars (excluding current user)
  let avatarElement;
  
  if (chatType === 'group') {
    // Get all participants (excluding current user)
    const otherParticipants = participants
      .filter(p => p && p.uid && p.uid !== currentUserUid);
    
    // Filter participants who have valid avatars
    const participantsWithAvatars = otherParticipants.filter(p => {
      const uid = p?.uid;
      // Check if they have avatar in avatarMap or avatarUrl
      if (uid && avatarMap[uid]) return true;
      if (p?.avatarUrl) {
        if (typeof p.avatarUrl === 'string' && p.avatarUrl.trim() !== '') return true;
        if (typeof p.avatarUrl === 'object' && p.avatarUrl?.uri) return true;
      }
      return false;
    });
    
    // Shuffle and take first 2 participants who have avatars
    // If less than 2 have avatars, supplement with participants without avatars
    const shuffled = [...participantsWithAvatars].sort(() => Math.random() - 0.5);
    const selectedParticipants = shuffled.slice(0, 2);
    
    // If we don't have enough participants with avatars, add some without
    if (selectedParticipants.length < 2) {
      const remaining = otherParticipants
        .filter(p => !selectedParticipants.includes(p))
        .slice(0, 2 - selectedParticipants.length);
      selectedParticipants.push(...remaining);
    }
    
    // Get avatar sources for selected participants
    const avatarSources = selectedParticipants.map(p => {
      const uid = p?.uid;
      // Priority 1: avatarMap (from Firestore)
      if (uid && avatarMap[uid]) {
        return avatarMap[uid];
      }
      // Priority 2: participant's avatarUrl
      if (p?.avatarUrl) {
        if (typeof p.avatarUrl === 'string' && p.avatarUrl.trim() !== '') {
          return { uri: p.avatarUrl };
        } else if (typeof p.avatarUrl === 'object' && p.avatarUrl?.uri) {
          return { uri: p.avatarUrl.uri };
        }
      }
      // Return null if no valid avatar (will be replaced with default in GroupAvatar)
      return null;
    });
    
    avatarElement = <GroupAvatar avatarSources={avatarSources} size={48} />;
  } else {
    // Private chat: show single avatar
    const otherUserInfo = participants.find(p => p.uid !== currentUserUid) || {};
    const participantUid = otherUserInfo?.uid;
    
    let avatarSource = DefaultAvatar;
    
    // Priority 1: avatarMap (from Firestore)
    if (participantUid && avatarMap[participantUid]) {
      avatarSource = avatarMap[participantUid];
    } 
    // Priority 2: participant's avatarUrl
    else if (otherUserInfo && otherUserInfo.avatarUrl) {
      if (typeof otherUserInfo.avatarUrl === 'string' && otherUserInfo.avatarUrl.trim() !== '') {
        avatarSource = { uri: otherUserInfo.avatarUrl };
      } else if (Object.prototype.toString.call(otherUserInfo.avatarUrl) === '[object Object]' && otherUserInfo.avatarUrl.uri) {
        avatarSource = { uri: otherUserInfo.avatarUrl.uri };
      }
    }
    
    avatarElement = <Image source={avatarSource} style={styles.avatar} />;
  }

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => markChatAsRead(item)}>
        {avatarElement}
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <View style={styles.chatSubHeader}>
              <Text 
                style={styles.chatName} 
                numberOfLines={1} 
                ellipsizeMode="tail"
              >
                {displayName || item.name || 'Unknown'}
              </Text>
              <Text
                style={[
                  item.unreadBy && item.unreadBy.includes(currentUserUid)
                    ? styles.unreadChatTime
                    : styles.chatTime,
                ]}
                numberOfLines={1}>
                {formatTimeAgo(item.timestamp)}
              </Text>
            </View>
            <View style={styles.timeContainer}>
              {item.unreadBy && item.unreadBy.includes(currentUserUid) && (
                <View style={styles.unreadDot} />
              )}
            </View>
          </View>
          <Text
            numberOfLines={1}
            ellipsizeMode="tail"
            style={[
              item.unreadBy && item.unreadBy.includes(currentUserUid)
                ? styles.unreadChatMessage
                : styles.chatMessage,
            ]}>
            {item.lastMessage || ''}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  // Skeleton loading component for chat items
  const SkeletonChatItem = ({index = 0}) => (
    <View style={styles.chatItem}>
      {/* Avatar skeleton */}
      <View style={styles.skeletonAvatar} />

      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <View style={styles.chatSubHeader}>
            {/* Name skeleton with varying widths */}
            <View
              style={[styles.skeletonName, {width: 100 + (index % 3) * 20}]}
            />
            {/* Time skeleton */}
            <View style={styles.skeletonTime} />
          </View>
        </View>
        {/* Message skeleton with varying widths */}
        <View
          style={[styles.skeletonMessage, {width: `${60 + (index % 4) * 10}%`}]}
        />
      </View>
    </View>
  );

  // Filter messages based on selected tab
  const getFilteredMessages = () => {
    const currentUserUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';
    
    if (selectedTab === 'groups') {
      // Show only group chats (more than 2 participants)
      return messages.filter(msg => msg.isGroup || (msg.participants && msg.participants.length > 2));
    } else {
      // 'messages' - show only 1-on-1 chats (exclude groups)
      return messages.filter(msg => !msg.isGroup && (!msg.participants || msg.participants.length <= 2));
    }
  };

  // Calculate unread counts for badges
  const getUnreadCounts = () => {
    const currentUserUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';
    
    const unreadMessages = messages.filter(msg => 
      msg.unreadBy && 
      msg.unreadBy.includes(currentUserUid) &&
      !msg.isGroup && 
      (!msg.participants || msg.participants.length <= 2)
    ).length;
    
    const unreadGroups = messages.filter(msg => 
      msg.unreadBy && 
      msg.unreadBy.includes(currentUserUid) &&
      (msg.isGroup || (msg.participants && msg.participants.length > 2))
    ).length;
    
    return { unreadMessages, unreadGroups };
  };

  const filteredMessages = getFilteredMessages();
  const { unreadMessages, unreadGroups } = getUnreadCounts();

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}} edges={["top", "left", "right"]}>
      <StatusBar 
        barStyle="dark-content"
        backgroundColor="#fff"
        translucent={false}
      />
      <View style={styles.container}>
        <View style={[styles.header, {paddingTop: 12}]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <BackSolidIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerActions}>
            {isAdmin && (
              <TouchableOpacity
                style={styles.createChat}
                onPress={() => setGroupChatModalVisible(true)}>
                <GroupIcon width={24} height={24} color="#000000" />
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.createChat}
              onPress={() => setModalVisible(true)}>
              <NewMessageIcon width={24} height={24} color="#000000" />
            </TouchableOpacity>
          </View>
        </View>

        {/* Tab Navigation */}
        <View style={styles.tabContainer}>
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'messages' && styles.tabActive]}
            onPress={() => setSelectedTab('messages')}>
            <View style={styles.tabContent}>
              <Text style={[styles.tabText, selectedTab === 'messages' && styles.tabTextActive]}>
                Messages
              </Text>
              {unreadMessages > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {unreadMessages > 99 ? '99+' : unreadMessages}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[styles.tab, selectedTab === 'groups' && styles.tabActive]}
            onPress={() => setSelectedTab('groups')}>
            <View style={styles.tabContent}>
              <Text style={[styles.tabText, selectedTab === 'groups' && styles.tabTextActive]}>
                Groups
              </Text>
              {unreadGroups > 0 && (
                <View style={styles.tabBadge}>
                  <Text style={styles.tabBadgeText}>
                    {unreadGroups > 99 ? '99+' : unreadGroups}
                  </Text>
                </View>
              )}
            </View>
          </TouchableOpacity>
        </View>

        <FlatList
          style={{flex: 1}}
          data={loading ? [] : filteredMessages}
          keyExtractor={(item, index) => (item && item.id) ? item.id : `chat-${index}`}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContainer,
            {paddingBottom: totalBottomPadding},
            filteredMessages.length === 0 && !loading && styles.emptyListContainer,
          ]}
          ListEmptyComponent={() =>
            loading ? (
              // Show skeleton loading when loading
              <View style={styles.skeletonContainer}>
                {Array.from({length: 6}).map((_, idx) => (
                  <SkeletonChatItem key={idx} index={idx} />
                ))}
              </View>
            ) : (
              // Show empty state when not loading and no messages
              <View style={styles.emptyStateContainer}>
                <Text style={styles.emptyStateTitle}>
                  {selectedTab === 'groups' ? 'No Group Chats' : 'No Messages Yet'}
                </Text>
                <Text style={styles.emptyStateSubtitle}>
                  {selectedTab === 'unread' ? 'All caught up!' :
                   selectedTab === 'groups' ? 'Join or create a group chat to get started.' :
                   'Start a conversation with plant enthusiasts and discover amazing plants!'}
                </Text>
              </View>
            )
          }
        />

        <NewMessageModal
          visible={modalVisible}
          onClose={() => setModalVisible(false)}
          onSelect={user => createChat(user)}
          userInfo={userInfo}
        />
        
        <GroupChatModal
          visible={groupChatModalVisible}
          onClose={() => setGroupChatModalVisible(false)}
          onCreateGroup={handleCreateGroup}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F5',
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  createChat: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingBottom: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
  },
  tab: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 20,
    marginHorizontal: 4,
  },
  tabActive: {
    backgroundColor: '#539461',
  },
  tabContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tabText: {
    fontSize: 15,
    fontWeight: '500',
    color: '#647276',
  },
  tabTextActive: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  tabBadge: {
    backgroundColor: '#FF5247',
    minWidth: 20,
    height: 20,
    borderRadius: 10,
    paddingHorizontal: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tabBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  listContainer: {
    padding: 12,
  },
  emptyListContainer: {
    flex: 1,
    padding: 0,
  },
  chatItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 12,
  },
  groupAvatarOverlapContainer: {
    position: 'relative',
    marginRight: 12,
    overflow: 'hidden', // Changed to hidden to ensure proper clipping, but container size allows overlap
  },
  groupAvatarOverlap: {
    borderWidth: 1,
    borderColor: '#FFFFFF',
    backgroundColor: '#f5f5f5',
  },
  chatContent: {
    flex: 1,
  },
  chatHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  chatSubHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    minWidth: 0,
  },
  chatName: {
    flex: 1,
    minWidth: 0,
    fontWeight: '600',
    fontSize: 16,
    color: '#000000',
    marginRight: 8,
  },
  chatTime: {
    fontSize: 14,
    color: '#999',
    flexShrink: 0,
  },
  unreadChatTime: {
    fontSize: 14,
    color: '#000000',
    flexShrink: 0,
  },
  chatMessage: {
    fontSize: 14,
    color: '#555',
  },
  unreadChatMessage: {
    fontSize: 14,
    color: '#000000',
    fontWeight: '600',
  },
  timeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#F84F4F',
    marginLeft: 6,
  },
  emptyStateContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
    paddingHorizontal: 20,
  },
  emptyStateTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#000000',
    textAlign: 'center',
    marginBottom: 8,
  },
  emptyStateSubtitle: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 30,
    lineHeight: 22,
  },
  browseMoreContainer: {
    width: '100%',
    marginTop: 20,
  },
  skeletonContainer: {
    paddingHorizontal: 12,
  },
  skeletonAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  skeletonName: {
    width: 120,
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonTime: {
    width: 60,
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
  },
  skeletonMessage: {
    width: '80%',
    height: 14,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginTop: 6,
  },
});

export default MessagesScreen;
