import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Image,
  Alert,
  ScrollView,
  Modal,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import SearchIcon from '../../../assets/iconnav/search.svg';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import EditIcon from '../../../assets/admin-icons/edit.svg';
import PlusIcon from '../../../assets/icons/greylight/plus-regular.svg';
import DownIcon from '../../../assets/icons/greydark/caret-down.svg';
import CloseIcon from '../../../assets/buyer-icons/close.svg';
import CheckIcon from '../../../assets/admin-icons/check.svg';
import { listAdminsApi, getAdminInfoApi } from '../../../components/Api';

const JungleAccessHeader = ({ onSearchChange = () => {}, onPressAdd = () => {}, showAddButton = true }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.statusBar} />
      <View style={styles.headerContent}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <BackIcon width={24} height={24} />
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.searchContainerWrapper} 
          activeOpacity={1}
        >
          <View style={styles.searchContainer}>
            <SearchIcon width={20} height={20} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search users..."
              placeholderTextColor="#647276"
              onChangeText={onSearchChange}
              editable={true}
              pointerEvents="auto"
            />
          </View>
        </TouchableOpacity>

        {showAddButton && (
          <TouchableOpacity style={styles.addButton} onPress={onPressAdd}>
            <PlusIcon />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
};

const UserCard = ({ user, onEdit }) => {
  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return '#23C16B';
      case 'deactivated':
        return '#E7522F';
      default:
        return '#7F8D91';
    }
  };

  const avatarImage = user?.profileImage || user?.avatar;
  const userName = user?.name || 'Unknown User';
  const username = user?.username || '@username';
  const status = user?.status || 'Active';
  const role = user?.role || 'Contributor';

  return (
    <View style={styles.userCardContainer}>
      <View style={styles.userCard}>
        {/* User Avatar */}
        <View style={styles.avatarContainer}>
          {avatarImage ? (
            <Image source={{ uri: avatarImage }} style={styles.avatar} />
          ) : (
            <View style={styles.avatarPlaceholder}>
              <Text style={styles.avatarText}>
                {userName.charAt(0).toUpperCase()}
              </Text>
            </View>
          )}
        </View>

        {/* Content */}
        <View style={styles.userContent}>
          <View style={styles.nameRow}>
            <Text style={styles.userName} numberOfLines={1}>
              {userName}
            </Text>
            <Text style={styles.usernameText} numberOfLines={1}>
              {username}
            </Text>
          </View>
          
          <View style={styles.statusRoleRow}>
            {/* Status */}
            <View style={styles.statusContainer}>
              <View 
                style={[
                  styles.statusDot, 
                  { backgroundColor: getStatusColor(status) }
                ]}
              />
              <Text 
                style={[
                  styles.statusText, 
                  { color: getStatusColor(status) }
                ]}
              >
                {status}
              </Text>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
            </View>

            {/* Role */}
            <View style={styles.roleContainer}>
              <Text style={styles.roleText}>{role}</Text>
            </View>
          </View>
        </View>

        {/* Action */}
        <TouchableOpacity 
          style={styles.editButton}
          onPress={() => onEdit(user)}
          activeOpacity={0.7}
        >
          <EditIcon width={24} height={24} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const JungleAccess = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [hasMoreData, setHasMoreData] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [selectedRole, setSelectedRole] = useState(null); // 'admin', 'sub_admin', or null
  const [selectedStatus, setSelectedStatus] = useState(null); // 'active', 'inactive', or null
  const [showFilterDropdown, setShowFilterDropdown] = useState(false);
  const [currentAdminRole, setCurrentAdminRole] = useState(null); // Track current user's role

  // Load current admin info to check permissions
  useEffect(() => {
    loadCurrentAdminInfo();
  }, []);

  const loadCurrentAdminInfo = async () => {
    try {
      const response = await getAdminInfoApi();
      if (response?.data?.role) {
        setCurrentAdminRole(response.data.role);
      }
    } catch (error) {
      console.error('Error loading admin info:', error);
    }
  };

  useEffect(() => {
    loadUsers();
  }, []);

  // Reload data when screen comes into focus (e.g., after adding a new admin)
  useFocusEffect(
    React.useCallback(() => {
      // Reset and reload data
      setCurrentPage(1);
      setHasMoreData(true);
      loadUsers(false, 1, false);
    }, [])
  );

  // Debounced search effect
  useEffect(() => {
    const delayedSearch = setTimeout(() => {
      if (searchQuery !== undefined) {
        // Reset to first page when search changes
        setCurrentPage(1);
        setHasMoreData(true);
        loadUsers(true, 1, false);
      }
    }, 500);

    return () => clearTimeout(delayedSearch);
  }, [searchQuery]);

  // Filter change effect
  useEffect(() => {
    // Reset to first page when filters change
    setCurrentPage(1);
    setHasMoreData(true);
    loadUsers(true, 1, false);
  }, [selectedRole, selectedStatus]);

  const loadUsers = async (showLoading = true, page = 1, append = false) => {
    try {
      // Don't set loading state for append operations
      if (showLoading && !append) {
        setLoading(true);
      } else if (append) {
        setLoadingMore(true);
      }

      // Prepare filters
      const filters = {
        page: page,
        limit: 10,
      };

      if (searchQuery && searchQuery.trim()) {
        filters.search = searchQuery.trim();
      }

      if (selectedRole) {
        filters.role = selectedRole;
      }

      if (selectedStatus) {
        filters.status = selectedStatus;
      }

      const response = await listAdminsApi(filters);
      
      if (response && response.success && response.data) {
        const fetchedUsers = response.data;
        
        // Transform admin data to match expected format
        const transformedUsers = fetchedUsers.map(admin => ({
          id: admin.adminId || admin.uid,
          name: admin.fullName || `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || 'N/A',
          username: admin.username || admin.email?.split('@')[0] || 'N/A',
          email: admin.email,
          status: admin.status === 'active' ? 'Active' : 'Deactivated',
          role: admin.role === 'admin' ? 'Administrator' : 'Sub Administrator',
          profileImage: admin.profileImage || admin.profilePhotoUrl || null,
          department: admin.department,
          permissions: admin.permissions || [],
          rawStatus: admin.status,
          rawRole: admin.role,
          ...admin // Include all other admin data
        }));
        
        // Check pagination
        const hasMore = response.pagination?.hasNext || false;
        setHasMoreData(hasMore);
        
        // Update the users state - either append or replace
        if (append) {
          setUsers(prev => [...prev, ...transformedUsers]);
          setCurrentPage(page);
        } else {
          setUsers(transformedUsers);
        }
      } else {
        if (!append) {
          setUsers([]);
        }
        setHasMoreData(false);
      }
    } catch (error) {
      console.error('Error loading jungle access users:', error);
      
      // Show user-friendly error
      if (!append) {
        Alert.alert(
          'Unable to Load Admin Users',
          'There was an error loading the admin user list. ' +
          'This might be because:\n\n' +
          '1. The backend needs to be updated to use Firebase Auth\n' +
          '2. You don\'t have permission to view admin users\n' +
          '3. Network connection issue\n\n' +
          'Error: ' + error.message,
          [{ text: 'OK' }]
        );
      }
      
      if (!append) {
        setUsers([]);
      }
      setHasMoreData(false);
    } finally {
      // Clear the appropriate loading state
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

  const onRefresh = async () => {
    setRefreshing(true);
    setCurrentPage(1);
    setHasMoreData(true);
    await loadUsers(false, 1, false);
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleFilterSelect = (type, value) => {
    if (type === 'role') {
      setSelectedRole(selectedRole === value ? null : value);
    } else if (type === 'status') {
      setSelectedStatus(selectedStatus === value ? null : value);
    }
    setShowFilterDropdown(false);
  };

  const handleClearFilters = () => {
    setSelectedRole(null);
    setSelectedStatus(null);
    setShowFilterDropdown(false);
  };

  const getFilterLabel = () => {
    const filters = [];
    if (selectedRole === 'admin') filters.push('Admin Role');
    if (selectedRole === 'sub_admin') filters.push('Sub Admin Role');
    if (selectedStatus === 'active') filters.push('Active');
    if (selectedStatus === 'inactive') filters.push('Inactive');
    return filters.length > 0 ? filters.join(', ') : 'Filter';
  };

  const handleFilterRole = (role) => {
    setSelectedRole(selectedRole === role ? null : role);
  };

  const handleFilterStatus = (status) => {
    setSelectedStatus(selectedStatus === status ? null : status);
  };

  const handleEdit = (user) => {
    console.log('Edit user:', user);
    
    // Navigate to appropriate edit screen based on role
    if (user.role === 'admin') {
      navigation.navigate('EditAdmin', {admin: user});
    } else if (user.role === 'sub_admin') {
      navigation.navigate('EditSubAdmin', {admin: user});
    } else {
      Alert.alert('Error', 'Unknown user role');
    }
  };

  const handleAdd = () => {
    // Only admins can add new admin users
    if (currentAdminRole !== 'admin') {
      Alert.alert(
        'Access Denied',
        'Only administrators can add new admin users.',
        [{ text: 'OK' }]
      );
      return;
    }
    navigation.navigate('AddAdmin');
  };

  const handleLoadMore = () => {
    if (!loadingMore && hasMoreData && users.length > 0) {
      const nextPage = currentPage + 1;
      loadUsers(false, nextPage, true);
    }
  };

  const renderUserCard = ({ item }) => (
    <UserCard user={item} onEdit={handleEdit} />
  );

  const renderEmptyComponent = () => {
    if (loading) {
      return (
        <View style={styles.emptyContainer}>
          <ActivityIndicator size="large" color="#539461" />
        </View>
      );
    }
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>No users found</Text>
      </View>
    );
  };

  const renderFooter = () => {
    if (!loadingMore) return null;
    return (
      <View style={styles.footerLoader}>
        <ActivityIndicator size="small" color="#539461" />
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={[]}>
      <JungleAccessHeader
        onSearchChange={handleSearch}
        onPressAdd={handleAdd}
        showAddButton={currentAdminRole === 'admin'}
      />

      {/* Filter Dropdown Button */}
      <View style={styles.filterContainer}>
        <TouchableOpacity
          style={styles.filterButton}
          onPress={() => setShowFilterDropdown(true)}
          activeOpacity={0.7}
        >
          <Text style={[
            styles.filterButtonText,
            (selectedRole || selectedStatus) && styles.filterButtonTextActive
          ]}>
            {getFilterLabel()}
          </Text>
          <DownIcon width={16} height={16} />
        </TouchableOpacity>
      </View>
      
      <FlatList
        data={users}
        renderItem={renderUserCard}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        ListEmptyComponent={renderEmptyComponent}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.5}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor="#539461"
            colors={['#539461']}
          />
        }
      />

      {/* Filter Bottom Sheet Modal */}
      <Modal
        visible={showFilterDropdown}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowFilterDropdown(false)}
      >
        <View style={styles.bottomSheetOverlay}>
          <TouchableOpacity
            style={styles.bottomSheetBackdrop}
            activeOpacity={1}
            onPress={() => setShowFilterDropdown(false)}
          />
          
          <View style={styles.bottomSheet}>
            {/* Title */}
            <View style={styles.bottomSheetTitle}>
              <Text style={styles.bottomSheetTitleText}>Filter</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setShowFilterDropdown(false)}
              >
                <CloseIcon width={24} height={24} />
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.bottomSheetContent}>
              {/* Admin Role Option */}
              <TouchableOpacity
                style={styles.filterOptionRow}
                onPress={() => handleFilterSelect('role', 'admin')}
                activeOpacity={0.7}
              >
                <View style={styles.listLeft}>
                  <Text style={styles.listTitle}>Admin Role</Text>
                </View>
                <View style={styles.listRight}>
                  <View style={[
                    styles.checkbox,
                    selectedRole === 'admin' && styles.checkboxActive
                  ]}>
                    {selectedRole === 'admin' && (
                      <CheckIcon width={16} height={16} fill="#FFFFFF" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Sub Admin Role Option */}
              <TouchableOpacity
                style={styles.filterOptionRow}
                onPress={() => handleFilterSelect('role', 'sub_admin')}
                activeOpacity={0.7}
              >
                <View style={styles.listLeft}>
                  <Text style={styles.listTitle}>Sub Admin Role</Text>
                </View>
                <View style={styles.listRight}>
                  <View style={[
                    styles.checkbox,
                    selectedRole === 'sub_admin' && styles.checkboxActive
                  ]}>
                    {selectedRole === 'sub_admin' && (
                      <CheckIcon width={16} height={16} fill="#FFFFFF" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Active Status Option */}
              <TouchableOpacity
                style={styles.filterOptionRow}
                onPress={() => handleFilterSelect('status', 'active')}
                activeOpacity={0.7}
              >
                <View style={styles.listLeft}>
                  <Text style={styles.listTitle}>Active</Text>
                </View>
                <View style={styles.listRight}>
                  <View style={[
                    styles.checkbox,
                    selectedStatus === 'active' && styles.checkboxActive
                  ]}>
                    {selectedStatus === 'active' && (
                      <CheckIcon width={16} height={16} fill="#FFFFFF" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Inactive Status Option */}
              <TouchableOpacity
                style={styles.filterOptionRow}
                onPress={() => handleFilterSelect('status', 'inactive')}
                activeOpacity={0.7}
              >
                <View style={styles.listLeft}>
                  <Text style={styles.listTitle}>Inactive</Text>
                </View>
                <View style={styles.listRight}>
                  <View style={[
                    styles.checkbox,
                    selectedStatus === 'inactive' && styles.checkboxActive
                  ]}>
                    {selectedStatus === 'inactive' && (
                      <CheckIcon width={16} height={16} fill="#FFFFFF" />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.bottomSheetAction}>
              <TouchableOpacity
                style={styles.buttonClear}
                onPress={handleClearFilters}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonClearText}>Clear</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.buttonView}
                onPress={() => setShowFilterDropdown(false)}
                activeOpacity={0.7}
              >
                <Text style={styles.buttonViewText}>View</Text>
              </TouchableOpacity>
            </View>

            {/* Home Indicator */}
            <View style={styles.homeIndicatorContainer}>
              <View style={styles.gestureBar} />
            </View>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
};

export default JungleAccess;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: 0,
    minHeight: 106,
  },
  statusBar: {
    width: '100%',
    height: 48,
  },
  headerContent: {
    width: '100%',
    height: 58,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
    gap: 10,
  },
  backButton: {
    width: 24,
    height: 24,
  },
  searchContainerWrapper: {
    flex: 1,
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
    zIndex: 1,
  },
  searchInput: {
    flex: 1,
    marginLeft: 8,
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    padding: 0,
    height: '100%',
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
  list: {
    flex: 1,
    backgroundColor: '#F5F6F6',
  },
  listContent: {
    paddingTop: 6,
    paddingBottom: 34,
  },
  userCardContainer: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    backgroundColor: '#F5F6F6',
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  avatarContainer: {
    width: 40,
    minWidth: 40,
    height: 40,
    minHeight: 40,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: '#539461',
  },
  avatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: '#539461',
    backgroundColor: '#EAF2EC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#539461',
  },
  userContent: {
    flex: 1,
    gap: 4,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 24,
  },
  userName: {
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: '#202325',
    flexShrink: 1,
  },
  usernameText: {
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#7F8D91',
    flexShrink: 1,
  },
  statusRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    minHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
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
  dividerContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 4,
    width: 4,
    height: 12,
  },
  divider: {
    width: 4,
    maxWidth: 4,
    height: 4,
    maxHeight: 4,
    backgroundColor: '#7F8D91',
    borderRadius: 100,
  },
  roleContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 4,
    flexShrink: 1,
  },
  roleText: {
    fontSize: 14,
    fontWeight: '500',
    lineHeight: 20,
    color: '#647276',
  },
  editButton: {
    width: 24,
    height: 48,
    justifyContent: 'flex-start',
    alignItems: 'flex-end',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#7F8D91',
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  // Filter Dropdown Styles
  filterContainer: {
    width: '100%',
    paddingHorizontal: 15,
    paddingTop: 2,
    paddingBottom: 12,
  },
  filterButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 8,
    width: 127,
    height: 34,
    minHeight: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  filterButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    color: '#393D40',
    paddingHorizontal: 4,
  },
  filterButtonTextActive: {
    color: '#539461',
    fontWeight: '600',
  },
  // Bottom Sheet Modal Styles
  bottomSheetOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  bottomSheetBackdrop: {
    flex: 1,
  },
  bottomSheet: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 0,
  },
  bottomSheetTitle: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 16,
    height: 60,
    backgroundColor: '#FFFFFF',
  },
  bottomSheetTitleText: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  bottomSheetContent: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 8,
  },
  filterOptionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    width: '100%',
    height: 48,
  },
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 0,
    gap: 8,
    flex: 1,
    height: 48,
    minHeight: 48,
  },
  listTitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
  },
  listRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 16,
    paddingLeft: 0,
    gap: 8,
    flex: 1,
    height: 48,
    minHeight: 48,
  },
  checkbox: {
    width: 24,
    minWidth: 24,
    height: 24,
    minHeight: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 6,
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkboxActive: {
    backgroundColor: '#539461',
    borderColor: '#539461',
  },
  bottomSheetAction: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 0,
    gap: 8,
    height: 60,
  },
  buttonClear: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    flex: 1,
    height: 48,
    minHeight: 48,
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
  },
  buttonClearText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#539461',
  },
  buttonView: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    flex: 1,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
  },
  buttonViewText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  homeIndicatorContainer: {
    width: '100%',
    height: 34,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gestureBar: {
    width: 148,
    height: 5,
    backgroundColor: '#202325',
    borderRadius: 100,
    marginBottom: 8,
  },
});
