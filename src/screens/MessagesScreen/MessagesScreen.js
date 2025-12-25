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
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../../firebase';
import CreateChat from '../../assets/iconchat/new-chat.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import { AuthContext } from '../../auth/AuthProvider';
import GroupChatModal from '../../components/GroupChatModal/GroupChatModal';
import NewMessageModal from '../../components/NewMessageModal/NewMessageModal';

// Pre-load and cache the default avatar image to prevent RCTImageView errors
const DefaultAvatar = require('../../assets/images/AvatarBig.png');

const MessagesScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  
  // Calculate proper bottom padding for tab bar + safe area
  const tabBarHeight = 60; // Standard tab bar height  
  const safeBottomPadding = Math.max(insets.bottom, 8); // At least 8px padding
  const totalBottomPadding = tabBarHeight + safeBottomPadding + 16; // Extra 16px for spacing
  
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
      // Fetch chats where user is a participant
      const memberChatsQuery = query(
        collection(db, 'chats'),
        where('participantIds', 'array-contains', currentUserUid),
        orderBy('timestamp', 'desc'),
      );

      // For buyers, also fetch public groups where they're not members
      let publicGroupsQuery = null;
      if (isBuyer) {
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

            // If buyer and public groups query exists, fetch public groups
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

            // Combine member chats and public groups (deduplicate by id)
            const allChatsMap = new Map();
            memberChats.forEach(chat => allChatsMap.set(chat.id, chat));
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
  }, [userInfo, isBuyer, isSeller]);

  

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
    // Get all participants (excluding current user) - we'll take first 2 for display
    const otherParticipants = participants
      .filter(p => p && p.uid && p.uid !== currentUserUid);
    
    // Get avatar sources for first 2 participants (based on order in array)
    const avatarSources = otherParticipants.slice(0, 2).map(p => {
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
              <Text style={styles.chatName}>
                {displayName || item.name || 'Unknown'}
              </Text>
              <Text
                style={[
                  item.unreadBy && item.unreadBy.includes(currentUserUid)
                    ? styles.unreadChatTime
                    : styles.chatTime,
                ]}>
                {item.timestamp
                  ? moment(item.timestamp.toDate()).fromNow()
                  : ''}
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

  return (
    <SafeAreaView style={{flex: 1}} edges={["left", "right", "bottom"]}>
      <View style={styles.container}>
        <View style={[styles.header, {paddingTop: Math.max(insets.top, 12)}]}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <BackSolidIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <View style={styles.headerActions}>
            {isAdmin && (
              <TouchableOpacity
                style={[styles.createChat, styles.groupChatButton]}
                onPress={() => setGroupChatModalVisible(true)}>
                <Text style={styles.groupChatButtonText}>Group</Text>
              </TouchableOpacity>
            )}
            <TouchableOpacity
              style={styles.createChat}
              onPress={() => setModalVisible(true)}>
              <CreateChat />
            </TouchableOpacity>
          </View>
        </View>

        <FlatList
          style={{flex: 1}}
          data={loading ? [] : messages}
          keyExtractor={(item, index) => (item && item.id) ? item.id : `chat-${index}`}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContainer,
            {paddingBottom: totalBottomPadding},
            messages.length === 0 && !loading && styles.emptyListContainer,
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
                <Text style={styles.emptyStateTitle}>No Messages Yet</Text>
                <Text style={styles.emptyStateSubtitle}>
                  Start a conversation with plant enthusiasts and discover
                  amazing plants!
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
  groupChatButton: {
    backgroundColor: '#539461',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
    width: 'auto',
    height: 32,
  },
  groupChatButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
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
    gap: 6,
  },
  chatName: {
    fontWeight: '600',
    fontSize: 16,
    color: '#000000',
  },
  chatTime: {
    fontSize: 16,
    color: '#999',
  },
  unreadChatTime: {
    fontSize: 16,
    color: '#000000',
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
