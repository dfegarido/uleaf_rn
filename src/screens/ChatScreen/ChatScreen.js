import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc
} from 'firebase/firestore';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../../firebase';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import ChatBubble from '../../components/ChatBubble/ChatBubble';
import DateSeparator from '../../components/DateSeparator/DateSeparator';
import MessageInput from '../../components/MessageInput/MessageInput';

const ChatScreen = ({navigation, route}) => {

  const { avatarUrl, name, id, participants } = route.params;
  const user = {
    uid: "QBcGsu0HQYXN5cOowBblxIp8Lqw1",
    email: "ryanquin.02@gmail.com",
    name: "Ryan"
  };

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'messages'), orderBy('timestamp', 'asc'));
    const unsubscribe = onSnapshot(q, snapshot => {
      const messagesFirestore = snapshot.docs.map(doc => ({
        chatId: id,
        ...doc.data(),
      }));
      console.log('zxcvz', messagesFirestore);
      
      setMessages(messagesFirestore);
    });

    return () => unsubscribe();
  }, []);

  const sendMessage = async newMessage => {
    const messageData = {
      text: newMessage,
      senderId: user.uid,
      senderName: user.name,
      timestamp: Timestamp.now(),
      chatId: id,
    };

    await addDoc(collection(db, 'messages'), messageData);
    await updateDoc(doc(db, 'chats', id), {
        lastMessage: messageData.text,
        timestamp: messageData.timestamp,
        unreadBy: arrayUnion(...participants.filter(uid => uid !== user.uid)),
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
        {/* <AvatarIcon size={32} /> */}
        <Image source={avatarUrl ? { uri: avatarUrl } : require('../../assets/images/AvatarBig.png')} style={styles.avatar} />
        <View style={{marginLeft: 10}}>
          <Text style={styles.title}>{name}</Text>
          <Text style={styles.subtitle}>Active 11m ago</Text>
        </View>
      </View>

      {/* Chat Messages */}
      <FlatList
        data={messages}
        keyExtractor={item => item.id}
        renderItem={({item, index}) => {
          if (item.type === 'date') {
            return <DateSeparator text={item.text} />;
          }

          const nextMsg = messages[index + 1];
          const isMe = item?.senderId === user.uid;
          const nextMsgIsMe = nextMsg?.senderId === user.uid;
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
  title: {fontSize: 18, fontWeight: 'bold', color: '#000'},
  subtitle: {fontSize: 12, color: '#666', marginTop: 2},
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 24,
  },
});

export default ChatScreen;
