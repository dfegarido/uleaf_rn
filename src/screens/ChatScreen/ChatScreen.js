import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import {useSafeAreaInsets, SafeAreaView} from 'react-native-safe-area-context';
import { db } from '../../../firebase';
import OptionIcon from '../../assets/iconchat/option.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import { AuthContext } from '../../auth/AuthProvider';
import ChatBubble from '../../components/ChatBubble/ChatBubble';
import DateSeparator from '../../components/DateSeparator/DateSeparator';
import MessageInput from '../../components/MessageInput/MessageInput';
import BrowseMorePlants from '../../components/BrowseMorePlants/BrowseMorePlants';

const ChatScreen = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  
  // Calculate proper bottom padding for tab bar + safe area (this screen is accessed from tab navigation)
  const tabBarHeight = 60; // Standard tab bar height  
  const safeBottomPadding = Math.max(insets.bottom, 8); // At least 8px padding
  const totalBottomPadding = tabBarHeight + safeBottomPadding + 16; // Extra 16px for spacing
  
  const routeParams = route?.params || {};
  const avatarUrl = routeParams.avatarUrl || '';
  const name = routeParams.name || routeParams.title || 'Chat';
  const id = routeParams.id || routeParams.chatId || null;
  const participantIds = Array.isArray(routeParams.participantIds) ? routeParams.participantIds : (Array.isArray(routeParams.participants) ? routeParams.participants.map(p => p.uid).filter(Boolean) : []);
  const participants = Array.isArray(routeParams.participants) ? routeParams.participants : [];
  const {userInfo} = useContext(AuthContext);
  const flatListRef = useRef(null);
  
  // Make sure participants is an array and has at least one element
  const otherUserInfo = Array.isArray(participants) && participants.length > 0
    ? participants.find(p => p?.uid !== userInfo?.uid) || participants[0]
    : {};
    
  // Process avatarUrl if it's a number (e.g., requiring a local asset) or other non-string type
  if (otherUserInfo?.avatarUrl !== undefined && typeof otherUserInfo.avatarUrl !== 'string') {
    // If it's a number, it might be referencing a local asset ID
    // We'll keep it as is and handle it in getAvatarSource()
  }

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);

  // Send a message: create message doc and update chat metadata
  const sendMessage = async (text) => {
    if (!id) {
      return;
    }

    if (!text || !text.trim()) return;

    try {
      const newMsg = {
        chatId: id,
        senderId: userInfo?.uid || null,
        text: text.trim(),
        timestamp: Timestamp.now(),
      };

      // Add message to messages collection
      await addDoc(collection(db, 'messages'), newMsg);

      // Mark chat lastMessage and update timestamp, mark unread for other participants
      const otherParticipantIds = Array.isArray(participantIds)
        ? participantIds.filter(pid => pid && pid !== userInfo?.uid)
        : [];

      try {
        await updateDoc(doc(db, 'chats', id), {
          lastMessage: newMsg.text,
          timestamp: Timestamp.now(),
          unreadBy: arrayUnion(...otherParticipantIds),
        });
      } catch (err) {
        // ignore update failures
      }
    } catch (error) {
      // ignore send errors
    }
  };

  // Helper function to detect plant-related conversation
  const isPlantRelatedConversation = () => {
    const plantKeywords = ['plant', 'flower', 'seed', 'garden', 'grow', 'leaf', 'root', 'soil', 'water', 'fertilizer', 'bloom', 'care', 'indoor', 'outdoor', 'succulent', 'herb', 'tree', 'shrub'];
    const recentMessages = messages.slice(-10); // Check last 10 messages
    
    return recentMessages.some(message => 
      message.text && plantKeywords.some(keyword => 
        message.text.toLowerCase().includes(keyword)
      )
    );
  };

  // Helper function for safe avatar display
  const getAvatarSource = () => {
    try {
      const au = otherUserInfo?.avatarUrl;
      // Prefer other user's avatar when present and valid
      if (au !== undefined && au !== null) {
        if (typeof au === 'string' && au.trim() !== '') {
          return { uri: au.trim() };
        }
        if (typeof au === 'object' && au !== null && typeof au.uri === 'string' && au.uri.trim() !== '') {
          return { uri: au.uri.trim() };
        }

      }

      
    } catch (error) {
      // silent fallback
    }

    // Explicit, deterministic fallback to default avatar
    return require('../../assets/images/AvatarBig.png');
  };

  useEffect(() => {
    if (!id) {
      setMessages([]);
      return;
    }

    try {
  setLoading(true);
      const q = query(
        collection(db, 'messages'),
        where('chatId', '==', id),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        { includeMetadataChanges: true },
        snapshot => {
          try {
            const messagesFirestore = snapshot.docs.map(doc => ({
              id: doc.id,
              chatId: id,
              ...doc.data(),
            }));

            setMessages(messagesFirestore);
            setLoading(false);
          } catch (error) {
            setMessages([]);
            setLoading(false);
          }
        },
        error => {
          setMessages([]);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      setMessages([]);
    }
  }, [id]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (flatListRef?.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: false });
    }
  }, [messages]);

  // Skeleton message for loading state
  const SkeletonMessage = ({isMe = false, index = 0}) => (
    <View style={[styles.skeletonRow, isMe ? styles.skeletonRowRight : styles.skeletonRowLeft]} key={`skeleton-${index}`}>
      <View style={styles.skeletonBubble} />
    </View>
  );

  // Render
  if (!id) {
    return (
      <View style={styles.container}>
        <View style={styles.missingContainer}>
          <Text style={styles.missingTitle}>No chat selected</Text>
          <Text style={styles.missingSubtitle}>Tap a chat from your messages list to open the conversation.</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView 
        style={{ flex: 1 }} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, {paddingTop: Math.min(insets.top, 8)}]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <BackSolidIcon size={24} color="#333" />
          </TouchableOpacity>
          <View style={styles.userInfo}>
            <Image
              source={getAvatarSource()}
              style={styles.avatar}
            />
            <View style={styles.userInfoText}>
              <Text style={styles.title}>{otherUserInfo?.name || name || 'Chat'}</Text>
              <Text style={styles.subtitle}>Active now</Text>
            </View>
          </View>
          <TouchableOpacity style={styles.options}
            onPress={() => navigation.navigate('ChatSettingsScreen', { chatId: id, participants })}>
            <OptionIcon />
          </TouchableOpacity>
        </View>

      {/* Chat Messages */}
      {loading ? (
        <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 12}}>
          {Array.from({length: 6}).map((_, idx) => (
            <SkeletonMessage key={`sk-${idx}`} isMe={idx % 3 === 0} index={idx} />
          ))}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id || `message-${index}`}
          renderItem={({ item, index }) => {
            if (!item) return null;
            if (item.type === 'date') return <DateSeparator text={item.text} />;

            const nextMsg = messages[index + 1];
            const isMe = item?.senderId === userInfo?.uid;
            const nextMsgIsMe = nextMsg?.senderId === userInfo?.uid;
            const showAvatar = !isMe && (!nextMsg || nextMsgIsMe || nextMsgIsMe !== isMe);

            return (
              <ChatBubble
                text={item.text || 'Empty message'}
                isMe={isMe}
                showAvatar={showAvatar}
              />
            );
          }}
          contentContainerStyle={{ paddingVertical: 10, paddingBottom: 20 }}
          style={{ flex: 1 }}
          onContentSizeChange={() => {
            setTimeout(() => {
              if (flatListRef?.current && messages.length > 0) {
                flatListRef?.current.scrollToEnd({ animated: true });
              }
            }, 100);
          }}
          onLayout={() => {
            if (flatListRef?.current && messages.length > 0) {
              flatListRef?.current.scrollToEnd({ animated: false });
            }
          }}
        />
      )}

      {/* Plant Recommendations for plant-related conversations */}
      {messages.length > 3 && isPlantRelatedConversation() && (
        <View style={styles.plantRecommendationsContainer}>
          <BrowseMorePlants
            title="Plants You Might Like"
            limit={4}
            showLoadMore={false}
            containerStyle={styles.chatBrowseMoreContainer}
            horizontal={true}
          />
        </View>
      )}

      {/* Input */}
      <MessageInput onSend={sendMessage} />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    paddingTop: 25,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
  paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  backButton: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfoText: {
    marginLeft: 10,
  },
  options: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  title: {fontSize: 18, fontWeight: 'bold', color: '#000'},
  subtitle: {fontSize: 12, color: '#666', marginTop: 2},
  avatar: {
    width: 32,
    height: 32,
    borderColor: '#539461',
    borderWidth: 1,
    borderRadius: 1000,
  },
  plantRecommendationsContainer: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chatBrowseMoreContainer: {
    marginBottom: 0,
  },
  skeletonRow: {
    height: 36,
    marginBottom: 12,
    justifyContent: 'flex-start',
  },
  skeletonRowRight: {
    alignItems: 'flex-end',
  },
  skeletonRowLeft: {
    alignItems: 'flex-start',
  },
  skeletonBubble: {
    width: '60%',
    height: 16,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
});

export default ChatScreen;
