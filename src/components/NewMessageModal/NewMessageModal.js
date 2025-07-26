import React from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import Close from '../../assets/iconchat/close';
import Search from '../../assets/iconchat/search.svg';

const users = [
  { id: 1, name: 'Jane Smith', avatarUrl: 'https://randomuser.me/api/portraits/women/1.jpg', uid: '1VVqQit6TSR4sBAqCpIKO05VYCB3' },
  { id: 2, name: 'Ahmad Bading', avatarUrl: 'https://randomuser.me/api/portraits/women/2.jpg', uid: '4DKf9W6njbUjywJ7knOroIVSC3A3' },
  { id: 3, name: 'Robert Baldoza', avatarUrl: 'https://randomuser.me/api/portraits/men/3.jpg', uid: 'IxsO07FVxxYE5pw944YTEkBt0666' },
  { id: 4, name: 'John Doe', avatarUrl: 'https://randomuser.me/api/portraits/men/4.jpg', uid: 'IxsO07FVxxYE5pw944YTEkBt0777' },
  { id: 5, name: 'Alyssa Navarro', avatarUrl: 'https://randomuser.me/api/portraits/women/5.jpg', uid: 'IxsO07FVxxYE5pw944YTEkBt0888' },
];

const NewMessageModal = ({ visible, onClose, onSelect }) => {
  return (
    <Modal visible={visible} animationType="slide" transparent>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>People</Text>
            <Pressable onPress={onClose}>
              <Close style={styles.closeIcon} />
            </Pressable>
          </View>

          {/* Search Field */}
          <View style={styles.searchBox}>
            <Search style={styles.searchIcon} />
            <TextInput
              placeholder="Search"
              placeholderTextColor="#647276"
              style={styles.searchInput}
            />
          </View>

          {/* List */}
          <ScrollView contentContainerStyle={styles.userList}>
            {users.map((user, index) => ( 
              <TouchableOpacity onPress={() => onSelect(user)} key={user.id} style={[
                  styles.userItem,
                  index !== users.length - 1 && styles.userItemBorder
                ]}>
                <Image source={{ uri: user.avatarUrl }} style={styles.avatar} />
                <Text style={styles.userName}>{user.name}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
}

export default NewMessageModal;

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    paddingHorizontal: 24,
    maxHeight: 600,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  closeIcon: {
    width: 24,
    height: 24,
    tintColor: '#7F8D91',
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  searchIcon: {
    width: 20,
    height: 20,
    marginRight: 12,
    tintColor: '#7F8D91',
  },
  searchInput: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  userList: {
    paddingVertical: 8,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    gap: 8,
  },
  userItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EA',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 100,
    borderWidth: 1,
    borderColor: '#539461',
    marginRight: 12,
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
  },
});

