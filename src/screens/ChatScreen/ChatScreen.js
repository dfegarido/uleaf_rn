import { useFocusEffect } from '@react-navigation/native';
import {
  addDoc,
  arrayUnion,
  collection,
  deleteDoc,
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
import { FlatList, Image, KeyboardAvoidingView, Modal, Platform, StyleSheet, Text, TouchableOpacity, View, Alert, Animated, ScrollView } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { db } from '../../../firebase';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import { AuthContext } from '../../auth/AuthProvider';
import ChatBubble from '../../components/ChatBubble/ChatBubble';
import DateSeparator from '../../components/DateSeparator/DateSeparator';
import MessageInput from '../../components/MessageInput/MessageInput';
import { uploadChatImage } from '../../utils/uploadChatImage';
import { uploadChatVideo } from '../../utils/uploadChatVideo';
import { compressVideo } from '../../utils/videoCompression';
import { generateVideoThumbnail } from '../../utils/videoThumbnail';
import { useUserPresence } from '../../hooks/useUserPresence';

// Reply Icon SVG Component - Curved arrow pointing left
const ReplyIcon = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 16 16" fill={color}>
    <Path
      d="M6.497 1.035C7.593-.088 9.5.688 9.5 2.257V4.54c1.923.215 3.49 1.246 4.593 2.672C15.328 8.808 16 10.91 16 13v.305c0 .632-.465 1.017-.893 1.127-.422.11-.99.005-1.318-.493-.59-.894-1.2-1.482-1.951-1.859-.611-.307-1.359-.496-2.338-.558v2.23c0 1.57-1.908 2.346-3.003 1.222L.893 9.223a1.75 1.75 0 0 1 .001-2.444l5.603-5.744z"
    />
  </Svg>
);

// Emoji Icon SVG Component
const EmojiIcon = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 20 20" fill={color}>
    <Path
      d="M13.5 10a1.5 1.5 0 1 0 0-3 1.5 1.5 0 0 0 0 3zM8 8.5a1.5 1.5 0 1 1-3 0 1.5 1.5 0 0 1 3 0zm-.75 3.941a.75.75 0 1 0-1 1.118A5.614 5.614 0 0 0 10 15a5.614 5.614 0 0 0 3.75-1.441.75.75 0 0 0-1-1.118A4.113 4.113 0 0 1 10 13.5a4.113 4.113 0 0 1-2.75-1.059z"
    />
    <Path
      d="M10 .5a9.5 9.5 0 1 0 0 19 9.5 9.5 0 0 0 0-19zM2 10a8 8 0 1 1 16 0 8 8 0 0 1-16 0z"
    />
  </Svg>
);

// Edit Icon SVG Component
const EditIcon = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 16 16" fill={color}>
    <Path
      d="M12.146.146a.5.5 0 0 1 .708 0l3 3a.5.5 0 0 1 0 .708l-10 10a.5.5 0 0 1-.168.11l-5 2a.5.5 0 0 1-.65-.65l2-5a.5.5 0 0 1 .11-.168l10-10zM11.207 2.5 13.5 4.793 14.793 3.5 12.5 1.207 11.207 2.5zm1.586 3L10.5 3.207 4 9.707V10h.5a.5.5 0 0 1 .5.5v.5h.5a.5.5 0 0 1 .5.5v.5h.293l6.5-6.5zm-9.761 5.175-.106.106-1.528 3.821 3.821-1.528.106-.106A.5.5 0 0 1 5 12.5V12h-.5a.5.5 0 0 1-.5-.5V11h-.5a.5.5 0 0 1-.468-.325z"
    />
  </Svg>
);

// Share Icon SVG Component
const ShareIcon = ({ width = 24, height = 24, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 8C19.6569 8 21 6.65685 21 5C21 3.34315 19.6569 2 18 2C16.3431 2 15 3.34315 15 5C15 5.12548 15.0077 5.2502 15.0227 5.3732L7.56 9.2C6.93937 8.4538 6.0248 8 5 8C3.34315 8 2 9.34315 2 11C2 12.6569 3.34315 14 5 14C6.0248 14 6.93937 13.5462 7.56 12.8L15.0227 16.6268C15.0077 16.7502 15 16.8745 15 17C15 18.6569 16.3431 20 18 20C19.6569 20 21 18.6569 21 17C21 15.3431 19.6569 14 18 14C16.9752 14 16.0606 14.4538 15.44 15.2L7.97728 11.3732C7.99228 11.2498 8 11.1255 8 11C8 10.8745 7.99228 10.7502 7.97728 10.6268L15.44 6.8C16.0606 7.5462 16.9752 8 18 8Z"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Delete Icon SVG Component
const DeleteIcon = ({ width = 20, height = 20, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 16 16" fill={color}>
    <Path
      d="M11,5h2v8.5c0,0.825-0.675,1.5-1.5,1.5h-7C3.675,15,3,14.325,3,13.5V5h2v8h2V5h2v8h2V5z M2,2h12v2H2V2z M6,0h4v1H6V0z"
    />
  </Svg>
);

const ChatScreen = ({navigation, route}) => {
  const insets = useSafeAreaInsets();
  
  // Calculate proper bottom padding for tab bar + safe area
  const tabBarHeight = 60; // Standard tab bar height
  const safeBottomPadding = Math.max(insets.bottom, 8); // At least 8px padding
  const totalBottomPadding = tabBarHeight + safeBottomPadding; // Tab bar + safe area
  
  const routeParams = route?.params || {};

  const avatarUrl = routeParams.avatarUrl || '';
  const chatType = routeParams.type || 'private'; // Get chat type: 'group' or 'private'
  const name = routeParams.name || routeParams.title || '';
  const id = routeParams.id || routeParams.chatId || null;
  const participantIds = Array.isArray(routeParams.participantIds) ? routeParams.participantIds : (Array.isArray(routeParams.participants) ? routeParams.participants.map(p => p.uid).filter(Boolean) : []);
  const initialParticipants = Array.isArray(routeParams.participants) ? routeParams.participants : [];
  const [participants, setParticipants] = useState(initialParticipants);
  const {userInfo} = useContext(AuthContext);
  const flatListRef = useRef(null);
  const [loaded, setLoaded] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMoreMessages, setHasMoreMessages] = useState(true);
  const [hasOlderMessages, setHasOlderMessages] = useState(true);
  const [hasNewerMessages, setHasNewerMessages] = useState(false);
  const lastMessageRef = useRef(null);
  const firstMessageRef = useRef(null);
  const messagesUnsubscribeRef = useRef(null);
  const messagesRef = useRef(messages); // Keep a ref to always have current messages
  const isJumpedToMessage = useRef(false); // Track if we've jumped to a specific message
  const previousMessageCount = useRef(0); // Track message count to detect new messages
  const isNearBottom = useRef(true); // Track if user is near bottom of chat
  const isInitialListenerSnapshot = useRef(true); // Track if this is the first snapshot from listener
  const [replyingTo, setReplyingTo] = useState(null); // Message being replied to
  const [messageTooltip, setMessageTooltip] = useState(null); // Message for tooltip (long-pressed message)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Show emoji picker modal
  const [showScrollToBottom, setShowScrollToBottom] = useState(false); // Show scroll to bottom button
  const [findingMessage, setFindingMessage] = useState(false); // Show finding message modal
  const [editingMessage, setEditingMessage] = useState(null); // Message being edited
  const [editHistoryVisible, setEditHistoryVisible] = useState(false); // Edit history modal
  const [selectedMessageHistory, setSelectedMessageHistory] = useState(null); // Message for history view
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false); // Delete confirmation modal
  const [messageToDelete, setMessageToDelete] = useState(null); // Message to be deleted
  const plantRotation = useRef(new Animated.Value(0)).current;

  // Handle admin API response: userInfo.data.uid, regular nested: userInfo.user.uid, or flat: userInfo.uid
  const currentUserUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';
  
  // Track current user's presence (must be after currentUserUid is defined)
  useUserPresence(currentUserUid);
  
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
  
  // Active members tracking
  const [activeMembers, setActiveMembers] = useState(0);
  const [onlineUserIds, setOnlineUserIds] = useState(new Set());
  
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

  // Handle message long press - show tooltip with emoji and reply options
  const handleMessageLongPress = (messageData) => {
    if (!messageData || messageData.isListing) return;
    
    // If senderName is missing, try to get it
    if (!messageData.senderName) {
      let senderName = null;
      
      if (messageData.senderId === currentUserUid) {
        // Current user's message - get from participantDataMap or userInfo
        senderName = participantDataMap[currentUserUid]?.name;
        
        // Fallback to userInfo
        if (!senderName) {
          senderName = userInfo?.data?.fullName || 
                      (userInfo?.data?.firstName && userInfo?.data?.lastName 
                        ? `${userInfo.data.firstName} ${userInfo.data.lastName}` 
                        : null) ||
                      userInfo?.user?.fullName ||
                      userInfo?.fullName ||
                      userInfo?.data?.username ||
                      userInfo?.user?.username ||
                      userInfo?.username ||
                      'You';
        }
      } else {
        // Other user's message
        if (chatType === 'private') {
          // Priority 1: Get from participantDataMap
          senderName = participantDataMap[messageData.senderId]?.name;
          
          // Priority 2: Get from otherUserInfo
          if (!senderName && otherUserInfo?.name) {
            senderName = otherUserInfo.name;
          }
          
          // Priority 3: Get from participants array
          if (!senderName) {
            const sender = participants.find(p => p?.uid === messageData.senderId);
            senderName = sender?.name;
          }
          
          // Priority 4: Get from route params name (chat name)
          if (!senderName && name) {
            senderName = name;
          }
        } else if (chatType === 'group') {
          // For group chats, get from participantDataMap or participants
          senderName = participantDataMap[messageData.senderId]?.name;
          if (!senderName) {
            const sender = participants.find(p => p?.uid === messageData.senderId);
            senderName = sender?.name;
          }
        }
        
        // Final fallback
        if (!senderName) {
          senderName = 'Unknown';
        }
      }
      
      messageData.senderName = senderName;
    }
    
    setMessageTooltip(messageData);
  };

  // Handle edit from tooltip
  const handleEditFromTooltip = () => {
    if (messageTooltip) {
      startEditMessage(messageTooltip);
    }
  };

  // Update messagesRef whenever messages changes
  useEffect(() => {
    messagesRef.current = messages;
  }, [messages]);

  // Track active/online members in group chat
  useEffect(() => {
    if (chatType !== 'group' || !id || participants.length === 0) {
      setActiveMembers(0);
      return;
    }
    
    // Set up real-time presence listener for all group members
    const presenceUnsubscribers = [];
    const onlineUsers = new Set();

    participants.forEach(participant => {
      if (!participant?.uid || participant.uid === currentUserUid) return;

      // Listen to user's presence status
      const userPresenceRef = doc(db, 'userPresence', participant.uid);
      const unsubscribe = onSnapshot(userPresenceRef, (snapshot) => {
        if (snapshot.exists()) {
          const presenceData = snapshot.data();
          const isOnline = presenceData?.isOnline || false;
          const lastSeen = presenceData?.lastSeen;
          
          // Check if user is active (online within last 5 minutes)
          const fiveMinutesAgo = Date.now() - (5 * 60 * 1000);
          const isRecentlyActive = lastSeen && lastSeen.toMillis && lastSeen.toMillis() > fiveMinutesAgo;
          
          if (isOnline || isRecentlyActive) {
            onlineUsers.add(participant.uid);
          } else {
            onlineUsers.delete(participant.uid);
          }
          
          setOnlineUserIds(new Set(onlineUsers));
          setActiveMembers(onlineUsers.size);
        }
      }, (error) => {
        console.log('Presence listener error:', error);
      });

      presenceUnsubscribers.push(unsubscribe);
    });

    // Cleanup
    return () => {
      presenceUnsubscribers.forEach(unsub => unsub());
    };
  }, [chatType, id, participants, currentUserUid]);

  // Animate plant rotation when finding message
  useEffect(() => {
    if (findingMessage) {
      // Start rotation animation
      plantRotation.setValue(0);
      Animated.loop(
        Animated.timing(plantRotation, {
          toValue: 1,
          duration: 2000,
          useNativeDriver: true,
        })
      ).start();
    }
  }, [findingMessage]);

  // Handle reply preview click - scroll to original message (OPTIMIZED)
  const handleReplyPress = async (originalMessageId) => {
    if (!originalMessageId || !flatListRef.current) return;
    
    // Check if message is in current view
    let messageIndex = messagesRef.current.findIndex(msg => msg.id === originalMessageId);
    
    // If message not found in current view, use optimized direct fetch
    if (messageIndex === -1) {
      setFindingMessage(true); // Show loading modal
      
      // Use direct fetch instead of sequential loading
      const success = await loadMessagesAroundMessage(originalMessageId);
      
      if (!success) {
        setFindingMessage(false);
        Alert.alert('Message not found', 'The original message could not be found. It may have been deleted.');
        return;
      }
      
      // Wait for state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find message index in newly loaded messages
      messageIndex = messagesRef.current.findIndex(msg => msg.id === originalMessageId);
      setFindingMessage(false);
    }
    
    if (messageIndex === -1) {
      setFindingMessage(false);
      Alert.alert('Message not found', 'The original message could not be found.');
      return;
    }
    
    // Wait for FlatList to render
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Scroll to the message
    const scrollToMessage = (index) => {
      try {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: index,
            animated: true,
            viewPosition: 0.3, // Position near top for better context
          });
        }
      } catch (error) {
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToIndex({
              index: index,
              animated: true,
              viewPosition: 0.3,
            });
          } catch (e) {
            // Silent fail
          }
        }, 500);
      }
    };
    
    // Execute scroll
    requestAnimationFrame(() => {
      setTimeout(() => scrollToMessage(messageIndex), 200);
    });
  };

  // Handle reply from tooltip
  const handleReplyFromTooltip = () => {
    if (messageTooltip) {
      const actualMessage = messages.find(m => m.id === messageTooltip.id);
      if (actualMessage && !actualMessage.isListing) {
        // If replying to own message, get current user's name from participantDataMap or userInfo
        const isOwnMessage = actualMessage.senderId === currentUserUid;
        let senderName = messageTooltip.senderName || actualMessage.senderName;
        
        if (isOwnMessage && !senderName) {
          // Try to get name from participantDataMap first
          senderName = participantDataMap[currentUserUid]?.name;
          
          // Fallback to userInfo
          if (!senderName) {
            senderName = userInfo?.data?.fullName || 
                        (userInfo?.data?.firstName && userInfo?.data?.lastName 
                          ? `${userInfo.data.firstName} ${userInfo.data.lastName}` 
                          : null) ||
                        userInfo?.user?.fullName ||
                        userInfo?.fullName ||
                        userInfo?.data?.username ||
                        userInfo?.user?.username ||
                        userInfo?.username ||
                        'You';
          }
        } else if (!isOwnMessage && !senderName) {
          // For private chats, get the other participant's name
          if (chatType === 'private') {
            // Priority 1: Get from participantDataMap
            senderName = participantDataMap[actualMessage.senderId]?.name;
            
            // Priority 2: Get from otherUserInfo
            if (!senderName && otherUserInfo?.name) {
              senderName = otherUserInfo.name;
            }
            
            // Priority 3: Get from participants array
            if (!senderName) {
              const sender = participants.find(p => p?.uid === actualMessage.senderId);
              senderName = sender?.name;
            }
            
            // Priority 4: Get from route params name (chat name)
            if (!senderName && name) {
              senderName = name;
            }
          } else if (chatType === 'group') {
            // For group chats, get from participantDataMap or participants
            senderName = participantDataMap[actualMessage.senderId]?.name;
            if (!senderName) {
              const sender = participants.find(p => p?.uid === actualMessage.senderId);
              senderName = sender?.name;
            }
          }
          
          // Final fallback
          if (!senderName) {
            senderName = 'Unknown';
          }
        }
        
        setReplyingTo({
          ...actualMessage,
          messageId: actualMessage.id, // Explicitly set messageId for reply
          senderName: senderName,
        });
      }
      setMessageTooltip(null);
    }
  };

  // Handle emoji reaction from emoji picker
  const handleEmojiReaction = async (emoji) => {
    if (!messageTooltip || !id) return;
    
    try {
      const messageId = messageTooltip.id;
      if (!messageId || messageId.startsWith('temp-')) {
        // Can't react to optimistic messages
        closeTooltip();
        return;
      }

      // Find the message in local state
      const messageIndex = messages.findIndex(m => m.id === messageId);
      if (messageIndex === -1) {
        closeTooltip();
        return;
      }

      const currentMessage = messages[messageIndex];
      const currentReactions = currentMessage.reactions || {};
      const reactionKey = `${currentUserUid}_${emoji}`;
      
      // Toggle reaction - if user already reacted with this emoji, remove it, otherwise add it
      const userReactions = Object.keys(currentReactions).filter(key => 
        key.startsWith(`${currentUserUid}_`)
      );
      
      const hasThisEmoji = userReactions.some(key => currentReactions[key] === emoji);
      
      // Calculate new reactions
      let updatedReactions;
      if (hasThisEmoji) {
        // Remove this emoji reaction
        updatedReactions = { ...currentReactions };
        delete updatedReactions[reactionKey];
      } else {
        // Remove any existing emoji from this user, then add new one
        updatedReactions = { ...currentReactions };
        userReactions.forEach(key => delete updatedReactions[key]);
        updatedReactions[reactionKey] = emoji;
      }

      // Optimistic update - immediately update local state
      setMessages(prev => {
        const updated = [...prev];
        updated[messageIndex] = {
          ...updated[messageIndex],
          reactions: updatedReactions,
        };
        return updated;
      });

      closeTooltip();

      // Update Firestore in the background
      const messageRef = doc(db, 'messages', messageId);
      await updateDoc(messageRef, { reactions: updatedReactions });
    } catch (error) {
      console.error('Error adding emoji reaction:', error);
      
      // Revert optimistic update on error
      const messageIndex = messages.findIndex(m => m.id === messageTooltip?.id);
      if (messageIndex !== -1) {
        setMessages(prev => {
          const updated = [...prev];
          // Restore original reactions from messageTooltip or keep current
          const originalMessage = messages[messageIndex];
          updated[messageIndex] = {
            ...updated[messageIndex],
            reactions: originalMessage.reactions || {},
          };
          return updated;
        });
      }
      
      closeTooltip();
    }
  };

  // Close tooltip
  const closeTooltip = () => {
    setMessageTooltip(null);
    setShowEmojiPicker(false);
  };

  // Open emoji picker from tooltip
  const openEmojiPicker = () => {
    setShowEmojiPicker(true);
  };

  // Cancel reply
  const cancelReply = () => {
    setReplyingTo(null);
  };

  // Start editing a message
  const startEditMessage = (message) => {
    if (message.senderId !== currentUserUid) {
      Alert.alert('Cannot edit', 'You can only edit your own messages.');
      return;
    }
    
    // Check if message is too old (optional: 48 hours limit)
    // const messageTime = message.timestamp?.toDate?.() || new Date(message.timestamp);
    // const hoursSinceMessage = (Date.now() - messageTime.getTime()) / (1000 * 60 * 60);
    // if (hoursSinceMessage > 48) {
    //   Alert.alert('Cannot edit', 'Messages can only be edited within 48 hours.');
    //   return;
    // }
    
    setEditingMessage(message);
    setMessageTooltip(null);
  };

  // Cancel editing
  const cancelEdit = () => {
    setEditingMessage(null);
  };

  // Save edited message
  const saveEditedMessage = async (newText) => {
    if (!editingMessage || !id) return;
    
    const trimmedText = newText?.trim();
    if (!trimmedText) {
      Alert.alert('Error', 'Message cannot be empty');
      return;
    }
    
    if (trimmedText === editingMessage.text) {
      // No changes, just cancel
      cancelEdit();
      return;
    }

    try {
      // Optimistic update
      const editedAt = Timestamp.now();
      const updatedMessages = messages.map(msg => {
        if (msg.id === editingMessage.id) {
          return {
            ...msg,
            text: trimmedText,
            isEdited: true,
            lastEditedAt: editedAt,
            editHistory: [
              ...(msg.editHistory || []),
              {
                text: msg.text, // Store previous version
                editedAt: editedAt,
                editedBy: currentUserUid,
              }
            ]
          };
        }
        return msg;
      });
      
      setMessages(updatedMessages);
      cancelEdit();

      // Update Firestore
      const messageRef = doc(db, 'messages', editingMessage.id);
      await updateDoc(messageRef, {
        text: trimmedText,
        isEdited: true,
        lastEditedAt: editedAt,
        editHistory: [
          ...(editingMessage.editHistory || []),
          {
            text: editingMessage.text,
            editedAt: editedAt,
            editedBy: currentUserUid,
          }
        ]
      });
    } catch (error) {
      console.error('Error editing message:', error);
      // Revert optimistic update
      setMessages(messages);
      Alert.alert('Error', 'Failed to edit message. Please try again.');
    }
  };

  // View edit history
  const viewEditHistory = (message) => {
    if (!message.isEdited || !message.editHistory || message.editHistory.length === 0) {
      return;
    }
    setSelectedMessageHistory(message);
    setEditHistoryVisible(true);
  };

  // Handle share from tooltip
  const handleShareFromTooltip = async () => {
    if (!messageTooltip) return;
    
    try {
      const messageText = messageTooltip.text || '';
      const imageUrl = messageTooltip.imageUrl || (messageTooltip.imageUrls && messageTooltip.imageUrls[0]) || '';
      
      let shareContent = '';
      if (messageText) {
        shareContent = messageText;
      }
      if (imageUrl) {
        shareContent += shareContent ? `\n${imageUrl}` : imageUrl;
      }
      
      if (!shareContent) {
        Alert.alert('Nothing to share', 'This message has no content to share.');
        setMessageTooltip(null);
        return;
      }

      // Use React Native Share API
      const { Share } = require('react-native');
      await Share.share({
        message: shareContent,
      });
      
      setMessageTooltip(null);
    } catch (error) {
      console.error('Error sharing message:', error);
      Alert.alert('Error', 'Failed to share message');
      setMessageTooltip(null);
    }
  };

  // Handle delete from tooltip
  const handleDeleteFromTooltip = () => {
    if (!messageTooltip) return;
    
    // Check if user owns the message
    if (messageTooltip.senderId !== currentUserUid) {
      Alert.alert('Cannot delete', 'You can only delete your own messages.');
      setMessageTooltip(null);
      return;
    }
    
    // Show custom delete confirmation modal
    setMessageToDelete(messageTooltip);
    setShowDeleteConfirm(true);
    setMessageTooltip(null);
  };

  // Confirm delete message
  const confirmDeleteMessage = async () => {
    if (!messageToDelete) return;

    try {
      const messageId = messageToDelete.id;
      
      // Close modal first
      setShowDeleteConfirm(false);
      
      // Optimistically remove from UI
      setMessages(prev => prev.filter(msg => msg.id !== messageId));
      
      // Delete from Firestore
      const messageRef = doc(db, 'messages', messageId);
      await deleteDoc(messageRef);
      
      console.log('✅ Message deleted successfully');
      setMessageToDelete(null);
    } catch (error) {
      console.error('❌ Error deleting message:', error);
      Alert.alert('Error', 'Failed to delete message. Please try again.');
      // Reload messages to restore state
      loadInitialMessages();
      setShowDeleteConfirm(false);
      setMessageToDelete(null);
    }
  };

  // Cancel delete message
  const cancelDeleteMessage = () => {
    setShowDeleteConfirm(false);
    setMessageToDelete(null);
  };

  // Scroll to bottom
  const scrollToBottom = () => {
    if (flatListRef.current && messages.length > 0) {
      flatListRef.current.scrollToIndex({
        index: 0,
        animated: true,
      });
      setShowScrollToBottom(false);
    }
  };

  // Handle scroll event to show/hide scroll to bottom button and trigger bidirectional loading
  const handleScroll = (event) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const contentHeight = event.nativeEvent.contentSize.height;
    const layoutHeight = event.nativeEvent.layoutMeasurement.height;
    
    // For inverted list, bottom is at offsetY = 0
    const isAtBottom = offsetY < 100;
    
    // Update isNearBottom ref for auto-scroll logic
    isNearBottom.current = isAtBottom;
    
    // Show button when scrolled up more than 200 pixels
    setShowScrollToBottom(offsetY > 200);
    
    // Load newer messages when scrolling near the top (if we jumped to a message)
    if (isJumpedToMessage.current && offsetY < 100 && hasNewerMessages && !loadingMore) {
      loadNewerMessages();
    }
  };

  // Send a message: create message doc and update chat metadata
  const sendMessage = async (text, isListing = false, listingId = null, imageUrl = null, imageUrls = null, replyTo = null, mentions = null) => {
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

    // Sanitize replyTo to ensure no undefined values
    const sanitizedReplyTo = replyTo ? {
      messageId: replyTo.messageId || replyTo.id || null, // Use messageId or id field
      senderId: replyTo.senderId || null,
      senderName: replyTo.senderName || null,
      text: replyTo.text || null,
      imageUrl: replyTo.imageUrl || null,
      imageUrls: replyTo.imageUrls || null,
      videoUrl: replyTo.videoUrl || null,
      thumbnailUrl: replyTo.thumbnailUrl || null,
    } : null;

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
      replyTo: sanitizedReplyTo, // Add reply information
      mentions: mentions || null, // Add mention information
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
        replyTo: sanitizedReplyTo, // Add reply information
        mentions: mentions || null, // Add mentions information
      });

      // Clear reply state after sending
      if (replyTo) {
        setReplyingTo(null);
      }

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
  const sendImage = async (imageUris, text = '', replyTo = null) => {
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
      
      // Sanitize replyTo to ensure no undefined values
      const sanitizedReplyTo = replyTo ? {
        messageId: replyTo.messageId || replyTo.id || null, // Use messageId or id field
        senderId: replyTo.senderId || null,
        senderName: replyTo.senderName || null,
        text: replyTo.text || null,
        imageUrl: replyTo.imageUrl || null,
        imageUrls: replyTo.imageUrls || null,
        videoUrl: replyTo.videoUrl || null,
        thumbnailUrl: replyTo.thumbnailUrl || null,
      } : null;
      
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
        replyTo: sanitizedReplyTo, // Add reply information
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
        replyTo: sanitizedReplyTo, // Add reply information
      });

      // Clear reply state after sending
      if (replyTo) {
        setReplyingTo(null);
      }

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

  // Send a video: compress, generate thumbnail, upload both, then send message
  const sendVideo = async (videoData, text = '', replyTo = null) => {
    if (!id) {
      return;
    }

    // Block sending messages if user is not a member
    if (chatType === 'group' && !isMember) {
      Alert.alert('Access Denied', 'You must be a member of this group to send messages.');
      return;
    }

    const textToSend = text?.trim() || '';
    
    // Sanitize replyTo to ensure no undefined values
    const sanitizedReplyTo = replyTo ? {
      messageId: replyTo.messageId || replyTo.id || null,
      senderId: replyTo.senderId || null,
      senderName: replyTo.senderName || null,
      text: replyTo.text || null,
      imageUrl: replyTo.imageUrl || null,
      imageUrls: replyTo.imageUrls || null,
      videoUrl: replyTo.videoUrl || null,
      thumbnailUrl: replyTo.thumbnailUrl || null,
    } : null;

    // Create optimistic message ID
    const optimisticId = `temp-video-${Date.now()}-${Math.random()}`;

    // Create optimistic message with LOCAL video URI for immediate playback
    const optimisticMsg = {
      id: optimisticId,
      chatId: id,
      senderId: currentUserUid || null,
      text: textToSend,
      timestamp: Timestamp.now(),
      isListing: false,
      listingId: null,
      imageUrl: null,
      imageUrls: null,
      videoUrl: videoData.uri, // Show local video immediately
      thumbnailUrl: null, // No thumbnail yet (backend will generate)
      videoDuration: videoData.duration || 0,
      videoSize: videoData.fileSize || 0,
      videoFormat: 'mp4',
      replyTo: sanitizedReplyTo,
      optimistic: true,
      uploadProgress: 0, // Track upload progress
      localVideoUri: videoData.uri, // Keep local URI for reference
    };

    // Add optimistic message immediately - user sees it right away
    setMessages(prev => [optimisticMsg, ...prev]);

    // Update progress in optimistic message
    const updateProgress = (progress) => {
      setMessages(prev => prev.map(msg => 
        msg.id === optimisticId 
          ? { ...msg, uploadProgress: progress }
          : msg
      ));
    };

    // Start upload process in background (don't await - let it happen asynchronously)
    (async () => {
      try {
        // Step 1: Compress video with iOS-compatible settings
        updateProgress(10);
        
        let videoToUpload = videoData.uri;
        try {
          const compressed = await compressVideo(videoData.uri);
          videoToUpload = compressed.uri;
          updateProgress(30);
        } catch (compressionError) {
          updateProgress(30);
        }
        
        // Step 2: Upload video
        const { videoUrl, thumbnailUrl } = await uploadChatVideo(
          videoToUpload,
          null, // Backend will generate thumbnail
          (progress) => {
            // Map upload progress from 30-100%
            const mappedProgress = 30 + Math.floor(progress * 0.7);
            updateProgress(mappedProgress);
          }
        );
        
        updateProgress(100); // 100% after upload complete
        
        // Step 3: Send message to Firestore
      const docRef = await addDoc(collection(db, 'messages'), {
        chatId: id,
        senderId: currentUserUid || null,
        text: textToSend,
        timestamp: Timestamp.now(),
        isListing: false,
        listingId: null,
        imageUrl: null,
        imageUrls: null,
        videoUrl: videoUrl,
        thumbnailUrl: thumbnailUrl,
        videoDuration: videoData.duration || 0,
        videoSize: videoData.fileSize || 0,
        videoFormat: 'mp4',
        replyTo: sanitizedReplyTo,
      });

        // Replace optimistic message with real one (with server URLs and thumbnail)
        setMessages(prev => {
          // Check if real-time listener already added it
          const realMsgExists = prev.some(msg => msg.id === docRef.id);
          if (realMsgExists) {
            // Remove optimistic message if real one already exists
            return prev.filter(msg => msg.id !== optimisticId);
          }
          // Replace optimistic message with real one
          return prev.map(msg => 
            msg.id === optimisticId 
              ? {
                  ...msg,
                  id: docRef.id,
                  videoUrl: videoUrl, // Server URL (uploaded)
                  thumbnailUrl: thumbnailUrl, // Server-generated thumbnail
                  localVideoUri: undefined, // Clear local URI
                  optimistic: false,
                  uploadProgress: undefined, // Remove progress indicator
                }
              : msg
          );
        });

        // Clear reply state after sending
        if (replyTo) {
          setReplyingTo(null);
        }

        // Update chat document
        const otherParticipantIds = Array.isArray(participantIds)
          ? participantIds.filter(pid => pid && pid !== currentUserUid)
          : [];

        try {
          await updateDoc(doc(db, 'chats', id), {
            lastMessage: textToSend || '📹 Video',
            lastTimestamp: Timestamp.now(),
            lastSenderId: currentUserUid || null,
            unreadBy: otherParticipantIds.length > 0 ? otherParticipantIds : [],
          });
        } catch (updateError) {
          console.warn('Failed to update chat metadata:', updateError);
          // ignore update failures
        }
      } catch (error) {
        console.error('❌ Error sending video:', error);
        
        // Remove optimistic message on error
        setMessages(prev => prev.filter(msg => msg.id !== optimisticId));
        
        Alert.alert('Error', 'Failed to send video. Please try again.');
      }
    })(); // Execute async upload in background
    
    // Clear reply state immediately (don't wait for upload)
    if (replyTo) {
      setReplyingTo(null);
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
          
          // Update participants with latest data from Firestore
          const latestParticipants = Array.isArray(chatData.participants) ? chatData.participants : [];
          setParticipants(latestParticipants);
          
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
      setHasOlderMessages(true);
      setHasNewerMessages(false);
      lastMessageRef.current = null;
      firstMessageRef.current = null;
      isJumpedToMessage.current = false;

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
        reactions: doc.data().reactions || {},
        ...doc.data(),
      }));

      // Store the first and last documents for bidirectional pagination
      if (snapshot.docs.length > 0) {
        firstMessageRef.current = snapshot.docs[0]; // Most recent message
        lastMessageRef.current = snapshot.docs[snapshot.docs.length - 1]; // Oldest message
        // If we got less than 10, there are no more older messages
        setHasOlderMessages(snapshot.docs.length === 10);
        setHasNewerMessages(false); // No newer messages on initial load (these are the latest)
      } else {
        setHasOlderMessages(false);
        setHasNewerMessages(false);
      }

      // Remove duplicates based on message ID
      const uniqueMessages = messagesFirestore.filter((msg, index, self) =>
        index === self.findIndex(m => m.id === msg.id)
      );

      setMessages(uniqueMessages);
      setLoading(false);

      // Set up real-time listener for recent messages (to catch reactions and new messages)
      // Increased limit to 200 to ensure all visible messages get real-time updates
      const allMessagesQuery = query(
        messagesRef,
        where('chatId', '==', id),
        orderBy('timestamp', 'desc'),
        limit(200) // Listen to 200 most recent messages for real-time updates (reactions, edits, new messages)
      );

      // Reset flag for initial snapshot
      isInitialListenerSnapshot.current = true;

      const unsubscribe = onSnapshot(
        allMessagesQuery,
        { includeMetadataChanges: false },
        (snapshot) => {
          if (!snapshot.empty) {
            // Skip adding messages on the initial snapshot to avoid loading all 200 messages
            // Only process modifications and new messages after the first snapshot
            const isInitial = isInitialListenerSnapshot.current;
            if (isInitial) {
              isInitialListenerSnapshot.current = false;
            }
            
            // Process all updated documents
            snapshot.docChanges().forEach((change) => {
              const doc = change.doc;
              const updatedMessage = {
                id: doc.id,
                chatId: id,
                ...doc.data(),
              };

              if (change.type === 'modified') {
                // Message was modified (reaction added/removed, edited, etc.)
                setMessages(prev => {
                  const existingIndex = prev.findIndex(msg => msg.id === updatedMessage.id);
                  if (existingIndex !== -1) {
                    // Update existing message with new data (reactions, edits, etc.)
                    const updated = [...prev];
                    updated[existingIndex] = {
                      ...updated[existingIndex],
                      ...updatedMessage,
                      reactions: updatedMessage.reactions || {},
                    };
                    return updated;
                  }
                  return prev;
                });
              } else if (change.type === 'added') {
                // Skip added messages on initial snapshot to avoid loading all 200 messages
                if (isInitial) {
                  return;
                }
                
                // New message added
                const newMessage = updatedMessage;
                setMessages(prev => {
                  const existingIndex = prev.findIndex(msg => msg.id === newMessage.id);
                  if (existingIndex !== -1) {
                    // Message already exists (might be from initial load), update it
                    const updated = [...prev];
                    updated[existingIndex] = {
                  ...newMessage,
                  reactions: newMessage.reactions || updated[existingIndex].reactions || {},
                };
                return updated;
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
                updated[optimisticIndex] = {
                  ...newMessage,
                  reactions: newMessage.reactions || {},
                };
                return updated;
              }
              
              // Add to beginning since we're using inverted list (newest first)
                  return [{
                    ...newMessage,
                    reactions: newMessage.reactions || {},
                  }, ...prev];
                });
              }
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

  // Load more previous messages (pagination) - scrolling UP (older messages)
  const loadMoreMessages = async () => {
    if (!id || !hasOlderMessages || loadingMore || !lastMessageRef.current) return;

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
        setHasOlderMessages(snapshot.docs.length === 10);
        
        // Append to end of messages (older messages), removing duplicates
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg.id));
          return [...prev, ...uniqueNewMessages];
        });
      } else {
        setHasOlderMessages(false);
      }

      setLoadingMore(false);
    } catch (error) {
      console.error('❌ Error loading more messages:', error);
      setLoadingMore(false);
    }
  };

  // Load newer messages (pagination) - scrolling DOWN (newer messages)
  const loadNewerMessages = async () => {
    if (!id || !hasNewerMessages || loadingMore || !firstMessageRef.current) return;

    try {
      setLoadingMore(true);

      const messagesRef = collection(db, 'messages');
      const newerQuery = query(
        messagesRef,
        where('chatId', '==', id),
        orderBy('timestamp', 'asc'), // Reverse order to get newer messages
        startAfter(firstMessageRef.current),
        limit(10)
      );

      const snapshot = await getDocs(newerQuery);
      const newMessages = snapshot.docs.map(doc => ({
        id: doc.id,
        chatId: id,
        ...doc.data(),
      })).reverse(); // Reverse to maintain desc order

      if (snapshot.docs.length > 0) {
        firstMessageRef.current = snapshot.docs[snapshot.docs.length - 1];
        setHasNewerMessages(snapshot.docs.length === 10);
        
        // Prepend to beginning of messages (newer messages), removing duplicates
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg.id));
          return [...uniqueNewMessages, ...prev];
        });
      } else {
        setHasNewerMessages(false);
      }

      setLoadingMore(false);
    } catch (error) {
      console.error('❌ Error loading newer messages:', error);
      setLoadingMore(false);
    }
  };

  // Load messages around a specific message (for reply navigation)
  const loadMessagesAroundMessage = async (targetMessageId) => {
    if (!id || !targetMessageId) {
      console.error('❌ Missing id or targetMessageId');
      return false;
    }

    try {
      setLoading(true);
      
      // 1. Fetch the target message directly
      const targetMessageRef = doc(db, 'messages', targetMessageId);
      const targetDoc = await getDoc(targetMessageRef);
      
      if (!targetDoc.exists()) {
        console.error('❌ Target message not found');
        return false;
      }

      const targetMessage = {
        id: targetDoc.id,
        chatId: id,
        ...targetDoc.data(),
      };

      // 2. Fetch 10 messages after (newer than) the target message
      const messagesCollection = collection(db, 'messages');
      const newerQuery = query(
        messagesCollection,
        where('chatId', '==', id),
        where('timestamp', '>', targetMessage.timestamp),
        orderBy('timestamp', 'asc'),
        limit(10)
      );

      const newerSnapshot = await getDocs(newerQuery);
      const newerMessages = newerSnapshot.docs.map(doc => ({
        id: doc.id,
        chatId: id,
        ...doc.data(),
      }));

      // 3. Fetch 5 messages before (older than) the target message for context
      const olderQuery = query(
        messagesCollection,
        where('chatId', '==', id),
        where('timestamp', '<', targetMessage.timestamp),
        orderBy('timestamp', 'desc'),
        limit(5)
      );

      const olderSnapshot = await getDocs(olderQuery);
      const olderMessages = olderSnapshot.docs.map(doc => ({
        id: doc.id,
        chatId: id,
        ...doc.data(),
      }));

      // 4. Combine all messages: newer (reversed) + target + older
      const allMessages = [
        ...newerMessages.reverse(), // Newest first
        targetMessage,
        ...olderMessages, // Already in desc order
      ];

      // Remove duplicates
      const uniqueMessages = allMessages.filter((msg, index, self) =>
        index === self.findIndex(m => m.id === msg.id)
      );

      // 5. Set references for pagination
      if (uniqueMessages.length > 0) {
        firstMessageRef.current = await getDoc(doc(db, 'messages', uniqueMessages[0].id));
        lastMessageRef.current = await getDoc(doc(db, 'messages', uniqueMessages[uniqueMessages.length - 1].id));
      }

      // 6. Update states
      setMessages(uniqueMessages);
      setHasNewerMessages(newerMessages.length === 10);
      setHasOlderMessages(olderMessages.length === 5);
      isJumpedToMessage.current = true;

      setLoading(false);
      return true;
    } catch (error) {
      console.error('❌ Error loading messages around target:', error);
      setLoading(false);
      return false;
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

  // Auto-scroll to bottom when new messages arrive (only if user is near bottom)
  useEffect(() => {
    // Check if new messages were added
    const hasNewMessages = messages.length > previousMessageCount.current;
    
    if (hasNewMessages && isNearBottom.current && flatListRef?.current && messages.length > 0) {
      // Use scrollToIndex instead of scrollToEnd for inverted FlatList
      setTimeout(() => {
        try {
          flatListRef.current?.scrollToIndex({
            index: 0,
            animated: true,
          });
        } catch (error) {
          // Fallback if scrollToIndex fails
          flatListRef.current?.scrollToOffset({ offset: 0, animated: true });
        }
      }, 100);
    }
    
    // Update previous message count
    previousMessageCount.current = messages.length;
  }, [messages]);

  // Fetch latest names and avatars ONLY for message senders (not all participants)
  // This is much more efficient for large group chats
  useEffect(() => {
    const fetchParticipantData = async () => {
      if (messages.length === 0) return;

      try {
        // Extract unique sender IDs from visible messages
        const uniqueSenderIds = [...new Set(messages.map(msg => msg.senderId).filter(Boolean))];

        // Get current participantDataMap state
        setParticipantDataMap(prevMap => {
          for (const uid of uniqueSenderIds) {
            // Skip if already have data
            if (prevMap[uid]) continue;
            
            // Skip if currently fetching
            if (fetchingRef.current.has(uid)) continue;

            // Mark as fetching
            fetchingRef.current.add(uid);
            
            // Fetch participant data asynchronously
            (async () => {
              try {
                // Try buyer collection first
                let userDocRef = doc(db, 'buyer', uid);
                let userSnap = await getDoc(userDocRef);
                
                // If not found in buyer, try admin collection
                if (!userSnap.exists()) {
                  userDocRef = doc(db, 'admin', uid);
                  userSnap = await getDoc(userDocRef);
                }
                
                // If not found in admin, try supplier collection
                if (!userSnap.exists()) {
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
                      return prevMap;
                    }
                    
                    const updateData = {};
                    if (latestName) updateData.name = latestName;
                    if (avatarUrl && typeof avatarUrl === 'string' && avatarUrl.trim() !== '') {
                      updateData.avatarUrl = avatarUrl;
                    }
                    
                    if (Object.keys(updateData).length > 0) {
                      const newMap = {...prevMap, [uid]: {...prevMap[uid], ...updateData}};
                      
                      // Also update avatarMap for backward compatibility
                      if (updateData.avatarUrl) {
                        setAvatarMap(prevAvatarMap => ({...prevAvatarMap, [uid]: { uri: updateData.avatarUrl }}));
                      }
                      
                      return newMap;
                    }
                    
                    return prevMap;
                  });
                }
              } catch (err) {
                // Silent fail
              } finally {
                // Remove from fetching set
                fetchingRef.current.delete(uid);
              }
            })();
          }
          
          return prevMap;
        });
      } catch (err) {
        // Silent fail
      }
    };

    fetchParticipantData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [messages.length, currentUserUid, id]); // Trigger when messages change (new senders appear)

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
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}} edges={["top", "left", "right"]}>
      <KeyboardAvoidingView 
        style={{flex: 1}} 
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {/* Header */}
        <View style={[styles.header, {paddingTop: 12}]}>
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
                <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{name || 'Chat'}</Text>
                <View style={styles.subtitleRow}>
                  <Text style={styles.subtitle}>
                    {`${participants.length} ${participants.length === 1 ? 'member' : 'members'}`}
                  </Text>
                  {activeMembers > 0 && (
                    <>
                      <View style={styles.subtitleDot} />
                      <View style={styles.activeIndicatorContainer}>
                        <View style={styles.activeIndicatorDot} />
                        <Text style={styles.activeIndicatorText}>
                          {`${activeMembers} active`}
                        </Text>
                      </View>
                    </>
                  )}
                </View>
              </View>
            ) : (
              <View style={styles.userInfoText}>
                <Text style={styles.title} numberOfLines={1} ellipsizeMode="tail">{participantDataMap[otherParticipantUid]?.name || otherParticipant?.name || name || 'Chat'}</Text>
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
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollToIndexFailed={(info) => {
            // Handle scroll to index failure - wait a bit and try again
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              try {
                flatListRef.current?.scrollToIndex({
                  index: info.index,
                  animated: true,
                  viewPosition: 0.5,
                });
              } catch (e) {
                // Silent fail
              }
            });
          }}
          maintainVisibleContentPosition={{
            minIndexForVisible: 0,
          }}
          ListHeaderComponent={
            loadingMore && hasNewerMessages ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#666' }}>Loading newer messages...</Text>
              </View>
            ) : null
          }
          ListFooterComponent={
            loadingMore && hasOlderMessages ? (
              <View style={{ padding: 20, alignItems: 'center' }}>
                <Text style={{ color: '#666' }}>Loading older messages...</Text>
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
                }
                // Priority 2: Get name from sender in participants array
                else if (sender) {
                  senderName = sender?.name || 'Unknown';
                }
              }
              
              // Get avatar for both group and private chats
              // Priority 1: Get avatar from participantDataMap (fetched from Firestore - most reliable)
              if (participantDataMap[item.senderId]?.avatarUrl) {
                senderAvatarUrl = participantDataMap[item.senderId].avatarUrl;
              }
              // Priority 2: Get avatar from avatarMap (for backward compatibility)
              else if (avatarMap[item.senderId]) {
                if (typeof avatarMap[item.senderId] === 'object' && avatarMap[item.senderId].uri) {
                  senderAvatarUrl = avatarMap[item.senderId].uri;
                } else if (typeof avatarMap[item.senderId] === 'string') {
                  senderAvatarUrl = avatarMap[item.senderId];
                }
              }
              // Priority 3: Get avatar URL from sender in participants array
              else if (sender?.avatarUrl) {
                if (typeof sender.avatarUrl === 'string' && sender.avatarUrl.trim() !== '') {
                  senderAvatarUrl = sender.avatarUrl;
                } else if (typeof sender.avatarUrl === 'object' && sender.avatarUrl.uri) {
                  senderAvatarUrl = sender.avatarUrl.uri;
                }
              }
              // Priority 4: For private chats, try otherUserInfo as fallback
              else if (chatType === 'private' && otherUserInfo?.avatarUrl) {
                if (typeof otherUserInfo.avatarUrl === 'string' && otherUserInfo.avatarUrl.trim() !== '') {
                  senderAvatarUrl = otherUserInfo.avatarUrl;
                } else if (typeof otherUserInfo.avatarUrl === 'object' && otherUserInfo.avatarUrl.uri) {
                  senderAvatarUrl = otherUserInfo.avatarUrl.uri;
                }
              }
              
              if (chatType === 'group' && !senderName) {
                senderName = 'Unknown';
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
                videoUrl={item.videoUrl || null}
                thumbnailUrl={item.thumbnailUrl || null}
                videoDuration={item.videoDuration || 0}
                uploadProgress={item.uploadProgress}
                localVideoUri={item.localVideoUri || null}
                prevMessageHasStackedImages={prevMessageHasStackedImages || false}
                replyTo={item.replyTo || null}
                onMessageLongPress={handleMessageLongPress}
                onReplyPress={handleReplyPress}
                isEdited={item.isEdited || false}
                lastEditedAt={item.lastEditedAt || null}
                editHistory={item.editHistory || []}
                onViewEditHistory={viewEditHistory}
                participantDataMap={participantDataMap}
                messages={messages}
                messageId={item.id}
                reactions={item.reactions || null}
              />
            );
          }}
          contentContainerStyle={{ paddingVertical: 10, paddingBottom: totalBottomPadding + 16 }}
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

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <TouchableOpacity 
          style={styles.scrollToBottomButton}
          onPress={scrollToBottom}
          activeOpacity={0.8}
        >
          <View style={styles.scrollToBottomIcon}>
            <Svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <Path
                d="M3 21H21M12 3V17M12 17L19 10M12 17L5 10"
                stroke="#FFFFFF"
                strokeWidth="2"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </Svg>
          </View>
        </TouchableOpacity>
      )}

      {/* Finding Message Modal */}
      <Modal
        visible={findingMessage}
        transparent={true}
        animationType="fade"
      >
        <View style={styles.findingMessageOverlay}>
          <View style={styles.findingMessageContainer}>
            <Animated.Text
              style={[
                styles.findingMessagePlant,
                {
                  transform: [{
                    rotate: plantRotation.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['0deg', '360deg']
                    })
                  }]
                }
              ]}
            >
              🌱
            </Animated.Text>
            <Text style={styles.findingMessageTitle}>Finding message</Text>
            <Text style={styles.findingMessageSubtitle}>Please wait...</Text>
          </View>
        </View>
      </Modal>

      {/* Input - Disabled for non-members */}
      <View style={{paddingBottom: Math.max(insets.bottom, 8)}}>
        <MessageInput 
          onSend={(text, isListing, listingData, isSeller, isBuyer, replyTo, mentions) => sendMessage(text, isListing, listingData, isSeller, isBuyer, replyTo, mentions)} 
          onSendImage={(images, text) => sendImage(images, text, replyingTo)}
          onSendVideo={(video, text) => sendVideo(video, text, replyingTo)}
          disabled={chatType === 'group' && !isMember}
          replyingTo={replyingTo}
          onCancelReply={cancelReply}
          participantDataMap={participantDataMap}
          editingMessage={editingMessage}
          onCancelEdit={cancelEdit}
          onSaveEdit={saveEditedMessage}
          currentUserUid={currentUserUid}
          chatType={chatType}
        />
      </View>

      {/* Message Tooltip Modal - Emoji, Reply, Edit, and Delete */}
      {messageTooltip && !showEmojiPicker && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={closeTooltip}>
          <TouchableOpacity
            style={styles.tooltipOverlay}
            activeOpacity={1}
            onPress={closeTooltip}>
            <View style={styles.tooltipContainer}>
              {/* Emoji */}
              <TouchableOpacity
                style={styles.tooltipIconButton}
                onPress={openEmojiPicker}>
                <View style={styles.tooltipIconCircle}>
                  <EmojiIcon width={24} height={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              {/* Reply */}
              <TouchableOpacity
                style={styles.tooltipIconButton}
                onPress={handleReplyFromTooltip}>
                <View style={styles.tooltipIconCircle}>
                  <ReplyIcon width={24} height={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              {/* Edit - only for own messages */}
              {messageTooltip.senderId === currentUserUid && !messageTooltip.isListing && (
                <TouchableOpacity
                  style={styles.tooltipIconButton}
                  onPress={handleEditFromTooltip}>
                  <View style={styles.tooltipIconCircle}>
                    <EditIcon width={24} height={24} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              )}
              {/* Delete - only for own messages */}
              {messageTooltip.senderId === currentUserUid && !messageTooltip.isListing && (
                <TouchableOpacity
                  style={styles.tooltipIconButton}
                  onPress={handleDeleteFromTooltip}>
                  <View style={styles.tooltipIconCircle}>
                    <DeleteIcon width={20} height={20} color="#FFFFFF" />
                  </View>
                </TouchableOpacity>
              )}
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Emoji Picker Modal */}
      {messageTooltip && showEmojiPicker && (
        <Modal
          visible={true}
          transparent={true}
          animationType="fade"
          onRequestClose={closeTooltip}>
          <TouchableOpacity
            style={styles.tooltipOverlay}
            activeOpacity={1}
            onPress={closeTooltip}>
            <View style={styles.emojiPickerContainer}>
              <TouchableOpacity
                style={styles.emojiPickerButton}
                onPress={() => handleEmojiReaction('❤️')}>
                <Text style={styles.emojiPickerEmoji}>❤️</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.emojiPickerButton}
                onPress={() => handleEmojiReaction('😂')}>
                <Text style={styles.emojiPickerEmoji}>😂</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.emojiPickerButton}
                onPress={() => handleEmojiReaction('😮')}>
                <Text style={styles.emojiPickerEmoji}>😮</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.emojiPickerButton}
                onPress={() => handleEmojiReaction('😢')}>
                <Text style={styles.emojiPickerEmoji}>😢</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.emojiPickerButton}
                onPress={() => handleEmojiReaction('😡')}>
                <Text style={styles.emojiPickerEmoji}>😡</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.emojiPickerButton}
                onPress={() => handleEmojiReaction('👍')}>
                <Text style={styles.emojiPickerEmoji}>👍</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteConfirm && (
        <Modal
          visible={showDeleteConfirm}
          transparent={true}
          animationType="fade"
          onRequestClose={cancelDeleteMessage}>
          <View style={styles.deleteModalOverlay}>
            <View style={styles.deleteModalContainer}>
              <View style={styles.deleteModalContent}>
                <Text style={styles.deleteModalTitle}>Delete Message</Text>
                <Text style={styles.deleteModalMessage}>
                  Are you sure you want to delete this message? This action cannot be undone.
                </Text>
              </View>
              
              <View style={styles.deleteModalDivider} />
              
              <View style={styles.deleteModalButtons}>
                <TouchableOpacity
                  style={styles.deleteModalButton}
                  onPress={cancelDeleteMessage}
                  activeOpacity={0.7}>
                  <Text style={styles.deleteModalButtonTextCancel}>Cancel</Text>
                </TouchableOpacity>
                
                <View style={styles.deleteModalButtonDivider} />
                
                <TouchableOpacity
                  style={styles.deleteModalButton}
                  onPress={confirmDeleteMessage}
                  activeOpacity={0.7}>
                  <Text style={styles.deleteModalButtonTextDelete}>Delete</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      )}

      {/* Edit History Modal - DISABLED */}
      {/* Users can edit messages but cannot view edit history */}
      {false && editHistoryVisible && selectedMessageHistory && (
        <Modal
          visible={true}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setEditHistoryVisible(false)}>
          <View style={styles.editHistoryModalOverlay}>
            <View style={styles.editHistoryModalContent}>
              {/* Header */}
              <View style={styles.editHistoryHeader}>
                <Text style={styles.editHistoryTitle}>Edit History</Text>
                <TouchableOpacity
                  onPress={() => setEditHistoryVisible(false)}
                  style={styles.editHistoryCloseButton}>
                  <Text style={styles.editHistoryCloseText}>✕</Text>
                </TouchableOpacity>
              </View>

              {/* Current Version */}
              <View style={styles.editHistorySection}>
                <Text style={styles.editHistorySectionTitle}>Current version</Text>
                <View style={styles.editHistoryItem}>
                  <Text style={styles.editHistoryText}>{selectedMessageHistory.text}</Text>
                  <Text style={styles.editHistoryTimestamp}>
                    {selectedMessageHistory.lastEditedAt?.toDate 
                      ? new Date(selectedMessageHistory.lastEditedAt.toDate()).toLocaleString()
                      : 'Just now'}
                  </Text>
                </View>
              </View>

              {/* Previous Versions */}
              {selectedMessageHistory.editHistory && selectedMessageHistory.editHistory.length > 0 && (
                <View style={styles.editHistorySection}>
                  <Text style={styles.editHistorySectionTitle}>
                    Previous versions ({selectedMessageHistory.editHistory.length})
                  </Text>
                  <ScrollView style={styles.editHistoryScrollView}>
                    {selectedMessageHistory.editHistory.map((historyItem, index) => (
                      <View key={index} style={styles.editHistoryItem}>
                        <Text style={styles.editHistoryText}>{historyItem.text}</Text>
                        <Text style={styles.editHistoryTimestamp}>
                          {historyItem.editedAt?.toDate 
                            ? new Date(historyItem.editedAt.toDate()).toLocaleString()
                            : 'Unknown time'}
                        </Text>
                      </View>
                    ))}
                  </ScrollView>
                </View>
              )}
            </View>
          </View>
        </Modal>
      )}
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
    flex: 1,
    minWidth: 0,
    marginLeft: 10,
  },
  title: {fontSize: 18, fontWeight: 'bold', color: '#000'},
  subtitle: {fontSize: 12, color: '#666', marginTop: 2},
  subtitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
    gap: 6,
  },
  subtitleDot: {
    width: 3,
    height: 3,
    borderRadius: 1.5,
    backgroundColor: '#999',
  },
  activeIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  activeIndicatorDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#34C759', // iOS green for online/active
    shadowColor: '#34C759',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.6,
    shadowRadius: 4,
  },
  activeIndicatorText: {
    fontSize: 12,
    color: '#34C759',
    fontWeight: '600',
  },
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
  tooltipOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    padding: 8,
  },
  tooltipIconButton: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tooltipIconCircle: {
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#FFFFFF',
  },
  tooltipEmojiIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  tooltipReplyIcon: {
    fontSize: 24,
    color: '#FFFFFF',
  },
  emojiPickerContainer: {
    backgroundColor: 'rgba(60, 60, 60, 0.95)',
    borderRadius: 24,
    padding: 8,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  emojiPickerButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  emojiPickerEmoji: {
    fontSize: 32,
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
  scrollToBottomButton: {
    position: 'absolute',
    right: 20,
    bottom: 100,
    zIndex: 1000,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  scrollToBottomIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#539461', // Same color as chat bubble background
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollToBottomArrow: {
    fontSize: 24,
    color: '#FFFFFF', // White arrow
    fontWeight: 'bold',
  },
  findingMessageOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  findingMessageContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    padding: 32,
    alignItems: 'center',
    minWidth: 240,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 10,
  },
  findingMessagePlant: {
    fontSize: 64,
    marginBottom: 16,
  },
  findingMessageTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 8,
  },
  findingMessageSubtitle: {
    fontSize: 14,
    color: '#666',
  },
  deleteModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  deleteModalContainer: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 10,
    elevation: 5,
  },
  deleteModalContent: {
    paddingTop: 20,
    paddingHorizontal: 16,
    paddingBottom: 16,
    alignItems: 'center',
  },
  deleteModalTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: '#000000',
    marginBottom: 8,
    textAlign: 'center',
  },
  deleteModalMessage: {
    fontSize: 13,
    color: '#000000',
    textAlign: 'center',
    lineHeight: 18,
  },
  deleteModalDivider: {
    height: 0.5,
    backgroundColor: 'rgba(60, 60, 67, 0.29)',
  },
  deleteModalButtons: {
    flexDirection: 'row',
  },
  deleteModalButton: {
    flex: 1,
    paddingVertical: 11,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
  },
  deleteModalButtonDivider: {
    width: 0.5,
    backgroundColor: 'rgba(60, 60, 67, 0.29)',
  },
  deleteModalButtonTextCancel: {
    fontSize: 17,
    fontWeight: '600',
    color: '#007AFF',
  },
  deleteModalButtonTextDelete: {
    fontSize: 17,
    fontWeight: '600',
    color: '#FF3B30',
  },
  editHistoryModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  editHistoryModalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingTop: 20,
    paddingBottom: 40,
    maxHeight: '80%',
  },
  editHistoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E6EB',
  },
  editHistoryTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#050505',
  },
  editHistoryCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  editHistoryCloseText: {
    fontSize: 24,
    color: '#666',
    fontWeight: 'bold',
  },
  editHistorySection: {
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  editHistorySectionTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
    marginBottom: 12,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  editHistoryScrollView: {
    maxHeight: 400,
  },
  editHistoryItem: {
    backgroundColor: '#F0F2F5',
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  editHistoryText: {
    fontSize: 15,
    color: '#050505',
    marginBottom: 8,
    lineHeight: 20,
  },
  editHistoryTimestamp: {
    fontSize: 12,
    color: '#999',
    fontStyle: 'italic',
  },
});

export default ChatScreen;
