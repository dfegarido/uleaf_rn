import React, { useState, useEffect, useRef } from 'react';
import { View, Text, TouchableOpacity, TextInput, StyleSheet, Modal, Animated, FlatList, StatusBar, Alert, RefreshControl, ActivityIndicator } from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { getAllUsersApi, updateUserStatusApi } from '../../../components/Api';
import SearchIcon from '../../../assets/iconnav/search.svg';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import PlusIcon from '../../../assets/admin-icons/plus.svg';
import EditIcon from '../../../assets/admin-icons/edit.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import CheckedBoxIcon from '../../../assets/admin-icons/checked-box.svg';
import UserCardSkeleton from './UserCardSkeleton';

const LeafTrailHeader = ({ insets, onPressAdd = () => {}, onSearchChange = () => {}, onPressRole = () => {} }) => {
  const navigation = useNavigation();

  return (
    <View style={[styles.headerContainer, { paddingTop: insets.top + 24 }]}>
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
          <SearchIcon width={20} height={20} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search users..."
            placeholderTextColor="#647276"
            onChangeText={onSearchChange}
          />
        </View>

        <TouchableOpacity style={styles.addButton} onPress={onPressAdd}>
          <PlusIcon />
        </TouchableOpacity>
      </View>

      <TouchableOpacity activeOpacity={0.5} style={styles.roleChip} onPress={onPressRole}>
        <Text style={styles.roleText}>User Roles</Text>
        <DownIcon style={{ marginLeft: 10 }}  width={16} height={16} />
      </TouchableOpacity>
    </View>
  );
};

const RoleModal = ({ visible, roles, onToggle, onReset, onClose, onView }) => {
  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <View style={styles.modalContent}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Filter by role</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Text style={styles.closeButtonText}>×</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.roleOptions}>
            {roles.map(role => (
              <TouchableOpacity 
                key={role.key} 
                style={styles.roleOption}
                onPress={() => onToggle(role.key)}
              >
                <View style={[styles.checkbox, role.selected && styles.checkedBox]}>
                  {role.selected && <CheckedBoxIcon width={20} height={20} />}
                </View>
                <Text style={styles.roleOptionText}>{role.label}</Text>
              </TouchableOpacity>
            ))}
          </View>
          
          <View style={styles.modalActions}>
            <TouchableOpacity style={styles.resetButton} onPress={onReset} activeOpacity={0.9}>
              <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewButton} onPress={onView} activeOpacity={0.9}>
              <Text style={styles.viewButtonText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const UserCard = ({ user, onEdit, onStatusUpdate }) => {
  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'active': return '#539461';
      case 'suspended': return '#FBA94C';
      case 'pending': return '#4094F7';
      case 'deactivated':
      case 'inactive': return '#F75555';
      default: return '#7F8D91';
    }
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
            <Text style={styles.username} numberOfLines={1} ellipsizeMode="tail">@{user.username}</Text>
          </View>
          
          {user.isVip && (
            <View style={styles.vipBadge}>
              <Text style={styles.vipText}>VIP</Text>
            </View>
          )}
          
          <View style={styles.statusContainer}>
            <View style={styles.statusRow}>
              <View style={[styles.statusDot, { backgroundColor: getStatusColor(user.status) }]} />
              <Text style={[styles.statusText, { color: getStatusColor(user.status) }]}>
                {user.status}
              </Text>
              <Text style={styles.bulletPoint}> • </Text>
              <Text style={styles.roleText}>{user.role}</Text>
            </View>
          </View>
          
          {user.stats && (
            <View style={styles.statsRow}>
              {user.role === 'Buyer' && (
                <>
                  <Text style={styles.statsText}>Orders: {user.stats.totalOrders || 0}</Text>
                  <Text style={styles.bulletPoint}> • </Text>
                  <Text style={styles.statsText}>Spent: ₱{user.stats.totalSpent?.toFixed(2) || '0.00'}</Text>
                </>
              )}
              {user.role === 'Supplier' && (
                <>
                  <Text style={styles.statsText}>Listings: {user.stats.totalListings || 0}</Text>
                  <Text style={styles.bulletPoint}> • </Text>
                  <Text style={styles.statsText}>Active: {user.stats.activePlants || 0}</Text>
                </>
              )}
            </View>
          )}
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
  const insets = useSafeAreaInsets();
  const [isRoleModalVisible, setRoleModalVisible] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [roles, setRoles] = useState([
    { key: 'buyer', label: 'Buyer', selected: true },
    { key: 'supplier', label: 'Supplier', selected: true },
  ]);

  // Calculate proper bottom padding for admin tab bar + safe area
  const tabBarHeight = 60; // Standard admin tab bar height
  const safeBottomPadding = Math.max(insets.bottom, 16); // At least 16px padding
  const totalBottomPadding = tabBarHeight + safeBottomPadding + 20; // Extra 20px for spacing
  console.log("User management screen");
  
  // Fetch users from API
  const fetchUsers = async (showLoading = true, page = 1, append = false) => {
    try {
      // Don't set loading state for append operations
      if (showLoading && !append) {
        setLoading(true);
      } else if (append) {
        setLoadingMore(true);
      }

      // Get selected roles for filtering
      const selectedRoles = roles.filter(role => role.selected).map(role => role.key);
      
      // Prepare filters
      const filters = {
        page: page,
        limit: 20, // Limit to 20 users per page for pagination
        search: searchQuery.trim(),
      };

      // If not all roles are selected, add role filter
      if (selectedRoles.length > 0 && selectedRoles.length < roles.length) {
        // Since API accepts single role, we'll fetch all and filter locally
        // For now, fetch all and filter locally
        filters.role = undefined;
      }
      console.log({ filters, page, append });

      // Add a small delay to simulate network latency for initial loading only
      if (showLoading && !append) {
        await new Promise(resolve => setTimeout(resolve, 1500));
      }

      const response = await getAllUsersApi(filters);
      
      if (response && response.success && response.data && response.data.users) {
        let fetchedUsers = response.data.users;
        
        // Apply role filtering locally if needed
        if (selectedRoles.length > 0 && selectedRoles.length < roles.length) {
          fetchedUsers = fetchedUsers.filter(user => selectedRoles.includes(user.role));
        }
        
        // Transform user data to match expected format
        const transformedUsers = fetchedUsers.map(user => ({
          id: user.id,
          name: user.fullName || `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'N/A',
          username: user.username || user.email?.split('@')[0] || 'N/A',
          email: user.email,
          status: user.status === 'active' ? 'Active' : 
                  user.status === 'suspended' ? 'Suspended' : 
                  user.status === 'pending' ? 'Pending' : 'Inactive',
          role: user.role === 'buyer' ? 'Buyer' : 
                user.role === 'supplier' ? 'Supplier' : 
                user.role || 'User',
          rawStatus: user.status, // Keep original status for API calls
          stats: user.stats,
          ...user // Include all other user data
        }));
        
        // Check if we have more data to load
        setHasMoreData(fetchedUsers.length === filters.limit);
        
        // Update the users state - either append or replace
        if (append) {
          setUsers(prev => [...prev, ...transformedUsers]);
          // Update current page only on successful append
          setCurrentPage(page);
        } else {
          setUsers(transformedUsers);
        }
      } else {
        console.log('No users data received:', response);
        if (!append) {
          setUsers([]);
        }
        setHasMoreData(false);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again.');
      if (!append) {
        setUsers([]);
      }
      setHasMoreData(false);
    } finally {
      // Make sure to clear the appropriate loading state
      if (showLoading && !append) {
        setLoading(false);
      }
      
      if (append) {
        setLoadingMore(false);
      }
      
      if (refreshing) {
        setRefreshing(false);
      }
    }
  };

  // Handle search input change
  const handleSearchChange = (text) => {
    setSearchQuery(text);
  };

  // Debounced search effect
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery !== undefined) {
        // Reset to first page when search changes
        setCurrentPage(1);
        setHasMoreData(true);
        fetchUsers(true, 1, false);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  // Fetch users when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      setCurrentPage(1);
      setHasMoreData(true);
      fetchUsers(true, 1, false);
    }, [])
  );

  // Fetch users when role filters change
  useEffect(() => {
    // Only trigger this if we're not already loading and the component has mounted
    if (!loading && roles.some(role => role.selected)) {
      setCurrentPage(1);
      setHasMoreData(true);
      fetchUsers(true, 1, false);
    }
  }, [JSON.stringify(roles.map(r => r.selected))]); // Only re-run when role selection changes

  // Handle refresh
  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMoreData(true);
    await fetchUsers(true, 1, false); // Use true to show skeleton loaders during refresh
    setRefreshing(false);
  };

  const handleEditUser = (user) => {
    // Ensure user status is properly formatted for the UserInformation screen
    const formattedUser = {
      ...user,
      // Keep the original status case for display but ensure it's correctly recognized
      status: user.status
    };
    navigation.navigate('UserInformation', { user: formattedUser });
  };

  // Handle user status update
  const handleUpdateUserStatus = async (user, newStatus) => {
    try {
      console.log(`Updating user ${user.id} status to ${newStatus}`);
      
      // Convert the display status to the API format
      const statusMap = {
        'Active': 'active',
        'Suspended': 'suspended', 
        'Pending': 'pending',
        'Inactive': 'inactive'
      };
      
      const apiStatus = statusMap[newStatus] || newStatus.toLowerCase();

      const updateData = {
        userId: user.id,
        status: apiStatus,
        notes: `Status updated to ${newStatus} by admin`
      };

      const response = await updateUserStatusApi(updateData);

      if (response && response.success) {
        Alert.alert('Success', `User status updated to ${newStatus}`);
        // Refresh user list
        await fetchUsers(true, 1, false);
      } else {
        throw new Error(response?.message || 'Failed to update user status');
      }
    } catch (error) {
      console.error('Error updating user status:', error);
      Alert.alert('Error', 'Failed to update user status. Please try again.');
    }
  };

  // Legacy function that delegates to the new one for compatibility
  const handleStatusUpdate = async (user, newStatus) => {
    return handleUpdateUserStatus(user, newStatus);
  };

  const toggleRole = roleKey => {
    setRoles(prev => prev.map(r => (r.key === roleKey ? { ...r, selected: !r.selected } : r)));
  };

  const resetRoles = () => {
    setRoles(prev => prev.map(r => ({ ...r, selected: false })));
  };

  const applyView = () => {
    setRoleModalVisible(false);
    setCurrentPage(1);
    setHasMoreData(true);
    // fetchUsers will be called automatically due to roles dependency
  };

  // Function to handle loading more data when reaching end of list
  const handleLoadMore = () => {
    if (!loadingMore && hasMoreData && !refreshing && !loading) {
      console.log('Loading more users, page:', currentPage + 1);
      // Pass false for showLoading to avoid displaying skeleton loaders again
      fetchUsers(false, currentPage + 1, true);
    }
  };

  // Function to reset search and filters
  const handleResetSearch = () => {
    setSearchQuery('');
    setCurrentPage(1);
    setHasMoreData(true);
    fetchUsers(true, 1, false);
  };

  // Filter users based on current search (additional client-side filtering)
  const filteredUsers = users.filter(user => {
    if (!searchQuery.trim()) return true;
    const query = searchQuery.toLowerCase();
    return (
      user.name.toLowerCase().includes(query) ||
      user.username.toLowerCase().includes(query) ||
      user.email?.toLowerCase().includes(query) ||
      user.role.toLowerCase().includes(query)
    );
  });

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right']}>
        <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
        <LeafTrailHeader 
          insets={insets} 
          onPressRole={() => setRoleModalVisible(true)}
          onSearchChange={handleSearchChange}
        />
        <FlatList 
          style={styles.usersList}
          data={Array(8).fill()}
          renderItem={({index}) => <UserCardSkeleton key={index} />}
          keyExtractor={(_, index) => index.toString()}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={[
            styles.usersListContent,
            { paddingBottom: totalBottomPadding }
          ]}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <LeafTrailHeader 
        insets={insets} 
        onPressRole={() => setRoleModalVisible(true)}
        onSearchChange={handleSearchChange}
      />

      <FlatList 
        style={styles.usersList}
        data={filteredUsers}
        renderItem={({ item }) => (
          <UserCard 
            key={item.id} 
            user={item} 
            onEdit={handleEditUser}
            onStatusUpdate={handleUpdateUserStatus}
          />
        )}
        keyExtractor={item => item.id.toString()}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        contentContainerStyle={[
          styles.usersListContent,
          { paddingBottom: totalBottomPadding }
        ]}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        ListEmptyComponent={
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>
              {searchQuery ? 'No users found matching your search.' : 'No users available.'}
            </Text>
          </View>
        }
        ListFooterComponent={
          loadingMore ? (
            <View style={styles.loadingMoreContainer}>
              <ActivityIndicator size="small" color="#539461" />
              <Text style={styles.loadingMoreText}>Loading more users...</Text>
            </View>
          ) : null
        }
      />

      <RoleModal
        visible={isRoleModalVisible}
        roles={roles}
        onToggle={toggleRole}
        onReset={resetRoles}
        onView={applyView}
        onClose={() => setRoleModalVisible(false)}
      />
    </SafeAreaView>
  );
};

export default UserManagement;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 106,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingBottom: 12,
    gap: 10,
    height: 58,
  },
  backButton: {
    width: 24,
    height: 24,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    gap: 8,
    height: 40,
    minHeight: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  addButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
  },
  roleChip: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 5,
    width: 120,
    height: 34,
    minHeight: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  roleText: {
    fontSize: 16,
    lineHeight: 16,
    color: '#393D40',
    marginRight: 10,
  },
  usersList: {
    flex: 1,
    backgroundColor: '#F5F6F6',
  },
  usersListContent: {
    padding: 16,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 20,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 24,
    color: '#202325',
  },
  closeButton: {
    padding: 4,
  },
  closeButtonText: {
    fontSize: 24,
    color: '#647276',
  },
  roleOptions: {
    marginBottom: 20,
  },
  roleOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkedBox: {
    borderColor: '#539461',
    backgroundColor: '#539461',
  },
  roleOptionText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 12,
  },
  resetButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    height: 44,
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#647276',
  },
  viewButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#539461',
    borderRadius: 12,
    height: 44,
  },
  viewButtonText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#FFFFFF',
  },
  // User card styles
  userCard: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 12,
    marginBottom: 12,
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    height: 72,
    width: '100%',
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  profilePicture: {
    width: 40,
    height: 40,
    minWidth: 40,
    minHeight: 40,
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#539461',
  },
  profileInitial: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202325',
  },
  userDetails: {
    flex: 1,
    gap: 4,
    paddingRight: 8, // Add padding to avoid overlap with edit button
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    height: 24,
    gap: 4,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: '#202325',
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#7F8D91',
    flexShrink: 1,
    maxWidth: '60%',
  },
  vipBadge: {
    backgroundColor: '#FFB323',
    paddingHorizontal: 6,
    borderRadius: 8,
    alignSelf: 'flex-start',
    height: 20,
    minHeight: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  vipText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
    color: '#A05E03',
  },
  statusContainer: {
    marginTop: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    minHeight: 20,
    gap: 6,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontSize: 14,
    fontWeight: '700',
    lineHeight: 20,
  },
  bulletPoint: {
    fontSize: 14,
    color: '#7F8D91',
    width: 4,
    height: 4,
    maxWidth: 4,
    maxHeight: 4,
    borderRadius: 100,
    backgroundColor: '#7F8D91',
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#647276',
  },
  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statsText: {
    fontSize: 13,
    color: '#647276',
  },
  editButton: {
    width: 24,
    height: 24,
    alignSelf: 'flex-start',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  // Loading styles
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6F6',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#539461',
    lineHeight: 22,
  },
  emptyContainer: {
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreContainer: {
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    marginHorizontal: 16,
    marginVertical: 8,
  },
  loadingMoreText: {
    marginLeft: 8,
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#539461',
  },
  emptyText: {
    fontSize: 16,
    lineHeight: 22,
    color: '#7F8D91',
    textAlign: 'center',
  },
});
