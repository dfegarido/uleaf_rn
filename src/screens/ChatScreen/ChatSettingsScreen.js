import {
  deleteDoc,
  doc,
  getDoc,
  updateDoc,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import React, { useContext, useState, useEffect, useRef } from 'react';
import { useIsFocused } from '@react-navigation/native';
import {
  ActivityIndicator,
  FlatList,
  Image,
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
  Alert,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import { db } from '../../../firebase';
import TrashcanIcon from '../../assets/iconchat/trashcan.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import { AuthContext } from '../../auth/AuthProvider';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../config/apiConfig';

const AvatarImage = require('../../assets/images/AvatarBig.png');

const ChatSettingsScreen = ({navigation, route}) => {
  const { participants: initialParticipants, chatId, type, name } = route.params || {};
  const {userInfo} = useContext(AuthContext);
  const isFocused = useIsFocused();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [addMemberModalVisible, setAddMemberModalVisible] = useState(false);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [filteredUsers, setFilteredUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [fetchingUsers, setFetchingUsers] = useState(false);
  const [participants, setParticipants] = useState(initialParticipants || []);
  // Map of uid -> { name, avatarUrl } for participants (fetched from Firestore)
  const [participantDataMap, setParticipantDataMap] = useState({});
  const fetchingRef = useRef(new Set());
  
  // Handle admin API response: userInfo.data.uid, regular nested: userInfo.user.uid, or flat: userInfo.uid
  const currentUserUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';
  
  // Check if user is admin or sub_admin
  const isAdmin = userInfo?.data?.role === 'admin' || userInfo?.data?.role === 'sub_admin' || userInfo?.role === 'admin' || userInfo?.role === 'sub_admin';
  
  const isGroupChat = type === 'group';
  
  // For private chats, show the other participant
  const otherUserInfo = !isGroupChat && participants && participants.length > 0
    ? participants.find(p => p.uid !== currentUserUid) || participants[0]
    : null;

  // Helper function to get safe avatar source - prioritizes participantDataMap (from Firestore)
  const getAvatarSource = (avatarUrl, uid = null) => {
    // Priority 1: Use participantDataMap if available (fetched from Firestore)
    if (uid && participantDataMap[uid]?.avatarUrl) {
      return { uri: participantDataMap[uid].avatarUrl };
    }
    
    // Priority 2: Check if avatarUrl is a valid string URL
    if (typeof avatarUrl === 'string' && avatarUrl.trim() !== '' && avatarUrl.startsWith('http')) {
      return { uri: avatarUrl };
    }
    
    // Priority 3: Check if avatarUrl is an object with uri
    if (typeof avatarUrl === 'object' && avatarUrl !== null && avatarUrl.uri) {
      return { uri: avatarUrl.uri };
    }
    
    // Fallback to default avatar
    return AvatarImage;
  };

  // Helper function to get participant name - prioritizes participantDataMap (from Firestore)
  const getParticipantName = (participant) => {
    // Priority 1: Use participantDataMap if available (fetched from Firestore)
    if (participant?.uid && participantDataMap[participant.uid]?.name) {
      return participantDataMap[participant.uid].name;
    }
    
    // Priority 2: Use participant name from route params
    return participant?.name || 'Unknown';
  };

  useEffect(() => {
    if (addMemberModalVisible && searchText.trim() === '') {
      // Fetch users when modal opens with empty search
      fetchUsers('');
    }
  }, [addMemberModalVisible]);
  
  useEffect(() => {
    // Debounce search
    if (!addMemberModalVisible) return;
    
    const debounceTimeout = setTimeout(() => {
      fetchUsers(searchText);
    }, 500);
    
    return () => clearTimeout(debounceTimeout);
  }, [searchText, addMemberModalVisible]);

  // Fetch latest chat document and update participants when screen is focused
  useEffect(() => {
    const fetchLatestChatData = async () => {
      if (!chatId || !isFocused) return;

      try {
        console.log('🔄 [ChatSettingsScreen] Fetching latest chat data...');
        const chatDocRef = doc(db, 'chats', chatId);
        const chatDocSnap = await getDoc(chatDocRef);
        
        if (chatDocSnap.exists()) {
          const chatData = chatDocSnap.data();
          const latestParticipants = Array.isArray(chatData.participants) ? chatData.participants : [];
          console.log('✅ [ChatSettingsScreen] Updated participants from Firestore:', latestParticipants.length);
          setParticipants(latestParticipants);
        }
      } catch (err) {
        console.warn('❌ [ChatSettingsScreen] Error fetching latest chat data:', err);
      }
    };

    if (isFocused) {
      fetchLatestChatData();
    }
  }, [chatId, isFocused]);

  // Fetch latest names and avatars for all participants from Firestore
  useEffect(() => {
    const fetchParticipantData = async () => {
      if (!participants || participants.length === 0) {
        console.log('🖼️ [ChatSettingsScreen] No participants to fetch data for');
        return;
      }

      try {
        const uidsToFetch = participants
          .map(p => p?.uid)
          .filter(uid => uid);

        console.log('🖼️ [ChatSettingsScreen] Fetching latest names and avatars for participants:', uidsToFetch);

        // Get current participantDataMap state
        setParticipantDataMap(prevMap => {
          for (const uid of uidsToFetch) {
            // Skip if currently fetching
            if (fetchingRef.current.has(uid)) {
              console.log(`⏭️ [ChatSettingsScreen] Skipping ${uid} - currently fetching`);
              continue;
            }

            // Mark as fetching
            fetchingRef.current.add(uid);
            
            // Fetch participant data asynchronously
            (async () => {
              try {
                console.log(`🔍 [ChatSettingsScreen] Fetching latest data for ${uid}...`);

                // Try buyer collection first
                let userDocRef = doc(db, 'buyer', uid);
                let userSnap = await getDoc(userDocRef);
                
                // If not found in buyer, try admin collection
                if (!userSnap.exists()) {
                  console.log(`🔍 [ChatSettingsScreen] ${uid} not in buyer, trying admin...`);
                  userDocRef = doc(db, 'admin', uid);
                  userSnap = await getDoc(userDocRef);
                }
                
                // If not found in admin, try supplier collection
                if (!userSnap.exists()) {
                  console.log(`🔍 [ChatSettingsScreen] ${uid} not in admin, trying supplier...`);
                  userDocRef = doc(db, 'supplier', uid);
                  userSnap = await getDoc(userDocRef);
                }

                if (userSnap.exists()) {
                  const data = userSnap.data();
                  
                  // Get latest name
                  const firstName = data?.firstName || '';
                  const lastName = data?.lastName || '';
                  const latestName = `${firstName} ${lastName}`.trim() || data?.gardenOrCompanyName || data?.name || '';
                  
                  // Get latest avatar URL
                  const avatarUrl = data?.profilePhotoUrl || data?.profileImage || null;
                  
                  setParticipantDataMap(prevMap => {
                    // Double-check it's not already there (in case of race condition)
                    if (prevMap[uid] && prevMap[uid].name === latestName && prevMap[uid].avatarUrl === avatarUrl) {
                      console.log(`⏭️ [ChatSettingsScreen] ${uid} data unchanged, skipping update`);
                      return prevMap;
                    }
                    
                    const updateData = {};
                    if (latestName) updateData.name = latestName;
                    if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '') {
                      updateData.avatarUrl = avatarUrl;
                    }
                    
                    if (Object.keys(updateData).length > 0) {
                      console.log(`✅ [ChatSettingsScreen] Found latest data for ${uid}:`, updateData);
                      return {...prevMap, [uid]: {...prevMap[uid], ...updateData}};
                    }
                    
                    return prevMap;
                  });
                } else {
                  console.log(`⚠️ [ChatSettingsScreen] User ${uid} not found in buyer, admin, or supplier collections`);
                }
              } catch (err) {
                console.warn(`❌ [ChatSettingsScreen] Error fetching data for ${uid}:`, err);
              } finally {
                // Remove from fetching set
                fetchingRef.current.delete(uid);
              }
            })();
          }
          
          return prevMap;
        });
      } catch (err) {
        console.warn('❌ [ChatSettingsScreen] Error in fetchParticipantData:', err);
      }
    };

    if (isFocused) {
      fetchParticipantData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants?.length, currentUserUid, isFocused]);

  const fetchUsers = async (query = '') => {
    try {
      setFetchingUsers(true);
      // Show up to 50 users (both online and offline)
      const apiUrl = `${API_ENDPOINTS.SEARCH_USER}?query=${query}&userType=buyer&limit=50&offset=0`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const data = await response.json();
      
      if (data && data.success && data.results) {
        const formattedUsers = await Promise.all(data.results.map(async user => {
          let avatarUrl = AvatarImage;
          
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
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim(),
            avatarUrl: avatarUrl,
            uid: user.id,
            email: user.email,
          };
        }));
        
        setAvailableUsers(formattedUsers);
        setFilteredUsers(formattedUsers);
      }
    } catch (error) {
      console.error('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again later.');
    } finally {
      setFetchingUsers(false);
    }
  };

  const handleAddMember = async (user) => {
    try {
      setLoading(true);
      
      const newParticipant = {
        uid: user.uid,
        name: user.name,
        avatarUrl: typeof user.avatarUrl === 'object' && user.avatarUrl.uri 
          ? user.avatarUrl.uri 
          : (typeof user.avatarUrl === 'string' ? user.avatarUrl : ''),
      };
      
      // Add the user to the chat's participants and participantIds
      await updateDoc(doc(db, 'chats', chatId), {
        participants: arrayUnion(newParticipant),
        participantIds: arrayUnion(user.uid),
      });
      
      // Refresh the chat document to get the latest data
      const chatDocRef = doc(db, 'chats', chatId);
      const chatDocSnap = await getDoc(chatDocRef);
      
      if (chatDocSnap.exists()) {
        const chatData = chatDocSnap.data();
        setParticipants(Array.isArray(chatData.participants) ? chatData.participants : []);
      }
      
      // Remove from available users list
      setAvailableUsers(prev => prev.filter(u => u.uid !== user.uid));
      setFilteredUsers(prev => prev.filter(u => u.uid !== user.uid));
      
      setAddMemberModalVisible(false);
      Alert.alert('Success', `${user.name} has been added to the group.`);
    } catch (error) {
      console.error('Error adding member:', error);
      Alert.alert('Error', 'Failed to add member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleLeaveGroup = async () => {
    Alert.alert(
      'Leave Group',
      `Are you sure you want to leave "${name || 'this group'}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Leave',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Get the current chat document
              const chatDocRef = doc(db, 'chats', chatId);
              const chatDocSnap = await getDoc(chatDocRef);
              
              if (!chatDocSnap.exists()) {
                throw new Error('Chat not found');
              }
              
              const chatData = chatDocSnap.data();
              const currentParticipants = Array.isArray(chatData.participants) ? chatData.participants : [];
              const currentParticipantIds = Array.isArray(chatData.participantIds) ? chatData.participantIds : [];
              
              // Find the exact participant object
              const myParticipant = currentParticipants.find(p => p.uid === currentUserUid);
              
              if (myParticipant) {
                // Remove yourself from the group
                await updateDoc(chatDocRef, {
                  participants: arrayRemove(myParticipant),
                  participantIds: arrayRemove(currentUserUid),
                });
              } else {
                // Fallback: manually filter
                const updatedParticipants = currentParticipants.filter(p => p.uid !== currentUserUid);
                const updatedParticipantIds = currentParticipantIds.filter(id => id !== currentUserUid);
                
                await updateDoc(chatDocRef, {
                  participants: updatedParticipants,
                  participantIds: updatedParticipantIds,
                });
              }
              
              setLoading(false);
              // Navigate back to chat list
              navigation.navigate('Chat');
            } catch (error) {
              console.error('Error leaving group:', error);
              Alert.alert('Error', 'Failed to leave group. Please try again.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const handleRemoveMember = async (member) => {
    // Prevent removing yourself
    if (member.uid === currentUserUid) {
      Alert.alert('Error', 'You cannot remove yourself from the group.');
      return;
    }

    Alert.alert(
      'Remove Member',
      `Are you sure you want to remove ${member.name} from the group?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Remove',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // First, get the current chat document to get exact participant objects
              const chatDocRef = doc(db, 'chats', chatId);
              const chatDocSnap = await getDoc(chatDocRef);
              
              if (!chatDocSnap.exists()) {
                throw new Error('Chat not found');
              }
              
              const chatData = chatDocSnap.data();
              const currentParticipants = Array.isArray(chatData.participants) ? chatData.participants : [];
              const currentParticipantIds = Array.isArray(chatData.participantIds) ? chatData.participantIds : [];
              
              // Find the exact participant object from the document
              const exactParticipant = currentParticipants.find(p => p.uid === member.uid);
              
              if (exactParticipant) {
                // Remove the exact participant object
                await updateDoc(chatDocRef, {
                  participants: arrayRemove(exactParticipant),
                  participantIds: arrayRemove(member.uid),
                });
              } else {
                // Fallback: manually filter the arrays
                const updatedParticipants = currentParticipants.filter(p => p.uid !== member.uid);
                const updatedParticipantIds = currentParticipantIds.filter(id => id !== member.uid);
                
                await updateDoc(chatDocRef, {
                  participants: updatedParticipants,
                  participantIds: updatedParticipantIds,
                });
              }
              
              // Update local state immediately
              setParticipants(prev => prev.filter(p => p.uid !== member.uid));
              
              Alert.alert('Success', `${member.name} has been removed from the group.`);
            } catch (error) {
              console.error('Error removing member:', error);
              Alert.alert('Error', 'Failed to remove member. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const deleteChat = async () => {
    Alert.alert(
      isGroupChat ? 'Delete Group' : 'Delete Chat',
      `Are you sure you want to delete this ${isGroupChat ? 'group chat' : 'chat'}?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setLoading(true);
            try {
              await deleteDoc(doc(db, 'chats', chatId));
              setLoading(false);
              navigation.navigate('Chat');
            } catch (error) {
              console.error('Error deleting chat:', error);
              Alert.alert('Error', 'Failed to delete chat. Please try again.');
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  const openAddMemberModal = () => {
    setAddMemberModalVisible(true);
    setSearchText('');
    setAvailableUsers([]);
    setFilteredUsers([]);
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
      <View style={[styles.header, Platform.OS === 'android' && {paddingTop: Math.min(insets.top, 40), height: 80}]}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackSolidIcon size={24} color="#333" />
        </TouchableOpacity>
        <Text style={[styles.headerTitle, Platform.OS === 'android' && styles.headerTitleAndroid]}>
          {isGroupChat ? (name || 'Group Settings') : (otherUserInfo?.name || 'Chat Settings')}
        </Text>
        <View style={{width: 24}} />
      </View>

      {isGroupChat ? (
        <>
          {/* Members Section */}
          <View style={styles.section}>
            <View style={styles.sectionHeaderContainer}>
              <Text style={styles.sectionHeader}>Members</Text>
              <Text style={styles.memberCount}>{participants?.length || 0} {participants?.length === 1 ? 'member' : 'members'}</Text>
            </View>
            <FlatList
              data={participants || []}
              keyExtractor={(item, index) => item.uid || `member-${index}`}
              renderItem={({item}) => {
                // Get latest name from Firestore or fallback to participant name
                const displayName = getParticipantName(item);
                
                return (
                  <View style={styles.memberItem}>
                    <Image
                      source={getAvatarSource(item.avatarUrl, item.uid)}
                      style={styles.memberAvatar}
                      defaultSource={AvatarImage}
                    />
                    <Text style={styles.memberName}>{displayName}</Text>
                    {item.uid === currentUserUid && (
                      <Text style={styles.youLabel}>You</Text>
                    )}
                    {item.uid !== currentUserUid && isAdmin && (
                      <TouchableOpacity
                        onPress={() => handleRemoveMember(item)}
                        style={styles.removeButton}>
                        <TrashcanIcon width={20} height={20} />
                      </TouchableOpacity>
                    )}
                  </View>
                );
              }}
              scrollEnabled={true}
              nestedScrollEnabled={true}
              style={styles.membersList}
            />
          </View>

          {/* Add Member Button - Only show for admins */}
          {isAdmin && (
            <>
              <View style={styles.addMemberSection}>
                <TouchableOpacity
                  onPress={openAddMemberModal}
                  style={styles.addMemberButton}>
                  <Text style={styles.addMemberIcon}>+</Text>
                  <Text style={styles.addMemberText}>Add Member</Text>
                </TouchableOpacity>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* Delete Group Button */}
              <View style={styles.actionSection}>
                <TouchableOpacity onPress={deleteChat} style={styles.deleteButton}>
                  <TrashcanIcon />
                  <Text style={styles.deleteText}>Delete Group</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {/* Leave Group Button - Show for non-admin users */}
          {!isAdmin && (
            <>
              <View style={styles.divider} />

              <View style={styles.actionSection}>
                <TouchableOpacity onPress={handleLeaveGroup} style={styles.deleteButton}>
                  <TrashcanIcon />
                  <Text style={styles.deleteText}>Leave Group</Text>
                </TouchableOpacity>
              </View>
            </>
          )}
        </>
      ) : (
        <>
          {/* Private Chat: Show other user's profile */}
          <View style={styles.profileSection}>
            <Image
              source={getAvatarSource(otherUserInfo?.avatarUrl)}
              style={styles.avatar}
            />
            <Text style={styles.username}>@{otherUserInfo?.name || 'Unknown'}</Text>
          </View>

          <View style={styles.divider} />

          {/* Delete Button - Show for all users */}
          <View style={styles.actionSection}>
            <TouchableOpacity onPress={deleteChat} style={styles.deleteButton}>
              <TrashcanIcon />
              <Text style={styles.deleteText}>Delete Chat</Text>
            </TouchableOpacity>
          </View>
        </>
      )}

      {/* Add Member Modal */}
      {addMemberModalVisible && (
        <Modal
          visible={addMemberModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => setAddMemberModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setAddMemberModalVisible(false)}>
                  <Text style={styles.modalCancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Add Member</Text>
                <View style={{width: 60}} />
              </View>

              <TextInput
                placeholder="Search users..."
                value={searchText}
                onChangeText={setSearchText}
                style={styles.searchInput}
                placeholderTextColor="#647276"
              />

              {fetchingUsers ? (
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="large" color="#539461" />
                  <Text style={styles.loadingText}>Loading users...</Text>
                </View>
              ) : (
                <FlatList
                  data={filteredUsers.filter(user => !participants?.some(p => p.uid === user.uid))}
                  keyExtractor={item => item.uid}
                  renderItem={({item}) => (
                    <TouchableOpacity
                      onPress={() => handleAddMember(item)}
                      style={styles.userItem}>
                      <Image
                        source={item.avatarUrl}
                        style={styles.userItemAvatar}
                      />
                      <View style={styles.userItemInfo}>
                        <Text style={styles.userItemName}>{item.name}</Text>
                        {item.email && <Text style={styles.userItemEmail}>{item.email}</Text>}
                      </View>
                    </TouchableOpacity>
                  )}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No users found</Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>
        </Modal>
      )}
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
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  headerTitleAndroid: {
    paddingTop: 0,
  },
  groupInfoSection: {
    padding: 24,
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: 24,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 4,
  },
  memberCount: {
    fontSize: 14,
    color: '#647276',
  },
  divider: {
    height: 12,
    backgroundColor: '#F5F6F6',
    width: '100%',
  },
  section: {
    padding: 16,
  },
  membersList: {
    maxHeight: 300,
  },
  sectionHeaderContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionHeader: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
  },
  memberCount: {
    fontSize: 14,
    color: '#647276',
  },
  memberItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 8,
  },
  memberAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#E5E8EA',
  },
  memberName: {
    flex: 1,
    fontSize: 16,
    color: '#202325',
  },
  youLabel: {
    fontSize: 14,
    color: '#647276',
    fontStyle: 'italic',
  },
  removeButton: {
    padding: 4,
  },
  addMemberSection: {
    paddingHorizontal: 16,
  },
  addMemberButton: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#539461',
    borderStyle: 'dashed',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 16,
    justifyContent: 'center',
  },
  addMemberIcon: {
    fontSize: 24,
    color: '#539461',
    marginRight: 8,
  },
  addMemberText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#539461',
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 24,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    borderWidth: 1,
    borderColor: '#539461',
    marginBottom: 8,
  },
  username: {
    fontSize: 16,
    fontWeight: '500',
    color: '#202325',
  },
  actionSection: {
    padding: 24,
    alignItems: 'center',
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    minWidth: 200,
  },
  deleteText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#393D40',
    marginLeft: 8,
    flexShrink: 0,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    maxHeight: '80%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  modalCancelButton: {
    fontSize: 16,
    color: '#647276',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    padding: 12,
    margin: 16,
    fontSize: 16,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  userItemAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
  },
  userItemInfo: {
    flex: 1,
  },
  userItemName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
  },
  userItemEmail: {
    fontSize: 12,
    color: '#647276',
    marginTop: 2,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#647276',
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
});
