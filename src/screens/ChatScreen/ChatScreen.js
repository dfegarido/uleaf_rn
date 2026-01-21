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
  const [hasOlderMessages, setHasOlderMessages] = useState(true);
  const [hasNewerMessages, setHasNewerMessages] = useState(false);
  const lastMessageRef = useRef(null);
  const firstMessageRef = useRef(null);
  const messagesUnsubscribeRef = useRef(null);
  const messagesRef = useRef(messages); // Keep a ref to always have current messages
  const isJumpedToMessage = useRef(false); // Track if we've jumped to a specific message
  const [replyingTo, setReplyingTo] = useState(null); // Message being replied to
  const [messageTooltip, setMessageTooltip] = useState(null); // Message for tooltip (long-pressed message)
  const [showEmojiPicker, setShowEmojiPicker] = useState(false); // Show emoji picker modal
  const [showScrollToBottom, setShowScrollToBottom] = useState(false); // Show scroll to bottom button
  const [findingMessage, setFindingMessage] = useState(false); // Show finding message modal
  const [editingMessage, setEditingMessage] = useState(null); // Message being edited
  const [editHistoryVisible, setEditHistoryVisible] = useState(false); // Edit history modal
  const [selectedMessageHistory, setSelectedMessageHistory] = useState(null); // Message for history view
  const plantRotation = useRef(new Animated.Value(0)).current;

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
    console.log('🎯 handleReplyPress called with messageId:', originalMessageId);
    
    if (!originalMessageId || !flatListRef.current) {
      console.log('❌ Cannot scroll: missing messageId or flatListRef');
      return;
    }
    
    // Check if message is in current view
    let messageIndex = messagesRef.current.findIndex(msg => msg.id === originalMessageId);
    
    console.log('🎯 Initial search - messageId:', originalMessageId, 'at index:', messageIndex, 'total messages:', messagesRef.current.length);
    
    // If message not found in current view, use optimized direct fetch
    if (messageIndex === -1) {
      console.log('📥 Message not in current view, loading directly...');
      setFindingMessage(true); // Show loading modal
      
      // Use direct fetch instead of sequential loading
      const success = await loadMessagesAroundMessage(originalMessageId);
      
      if (!success) {
        console.log('❌ Message not found');
        setFindingMessage(false);
        Alert.alert('Message not found', 'The original message could not be found. It may have been deleted.');
        return;
      }
      
      // Wait for state to update
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Find message index in newly loaded messages
      messageIndex = messagesRef.current.findIndex(msg => msg.id === originalMessageId);
      
      console.log('✅ Message loaded at index:', messageIndex, 'in', messagesRef.current.length, 'total messages');
      setFindingMessage(false);
    }
    
    if (messageIndex === -1) {
      console.log('❌ Message still not found after direct load');
      setFindingMessage(false);
      Alert.alert('Message not found', 'The original message could not be found.');
      return;
    }
    
    // Wait for FlatList to render
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Scroll to the message
    const scrollToMessage = (index) => {
      console.log('🎯 Scrolling to index:', index);
      try {
        if (flatListRef.current) {
          flatListRef.current.scrollToIndex({
            index: index,
            animated: true,
            viewPosition: 0.3, // Position near top for better context
          });
          console.log('✅ Successfully scrolled to index:', index);
        }
      } catch (error) {
        console.log('⚠️ Error scrolling, retrying:', error);
        setTimeout(() => {
          try {
            flatListRef.current?.scrollToIndex({
              index: index,
              animated: true,
              viewPosition: 0.3,
            });
            console.log('✅ Retry successful');
          } catch (e) {
            console.log('❌ Scroll failed:', e);
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

      console.log('✅ Message edited successfully', {
        messageId: editingMessage.id,
        isEdited: true,
        historyCount: (editingMessage.editHistory || []).length + 1
      });
    } catch (error) {
      console.error('❌ Error editing message:', error);
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
    
    // Show button when scrolled up more than 200 pixels
    setShowScrollToBottom(offsetY > 200);
    
    // Load newer messages when scrolling near the top (if we jumped to a message)
    if (isJumpedToMessage.current && offsetY < 100 && hasNewerMessages && !loadingMore) {
      console.log('📥 Near top, loading newer messages...');
      loadNewerMessages();
    }
  };

  // Send a message: create message doc and update chat metadata
  const sendMessage = async (text, isListing = false, listingId = null, imageUrl = null, imageUrls = null, replyTo = null) => {
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
            // Also update existing messages if reactions changed
            setMessages(prev => {
              const existingIndex = prev.findIndex(msg => msg.id === newMessage.id);
              if (existingIndex !== -1) {
                // Update existing message (for reaction updates)
                const updated = [...prev];
                updated[existingIndex] = {
                  ...updated[existingIndex],
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
    console.log('📥 loadMoreMessages (older) called - hasOlderMessages:', hasOlderMessages, 'loadingMore:', loadingMore, 'lastMessageRef:', !!lastMessageRef.current);
    
    if (!id || !hasOlderMessages || loadingMore || !lastMessageRef.current) {
      console.log('📥 loadMoreMessages early return:', { id: !!id, hasOlderMessages, loadingMore, lastMessageRef: !!lastMessageRef.current });
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

      console.log('📥 loadMoreMessages fetched:', newMessages.length, 'older messages');

      if (snapshot.docs.length > 0) {
        lastMessageRef.current = snapshot.docs[snapshot.docs.length - 1];
        setHasOlderMessages(snapshot.docs.length === 10);
        
        // Append to end of messages (older messages), removing duplicates
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg.id));
          console.log('📥 Adding', uniqueNewMessages.length, 'unique older messages. Total will be:', prev.length + uniqueNewMessages.length);
          return [...prev, ...uniqueNewMessages];
        });
      } else {
        console.log('📥 No more older messages found');
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
    console.log('📥 loadNewerMessages called - hasNewerMessages:', hasNewerMessages, 'loadingMore:', loadingMore, 'firstMessageRef:', !!firstMessageRef.current);
    
    if (!id || !hasNewerMessages || loadingMore || !firstMessageRef.current) {
      console.log('📥 loadNewerMessages early return:', { id: !!id, hasNewerMessages, loadingMore, firstMessageRef: !!firstMessageRef.current });
      return;
    }

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

      console.log('📥 loadNewerMessages fetched:', newMessages.length, 'newer messages');

      if (snapshot.docs.length > 0) {
        firstMessageRef.current = snapshot.docs[snapshot.docs.length - 1];
        setHasNewerMessages(snapshot.docs.length === 10);
        
        // Prepend to beginning of messages (newer messages), removing duplicates
        setMessages(prev => {
          const existingIds = new Set(prev.map(m => m.id));
          const uniqueNewMessages = newMessages.filter(msg => !existingIds.has(msg.id));
          console.log('📥 Adding', uniqueNewMessages.length, 'unique newer messages. Total will be:', prev.length + uniqueNewMessages.length);
          return [...uniqueNewMessages, ...prev];
        });
      } else {
        console.log('📥 No more newer messages found');
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
    console.log('🎯 loadMessagesAroundMessage called for:', targetMessageId);
    
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

      console.log('✅ Found target message:', targetMessage);

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

      console.log('📥 Fetched', newerMessages.length, 'newer messages');

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

      console.log('📥 Fetched', olderMessages.length, 'older messages for context');

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

      console.log('✅ Total unique messages:', uniqueMessages.length);

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
          onScroll={handleScroll}
          scrollEventThrottle={16}
          onScrollToIndexFailed={(info) => {
            // Handle scroll to index failure - wait a bit and try again
            console.log('ScrollToIndex failed, retrying:', info);
            const wait = new Promise(resolve => setTimeout(resolve, 500));
            wait.then(() => {
              try {
                flatListRef.current?.scrollToIndex({ 
                  index: info.index, 
                  animated: true,
                  viewPosition: 0.5,
                });
              } catch (e) {
                console.log('Retry scrollToIndex also failed:', e);
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

      {/* Scroll to Bottom Button */}
      {showScrollToBottom && (
        <TouchableOpacity 
          style={styles.scrollToBottomButton}
          onPress={scrollToBottom}
          activeOpacity={0.8}
        >
          <View style={styles.scrollToBottomIcon}>
            <Text style={styles.scrollToBottomArrow}>↓</Text>
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
      <MessageInput 
        onSend={(text) => sendMessage(text, false, null, null, null, replyingTo)} 
        onSendImage={(images, text) => sendImage(images, text, replyingTo)}
        disabled={chatType === 'group' && !isMember}
        replyingTo={replyingTo}
        onCancelReply={cancelReply}
        participantDataMap={participantDataMap}
        editingMessage={editingMessage}
        onCancelEdit={cancelEdit}
        onSaveEdit={saveEditedMessage}
      />

      {/* Message Tooltip Modal - Three buttons: Emoji, Reply, and Edit (for own messages) */}
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
              <TouchableOpacity
                style={styles.tooltipIconButton}
                onPress={openEmojiPicker}>
                <View style={styles.tooltipIconCircle}>
                  <EmojiIcon width={24} height={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.tooltipIconButton}
                onPress={handleReplyFromTooltip}>
                <View style={styles.tooltipIconCircle}>
                  <ReplyIcon width={24} height={24} color="#FFFFFF" />
                </View>
              </TouchableOpacity>
              {/* Show Edit button only for own messages */}
              {messageTooltip.senderId === currentUserUid && !messageTooltip.isListing && (
                <TouchableOpacity
                  style={styles.tooltipIconButton}
                  onPress={handleEditFromTooltip}>
                  <View style={styles.tooltipIconCircle}>
                    <EditIcon width={24} height={24} color="#FFFFFF" />
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

      {/* Edit History Modal */}
      {editHistoryVisible && selectedMessageHistory && (
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
