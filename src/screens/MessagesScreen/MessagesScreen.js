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
import React, {useContext, useEffect, useState} from 'react';
import {
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {useSafeAreaInsets, SafeAreaView} from 'react-native-safe-area-context';
import {db} from '../../../firebase';

// Pre-load and cache the default avatar image to prevent RCTImageView errors
const DefaultAvatar = require('../../assets/images/AvatarBig.png');
import CreateChat from '../../assets/iconchat/new-chat.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import {AuthContext} from '../../auth/AuthProvider';
import NewMessageModal from '../../components/NewMessageModal/NewMessageModal';
import GroupChatModal from '../../components/GroupChatModal/GroupChatModal';

const MessagesScreen = ({navigation}) => {
  const insets = useSafeAreaInsets();
  
  // Calculate proper bottom padding for tab bar + safe area
  const tabBarHeight = 60; // Standard tab bar height  
  const safeBottomPadding = Math.max(insets.bottom, 8); // At least 8px padding
  const totalBottomPadding = tabBarHeight + safeBottomPadding + 16; // Extra 16px for spacing
  
  const {userInfo} = useContext(AuthContext);
  // Handle admin API response structure: userInfo.data.* or regular userInfo.user.* or flat userInfo.*
  const userFirstName = userInfo?.data?.firstName || userInfo?.user?.firstName || userInfo?.firstName || '';
  const userLastName = userInfo?.data?.lastName || userInfo?.user?.lastName || userInfo?.lastName || '';
  const userFullName = userFirstName || userLastName 
    ? `${userFirstName} ${userLastName}`.trim()
    : 'User';
  
  // Check if user is an admin
  const isAdmin = userInfo?.data?.role === 'admin' || userInfo?.data?.role === 'sub_admin' || userInfo?.role === 'admin' || userInfo?.role === 'sub_admin';

  const [messages, setMessages] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [groupChatModalVisible, setGroupChatModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);
  // Map of uid -> image source (either {uri: ...} or local numeric require)
  const [avatarMap, setAvatarMap] = useState({});

  // Fetch avatars from buyers collection for given chats' participant UIDs
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

      // Fetch each buyer doc and update avatarMap
      const updates = {};
      for (const uid of uidsToFetch) {
        try {
          const buyerDocRef = doc(db, 'buyer', uid);
          const buyerSnap = await getDoc(buyerDocRef);
          if (buyerSnap) {
            const data = buyerSnap.data();

            const url = data?.profilePhotoUrl || null;
            if (url && typeof url === 'string') {
              updates[uid] = { uri: url };
            } else {
              // fallback to default avatar
              updates[uid] = DefaultAvatar;
            }
          } else {
            updates[uid] = DefaultAvatar;
          }
        } catch (err) {
          updates[uid] = DefaultAvatar;
        }
      }



      if (Object.keys(updates).length > 0) {
        setAvatarMap(prev => ({...prev, ...updates}));
      }
    } catch (err) {
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
      // Create a query with cache-first approach
      const q = query(
        collection(db, 'chats'),
        where('participantIds', 'array-contains', currentUserUid),
        orderBy('timestamp', 'desc'),
      );

  // Use onSnapshot with includeMetadataChanges to handle both cache and server data
  const unsubscribe = onSnapshot(
        q,
        {includeMetadataChanges: true},
        snapshot => {
          try {
            // Check if data is from cache or server (no logging)
            const source = snapshot.metadata.fromCache ? 'cache' : 'server';

            const chats = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));

            setMessages(chats);
            // Fire-and-forget: populate avatarMap for participant UIDs we don't yet have
            fetchAvatarsForChats(chats).catch(() => {});
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

      return unsubscribe;
    } catch (error) {
      setLoading(false);
    }
  }, [userInfo]);

  

  const markChatAsRead = async item => {
    try {
      // Ensure we have an id to update
      if (!item || !item.id) {
        return;
      }

      // Handle admin API response: userInfo.data.uid, regular nested: userInfo.user.uid, or flat: userInfo.uid
      const currentUserUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';
      
      // Await update to ensure chat doc is updated before navigating
      await updateDoc(doc(db, 'chats', item.id), {
        unreadBy: arrayRemove(currentUserUid),
      });

      // Sanitize navigation params to ensure ChatScreen receives expected fields
      const safeParams = {
        id: item.id,
        participantIds: Array.isArray(item.participantIds) ? item.participantIds : [],
        participants: Array.isArray(item.participants) ? item.participants : [],
        avatarUrl: item.avatarUrl || '',
        name: item.name || (item.participants && item.participants[0] && item.participants[0].name) || 'Chat',
        type: item.type || 'private', // Include chat type for ChatScreen
      };

  navigation.navigate('ChatScreen', safeParams);
    } catch (error) {
      console.error('Error marking chat as read or navigating:', error);
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
      
      // First check if a chat already exists with this user
      const existingChatQuery = query(
        collection(db, 'chats'),
        where('participantIds', 'array-contains', currentUserUid),
      );

      const existingChatsSnapshot = await getDocs(existingChatQuery);
      let existingChat = null;

      existingChatsSnapshot.forEach(doc => {
        const chatData = doc.data();
        if (chatData.participantIds.includes(user.uid)) {
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
            name: userFullName || 'User',
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
          name: userFullName,
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

  const renderItem = ({item}) => {
  // Add null check to handle potential undefined participants
  const participants = item.participants || [];
  const chatType = item.type || 'private';
  
  // Handle both admin (nested user) and regular user structures
  const currentUserUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';
  
  // For group chats, use the group name; for private chats, use the other participant's name
  const displayName = chatType === 'group' 
    ? item.name 
    : (participants.find(p => p.uid !== currentUserUid) || participants[0])?.name;
  
  const otherUserInfo = chatType === 'group' 
    ? participants[0] // Use first participant for avatar in group chats
    : participants.find(p => p.uid !== currentUserUid) || {};
    
  // Determine avatar source: prefer participant-provided avatar, then avatarMap, then default
  let avatarSource = DefaultAvatar;
  if (otherUserInfo && otherUserInfo.avatarUrl) {
    if (Object.prototype.toString.call(otherUserInfo.avatarUrl) === '[object Object]' && otherUserInfo.avatarUrl.uri) {
      avatarSource = { uri: otherUserInfo.avatarUrl?.uri };
    }
  }

    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => markChatAsRead(item)}>
        <Image source={avatarSource} style={styles.avatar} />
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
          <TouchableOpacity onPress={() => navigation.navigate('BuyerTabs', { screen: 'Shop' })}>
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
