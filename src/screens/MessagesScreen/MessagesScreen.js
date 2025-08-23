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
  SafeAreaView,
} from 'react-native';
import {db} from '../../../firebase';

// Pre-load and cache the default avatar image to prevent RCTImageView errors
const DefaultAvatar = require('../../assets/images/AvatarBig.png');
import CreateChat from '../../assets/iconchat/new-chat.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import {AuthContext} from '../../auth/AuthProvider';
import NewMessageModal from '../../components/NewMessageModal/NewMessageModal';
import BrowseMorePlants from '../../components/BrowseMorePlants/BrowseMorePlants';

const MessagesScreen = ({navigation}) => {
  const {userInfo} = useContext(AuthContext);
  const userFullName = userInfo
    ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim()
    : 'User';

  const [messages, setMessages] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (!userInfo || !userInfo.uid) {
      setLoading(false);
      return;
    }

    try {
      // Create a query with cache-first approach
      const q = query(
        collection(db, 'chats'),
        where('participantIds', 'array-contains', userInfo.uid),
        orderBy('timestamp', 'desc'),
      );

      // Use onSnapshot with includeMetadataChanges to handle both cache and server data
      const unsubscribe = onSnapshot(
        q,
        {includeMetadataChanges: true},
        snapshot => {
          try {
            // Check if data is from cache or server
            const source = snapshot.metadata.fromCache ? 'cache' : 'server';
            console.log('Data came from ' + source);

            const chats = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
            }));

            setMessages(chats);
          } catch (error) {
            console.error('Error processing chat data:', error);
          } finally {
            setLoading(false);
          }
        },
        error => {
          console.error('Firestore subscription error:', error);
          setLoading(false);
        },
      );

      return unsubscribe;
    } catch (error) {
      console.error('Error setting up chat listener:', error);
      setLoading(false);
    }
  }, [userInfo]);

  const markChatAsRead = async item => {
    try {
      // Ensure we have an id to update
      if (!item || !item.id) {
        console.warn('markChatAsRead called with invalid item:', item);
        return;
      }

      // Await update to ensure chat doc is updated before navigating
      await updateDoc(doc(db, 'chats', item.id), {
        unreadBy: arrayRemove(userInfo.uid),
      });

      // Sanitize navigation params to ensure ChatScreen receives expected fields
      const safeParams = {
        id: item.id,
        participantIds: Array.isArray(item.participantIds) ? item.participantIds : [],
        participants: Array.isArray(item.participants) ? item.participants : [],
        avatarUrl: item.avatarUrl || '',
        name: item.name || (item.participants && item.participants[0] && item.participants[0].name) || 'Chat',
      };

  console.log('Navigating to ChatScreen with params:', safeParams);
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

      // Ensure userInfo exists
      if (!userInfo || !userInfo.uid) {
        throw new Error('Your user profile is not available');
      }
      // First check if a chat already exists with this user
      const existingChatQuery = query(
        collection(db, 'chats'),
        where('participantIds', 'array-contains', userInfo.uid),
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
      const currentUserAvatar = userInfo.profilePhotoUrl || '';
      const otherUserAvatar = user.avatarUrl || '';

      let chatData = {
        participants: [
          {
            uid: userInfo.uid || '',
            avatarUrl: currentUserAvatar || '', // Ensure empty string if null/undefined
            name: userFullName || 'User',
          },
          {
            uid: user.uid || '',
            avatarUrl: otherUserAvatar || '', // Ensure empty string if null/undefined
            name: user.name || 'Contact',
          },
        ],
        participantIds: [userInfo.uid, user.uid].filter(Boolean), // Remove any undefined/null values
        lastMessage: '',
        timestamp: new Date(),
        unreadBy: [user.uid].filter(Boolean), // Remove any undefined/null values
        avatarUrl: '',
        name: '',
        type: 'private',
      };

      console.log('Creating new chat with data:', JSON.stringify(chatData));

      try {
        const addChat = await addDoc(collection(db, 'chats'), chatData);
        console.log('Chat created with ID:', addChat.id);

        const docRef = doc(db, 'chats', addChat.id);
        const docSnap = await getDoc(docRef);

        if (docSnap.exists()) {
          const newChatData = {id: docSnap.id, ...docSnap.data()};
          navigation.navigate('ChatScreen', newChatData);
        } else {
          throw new Error('Failed to get created chat document');
        }
      } catch (firestoreError) {
        console.error('Firestore error:', firestoreError);
        Alert.alert(
          'Error',
          'Failed to create chat. There might be an issue with the user data.',
        );
      }
    } catch (error) {
      console.error('Error creating chat:', error);
      Alert.alert('Error', 'Failed to create chat. Please try again.');
    }
  };

  const renderItem = ({item}) => {
    // Add null check to handle potential undefined participants
    const participants = item.participants || [];
    const otherUserInfo = participants.find(p => p.uid !== userInfo.uid) || {};
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => markChatAsRead(item)}>
        <Image source={DefaultAvatar} style={styles.avatar} />
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <View style={styles.chatSubHeader}>
              <Text style={styles.chatName}>
                {item.name ||
                  (otherUserInfo && otherUserInfo.name) ||
                  'Unknown'}
              </Text>
              <Text
                style={[
                  item.unreadBy && item.unreadBy.includes(userInfo.uid)
                    ? styles.unreadChatTime
                    : styles.chatTime,
                ]}>
                {item.timestamp
                  ? moment(item.timestamp.toDate()).fromNow()
                  : ''}
              </Text>
            </View>
            <View style={styles.timeContainer}>
              {item.unreadBy && item.unreadBy.includes(userInfo.uid) && (
                <View style={styles.unreadDot} />
              )}
            </View>
          </View>
          <Text
            numberOfLines={1}
            style={[
              item.unreadBy && item.unreadBy.includes(userInfo.uid)
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
    <SafeAreaView style={{flex: 1}}>
      <View style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <BackSolidIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Messages</Text>
          <TouchableOpacity
            style={styles.createChat}
            onPress={() => setModalVisible(true)}>
            <CreateChat />
          </TouchableOpacity>
        </View>

        <FlatList
          style={{flex: 1}}
          data={loading ? [] : messages}
          keyExtractor={(item, index) => (item && item.id) ? item.id : `chat-${index}`}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContainer,
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
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F5',
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
    paddingVertical: 20,
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
