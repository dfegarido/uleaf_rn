import { arrayRemove, collection, doc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import moment from 'moment';
import React, { useEffect, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../../firebase';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';

const MessagesScreen = ({navigation}) => {

  const user = {
    uid: "QBcGsu0HQYXN5cOowBblxIp8Lqw1",
    email: "ryanquin.02@gmail.com"
  };

  const [messages, setMessages] = useState([]);

  useEffect(() => {
    if (!user) return;

    const q = query(
      collection(db, 'chats'),
      where('participants', 'array-contains', user.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      setMessages(chats);
    });

    return unsubscribe;
  }, [user]);


  const markChatAsRead = (item) => {
    updateDoc(doc(db, 'chats', item.id), {
      unreadBy: arrayRemove(user.uid),
    });
    
    navigation.navigate('ChatScreen', item);
  }

  const renderItem = ({ item }) => (
    <TouchableOpacity
      style={styles.chatItem}
      onPress={() => markChatAsRead(item)}
    >
      <Image source={{ uri: item.avatarUrl }} style={styles.avatar} />
      <View style={styles.chatContent}>
        <View style={styles.chatHeader}>
          <View style={styles.chatSubHeader}>
            <Text style={styles.chatName}>{item.name}</Text>
            <Text style={[item.unreadBy.includes(user.uid) ? styles.unreadChatTime : styles.chatTime]}>{moment(item.timestamp.toDate()).fromNow()}</Text>
          </View>
          <View style={styles.timeContainer}>
            {item.unreadBy.includes(user.uid) && <View style={styles.unreadDot} />}
          </View>
        </View>
        <Text numberOfLines={1} style={[item.unreadBy.includes(user.uid) ? styles.unreadChatMessage : styles.chatMessage]}>
          {item.lastMessage}
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackSolidIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#F3F3F5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 20,
    paddingHorizontal: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginLeft: 16,
    color: '#000000',
    paddingLeft: 100,
  },
  listContainer: {
    padding: 12,
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
});


export default MessagesScreen;
