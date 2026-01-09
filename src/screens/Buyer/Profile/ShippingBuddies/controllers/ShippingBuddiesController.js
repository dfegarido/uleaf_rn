import React, { useState, useEffect, useContext, useCallback, useRef } from 'react';
import { Alert } from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { AuthContext } from '../../../../../auth/AuthProvider';
import { API_ENDPOINTS } from '../../../../../config/apiConfig';
import {
  submitReceiverRequestApi,
  getBuddyRequestsApi,
  approveRejectBuddyRequestApi,
  getMyReceiverRequestApi,
  cancelReceiverRequestApi,
} from '../../../../../components/Api';
import { getStoredAuthToken } from '../../../../../utils/getStoredAuthToken';

/**
 * ShippingBuddiesController - Handles all business logic for Shipping Buddies screens
 */
export const useShippingBuddiesController = () => {
  const { userInfo } = useContext(AuthContext);
  
  // State management
  const [joiners, setJoiners] = useState([]);
  const [loadingJoiners, setLoadingJoiners] = useState(true);
  const [myReceiverRequest, setMyReceiverRequest] = useState(null);
  const [loadingMyRequest, setLoadingMyRequest] = useState(true);
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Get current user identifiers
  const getCurrentUserIdentifiers = useCallback(() => {
    if (!userInfo) return { uid: null, email: null, username: null };
    
    const currentUserId = userInfo.uid || userInfo.id || (userInfo.user && userInfo.user.uid) || null;
    const currentUserEmail = userInfo.email || (userInfo.user && userInfo.user.email) || null;
    const currentUsername = userInfo.username || (userInfo.user && userInfo.user.username) || null;
    
    return {
      uid: currentUserId,
      email: currentUserEmail ? currentUserEmail.toLowerCase() : null,
      username: currentUsername ? currentUsername.toLowerCase() : null,
    };
  }, [userInfo]);

  // Load joiners (for receivers)
  const loadJoiners = useCallback(async () => {
    try {
      setLoadingJoiners(true);
      console.log('[ShippingBuddiesController] Starting loadJoiners...');
      const result = await getBuddyRequestsApi();
      console.log('[ShippingBuddiesController] getBuddyRequests API response:', JSON.stringify(result, null, 2));
      
      if (result && result.success) {
        const joinersList = result.data?.joiners || [];
        console.log('[ShippingBuddiesController] Success! Found', joinersList.length, 'joiners:', joinersList);
        setJoiners(joinersList);
      } else {
        console.warn('[ShippingBuddiesController] API returned unsuccessful result:', result);
        setJoiners([]);
      }
    } catch (error) {
      console.error('[ShippingBuddiesController] Error loading joiners:', error);
      Alert.alert('Error', `Failed to load joiners: ${error.message || 'Unknown error'}`);
      setJoiners([]);
    } finally {
      setLoadingJoiners(false);
    }
  }, []);

  // Load my receiver request (for joiners)
  const loadMyReceiverRequest = useCallback(async () => {
    try {
      setLoadingMyRequest(true);
      const result = await getMyReceiverRequestApi();
      console.log('[ShippingBuddiesController] getMyReceiverRequest result:', JSON.stringify(result, null, 2));
      if (result && result.success && result.data && result.data.isJoiner) {
        console.log('[ShippingBuddiesController] User is a joiner, setting myReceiverRequest');
        setMyReceiverRequest(result.data);
      } else {
        console.log('[ShippingBuddiesController] User is NOT a joiner, clearing myReceiverRequest');
        setMyReceiverRequest(null);
      }
    } catch (error) {
      console.error('[ShippingBuddiesController] Error loading my receiver request:', error);
      setMyReceiverRequest(null);
    } finally {
      setLoadingMyRequest(false);
    }
  }, []);

  // Refresh both data sources
  const refreshData = useCallback(async () => {
    await Promise.all([loadJoiners(), loadMyReceiverRequest()]);
  }, [loadJoiners, loadMyReceiverRequest]);

  // Load data immediately on mount
  useEffect(() => {
    loadJoiners();
    loadMyReceiverRequest();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Only run on mount - loadJoiners and loadMyReceiverRequest are stable callbacks

  // Fetch joiners and my receiver request when screen is focused (for refresh on return)
  useFocusEffect(
    useCallback(() => {
      loadJoiners();
      loadMyReceiverRequest();
    }, [loadJoiners, loadMyReceiverRequest])
  );

  // Show toast notification
  const showToast = useCallback((message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  }, []);

  // Handle approve/reject request
  const handleApproveReject = useCallback(async (requestId, action) => {
    if (!requestId) {
      console.error('❌ handleApproveReject: requestId is missing');
      Alert.alert('Error', 'Request ID is missing. Please try again.');
      return;
    }

    console.log(`🔄 [handleApproveReject] Starting ${action} for requestId:`, requestId);
    
    try {
      setLoadingJoiners(true);
      
      const result = await approveRejectBuddyRequestApi(requestId, action);
      
      if (result.success) {
        await refreshData();
        
        Alert.alert(
          'Success',
          `Request ${action}d successfully!`,
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(result.message || result.error || `Failed to ${action} request`);
      }
    } catch (error) {
      console.error(`❌ [handleApproveReject] Error ${action}ing request:`, error);
      Alert.alert(
        'Error',
        error.message || `Failed to ${action} request. Please try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingJoiners(false);
    }
  }, [refreshData]);

  // Handle cancel request - opens modal
  const handleCancelRequest = useCallback(() => {
    setCancelRequestModalVisible(true);
  }, []);

  // Confirm cancel request
  const handleConfirmCancelRequest = useCallback(async () => {
    setCancelRequestModalVisible(false);
    try {
      const result = await cancelReceiverRequestApi();
      
      if (result.success) {
        // Use the message from the API response
        const message = result.message || 'Request cancelled successfully';
        showToast(message, 'success');
        await loadMyReceiverRequest();
      } else {
        await loadMyReceiverRequest();
        showToast(result.message || 'Failed to submit cancel request', 'error');
      }
    } catch (error) {
      console.error('Error cancelling request:', error);
      await loadMyReceiverRequest();
      showToast('Failed to submit cancel request. Please try again.', 'error');
    }
  }, [loadMyReceiverRequest, showToast]);

  // Format expiration date (cutoff date)
  const formatExpirationDate = useCallback((dateString) => {
    if (!dateString) return null;
    try {
      // Handle Firestore Timestamp
      let date;
      if (dateString.toDate && typeof dateString.toDate === 'function') {
        date = dateString.toDate();
      } else if (dateString.seconds || dateString._seconds) {
        date = new Date((dateString.seconds || dateString._seconds) * 1000);
      } else {
        date = new Date(dateString);
      }
      
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      const year = date.getFullYear();
      return `Will expire on ${month} ${day}, ${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  }, []);

  // Format flight date (with "Depart on" wording)
  const formatFlightDate = useCallback((dateString) => {
    if (!dateString) return null;
    try {
      // Handle Firestore Timestamp
      let date;
      if (dateString.toDate && typeof dateString.toDate === 'function') {
        date = dateString.toDate();
      } else if (dateString.seconds || dateString._seconds) {
        date = new Date((dateString.seconds || dateString._seconds) * 1000);
      } else {
        date = new Date(dateString);
      }
      
      const month = date.toLocaleDateString('en-US', { month: 'short' });
      const day = date.getDate();
      const year = date.getFullYear();
      return `Depart on ${month} ${day}, ${year}`;
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  }, []);

  // User search for receiver request
  const [users, setUsers] = useState([]);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [modalVisible, setModalVisible] = useState(false);
  
  // Error modal state
  const [errorModalVisible, setErrorModalVisible] = useState(false);
  const [errorModalMessage, setErrorModalMessage] = useState('');
  
  // Cancel request modal state
  const [cancelRequestModalVisible, setCancelRequestModalVisible] = useState(false);

  const fetchUsers = useCallback(async (query = '') => {
    try {
      setLoadingUsers(true);
      
      const authToken = await getStoredAuthToken();
      const apiUrl = `${API_ENDPOINTS.SEARCH_USER}?query=${encodeURIComponent(query)}&userType=buyer&limit=5&offset=0`;
      
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to fetch users: ${response.status} - ${errorText}`);
      }

      const data = await response.json();

      if (data && data.success && data.results) {
        const currentUser = getCurrentUserIdentifiers();
        
        // Filter to only include buyers and exclude current user
        const buyerUsers = data.results.filter(user => {
          const userType = user.userType;
          if (userType !== 'buyer' && userType) {
            return false;
          }
          
          if (currentUser.uid && user.id === currentUser.uid) {
            return false;
          }
          
          if (currentUser.email && user.email) {
            if (user.email.toLowerCase() === currentUser.email) {
              return false;
            }
          }
          
          if (currentUser.username) {
            const userUsername = (user.username || '').toLowerCase();
            if (userUsername && userUsername === currentUser.username) {
              return false;
            }
          }
          
          if (currentUser.username && user.email) {
            const emailPrefix = user.email.split('@')[0].toLowerCase();
            if (emailPrefix === currentUser.username) {
              return false;
            }
          }
          
          if (currentUser.email && user.username) {
            const currentEmailPrefix = currentUser.email.split('@')[0];
            const userUsername = user.username.toLowerCase();
            if (userUsername === currentEmailPrefix) {
              return false;
            }
          }
          
          return true;
        });

        const formattedUsers = buyerUsers.map(user => {
          let username = user.username || '';
          if (!username && user.email) {
            username = user.email.split('@')[0];
          }

          return {
            id: user.id,
            username: username,
            firstName: user.firstName || '',
            lastName: user.lastName || '',
            email: user.email || '',
            profileImage: user.profileImage || null,
            userType: user.userType || 'buyer',
          };
        });
        
        setUsers(formattedUsers);
      } else {
        setUsers([]);
      }
    } catch (error) {
      console.error('[ShippingBuddiesController] Error fetching users:', error);
      Alert.alert(
        'Search Error',
        `Unable to search users. ${error.message || 'Please try again.'}`,
        [{ text: 'OK' }]
      );
      setUsers([]);
    } finally {
      setLoadingUsers(false);
    }
  }, [getCurrentUserIdentifiers]);

  // Submit receiver request
  const handleSubmitReceiverRequest = useCallback(async (receiverUsername, receiverId) => {
    if (!receiverUsername || !receiverUsername.trim()) {
      Alert.alert('Error', 'Please select a receiver username');
      return { success: false, message: 'Please select a receiver username' };
    }

    try {
      const result = await submitReceiverRequestApi(receiverUsername, receiverId);
      
      if (result.success) {
        await refreshData();
        Alert.alert(
          'Success',
          'Receiver request submitted successfully!',
          [{ text: 'OK' }]
        );
        return { success: true };
      } else {
        // Check if this is a user-facing error about receiver requirements
        const errorMessage = result.message || 'Failed to submit receiver request';
        if (errorMessage.includes('A receiver needs') || errorMessage.includes('cutoff date')) {
          // Show user-friendly modal for receiver requirement errors
          setErrorModalMessage(errorMessage);
          setErrorModalVisible(true);
          return { success: false, message: errorMessage, showErrorModal: true };
        } else {
          throw new Error(errorMessage);
        }
      }
    } catch (error) {
      console.error('Error submitting receiver request:', error);
      const errorMessage = error.message || 'Failed to submit receiver request. Please try again.';
      
      // Check if this is a user-facing error about receiver requirements
      if (errorMessage.includes('A receiver needs') || errorMessage.includes('cutoff date')) {
        // Show user-friendly modal for receiver requirement errors
        setErrorModalMessage(errorMessage);
        setErrorModalVisible(true);
        return { success: false, message: errorMessage, showErrorModal: true };
      } else {
        // Show generic error alert for unexpected errors
        Alert.alert(
          'Error',
          errorMessage,
          [{ text: 'OK' }]
        );
        return { success: false, message: errorMessage };
      }
    }
  }, [refreshData]);

  return {
    // State
    joiners,
    loadingJoiners,
    myReceiverRequest,
    loadingMyRequest,
    toastVisible,
    toastMessage,
    toastType,
    users,
    loadingUsers,
    searchText,
    modalVisible,
    errorModalVisible,
    errorModalMessage,
    cancelRequestModalVisible,
    
    // Actions
    loadJoiners,
    loadMyReceiverRequest,
    refreshData,
    handleApproveReject,
    handleCancelRequest,
    handleConfirmCancelRequest,
    showToast,
    formatExpirationDate,
    formatFlightDate,
    getCurrentUserIdentifiers,
    fetchUsers,
    handleSubmitReceiverRequest,
    
    // Setters
    setToastVisible,
    setSearchText,
    setModalVisible,
    setErrorModalVisible,
    setCancelRequestModalVisible,
  };
};

