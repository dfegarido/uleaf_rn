import React, { useState, useEffect, useRef, useContext } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../config/apiConfig';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { AuthContext } from '../../auth/AuthProvider';
import { listAdminsApi } from '../Api/listAdminsApi';

// Pre-load and cache the avatar image to prevent RCTImageView errors
const AvatarImage = require('../../assets/images/AvatarBig.png');
const CheckIcon = require('../../assets/icons/check-circle-solid.svg');

const GroupChatModal = ({ visible, onClose, onCreateGroup }) => {
  const { userInfo } = useContext(AuthContext);
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedUsers, setSelectedUsers] = useState([]);
  const [groupName, setGroupName] = useState('');
  const scrollViewRef = useRef(null);
  const searchInputRef = useRef(null);
  const groupNameInputRef = useRef(null);
  
  // Check explicit userType first (most reliable)
  const explicitBuyer = 
    userInfo?.user?.userType === 'buyer' || 
    userInfo?.data?.userType === 'buyer' ||
    userInfo?.userType === 'buyer';
  
  const explicitSeller = 
    userInfo?.user?.userType === 'supplier' || 
    userInfo?.data?.userType === 'supplier' ||
    userInfo?.userType === 'supplier';
  
  // Check if current user is a seller (supplier) - check multiple possible structures
  // BUT: If explicit userType is 'buyer', don't treat as seller even if seller fields exist
  const isSeller = explicitSeller || (!explicitBuyer && (
    userInfo?.user?.gardenOrCompanyName !== undefined ||
    userInfo?.user?.liveFlag !== undefined ||
    userInfo?.user?.currency !== undefined ||
    userInfo?.data?.gardenOrCompanyName !== undefined ||
    userInfo?.data?.liveFlag !== undefined ||
    userInfo?.data?.currency !== undefined ||
    userInfo?.gardenOrCompanyName !== undefined ||
    userInfo?.liveFlag !== undefined ||
    userInfo?.currency !== undefined ||
    (userInfo?.user?.status && typeof userInfo.user.status === 'string' && 
     ['active', 'Active', 'De-activated', 'De-activated'].includes(userInfo.user.status)) ||
    (userInfo?.data?.status && typeof userInfo.data.status === 'string' && 
     ['active', 'Active', 'De-activated', 'De-activated'].includes(userInfo.data.status)) ||
    (userInfo?.status && typeof userInfo.status === 'string' && 
     ['active', 'Active', 'De-activated', 'De-activated'].includes(userInfo.status))
  ));
  
  // Check if current user is a buyer
  // Prioritize explicit userType field over inferred fields
  // If userType is explicitly 'buyer', then it's a buyer (even if seller fields exist)
  const isBuyer = explicitBuyer || (!explicitSeller && !isSeller && (userInfo?.user?.userType || userInfo?.data?.userType || userInfo?.userType));
  
  // Check if current user is an admin (admin or sub_admin)
  const isAdmin = 
    userInfo?.data?.role === 'admin' || 
    userInfo?.data?.role === 'sub_admin' || 
    userInfo?.role === 'admin' || 
    userInfo?.role === 'sub_admin' ||
    userInfo?.user?.role === 'admin' ||
    userInfo?.user?.role === 'sub_admin';
  
  // Fetch users when modal becomes visible
  useEffect(() => {
    if (visible) {
      // Only fetch on initial visibility or when searchText is empty
      if (users.length === 0 || !searchText.trim()) {
        fetchUsers(searchText);
      }
    } else {
      // Reset state when modal closes
      setSelectedUsers([]);
      setGroupName('');
      setSearchText('');
    }
  }, [visible]);
  
  // Filter users when search text changes
  useEffect(() => {
    // Fetch users with search query when searchText changes (with small debounce)
    const debounceTimeout = setTimeout(() => {
      fetchUsers(searchText);
    }, 500); // 500ms debounce
    
    return () => clearTimeout(debounceTimeout);
  }, [searchText]);
  
  const fetchUsers = async (query = '') => {
    try {
      setLoading(true);
      
      // Determine which user type to search based on current user's role
      // RULE: Sellers can only search for suppliers and admins
      // RULE: Buyers can only search for buyers and admins
      // RULE: Admins can search for all user types (buyers, suppliers, and admins)
      console.log('GroupChatModal: Fetching users', {
        isSeller,
        isBuyer,
        isAdmin,
        query
      });
      
      const allResults = [];
      const searchQuery = query && query.trim().length >= 2 ? query.trim() : '';
      const encodedQuery = encodeURIComponent(searchQuery);
      const authToken = await getStoredAuthToken();
      
      // IMPORTANT: Check isAdmin FIRST before isSeller/isBuyer
      // Admins might have fields that make them appear as sellers or buyers,
      // but they should be treated as admins with full access
      if (isAdmin) {
        // Fetch buyers
        try {
          const buyerUrl = `${API_ENDPOINTS.SEARCH_USER}?query=${encodedQuery}&userType=buyer&limit=50&offset=0`;
          const buyerResponse = await fetch(buyerUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (buyerResponse.ok) {
            const buyerData = await buyerResponse.json();
            if (buyerData && buyerData.success && buyerData.results) {
              const buyerResults = buyerData.results.map(user => ({
                id: user.id,
                username: user.username || user.email || '',
                email: user.email || '',
                profileImage: user.profileImage || '',
                userType: user.userType || 'buyer'
              }));
              allResults.push(...buyerResults);
            }
          }
        } catch (buyerError) {
          console.log('Error fetching buyers for admin:', buyerError);
        }
        
        // Fetch suppliers
        try {
          const supplierUrl = `${API_ENDPOINTS.SEARCH_USER}?query=${encodedQuery}&userType=supplier&limit=50&offset=0`;
          const supplierResponse = await fetch(supplierUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (supplierResponse.ok) {
            const supplierData = await supplierResponse.json();
            if (supplierData && supplierData.success && supplierData.results) {
              const supplierResults = supplierData.results.map(user => ({
                id: user.id,
                username: user.username || user.email || '',
                email: user.email || '',
                profileImage: user.profileImage || '',
                userType: user.userType || 'supplier'
              }));
              allResults.push(...supplierResults);
            }
          }
        } catch (supplierError) {
          console.log('Error fetching suppliers for admin:', supplierError);
        }
      } else if (isSeller) {
        // ============================================
        // RULE: SELLER ACCOUNT USERS CAN MESSAGE FOR ADMIN AND SELLER OTHER USERS
        // Sellers can ONLY message:
        // 1. Admin users
        // 2. Other seller users (suppliers)
        // Sellers CANNOT message buyer users
        // ============================================
        const supplierUrl = `${API_ENDPOINTS.SEARCH_USER}?query=${encodedQuery}&userType=supplier&limit=50&offset=0`;
        
        const supplierResponse = await fetch(supplierUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (!supplierResponse.ok) {
          throw new Error(`Failed to fetch suppliers: ${supplierResponse.status}`);
        }
        
        const supplierData = await supplierResponse.json();
        
        // Process supplier results if available - use username instead of firstName/lastName
        if (supplierData && supplierData.success && supplierData.results) {
          const supplierResults = supplierData.results.map(user => ({
            id: user.id,
            username: user.username || user.email || '',
            email: user.email || '',
            profileImage: user.profileImage || '',
            userType: user.userType || 'supplier'
          }));
          allResults.push(...supplierResults);
        }
      } else if (isBuyer) {
        // ============================================
        // RULE: FOR BUYER ACCOUNT USERS CAN MESSAGE OTHER BUYER USERS AND ADMIN ONLY
        // Buyers can ONLY message:
        // 1. Admin users (both admin and sub_admin roles)
        // 2. Other buyer users
        // Buyers CANNOT message seller users (suppliers)
        // ============================================
        console.log('✅ Buyer detected: Fetching buyers and admins ONLY (suppliers excluded)');
        const buyerUrl = `${API_ENDPOINTS.SEARCH_USER}?query=${encodedQuery}&userType=buyer&limit=50&offset=0`;
        
        const buyerResponse = await fetch(buyerUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (!buyerResponse.ok) {
          throw new Error(`Failed to fetch buyers: ${buyerResponse.status}`);
        }
        
        const buyerData = await buyerResponse.json();
        
        // Process buyer results if available - use username instead of firstName/lastName
        if (buyerData && buyerData.success && buyerData.results) {
          const buyerResults = buyerData.results.map(user => ({
            id: user.id,
            username: user.username || user.email || '',
            email: user.email || '',
            profileImage: user.profileImage || '',
            userType: user.userType || 'buyer'
          }));
          allResults.push(...buyerResults);
        }
      }
      
      // Also fetch admins (both admin and sub_admin roles)
      try {
        const adminFilters = {
          status: 'active',
          limit: 50
        };
        const adminData = await listAdminsApi(adminFilters);
        
        if (adminData && adminData.success && Array.isArray(adminData.data)) {
          // Apply client-side search filter for admins - use username instead of firstName/lastName
          let admins = adminData.data.map(admin => ({
            id: admin.adminId || admin.id || admin.uid,
            username: admin.username || admin.email || '',
            email: admin.email || '',
            profileImage: admin.profileImage || admin.profilePhotoUrl || '',
            userType: admin.role || 'admin'
          }));
          
          // Filter admins by search query if provided
          if (searchQuery) {
            const searchTerm = searchQuery.toLowerCase();
            admins = admins.filter(admin => {
              const username = (admin.username || '').toLowerCase();
              const email = (admin.email || '').toLowerCase();
              return username.includes(searchTerm) || email.includes(searchTerm);
            });
          }
          
          allResults.push(...admins);
        }
      } catch (adminError) {
        console.log('Error fetching admins in GroupChatModal:', adminError);
        // Continue without admins if fetch fails
      }
      
      // Format all results (search results + admins) - use username instead of firstName/lastName
      if (allResults.length > 0) {
        const formattedUsers = await Promise.all(allResults.map(async user => {
          let avatarUrl = AvatarImage; // Default avatar image
          
          if (user.profileImage) {
            avatarUrl = { uri: user.profileImage };
          } else {
            try {
              const storedPhotoUrl = await AsyncStorage.getItem(`profilePhotoUrlWithTimestamp_${user.id}`);
              if (storedPhotoUrl) {
                avatarUrl = { uri: storedPhotoUrl };
              }
            } catch (err) {
              console.log('Failed to load avatar from storage:', err);
            }
          }
          
          return {
            id: user.id,
            name: user.username || user.email || 'Unknown',
            avatarUrl: avatarUrl,
            uid: user.id,
            email: user.email || '',
            createdAt: user.createdAt
          };
        }));
        
        setUsers(formattedUsers);
        setFilteredUsers(formattedUsers);
      } else {
        // No results found (neither search results nor admins)
        setUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.log('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again later.');
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };
  
  const toggleUserSelection = (user) => {
    const isSelected = selectedUsers.some(u => u.id === user.id);
    if (isSelected) {
      setSelectedUsers(prev => prev.filter(u => u.id !== user.id));
    } else {
      setSelectedUsers(prev => [...prev, user]);
    }
  };
  
  const handleCreateGroup = () => {
    if (selectedUsers.length < 2) {
      Alert.alert('Error', 'Please select at least 2 users for a group chat.');
      return;
    }
    
    if (!groupName.trim()) {
      Alert.alert('Error', 'Please enter a group name.');
      return;
    }
    
    onCreateGroup({
      name: groupName.trim(),
      selectedUsers: selectedUsers
    });
    
    onClose();
  };
  
  // Skeleton loading component for user items
  const SkeletonUserItem = ({ index = 0 }) => (
    <View style={[
      styles.userItem,
      index !== 4 && styles.userItemBorder
    ]}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.userInfo}>
        <View style={[styles.skeletonName, { width: 120 + (index % 3) * 30 }]} />
        <View style={[styles.skeletonEmail, { width: 80 + (index % 4) * 20 }]} />
      </View>
    </View>
  );

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent
      onRequestClose={onClose}
      presentationStyle="overFullScreen"
      statusBarTranslucent={true}>
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <View style={styles.modal}>
          <ScrollView
            ref={scrollViewRef}
            style={styles.scrollView}
            contentContainerStyle={styles.scrollContent}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="on-drag"
            showsVerticalScrollIndicator={true}
            nestedScrollEnabled={true}>
            {/* Header */}
            <View style={styles.header}>
              <Pressable onPress={onClose} style={styles.cancelButton}>
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </Pressable>
              <Text style={styles.title}>New Group</Text>
              <TouchableOpacity 
                onPress={handleCreateGroup}
                style={[
                  styles.createButton,
                  (selectedUsers.length < 2 || !groupName.trim()) && styles.createButtonDisabled
                ]}
                disabled={selectedUsers.length < 2 || !groupName.trim()}>
                <Text style={[
                  styles.createButtonText,
                  (selectedUsers.length < 2 || !groupName.trim()) && styles.createButtonTextDisabled
                ]}>Create</Text>
              </TouchableOpacity>
            </View>

            {/* Group Name Input */}
            <View style={styles.groupNameContainer}>
              <TextInput
                ref={groupNameInputRef}
                placeholder="Group Name"
                placeholderTextColor="#647276"
                style={styles.groupNameInput}
                value={groupName}
                onChangeText={setGroupName}
                onFocus={() => {
                  // Scroll to top to ensure input is visible
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 0, animated: true });
                  }, 100);
                }}
              />
            </View>

            {/* Selected Users Count */}
            {selectedUsers.length > 0 && (
              <View style={styles.selectedCountContainer}>
                <Text style={styles.selectedCountText}>
                  {selectedUsers.length} {selectedUsers.length === 1 ? 'person' : 'people'} selected
                </Text>
              </View>
            )}

            {/* Search Field */}
            <View style={styles.searchBox}>
              <View style={styles.searchIconContainer}>
                <Text style={styles.searchIconText}>🔍</Text>
              </View>
              <TextInput
                ref={searchInputRef}
                placeholder="Search"
                placeholderTextColor="#647276"
                style={styles.searchInput}
                value={searchText}
                onChangeText={setSearchText}
                onFocus={() => {
                  // Scroll to show search input when focused
                  setTimeout(() => {
                    scrollViewRef.current?.scrollTo({ y: 150, animated: true });
                  }, 100);
                }}
              />
            </View>

            {/* List */}
            {loading ? (
              <View style={styles.userList}>
                {Array.from({length: 5}).map((_, idx) => (
                  <SkeletonUserItem key={idx} index={idx} />
                ))}
              </View>
            ) : filteredUsers.length > 0 ? (
              <View style={styles.userList}>
                {filteredUsers.map((user, index) => {
                  const isSelected = selectedUsers.some(u => u.id === user.id);
                  return (
                    <TouchableOpacity 
                      onPress={() => toggleUserSelection(user)} 
                      key={user.id || index} 
                      style={[
                        styles.userItem,
                        index !== filteredUsers.length - 1 && styles.userItemBorder,
                        isSelected && styles.userItemSelected
                      ]}
                    >
                      <Image 
                        source={user.avatarUrl}
                        style={styles.avatar}
                        defaultSource={AvatarImage}
                      />
                      <View style={styles.userInfo}>
                        <Text style={styles.userName}>{user.name}</Text>
                        {user.email && <Text style={styles.userEmail}>{user.email}</Text>}
                      </View>
                      {isSelected && (
                        <View style={styles.checkIcon}>
                          <Text style={styles.checkIconText}>✓</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  );
                })}
              </View>
            ) : (
              <View style={styles.emptyContainer}>
                <Text style={styles.emptyText}>
                  {searchText.trim() ? `No users found for "${searchText}"` : 'No users found'}
                </Text>
              </View>
            )}
          </ScrollView>
          </View>
        </View>
      </View>
    </Modal>
  );
}

export default GroupChatModal;

const styles = StyleSheet.create({
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    height: 600,
    width: '100%',
    zIndex: 1000,
  },
  modal: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: 600,
    width: '100%',
    overflow: 'hidden',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 12,
  },
  cancelButton: {
    padding: 8,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#647276',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  createButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#539461',
    borderRadius: 20,
  },
  createButtonDisabled: {
    backgroundColor: '#E5E8EA',
  },
  createButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  createButtonTextDisabled: {
    color: '#647276',
  },
  groupNameContainer: {
    marginBottom: 12,
  },
  groupNameInput: {
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    padding: 12,
    fontSize: 16,
    color: '#000',
  },
  selectedCountContainer: {
    paddingVertical: 8,
  },
  selectedCountText: {
    fontSize: 14,
    color: '#539461',
    fontWeight: '600',
  },
  searchIconContainer: {
    width: 20,
    height: 20,
    marginRight: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconText: {
    fontSize: 16,
    color: '#7F8D91',
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
  userItemSelected: {
    backgroundColor: '#f0f9f0',
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f5f5f5',
    marginRight: 12,
    borderWidth: 1,
    borderColor: '#E5E8EA',
  },
  userInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  userName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
  },
  userEmail: {
    fontSize: 12,
    color: '#647276',
    marginTop: 2,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#539461',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checkIconText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: 'bold',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontSize: 14,
    color: '#647276',
    textAlign: 'center',
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  skeletonName: {
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonEmail: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
  },
});

