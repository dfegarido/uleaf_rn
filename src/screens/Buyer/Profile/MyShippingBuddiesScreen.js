/**
 * @deprecated This file is deprecated and no longer used.
 * 
 * The Shipping Buddies feature has been refactored into an atomic design structure.
 * The navigation now routes to MyShippingBuddiesRouter which uses:
 * - ReceiverShippingBuddiesScreen (for receivers)
 * - JoinerShippingBuddiesScreen (for joiners)
 * 
 * These new screens use the following components:
 * - JoinerCard, JoinerList, EmptyState, BuddyDetails, UserSearchModal
 * - ShippingBuddiesController (for business logic)
 * 
 * See: ileafu/src/screens/Buyer/Profile/ShippingBuddies/
 * 
 * This file is kept for reference but should not be used.
 */

import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  TextInput,
  Modal,
  Pressable,
  Image,
  ActivityIndicator,
  Alert,
} from 'react-native';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import {useSafeAreaInsets, SafeAreaView} from 'react-native-safe-area-context';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import {StatusBar} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import {API_ENDPOINTS} from '../../../config/apiConfig';
import {submitReceiverRequestApi, getBuddyRequestsApi, approveRejectBuddyRequestApi, getMyReceiverRequestApi, cancelReceiverRequestApi} from '../../../components/Api';
import {AuthContext} from '../../../auth/AuthProvider';
import Toast from '../../../components/Toast/Toast';
import {getStoredAuthToken} from '../../../utils/getStoredAuthToken';

// Shipping Buddies Icon Component (copied from BuyerProfileScreen)
const ShippingBuddiesIcon = ({width = 96, height = 96}) => (
  <Svg width={width} height={height} viewBox="0 0 80 80" fill="none">
    <Path
      d="M72.7636 72.7565L69.6017 57.6985L66.0687 40.8677L65.4423 37.8882L61.6969 20.0488C61.2656 17.9874 59.2437 16.668 57.1823 17.0994C55.3842 17.4768 54.1505 19.0626 54.1505 20.829C54.1505 21.0812 54.1758 21.3365 54.2281 21.5916L53.7698 19.4065C53.3369 17.3451 51.3152 16.0257 49.2537 16.4587C48.7145 16.5713 48.2247 16.7932 47.8044 17.0977C47.8028 17.0993 47.8028 17.1008 47.8012 17.1008C46.8244 17.8065 46.2219 18.9513 46.2219 20.1851C46.2219 20.4451 46.2488 20.7083 46.3044 20.9732C45.8714 18.9118 43.8497 17.5924 41.7883 18.0254C41.2555 18.138 40.7719 18.3552 40.3564 18.6533C40.3484 18.6597 40.3422 18.6644 40.3358 18.6691C39.3606 19.3747 38.758 20.5196 38.758 21.7533C38.758 22.0135 38.785 22.2766 38.8405 22.5415L42.5225 40.0812L35.0586 41.6479L38.1142 56.2032C38.3283 57.226 38.8294 58.1679 39.5572 58.9163L42.5511 61.9958C43.2805 62.7458 43.7816 63.6861 43.9956 64.709L46.8277 78.2002C47.0845 79.4244 48.285 80.2077 49.5091 79.9508L71.013 75.4363C72.2356 75.1794 73.0205 73.9791 72.7636 72.7565Z"
      fill="#FFDFCF"
    />
    <Path
      d="M57.7059 20.0487L61.0708 36.1869L64.9175 35.3793L61.6991 20.0487C61.2663 17.9874 59.2445 16.6671 57.1833 17.0999C56.7409 17.1927 56.333 17.3593 55.9688 17.5832C56.8305 18.1126 57.4817 18.9807 57.7059 20.0487Z"
      fill="#FFCEBF"
    />
    <Path
      d="M72.7641 72.7559L69.603 57.6984L64.9173 35.3792L61.0703 36.1868L65.6528 58.0156L68.8139 73.7787C69.0047 74.6871 68.6211 75.5818 67.9105 76.0881L71.0136 75.4367C72.2373 75.1798 73.0209 73.9796 72.7641 72.7559Z"
      fill="#FFCEBF"
    />
    <Path
      d="M57.2408 35.9421C57.3572 36.4967 57.0022 37.0406 56.4477 37.1571L55.0016 37.4613C54.9984 37.4613 54.9936 37.4629 54.9905 37.4629C54.3784 37.5849 53.7806 37.1981 53.6442 36.5892L49.8194 19.7235C49.5705 18.5421 48.7997 17.6049 47.8008 17.1007C47.8008 17.1002 47.8008 17.1004 47.8008 17.0999C48.2217 16.7943 48.7128 16.5713 49.2534 16.4585C51.3148 16.0256 53.3367 17.3449 53.7695 19.4063L57.2408 35.9421Z"
      fill="#FFCEBF"
    />
    <Path
      d="M49.7652 37.4593C49.8875 38.0418 49.5142 38.6132 48.9316 38.7352L47.4209 39.0518C46.8041 39.1818 46.1967 38.7901 46.062 38.1734L42.3545 21.2902C42.1072 20.1088 41.3366 19.1716 40.3359 18.669C40.3423 18.6643 40.3486 18.6595 40.3566 18.6532C40.772 18.3551 41.2556 18.1379 41.7884 18.0252C43.8498 17.5923 45.8717 18.9116 46.3045 20.9731L49.7652 37.4593Z"
      fill="#FFCEBF"
    />
    <Path
      d="M66.0702 40.8663L63.2416 44.8646C60.9322 48.129 60.0868 52.2077 60.9083 56.1212L62.8554 65.3955L70.7902 63.3498L70.1344 60.2263C69.7899 58.5855 69.9866 56.8774 70.6949 55.3579L73.3852 49.5863C73.9022 48.4773 74.2429 47.2943 74.3951 46.0801L75.5976 36.4832C75.8401 34.5484 74.6305 32.7274 72.7532 32.2005C70.6947 31.6229 68.5512 32.7926 67.923 34.8362L66.0702 40.8663Z"
      fill="#FFDFCF"
    />
    <Path
      d="M75.5948 36.4832L74.3928 46.0799C74.2406 47.2946 73.8997 48.4775 73.3826 49.5858L70.6917 55.3578C69.9845 56.8769 69.7862 58.5847 70.132 60.226L70.7869 63.3499L66.9272 64.3441L66.1819 60.5432C65.8362 58.9019 66.0328 57.1941 66.7415 55.675L69.4325 49.903C69.9494 48.7946 70.2903 47.6116 70.4426 46.3971L71.6447 36.8003C71.8587 35.0957 70.9437 33.4799 69.4373 32.7583C70.3712 32.1113 71.5748 31.8703 72.7498 32.2002C74.6275 32.7264 75.8373 34.5485 75.5948 36.4832Z"
      fill="#FFCEBF"
    />
    <Path
      d="M44.6791 24.328C42.6179 23.8952 40.596 25.2155 40.1632 27.2767L41.1573 22.5414C41.2127 22.2766 41.2398 22.0134 41.2398 21.7533C41.2398 19.9869 40.006 18.4027 38.2094 18.0253C37.1152 17.7953 36.0323 18.0602 35.1918 18.6675H35.1902C34.448 19.2034 33.8963 20.0075 33.6933 20.9731C33.7488 20.7083 33.7758 20.445 33.7758 20.185C33.7758 18.42 32.5405 16.8344 30.744 16.4586C29.6482 16.2288 28.5652 16.4934 27.7248 17.1008C26.9826 17.6367 26.4308 18.4408 26.2279 19.4064L25.7696 21.5892C26.186 19.5369 24.868 17.5303 22.8154 17.1008V17.0992C21.7371 16.8741 20.6683 17.1278 19.8343 17.7145C19.8312 17.7177 19.8279 17.7209 19.8232 17.7225C19.8137 17.7305 19.8057 17.7367 19.7962 17.7431C19.7963 17.7431 19.7963 17.7433 19.7965 17.7433C19.0555 18.2794 18.5029 19.0822 18.3008 20.0488L13.9296 40.8663L12.0765 34.8361C11.4485 32.7923 9.30491 31.6227 7.24632 32.2003C5.36897 32.7272 4.15944 34.5483 4.40194 36.483L5.60444 46.0799C5.75663 47.2941 6.09725 48.4769 6.61428 49.5861L9.3046 55.3577C10.0129 56.8772 10.2096 58.5853 9.86507 60.2261L7.2346 72.7561C6.97772 73.9797 7.76147 75.1799 8.98507 75.4367L30.4891 79.9513C31.7127 80.2081 32.9129 79.4244 33.1699 78.2008L36.0024 64.7091C36.2171 63.6863 36.7179 62.7455 37.4463 61.9961L40.4402 58.9164C41.1687 58.167 41.6694 57.2263 41.8841 56.2034L47.628 28.8438C48.0607 26.7825 46.7404 24.7608 44.6791 24.328Z"
      fill="#FFCEBF"
    />
    <Path
      d="M41.1864 40.8595L37.9356 56.5207C37.7209 57.5436 37.2202 58.4843 36.4917 59.2337L33.4978 62.3134C32.7694 63.0628 32.2686 64.0036 32.0539 65.0264L29.4278 77.4839C29.2092 78.5251 28.307 79.2453 27.2891 79.2792L30.4909 79.9514C31.7145 80.2082 32.9147 79.4245 33.1717 78.2009L36.0042 64.7092C36.2189 63.6864 36.7197 62.7456 37.4481 61.9962L40.442 58.9165C41.1705 58.1672 41.6713 57.2264 41.8859 56.2036L44.9417 41.6479L41.1864 40.8595Z"
      fill="#FFB09E"
    />
    <Path
      d="M25.7664 21.6153L22.8311 35.5949C22.6744 36.3412 21.9425 36.8192 21.1963 36.6628L20.0357 36.4195C20.0293 36.4179 20.0246 36.4164 20.0182 36.4148C19.3616 36.2673 18.943 35.6187 19.081 34.9574L21.8163 21.9323C22.1794 20.2023 21.3072 18.5007 19.7977 17.7428C19.8072 17.7364 19.8152 17.7301 19.8247 17.7221C19.8294 17.7206 19.8327 17.7174 19.8358 17.7142C20.6699 17.1274 21.7386 16.8737 22.8169 17.0989V17.1004C24.8783 17.532 26.1993 19.5539 25.7664 21.6153Z"
      fill="#FFB09E"
    />
    <Path
      d="M33.7768 20.1849C33.7768 20.4449 33.7497 20.7082 33.6943 20.9731L30.2832 37.2239C30.1336 37.9365 29.4346 38.3929 28.7219 38.2432L27.4989 37.9864C26.833 37.8468 26.4064 37.192 26.546 36.5259L29.7444 21.2903C30.1075 19.5603 29.2353 17.8587 27.7258 17.1007C28.5663 16.4934 29.6493 16.2285 30.745 16.4585C32.5416 16.8343 33.7768 18.4201 33.7768 20.1849Z"
      fill="#FFB09E"
    />
    <Path
      d="M41.2418 21.7532C41.2418 22.0134 41.2148 22.2765 41.1593 22.5413L37.724 38.9057C37.5877 39.5548 36.951 39.9704 36.302 39.834L34.9654 39.5531C34.2977 39.4135 33.8712 38.7587 34.0109 38.0926L37.2093 22.8585C37.5724 21.127 36.7002 19.427 35.1938 18.6674C36.0343 18.0601 37.1173 17.7953 38.2115 18.0253C40.0081 18.4026 41.2418 19.9868 41.2418 21.7532Z"
      fill="#FFB09E"
    />
    <Path
      d="M44.6816 24.3279C43.5867 24.0981 42.503 24.3628 41.6625 24.9704C43.1712 25.7285 44.0434 27.4306 43.6802 29.1609L41.2227 40.8668L44.9422 41.6478L47.6303 28.8437C48.0631 26.7825 46.7428 24.7607 44.6816 24.3279Z"
      fill="#FFB09E"
    />
    <Path
      d="M13.9298 40.8659V40.8675L13.3945 43.4185C13.1823 44.4295 11.8236 44.6245 11.3358 43.714L10.7942 42.7031C10.2525 41.6921 9.81031 40.6309 9.47359 39.5346L8.12781 35.1526C7.79156 34.0617 7.02422 33.2196 6.06641 32.7598C6.41844 32.514 6.81484 32.3221 7.24781 32.2001C9.30609 31.6229 11.45 32.7932 12.078 34.8356L13.9298 40.8659Z"
      fill="#FFB09E"
    />
    <Path
      d="M66.0703 40.8676C66.0322 40.988 65.9767 41.1007 65.9037 41.2038L63.0748 45.2015C60.9642 48.1858 60.1841 51.9502 60.9341 55.5277C61.0705 56.1699 60.6581 56.801 60.0159 56.9358C59.3722 57.0707 58.7427 56.6583 58.6078 56.0162C57.7198 51.7933 58.6411 47.3518 61.1339 43.8283L65.4439 37.8882L66.0703 40.8676Z"
      fill="#FFCEBF"
    />
    <Path
      d="M31.5641 8.56702C31.288 8.56702 31.0108 8.47156 30.7858 8.27656L28.5902 6.37406C28.0938 5.9439 28.04 5.19281 28.4702 4.6964C28.9002 4.19999 29.6513 4.14624 30.1479 4.5764L32.3435 6.4789C32.8399 6.90906 32.8936 7.66015 32.4635 8.15656C32.2282 8.42796 31.8971 8.56702 31.5641 8.56702Z"
      fill="#539461"
    />
    <Path
      d="M36.8552 5.16684C36.341 5.16684 35.8668 4.83074 35.7146 4.3123L34.8961 1.5248C34.7111 0.894648 35.0719 0.23371 35.7022 0.0487102C36.3322 -0.136446 36.9933 0.224491 37.1783 0.854804L37.9968 3.6423C38.1818 4.27246 37.821 4.9334 37.1907 5.1184C37.0789 5.15121 36.9661 5.16684 36.8552 5.16684Z"
      fill="#539461"
    />
    <Path
      d="M43.1472 5.16696C43.0363 5.16696 42.9235 5.15133 42.8116 5.11852C42.1813 4.93352 41.8205 4.27258 42.0055 3.64243L42.8239 0.854926C43.0089 0.224614 43.6702 -0.136324 44.3 0.0488323C44.9303 0.233832 45.2911 0.89477 45.1061 1.52493L44.2877 4.31243C44.1357 4.83071 43.6614 5.16696 43.1472 5.16696Z"
      fill="#539461"
    />
    <Path
      d="M48.436 8.56685C48.103 8.56685 47.7718 8.42779 47.5366 8.15638C47.1064 7.65997 47.1602 6.90888 47.6566 6.47873L49.8522 4.57623C50.3489 4.14607 51.0999 4.19998 51.5299 4.69623C51.96 5.19263 51.9063 5.94372 51.4099 6.37388L49.2143 8.27638C48.9894 8.47138 48.7121 8.56685 48.436 8.56685Z"
      fill="#539461"
    />
  </Svg>
);

const MyShippingBuddiesScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {userInfo, isLoggedIn} = useContext(AuthContext);
  const [receiverUsername, setReceiverUsername] = useState('');
  const [selectedReceiverId, setSelectedReceiverId] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [users, setUsers] = useState([]);
  const [searchText, setSearchText] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [joiners, setJoiners] = useState([]);
  const [loadingJoiners, setLoadingJoiners] = useState(true);
  const [myReceiverRequest, setMyReceiverRequest] = useState(null);
  const [loadingMyRequest, setLoadingMyRequest] = useState(true);
  const [orderCount, setOrderCount] = useState(0);
  const [shippingAddress, setShippingAddress] = useState('');
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  // Get current user identifiers
  const getCurrentUserIdentifiers = () => {
    if (!userInfo) return { uid: null, email: null, username: null };
    
    // Get user ID from userInfo (could be uid, id, or user.uid)
    const currentUserId = userInfo.uid || userInfo.id || (userInfo.user && userInfo.user.uid) || null;
    
    // Get email
    const currentUserEmail = userInfo.email || (userInfo.user && userInfo.user.email) || null;
    
    // Get username
    const currentUsername = userInfo.username || (userInfo.user && userInfo.user.username) || null;
    
    return {
      uid: currentUserId,
      email: currentUserEmail ? currentUserEmail.toLowerCase() : null,
      username: currentUsername ? currentUsername.toLowerCase() : null,
    };
  };

  // Fetch joiners and my receiver request on mount and when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      // Only load data if user is logged in
      // This prevents API calls during/after logout
      if (isLoggedIn) {
        loadJoiners();
        loadMyReceiverRequest();
      }
    }, [isLoggedIn])
  );

  // Fetch users when modal opens
  useEffect(() => {
    if (modalVisible) {
      fetchUsers('');
    }
  }, [modalVisible]);

  // Search users when search text changes (with debounce)
  useEffect(() => {
    if (modalVisible) {
      const debounceTimeout = setTimeout(() => {
        fetchUsers(searchText);
      }, 500);
      
      return () => clearTimeout(debounceTimeout);
    }
  }, [searchText, modalVisible]);

  const fetchUsers = async (query = '') => {
    try {
      setLoading(true);
      
      // Get authentication token
      const authToken = await getStoredAuthToken();
      
      const apiUrl = `${API_ENDPOINTS.SEARCH_USER}?query=${encodeURIComponent(query)}&userType=buyer&limit=5&offset=0`;
      
      // Build headers with optional auth token
      const headers = {
        'Content-Type': 'application/json'
      };
      
      if (authToken) {
        headers['Authorization'] = `Bearer ${authToken}`;
      }
      
      console.log('[MyShippingBuddiesScreen] Fetching users with URL:', apiUrl);
      console.log('[MyShippingBuddiesScreen] Headers:', headers);
      
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: headers
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('[MyShippingBuddiesScreen] API error response:', errorText);
        throw new Error(`Failed to fetch users: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      
      console.log('[MyShippingBuddiesScreen] API response:', {
        success: data?.success,
        resultsCount: data?.results?.length || 0,
        hasResults: !!data?.results
      });

      if (data && data.success && data.results) {
        console.log('[MyShippingBuddiesScreen] Raw API results:', data.results);
        
        // Get current user identifiers for filtering
        const currentUser = getCurrentUserIdentifiers();
        console.log('[MyShippingBuddiesScreen] Current user identifiers:', currentUser);
        
        // Filter to only include buyers (exclude admin and supplier) and exclude current user
        const buyerUsers = data.results.filter(user => {
          // Explicitly exclude admin and supplier - only include buyers
          const userType = user.userType;
          if (userType !== 'buyer' && userType) {
            return false; // Exclude non-buyers
          }
          
          // Exclude current user by ID
          if (currentUser.uid && user.id === currentUser.uid) {
            return false;
          }
          
          // Exclude current user by email (case-insensitive)
          if (currentUser.email && user.email) {
            if (user.email.toLowerCase() === currentUser.email) {
              return false;
            }
          }
          
          // Exclude current user by username (case-insensitive)
          if (currentUser.username) {
            const userUsername = (user.username || '').toLowerCase();
            if (userUsername && userUsername === currentUser.username) {
              return false;
            }
          }
          
          // Also check if email prefix matches current username (for cases where username is derived from email)
          if (currentUser.username && user.email) {
            const emailPrefix = user.email.split('@')[0].toLowerCase();
            if (emailPrefix === currentUser.username) {
              return false;
            }
          }
          
          // Check if current user's email prefix matches user's username
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
          // Extract username from email if username not available
          // Format: email prefix before @ symbol
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
            userType: user.userType || 'buyer', // Ensure userType is set
          };
        });
        
        console.log('[MyShippingBuddiesScreen] Filtered buyer users (excluding current user):', formattedUsers.length, formattedUsers);
        setUsers(formattedUsers);
      } else {
        console.warn('[MyShippingBuddiesScreen] API response missing success or results:', data);
        setUsers([]);
      }
    } catch (error) {
      console.error('[MyShippingBuddiesScreen] Error fetching users:', error);
      console.error('[MyShippingBuddiesScreen] Error details:', {
        message: error.message,
        stack: error.stack,
        query: query
      });
      // Show user-friendly error
      Alert.alert(
        'Search Error',
        `Unable to search users. ${error.message || 'Please try again.'}`,
        [{ text: 'OK' }]
      );
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectUser = (user) => {
    console.log('Selected user:', user);
    // Store the actual username from database (without @)
    const actualUsername = user.username && user.username.trim() 
      ? user.username.trim() 
      : (user.email ? user.email.split('@')[0] : '');
    
    // Display format with @ for UI
    const displayUsername = actualUsername ? `@${actualUsername}` : '';
    
    console.log('Setting receiver username to:', displayUsername, 'Actual username:', actualUsername);
    setReceiverUsername(displayUsername);
    setSelectedReceiverId(user.id); // Store user ID for reference
    setModalVisible(false);
    setSearchText('');
  };

  // Skeleton loading component for user items
  const SkeletonUserItem = ({ index = 0 }) => (
    <View style={[
      styles.modalUserItem,
      index !== 4 && styles.modalUserItemBorder
    ]}>
      {/* Avatar skeleton */}
      <View style={styles.modalSkeletonAvatar} />
      <View style={styles.modalUserInfo}>
        {/* Username skeleton with varying widths for realism */}
        <View style={[styles.modalSkeletonName, { width: 120 + (index % 3) * 30 }]} />
        {/* Name skeleton with varying widths */}
        <View style={[styles.modalSkeletonEmail, { width: 80 + (index % 4) * 20 }]} />
      </View>
    </View>
  );

  // Skeleton loading component for requester view
  const RequesterSkeleton = () => (
    <View style={styles.requesterContainer}>
      {/* Buddy Card Skeleton */}
      <View style={styles.buddyCard}>
        {/* Avatar Skeleton */}
        <View style={[styles.buddyAvatar, { backgroundColor: '#e0e0e0' }]} />
        
        {/* Details Skeleton */}
        <View style={styles.buddyDetails}>
          <View style={[styles.buddySkeletonName, { width: 166, height: 24, backgroundColor: '#e0e0e0', borderRadius: 4 }]} />
          <View style={[styles.buddySkeletonUsername, { width: 66, height: 22, backgroundColor: '#e0e0e0', borderRadius: 4, marginTop: 4 }]} />
        </View>
      </View>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
      </View>

      {/* Status Skeleton */}
      <View style={styles.statusContainer}>
        <View style={[styles.buddySkeletonStatus, { width: 100, height: 22, backgroundColor: '#e0e0e0', borderRadius: 4 }]} />
      </View>

      {/* Action Skeleton */}
      <View style={styles.actionContainer}>
        <View style={[styles.buddySkeletonButton, { width: 327, height: 48, backgroundColor: '#e0e0e0', borderRadius: 12 }]} />
      </View>
    </View>
  );

  // Skeleton loading component for receiver view
  const ReceiverSkeleton = () => (
    <View style={styles.joinersContainer}>
      {[1, 2].map((index) => (
        <View key={index} style={styles.joinerCard}>
          <View style={styles.joinerUserCard}>
            {/* Avatar Skeleton */}
            <View style={[styles.joinerAvatar, { backgroundColor: '#e0e0e0' }]} />
            
            {/* Content Skeleton */}
            <View style={styles.joinerContent}>
              {/* Name and Username Skeleton */}
              <View style={styles.joinerNameRow}>
                <View style={[styles.buddySkeletonName, { width: 120, height: 24, backgroundColor: '#e0e0e0', borderRadius: 4 }]} />
                <View style={[styles.buddySkeletonUsername, { width: 80, height: 22, backgroundColor: '#e0e0e0', borderRadius: 4, marginLeft: 4 }]} />
              </View>
              
              {/* Request Section Skeleton */}
              <View style={styles.requestSection}>
                <View style={[styles.buddySkeletonStatus, { width: 100, height: 22, backgroundColor: '#e0e0e0', borderRadius: 4, marginBottom: 12 }]} />
                <View style={styles.actionButtons}>
                  <View style={[styles.approveButton, { backgroundColor: '#e0e0e0', opacity: 0.6 }]} />
                  <View style={[styles.rejectButton, { backgroundColor: '#e0e0e0', opacity: 0.6 }]} />
                </View>
              </View>
            </View>
          </View>
        </View>
      ))}
    </View>
  );

  const loadJoiners = async () => {
    try {
      setLoadingJoiners(true);
      console.log('[MyShippingBuddiesScreen] Starting loadJoiners...');
      const result = await getBuddyRequestsApi();
      console.log('[MyShippingBuddiesScreen] getBuddyRequests API response:', JSON.stringify(result, null, 2));
      
      if (result && result.success) {
        const joinersList = result.data?.joiners || [];
        console.log('[MyShippingBuddiesScreen] Success! Found', joinersList.length, 'joiners:', joinersList);
        setJoiners(joinersList);
      } else {
        console.warn('[MyShippingBuddiesScreen] API returned unsuccessful result:', result);
        setJoiners([]);
      }
    } catch (error) {
      console.error('[MyShippingBuddiesScreen] Error loading joiners:', error);
      console.error('[MyShippingBuddiesScreen] Error stack:', error.stack);
      Alert.alert('Error', `Failed to load joiners: ${error.message || 'Unknown error'}`);
      setJoiners([]);
    } finally {
      setLoadingJoiners(false);
      console.log('[MyShippingBuddiesScreen] loadJoiners completed. joiners.length =', joiners.length);
    }
  };

  const loadMyReceiverRequest = async () => {
    try {
      setLoadingMyRequest(true);
      const result = await getMyReceiverRequestApi();
      console.log('[MyShippingBuddiesScreen] getMyReceiverRequest result:', JSON.stringify(result, null, 2));
      if (result && result.success && result.data && result.data.isJoiner) {
        console.log('[MyShippingBuddiesScreen] User is a joiner, setting myReceiverRequest');
        setMyReceiverRequest(result.data);
      } else {
        console.log('[MyShippingBuddiesScreen] User is NOT a joiner, clearing myReceiverRequest');
        setMyReceiverRequest(null);
      }
    } catch (error) {
      console.error('[MyShippingBuddiesScreen] Error loading my receiver request:', error);
      setMyReceiverRequest(null);
    } finally {
      setLoadingMyRequest(false);
    }
  };

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleCancelRequest = async () => {
    Alert.alert(
      'Request a Cancel',
      'Are you sure you want to request cancellation? The receiver will need to approve this request.',
      [
        {
          text: 'No',
          style: 'cancel',
        },
        {
          text: 'Yes',
          onPress: async () => {
            try {
              // Set status to pending_cancel optimistically
              setMyReceiverRequest(prev => prev ? { ...prev, status: 'pending_cancel' } : null);
              
              // Call API and wait for response
              const result = await cancelReceiverRequestApi();
              
              if (result.success) {
                // Show toast only on success
                showToast('Cancel request submitted. Waiting for receiver approval.', 'success');
                
                // Refresh the request to get updated status
                await loadMyReceiverRequest();
              } else {
                // Restore state on failure
                await loadMyReceiverRequest();
                showToast(result.message || 'Failed to submit cancel request', 'error');
              }
            } catch (error) {
              console.error('Error cancelling request:', error);
              // Restore state on error
              await loadMyReceiverRequest();
              showToast('Failed to submit cancel request. Please try again.', 'error');
            }
          },
        },
      ]
    );
  };

  const handleCreateGroup = async () => {
    if (!receiverUsername || !receiverUsername.trim()) {
      Alert.alert('Error', 'Please select a receiver username');
      return;
    }

    try {
      setSubmitting(true);
      
      // Use receiver ID if available, otherwise use username
      const result = await submitReceiverRequestApi(receiverUsername, selectedReceiverId);
      
      if (result.success) {
        // Clear the input first
        setReceiverUsername('');
        setSelectedReceiverId(null);
        
        // Set loading state to show skeleton while fetching
        setLoadingMyRequest(true);
        
        // Refresh both joiners and my request after successful submission
        await Promise.all([loadJoiners(), loadMyReceiverRequest()]);
        
        Alert.alert(
          'Success',
          'Receiver request submitted successfully!',
          [{ text: 'OK' }]
        );
      } else {
        throw new Error(result.message || 'Failed to submit receiver request');
      }
    } catch (error) {
      console.error('Error submitting receiver request:', error);
      Alert.alert(
        'Error',
        error.message || 'Failed to submit receiver request. Please try again.',
        [{ text: 'OK' }]
      );
    } finally {
      setSubmitting(false);
    }
  };

  const handleApproveReject = async (requestId, action) => {
    if (!requestId) {
      console.error('❌ handleApproveReject: requestId is missing');
      Alert.alert('Error', 'Request ID is missing. Please try again.');
      return;
    }

    console.log(`🔄 [handleApproveReject] Starting ${action} for requestId:`, requestId);
    
    try {
      // Show loading state
      setLoadingJoiners(true);
      
      console.log(`📡 [handleApproveReject] Calling API with:`, { requestId, action });
      const result = await approveRejectBuddyRequestApi(requestId, action);
      
      console.log(`📥 [handleApproveReject] API Response:`, JSON.stringify(result, null, 2));
      
      if (result.success) {
        console.log(`✅ [handleApproveReject] ${action} successful, refreshing data...`);
        
        // Refresh both joiners and my request
        await Promise.all([
          loadJoiners(),
          loadMyReceiverRequest()
        ]);
        
        console.log(`✅ [handleApproveReject] Data refreshed successfully`);
        
        Alert.alert(
          'Success',
          `Request ${action}d successfully!`,
          [{ text: 'OK' }]
        );
      } else {
        console.error(`❌ [handleApproveReject] API returned success: false`, result);
        throw new Error(result.message || result.error || `Failed to ${action} request`);
      }
    } catch (error) {
      console.error(`❌ [handleApproveReject] Error ${action}ing request:`, error);
      console.error(`❌ [handleApproveReject] Error details:`, {
        message: error.message,
        stack: error.stack,
        requestId,
        action
      });
      
      Alert.alert(
        'Error',
        error.message || `Failed to ${action} request. Please try again.`,
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingJoiners(false);
    }
  };

  const formatExpirationDate = (dateString) => {
    if (!dateString) return null;
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric'
      });
    } catch (error) {
      console.error('Error formatting date:', error);
      return null;
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar backgroundColor="#DFECDF" barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, {paddingTop: Math.min(insets.top, 40)}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <LeftIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Shipping Buddies</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView
        style={styles.content}
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.scrollContentContainer}>
        {(() => {
          console.log('[MyShippingBuddiesScreen] Render state:', {
            loadingJoiners,
            loadingMyRequest,
            hasMyReceiverRequest: !!myReceiverRequest,
            joinersCount: joiners?.length || 0,
            joiners: joiners
          });
          return null;
        })()}
        {loadingJoiners && loadingMyRequest ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#539461" />
          </View>
        ) : loadingMyRequest ? (
          // Show skeleton for requester view while loading
          <RequesterSkeleton />
        ) : loadingJoiners ? (
          // Show skeleton for receiver view while loading joiners
          <ReceiverSkeleton />
        ) : myReceiverRequest ? (
          // Requester View (User is a joiner)
          <View style={styles.requesterContainer}>
            {/* Buddy Card */}
            <View style={styles.buddyCard}>
              {/* Avatar */}
              <View style={styles.buddyAvatar}>
                {myReceiverRequest.receiver.profileImage ? (
                  <Image
                    source={{uri: myReceiverRequest.receiver.profileImage}}
                    style={styles.buddyAvatarImage}
                  />
                ) : (
                  <View style={styles.buddyAvatarPlaceholder}>
                    <Text style={styles.buddyAvatarText}>
                      {(myReceiverRequest.receiver.firstName?.[0] || myReceiverRequest.receiver.username?.[0] || 'U').toUpperCase()}
                    </Text>
                  </View>
                )}
              </View>

              {/* Details */}
              <View style={styles.buddyDetails}>
                <Text style={styles.buddyName}>
                  {`${myReceiverRequest.receiver.firstName || ''} ${myReceiverRequest.receiver.lastName || ''}`.trim() || 'Unknown User'}
                </Text>
                <Text style={styles.buddyUsername}>
                  @{myReceiverRequest.receiver.username || 'unknown'}
                </Text>
              </View>
            </View>

            {/* Divider */}
            <View style={styles.dividerContainer}>
              <View style={styles.divider} />
            </View>

            {myReceiverRequest.status === 'approved' || myReceiverRequest.status === 'pending_cancel' ? (
              // Approved View - Show Details
              <>
                {/* My Current Orders Section */}
                <View style={styles.myCurrentOrdersSection}>
                  <Text style={styles.myCurrentOrdersTitle}>
                    Buddy Details
                  </Text>
                </View>

                {/* Details Section */}
                <View style={styles.detailsSection}>
                  {/* Title */}
                  <View style={styles.detailsTitleRow}>
                    <Text style={styles.detailsTitle}>Order</Text>
                  </View>

                  {/* Order Row */}
                  <View style={styles.detailRowOrder}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M20 7H16V4C16 2.9 15.1 2 14 2H10C8.9 2 8 2.9 8 4V7H4C2.9 7 2 7.9 2 9V20C2 21.1 2.9 22 4 22H20C21.1 22 22 21.1 22 20V9C22 7.9 21.1 7 20 7ZM10 4H14V7H10V4ZM20 20H4V9H20V20Z"
                        fill="#556065"
                      />
                      <Path
                        d="M11 11H13V13H11V11ZM11 15H13V17H11V15ZM15 11H17V13H15V11ZM15 15H17V17H15V15Z"
                        fill="#556065"
                      />
                    </Svg>
                    <View style={styles.detailContentOrder}>
                      <View style={styles.detailTextRow}>
                        <Text style={styles.detailData}>My Current Orders ({myReceiverRequest.orderCount || 0})</Text>
                        <TouchableOpacity 
                          style={styles.viewOrdersLink}
                          onPress={() => {
                            // Navigate to orders screen
                            navigation.navigate('Orders');
                          }}>
                          <Text style={styles.viewOrdersText}>View Orders</Text>
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>

                  {/* Date Row */}
                  <View style={styles.detailRow}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path
                        fillRule="evenodd"
                        clipRule="evenodd"
                        d="M7.5 1.5C7.91421 1.5 8.25 1.83579 8.25 2.25V3H15.75V2.25C15.75 1.83579 16.0858 1.5 16.5 1.5C16.9142 1.5 17.25 1.83579 17.25 2.25V3H19.5C20.3284 3 21 3.67157 21 4.5V19.5C21 20.3284 20.3284 21 19.5 21H4.5C3.67157 21 3 20.3284 3 19.5V4.5C3 3.67157 3.67157 3 4.5 3H6.75V2.25C6.75 1.83579 7.08579 1.5 7.5 1.5ZM6.75 4.5H4.5V7.5H19.5V4.5H17.25V5.25C17.25 5.66421 16.9142 6 16.5 6C16.0858 6 15.75 5.66421 15.75 5.25V4.5H8.25V5.25C8.25 5.66421 7.91421 6 7.5 6C7.08579 6 6.75 5.66421 6.75 5.25V4.5ZM19.5 9H4.5V19.5H19.5V9Z"
                        fill="#556065"
                      />
                    </Svg>
                    <View style={styles.detailContent}>
                      <View style={styles.detailTextRow}>
                        <Text style={styles.detailData}>
                          {formatExpirationDate(myReceiverRequest.expirationDate) || 'N/A'}
                        </Text>
                      </View>
                      <Text style={styles.detailLabel}>
                        Air cargo date
                      </Text>
                    </View>
                  </View>

                  {/* Shipping Row */}
                  <View style={styles.detailRow}>
                    <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                      <Path
                        d="M20 8H17V6C17 4.9 16.1 4 15 4H9C7.9 4 7 4.9 7 6V8H4C2.9 8 2 8.9 2 10V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V10C22 8.9 21.1 8 20 8ZM9 6H15V8H9V6ZM20 19H4V10H20V19Z"
                        fill="#556065"
                      />
                      <Path
                        d="M12 12C13.1 12 14 12.9 14 14C14 15.1 13.1 16 12 16C10.9 16 10 15.1 10 14C10 12.9 10.9 12 12 12Z"
                        fill="#556065"
                      />
                    </Svg>
                    <View style={styles.detailContent}>
                      <View style={styles.detailTextRow}>
                        <Text style={styles.detailData}>
                          {myReceiverRequest.shippingAddress || `${myReceiverRequest.receiver.firstName || 'Receiver'} ${myReceiverRequest.receiver.lastName || ''}`.trim()}
                        </Text>
                      </View>
                      <Text style={styles.detailLabel}>
                        Shipping address
                      </Text>
                    </View>
                  </View>
                </View>

                {/* Divider */}
                <View style={styles.dividerContainer}>
                  <View style={styles.divider} />
                </View>

                {/* Note Section */}
                <View style={styles.approvedNoteContainer}>
                  <Text style={styles.approvedNoteBold}>
                    You can only ship to one receiver per air cargo date.
                  </Text>
                  <Text style={styles.approvedNoteText}>
                    Once your request is approved, checkout will be limited to your assigned receiver instead of your personal address.
                  </Text>
                  <Text style={styles.approvedNoteText}>
                    To become a receiver, your buddy or buddies must submit a receiver request using your username.
                  </Text>
                </View>

                {/* Action */}
                <View style={styles.actionContainer}>
                  {myReceiverRequest.status === 'pending_cancel' ? (
                    <TouchableOpacity
                      style={styles.pendingCancelButton}
                      disabled={true}
                      activeOpacity={0.8}>
                      <Text style={styles.pendingCancelButtonText}>Pending Cancel</Text>
                    </TouchableOpacity>
                  ) : (
                    <TouchableOpacity
                      style={styles.cancelButton}
                      onPress={handleCancelRequest}
                      activeOpacity={0.8}>
                      <Text style={styles.cancelButtonText}>Cancel Request</Text>
                    </TouchableOpacity>
                  )}
                </View>
              </>
            ) : (
              // Pending View - Show Status and Cancel Button
              <>
                {/* Status */}
                <View style={styles.statusContainer}>
                  <Text style={styles.statusLabel}>
                    Request sent, waiting for approval
                  </Text>
                </View>

                {/* Action */}
                <View style={styles.actionContainer}>
                  <TouchableOpacity
                    style={styles.cancelButton}
                    onPress={handleCancelRequest}
                    activeOpacity={0.8}>
                    <Text style={styles.cancelButtonText}>Cancel Request</Text>
                  </TouchableOpacity>
                </View>
              </>
            )}
          </View>
        ) : (joiners && joiners.length > 0) ? (
          // Show all joiners (approved, pending, pending_cancel) in the list
          <View style={styles.joinersListContainer}>
            <View style={styles.joinersContainer}>
              {joiners.map((joiner, index) => {
                    console.log(`[MyShippingBuddiesScreen] Rendering joiner ${index}:`, {
                      requestId: joiner.requestId,
                      status: joiner.status,
                      requesterUid: joiner.requesterUid,
                      firstName: joiner.firstName
                    });
                    return (
                      <View key={joiner.requestId || index} style={styles.joinerCard}>
                <View style={styles.joinerUserCard}>
                  {/* Avatar */}
                  <View style={styles.joinerAvatarContainer}>
                    <View style={styles.joinerAvatar}>
                      {joiner.profileImage ? (
                        <Image
                          source={{uri: joiner.profileImage}}
                          style={styles.joinerAvatarImage}
                        />
                      ) : (
                        <View style={styles.joinerAvatarPlaceholder}>
                          <Text style={styles.joinerAvatarText}>
                            {(joiner.firstName?.[0] || joiner.username?.[0] || 'U').toUpperCase()}
                          </Text>
                        </View>
                      )}
                    </View>
                  </View>

                  {/* Content */}
                  <View style={styles.joinerContent}>
                    {/* Name and Username */}
                    <View style={styles.joinerNameRow}>
                      <Text style={styles.joinerName}>
                        {`${joiner.firstName || ''} ${joiner.lastName || ''}`.trim() || 'Unknown User'}
                      </Text>
                      <Text style={styles.joinerUsername}>
                        @{joiner.username || joiner.requesterUsername || 'unknown'}
                      </Text>
                    </View>

                    {/* Expiration Date (for approved joiners only) */}
                    {joiner.status === 'approved' && joiner.expirationDate && (
                      <View style={styles.expirationDateRow}>
                        <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                          <Path
                            fillRule="evenodd"
                            clipRule="evenodd"
                            d="M7.5 1.5C7.91421 1.5 8.25 1.83579 8.25 2.25V3H15.75V2.25C15.75 1.83579 16.0858 1.5 16.5 1.5C16.9142 1.5 17.25 1.83579 17.25 2.25V3H19.5C20.3284 3 21 3.67157 21 4.5V19.5C21 20.3284 20.3284 21 19.5 21H4.5C3.67157 21 3 20.3284 3 19.5V4.5C3 3.67157 3.67157 3 4.5 3H6.75V2.25C6.75 1.83579 7.08579 1.5 7.5 1.5ZM6.75 4.5H4.5V7.5H19.5V4.5H17.25V5.25C17.25 5.66421 16.9142 6 16.5 6C16.0858 6 15.75 5.66421 15.75 5.25V4.5H8.25V5.25C8.25 5.66421 7.91421 6 7.5 6C7.08579 6 6.75 5.66421 6.75 5.25V4.5ZM19.5 9H4.5V19.5H19.5V9Z"
                            fill="#556065"
                          />
                        </Svg>
                        <Text style={styles.expirationDateText}>
                          {formatExpirationDate(joiner.expirationDate)}
                        </Text>
                      </View>
                    )}

                    {/* Request Section (only for pending and pending_cancel, not approved) */}
                    {joiner.status === 'pending_cancel' ? (
                      <View style={styles.requestSection}>
                        <Text style={styles.requestLabel}>Request to cancel</Text>
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={styles.approveButton}
                            onPress={() => {
                              console.log(`[MyShippingBuddiesScreen] Approve cancel button pressed for joiner:`, {
                                requestId: joiner.requestId,
                                status: joiner.status,
                                joiner: joiner
                              });
                              handleApproveReject(joiner.requestId, 'approve');
                            }}
                            activeOpacity={0.8}>
                            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                              <Path
                                d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"
                                fill="#FFFFFF"
                              />
                            </Svg>
                            <Text style={styles.approveButtonText}>Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.rejectButton}
                            onPress={() => {
                              console.log(`[MyShippingBuddiesScreen] Reject cancel button pressed for joiner:`, {
                                requestId: joiner.requestId,
                                status: joiner.status,
                                joiner: joiner
                              });
                              handleApproveReject(joiner.requestId, 'reject');
                            }}
                            activeOpacity={0.8}>
                            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                              <Path
                                d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                                fill="#FFFFFF"
                              />
                            </Svg>
                            <Text style={styles.rejectButtonText}>Decline</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : joiner.status === 'pending' ? (
                      <View style={styles.requestSection}>
                        <Text style={styles.requestLabel}>Request to join</Text>
                        <View style={styles.actionButtons}>
                          <TouchableOpacity
                            style={styles.approveButton}
                            onPress={() => {
                              console.log(`[MyShippingBuddiesScreen] Approve button pressed for joiner:`, {
                                requestId: joiner.requestId,
                                status: joiner.status,
                                joiner: joiner
                              });
                              handleApproveReject(joiner.requestId, 'approve');
                            }}
                            activeOpacity={0.8}>
                            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                              <Path
                                d="M9 16.17L4.83 12L3.41 13.41L9 19L21 7L19.59 5.59L9 16.17Z"
                                fill="#FFFFFF"
                              />
                            </Svg>
                            <Text style={styles.approveButtonText}>Accept</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.rejectButton}
                            onPress={() => {
                              console.log(`[MyShippingBuddiesScreen] Reject button pressed for joiner:`, {
                                requestId: joiner.requestId,
                                status: joiner.status,
                                joiner: joiner
                              });
                              handleApproveReject(joiner.requestId, 'reject');
                            }}
                            activeOpacity={0.8}>
                            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                              <Path
                                d="M19 6.41L17.59 5L12 10.59L6.41 5L5 6.41L10.59 12L5 17.59L6.41 19L12 13.41L17.59 19L19 17.59L13.41 12L19 6.41Z"
                                fill="#FFFFFF"
                              />
                            </Svg>
                            <Text style={styles.rejectButtonText}>Decline</Text>
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : null}
                  </View>
                </View>
              </View>
            );
          })}
            </View>
            {/* Note */}
            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>
                Note: You may request a receiver only when there are no existing joiners.
              </Text>
            </View>
          </View>
        ) : (
          <View style={styles.emptyStateContainer}>
            {/* Icon Section */}
            <View style={styles.iconSection}>
              <ShippingBuddiesIcon width={96} height={96} />
            </View>

            {/* Title Section */}
            <View style={styles.titleSection}>
              <Text style={styles.titleText}>
                Request a receiver or be one
              </Text>
            </View>

            {/* Note Section */}
            <View style={styles.noteSection}>
              <Text style={styles.noteText}>
              You can only ship to one receiver per air cargo date. Once your request is approved, checkout will be limited to your assigned receiver instead of your personal address.
              </Text>
              <Text style={styles.noteText}>
              To become a receiver, your buddy or buddies must submit a receiver request using your username.
              </Text>
            </View>

            {/* Address Input Section */}
            <View style={styles.addressSection}>
              <View style={styles.inputContainer}>
                <Text style={styles.inputLabel}>Receiver Username</Text>
                <Pressable
                  onPress={() => {
                    console.log('Opening modal...');
                    setModalVisible(true);
                  }}
                  style={styles.inputPressable}>
                  <View style={styles.textInput}>
                    <Text
                      style={[
                        styles.textInputText,
                        !receiverUsername && styles.textInputPlaceholder,
                      ]}>
                      {receiverUsername || 'Ex. @john123'}
                    </Text>
                  </View>
                </Pressable>
              </View>

              <TouchableOpacity
                style={[styles.createButton, submitting && styles.createButtonDisabled]}
                onPress={handleCreateGroup}
                activeOpacity={0.8}
                disabled={submitting || !receiverUsername}>
                {submitting ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <Text style={styles.createButtonText}>Submit a Receiver Request</Text>
                )}
              </TouchableOpacity>
            </View>
          </View>
        )}
      </ScrollView>

      {/* Receiver Username Selection Modal */}
      <Modal
        visible={modalVisible}
        animationType="slide"
        transparent
        onRequestClose={() => setModalVisible(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Header */}
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Receiver</Text>
              <Pressable
                onPress={() => {
                  setModalVisible(false);
                  setSearchText('');
                }}
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
                onChangeText={setSearchText}
                autoFocus={true}
              />
            </View>

            {/* User List */}
            {loading ? (
              <ScrollView style={styles.modalUserList}>
                {Array.from({length: 5}).map((_, idx) => (
                  <SkeletonUserItem key={idx} index={idx} />
                ))}
              </ScrollView>
            ) : users.length > 0 ? (
              <ScrollView style={styles.modalUserList}>
                {users.map((user, index) => (
                  <TouchableOpacity
                    key={user.id || index}
                    onPress={() => handleSelectUser(user)}
                    style={[
                      styles.modalUserItem,
                      index !== users.length - 1 && styles.modalUserItemBorder,
                    ]}>
                    <View style={styles.modalUserAvatar}>
                      {user.profileImage ? (
                        <Image
                          source={{uri: user.profileImage}}
                          style={styles.modalAvatarImage}
                        />
                      ) : (
                        <View style={styles.modalAvatarPlaceholder}>
                          <Text style={styles.modalAvatarText}>
                            {(user.firstName?.[0] || user.username?.[0] || 'U').toUpperCase()}
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

        {/* Toast Notification */}
        <Toast
          visible={toastVisible}
          message={toastMessage}
          type={toastType}
          onHide={() => setToastVisible(false)}
        />
      </SafeAreaView>
    );
  };

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#DFECDF',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 30,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '900',
    color: '#393D40',
    marginTop: 30,
    flex: 1,
    textAlign: 'center',
  },
  headerSpacer: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollContentContainer: {
    paddingBottom: 34,
    minHeight: 812,
  },
  emptyStateContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 50,
    paddingBottom: 34,
    width: '100%',
    flex: 1,
  },
  iconSection: {
    flexDirection: 'row',
    alignItems: 'left',
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: '100%',
    height: 120,
    justifyContent: 'left',
  },
  titleSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 12,
    width: '100%',
    height: 96,
  },
  titleText: {
    width: 280,
    height: 64,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 32,
    color: '#202325',
    textAlignVertical: 'center',
  },
  noteSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
    width: '100%',
    height: 212,
  },
  noteText: {
    width: 327,
    height: 40,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
    alignSelf: 'stretch',
    width: 327,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    alignSelf: 'stretch',
  },
  addressSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 24,
    gap: 16,
    width: '100%',
    height: 190,
  },
  inputContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 8,
    width: 327,
    height: 78,
    alignSelf: 'stretch',
  },
  inputLabel: {
    width: 327,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    alignSelf: 'stretch',
  },
  inputPressable: {
    width: 327,
    alignSelf: 'stretch',
  },
  textInput: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    width: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    justifyContent: 'flex-start',
  },
  textInputText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  textInputPlaceholder: {
    color: '#647276',
  },
  createButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
  },
  createButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  createButtonDisabled: {
    opacity: 0.6,
  },
  contentContainer: {
    paddingHorizontal: 24,
    paddingTop: 24,
  },
  placeholderText: {
    fontSize: 16,
    color: '#556065',
    textAlign: 'center',
    marginTop: 20,
  },
  // Modal styles
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  modalContainer: {
    backgroundColor: '#fff',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    paddingHorizontal: 24,
    maxHeight: 600,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 24,
    paddingBottom: 12,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  modalCloseButton: {
    padding: 8,
    borderRadius: 20,
  },
  modalCloseText: {
    fontSize: 20,
    color: '#7F8D91',
    fontWeight: 'bold',
  },
  modalSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 48,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    paddingHorizontal: 16,
    marginBottom: 12,
  },
  modalSearchIcon: {
    fontSize: 16,
    color: '#7F8D91',
    marginRight: 12,
  },
  modalSearchInput: {
    fontSize: 16,
    color: '#000',
    flex: 1,
  },
  modalSkeletonAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e0e0e0',
    marginRight: 12,
  },
  modalSkeletonName: {
    height: 16,
    backgroundColor: '#e0e0e0',
    borderRadius: 4,
    marginBottom: 6,
  },
  modalSkeletonEmail: {
    height: 12,
    backgroundColor: '#e0e0e0',
    borderRadius: 3,
  },
  modalUserList: {
    paddingVertical: 8,
  },
  modalUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  modalUserItemBorder: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E8EA',
  },
  modalUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 12,
    overflow: 'hidden',
  },
  modalAvatarImage: {
    width: 40,
    height: 40,
    borderRadius: 20,
  },
  modalAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#539461',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalAvatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  modalUserInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  modalUserName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
  },
  modalUserFullName: {
    fontSize: 12,
    color: '#647276',
    marginTop: 2,
  },
  modalEmptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  modalEmptyText: {
    fontSize: 14,
    color: '#647276',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  joinersContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 6,
    paddingBottom: 40,
    backgroundColor: '#F5F6F6',
    flex: 1,
    width: '100%',
  },
  joinerCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 6,
    paddingHorizontal: 12,
    gap: 12,
    width: '100%',
    backgroundColor: '#F5F6F6',
  },
  joinerUserCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    width: 351,
    height: 76,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  joinerAvatarContainer: {
    width: 40,
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 10,
    height: 52,
    alignSelf: 'stretch',
  },
  joinerAvatar: {
    width: 40,
    height: 40,
    minWidth: 40,
    minHeight: 40,
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: '#539461',
    overflow: 'hidden',
  },
  joinerAvatarImage: {
    width: '100%',
    height: '100%',
  },
  joinerAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#DFECDF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  joinerAvatarText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#539461',
  },
  joinerContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 4,
    flex: 1,
    width: 275,
    height: 52,
  },
  joinerNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 4,
    width: 275,
    height: 24,
  },
  joinerName: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    height: 24,
  },
  joinerUsername: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#7F8D91',
    flex: 1,
    flexWrap: 'wrap',
  },
  expirationDateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: 275,
    height: 24,
    alignSelf: 'stretch',
  },
  expirationDateText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    width: 164,
    height: 22,
  },
  requestSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 12,
    width: 275,
    alignSelf: 'stretch',
  },
  requestLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    width: 275,
    height: 22,
    alignSelf: 'stretch',
  },
  actionButtons: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 6,
    width: 275,
    height: 40,
    alignSelf: 'stretch',
  },
  approveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 112,
    height: 40,
    minHeight: 40,
    backgroundColor: '#539461',
    borderRadius: 12,
  },
  approveButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    width: 56,
    height: 16,
    display: 'flex',
    alignItems: 'center',
  },
  rejectButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 10,
    paddingVertical: 8,
    width: 114,
    height: 40,
    minHeight: 40,
    backgroundColor: '#414649',
    borderRadius: 12,
  },
  rejectButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    width: 58,
    height: 16,
    display: 'flex',
    alignItems: 'center',
  },
  noteContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
    width: '100%',
    height: 64,
    borderRadius: 0,
    alignSelf: 'stretch',
    order: 4,
    flexGrow: 0,
    width: '100%',
  },
  noteBoldText: {
    width: 327,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
    alignSelf: 'stretch',
  },
  receiverNoteContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
    width: 375,
    height: 64,
  },
  receiverNoteText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
    width: 327,
    height: 40,
  },
  // Requester View Styles
  requesterContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 30,
    paddingBottom: 34,
    width: '100%',
    flex: 1,
  },
  buddyCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
    width: '100%',
    height: 88,
  },
  buddyAvatar: {
    width: 64,
    height: 64,
    minWidth: 64,
    minHeight: 64,
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: '#539461',
    overflow: 'hidden',
  },
  buddyAvatarImage: {
    width: '100%',
    height: '100%',
  },
  buddyAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#DFECDF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buddyAvatarText: {
    fontFamily: 'Inter',
    fontSize: 24,
    fontWeight: '600',
    color: '#539461',
  },
  buddyDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    flex: 1,
    height: 50,
  },
  buddyName: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    color: '#202325',
    width: 166,
    height: 24,
  },
  buddyUsername: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#7F8D91',
    flex: 1,
    flexWrap: 'wrap',
  },
  dividerContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingVertical: 8,
    width: '100%',
    height: 28,
  },
  divider: {
    width: '100%',
    height: 12,
    backgroundColor: '#F5F6F6',
  },
  statusContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
    width: '100%',
    height: 46,
  },
  statusLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#539461',
    width: 327,
    height: 22,
  },
  actionContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 24,
    width: '100%',
    height: 84,
  },
  cancelButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#393D40',
    textAlign: 'center',
  },
  pendingCancelButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#DC3545',
    borderWidth: 1,
    borderColor: '#DC3545',
    borderRadius: 12,
  },
  pendingCancelButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  // Skeleton styles for requester view
  buddySkeletonName: {
    marginBottom: 4,
  },
  buddySkeletonUsername: {
    marginTop: 4,
  },
  buddySkeletonStatus: {
    marginTop: 0,
  },
  buddySkeletonButton: {
    marginTop: 0,
  },
  // Approved View Styles
  detailsSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
    width: '100%',
  },
  detailsTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    height: 24,
  },
  detailsTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    color: '#393D40',
    width: 109,
    height: 24,
  },
  myCurrentOrdersSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
    width: '100%',
  },
  myCurrentOrdersTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    color: '#393D40',
    width: '100%',
    height: 24,
  },
  detailRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
    height: 48,
  },
  detailRowOrder: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
    height: 24,
  },
  detailContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 2,
    flex: 1,
    height: 48,
  },
  detailContentOrder: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    flex: 1,
    height: 24,
  },
  detailTextRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    height: 24,
    flex: 1,
  },
  detailData: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  viewOrdersLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 22,
    width: 96,
    justifyContent: 'center',
  },
  viewOrdersText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#539461',
    textAlign: 'center',
  },
  detailLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#7F8D91',
    width: '100%',
    height: 22,
  },
  approvedNoteContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
    width: '100%',
  },
  approvedNoteBold: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
    width: 327,
    height: 20,
    alignSelf: 'stretch',
  },
  approvedNoteText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
    width: 327,
    alignSelf: 'stretch',
  },
});

export default MyShippingBuddiesScreen;

