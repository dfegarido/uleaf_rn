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
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../../firebase';
import OptionIcon from '../../assets/iconchat/option.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import { AuthContext } from '../../auth/AuthProvider';
import ChatBubble from '../../components/ChatBubble/ChatBubble';
import DateSeparator from '../../components/DateSeparator/DateSeparator';
import MessageInput from '../../components/MessageInput/MessageInput';

const ChatScreen = ({navigation, route}) => {
  const { avatarUrl, name, id, participantIds = [], participants = [] } = route.params || {};
  const {userInfo} = useContext(AuthContext);
  const flatListRef = useRef(null);
  
  // Make sure participants is an array and has at least one element
  const otherUserInfo = Array.isArray(participants) && participants.length > 0
    ? participants.find(p => p?.uid !== userInfo?.uid) || participants[0]
    : {};

  const [messages, setMessages] = useState([]);

  // Helper function for safe avatar display
  const getAvatarSource = () => {
    // Always use the default local image for now
    return require('../../assets/images/AvatarBig.png');
  };

  useEffect(() => {
    if (!id) {
      console.error('No chat ID provided');
      return () => {};
    }
    
    try {
      const q = query(
        collection(db, 'messages'), 
        where('chatId', '==', id),
        orderBy('timestamp', 'asc')
      );
      
      const unsubscribe = onSnapshot(q, 
        { includeMetadataChanges: true },
        snapshot => {
          try {
            // Check if data is from cache or server
            const source = snapshot.metadata.fromCache ? "cache" : "server";
            console.log(`Chat messages came from ${source}`);
            
            const messagesFirestore = snapshot.docs.map(doc => ({
              id: doc.id,
              chatId: id,
              ...doc.data(),
            }));
            
            setMessages(messagesFirestore);
            
            // Scroll to bottom when new messages are loaded
            setTimeout(() => {
              if (flatListRef?.current && messagesFirestore.length > 0) {
                flatListRef?.current.scrollToEnd({ animated: false });
              }
            }, 200);
          } catch (error) {
            console.error('Error processing message data:', error);
          }
        },
        error => {
          console.error('Error getting messages:', error);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      console.error('Error setting up messages listener:', error);
      return () => {};
    }
  }, [id]);

  useEffect(() => {
    if (flatListRef?.current && messages.length > 0) {
      flatListRef?.current.scrollToEnd({ animated: false });
    }
  }, []);

  const sendMessage = async newMessage => {
    try {
      if (!newMessage || !newMessage.trim()) {
        console.log('Cannot send empty message');
        return;
      }
      
      if (!id) {
        console.error('No chat ID found');
        return;
      }
      
      // Create message data
      const messageData = {
        text: newMessage,
        senderId: userInfo?.uid,
        senderName: userInfo ? `${userInfo.firstName || ''} ${userInfo.lastName || ''}`.trim() : 'User',
        timestamp: Timestamp.now(),
        chatId: id,
      };

      // Add message to collection
      await addDoc(collection(db, 'messages'), messageData);
      
      // Get participant IDs to mark as unread, ensuring valid array
      let unreadParticipants = [];
      if (Array.isArray(participantIds) && participantIds.length > 0) {
        unreadParticipants = participantIds.filter(uid => uid && uid !== userInfo?.uid);
      }
      
      // Update chat with last message
      await updateDoc(doc(db, 'chats', id), {
        lastMessage: messageData.text,
        timestamp: messageData.timestamp,
        ...(unreadParticipants.length > 0 ? { unreadBy: arrayUnion(...unreadParticipants) } : {})
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
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
            <Text style={styles.title}>{otherUserInfo?.name || name || "Chat"}</Text>
            <Text style={styles.subtitle}>Active now</Text>
          </View>
        </View>
        <TouchableOpacity style={styles.options} 
          onPress={() => navigation.navigate('ChatSettingsScreen', { chatId: id, ...{participants} })}>
          <OptionIcon />
        </TouchableOpacity>
      </View>

      {/* Chat Messages */}
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={(item, index) => item.id || `message-${index}`}
        renderItem={({item, index}) => {
          if (item.type === 'date') {
            return <DateSeparator text={item.text} />;
          }

          const nextMsg = messages[index + 1];
          const isMe = item?.senderId === userInfo.uid;
          const nextMsgIsMe = nextMsg?.senderId === userInfo.uid;
          const showAvatar =
            !isMe &&
            (!nextMsg || nextMsgIsMe || nextMsgIsMe !== isMe);

          return (
            <ChatBubble
              text={item.text}
              isMe={isMe}
              showAvatar={showAvatar}
            />
          );
        }}
        contentContainerStyle={{paddingVertical: 10}}
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

      {/* Input */}
      <MessageInput onSend={sendMessage} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {flex: 1, backgroundColor: '#f1f1f1'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
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
});

export default ChatScreen;
