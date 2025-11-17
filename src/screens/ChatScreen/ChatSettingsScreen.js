import {
  addDoc,
  deleteDoc,
  doc,
  getDoc,
  getDocs,
  updateDoc,
  arrayUnion,
  arrayRemove,
  collection,
  query,
  where,
  Timestamp,
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
  Switch,
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
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { listAdminsApi } from '../../components/Api/listAdminsApi';

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
  // Public/Private toggle state for group chats
  const [isPublic, setIsPublic] = useState(false);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);
  // Join requests state
  const [joinRequests, setJoinRequests] = useState([]);
  const [loadingRequests, setLoadingRequests] = useState(false);
  // Map of userId -> { name, avatarUrl } for join request users (fetched from Firestore)
  const [joinRequestUserDataMap, setJoinRequestUserDataMap] = useState({});
  
  // Handle admin API response: userInfo.data.uid, regular nested: userInfo.user.uid, or flat: userInfo.uid
  const currentUserUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';
  
  // Check if user is admin or sub_admin
  const isAdmin = userInfo?.data?.role === 'admin' || userInfo?.data?.role === 'sub_admin' || userInfo?.role === 'admin' || userInfo?.role === 'sub_admin';
  
  // Check if current user is a seller (supplier) - check multiple possible structures
  const isSeller = 
    userInfo?.user?.userType === 'supplier' || 
    userInfo?.data?.userType === 'supplier' ||
    userInfo?.userType === 'supplier' ||
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
     ['active', 'Active', 'De-activated', 'De-activated'].includes(userInfo.status));
  
  // Check if current user is a buyer
  const isBuyer = 
    userInfo?.user?.userType === 'buyer' || 
    userInfo?.data?.userType === 'buyer' ||
    userInfo?.userType === 'buyer' ||
    (!isSeller && (userInfo?.user?.userType || userInfo?.data?.userType || userInfo?.userType));
  
  const isGroupChat = type === 'group';
  
  // Join request state for buyers
  const [isMember, setIsMember] = useState(true);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [hasRejectedRequest, setHasRejectedRequest] = useState(false);
  const [requestingJoin, setRequestingJoin] = useState(false);
  // Invitation state for sellers
  const [isInvited, setIsInvited] = useState(false);
  const [acceptingInvitation, setAcceptingInvitation] = useState(false);
  
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
          
          // Load isPublic setting for group chats
          if (isGroupChat) {
            const publicStatus = chatData.isPublic === true;
            setIsPublic(publicStatus);
            console.log('✅ [ChatSettingsScreen] Loaded group visibility:', publicStatus ? 'Public' : 'Private');
          }
        }
      } catch (err) {
        console.log('❌ [ChatSettingsScreen] Error fetching latest chat data:', err);
      }
    };

    if (isFocused) {
      fetchLatestChatData();
    }
  }, [chatId, isFocused, isGroupChat]);

  // Check membership, request status for buyers, and invitation status for sellers in public groups
  useEffect(() => {
    const checkUserMembershipAndInvitation = async () => {
      if (!chatId || !isGroupChat || (!isBuyer && !isSeller) || !isFocused) {
        setIsMember(true);
        return;
      }

      try {
        const chatDocRef = doc(db, 'chats', chatId);
        const chatDocSnap = await getDoc(chatDocRef);
        
        if (chatDocSnap.exists()) {
          const chatData = chatDocSnap.data();
          const publicStatus = chatData.isPublic === true;
          
          if (publicStatus) {
            // Check if current user is a member
            const memberIds = Array.isArray(chatData.participantIds) ? chatData.participantIds : [];
            const userIsMember = memberIds.includes(currentUserUid);
            setIsMember(userIsMember);
            
            // For buyers: check for pending or rejected requests
            if (isBuyer && !userIsMember) {
              const joinRequestsRef = collection(db, 'chats', chatId, 'joinRequests');
              
              // Check for pending request
              const pendingQuery = query(
                joinRequestsRef,
                where('userId', '==', currentUserUid),
                where('status', '==', 'pending')
              );
              const pendingSnapshot = await getDocs(pendingQuery);
              setHasPendingRequest(!pendingSnapshot.empty);
              
              // Check for rejected request
              const rejectedQuery = query(
                joinRequestsRef,
                where('userId', '==', currentUserUid),
                where('status', '==', 'rejected')
              );
              const rejectedSnapshot = await getDocs(rejectedQuery);
              setHasRejectedRequest(!rejectedSnapshot.empty);
            } else {
              setHasPendingRequest(false);
              setHasRejectedRequest(false);
            }
            
            // For sellers: check if they are invited
            if (isSeller && !userIsMember) {
              const invitedUsers = Array.isArray(chatData.invitedUsers) ? chatData.invitedUsers : [];
              setIsInvited(invitedUsers.includes(currentUserUid));
            } else {
              setIsInvited(false);
            }
          }
        }
      } catch (error) {
        console.log('Error checking user membership and invitation:', error);
        setIsMember(true);
      }
    };

    if (isFocused) {
      checkUserMembershipAndInvitation();
    }
  }, [chatId, isGroupChat, isBuyer, isSeller, isFocused, currentUserUid]);

  // Fetch join requests for public groups (admin only)
  useEffect(() => {
    const fetchJoinRequests = async () => {
      if (!chatId || !isGroupChat || !isAdmin || !isFocused) {
        setJoinRequests([]);
        return;
      }

      try {
        setLoadingRequests(true);
        const joinRequestsRef = collection(db, 'chats', chatId, 'joinRequests');
        const requestsQuery = query(
          joinRequestsRef,
          where('status', '==', 'pending')
        );
        const requestsSnapshot = await getDocs(requestsQuery);
        
        const requests = requestsSnapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
        }));
        
        setJoinRequests(requests);
        console.log(`✅ [ChatSettingsScreen] Loaded ${requests.length} pending join requests`);
        
        // Fetch user data for each join request
        if (requests.length > 0) {
          fetchJoinRequestUserData(requests);
        }
      } catch (error) {
        console.log('Error fetching join requests:', error);
        setJoinRequests([]);
      } finally {
        setLoadingRequests(false);
      }
    };

    if (isFocused) {
      fetchJoinRequests();
    }
  }, [chatId, isGroupChat, isAdmin, isFocused]);

  // Fetch user data for join requests from Firestore
  const fetchJoinRequestUserData = async (requests) => {
    if (!requests || requests.length === 0) return;

    try {
      const userDataMap = {};
      
      for (const request of requests) {
        const userId = request.userId;
        if (!userId || joinRequestUserDataMap[userId]) {
          // Skip if already fetched
          continue;
        }

        try {
          // Try buyer collection first (since only buyers can request to join)
          let userDocRef = doc(db, 'buyer', userId);
          let userSnap = await getDoc(userDocRef);
          
          // If not found in buyer, try admin collection
          if (!userSnap.exists()) {
            userDocRef = doc(db, 'admin', userId);
            userSnap = await getDoc(userDocRef);
          }
          
          // If not found in admin, try supplier collection
          if (!userSnap.exists()) {
            userDocRef = doc(db, 'supplier', userId);
            userSnap = await getDoc(userDocRef);
          }

          if (userSnap.exists()) {
            const data = userSnap.data();
            
            // Get name - try multiple possible fields
            const name = data?.fullName ||
                        `${data?.firstName || ''} ${data?.lastName || ''}`.trim() ||
                        data?.name ||
                        data?.email ||
                        request.userName || // Fallback to stored name
                        'Unknown User';
            
            // Get avatar
            const avatarUrl = data?.profilePhotoUrl || 
                            data?.profileImage || 
                            request.userAvatar || 
                            '';
            
            userDataMap[userId] = { name, avatarUrl };
            console.log(`✅ [ChatSettingsScreen] Fetched user data for ${userId}: ${name}`);
          } else {
            // If user not found, use stored data from request
            userDataMap[userId] = {
              name: request.userName || 'Unknown User',
              avatarUrl: request.userAvatar || ''
            };
            console.log(`⚠️ [ChatSettingsScreen] User ${userId} not found in Firestore, using stored name: ${request.userName}`);
          }
        } catch (error) {
          console.log(`Error fetching user data for ${userId}:`, error);
          // Fallback to stored data
          userDataMap[userId] = {
            name: request.userName || 'Unknown User',
            avatarUrl: request.userAvatar || ''
          };
        }
      }

      // Update state with fetched user data
      if (Object.keys(userDataMap).length > 0) {
        setJoinRequestUserDataMap(prev => ({ ...prev, ...userDataMap }));
      }
    } catch (error) {
      console.log('Error fetching join request user data:', error);
    }
  };

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
                console.log(`❌ [ChatSettingsScreen] Error fetching data for ${uid}:`, err);
              } finally {
                // Remove from fetching set
                fetchingRef.current.delete(uid);
              }
            })();
          }
          
          return prevMap;
        });
      } catch (err) {
        console.log('❌ [ChatSettingsScreen] Error in fetchParticipantData:', err);
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
      
      // Determine which user type to search based on current user's role
      // RULE: Sellers can only search for suppliers and admins
      // RULE: Buyers can only search for buyers and admins
      // RULE: Admins can search for all user types (buyers, suppliers, and admins)
      let userTypeToSearch = null; // null means fetch all types (for admins)
      
      if (isAdmin) {
        // Admins can search all types - we'll fetch both buyers and suppliers
        userTypeToSearch = null;
      } else if (isSeller) {
        userTypeToSearch = 'supplier';
      } else if (isBuyer) {
        userTypeToSearch = 'buyer';
      } else {
        userTypeToSearch = 'buyer'; // Default to buyer if unknown
      }
      
      console.log('ChatSettingsScreen: Fetching users', {
        isSeller,
        isBuyer,
        isAdmin,
        userTypeToSearch,
        query
      });
      
      const allResults = [];
      const searchQuery = query && query.trim().length >= 2 ? query.trim() : '';
      const encodedQuery = encodeURIComponent(searchQuery);
      const authToken = await getStoredAuthToken();
      
      // For admins, fetch both buyers and suppliers
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
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
                email: user.email || '',
                avatarUrl: user.profileImage || '',
                userType: user.userType || 'buyer'
              }));
              allResults.push(...buyerResults);
              console.log(`✅ Added ${buyerResults.length} buyers to admin results`);
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
                name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
                email: user.email || '',
                avatarUrl: user.profileImage || '',
                userType: user.userType || 'supplier'
              }));
              allResults.push(...supplierResults);
              console.log(`✅ Added ${supplierResults.length} suppliers to admin results`);
            }
          }
        } catch (supplierError) {
          console.log('Error fetching suppliers for admin:', supplierError);
        }
      } else {
        // For non-admins, fetch based on userTypeToSearch
        const apiUrl = `${API_ENDPOINTS.SEARCH_USER}?query=${encodedQuery}&userType=${userTypeToSearch}&limit=50&offset=0`;
        const response = await fetch(apiUrl, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${authToken}`
          }
        });
        
        if (!response.ok) {
          throw new Error(`Failed to fetch users: ${response.status}`);
        }
        
        const data = await response.json();
        
        // Process search results if available
        if (data && data.success && data.results) {
          // Map search results
          const searchResults = data.results.map(user => ({
            id: user.id,
            name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
            email: user.email || '',
            avatarUrl: user.profileImage || '',
            userType: user.userType || userTypeToSearch
          }));
          allResults.push(...searchResults);
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
          // Apply client-side search filter for admins
          let admins = adminData.data.map(admin => ({
            id: admin.adminId || admin.id || admin.uid,
            name: admin.fullName || `${admin.firstName || ''} ${admin.lastName || ''}`.trim() || admin.email || 'Unknown',
            email: admin.email || '',
            avatarUrl: admin.profileImage || admin.profilePhotoUrl || '',
            userType: admin.role || 'admin'
          }));
          
          // Filter admins by search query if provided
          if (searchQuery) {
            const searchTerm = searchQuery.toLowerCase();
            admins = admins.filter(admin => {
              const name = (admin.name || '').toLowerCase();
              const email = (admin.email || '').toLowerCase();
              return name.includes(searchTerm) || email.includes(searchTerm);
            });
          }
          
          allResults.push(...admins);
        }
      } catch (adminError) {
        console.log('Error fetching admins in ChatSettingsScreen:', adminError);
        // Continue without admins if fetch fails
      }
      
      // Format all results (search results + admins)
      if (allResults.length > 0) {
        const formattedUsers = await Promise.all(allResults.map(async user => {
          let avatarUrl = AvatarImage;
          
          if (user.avatarUrl || user.profileImage) {
            avatarUrl = { uri: user.avatarUrl || user.profileImage };
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
            name: user.name || `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email || 'Unknown',
            avatarUrl: avatarUrl,
            uid: user.id,
            email: user.email || '',
          };
        }));
        
        setAvailableUsers(formattedUsers);
        setFilteredUsers(formattedUsers);
      } else {
        // No results found (neither search results nor admins)
        setAvailableUsers([]);
        setFilteredUsers([]);
      }
    } catch (error) {
      console.log('Error fetching users:', error);
      Alert.alert('Error', 'Failed to load users. Please try again later.');
      setAvailableUsers([]);
      setFilteredUsers([]);
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
      console.log('Error adding member:', error);
      Alert.alert('Error', 'Failed to add member. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleToggleVisibility = async (newValue) => {
    if (!chatId || !isGroupChat) return;
    
    try {
      setUpdatingVisibility(true);
      const chatDocRef = doc(db, 'chats', chatId);
      await updateDoc(chatDocRef, {
        isPublic: newValue
      });
      setIsPublic(newValue);
      console.log('✅ [ChatSettingsScreen] Updated group visibility to:', newValue ? 'Public' : 'Private');
    } catch (error) {
      console.log('Error updating group visibility:', error);
      Alert.alert('Error', 'Failed to update group visibility. Please try again.');
      // Revert the toggle on error
      setIsPublic(!newValue);
    } finally {
      setUpdatingVisibility(false);
    }
  };

  const handleApproveRequest = async (request) => {
    if (!chatId || !request || !request.userId) return;

    try {
      setLoading(true);
      
      // Add user to group participants
      const newParticipant = {
        uid: request.userId,
        name: request.userName || 'Unknown User',
        avatarUrl: request.userAvatar || '',
      };
      
      await updateDoc(doc(db, 'chats', chatId), {
        participants: arrayUnion(newParticipant),
        participantIds: arrayUnion(request.userId),
      });
      
      // Update request status to approved
      const requestRef = doc(db, 'chats', chatId, 'joinRequests', request.id);
      await updateDoc(requestRef, {
        status: 'approved',
        reviewedAt: Timestamp.now(),
        reviewedBy: currentUserUid,
      });
      
      // Remove from join requests list
      setJoinRequests(prev => prev.filter(r => r.id !== request.id));
      
      // Refresh participants
      const chatDocRef = doc(db, 'chats', chatId);
      const chatDocSnap = await getDoc(chatDocRef);
      if (chatDocSnap.exists()) {
        const chatData = chatDocSnap.data();
        setParticipants(Array.isArray(chatData.participants) ? chatData.participants : []);
      }
      
      Alert.alert('Success', `${request.userName || 'User'} has been added to the group.`);
    } catch (error) {
      console.log('Error approving join request:', error);
      Alert.alert('Error', 'Failed to approve join request. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleRejectRequest = async (request) => {
    if (!chatId || !request) return;

    Alert.alert(
      'Reject Join Request',
      `Are you sure you want to reject ${request.userName || 'this user'}'s join request?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setLoading(true);
              
              // Update request status to rejected
              const requestRef = doc(db, 'chats', chatId, 'joinRequests', request.id);
              await updateDoc(requestRef, {
                status: 'rejected',
                reviewedAt: Timestamp.now(),
                reviewedBy: currentUserUid,
              });
              
              // Remove from join requests list
              setJoinRequests(prev => prev.filter(r => r.id !== request.id));
              
              Alert.alert('Success', 'Join request has been rejected.');
            } catch (error) {
              console.log('Error rejecting join request:', error);
              Alert.alert('Error', 'Failed to reject join request. Please try again.');
            } finally {
              setLoading(false);
            }
          },
        },
      ]
    );
  };

  // Handle join request for buyers
  const handleJoinRequest = async () => {
    if (!chatId || !currentUserUid || !isPublic || isMember || !isBuyer) return;

    try {
      setRequestingJoin(true);
      
      // Get user info for the request
      const userName = userInfo?.data?.fullName || 
                      userInfo?.user?.fullName || 
                      `${userInfo?.data?.firstName || ''} ${userInfo?.data?.lastName || ''}`.trim() ||
                      `${userInfo?.user?.firstName || ''} ${userInfo?.user?.lastName || ''}`.trim() ||
                      userInfo?.data?.email ||
                      userInfo?.user?.email ||
                      'Unknown User';
      
      const userAvatar = userInfo?.data?.profileImage || 
                        userInfo?.data?.profilePhotoUrl || 
                        userInfo?.user?.profileImage || 
                        userInfo?.user?.profilePhotoUrl || 
                        '';
      
      // Check if request already exists
      const joinRequestsRef = collection(db, 'chats', chatId, 'joinRequests');
      const existingRequestQuery = query(
        joinRequestsRef,
        where('userId', '==', currentUserUid),
        where('status', '==', 'pending')
      );
      const existingSnapshot = await getDocs(existingRequestQuery);
      
      if (!existingSnapshot.empty) {
        Alert.alert('Info', 'You already have a pending join request for this group.');
        setHasPendingRequest(true);
        setRequestingJoin(false);
        return;
      }
      
      // Create join request
      const joinRequest = {
        userId: currentUserUid,
        userName: userName,
        userAvatar: userAvatar,
        status: 'pending',
        requestedAt: Timestamp.now(),
      };
      
      await addDoc(joinRequestsRef, joinRequest);
      setHasPendingRequest(true);
      Alert.alert('Success', 'Your join request has been submitted. An admin will review it.');
    } catch (error) {
      console.log('Error submitting join request:', error);
      Alert.alert('Error', 'Failed to submit join request. Please try again.');
    } finally {
      setRequestingJoin(false);
    }
  };

  // Handle invitation acceptance for sellers
  const handleAcceptInvitation = async () => {
    if (!chatId || !currentUserUid || !isPublic || isMember || !isSeller || !isInvited) return;

    Alert.alert(
      'Accept Invitation',
      'Are you sure you want to join this group?',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Accept',
          onPress: async () => {
            try {
              setAcceptingInvitation(true);
              
              // Get user info
              const userName = userInfo?.data?.fullName || 
                              userInfo?.user?.fullName || 
                              `${userInfo?.data?.firstName || ''} ${userInfo?.data?.lastName || ''}`.trim() ||
                              `${userInfo?.user?.firstName || ''} ${userInfo?.user?.lastName || ''}`.trim() ||
                              userInfo?.data?.email ||
                              userInfo?.user?.email ||
                              'Unknown User';
              
              const userAvatar = userInfo?.data?.profileImage || 
                                userInfo?.data?.profilePhotoUrl || 
                                userInfo?.user?.profileImage || 
                                userInfo?.user?.profilePhotoUrl || 
                                '';
              
              // Add user to group participants
              const newParticipant = {
                uid: currentUserUid,
                name: userName,
                avatarUrl: userAvatar,
              };
              
              // Update chat document: add to participants and remove from invitedUsers
              await updateDoc(doc(db, 'chats', chatId), {
                participants: arrayUnion(newParticipant),
                participantIds: arrayUnion(currentUserUid),
                invitedUsers: arrayRemove(currentUserUid),
              });
              
              // Refresh participants
              const chatDocRef = doc(db, 'chats', chatId);
              const chatDocSnap = await getDoc(chatDocRef);
              if (chatDocSnap.exists()) {
                const chatData = chatDocSnap.data();
                setParticipants(Array.isArray(chatData.participants) ? chatData.participants : []);
              }
              
              setIsMember(true);
              setIsInvited(false);
              Alert.alert('Success', 'You have joined the group!');
            } catch (error) {
              console.log('Error accepting invitation:', error);
              Alert.alert('Error', 'Failed to accept invitation. Please try again.');
            } finally {
              setAcceptingInvitation(false);
            }
          },
        },
      ]
    );
  };

  // Handle invitation decline for sellers
  const handleDeclineInvitation = async () => {
    if (!chatId || !currentUserUid || !isPublic || !isSeller || !isInvited) return;

    Alert.alert(
      'Decline Invitation',
      'Are you sure you want to decline this invitation? You will not be able to see this group anymore.',
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Decline',
          style: 'destructive',
          onPress: async () => {
            try {
              // Remove user from invitedUsers
              await updateDoc(doc(db, 'chats', chatId), {
                invitedUsers: arrayRemove(currentUserUid),
              });
              
              setIsInvited(false);
              Alert.alert('Success', 'Invitation declined.');
              
              // Navigate back to messages list
              navigation.goBack();
            } catch (error) {
              console.log('Error declining invitation:', error);
              Alert.alert('Error', 'Failed to decline invitation. Please try again.');
            }
          },
        },
      ]
    );
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
              // Navigate back to MessagesScreen (list of all chats) after leaving
              // Use a robust navigation approach that works for all user types (buyer, seller, admin)
              // The navigation stack depth may vary, so we use goBack with safety checks
              
              // First, go back from ChatSettingsScreen
              if (navigation.canGoBack()) {
                navigation.goBack();
                
                // After a short delay, check if we can go back again
                // For buyers: ChatSettingsScreen -> ChatScreen -> MessagesScreen (need 2 goBacks)
                // For sellers: ChatSettingsScreen -> MessagesScreen (need 1 goBack)
                setTimeout(() => {
                  if (navigation.canGoBack()) {
                    navigation.goBack();
                  } else {
                    // If we can't go back, try navigating directly to MessagesScreen or Chat
                    // This handles edge cases where navigation stack is different
                    try {
                      navigation.navigate('MessagesScreen');
                    } catch {
                      try {
                        navigation.navigate('Chat');
                      } catch {
                        // If all navigation fails, do nothing (user is already at the right screen)
                      }
                    }
                  }
                }, 300);
              } else {
                // If we can't go back at all, try navigating directly
                try {
                  navigation.navigate('MessagesScreen');
                } catch {
                  try {
                    navigation.navigate('Chat');
                  } catch {
                    // Navigation failed, but that's okay
                  }
                }
              }
            } catch (error) {
              console.log('Error leaving group:', error);
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
              console.log('Error removing member:', error);
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
              // Navigate back to MessagesScreen (list of all chats) after deleting
              // Use goBack() twice to go back through ChatScreen to MessagesScreen
              // This works regardless of navigation context (admin, buyer, seller)
              navigation.goBack(); // Go back from ChatSettingsScreen to ChatScreen
              setTimeout(() => {
                navigation.goBack(); // Go back from ChatScreen to MessagesScreen
              }, 300);
            } catch (error) {
              console.log('Error deleting chat:', error);
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
          {/* Join Request Section for Buyers - Show at top if not a member */}
          {isBuyer && !isMember && isPublic && (
            <>
              <View style={styles.section}>
                <View style={styles.joinRequestSection}>
                  {hasRejectedRequest ? (
                    <View style={styles.rejectedRequestBanner}>
                      <Text style={styles.rejectedRequestText}>
                        Your join request was rejected. You cannot access this group.
                      </Text>
                    </View>
                  ) : hasPendingRequest ? (
                    <View style={styles.pendingRequestBanner}>
                      <Text style={styles.pendingRequestText}>
                        Your join request is pending approval
                      </Text>
                    </View>
                  ) : (
                    <>
                      <Text style={styles.joinRequestTitle}>Join This Group</Text>
                      <Text style={styles.joinRequestDescription}>
                        Request to join this public group. An admin will review your request.
                      </Text>
                      <TouchableOpacity
                        style={styles.joinRequestButton}
                        onPress={handleJoinRequest}
                        disabled={requestingJoin}>
                        <Text style={styles.joinRequestButtonText}>
                          {requestingJoin ? 'Submitting...' : 'Join Group'}
                        </Text>
                      </TouchableOpacity>
                    </>
                  )}
                </View>
              </View>
              <View style={styles.divider} />
            </>
          )}

          {/* Invitation Section for Sellers - Show at top if invited but not a member */}
          {isSeller && !isMember && isPublic && isInvited && (
            <>
              <View style={styles.section}>
                <View style={styles.joinRequestSection}>
                  <Text style={styles.joinRequestTitle}>You've Been Invited!</Text>
                  <Text style={styles.joinRequestDescription}>
                    You have been invited to join this public group. Accept to become a member and start chatting.
                  </Text>
                  <View style={styles.invitationButtons}>
                    <TouchableOpacity
                      style={[styles.invitationButton, styles.declineButton]}
                      onPress={handleDeclineInvitation}
                      disabled={acceptingInvitation}>
                      <Text style={styles.declineButtonText}>Decline</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.invitationButton, styles.acceptButton]}
                      onPress={handleAcceptInvitation}
                      disabled={acceptingInvitation}>
                      <Text style={styles.acceptButtonText}>
                        {acceptingInvitation ? 'Joining...' : 'Accept'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
              <View style={styles.divider} />
            </>
          )}

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

          {/* Group Visibility Toggle - Only show for admins */}
          {isAdmin && (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <View style={styles.toggleRow}>
                  <View style={styles.toggleLabelContainer}>
                    <Text style={styles.toggleLabel}>Public Group</Text>
                    <Text style={styles.toggleDescription}>
                      {isPublic 
                        ? 'Anyone can join this group' 
                        : 'Only invited members can join'}
                    </Text>
                  </View>
                  <Switch
                    value={isPublic}
                    onValueChange={handleToggleVisibility}
                    disabled={updatingVisibility}
                    trackColor={{ false: '#E5E8EA', true: '#539461' }}
                    thumbColor={isPublic ? '#fff' : '#f4f3f4'}
                    ios_backgroundColor="#E5E8EA"
                  />
                </View>
              </View>
            </>
          )}

          {/* Join Requests Section - Only show for admins in public groups */}
          {isAdmin && isPublic && (
            <>
              <View style={styles.divider} />
              <View style={styles.section}>
                <View style={styles.sectionHeaderContainer}>
                  <Text style={styles.sectionHeader}>Join Requests</Text>
                  {joinRequests.length > 0 && (
                    <Text style={styles.requestCount}>{joinRequests.length} pending</Text>
                  )}
                </View>
                {loadingRequests ? (
                  <View style={styles.loadingContainer}>
                    <ActivityIndicator size="small" color="#539461" />
                    <Text style={styles.loadingText}>Loading requests...</Text>
                  </View>
                ) : joinRequests.length === 0 ? (
                  <Text style={styles.emptyRequestsText}>No pending join requests</Text>
                ) : (
                  <FlatList
                    data={joinRequests}
                    keyExtractor={(item) => item.id}
                    scrollEnabled={true}
                    nestedScrollEnabled={true}
                    renderItem={({item}) => {
                      // Get latest user data from Firestore if available, otherwise use stored data
                      const userData = joinRequestUserDataMap[item.userId];
                      const displayName = userData?.name || item.userName || 'Unknown User';
                      const displayAvatar = userData?.avatarUrl || item.userAvatar || '';
                      
                      return (
                        <View style={styles.requestItem}>
                          <Image
                            source={displayAvatar ? { uri: displayAvatar } : AvatarImage}
                            style={styles.requestAvatar}
                            defaultSource={AvatarImage}
                          />
                          <View style={styles.requestInfo}>
                            <Text style={styles.requestName}>{displayName}</Text>
                            <Text style={styles.requestDate}>
                              Requested {item.requestedAt?.toDate ? 
                                new Date(item.requestedAt.toDate()).toLocaleDateString() : 
                                'recently'}
                            </Text>
                          </View>
                        <View style={styles.requestActions}>
                          <TouchableOpacity
                            style={[styles.requestButton, styles.approveButton]}
                            onPress={() => handleApproveRequest(item)}
                            disabled={loading}>
                            <Text style={styles.approveButtonText}>Approve</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={[styles.requestButton, styles.rejectButton]}
                            onPress={() => handleRejectRequest(item)}
                            disabled={loading}>
                            <Text style={styles.rejectButtonText}>Reject</Text>
                          </TouchableOpacity>
                        </View>
                        </View>
                      );
                    }}
                    style={styles.requestsList}
                  />
                )}
              </View>
            </>
          )}

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

          {/* Leave Group Button - Show for non-admin users who are members */}
          {!isAdmin && isMember && (
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
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  toggleLabelContainer: {
    flex: 1,
    marginRight: 16,
  },
  toggleLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 14,
    color: '#647276',
    lineHeight: 20,
  },
  requestCount: {
    fontSize: 14,
    color: '#539461',
    fontWeight: '600',
  },
  emptyRequestsText: {
    fontSize: 14,
    color: '#647276',
    textAlign: 'center',
    paddingVertical: 16,
  },
  requestsList: {
    maxHeight: 300,
  },
  requestItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EA',
  },
  requestAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    backgroundColor: '#f5f5f5',
    borderWidth: 1,
    borderColor: '#E5E8EA',
  },
  requestInfo: {
    flex: 1,
    marginRight: 12,
  },
  requestName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    marginBottom: 4,
  },
  requestDate: {
    fontSize: 12,
    color: '#647276',
  },
  requestActions: {
    flexDirection: 'row',
    gap: 8,
  },
  requestButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    minWidth: 70,
    alignItems: 'center',
  },
  approveButton: {
    backgroundColor: '#539461',
  },
  approveButtonText: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '600',
  },
  rejectButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CDD3D4',
  },
  rejectButtonText: {
    color: '#393D40',
    fontSize: 14,
    fontWeight: '600',
  },
  joinRequestSection: {
    alignItems: 'center',
  },
  joinRequestTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 8,
    textAlign: 'center',
  },
  joinRequestDescription: {
    fontSize: 14,
    color: '#647276',
    textAlign: 'center',
    marginBottom: 20,
    lineHeight: 20,
  },
  joinRequestButton: {
    backgroundColor: '#539461',
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 32,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 200,
  },
  joinRequestButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  pendingRequestBanner: {
    backgroundColor: '#FFF4E6',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFD89B',
    width: '100%',
  },
  pendingRequestText: {
    color: '#8B6914',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  rejectedRequestBanner: {
    backgroundColor: '#FFEBEE',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#FFCDD2',
    width: '100%',
  },
  rejectedRequestText: {
    color: '#C62828',
    fontSize: 14,
    fontWeight: '500',
    textAlign: 'center',
  },
  invitationButtons: {
    flexDirection: 'row',
    gap: 12,
    width: '100%',
    marginTop: 8,
  },
  invitationButton: {
    flex: 1,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  acceptButton: {
    backgroundColor: '#539461',
  },
  acceptButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  declineButton: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#CDD3D4',
  },
  declineButtonText: {
    color: '#393D40',
    fontSize: 16,
    fontWeight: '600',
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
