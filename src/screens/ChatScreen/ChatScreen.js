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
  const { avatarUrl, name, id, participantIds, participants } = route.params;
  const {userInfo} = useContext(AuthContext);
  const flatListRef = useRef(null);
  const otherUserInfo = participants.filter(i => i.uid !== userInfo.uid)[0];

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'messages'), 
    where('chatId', '==', id),
    orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, snapshot => {
      const messagesFirestore = snapshot.docs.map(doc => ({
        id: doc.id,
        chatId: id,
        ...doc.data(),
      }));
      
      setMessages(messagesFirestore);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (flatListRef?.current && messages.length > 0) {
      flatListRef?.current.scrollToEnd({ animated: false });
    }
  }, []);

  const sendMessage = async newMessage => {
    const messageData = {
      text: newMessage,
      senderId: userInfo.uid,
      senderName: `${userInfo.firstName} ${userInfo.lastName}`,
      timestamp: Timestamp.now(),
      chatId: id,
    };

    await addDoc(collection(db, 'messages'), messageData);
    await updateDoc(doc(db, 'chats', id), {
        lastMessage: messageData.text,
        timestamp: messageData.timestamp,
        unreadBy: arrayUnion(...participantIds.filter(uid => uid !== userInfo.uid)),
    });
        
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

        </View>
        <Image source={{ uri: avatarUrl || otherUserInfo.avatarUrl }} style={styles.avatar} />
        <View style={{marginLeft: 10}}>
          <Text style={styles.title}>{name || otherUserInfo.name}</Text>
          <Text style={styles.subtitle}>Active 11m ago</Text>
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
  backButton: {marginRight: 12},
  options: {
    width: 40,
    height: 40,
    marginLeft: 140
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
