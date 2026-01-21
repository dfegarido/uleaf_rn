import { useFocusEffect } from '@react-navigation/native';
import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  limit,
  onSnapshot,
  orderBy,
  query,
  startAfter,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TouchableOpacity, View, Alert } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { db } from '../../../firebase';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import { AuthContext } from '../../auth/AuthProvider';
import ChatBubble from '../../components/ChatBubble/ChatBubble';
import DateSeparator from '../../components/DateSeparator/DateSeparator';
import MessageInput from '../../components/MessageInput/MessageInput';
import { uploadChatImage } from '../../utils/uploadChatImage';

const ChatScreen = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  
  // Calculate proper bottom padding for safe area
  const safeBottomPadding = Math.max(insets.bottom, 8); // At least 8px padding
  
  const routeParams = route?.params || {};

  const avatarUrl = routeParams.avatarUrl || '';
  const chatType = routeParams.type || 'private'; // Get chat type: 'group' or 'private'
  const name = routeParams.name || routeParams.title || '';
  const id = routeParams.id || routeParams.chatId || null;
  const participantIds = Array.isArray(routeParams.participantIds) ? routeParams.participantIds : (Array.isArray(routeParams.participants) ? routeParams.participants.map(p => p.uid).filter(Boolean) : []);
  const participants = Array.isArray(routeParams.participants) ? routeParams.participants : [];
  const {userInfo} = useContext(AuthContext);
  const flatListRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const lastMessageRef = useRef(null);
  const messagesUnsubscribeRef = useRef(null);

  // Handle admin API response: userInfo.data.uid, regular nested: userInfo.user.uid, or flat: userInfo.uid
  const currentUserUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';
  console.log('userInfouserInfo', userInfo);
  
  // Check if current user is a buyer (only buyers can request to join public groups)
  const isBuyer =
    userInfo?.user?.userType === 'buyer' ||
    userInfo?.data?.userType === 'buyer' ||
    userInfo?.userType === 'buyer';

  // If seller is invited but not a member, redirect to settings
  const isSeller = 
    userInfo?.user?.userType === 'supplier' || 
    userInfo?.data?.userType === 'supplier' ||
    userInfo?.userType === 'supplier';  
  const canChatListing = userInfo?.canChatListing || false;
  
  // Make sure participants is an array and has at least one element
  // For group chats, we want to show the group name
  // For private chats, get the other participant's UID for looking up their username
  const otherParticipant = chatType === 'group' 
    ? null 
    : (participants.find(p => p?.uid !== currentUserUid) || participants[0]);
  const otherParticipantUid = otherParticipant?.uid;
  
  const otherUserInfo = chatType === 'group' 
    ? { name: name, avatarUrl: '' }  // Group chats use the group name
    : (Array.isArray(participants) && participants.length > 0
      ? participants.find(p => p?.uid !== currentUserUid) || participants[0]
      : {});
    
  // Process avatarUrl if it's a number (e.g., requiring a local asset) or other non-string type
  if (otherUserInfo?.avatarUrl !== undefined && typeof otherUserInfo.avatarUrl !== 'string') {
    // If it's a number, it might be referencing a local asset ID
    // We'll keep it as is and handle it in getAvatarSource()
  }

  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  // Map of uid -> { name, avatarUrl } for participants (fetched from Firestore)
  const [participantDataMap, setParticipantDataMap] = useState({});
  // Map of uid -> avatar URL for participants (for backward compatibility)
  const [avatarMap, setAvatarMap] = useState({});
  // Ref to track which UIDs we're currently fetching to avoid duplicate requests
  const fetchingRef = useRef(new Set());
  // Join request state
  const [isPublicGroup, setIsPublicGroup] = useState(false);
  const [isMember, setIsMember] = useState(true);
  const [hasPendingRequest, setHasPendingRequest] = useState(false);
  const [hasRejectedRequest, setHasRejectedRequest] = useState(false);
  const [requestingJoin, setRequestingJoin] = useState(false);
  
  // Default avatar for fallback
  const DefaultAvatar = require('../../assets/images/AvatarBig.png');

  // Helper function to check if an avatar source is valid (not default)
  const isValidAvatar = (source) => {
    if (!source) return false;
    // If it's the default avatar (numeric require), it's not valid
    if (typeof source === 'number') return false;
    // If it's an object with uri, check if it's a valid URL
    if (typeof source === 'object' && source.uri) {
      return typeof source.uri === 'string' && source.uri.trim() !== '' && source.uri.startsWith('http');
    }
    // If it's a string, check if it's a valid URL
    if (typeof source === 'string') {
      return source.trim() !== '' && source.startsWith('http');
    }
    return false;
  };

  // Helper to normalize avatar source format
  const normalizeAvatarSource = (source) => {
    if (!source) return DefaultAvatar;
    if (typeof source === 'string' && source.startsWith('http')) {
      return { uri: source };
    }
    if (typeof source === 'object' && source.uri) {
      return source;
    }
    return DefaultAvatar;
  };

  // Component to render two overlapping avatar circles for group chats
  // Requirements: 
  // - Container: 32×32 (same size as single avatar in header)
  // - Each avatar: ~24×24 (adjusted size)
  // - One avatar at bottom-left corner
  // - One avatar at top-right corner
  // - They overlap diagonally in the center
  const GroupAvatar = ({avatarSources, size = 32}) => {
    // Filter to get valid avatars first
    const validAvatars = avatarSources.filter(isValidAvatar);
    
    // Get first 2 avatars (valid ones first, then fill with defaults if needed)
    const avatarsToShow = [];
    for (let i = 0; i < 2; i++) {
      if (i < validAvatars.length) {
        avatarsToShow.push(normalizeAvatarSource(validAvatars[i]));
      } else {
        // Fill with default avatar if we don't have enough valid ones
        avatarsToShow.push(DefaultAvatar);
      }
    }
    
    const containerSize = size; // 32×32 (same as single avatar)
    const avatarSize = size / 1.3; // ~24×24 (adjusted size for each avatar in group)
    const radius = avatarSize / 2;
    
    return (
      <View style={[styles.groupAvatarOverlapContainer, {width: containerSize, height: containerSize}]}>
        {/* First avatar (bottom left corner) */}
        <Image 
          source={avatarsToShow[0]} 
          style={[
            styles.groupAvatarOverlap,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: radius,
              position: 'absolute',
              left: 0,
              bottom: 0,
              zIndex: 1,
            }
          ]}
          resizeMode="cover"
        />
        {/* Second avatar (top right corner, overlapping diagonally) */}
        <Image 
          source={avatarsToShow[1]} 
          style={[
            styles.groupAvatarOverlap,
            {
              width: avatarSize,
              height: avatarSize,
              borderRadius: radius,
              position: 'absolute',
              right: 0,
              top: 0,
              zIndex: 2,
            }
          ]}
          resizeMode="cover"
        />
      </View>
    );
  };

  // Submit join request for public group
  const handleJoinRequest = async () => {
    if (!id || !currentUserUid || !isPublicGroup || isMember) return;

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
      
      // Check if request already exists
      const joinRequestsRef = collection(db, 'chats', id, 'joinRequests');
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

  // Send a message: create message doc and update chat metadata
  const sendMessage = async (text, isListing = false, listingId = null, imageUrl = null, imageUrls = null) => {
    if (!id) {
      return;
    }

    // Block sending messages if user is not a member
    if (chatType === 'group' && !isMember) {
      Alert.alert('Access Denied', 'You must be a member of this group to send messages.');
      return;
    }

    // Must have either text, single image, or multiple images
    if (!text?.trim() && !imageUrl && (!imageUrls || imageUrls.length === 0)) return;

    const optimisticId = `temp-${Date.now()}-${Math.random()}`;
    const newMsg = {
      id: optimisticId,
      chatId: id,
      senderId: currentUserUid || null,
      text: text?.trim() || '',
      timestamp: Timestamp.now(),
      isListing,
      listingId,
      imageUrl: imageUrl || null,
      imageUrls: imageUrls || null,
      optimistic: true, // Flag for optimistic message
    };

    // Optimistically add message to local state immediately
    setMessages(prev => [newMsg, ...prev]);

    try {
      // Add message to messages collection in background
      const docRef = await addDoc(collection(db, 'messages'), {
        chatId: id,
        senderId: currentUserUid || null,
        text: text?.trim() || '',
        timestamp: Timestamp.now(),
        isListing,
        listingId,
        imageUrl: imageUrl || null,
        imageUrls: imageUrls || null,
      });

      // Replace optimistic message with real one
      // Check if real-time listener already added it
      setMessages(prev => {
        // Check if message with real ID already exists (from real-time listener)
        const realMsgExists = prev.some(msg => msg.id === docRef.id);
        if (realMsgExists) {
          // Remove optimistic message if real one already exists
          return prev.filter(msg => msg.id !== optimisticId);
        }
        // Replace optimistic message with real one
        return prev.map(msg => 
          msg.id === optimisticId 
            ? { ...msg, id: docRef.id, optimistic: false }
            : msg
        );
      });

      // Mark chat lastMessage and update timestamp, mark unread for other participants
      const otherParticipantIds = Array.isArray(participantIds)
        ? participantIds.filter(pid => pid && pid !== currentUserUid)
        : [];

      // Update lastMessage - use text if available, otherwise indicate image(s)
      const hasImages = imageUrl || (imageUrls && imageUrls.length > 0);
      const imageCount = imageUrls && imageUrls.length > 1 ? imageUrls.length : 1;
      const lastMessageText = text?.trim() || (hasImages 
        ? (imageUrls && imageUrls.length > 1 ? `📷 ${imageCount} Images` : '📷 Image')
        : '');

      try {
        await updateDoc(doc(db, 'chats', id), {
          lastMessage: lastMessageText,
          timestamp: Timestamp.now(),
          unreadBy: arrayUnion(...otherParticipantIds),
        });
      } catch (err) {
        // ignore update failures
      }
    } catch (error) {
      console.error('Error sending message:', error);
      // Remove optimistic message on error
      setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
      Alert.alert('Error', 'Failed to send message. Please try again.');
    }
  };

  // Send an image: upload image first, then send message
  const sendImage = async (imageUris, text = '') => {
    if (!id) {
      return;
    }

    // Block sending messages if user is not a member
    if (chatType === 'group' && !isMember) {
      Alert.alert('Access Denied', 'You must be a member of this group to send messages.');
      return;
    }

    try {
      // Convert single URI to array for backward compatibility
      const urisArray = Array.isArray(imageUris) ? imageUris : [imageUris];
      const textToSend = text?.trim() || '';
      
      // Create optimistic message with local image URIs and text immediately
      const optimisticId = `temp-${Date.now()}-${Math.random()}`;
      const optimisticMsg = {
        id: optimisticId,
        chatId: id,
        senderId: currentUserUid || null,
        text: textToSend,
        timestamp: Timestamp.now(),
        isListing: false,
        listingId: null,
        imageUrl: null,
        imageUrls: urisArray, // Use local URIs for immediate display
        optimistic: true,
      };

      // Add optimistic message immediately - appears instantly in chat with images and text
      setMessages(prev => [optimisticMsg, ...prev]);
      
      // Upload all images to Firebase Storage in the background
      const imageUrls = [];
      for (const uri of urisArray) {
        const imageUrl = await uploadChatImage(uri, id);
        imageUrls.push(imageUrl);
      }
      
      // Silently update optimistic message with uploaded URLs (no visual change)
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticId 
          ? { ...msg, imageUrls }
          : msg
      ));
      
      // Send message with uploaded image URLs and text to Firestore
      const docRef = await addDoc(collection(db, 'messages'), {
        chatId: id,
        senderId: currentUserUid || null,
        text: textToSend,
        timestamp: Timestamp.now(),
        isListing: false,
        listingId: null,
        imageUrl: null,
        imageUrls: imageUrls,
      });

      // Replace optimistic message with real one
      // Check if real-time listener already added it
      setMessages(prev => {
        // Check if message with real ID already exists (from real-time listener)
        const realMsgExists = prev.some(msg => msg.id === docRef.id);
        if (realMsgExists) {
          // Remove optimistic message if real one already exists
          return prev.filter(msg => msg.id !== optimisticId);
        }
        // Replace optimistic message with real one
        return prev.map(msg => 
          msg.id === optimisticId 
            ? { ...msg, id: docRef.id, optimistic: false }
            : msg
        );
      });

      // Update chat document
      const otherParticipantIds = Array.isArray(participantIds)
        ? participantIds.filter(pid => pid && pid !== currentUserUid)
        : [];

      const imageCount = imageUrls.length;
      const lastMessageText = textToSend || (imageUrls.length > 1 ? `📷 ${imageCount} Images` : '📷 Image');

      try {
        await updateDoc(doc(db, 'chats', id), {
          lastMessage: lastMessageText,
          timestamp: Timestamp.now(),
          unreadBy: arrayUnion(...otherParticipantIds),
        });
      } catch (err) {
        // ignore update failures
      }
    } catch (error) {
      console.error('Error sending image:', error);
      // Silently fail - keep the message visible with local URIs
      // The message stays in chat even if upload fails
      console.warn('Image upload failed but message remains visible with local URIs');
    }
  };

  // Helper function to detect plant-related conversation
  const isPlantRelatedConversation = () => {
    const plantKeywords = ['plant', 'flower', 'seed', 'garden', 'grow', 'leaf', 'root', 'soil', 'water', 'fertilizer', 'bloom', 'care', 'indoor', 'outdoor', 'succulent', 'herb', 'tree', 'shrub'];
    const recentMessages = messages.slice(-10); // Check last 10 messages
    
    return recentMessages.some(message => 
      message.text && plantKeywords.some(keyword => 
        message.text.toLowerCase().includes(keyword)
      )
    );
  };

  // Helper function for safe avatar display
  const getAvatarSource = () => {
    try {
      const au = otherUserInfo?.avatarUrl;
      // Prefer other user's avatar when present and valid
      if (au !== undefined && au !== null) {
        if (typeof au === 'string' && au.trim() !== '') {
          return { uri: au.trim() };
        }
        if (typeof au === 'object' && au !== null && typeof au.uri === 'string' && au.uri.trim() !== '') {
          return { uri: au.uri.trim() };
        }

      }

      
    } catch (error) {
      // silent fallback
    }

    // Explicit, deterministic fallback to default avatar
    return require('../../assets/images/AvatarBig.png');
  };

  // Check if user is member and if group is public
  // Redirect buyers to settings if they're not members of a public group
  useFocusEffect(useCallback(() => {
    const checkMembershipAndPublicStatus = async () => {
      if (!id || chatType !== 'group' || !currentUserUid) {
        setIsMember(true); // Default to member for private chats
        setIsPublicGroup(false);
        return;
      }

      try {
        const chatDocRef = doc(db, 'chats', id);
        const chatDocSnap = await getDoc(chatDocRef);
        
        if (chatDocSnap.exists()) {
          const chatData = chatDocSnap.data();
          const isPublic = chatData.isPublic === true;
          setIsPublicGroup(isPublic);
          
          // Check if current user is a member
          const memberIds = Array.isArray(chatData.participantIds) ? chatData.participantIds : [];
          const userIsMember = memberIds.includes(currentUserUid);
          setIsMember(userIsMember);
          
          // If buyer is not a member of a public group, redirect to settings
          if (!userIsMember && isPublic && isBuyer) {
            // Redirect to settings screen where they can request to join
            navigation.replace('ChatSettingsScreen', { 
              chatId: id, 
              participants: Array.isArray(chatData.participants) ? chatData.participants : [],
              type: chatType,
              name: name
            });
            return;
          }
          
          if (!userIsMember && isPublic && isSeller) {
            const invitedUsers = Array.isArray(chatData.invitedUsers) ? chatData.invitedUsers : [];
            if (invitedUsers.includes(currentUserUid)) {
              // Redirect to settings screen where they can accept/decline invitation
              navigation.replace('ChatSettingsScreen', { 
                chatId: id, 
                participants: Array.isArray(chatData.participants) ? chatData.participants : [],
                type: chatType,
                name: name
              });
              return;
            }
          }
          
          // Check if user has pending or rejected request (for non-buyers or members)
          if (!userIsMember && isPublic) {
            const joinRequestsRef = collection(db, 'chats', id, 'joinRequests');
            
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
        }
      } catch (error) {
        console.log('Error checking membership:', error);
        setIsMember(true); // Default to member on error
      }
    };

    checkMembershipAndPublicStatus();
  }, [id, chatType, currentUserUid, isBuyer, navigation, name]));

  // Load initial messages (10 latest)
  const loadInitialMessages = async () => {
    if (!id) return;

    try {
      setLoading(true);
      setMessages([]);
      setHasMoreMessages(true);
      lastMessageRef.current = null;

      const messagesRef = collection(db, 'messages');
      const initialQuery = query(
        messagesRef,
        where('chatId', '==', id),
        orderBy('timestamp', 'desc'),
        limit(10)
      );

      const snapshot = await getDocs(initialQuery);
      const messagesFirestore = snapshot.docs.map(doc => ({
        id: doc.id,
        chatId: id,
        ...doc.data(),
      }));

      // Store the last document for pagination
      if (snapshot.docs.length > 0) {
        lastMessageRef.current = snapshot.docs[snapshot.docs.length - 1];
        // If we got less than 10, there are no more messages
        setHasMoreMessages(snapshot.docs.length === 10);
      } else {
        setHasMoreMessages(false);
      }

      // Remove duplicates based on message ID
      const uniqueMessages = messagesFirestore.filter((msg, index, self) =>
        index === self.findIndex(m => m.id === msg.id)
      );

      setMessages(uniqueMessages);
      setLoading(false);

      // Set up real-time listener for new messages only
      const allMessagesQuery = query(
        messagesRef,
        where('chatId', '==', id),
        orderBy('timestamp', 'desc'),
        limit(1) // Only get the latest message for real-time updates
      );

      const unsubscribe = onSnapshot(
        allMessagesQuery,
        { includeMetadataChanges: false },
        (newSnapshot) => {
          if (!newSnapshot.empty) {
            const newDoc = newSnapshot.docs[0];
            const newMessage = {
              id: newDoc.id,
              chatId: id,
              ...newDoc.data(),
            };

            // Only add if it's not already in messages (avoid duplicates)
            setMessages(prev => {
              const exists = prev.some(msg => msg.id === newMessage.id);
              if (exists) {
                return prev; // Message already exists
              }
              
              // Check if there's an optimistic message with matching content that should be replaced
              const optimisticIndex = prev.findIndex(msg => 
                msg.optimistic && 
                msg.senderId === newMessage.senderId &&
                msg.text === newMessage.text &&
                // Check images match (handle both local URIs and uploaded URLs)
                ((!msg.imageUrls && !newMessage.imageUrls) ||
                 (msg.imageUrls && newMessage.imageUrls && 
                  msg.imageUrls.length === newMessage.imageUrls.length))
              );
              
              if (optimisticIndex !== -1) {
                // Replace optimistic message with real one
                const updated = [...prev];
                updated[optimisticIndex] = newMessage;
                return updated;
              }
              
              // Add to beginning since we're using inverted list (newest first)
              return [newMessage, ...prev];
            });
          }
        },
        (error) => {
          console.error('Error in real-time listener:', error);
        }
      );

      messagesUnsubscribeRef.current = unsubscribe;
    } catch (error) {
      console.error('Error loading initial messages:', error);
      setMessages([]);
      setLoading(false);
      setHasMoreMessages(false);
    }
  };

  // Load more previous messages (pagination)
  const loadMoreMessages = async () => {
    if (!id || !hasMoreMessages || loadingMore || !lastMessageRef.current) {
      return;
    }

    try {
      setLoadingMore(true);

      const messagesRef = collection(db, 'messages');
      const moreQuery = query(
        messagesRef,
        where('chatId', '==', id),
        orderBy('timestamp', 'desc'),
        startAfter(lastMessageRef.current),
        limit(10)
      );

      const snapshot = await getDocs(moreQuery);
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        chatId: id,
        ...doc.data(),
      }));

      if (snapshot.docs.length > 0) {
        lastMessageRef.current = snapshot.docs[snapshot.docs.length - 1];
        setHasMoreMessages(snapshot.docs.length === 10);
        
        // Append to end of messages (older messages), removing duplicates
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg.id));
          return [...prev, ...uniqueNewMessages];
        });
      } else {
        setHasMoreMessages(false);
      }

      setLoadingMore(false);
    } catch (error) {
      console.error('Error loading more messages:', error);
      setLoadingMore(false);
    }
  };

  useFocusEffect(useCallback(() => {
    if (!id) {
      setMessages([]);
      setLoading(false);
      return;
    }

    loadInitialMessages();

    return () => {
      // Cleanup real-time listener
      if (messagesUnsubscribeRef.current) {
        messagesUnsubscribeRef.current();
        messagesUnsubscribeRef.current = null;
      }
    };
  }, [id]));

  // Auto-scroll when messages change
  // useEffect(() => {
  //   if (flatListRef?.current && messages.length > 0) {
  //     flatListRef.current.scrollToEnd({ animated: false });
  //   }
  // }, [messages]);

  // Fetch latest names and avatars for all participants from Firestore
  useEffect(() => {
    const fetchParticipantData = async () => {
      if (!participants || participants.length === 0) {
        console.log('🖼️ [ChatScreen] No participants to fetch data for');
        return;
      }

      try {
        const uidsToFetch = participants
          .map(p => p?.uid)
          .filter(uid => uid);

        console.log('🖼️ [ChatScreen] Fetching latest names and avatars for participants:', uidsToFetch);

        // Get current participantDataMap state
        setParticipantDataMap(prevMap => {
          for (const uid of uidsToFetch) {
            // Skip if currently fetching
            if (fetchingRef.current.has(uid)) {
              console.log(`⏭️ [ChatScreen] Skipping ${uid} - currently fetching`);
              continue;
            }

            // Mark as fetching
            fetchingRef.current.add(uid);
            
            // Fetch participant data asynchronously
            (async () => {
              try {
                console.log(`🔍 [ChatScreen] Fetching latest data for ${uid}...`);

                // Try buyer collection first
                let userDocRef = doc(db, 'buyer', uid);
                let userSnap = await getDoc(userDocRef);
                
                // If not found in buyer, try admin collection
                if (!userSnap.exists()) {
                  console.log(`🔍 [ChatScreen] ${uid} not in buyer, trying admin...`);
                  userDocRef = doc(db, 'admin', uid);
                  userSnap = await getDoc(userDocRef);
                }
                
                // If not found in admin, try supplier collection
                if (!userSnap.exists()) {
                  console.log(`🔍 [ChatScreen] ${uid} not in admin, trying supplier...`);
                  userDocRef = doc(db, 'supplier', uid);
                  userSnap = await getDoc(userDocRef);
                }

                if (userSnap.exists()) {
                  const data = userSnap.data();
                  
                  // Get latest name - use username instead of firstName/lastName
                  // Priority: username > email > gardenOrCompanyName > fullName
                  // Explicitly avoid firstName/lastName fields
                  const latestName = data?.username || 
                                     data?.gardenOrCompanyName || 
                                     data?.fullName || 
                                     data?.email || 
                                    '';
                  
                  // Get latest avatar URL
                  const avatarUrl = data?.profilePhotoUrl || data?.profileImage || null;
                  
                  setParticipantDataMap(prevMap => {
                    // Double-check it's not already there (in case of race condition)
                    if (prevMap[uid] && prevMap[uid].name === latestName && prevMap[uid].avatarUrl === avatarUrl) {
                      console.log(`⏭️ [ChatScreen] ${uid} data unchanged, skipping update`);
                      return prevMap;
                    }
                    
                    const updateData = {};
                    if (latestName) updateData.name = latestName;
                    if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '') {
                      updateData.avatarUrl = avatarUrl;
                    }
                    
                    if (Object.keys(updateData).length > 0) {
                      console.log(`✅ [ChatScreen] Found latest data for ${uid}:`, updateData);
                      const newMap = {...prevMap, [uid]: {...prevMap[uid], ...updateData}};
                      
                      // Also update avatarMap for backward compatibility
                      if (updateData.avatarUrl) {
                        setAvatarMap(prevAvatarMap => ({...prevAvatarMap, [uid]: { uri: updateData.avatarUrl }}));
                      }
                      
                      return newMap;
                    }
                    
                    return prevMap;
                  });
                } else {
                  console.log(`⚠️ [ChatScreen] User ${uid} not found in buyer, admin, or supplier collections`);
                }
              } catch (err) {
                console.warn(`❌ [ChatScreen] Error fetching data for ${uid}:`, err);
              } finally {
                // Remove from fetching set
                fetchingRef.current.delete(uid);
              }
            })();
          }
          
          return prevMap;
        });
      } catch (err) {
        console.warn('❌ [ChatScreen] Error in fetchParticipantData:', err);
      }
    };

    fetchParticipantData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [participants?.length, currentUserUid, id]); // Use participants.length to avoid re-fetching on object reference changes

  // Skeleton message for loading state
  const SkeletonMessage = ({isMe = false, index = 0}) => (
    <View style={[styles.skeletonRow, isMe ? styles.skeletonRowRight : styles.skeletonRowLeft]} key={`skeleton-${index}`}>
      <View style={styles.skeletonBubble} />
    </View>
  );

  // Render
  if (!id) {
    return (
      <View style={styles.container}>
        <View style={styles.missingContainer}>
          <Text style={styles.missingTitle}>No chat selected</Text>
          <Text style={styles.missingSubtitle}>Tap a chat from your messages list to open the conversation.</Text>
        </View>
      </View>
    );
  }

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}} edges={["left", "right", "bottom"]}>
      <KeyboardAvoidingView 
        style={{flex: 1}} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, {paddingTop: Math.max(insets.top, 12)}]}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}>
            <BackSolidIcon size={24} color="#333" />
          </TouchableOpacity>
          <TouchableOpacity 
            style={styles.userInfo}
            onPress={() => {
              navigation.navigate('ChatSettingsScreen', { 
                chatId: id, 
                participants,
                type: chatType,
                name: chatType === 'group' ? name : (participantDataMap[otherParticipantUid]?.name || otherParticipant?.name || name)
              });
            }}>
            {chatType === 'group' ? (
              // Group chat: show overlapping avatars
              (() => {
                // Get all participants (excluding current user) - we'll take first 2 for display
                const otherParticipants = participants
                  .filter(p => p && p.uid && p.uid !== currentUserUid);
                
                // Get avatar sources for first 2 participants
                const avatarSources = otherParticipants.slice(0, 2).map(p => {
                  const uid = p?.uid;
                  // Priority 1: avatarMap (from Firestore)
                  if (uid && avatarMap[uid]) {
                    return avatarMap[uid];
                  }
                  // Priority 2: participant's avatarUrl
                  if (p?.avatarUrl) {
                    if (typeof p.avatarUrl === 'string' && p.avatarUrl.trim() !== '') {
                      return { uri: p.avatarUrl };
                    } else if (typeof p.avatarUrl === 'object' && p.avatarUrl?.uri) {
                      return { uri: p.avatarUrl.uri };
                    }
                  }
                  // Return null if no valid avatar (will be replaced with default in GroupAvatar)
                  return null;
                });
                
                return <GroupAvatar avatarSources={avatarSources} size={32} />;
              })()
            ) : (
              // Private chat: show single avatar
              <Image
                source={getAvatarSource()}
                style={styles.avatar}
              />
            )}
            {chatType === 'group' ? (
              <View style={styles.userInfoText}>
                <Text style={styles.title} numberOfLines={1}>{name || 'Chat'}</Text>
                <Text style={styles.subtitle}>
                  {`${participants.length} ${participants.length === 1 ? 'member' : 'members'}`}
                </Text>
              </View>
            ) : (
              <View style={styles.userInfoText}>
                <Text style={styles.title} numberOfLines={1}>{participantDataMap[otherParticipantUid]?.name || otherParticipant?.name || name || 'Chat'}</Text>
                <Text style={styles.subtitle}>Active now</Text>
              </View>
            )}
          </TouchableOpacity>
          {(isSeller && canChatListing && chatType === 'group') && (
            <TouchableOpacity
              style={styles.addListingButton}
              onPress={() => navigation.navigate('ScreenSingleSellGroupChat', {...routeParams, currentUserUid, participantIds})}
            >
              <Text style={styles.addListingButtonText}>Add Listing</Text>
            </TouchableOpacity>
          )}
        </View>

      {/* Chat Messages */}
      {loading ? (
        <View style={{flex: 1, paddingVertical: 10, paddingHorizontal: 12}}>
          {Array.from({length: 6}).map((_, idx) => (
            <SkeletonMessage key={`sk-${idx}`} isMe={idx % 3 === 0} index={idx} />
          ))}
        </View>
      ) : (chatType === 'group' && !isMember && hasRejectedRequest) ? (
        <View style={styles.restrictedContainer}>
          <Text style={styles.restrictedText}>
            You cannot view messages in this group. Your join request was rejected.
          </Text>
        </View>
      ) : (
        <FlatList
          inverted
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => {
            // Ensure unique key - use ID if available, otherwise use index with timestamp
            if (item.id) {
              return item.id;
            }
            // Fallback for optimistic messages or messages without ID
            return `message-${index}-${item.timestamp?.toMillis() || Date.now()}`;
          }}
          onEndReached={loadMoreMessages}
          onEndReachedThreshold={0.5}
          ListFooterComponent={
            loadingMore ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#666' }}>Loading more messages...</Text>
              </View>
            ) : null
          }
          renderItem={({ item, index }) => {
            
            if (!item) return null;
            if (item.type === 'date') return <DateSeparator text={item.text} />;

            const prevMsg = messages[index - 1];
            const nextMsg = messages[index + 1];
            const isMe = item?.senderId === currentUserUid;
            const prevMsgIsMe = prevMsg?.senderId === currentUserUid;
            const nextMsgIsMe = nextMsg?.senderId === currentUserUid;
            
            // Check if this is the first message in a group (different sender or no previous message)
            const isFirstInGroup = !prevMsg || prevMsg?.senderId !== item?.senderId;
            // Check if this is the last message in a group (different sender or no next message)
            const isLastInGroup = !nextMsg || nextMsg?.senderId !== item?.senderId;
            
            // Check if previous message has stacked images (for adding top margin to current message)
            const prevMessageHasStackedImages = prevMsg && (
              (prevMsg.imageUrls && prevMsg.imageUrls.length > 1) || 
              (prevMsg.imageUrl && prevMsg.imageUrls && prevMsg.imageUrls.length > 0)
            );
            
            // Show avatar only on the last message of a group (for non-me messages)
            const showAvatar = !isMe && isLastInGroup;
            // if (item.isListing === true && item.listingId) {
            //   return <ListingMessage listingId={item.listingId} navigation={navigation} />;
            // }
            
            // Get sender name and avatar for group chats - show on first message of group
            // For private chats, get the other participant's avatar
            let senderName = null;
            let senderAvatarUrl = null;
            if (!isMe && item?.senderId) {
              const sender = participants.find(p => p?.uid === item.senderId);
              
              if (chatType === 'group') {
                // Group chat: Get name from participantDataMap or participants array
                // Priority 1: Get name from participantDataMap (fetched from Firestore - most reliable)
                if (participantDataMap[item.senderId]?.name) {
                  senderName = participantDataMap[item.senderId].name;
                  console.log(`✅ [ChatScreen] Using participantDataMap name for ${item.senderId}:`, senderName);
                }
                // Priority 2: Get name from sender in participants array
                else if (sender) {
                  senderName = sender?.name || 'Unknown';
                  console.log(`✅ [ChatScreen] Using participant name for ${item.senderId}:`, senderName);
                }
              }
              
              // Get avatar for both group and private chats
              // Priority 1: Get avatar from participantDataMap (fetched from Firestore - most reliable)
              if (participantDataMap[item.senderId]?.avatarUrl) {
                senderAvatarUrl = participantDataMap[item.senderId].avatarUrl;
                console.log(`✅ [ChatScreen] Using participantDataMap avatar for ${item.senderId}:`, senderAvatarUrl);
              }
              // Priority 2: Get avatar from avatarMap (for backward compatibility)
              else if (avatarMap[item.senderId]) {
                if (typeof avatarMap[item.senderId] === 'object' && avatarMap[item.senderId].uri) {
                  senderAvatarUrl = avatarMap[item.senderId].uri;
                } else if (typeof avatarMap[item.senderId] === 'string') {
                  senderAvatarUrl = avatarMap[item.senderId];
                }
                console.log(`✅ [ChatScreen] Using avatarMap for ${item.senderId}:`, senderAvatarUrl);
              }
              // Priority 3: Get avatar URL from sender in participants array
              else if (sender?.avatarUrl) {
                if (typeof sender.avatarUrl === 'string' && sender.avatarUrl.trim() !== '') {
                  senderAvatarUrl = sender.avatarUrl;
                  console.log(`✅ [ChatScreen] Using participant avatarUrl for ${item.senderId}:`, senderAvatarUrl);
                } else if (typeof sender.avatarUrl === 'object' && sender.avatarUrl.uri) {
                  senderAvatarUrl = sender.avatarUrl.uri;
                  console.log(`✅ [ChatScreen] Using participant avatarUrl.uri for ${item.senderId}:`, senderAvatarUrl);
                }
              }
              // Priority 4: For private chats, try otherUserInfo as fallback
              else if (chatType === 'private' && otherUserInfo?.avatarUrl) {
                if (typeof otherUserInfo.avatarUrl === 'string' && otherUserInfo.avatarUrl.trim() !== '') {
                  senderAvatarUrl = otherUserInfo.avatarUrl;
                  console.log(`✅ [ChatScreen] Using otherUserInfo avatarUrl for ${item.senderId}:`, senderAvatarUrl);
                } else if (typeof otherUserInfo.avatarUrl === 'object' && otherUserInfo.avatarUrl.uri) {
                  senderAvatarUrl = otherUserInfo.avatarUrl.uri;
                  console.log(`✅ [ChatScreen] Using otherUserInfo avatarUrl.uri for ${item.senderId}:`, senderAvatarUrl);
                }
              }
              
              if (chatType === 'group' && !senderName) {
                senderName = 'Unknown';
                console.log(`⚠️ [ChatScreen] No name found for sender ${item.senderId}`);
              }
              
              if (!senderAvatarUrl) {
                console.log(`⚠️ [ChatScreen] No avatar found for sender ${item.senderId}`);
                console.log(`   - participantDataMap[${item.senderId}]:`, participantDataMap[item.senderId]);
                console.log(`   - avatarMap[${item.senderId}]:`, avatarMap[item.senderId]);
                console.log(`   - sender.avatarUrl:`, sender?.avatarUrl);
                if (chatType === 'private') {
                  console.log(`   - otherUserInfo.avatarUrl:`, otherUserInfo?.avatarUrl);
                }
              }
            }

            return (
              <ChatBubble
                text={item.text || ''}
                isMe={isMe}
                showAvatar={showAvatar}
                senderName={senderName}
                senderAvatarUrl={senderAvatarUrl}
                isGroupChat={chatType === 'group'}
                isFirstInGroup={isFirstInGroup}
                isLastInGroup={isLastInGroup}
                isListing={item.isListing}
                listingId={item.listingId}
                navigation={navigation}
                isBuyer={isBuyer}
                isSeller={isSeller}
                currentUserUid={currentUserUid}
                imageUrl={item.imageUrl || null}
                imageUrls={item.imageUrls || null}
                prevMessageHasStackedImages={prevMessageHasStackedImages || false}
              />
            );
          }}
          contentContainerStyle={{ paddingVertical: 10, paddingBottom: safeBottomPadding + 16 }}
          style={{ flex: 1 }}
          // onContentSizeChange={() => {
          //   setTimeout(() => {
          //     if (flatListRef?.current && messages.length > 0 && !loaded) {
          //       flatListRef?.current.scrollToEnd({ animated: true });
          //       setLoaded(true);
          //     }
          //   }, 1000);
          // }}
          // onLayout={() => {
          //   if (flatListRef?.current && messages.length > 0) {
          //     flatListRef?.current.scrollToEnd({ animated: false });
          //   }
          // }}
        />
      )}


      {/* Input - Disabled for non-members */}
      <MessageInput 
        onSend={sendMessage} 
        onSendImage={sendImage}
        disabled={chatType === 'group' && !isMember}
        isPrivateChat={chatType === 'private'}
      />
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingBottom: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderColor: '#ddd',
  },
  backButton: {
    marginRight: 12,
  },
  userInfo: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
  },
  userInfoText: {
    marginLeft: 10,
  },
  title: {fontSize: 18, fontWeight: 'bold', color: '#000'},
  subtitle: {fontSize: 12, color: '#666', marginTop: 2},
  avatar: {
    width: 32,
    height: 32,
    borderColor: '#539461',
    borderWidth: 1,
    borderRadius: 1000,
  },
  groupAvatarOverlapContainer: {
    position: 'relative',
    overflow: 'hidden',
  },
  groupAvatarOverlap: {
    borderWidth: 1,
    borderColor: '#539461',
    backgroundColor: '#f5f5f5',
  },
  restrictedContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#f5f5f5',
  },
  restrictedText: {
    fontSize: 16,
    color: '#647276',
    textAlign: 'center',
    lineHeight: 24,
  },
  plantRecommendationsContainer: {
    backgroundColor: '#f8f9fa',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 10,
    paddingHorizontal: 12,
  },
  chatBrowseMoreContainer: {
    marginBottom: 0,
  },
  skeletonRow: {
    height: 36,
    marginBottom: 12,
    justifyContent: 'flex-start',
  },
  skeletonRowRight: {
    alignItems: 'flex-end',
  },
  skeletonRowLeft: {
    alignItems: 'flex-start',
  },
  skeletonBubble: {
    width: '60%',
    height: 16,
    borderRadius: 12,
    backgroundColor: '#e0e0e0',
  },
  addListingButton: {
    backgroundColor: '#539461',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginLeft: 8,
  },
  addListingButtonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 12,
  },
});

export default ChatScreen;
