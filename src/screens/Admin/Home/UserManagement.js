import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, Animated, ScrollView } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import SearchIcon from '../../../assets/iconnav/search.svg';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import PlusIcon from '../../../assets/admin-icons/plus.svg';
import EditIcon from '../../../assets/admin-icons/edit.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import CheckedBoxIcon from '../../../assets/admin-icons/checked-box.svg';
import EnrollAdmin from '../LeafTrail/EnrollAdmin';
const LeafTrailHeader = ({ onPressAdd = () => {}, onSearchChange = () => {}, onPressRole = () => {} }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <BackIcon width={24} height={24} />
        </TouchableOpacity>

        <View style={styles.searchContainer}>
          <SearchIcon width={19} height={19} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search name, username..."
            placeholderTextColor="#8F9AA3"
            returnKeyType="search"
            onChangeText={onSearchChange}
          />
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.navigate('EnrollAdmin')}
          style={{ marginLeft: 8 }}
        >
          <PlusIcon width={40} height={40} />
        </TouchableOpacity>
      </View>

      <TouchableOpacity activeOpacity={0.5} style={styles.roleChip} onPress={onPressRole}>
        <Text style={styles.roleTextDropdown}>User Role</Text>
        <DownIcon width={16} height={16} />
      </TouchableOpacity>
    </View>
  );
};

const RoleModal = ({ visible, roles, onToggle, onReset, onClose, onView }) => {
  const slideAnim = useRef(new Animated.Value(300)).current;

  useEffect(() => {
    if (visible) {
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      slideAnim.setValue(300);
    }
  }, [visible, slideAnim]);

  const handleClose = () => {
    Animated.timing(slideAnim, {
      toValue: 300,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onClose();
    });
  };

  return (
    <Modal visible={visible} transparent animationType="none" onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <Animated.View 
          style={[
            styles.sheet,
            {
              transform: [{ translateY: slideAnim }]
            }
          ]}
        >
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>User Roles</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton} accessibilityRole="button">
              <Text style={{ fontSize: 22, color: '#8F9AA3' }}>✕</Text>
            </TouchableOpacity>
          </View>

          {roles.map(role => (
            <TouchableOpacity key={role.key} style={styles.roleRow} onPress={() => onToggle(role.key)}>
              <Text style={styles.roleRowText}>{role.label}</Text>
              <View style={[styles.checkBadge, role.selected ? styles.checkBadgeOn : styles.checkBadgeOff]}>
                {role.selected ?<CheckedBoxIcon width={32} height={32} /> : null}
              </View>
            </TouchableOpacity>
          ))}

          <View style={styles.buttonBar}>
            <TouchableOpacity style={styles.resetButton} onPress={onReset} activeOpacity={0.9}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewButton} onPress={onView} activeOpacity={0.9}>
              <Text style={styles.viewText}>View</Text>
            </TouchableOpacity>
          </View>
        </Animated.View>
      </View>
    </Modal>
  );
};

const UserCard = ({ user, onEdit }) => {
  const getStatusColor = (status) => {
    return status === 'Active' ? '#23C16B' : '#E7522F';
  };

  const getProfileColor = (index) => {
    const colors = ['#E3F2FD', '#FFF3E0', '#E8F5E8', '#FFF9C4', '#F3E5F5', '#FFE0B2', '#E0F2F1'];
    return colors[index % colors.length];
  };

  return (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={[styles.profilePicture, { backgroundColor: getProfileColor(user.id) }]}>
          <Text style={styles.profileInitial}>{user.name.charAt(0)}</Text>
        </View>
        
        <View style={styles.userDetails}>
          <View style={styles.nameRow}>
            <Text style={styles.userName}>{user.name}</Text>
            <Text style={styles.username}>@{user.username}</Text>
          </View>
          
          {user.isVip && (
            <View style={styles.vipBadge}>
              <Text style={styles.vipText}>VIP</Text>
            </View>
          )}
          
          <View style={styles.statusRow}>
            <View style={[styles.statusDot, { backgroundColor: getStatusColor(user.status) }]} />
            <Text style={[styles.statusText, { color: getStatusColor(user.status) }]}>
              {user.status}
            </Text>
            <Text style={styles.bulletPoint}> • </Text>
            <Text style={styles.roleText}>{user.role}</Text>
          </View>
        </View>
      </View>
      
      <TouchableOpacity onPress={() => onEdit(user)} style={styles.editButton}>
        <EditIcon width={20} height={20} />
      </TouchableOpacity>
    </View>
  );
};

const UserManagement = () => {
  const navigation = useNavigation();
  const [isRoleModalVisible, setRoleModalVisible] = useState(false);
  const [roles, setRoles] = useState([
    { key: 'seller', label: 'Seller', selected: true },
    { key: 'buyer', label: 'Buyer', selected: true },
  ]);

  const [users] = useState([
    { id: 1, name: 'Alyssa Navarro', username: 'alyssa', status: 'Deactivated', role: 'Seller' },
    { id: 2, name: 'Mari Ann Hernandez', username: 'markv', status: 'Active', role: 'Buyer' },
    { id: 3, name: 'Mark Vicente', username: 'markv', status: 'Active', role: 'Seller'},
    { id: 4, name: 'John Doe', username: 'johndoe', status: 'Active', role: 'Greenhouse Manager'},
    { id: 5, name: 'Bon Inductivo', username: 'boninductivo', status: 'Deactivated', role: 'Encoder'},
    { id: 6, name: 'Cherry Cascante', username: 'cherry', status: 'Active', role: 'Super Admin' },
    { id: 7, name: 'Robert Baldoza', username: 'robert', status: 'Active', role: 'Seller' },
    { id: 8, name: 'Erman Faminiano', username: 'erman', status: 'Active', role: 'Buyer'},
    {id: 9, name: 'Darwin Fegarido', username: 'darwin', status: 'Active', role: 'Super Admin'},
  ]);

  const handleEditUser = (user) => {
    navigation.navigate('UserInformation', { user });
  };

  const toggleRole = roleKey => {
    setRoles(prev => prev.map(r => (r.key === roleKey ? { ...r, selected: !r.selected } : r)));
  };

  const resetRoles = () => {
    setRoles(prev => prev.map(r => ({ ...r, selected: false })));
  };

  const applyView = () => {

    setRoleModalVisible(false);
  };


  return (
    <View style={{ flex: 1, backgroundColor: '#F5F6F6' }}>
      <LeafTrailHeader onPressRole={() => setRoleModalVisible(true)} />

    

      <ScrollView 
        style={styles.usersList}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.usersListContent}
      >
        {users.map(user => (
          <UserCard key={user.id} user={user} onEdit={handleEditUser} />
        ))}
      </ScrollView>

      <RoleModal
        visible={isRoleModalVisible}
        roles={roles}
        onToggle={toggleRole}
        onReset={resetRoles}
        onView={applyView}
        onClose={() => setRoleModalVisible(false)}
      />
    </View>
  );
};

export default UserManagement;

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'column',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#fff',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
    marginRight: 8,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    height: 40,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#D8DEE4',
    borderRadius: 20,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    paddingVertical: 0,
    color: '#202325',
    fontSize: 16,
  },
  roleChip: {
    alignSelf: 'flex-start',
    marginTop: 8,
    height: 36,
    borderRadius: 18,
    paddingHorizontal: 14,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#393D40',
    flexDirection: 'row',
    alignItems: 'center',
    color: '#393D40',
    gap: 6,
  },

  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sheetHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  sheetTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: '#202325',
  },
  closeButton: {
    padding: 6,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
  },
  roleRowText: {
    fontSize: 18,
    color: '#202325',
  },
  checkBadge: {
    width: 32,
    height: 32,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkBadgeOn: {
    backgroundColor: '#699E73',
  },
  checkBadgeOff: {
    backgroundColor: '#EAF2EC',
  },
  checkMark: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  buttonBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    gap: 12,
  },
  resetButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#EFF6F0',
  },
  resetText: {
    color: '#4D8B5A',
    fontSize: 18,
    fontWeight: '600',
  },
  viewButton: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#4D8B5A',
  },
  viewText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: '700',
  },
  // User card styles
  usersList: {
    flex: 1,
  },
  usersListContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 20,
  },
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePicture: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  profileInitial: {
    fontSize: 22,
    fontWeight: '700',
    color: '#202325',
  },
  userDetails: {
    flex: 1,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    marginRight: 8,
  },
  username: {
    fontSize: 16,
    color: '#8F9AA3',
    fontWeight: '400',
  },
  vipBadge: {
    backgroundColor: '#FFD700',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 8,
    alignSelf: 'flex-start',
    marginBottom: 4,
  },
  vipText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#202325',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6, 
    marginRight: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '500',
  },
  bulletPoint: {
    fontSize: 19,
    color: '#8F9AA3',
    marginHorizontal: 4,
  },
  roleText: {
    fontSize: 14,
    color: '#8F9AA3',
  },

    roleTextDropdown: {
    fontSize: 14,
    color: '#000',
  },
  editButton: {
    padding: 8,
    alignSelf: 'flex-start',
    marginLeft: 'auto',
  },

});