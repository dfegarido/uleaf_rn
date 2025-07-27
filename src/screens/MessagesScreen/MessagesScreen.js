import { addDoc, arrayRemove, collection, doc, getDoc, onSnapshot, orderBy, query, updateDoc, where } from 'firebase/firestore';
import moment from 'moment';
import React, { useContext, useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, Image, Modal, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { db } from '../../../firebase';
import CreateChat from '../../assets/iconchat/new-chat.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import { AuthContext } from '../../auth/AuthProvider';
import NewMessageModal from '../../components/NewMessageModal/NewMessageModal';

const MessagesScreen = ({navigation}) => {

  const {userInfo} = useContext(AuthContext);
  const userFullName = `${userInfo.firstName} ${userInfo.lastName}`;

  const [messages, setMessages] = useState([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    if (!userInfo) return;

    const q = query(
      collection(db, 'chats'),
      where('participantIds', 'array-contains', userInfo.uid),
      orderBy('timestamp', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const chats = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      
      setMessages(chats);
    });
    setLoading(false);
    return unsubscribe;
  }, [userInfo]);


  const markChatAsRead = (item) => {
    updateDoc(doc(db, 'chats', item.id), {
      unreadBy: arrayRemove(userInfo.uid),
    });
    
    navigation.navigate('ChatScreen', item);
  }

  const createChat = async user => {
    setLoading(true);
    setModalVisible(false);
    let chatData = {
      participants: [
        { uid: userInfo.uid, avatarUrl: userInfo.profilePhotoUrl, name: userFullName },
        { uid: user.uid, avatarUrl: user.avatarUrl, name: user.name }
      ],
      participantIds: [userInfo.uid, user.uid],
      lastMessage: '',
      timestamp: new Date(),
      unreadBy: [user.uid],
      avatarUrl: '',
      name: '',
      type: 'private',
    }
    const addChat = await addDoc(collection(db, 'chats'), chatData);

    const docRef = doc(db, 'chats', addChat.id);
    const docSnap = await getDoc(docRef);
    chatData = {};
    if (docSnap.exists()) {
      chatData = { id: docSnap.id, ...docSnap.data() };
      setLoading(false);
      navigation.navigate('ChatScreen', chatData);
    }
  }

  const renderItem = ({ item }) => {
    const otherUserInfo = item.participants.filter(i => i.uid !== userInfo.uid)[0];
    return (
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => markChatAsRead(item)}
      >
        <Image source={{ 
          uri: (item.avatarUrl || otherUserInfo.avatarUrl) }} style={styles.avatar} />
        <View style={styles.chatContent}>
          <View style={styles.chatHeader}>
            <View style={styles.chatSubHeader}>
              <Text style={styles.chatName}>{item.name || otherUserInfo.name}</Text>
              <Text style={[item.unreadBy.includes(userInfo.uid) ? styles.unreadChatTime : styles.chatTime]}>{moment(item.timestamp.toDate()).fromNow()}</Text>
            </View>
            <View style={styles.timeContainer}>
              {item.unreadBy.includes(userInfo.uid) && <View style={styles.unreadDot} />}
            </View>
          </View>
          <Text numberOfLines={1} style={[item.unreadBy.includes(userInfo.uid) ? styles.unreadChatMessage : styles.chatMessage]}>
            {item.lastMessage}
          </Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      {loading && (
              <Modal transparent animationType="fade">
                <View style={styles.loadingOverlay}>
                  <ActivityIndicator size="large" color="#699E73" />
                </View>
              </Modal>
      )}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackSolidIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Messages</Text>
        <TouchableOpacity style={styles.createChat} onPress={() => setModalVisible(true)}>
          <CreateChat />
        </TouchableOpacity>
      </View>

      <FlatList
        data={messages}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        contentContainerStyle={styles.listContainer}
      />

      <NewMessageModal
        visible={modalVisible}
        onClose={() => setModalVisible(false)}
        onSelect={(user) => createChat(user)}
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
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default MessagesScreen;
