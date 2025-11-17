import {
  addDoc,
  arrayUnion,
  collection,
  doc,
  getDoc,
  getDocs,
  onSnapshot,
  orderBy,
  query,
  Timestamp,
  updateDoc,
  where
} from 'firebase/firestore';
import React, { useContext, useEffect, useRef, useState } from 'react';
import { FlatList, Image, StyleSheet, Text, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import {useSafeAreaInsets, SafeAreaView} from 'react-native-safe-area-context';
import { db } from '../../../firebase';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import { AuthContext } from '../../auth/AuthProvider';
import ChatBubble from '../../components/ChatBubble/ChatBubble';
import DateSeparator from '../../components/DateSeparator/DateSeparator';
import MessageInput from '../../components/MessageInput/MessageInput';
import BrowseMorePlants from '../../components/BrowseMorePlants/BrowseMorePlants';

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
  
  // Handle admin API response: userInfo.data.uid, regular nested: userInfo.user.uid, or flat: userInfo.uid
  const currentUserUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';
  
  // Check if current user is a buyer (only buyers can request to join public groups)
  const isBuyer = 
    userInfo?.user?.userType === 'buyer' || 
    userInfo?.data?.userType === 'buyer' ||
    userInfo?.userType === 'buyer';
  
  // Make sure participants is an array and has at least one element
  // For group chats, we want to show the group name
  let displayName;
  if (chatType === 'group') {
    // For group chats, use the group name from params
    displayName = name;
  } else {
    // For private chats, show the other participant's name
    displayName = participants.length > 0 
      ? (participants.find(p => p?.uid !== currentUserUid) || participants[0])?.name 
      : name;
  }
  
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
  const sendMessage = async (text) => {
    if (!id) {
      return;
    }

    if (!text || !text.trim()) return;
    
    // Block sending messages if user is not a member
    if (chatType === 'group' && !isMember) {
      Alert.alert('Access Denied', 'You must be a member of this group to send messages.');
      return;
    }

    try {
      const newMsg = {
        chatId: id,
        senderId: currentUserUid || null,
        text: text.trim(),
        timestamp: Timestamp.now(),
      };

      // Add message to messages collection
      await addDoc(collection(db, 'messages'), newMsg);

      // Mark chat lastMessage and update timestamp, mark unread for other participants
      const otherParticipantIds = Array.isArray(participantIds)
        ? participantIds.filter(pid => pid && pid !== currentUserUid)
        : [];

      try {
        await updateDoc(doc(db, 'chats', id), {
          lastMessage: newMsg.text,
          timestamp: Timestamp.now(),
          unreadBy: arrayUnion(...otherParticipantIds),
        });
      } catch (err) {
        // ignore update failures
      }
    } catch (error) {
      // ignore send errors
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
  useEffect(() => {
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
          
          // If seller is invited but not a member, redirect to settings
          const isSeller = 
            userInfo?.user?.userType === 'supplier' || 
            userInfo?.data?.userType === 'supplier' ||
            userInfo?.userType === 'supplier';
          
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
  }, [id, chatType, currentUserUid, isBuyer, navigation, name]);

  useEffect(() => {
    if (!id) {
      setMessages([]);
      setLoading(false);
      return;
    }

    try {
      // Reset loading state immediately when navigating to a new chat
      setLoading(true);
      setMessages([]);
      
      const q = query(
        collection(db, 'messages'),
        where('chatId', '==', id),
        orderBy('timestamp', 'asc')
      );

      const unsubscribe = onSnapshot(
        q,
        { includeMetadataChanges: true },
        snapshot => {
          try {
            const messagesFirestore = snapshot.docs.map(doc => ({
              id: doc.id,
              chatId: id,
              ...doc.data(),
            }));

            setMessages(messagesFirestore);
            setLoading(false);
          } catch (error) {
            setMessages([]);
            setLoading(false);
          }
        },
        error => {
          setMessages([]);
          setLoading(false);
        }
      );

      return () => unsubscribe();
    } catch (error) {
      setMessages([]);
      setLoading(false);
    }
  }, [id]);

  // Auto-scroll when messages change
  useEffect(() => {
    if (flatListRef?.current && messages.length > 0) {
      flatListRef.current.scrollToEnd({ animated: false });
    }
  }, [messages]);

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
                  
                  // Get latest name
                  const firstName = data?.firstName || '';
                  const lastName = data?.lastName || '';
                  const latestName = `${firstName} ${lastName}`.trim() || data?.gardenOrCompanyName || data?.name || '';
                  
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
                name: chatType === 'group' ? name : displayName
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
                <Text style={styles.title} numberOfLines={1}>{displayName || 'Chat'}</Text>
                <Text style={styles.subtitle}>
                  {`${participants.length} ${participants.length === 1 ? 'member' : 'members'}`}
                </Text>
              </View>
            ) : (
              <View style={styles.userInfoText}>
                <Text style={styles.title} numberOfLines={1}>{displayName || 'Chat'}</Text>
                <Text style={styles.subtitle}>Active now</Text>
              </View>
            )}
          </TouchableOpacity>
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
          ref={flatListRef}
          data={messages}
          keyExtractor={(item, index) => item.id || `message-${index}`}
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
            
            // Show avatar only on the last message of a group (for non-me messages)
            const showAvatar = !isMe && isLastInGroup;
            
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
                text={item.text || 'Empty message'}
                isMe={isMe}
                showAvatar={showAvatar}
                senderName={senderName}
                senderAvatarUrl={senderAvatarUrl}
                isGroupChat={chatType === 'group'}
                isFirstInGroup={isFirstInGroup}
                isLastInGroup={isLastInGroup}
              />
            );
          }}
          contentContainerStyle={{ paddingVertical: 10, paddingBottom: safeBottomPadding + 16 }}
          style={{ flex: 1 }}
          onContentSizeChange={() => {
            setTimeout(() => {
              if (flatListRef?.current && messages.length > 0) {
                flatListRef?.current.scrollToEnd({ animated: true });
              }
            }, 100);
          }}
          onLayout={() => {
            if (flatListRef?.current && messages.length > 0) {
              flatListRef?.current.scrollToEnd({ animated: false });
            }
          }}
        />
      )}

      {/* Plant Recommendations for plant-related conversations */}
      {messages.length > 3 && isPlantRelatedConversation() && (
        <View style={styles.plantRecommendationsContainer}>
          <BrowseMorePlants
            title="Plants You Might Like"
            limit={4}
            showLoadMore={false}
            containerStyle={styles.chatBrowseMoreContainer}
            horizontal={true}
          />
        </View>
      )}

      {/* Input - Disabled for non-members */}
      <MessageInput 
        onSend={sendMessage} 
        disabled={chatType === 'group' && !isMember}
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
});

export default ChatScreen;

