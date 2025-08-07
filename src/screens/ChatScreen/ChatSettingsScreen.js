import {
  deleteDoc,
  doc
} from 'firebase/firestore';
import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { db } from '../../../firebase';
import TrashcanIcon from '../../assets/iconchat/trashcan.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import { AuthContext } from '../../auth/AuthProvider';

const ChatSettingsScreen = ({navigation, route}) => {
  const { participants, chatId } = route.params;
  const {userInfo} = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const otherUserInfo = participants.filter(i => i.uid !== userInfo.uid)[0];

  // Helper function to get safe avatar source
  const getAvatarSource = () => {
    // Check if avatarUrl is a valid string URL
    if (typeof otherUserInfo?.avatarUrl === 'string' && otherUserInfo.avatarUrl.startsWith('http')) {
      return { uri: otherUserInfo.avatarUrl };
    }
    // Fallback to default avatar
    return require('../../assets/images/AvatarBig.png');
  };

  const deleteChat = async () => {
    setLoading(true);
    await deleteDoc(doc(db, 'chats', chatId));
    setLoading(false);
    navigation.navigate('MessagesScreen');
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackSolidIcon size={24} color="#333" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{otherUserInfo?.name || 'Chat Settings'}</Text>
      </View>

      {/* Profile */}
      <View style={styles.profileSection}>
        <Image
          source={getAvatarSource()}
          style={styles.avatar}
        />
        <Text style={styles.username}>@{otherUserInfo?.name || 'Unknown'}</Text>
      </View>

      {/* Divider */}
      <View style={styles.divider} />

      {/* Delete Button */}
      <View style={styles.actionSection}>
        <TouchableOpacity onPress={() => deleteChat()} style={styles.deleteButton}>
          <TrashcanIcon />
          <Text style={styles.deleteText}>Delete Chat</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

export default ChatSettingsScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    height: 106,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    position: 'relative',
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    textAlign: 'center',
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    marginLeft: 100
  },
  profileSection: {
    alignItems: 'center',
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#539461',
    marginBottom: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: '#202325',
  },
  divider: {
    height: 15,
    backgroundColor: '#F5F6F6',
    width: '100%',
    marginTop: 12,
  },
  actionSection: {
    padding: 24,
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 125,
    backgroundColor: '#FFFFFF',
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#393D40',
    marginLeft: 8,
  },
  icon: {
    marginRight: 4,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
