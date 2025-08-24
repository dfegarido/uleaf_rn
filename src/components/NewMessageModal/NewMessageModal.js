import React, { useState, useEffect } from 'react';
import { Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../config/apiConfig';

// Pre-load and cache the avatar image to prevent RCTImageView errors
const AvatarImage = require('../../assets/images/AvatarBig.png');

const NewMessageModal = ({ visible, onClose, onSelect }) => {
  const [users, setUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [searchText, setSearchText] = useState('');
  
  // Fetch users when modal becomes visible
  useEffect(() => {
    if (visible) {
      // Only fetch on initial visibility or when searchText is empty
      if (users.length === 0 || !searchText.trim()) {
        fetchUsers(searchText);
      }
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
      
      // Build URL with query parameter using apiConfig
      const apiUrl = `${API_ENDPOINTS.SEARCH_USER}?query=${query}&userType=buyer&limit=5&offset=0`;
      console.log('Fetching users from:', apiUrl);
      // Make API requestquest
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      console.log('Response status:', response);
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.success && data.results) {
        // Map API response to the expected format
        const formattedUsers = data.results.map(async user => {
          // Try to get the profile photo from AsyncStorage if available
          let avatarUrl = AvatarImage; // Default avatar image
          console.log('Processing user:', user);
          if (user.profileImage) {
            // Use server provided profile image if available
            avatarUrl = { uri: user.profileImage };
          } else {
            // Try to get from AsyncStorage if the user ID matches current user
            try {
              // Check if there's a cached avatar for this user ID
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
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            avatarUrl: avatarUrl,
            uid: user.id,
            email: user.email,
            createdAt: user.createdAt
          };
        });
        
        // Resolve all promises from async mapping
        const resolvedUsers = await Promise.all(formattedUsers);
        
        setUsers(resolvedUsers);
        setFilteredUsers(resolvedUsers);
        
        // Log search results info
        console.log(`Found ${resolvedUsers.length} users for query "${query}"`);
      } else {
        throw new Error('Invalid response format');
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again later.');
      // Set empty users array to prevent issues
      setUsers([]);
      setFilteredUsers([]);
    } finally {
      setLoading(false);
    }
  };
  
  // Skeleton loading component for user items
  const SkeletonUserItem = ({ index = 0 }) => (
    <View style={[
      styles.userItem,
      index !== 4 && styles.userItemBorder // Show border except for last item
    ]}>
      {/* Avatar skeleton */}
      <View style={styles.skeletonAvatar} />
      <View style={styles.userInfo}>
        {/* Name skeleton with varying widths for realism */}
        <View style={[styles.skeletonName, { width: 120 + (index % 3) * 30 }]} />
        {/* Email skeleton with varying widths */}
        <View style={[styles.skeletonEmail, { width: 80 + (index % 4) * 20 }]} />
      </View>
    </View>
  );

  return (
    <Modal 
      visible={visible} 
      animationType="slide" 
      transparent
      onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.modal}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>People</Text>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeIconText}>✕</Text>
            </Pressable>
          </View>

          {/* Search Field */}
          <View style={styles.searchBox}>
            {/* Use View instead of SVG for search icon */}
            <View style={styles.searchIconContainer}>
              <Text style={styles.searchIconText}>🔍</Text>
            </View>
            <TextInput
              placeholder="Search"
              placeholderTextColor="#647276"
              style={styles.searchInput}
              value={searchText}
              onChangeText={setSearchText}
            />
          </View>

          {/* List */}
          {loading ? (
            <ScrollView contentContainerStyle={styles.userList}>
              {Array.from({length: 5}).map((_, idx) => (
                <SkeletonUserItem key={idx} index={idx} />
              ))}
            </ScrollView>
          ) : filteredUsers.length > 0 ? (
            <ScrollView contentContainerStyle={styles.userList}>
              {filteredUsers.map((user, index) => ( 
                <TouchableOpacity 
                  onPress={() => {
                    // Validate user data before passing to onSelect
                    if (user && user.id) {
                      // Make sure uid is set
                      const validatedUser = {
                        ...user,
                        uid: user.uid || user.id // Ensure uid is available
                      };
                      console.log('Selected user:', validatedUser);
                      onSelect(validatedUser);
                    } else {
                      Alert.alert('Error', 'Invalid user data. Please try again.');
                    }
                  }} 
                  key={user.id || index} 
                  style={[
                    styles.userItem,
                    index !== filteredUsers.length - 1 && styles.userItemBorder
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
                </TouchableOpacity>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>
                {searchText.trim() ? `No users found for "${searchText}"` : 'No users found'}
              </Text>
            </View>
          )}
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
  closeButton: {
    padding: 8,
    borderRadius: 20,
  },
  closeIconText: {
    fontSize: 20,
    color: '#7F8D91',
    fontWeight: 'bold',
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

