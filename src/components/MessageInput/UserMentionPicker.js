import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Image,
  Dimensions,
} from 'react-native';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DefaultAvatar = require('../../assets/images/AvatarBig.png');

/**
 * UserMentionPicker Component
 * Displays a dropdown list of users to mention when typing @
 * Only shows members of the current group chat
 */
const UserMentionPicker = ({ 
  visible, 
  users, 
  onSelectUser, 
  searchQuery = '',
  currentUserUid 
}) => {
  if (!visible || users.length === 0) {
    return null;
  }

  // Filter users based on search query
  const filteredUsers = users.filter(user => {
    // Don't suggest self
    if (user.uid === currentUserUid) return false;
    
    const query = searchQuery.toLowerCase();
    const name = (user.name || '').toLowerCase();
    const username = (user.username || '').toLowerCase();
    
    return name.includes(query) || username.includes(query);
  });

  // Check if "everyone" matches the search query
  const showEveryone = 'everyone'.includes(searchQuery.toLowerCase()) || searchQuery === '';

  const renderUser = ({ item }) => {
    const avatarSource = item.avatarUrl 
      ? { uri: item.avatarUrl } 
      : DefaultAvatar;

    return (
      <TouchableOpacity
        style={styles.userItem}
        onPress={() => onSelectUser(item)}
        activeOpacity={0.7}
      >
        <Image source={avatarSource} style={styles.avatar} />
        <View style={styles.userInfo}>
          <Text style={styles.userName} numberOfLines={1}>
            {item.name || 'Unknown'}
          </Text>
          {item.username && (
            <Text style={styles.userHandle} numberOfLines={1}>
              @{item.username}
            </Text>
          )}
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.headerText}>
          Mention a member
        </Text>
      </View>
      <FlatList
        data={filteredUsers}
        renderItem={renderUser}
        keyExtractor={(item) => item.uid}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        maxToRenderPerBatch={10}
        initialNumToRender={10}
        ListHeaderComponent={
          showEveryone ? (
            <TouchableOpacity
              style={[styles.userItem, styles.everyoneItem]}
              onPress={() => onSelectUser({ 
                uid: 'everyone', 
                name: 'Everyone', 
                username: 'everyone' 
              })}
              activeOpacity={0.7}
            >
              <View style={[styles.avatar, styles.everyoneAvatar]}>
                <Text style={styles.everyoneIcon}>👥</Text>
              </View>
              <View style={styles.userInfo}>
                <Text style={[styles.userName, styles.everyoneName]}>
                  Everyone
                </Text>
                <Text style={styles.userHandle}>
                  @everyone · Notify all members
                </Text>
              </View>
            </TouchableOpacity>
          ) : null
        }
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    maxHeight: 300,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.15,
    shadowRadius: 8,
    elevation: 10,
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderRightWidth: 1,
    borderColor: '#E5E5E5',
  },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  headerText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#666',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  list: {
    maxHeight: 250,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F5F5F5',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F0F0F0',
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#000',
    marginBottom: 2,
  },
  userHandle: {
    fontSize: 13,
    color: '#666',
  },
  everyoneItem: {
    backgroundColor: '#F0F9FF',
    borderBottomWidth: 2,
    borderBottomColor: '#539461',
  },
  everyoneAvatar: {
    backgroundColor: '#539461',
    justifyContent: 'center',
    alignItems: 'center',
  },
  everyoneIcon: {
    fontSize: 20,
  },
  everyoneName: {
    color: '#539461',
  },
});

export default UserMentionPicker;
