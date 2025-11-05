import React, { useEffect } from 'react';
import {
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import styles from './styles/UserSearchModalStyles';

/**
 * SkeletonUserItem - Loading skeleton for user items
 */
const SkeletonUserItem = ({ index = 0 }) => (
  <View style={[
    styles.modalUserItem,
    index !== 4 && styles.modalUserItemBorder
  ]}>
    <View style={styles.modalSkeletonAvatar} />
    <View style={styles.modalUserInfo}>
      <View style={[styles.modalSkeletonName, { width: 120 + (index % 3) * 30 }]} />
      <View style={[styles.modalSkeletonEmail, { width: 80 + (index % 4) * 20 }]} />
    </View>
  </View>
);

/**
 * UserSearchModal - Modal for searching and selecting users
 */
const UserSearchModal = ({
  visible,
  onClose,
  searchText,
  onSearchTextChange,
  users,
  loading,
  onSelectUser,
}) => {
  // Fetch users when modal opens or search text changes
  useEffect(() => {
    if (visible) {
      // This will be handled by the controller's useEffect
    }
  }, [visible, searchText]);

  const getInitials = (user) => {
    const first = user.firstName?.[0] || '';
    const last = user.lastName?.[0] || '';
    const username = user.username?.[0] || '';
    return (first + last || username || 'U').toUpperCase();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Select Receiver</Text>
            <Pressable
              onPress={onClose}
              style={styles.modalCloseButton}>
              <Text style={styles.modalCloseText}>✕</Text>
            </Pressable>
          </View>

          {/* Search Box */}
          <View style={styles.modalSearchBox}>
            <Text style={styles.modalSearchIcon}>🔍</Text>
            <TextInput
              placeholder="Search username"
              placeholderTextColor="#647276"
              style={styles.modalSearchInput}
              value={searchText}
              onChangeText={onSearchTextChange}
              autoFocus={true}
            />
          </View>

          {/* User List */}
          {loading ? (
            <ScrollView style={styles.modalUserList}>
              {Array.from({ length: 5 }).map((_, idx) => (
                <SkeletonUserItem key={idx} index={idx} />
              ))}
            </ScrollView>
          ) : users.length > 0 ? (
            <ScrollView style={styles.modalUserList}>
              {users.map((user, index) => (
                <TouchableOpacity
                  key={user.id || index}
                  onPress={() => onSelectUser(user)}
                  style={[
                    styles.modalUserItem,
                    index !== users.length - 1 && styles.modalUserItemBorder,
                  ]}>
                  <View style={styles.modalUserAvatar}>
                    {user.profileImage ? (
                      <Image
                        source={{ uri: user.profileImage }}
                        style={styles.modalAvatarImage}
                      />
                    ) : (
                      <View style={styles.modalAvatarPlaceholder}>
                        <Text style={styles.modalAvatarText}>
                          {getInitials(user)}
                        </Text>
                      </View>
                    )}
                  </View>
                  <View style={styles.modalUserInfo}>
                    <Text style={styles.modalUserName}>
                      {user.username ? `@${user.username}` : user.email}
                    </Text>
                    {(user.firstName || user.lastName) && (
                      <Text style={styles.modalUserFullName}>
                        {`${user.firstName || ''} ${user.lastName || ''}`.trim()}
                      </Text>
                    )}
                  </View>
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.modalEmptyContainer}>
              <Text style={styles.modalEmptyText}>
                {searchText.trim()
                  ? `No users found for "${searchText}"`
                  : 'No users found'}
              </Text>
            </View>
          )}
        </View>
      </View>
    </Modal>
  );
};

export default UserSearchModal;

