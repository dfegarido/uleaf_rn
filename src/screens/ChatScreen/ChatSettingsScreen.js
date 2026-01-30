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
  ScrollView,
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
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_ENDPOINTS } from '../../config/apiConfig';
import { getStoredAuthToken } from '../../utils/getStoredAuthToken';
import { listAdminsApi } from '../../components/Api/listAdminsApi';

const AvatarImage = require('../../assets/images/AvatarBig.png');

// Search Icon SVG Component
const SearchIcon = ({ width = 24, height = 24, color = '#292929' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <G clipPath="url(#clip0_429_11090)">
      <Path
        d="M21 21L16.6569 16.6569M16.6569 16.6569C18.1046 15.2091 19 13.2091 19 11C19 6.58172 15.4183 3 11 3C6.58172 3 3 6.58172 3 11C3 15.4183 6.58172 19 11 19C13.2091 19 15.2091 18.1046 16.6569 16.6569Z"
        stroke={color}
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </G>
    <Defs>
      <ClipPath id="clip0_429_11090">
        <Rect width="24" height="24" fill="white" />
      </ClipPath>
    </Defs>
  </Svg>
);

// Add Member Icon SVG Component
const AddMemberIcon = ({ width = 24, height = 24, color = '#647276' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M20 18L17 18M17 18L14 18M17 18V15M17 18V21M11 21H4C4 17.134 7.13401 14 11 14C11.695 14 12.3663 14.1013 13 14.2899M15 7C15 9.20914 13.2091 11 11 11C8.79086 11 7 9.20914 7 7C7 4.79086 8.79086 3 11 3C13.2091 3 15 4.79086 15 7Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Edit Name Icon SVG Component (pencil)
const EditNameIcon = ({ width = 24, height = 24, color = '#647276' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M11 4H4C3.46957 4 2.96086 4.21071 2.58579 4.58579C2.21071 4.96086 2 5.46957 2 6V20C2 20.5304 2.21071 21.0391 2.58579 21.4142C2.96086 21.7893 3.46957 22 4 22H18C18.5304 22 19.0391 21.7893 19.4142 21.4142C19.7893 21.0391 20 20.5304 20 20V13"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <Path
      d="M18.5 2.50001C18.8978 2.10219 19.4374 1.87869 20 1.87869C20.5626 1.87869 21.1022 2.10219 21.5 2.50001C21.8978 2.89784 22.1213 3.4374 22.1213 4.00001C22.1213 4.56262 21.8978 5.10219 21.5 5.50001L12 15L8 16L9 12L18.5 2.50001Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Delete Group Icon SVG Component
const DeleteGroupIcon = ({ width = 24, height = 24, color = '#647276' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M3 6H5H21M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M10 11V17M14 11V17"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

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
  // Public/Private toggle state for group chats
  const [isPublic, setIsPublic] = useState(false);
  const [updatingVisibility, setUpdatingVisibility] = useState(false);
  // Member search state
  const [memberSearchText, setMemberSearchText] = useState('');
  const [filteredParticipants, setFilteredParticipants] = useState([]);
  // Add member modal selection state
  const [selectedUsersToAdd, setSelectedUsersToAdd] = useState([]);
  // User type filter for add member modal ('all', 'buyer', 'supplier')
  const [userTypeFilter, setUserTypeFilter] = useState('all');
  // Country filter for add member modal (only when Suppliers selected)
  const [countryFilter, setCountryFilter] = useState('all');
  const [countryModalVisible, setCountryModalVisible] = useState(false);
  const [userTypeModalVisible, setUserTypeModalVisible] = useState(false);
  const availableCountries = ['Philippines', 'Indonesia', 'Thailand'];
  const regionToCountry = { PH: 'Philippines', ID: 'Indonesia', TH: 'Thailand' };
  // View all members modal state
  const [viewMembersModalVisible, setViewMembersModalVisible] = useState(false);
  // Edit group name state (admin only)
  const [groupNameDisplay, setGroupNameDisplay] = useState(name || 'Group Chat');
  const [editNameModalVisible, setEditNameModalVisible] = useState(false);
  const [editNameInput, setEditNameInput] = useState('');

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

  // Helper function to deduplicate participants by UID
  const deduplicateParticipants = (participantsArray) => {
    if (!Array.isArray(participantsArray)) return [];
    
    const seen = new Set();
    return participantsArray.filter(p => {
      if (!p || !p.uid) return false;
      if (seen.has(p.uid)) {
        console.log(`⚠️ [ChatSettingsScreen] Duplicate participant found: ${p.uid}, removing duplicate`);
        return false;
      }
      seen.add(p.uid);
      return true;
    });
  };

  // Helper function to get safe avatar source - uses stored data from chat document
  const getAvatarSource = (avatarUrl) => {
    // Check if avatarUrl is a valid string URL
    if (typeof avatarUrl === 'string' && avatarUrl.trim() !== '' && avatarUrl.startsWith('http')) {
      return { uri: avatarUrl };
    }
    
    // Check if avatarUrl is an object with uri
    if (typeof avatarUrl === 'object' && avatarUrl !== null && avatarUrl.uri) {
      return { uri: avatarUrl.uri };
    }
    
    // Fallback to default avatar
    return AvatarImage;
  };

  // Helper function to get participant name - uses stored data from chat document
  const getParticipantName = (participant) => {
    return participant?.name || 'Unknown';
  };

  // Filter participants based on search text
  const filterParticipants = (searchQuery) => {
    if (!searchQuery.trim()) {
      setFilteredParticipants(participants || []);
      return;
    }

    const query = searchQuery.toLowerCase().trim();
    const filtered = (participants || []).filter(participant => {
      // Use stored name from chat document
      const displayName = participant?.name || '';
      return displayName.toLowerCase().includes(query);
    });

    setFilteredParticipants(filtered);
  };

  // Deduplicate initial participants on mount
  useEffect(() => {
    if (initialParticipants && initialParticipants.length > 0) {
      const deduped = deduplicateParticipants(initialParticipants);
      if (deduped.length !== initialParticipants.length) {
        console.log(`⚠️ [ChatSettingsScreen] Deduplicating initial participants: ${initialParticipants.length} -> ${deduped.length}`);
        setParticipants(deduped);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run once on mount

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
          console.log('📊 [ChatSettingsScreen] Raw participants from Firestore:', latestParticipants.length);
          const dedupedParticipants = deduplicateParticipants(latestParticipants);
          console.log('✅ [ChatSettingsScreen] After deduplication:', dedupedParticipants.length);
          
          // Check if data is from cache
          const fromCache = chatDocSnap.metadata.fromCache;
          const hasPendingWrites = chatDocSnap.metadata.hasPendingWrites;
          console.log(`📡 [ChatSettingsScreen] Data source - fromCache: ${fromCache}, hasPendingWrites: ${hasPendingWrites}`);
          
          setParticipants(dedupedParticipants);
          
          // Load isPublic and name for group chats
          if (isGroupChat) {
            const publicStatus = chatData.isPublic === true;
            setIsPublic(publicStatus);
            if (chatData.name != null && chatData.name !== '') {
              setGroupNameDisplay(chatData.name);
            }
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

  // Sync group name from route params on mount
  useEffect(() => {
    if (name) setGroupNameDisplay(name);
  }, [name]);

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
            
            // Get name - use username instead of firstName/lastName
            const name = data?.username ||
                        data?.gardenOrCompanyName ||
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

  // Initialize filtered participants when participants change or search text changes
  useEffect(() => {
    if (memberSearchText.trim() === '') {
      setFilteredParticipants(participants || []);
    } else {
      filterParticipants(memberSearchText);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants, memberSearchText]);

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
      
      // API has a limit of 100 for search queries, but 1000 for list mode (empty query)
      const apiLimit = searchQuery ? 100 : 1000;
      
      console.log('🔍 fetchUsers called with:', { 
        originalQuery: query, 
        searchQuery, 
        encodedQuery,
        apiLimit,
        isAdmin,
        isBuyer,
        isSeller
      });
      
      // For admins, fetch both buyers and suppliers
      if (isAdmin) {
        // Fetch buyers
        try {
          const buyerUrl = `${API_ENDPOINTS.SEARCH_USER}?query=${encodedQuery}&userType=buyer&limit=${apiLimit}&offset=0`;
          console.log('📞 Fetching buyers from:', buyerUrl);
          const buyerResponse = await fetch(buyerUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (buyerResponse.ok) {
            const buyerData = await buyerResponse.json();
            console.log('📦 Buyer API response:', { success: buyerData?.success, resultsCount: buyerData?.results?.length });
            if (buyerData && buyerData.success && buyerData.results) {
              const buyerResults = buyerData.results.map(user => ({
                id: user.id,
                name: user.username || user.email || 'Unknown',
                email: user.email || '',
                avatarUrl: user.profileImage || '',
                userType: user.userType || 'buyer'
              }));
              allResults.push(...buyerResults);
              console.log(`✅ Added ${buyerResults.length} buyers to admin results`);
            } else {
              console.log('⚠️ No buyer results returned');
            }
          } else {
            console.log('❌ Buyer API failed with status:', buyerResponse.status);
          }
        } catch (buyerError) {
          console.log('Error fetching buyers for admin:', buyerError);
        }
        
        // Fetch suppliers
        try {
          const supplierUrl = `${API_ENDPOINTS.SEARCH_USER}?query=${encodedQuery}&userType=supplier&limit=${apiLimit}&offset=0`;
          console.log('📞 Fetching suppliers from:', supplierUrl);
          const supplierResponse = await fetch(supplierUrl, {
            method: 'GET',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${authToken}`
            }
          });
          
          if (supplierResponse.ok) {
            const supplierData = await supplierResponse.json();
            console.log('📦 Supplier API response:', { success: supplierData?.success, resultsCount: supplierData?.results?.length });
            if (supplierData && supplierData.success && supplierData.results) {
              const supplierResults = supplierData.results.map(user => ({
                id: user.id,
                name: user.username || user.email || 'Unknown',
                email: user.email || '',
                avatarUrl: user.profileImage || '',
                userType: user.userType || 'supplier',
                country: user.country || regionToCountry[user.region] || user.region || 'Unknown'
              }));
              allResults.push(...supplierResults);
              console.log(`✅ Added ${supplierResults.length} suppliers to admin results`);
            } else {
              console.log('⚠️ No supplier results returned');
            }
          } else {
            console.log('❌ Supplier API failed with status:', supplierResponse.status);
          }
        } catch (supplierError) {
          console.log('Error fetching suppliers for admin:', supplierError);
        }
      } else {
        // For non-admins, fetch based on userTypeToSearch
        const apiUrl = `${API_ENDPOINTS.SEARCH_USER}?query=${encodedQuery}&userType=${userTypeToSearch}&limit=${apiLimit}&offset=0`;
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
          // Map search results - use username instead of firstName/lastName
          const searchResults = data.results.map(user => ({
            id: user.id,
            name: user.username || user.email || 'Unknown',
            email: user.email || '',
            avatarUrl: user.profileImage || '',
            userType: user.userType || userTypeToSearch,
            country: (userTypeToSearch === 'supplier') ? (user.country || user.region || 'Unknown') : undefined
          }));
          allResults.push(...searchResults);
        }
      }
      
      // Also fetch admins (both admin and sub_admin roles)
      try {
        const adminFilters = {
          status: 'active',
          limit: 1000
        };
        const adminData = await listAdminsApi(adminFilters);
        
        if (adminData && adminData.success && Array.isArray(adminData.data)) {
          // Apply client-side search filter for admins - use username instead of firstName/lastName
          let admins = adminData.data.map(admin => ({
            id: admin.adminId || admin.id || admin.uid,
            name: admin.username || admin.email || 'Unknown',
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
            name: user.name || user.username || user.email || 'Unknown',
            avatarUrl: avatarUrl,
            uid: user.id,
            email: user.email || '',
            userType: user.userType || 'buyer',
            country: user.country || regionToCountry[user.region] || user.region || 'Unknown'
          };
        }));
        
        // Debug: Log userType distribution
        const buyerCount = formattedUsers.filter(u => u.userType === 'buyer').length;
        const supplierCount = formattedUsers.filter(u => u.userType === 'supplier').length;
        const adminCount = formattedUsers.filter(u => u.userType === 'admin' || u.userType === 'sub_admin').length;
        console.log(`📊 User type distribution: Buyers=${buyerCount}, Suppliers=${supplierCount}, Admins=${adminCount}`);
        console.log(`🎯 Total users to display: ${formattedUsers.length}`);
        
        setAvailableUsers(formattedUsers);
        setFilteredUsers(formattedUsers);
      } else {
        // No results found (neither search results nor admins)
        console.log('⚠️ No results found at all - setting empty arrays');
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
        const rawParticipants = Array.isArray(chatData.participants) ? chatData.participants : [];
        setParticipants(deduplicateParticipants(rawParticipants));
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

  // Handle adding selected users (bulk add)
  const handleAddSelectedMembers = async () => {
    if (selectedUsersToAdd.length === 0) {
      Alert.alert('Error', 'Please select at least one user to add.');
      return;
    }

    try {
      setLoading(true);

      // Prepare new participants
      const newParticipants = selectedUsersToAdd.map(user => ({
        uid: user.uid,
        name: user.name,
        avatarUrl: typeof user.avatarUrl === 'object' && user.avatarUrl.uri
          ? user.avatarUrl.uri
          : (typeof user.avatarUrl === 'string' ? user.avatarUrl : ''),
      }));

      const newParticipantIds = selectedUsersToAdd.map(user => user.uid);

      // Add all users to the chat's participants and participantIds
      await updateDoc(doc(db, 'chats', chatId), {
        participants: arrayUnion(...newParticipants),
        participantIds: arrayUnion(...newParticipantIds),
      });

      // Refresh the chat document to get the latest data
      const chatDocRef = doc(db, 'chats', chatId);
      const chatDocSnap = await getDoc(chatDocRef);

      if (chatDocSnap.exists()) {
        const chatData = chatDocSnap.data();
        const rawParticipants = Array.isArray(chatData.participants) ? chatData.participants : [];
        setParticipants(deduplicateParticipants(rawParticipants));
      }

      // Remove added users from available users list
      const addedUids = new Set(newParticipantIds);
      setAvailableUsers(prev => prev.filter(u => !addedUids.has(u.uid)));
      setFilteredUsers(prev => prev.filter(u => !addedUids.has(u.uid)));

      // Clear selection
      setSelectedUsersToAdd([]);
      setAddMemberModalVisible(false);

      Alert.alert(
        'Success',
        `${selectedUsersToAdd.length} ${selectedUsersToAdd.length === 1 ? 'member has' : 'members have'} been added to the group.`
      );
    } catch (error) {
      console.log('Error adding members:', error);
      Alert.alert('Error', 'Failed to add members. Please try again.');
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
        const rawParticipants = Array.isArray(chatData.participants) ? chatData.participants : [];
        setParticipants(deduplicateParticipants(rawParticipants));
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
  // Auto-approve: Create join request with status 'approved' and add user to group immediately
  const handleJoinRequest = async () => {
    if (!chatId || !currentUserUid || !isPublic || isMember || !isBuyer) return;

    try {
      setRequestingJoin(true);
      
      // Get user info for the request - use username instead of firstName/lastName
      const userName = userInfo?.data?.username || 
                      userInfo?.user?.username || 
                      userInfo?.username ||
                      userInfo?.data?.email ||
                      userInfo?.user?.email ||
                      'Unknown User';
      
      const userAvatar = userInfo?.data?.profileImage || 
                        userInfo?.data?.profilePhotoUrl || 
                        userInfo?.user?.profileImage || 
                        userInfo?.user?.profilePhotoUrl || 
                        '';
      
      // Check if user is already a member (double-check)
      const chatDocRef = doc(db, 'chats', chatId);
      const chatDocSnap = await getDoc(chatDocRef);
      if (chatDocSnap.exists()) {
        const chatData = chatDocSnap.data();
        const memberIds = Array.isArray(chatData.participantIds) ? chatData.participantIds : [];
        if (memberIds.includes(currentUserUid)) {
          setIsMember(true);
          setHasPendingRequest(false);
          setRequestingJoin(false);
          Alert.alert('Info', 'You are already a member of this group.');
          return;
        }
      }
      
      // Prepare new participant object
      const newParticipant = {
        uid: currentUserUid,
        name: userName,
        avatarUrl: userAvatar,
      };
      
      // Add user to group participants and create approved join request in one batch
      await updateDoc(chatDocRef, {
        participants: arrayUnion(newParticipant),
        participantIds: arrayUnion(currentUserUid),
      });
      
      // Create join request record with status 'approved' (for tracking)
      const joinRequestsRef = collection(db, 'chats', chatId, 'joinRequests');
      const approvedJoinRequest = {
        userId: currentUserUid,
        userName: userName,
        userAvatar: userAvatar,
        status: 'approved',
        requestedAt: Timestamp.now(),
        reviewedAt: Timestamp.now(),
        reviewedBy: 'auto-approved',
        autoApproved: true,
      };
      
      await addDoc(joinRequestsRef, approvedJoinRequest);
      
      // Update local state
      setIsMember(true);
      setHasPendingRequest(false);
      
      // Refresh participants list
      const updatedChatDocSnap = await getDoc(chatDocRef);
      if (updatedChatDocSnap.exists()) {
        const updatedChatData = updatedChatDocSnap.data();
        const updatedParticipants = Array.isArray(updatedChatData.participants) 
          ? updatedChatData.participants 
          : [];
        setParticipants(updatedParticipants);
      }
      
      Alert.alert('Success', 'You have successfully joined the group!');
    } catch (error) {
      console.log('Error joining group:', error);
      Alert.alert('Error', 'Failed to join group. Please try again.');
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
              
              // Get user info - use username instead of firstName/lastName
              const userName = userInfo?.data?.username || 
                              userInfo?.user?.username || 
                              userInfo?.username ||
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
                const rawParticipants = Array.isArray(chatData.participants) ? chatData.participants : [];
                setParticipants(deduplicateParticipants(rawParticipants));
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
      `Are you sure you want to leave "${groupNameDisplay || 'this group'}"?`,
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

  const openEditNameModal = () => {
    setEditNameInput(groupNameDisplay);
    setEditNameModalVisible(true);
  };

  const handleUpdateGroupName = async () => {
    const trimmed = (editNameInput || '').trim();
    if (!trimmed) {
      Alert.alert('Error', 'Please enter a group name.');
      return;
    }
    if (trimmed === groupNameDisplay) {
      setEditNameModalVisible(false);
      return;
    }
    setLoading(true);
    try {
      await updateDoc(doc(db, 'chats', chatId), { name: trimmed });
      setGroupNameDisplay(trimmed);
      setEditNameModalVisible(false);
      // Navigate back to ChatScreen with updated name so header updates
      navigation.navigate('ChatScreen', {
        id: chatId,
        chatId,
        participants,
        participantIds: participants.map(p => p.uid).filter(Boolean),
        name: trimmed,
        type: 'group',
      });
      Alert.alert('Success', 'Group name updated.');
    } catch (error) {
      console.log('Error updating group name:', error);
      Alert.alert('Error', 'Failed to update group name. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const openAddMemberModal = () => {
    setAddMemberModalVisible(true);
    setSearchText('');
    setAvailableUsers([]);
    setFilteredUsers([]);
    setSelectedUsersToAdd([]);
    setUserTypeFilter('all');
    setCountryFilter('all');
    setUserTypeModalVisible(false);
  };

  // Helper: apply userType + country filters to get display list
  const applyUserAndCountryFilter = (users) => {
    return users.filter(user => {
      if (participants?.some(p => p.uid === user.uid)) return false;
      if (userTypeFilter !== 'all' && user.userType !== userTypeFilter) return false;
      if (userTypeFilter === 'supplier' && countryFilter !== 'all' && user.country !== countryFilter) return false;
      return true;
    });
  };

  // Toggle user selection in Add Member modal
  const toggleUserSelection = (user) => {
    setSelectedUsersToAdd(prev => {
      const isSelected = prev.some(u => u.uid === user.uid);
      if (isSelected) {
        return prev.filter(u => u.uid !== user.uid);
      } else {
        return [...prev, user];
      }
    });
  };

  // Select all users or deselect all (respects user type filter)
  const handleSelectAll = () => {
    const availableToAdd = applyUserAndCountryFilter(filteredUsers);

    if (selectedUsersToAdd.length === availableToAdd.length && availableToAdd.length > 0) {
      // All are selected, deselect all
      setSelectedUsersToAdd([]);
    } else {
      // Select all available users (with current filter)
      setSelectedUsersToAdd(availableToAdd);
    }
  };

  // Skeleton loading component for user items in Add Member modal
  const SkeletonUserItem = ({ index = 0 }) => (
    <View style={[
      styles.userItem,
      index !== 4 && styles.userItemBorder
    ]}>
      <View style={styles.skeletonAvatar} />
      <View style={styles.userItemInfo}>
        <View style={[styles.skeletonName, { width: 120 + (index % 3) * 30 }]} />
        <View style={[styles.skeletonEmail, { width: 80 + (index % 4) * 20 }]} />
      </View>
    </View>
  );

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
        <View style={{flex: 1}} />
        <View style={{width: 24}} />
      </View>

      <ScrollView 
        style={{flex: 1}}
        contentContainerStyle={{paddingBottom: insets.bottom + 20}}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={true}>
        {isGroupChat ? (
        <>
          {/* Group Info Section - Centered at top */}
          <View style={styles.groupInfoHeader}>
            {/* Overlapping Group Avatars */}
            <View style={styles.groupAvatarsContainer}>
              {participants.slice(0, 2).map((participant, index) => (
                <View 
                  key={participant.uid} 
                  style={[
                    styles.groupAvatarWrapper,
                    index === 1 && { marginLeft: -15 }
                  ]}
                >
                  <Image
                    source={getAvatarSource(participant.avatarUrl)}
                    style={styles.groupAvatar}
                    defaultSource={AvatarImage}
                  />
                </View>
              ))}
            </View>
            
            {/* Group Name - Full, no truncation */}
            <Text style={styles.groupNameFull}>{groupNameDisplay || 'Group Chat'}</Text>
            
            {/* Member Count */}
            <Text style={styles.groupMemberCount}>
              {`${participants.length} ${participants.length === 1 ? 'member' : 'members'}`}
            </Text>
            
            {/* Action Buttons - Add Member, Edit Name, Delete Group (admin) / Leave Group (member) */}
            <View style={styles.groupActionButtons}>
              {isAdmin && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={openAddMemberModal}
                  activeOpacity={0.7}
                  accessibilityLabel="Add Member">
                  <View style={styles.actionButtonIcon}>
                    <AddMemberIcon width={24} height={24} color="#647276" />
                  </View>
                  <Text style={styles.actionButtonText}>Add Member</Text>
                </TouchableOpacity>
              )}
              {isAdmin && (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={openEditNameModal}
                  activeOpacity={0.7}
                  accessibilityLabel="Edit Name">
                  <View style={styles.actionButtonIcon}>
                    <EditNameIcon width={24} height={24} color="#647276" />
                  </View>
                  <Text style={styles.actionButtonText}>Edit Name</Text>
                </TouchableOpacity>
              )}
              {isAdmin ? (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={deleteChat}
                  activeOpacity={0.7}
                  accessibilityLabel="Delete Group">
                  <View style={styles.actionButtonIcon}>
                    <DeleteGroupIcon width={24} height={24} color="#FF3B30" />
                  </View>
                  <Text style={[styles.actionButtonText, {color: '#FF3B30'}]}>Delete Group</Text>
                </TouchableOpacity>
              ) : isMember ? (
                <TouchableOpacity 
                  style={styles.actionButton}
                  onPress={handleLeaveGroup}
                  activeOpacity={0.7}
                  accessibilityLabel="Leave Group">
                  <View style={styles.actionButtonIcon}>
                    <DeleteGroupIcon width={24} height={24} color="#FF3B30" />
                  </View>
                  <Text style={[styles.actionButtonText, {color: '#FF3B30'}]}>Leave Group</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          </View>
          
          <View style={styles.divider} />
          
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

          {/* Members Section - Button to open modal */}
          <View style={styles.section}>
            <TouchableOpacity 
              style={styles.viewMembersButton}
              onPress={() => setViewMembersModalVisible(true)}>
              <View style={styles.viewMembersButtonContent}>
                <Text style={styles.viewMembersButtonText}>View All Members</Text>
                <Text style={styles.viewMembersButtonCount}>
                  {participants?.length || 0} {participants?.length === 1 ? 'member' : 'members'}
                </Text>
              </View>
              <Text style={styles.viewMembersButtonArrow}>›</Text>
            </TouchableOpacity>
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
      </ScrollView>

      {/* Edit Group Name Modal (admin only) */}
      {isGroupChat && editNameModalVisible && (
        <Modal
          visible={editNameModalVisible}
          transparent
          animationType="fade"
          onRequestClose={() => setEditNameModalVisible(false)}>
          <TouchableOpacity
            style={styles.filterModalOverlay}
            activeOpacity={1}
            onPress={() => setEditNameModalVisible(false)}>
            <TouchableOpacity style={styles.editNameModalContent} activeOpacity={1} onPress={() => {}}>
              <Text style={styles.filterModalTitle}>Edit Group Name</Text>
              <TextInput
                style={styles.editNameInput}
                value={editNameInput}
                onChangeText={setEditNameInput}
                placeholder="Group name"
                placeholderTextColor="#9BA1A6"
                autoFocus
              />
              <View style={styles.editNameModalButtons}>
                <TouchableOpacity
                  style={styles.editNameModalButton}
                  onPress={() => setEditNameModalVisible(false)}>
                  <Text style={styles.editNameModalButtonCancel}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.editNameModalButton, styles.editNameModalButtonSave]}
                  onPress={handleUpdateGroupName}
                  disabled={loading}>
                  <Text style={styles.editNameModalButtonSaveText}>
                    {loading ? 'Saving...' : 'Save'}
                  </Text>
                </TouchableOpacity>
              </View>
            </TouchableOpacity>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Add Member Modal */}
      {addMemberModalVisible && (
        <Modal
          visible={addMemberModalVisible}
          animationType="slide"
          transparent
          presentationStyle="overFullScreen"
          statusBarTranslucent
          onRequestClose={() => setAddMemberModalVisible(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContainer}>
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => setAddMemberModalVisible(false)}>
                  <Text style={styles.modalCancelButton}>Cancel</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>Add Members</Text>
                <TouchableOpacity
                  onPress={handleAddSelectedMembers}
                  disabled={selectedUsersToAdd.length === 0}>
                  <Text style={[
                    styles.modalAddButton,
                    selectedUsersToAdd.length === 0 && styles.modalAddButtonDisabled
                  ]}>
                    Add ({selectedUsersToAdd.length})
                  </Text>
                </TouchableOpacity>
              </View>

              {/* Filter Selectors - same approach as Create New Group */}
              {!fetchingUsers && filteredUsers.length > 0 && (
                <>
                  <View style={styles.filterSelectorsContainer}>
                    <TouchableOpacity
                      style={styles.filterSelector}
                      onPress={() => setUserTypeModalVisible(true)}
                      activeOpacity={0.7}>
                      <Text style={styles.filterSelectorLabel}>User Type:</Text>
                      <View style={styles.filterSelectorValue}>
                        <Text style={styles.filterSelectorValueText}>
                          {userTypeFilter === 'all' ? 'All' : userTypeFilter === 'buyer' ? 'Buyers' : 'Suppliers'}
                        </Text>
                        <Text style={styles.filterSelectorArrow}>›</Text>
                      </View>
                    </TouchableOpacity>

                    <TouchableOpacity
                      style={[
                        styles.filterSelector,
                        userTypeFilter !== 'supplier' && styles.filterSelectorDisabled
                      ]}
                      onPress={() => {
                        if (userTypeFilter === 'supplier') setCountryModalVisible(true);
                      }}
                      disabled={userTypeFilter !== 'supplier'}
                      activeOpacity={0.7}>
                      <Text style={[
                        styles.filterSelectorLabel,
                        userTypeFilter !== 'supplier' && styles.filterSelectorLabelDisabled
                      ]}>
                        Country:
                      </Text>
                      <View style={styles.filterSelectorValue}>
                        <Text style={[
                          styles.filterSelectorValueText,
                          userTypeFilter !== 'supplier' && styles.filterSelectorValueDisabled
                        ]}>
                          {countryFilter === 'all' ? 'All' : countryFilter}
                        </Text>
                        {userTypeFilter === 'supplier' && (
                          <Text style={styles.filterSelectorArrow}>›</Text>
                        )}
                      </View>
                    </TouchableOpacity>
                  </View>

                  {/* Select All Button */}
                  <View style={styles.selectAllContainer}>
                    <TouchableOpacity
                      onPress={handleSelectAll}
                      style={styles.selectAllButton}>
                      <Text style={styles.selectAllButtonText}>
                        {(() => {
                          const availableToAdd = applyUserAndCountryFilter(filteredUsers);
                          return selectedUsersToAdd.length === availableToAdd.length && availableToAdd.length > 0
                            ? 'Deselect All'
                            : 'Select All';
                        })()}
                      </Text>
                    </TouchableOpacity>
                    {selectedUsersToAdd.length > 0 && (
                      <Text style={styles.selectedCountText}>
                        {selectedUsersToAdd.length} selected
                      </Text>
                    )}
                  </View>
                </>
              )}

              <View style={styles.addMemberSearchBox}>
                <View style={styles.searchIconContainer}>
                  <SearchIcon width={20} height={20} color="#647276" />
                </View>
                <TextInput
                  placeholder="Search"
                  value={searchText}
                  onChangeText={setSearchText}
                  style={styles.addMemberSearchInput}
                  placeholderTextColor="#647276"
                />
              </View>

              {fetchingUsers ? (
                <View style={styles.skeletonListContainer}>
                  {Array.from({length: 5}).map((_, idx) => (
                    <SkeletonUserItem key={`skeleton-${idx}`} index={idx} />
                  ))}
                </View>
              ) : (
                <FlatList
                  data={applyUserAndCountryFilter(filteredUsers)}
                  keyExtractor={item => item.uid}
                  renderItem={({item}) => {
                    const isSelected = selectedUsersToAdd.some(u => u.uid === item.uid);
                    return (
                      <TouchableOpacity
                        onPress={() => toggleUserSelection(item)}
                        style={[
                          styles.userItem,
                          isSelected && styles.userItemSelected
                        ]}>
                        <Image
                          source={item.avatarUrl}
                          style={styles.userItemAvatar}
                        />
                        <View style={styles.userItemInfo}>
                          <Text style={styles.userItemName}>{item.name}</Text>
                          {item.email && <Text style={styles.userItemEmail}>{item.email}</Text>}
                        </View>
                        {/* Checkbox */}
                        <View style={[
                          styles.checkbox,
                          isSelected && styles.checkboxSelected
                        ]}>
                          {isSelected && (
                            <Text style={styles.checkboxCheck}>✓</Text>
                          )}
                        </View>
                      </TouchableOpacity>
                    );
                  }}
                  ListEmptyComponent={
                    <View style={styles.emptyContainer}>
                      <Text style={styles.emptyText}>No users found</Text>
                    </View>
                  }
                />
              )}
            </View>
          </View>

          {/* User Type Filter Modal - nested inside Add Member modal */}
          <Modal
            visible={userTypeModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setUserTypeModalVisible(false)}>
            <TouchableOpacity
              style={styles.filterModalOverlay}
              activeOpacity={1}
              onPress={() => setUserTypeModalVisible(false)}>
              <TouchableOpacity style={styles.filterModalContent} activeOpacity={1} onPress={() => {}}>
                <Text style={styles.filterModalTitle}>Select User Type</Text>
                <TouchableOpacity
                  style={styles.filterModalOption}
                  onPress={() => {
                    setUserTypeFilter('all');
                    setCountryFilter('all');
                    setUserTypeModalVisible(false);
                  }}>
                  <Text style={styles.filterModalOptionText}>
                    All ({filteredUsers.filter(user => !participants?.some(p => p.uid === user.uid)).length})
                  </Text>
                  {userTypeFilter === 'all' && <Text style={styles.filterModalCheck}>✓</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterModalOption}
                  onPress={() => {
                    setUserTypeFilter('buyer');
                    setCountryFilter('all');
                    setUserTypeModalVisible(false);
                  }}>
                  <Text style={styles.filterModalOptionText}>
                    Buyers ({filteredUsers.filter(user => !participants?.some(p => p.uid === user.uid) && user.userType === 'buyer').length})
                  </Text>
                  {userTypeFilter === 'buyer' && <Text style={styles.filterModalCheck}>✓</Text>}
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.filterModalOption}
                  onPress={() => {
                    setUserTypeFilter('supplier');
                    setUserTypeModalVisible(false);
                  }}>
                  <Text style={styles.filterModalOptionText}>
                    Suppliers ({filteredUsers.filter(user => !participants?.some(p => p.uid === user.uid) && user.userType === 'supplier').length})
                  </Text>
                  {userTypeFilter === 'supplier' && <Text style={styles.filterModalCheck}>✓</Text>}
                </TouchableOpacity>
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>

          {/* Country Filter Modal - nested inside Add Member modal */}
          <Modal
            visible={countryModalVisible}
            transparent
            animationType="fade"
            onRequestClose={() => setCountryModalVisible(false)}>
            <TouchableOpacity
              style={styles.filterModalOverlay}
              activeOpacity={1}
              onPress={() => setCountryModalVisible(false)}>
              <TouchableOpacity style={styles.filterModalContent} activeOpacity={1} onPress={() => {}}>
                <Text style={styles.filterModalTitle}>Select Country</Text>
                <TouchableOpacity
                  style={styles.filterModalOption}
                  onPress={() => {
                    setCountryFilter('all');
                    setCountryModalVisible(false);
                  }}>
                  <Text style={styles.filterModalOptionText}>All</Text>
                  {countryFilter === 'all' && <Text style={styles.filterModalCheck}>✓</Text>}
                </TouchableOpacity>
                {availableCountries.map(country => (
                  <TouchableOpacity
                    key={country}
                    style={styles.filterModalOption}
                    onPress={() => {
                      setCountryFilter(country);
                      setCountryModalVisible(false);
                    }}>
                    <Text style={styles.filterModalOptionText}>{country}</Text>
                    {countryFilter === country && <Text style={styles.filterModalCheck}>✓</Text>}
                  </TouchableOpacity>
                ))}
              </TouchableOpacity>
            </TouchableOpacity>
          </Modal>
        </Modal>
      )}

      {/* View All Members Modal */}
      {viewMembersModalVisible && (
        <Modal
          visible={viewMembersModalVisible}
          animationType="slide"
          transparent
          onRequestClose={() => {
            setViewMembersModalVisible(false);
            setMemberSearchText('');
          }}>
          <View style={styles.modalOverlay}>
            <View style={styles.viewMembersModalContainer}>
              {/* Modal Header */}
              <View style={styles.modalHeader}>
                <TouchableOpacity onPress={() => {
                  setViewMembersModalVisible(false);
                  setMemberSearchText('');
                }}>
                  <Text style={styles.modalCancelButton}>Close</Text>
                </TouchableOpacity>
                <Text style={styles.modalTitle}>
                  Members ({participants?.length || 0})
                </Text>
                <View style={{width: 60}} />
              </View>

              {/* Search Input */}
              <View style={styles.viewMembersSearchContainer}>
                <View style={styles.memberSearchBox}>
                  <View style={styles.searchIconContainer}>
                    <SearchIcon width={20} height={20} color="#647276" />
                  </View>
                  <TextInput
                    placeholder="Search members..."
                    placeholderTextColor="#647276"
                    style={styles.memberSearchInput}
                    value={memberSearchText}
                    onChangeText={setMemberSearchText}
                  />
                  {memberSearchText.length > 0 && (
                    <TouchableOpacity
                      onPress={() => setMemberSearchText('')}
                      style={styles.clearSearchButton}>
                      <Text style={styles.clearSearchText}>✕</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </View>

              {/* Members List */}
              <FlatList
                data={filteredParticipants}
                keyExtractor={(item, index) => item.uid || `member-${index}`}
                renderItem={({item}) => {
                  const displayName = getParticipantName(item);
                  
                  return (
                    <View style={styles.memberItem}>
                      <Image
                        source={getAvatarSource(item.avatarUrl)}
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
                style={{flex: 1}}
                contentContainerStyle={{paddingHorizontal: 24, paddingBottom: 24}}
                ListEmptyComponent={
                  memberSearchText.trim() ? (
                    <View style={styles.emptySearchContainer}>
                      <Text style={styles.emptySearchText}>
                        No members found for "{memberSearchText}"
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.emptySearchContainer}>
                      <Text style={styles.emptySearchText}>No members</Text>
                    </View>
                  )
                }
              />
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
  membersListExpanded: {
    // No maxHeight - expands to show all members
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
  modalAddButton: {
    fontSize: 16,
    color: '#539461',
    fontWeight: '600',
  },
  modalAddButtonDisabled: {
    color: '#CDD3D4',
  },
  selectAllContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EA',
  },
  selectAllButton: {
    paddingVertical: 4,
  },
  selectAllButtonText: {
    fontSize: 16,
    color: '#539461',
    fontWeight: '600',
  },
  selectedCountText: {
    fontSize: 14,
    color: '#647276',
  },
  filterSelectorsContainer: {
    marginTop: 16,
    marginBottom: 12,
    gap: 8,
    paddingHorizontal: 16,
  },
  filterSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F3F3F5',
    borderRadius: 12,
  },
  filterSelectorDisabled: {
    backgroundColor: '#E5E8EA',
    opacity: 0.6,
  },
  filterSelectorLabel: {
    fontSize: 14,
    color: '#647276',
    fontWeight: '500',
  },
  filterSelectorLabelDisabled: {
    color: '#9BA1A6',
  },
  filterSelectorValue: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  filterSelectorValueText: {
    fontSize: 14,
    color: '#202325',
    fontWeight: '600',
  },
  filterSelectorValueDisabled: {
    color: '#9BA1A6',
  },
  filterSelectorArrow: {
    fontSize: 20,
    color: '#647276',
    fontWeight: '300',
  },
  filterModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  filterModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '80%',
    maxHeight: '60%',
  },
  filterModalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 16,
  },
  filterModalOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EA',
  },
  filterModalOptionText: {
    fontSize: 16,
    color: '#202325',
  },
  filterModalCheck: {
    fontSize: 20,
    color: '#539461',
    fontWeight: '600',
  },
  editNameModalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 20,
    width: '85%',
  },
  editNameInput: {
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#202325',
    marginBottom: 20,
  },
  editNameModalButtons: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 12,
  },
  editNameModalButton: {
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  editNameModalButtonCancel: {
    fontSize: 16,
    color: '#647276',
    fontWeight: '600',
  },
  editNameModalButtonSave: {
    backgroundColor: '#539461',
    borderRadius: 12,
    paddingHorizontal: 24,
  },
  editNameModalButtonSaveText: {
    fontSize: 16,
    color: '#fff',
    fontWeight: '600',
  },
  addMemberSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    paddingHorizontal: 16,
    marginHorizontal: 16,
    marginBottom: 12,
  },
  addMemberSearchInput: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  userItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  userItemBorder: {
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
  userItemSelected: {
    backgroundColor: '#F0F9F2',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#CDD3D4',
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  checkboxSelected: {
    backgroundColor: '#539461',
    borderColor: '#539461',
  },
  checkboxCheck: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  skeletonListContainer: {
    flex: 1,
  },
  skeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E5E8EA',
    marginRight: 12,
  },
  skeletonName: {
    height: 16,
    backgroundColor: '#E5E8EA',
    borderRadius: 4,
    marginBottom: 6,
  },
  skeletonEmail: {
    height: 12,
    backgroundColor: '#E5E8EA',
    borderRadius: 3,
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
  memberSearchContainer: {
    marginBottom: 12,
  },
  memberSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
  },
  searchIconContainer: {
    width: 20,
    height: 20,
    marginRight: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  searchIconText: {
    fontSize: 14,
    color: '#7F8D91',
  },
  memberSearchInput: {
    flex: 1,
    fontSize: 14,
    color: '#202325',
    paddingVertical: 8,
  },
  clearSearchButton: {
    padding: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  clearSearchText: {
    fontSize: 16,
    color: '#647276',
    fontWeight: 'bold',
  },
  emptySearchContainer: {
    paddingVertical: 24,
    alignItems: 'center',
  },
  emptySearchText: {
    fontSize: 14,
    color: '#647276',
    textAlign: 'center',
  },
  viewMembersButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#F7F8F9',
    borderRadius: 12,
    marginBottom: 16,
  },
  viewMembersButtonContent: {
    flex: 1,
  },
  viewMembersButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    marginBottom: 4,
  },
  viewMembersButtonCount: {
    fontSize: 14,
    color: '#647276',
  },
  viewMembersButtonArrow: {
    fontSize: 24,
    color: '#647276',
    fontWeight: '300',
  },
  viewMembersModalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: '80%',
    width: '100%',
    overflow: 'hidden',
    flexDirection: 'column',
  },
  viewMembersSearchContainer: {
    paddingHorizontal: 24,
    paddingTop: 16,
    paddingBottom: 12,
    backgroundColor: '#fff',
  },
  groupInfoHeader: {
    alignItems: 'center',
    paddingVertical: 24,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  groupAvatarsContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  groupAvatarWrapper: {
    borderWidth: 3,
    borderColor: '#FFFFFF',
    borderRadius: 40,
    backgroundColor: '#FFFFFF',
  },
  groupAvatar: {
    width: 70,
    height: 70,
    borderRadius: 35,
  },
  groupNameFull: {
    fontSize: 24,
    fontWeight: '700',
    color: '#202325',
    textAlign: 'center',
    marginBottom: 4,
    paddingHorizontal: 24,
  },
  groupMemberCount: {
    fontSize: 14,
    color: '#647276',
    marginBottom: 20,
  },
  groupActionButtons: {
    flexDirection: 'row',
    gap: 32,
  },
  actionButton: {
    alignItems: 'center',
    gap: 8,
  },
  actionButtonIcon: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: '#F5F6F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 13,
    color: '#202325',
    fontWeight: '500',
  },
});
