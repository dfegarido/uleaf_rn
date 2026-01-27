import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, TouchableOpacity, Modal, ActivityIndicator, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ListingMessage from '../../screens/ChatScreen/ListingMessage';
import VideoPlayer from '../VideoPlayer/VideoPlayer';
import { formatDuration } from '../../utils/videoCompression';

const DefaultAvatar = require('../../assets/images/AvatarBig.png');

// Play Icon SVG Component
const PlayIcon = ({ width = 60, height = 60, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 32 32">
    <Path
      d="M5.92 24.096q0 1.088 0.928 1.728 0.512 0.288 1.088 0.288 0.448 0 0.896-0.224l16.16-8.064q0.48-0.256 0.8-0.736t0.288-1.088-0.288-1.056-0.8-0.736l-16.16-8.064q-0.448-0.224-0.896-0.224-0.544 0-1.088 0.288-0.928 0.608-0.928 1.728v16.16z"
      fill={color}
    />
  </Svg>
);

/**
 * Parse text and render mentions with special styling
 * @param {string} text - The message text containing @mentions
 * @param {boolean} isMe - Whether this is the current user's message
 * @returns {Array} Array of React Text components with styled mentions
 */
const renderTextWithMentions = (text, isMe) => {
  if (!text) return null;

  // Regex to match @username patterns
  const mentionRegex = /@(\w+)/g;
  const parts = [];
  let lastIndex = 0;
  let match;

  while ((match = mentionRegex.exec(text)) !== null) {
    // Add text before the mention
    if (match.index > lastIndex) {
      parts.push(
        <Text key={`text-${lastIndex}`}>
          {text.substring(lastIndex, match.index)}
        </Text>
      );
    }

    // Check if this is @everyone
    const isEveryone = match[1].toLowerCase() === 'everyone';

    // Add the mention with special styling
    parts.push(
      <Text 
        key={`mention-${match.index}`}
        style={
          isEveryone 
            ? (isMe ? styles.everyoneMentionMe : styles.everyoneMentionThem)
            : (isMe ? styles.mentionTextMe : styles.mentionTextThem)
        }
      >
        {isEveryone && '👥 '}{match[0]}
      </Text>
    );

    lastIndex = match.index + match[0].length;
  }

  // Add remaining text after the last mention
  if (lastIndex < text.length) {
    parts.push(
      <Text key={`text-${lastIndex}`}>
        {text.substring(lastIndex)}
      </Text>
    );
  }

  return parts.length > 0 ? parts : text;
};

const ChatBubble = ({ currentUserUid, isSeller=false, isBuyer=false, listingId, isListing = false, navigation, text, isMe, showAvatar, senderName, senderAvatarUrl, isGroupChat, isFirstInGroup, isLastInGroup, imageUrl, imageUrls, videoUrl, thumbnailUrl, videoDuration, uploadProgress, prevMessageHasStackedImages, replyTo, onMessagePress, onMessageLongPress, onReplyPress, participantDataMap = {}, messages = [], messageId, reactions, isEdited = false, lastEditedAt = null, editHistory = [], onViewEditHistory, localVideoUri }) => {
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [videoPlayerVisible, setVideoPlayerVisible] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [tooltipVisible, setTooltipVisible] = useState(false);
  const [reactionsModalVisible, setReactionsModalVisible] = useState(false);
  
  // Determine which images to display
  const images = imageUrls && imageUrls.length > 0 ? imageUrls : (imageUrl ? [imageUrl] : []);
  // Show sender name for group chats, not from current user, only on first message of group
  const shouldShowSenderName = isGroupChat && !isMe && senderName && isFirstInGroup;
  
  // Extract reply data
  const originalMessageSenderName = replyTo?.senderName || 'Unknown';
  const originalMessageText = replyTo?.text || '';
  const originalMessageImages = replyTo?.imageUrls || (replyTo?.imageUrl ? [replyTo.imageUrl] : []);
  const originalMessageVideoUrl = replyTo?.videoUrl || null;
  const originalMessageThumbnailUrl = replyTo?.thumbnailUrl || null;
  
  // Get thumbnail for reply preview (video thumbnail or first image)
  const getOriginalMessageThumbnail = () => {
    if (originalMessageThumbnailUrl) {
      return originalMessageThumbnailUrl;
    }
    if (originalMessageVideoUrl) {
      return originalMessageVideoUrl;
    }
    if (originalMessageImages.length > 0) {
      return originalMessageImages[0];
    }
    return null;
  };
  
  const originalMessageThumbnail = getOriginalMessageThumbnail();

  // Process reactions: group by emoji and get user info
  const processReactions = () => {
    if (!reactions || Object.keys(reactions).length === 0) return { grouped: {}, uniqueEmojis: [], totalCount: 0 };

    const grouped = {};
    const uniqueEmojis = [];

    Object.entries(reactions).forEach(([key, emoji]) => {
      // Extract userId from key (format: "userId_emoji")
      const userId = key.split('_')[0];
      
      if (!grouped[emoji]) {
        grouped[emoji] = [];
        uniqueEmojis.push(emoji);
      }
      
      // Get user info from participantDataMap
      const userName = participantDataMap[userId]?.name || 'Unknown';
      const userAvatar = participantDataMap[userId]?.avatarUrl || null;
      
      grouped[emoji].push({
        userId,
        userName,
        userAvatar,
        emoji,
      });
    });

    return {
      grouped,
      uniqueEmojis,
      totalCount: Object.keys(reactions).length,
    };
  };

  const reactionsData = processReactions();
  const { grouped, uniqueEmojis, totalCount } = reactionsData;
  
  // Show max 2 emojis, then "+N" if more
  const displayEmojis = uniqueEmojis.slice(0, 2);
  const remainingEmojis = uniqueEmojis.slice(2);
  const remainingCount = remainingEmojis.reduce((sum, emoji) => sum + grouped[emoji].length, 0);
  
  // Determine border radius based on position in group
  const getBorderRadius = () => {
    if (isMe) {
      // For my messages: rounded on all corners except bottom-left if not last, and top-left if not first
      if (isFirstInGroup && isLastInGroup) {
        return 16; // Single message - fully rounded
      } else if (isFirstInGroup) {
        return { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomRightRadius: 16, borderBottomLeftRadius: 4 };
      } else if (isLastInGroup) {
        return { borderTopLeftRadius: 4, borderTopRightRadius: 16, borderBottomRightRadius: 16, borderBottomLeftRadius: 16 };
      } else {
        return { borderTopLeftRadius: 4, borderTopRightRadius: 16, borderBottomRightRadius: 16, borderBottomLeftRadius: 4 };
      }
    } else {
      // For their messages: rounded on all corners except bottom-right if not last, and top-right if not first
      if (isFirstInGroup && isLastInGroup) {
        return 16; // Single message - fully rounded
      } else if (isFirstInGroup) {
        return { borderTopLeftRadius: 16, borderTopRightRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 4 };
      } else if (isLastInGroup) {
        return { borderTopLeftRadius: 4, borderTopRightRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 16 };
      } else {
        return { borderTopLeftRadius: 4, borderTopRightRadius: 16, borderBottomLeftRadius: 16, borderBottomRightRadius: 4 };
      }
    }
  };

  const borderRadius = getBorderRadius();
  // Normal margin bottom - spacing will be handled by next message's top margin
  const marginBottom = isLastInGroup ? 4 : 2;

  // Get avatar source - use provided URL or fallback to default
  const getAvatarSource = () => {
    if (senderAvatarUrl && typeof senderAvatarUrl === 'string' && senderAvatarUrl.trim() !== '') {
      return { uri: senderAvatarUrl };
    }
    return DefaultAvatar;
  };

  const renderImageGrid = () => {
    const imageCount = images.length;
    
    if (imageCount === 0) return null;
    
    if (imageCount === 1) {
      return (
        <TouchableOpacity
          onPress={() => {
            setSelectedImageIndex(0);
            setImageModalVisible(true);
          }}
          onLongPress={() => {
            if (onMessageLongPress && !isListing) {
              const messageData = {
                id: messageId,
                text,
                imageUrl,
                imageUrls,
                senderId: isMe ? currentUserUid : (senderName ? null : null),
                senderName: isMe ? null : senderName,
              };
              onMessageLongPress(messageData);
            }
          }}
          delayLongPress={300}
          activeOpacity={0.9}
          style={styles.singleImageContainer}>
          <Image
            source={{ uri: images[0] }}
            style={styles.singleImage}
            resizeMode="cover"
          />
        </TouchableOpacity>
      );
    }
    
    // For multiple images, show stacked card style
    return (
      <TouchableOpacity
        onPress={() => {
          setSelectedImageIndex(0);
          setImageModalVisible(true);
        }}
        onLongPress={() => {
          if (onMessageLongPress && !isListing) {
            const messageData = {
              id: messageId,
              text,
              imageUrl,
              imageUrls,
              senderId: isMe ? currentUserUid : (senderName ? null : null),
              senderName: isMe ? null : senderName,
            };
            onMessageLongPress(messageData);
          }
        }}
        delayLongPress={300}
        activeOpacity={0.9}
        style={styles.stackedImagesContainer}>
        {/* Background cards - show up to 2 actual images peeking out */}
        {images.slice(1, Math.min(3, imageCount)).reverse().map((imageUri, reverseIndex) => {
          const index = Math.min(2, imageCount - 1) - reverseIndex; // Actual index from back
          const offset = (index + 1) * 12; // Increased offset for better visibility
          const rotation = (index + 1) * 4; // More rotation for Messenger-style depth
          const scale = 1 - (index * 0.02); // Slight scale reduction for depth
          return (
            <View
              key={`bg-${index}`}
              style={[
                styles.backgroundCard,
                {
                  transform: [
                    { translateY: -offset },
                    { translateX: offset },
                    { rotate: `${rotation}deg` },
                    { scale: scale }
                  ],
                  zIndex: 10 - index,
                }
              ]}>
              <Image
                source={{ uri: imageUri }}
                style={styles.backgroundCardImage}
                resizeMode="cover"
              />
            </View>
          );
        })}
        
        {/* Front card with image */}
        <View style={styles.frontCard}>
          <Image
            source={{ uri: images[0] }}
            style={styles.stackedImage}
            resizeMode="cover"
          />
          {/* Overlay with image count */}
          <View style={styles.imageCountOverlay}>
            <Text style={styles.imageCountText}>{imageCount} photos</Text>
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <>
      <View style={[
        styles.row, 
        isMe ? styles.rightAlign : styles.leftAlign, 
        !isMe && showAvatar ? styles.rowReverseGap : {},
        // Add extra top margin if this message has images to create space from previous message
        images.length > 1 && { marginTop: 12 },
        images.length === 1 && { marginTop: 6 },
        // Add top margin if previous message had stacked images and this is a text message
        // Increased to 70px to ensure long messages don't go behind stacked images
        prevMessageHasStackedImages && images.length === 0 && { marginTop: 70 },
        // Ensure proper z-index so messages don't overlap
        { zIndex: images.length > 1 ? 1 : 0 }
      ]}>
        {!isMe && showAvatar && (
          <Image
            source={getAvatarSource()}
            style={styles.avatarImage}
            defaultSource={DefaultAvatar}
          />
        )}
        <View style={styles.bubbleContainer}>
          {shouldShowSenderName && (
            <Text style={[
              styles.senderName,
              // Align sender name with bubble's left edge
              showAvatar ? { marginLeft: 4 } : (!isMe ? { marginLeft: 35 } : {})
            ]}>{senderName}</Text>
          )}
          {/* "You replied to [name]" indicator */}
          {replyTo && isMe && (
            <View style={styles.replyIndicatorContainer}>
              <Svg width="14" height="14" viewBox="0 0 24 24" style={styles.replyIndicatorIcon}>
                <Path
                  fillRule="evenodd"
                  clipRule="evenodd"
                  d="M12 3C12.5523 3 13 3.44772 13 4V17.5858L18.2929 12.2929C18.6834 11.9024 19.3166 11.9024 19.7071 12.2929C20.0976 12.6834 20.0976 13.3166 19.7071 13.7071L12.7071 20.7071C12.3166 21.0976 11.6834 21.0976 11.2929 20.7071L4.29289 13.7071C3.90237 13.3166 3.90237 12.6834 4.29289 12.2929C4.68342 11.9024 5.31658 11.9024 5.70711 12.2929L11 17.5858V4C11 3.44772 11.4477 3 12 3Z"
                  fill="#9CA3AF"
                />
              </Svg>
              <Text style={styles.replyIndicatorText}>
                You replied to {originalMessageSenderName}
              </Text>
            </View>
          )}
          {/* Render video separately - OUTSIDE of text bubble */}
          {!isListing && (videoUrl || localVideoUri) && (
            <TouchableOpacity
              onPress={() => {
                // Play from server URL if available, otherwise from local URI
                const playableUri = videoUrl || localVideoUri;
                if (playableUri) {
                  setVideoPlayerVisible(true);
                }
              }}
              onLongPress={() => {
                if (onMessageLongPress && !isListing) {
                  const messageData = {
                    id: messageId,
                    text,
                    imageUrl,
                    imageUrls,
                    videoUrl,
                    thumbnailUrl,
                    senderId: isMe ? currentUserUid : (senderName ? null : null),
                    senderName: isMe ? null : senderName,
                  };
                  onMessageLongPress(messageData);
                }
              }}
              delayLongPress={300}
              activeOpacity={(videoUrl || localVideoUri) ? 0.9 : 1}
              disabled={!(videoUrl || localVideoUri)}
              style={[
                styles.videoContainer,
                // Add left margin for receiver messages to align with text bubbles
                !isMe && { marginLeft: 35 },
                { marginBottom: text && text.trim().length > 0 ? 6 : 0 } // Space between video and text
              ]}>
              {thumbnailUrl ? (
                <Image
                  source={{ uri: thumbnailUrl }}
                  style={styles.videoThumbnail}
                  resizeMode="cover"
                />
              ) : (
                <View style={[styles.videoThumbnail, { backgroundColor: '#222', justifyContent: 'center', alignItems: 'center' }]}>
                  <PlayIcon width={60} height={60} color="#666" />
                </View>
              )}
              {/* Upload progress indicator */}
              {uploadProgress !== undefined && uploadProgress < 100 && (
                <View style={styles.videoUploadOverlay}>
                  <View style={styles.videoUploadProgressContainer}>
                    <View style={[styles.videoUploadProgressBar, { width: `${uploadProgress}%` }]} />
                    <Text style={styles.videoUploadProgressText}>{uploadProgress}%</Text>
                  </View>
                </View>
              )}
              {/* Play button overlay - show if video is playable (uploaded or local) */}
              {(videoUrl || localVideoUri) && !(uploadProgress !== undefined && uploadProgress < 100) && (
                <View style={styles.videoPlayOverlay}>
                  <View style={styles.videoPlayButton}>
                    <PlayIcon width={40} height={40} color="#FFFFFF" />
                  </View>
                </View>
              )}
              {videoDuration > 0 && (
                <View style={styles.videoDurationBadge}>
                  <Text style={styles.videoDurationText}>{formatDuration(videoDuration)}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}

          <TouchableOpacity
            activeOpacity={0.7}
            onLongPress={() => {
              if (onMessageLongPress && !isListing) {
                const messageData = {
                  id: messageId,
                  text,
                  imageUrl,
                  imageUrls,
                  senderId: isMe ? currentUserUid : (senderName ? null : null),
                  senderName: isMe ? null : senderName,
                };
                onMessageLongPress(messageData);
              }
            }}
            delayLongPress={300}
          >
          <View
            style={[
              showAvatar ? styles.withAvatar : styles.bubble,
              // Apply bubble colors for text messages (no video/images, or has text with video/images)
              ((images.length === 0 && !videoUrl && !localVideoUri) || ((videoUrl || localVideoUri) && text && text.trim().length > 0)) && text && text.trim().length > 0 && (isMe ? styles.myBubble : styles.theirBubble),
              typeof borderRadius === 'number' ? { borderRadius } : borderRadius,
              { marginBottom },
              // Add left margin for receiver messages to align with avatar position (avatar width 25 + margin 10 = 35)
              !isMe && !showAvatar && { marginLeft: 35 },
              // Adjust padding for image messages
              images.length > 0 && styles.imageBubble,
              // Add extra margin for stacked images to show cards peeking out
              images.length > 1 && { marginTop: 20, marginRight: 20 },
              // Make bubble position relative so reactions can be absolutely positioned
              styles.bubbleRelative
            ]}>
            {/* Reply Preview */}
            {replyTo && (
              <TouchableOpacity
                style={[
                  styles.replyPreviewBubble,
                  isMe ? styles.replyPreviewBubbleMe : styles.replyPreviewBubbleThem
                ]}
                activeOpacity={0.7}
                onPress={() => {
                  if (onReplyPress && replyTo?.messageId) {
                    onReplyPress(replyTo.messageId);
                  }
                }}>
                <View style={[
                  styles.replyPreviewBar,
                  isMe ? styles.replyPreviewBarMe : styles.replyPreviewBarThem
                ]} />
                
                {/* Thumbnail for images/videos */}
                {originalMessageThumbnail && (
                  <View style={styles.replyThumbnailBubble}>
                    <Image 
                      source={{ uri: originalMessageThumbnail }} 
                      style={styles.replyThumbnailImage}
                      resizeMode="cover"
                    />
                    {/* Video play icon overlay */}
                    {originalMessageVideoUrl && (
                      <View style={styles.replyVideoOverlay}>
                        <Svg width={12} height={12} viewBox="0 0 24 24" fill="none">
                          <Path 
                            d="M16 10L18.5768 8.45392C19.3699 7.97803 19.7665 7.74009 20.0928 7.77051C20.3773 7.79703 20.6369 7.944 20.806 8.17433C21 8.43848 21 8.90095 21 9.8259V14.1741C21 15.099 21 15.5615 20.806 15.8257C20.6369 16.056 20.3773 16.203 20.0928 16.2295C19.7665 16.2599 19.3699 16.022 18.5768 15.5461L16 14M6.2 18H12.8C13.9201 18 14.4802 18 14.908 17.782C15.2843 17.5903 15.5903 17.2843 15.782 16.908C16 16.4802 16 15.9201 16 14.8V9.2C16 8.0799 16 7.51984 15.782 7.09202C15.5903 6.71569 15.2843 6.40973 14.908 6.21799C14.4802 6 13.9201 6 12.8 6H6.2C5.0799 6 4.51984 6 4.09202 6.21799C3.71569 6.40973 3.40973 6.71569 3.21799 7.09202C3 7.51984 3 8.07989 3 9.2V14.8C3 15.9201 3 16.4802 3.21799 16.908C3.40973 17.2843 3.71569 17.5903 4.09202 17.782C4.51984 18 5.07989 18 6.2 18Z" 
                            stroke="#FFFFFF" 
                            strokeWidth="2" 
                            strokeLinecap="round" 
                            strokeLinejoin="round"
                          />
                        </Svg>
                      </View>
                    )}
                  </View>
                )}
                
                <View style={styles.replyPreviewContent}>
                  {originalMessageText ? (
                    <Text style={[
                      styles.replyPreviewText,
                      isMe ? styles.replyPreviewTextMe : styles.replyPreviewTextThem
                    ]} numberOfLines={1}>
                      {originalMessageText}
                    </Text>
                  ) : originalMessageVideoUrl ? (
                    <Text 
                      style={[
                        styles.replyPreviewText,
                        isMe ? styles.replyPreviewTextMe : styles.replyPreviewTextThem
                      ]}
                      numberOfLines={1}>
                      Video
                    </Text>
                  ) : originalMessageImages.length > 0 ? (
                    <Text 
                      style={[
                        styles.replyPreviewText,
                        isMe ? styles.replyPreviewTextMe : styles.replyPreviewTextThem
                      ]}
                      numberOfLines={1}>
                      {originalMessageImages.length > 1 ? `${originalMessageImages.length} photos` : 'Photo'}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}

            {/* Render images */}
            {images.length > 0 && renderImageGrid()}
            
            {/* Render text for text-only messages OR text with video (video is rendered separately above) */}
            {!isListing && images.length === 0 && text && text.trim().length > 0 && (
              <View>
                <Text style={[isMe ? styles.myText : styles.text]}>
                  {renderTextWithMentions(text, isMe)}
                </Text>
                {/* Edited indicator (non-interactive) */}
                {isEdited && (
                  <Text style={styles.editedLabel}>Edited</Text>
                )}
              </View>
            )}
            
            {/* Render caption below images if there's text with images */}
            {!isListing && images.length > 0 && text && text.trim().length > 0 && (
              <View style={[
                styles.imageCaptionContainer,
                isMe ? styles.myBubble : styles.theirBubble,
                // Add extra top margin for stacked images (2+ photos)
                images.length > 1 && styles.imageCaptionWithStacked
              ]}>
                <Text style={[isMe ? styles.myText : styles.text, styles.imageCaption]}>
                  {renderTextWithMentions(text, isMe)}
                </Text>
                {/* Edited indicator (non-interactive) */}
                {isEdited && (
                  <Text style={styles.editedLabel}>Edited</Text>
                )}
              </View>
            )}

            
            {/* Render listing message */}
            {isListing && (
              <ListingMessage currentUserUid={currentUserUid} isSeller={isSeller} isBuyer={isBuyer} listingId={listingId} navigation={navigation} />
            )}
            
            {/* Emoji Reactions - Overlapping on the right side */}
            {reactions && Object.keys(reactions).length > 0 && (
              <TouchableOpacity
                style={styles.reactionsContainer}
                onPress={() => setReactionsModalVisible(true)}
                activeOpacity={0.7}>
                {displayEmojis.map((emoji, index) => {
                  const emojiCount = grouped[emoji]?.length || 0;
                  return (
                    <View key={emoji} style={styles.reactionItemWithCount}>
                      <View style={styles.reactionItem}>
                        <Text style={styles.reactionEmoji}>{emoji}</Text>
                        {emojiCount > 1 && (
                          <View style={styles.reactionEmojiCountBadge}>
                            <Text style={styles.reactionEmojiCountText}>{emojiCount}</Text>
                          </View>
                        )}
                      </View>
                    </View>
                  );
                })}
                {remainingCount > 0 && (
                  <View style={styles.reactionCountItem}>
                    <Text style={styles.reactionCountText}>+{remainingCount}</Text>
                  </View>
                )}
              </TouchableOpacity>
            )}
          </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Reactions Modal */}
      <Modal
        visible={reactionsModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReactionsModalVisible(false)}>
        <TouchableOpacity
          style={styles.reactionsModalOverlay}
          activeOpacity={1}
          onPress={() => setReactionsModalVisible(false)}>
          <View style={styles.reactionsModalContainer}>
            <View style={styles.reactionsModalHeader}>
              <Text style={styles.reactionsModalTitle}>Message reactions</Text>
              <TouchableOpacity
                onPress={() => setReactionsModalVisible(false)}
                style={styles.reactionsModalCloseButton}>
                <Text style={styles.reactionsModalCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.reactionsModalDivider} />
            
            {/* Summary */}
            <View style={styles.reactionsModalSummary}>
              <Text style={styles.reactionsModalSummaryText}>All {totalCount}</Text>
              {uniqueEmojis.map((emoji) => (
                <View key={emoji} style={styles.reactionsModalSummaryEmoji}>
                  <Text style={styles.reactionsModalSummaryEmojiText}>{emoji}</Text>
                  <Text style={styles.reactionsModalSummaryCount}>{grouped[emoji].length}</Text>
                </View>
              ))}
            </View>
            
            {/* Users list grouped by emoji */}
            <ScrollView style={styles.reactionsModalList} showsVerticalScrollIndicator={true}>
              {uniqueEmojis.map((emoji) => (
                <View key={emoji} style={styles.reactionsModalEmojiGroup}>
                  {grouped[emoji].map((user, index) => (
                    <View
                      key={user.userId}
                      style={styles.reactionsModalUserItem}>
                      <Image
                        source={user.userAvatar ? { uri: user.userAvatar } : DefaultAvatar}
                        style={styles.reactionsModalUserAvatar}
                        defaultSource={DefaultAvatar}
                      />
                      <View style={styles.reactionsModalUserInfo}>
                        <Text style={styles.reactionsModalUserName}>{user.userName}</Text>
                      </View>
                      <Text style={styles.reactionsModalUserEmoji}>{emoji}</Text>
                    </View>
                  ))}
                </View>
              ))}
            </ScrollView>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Full Screen Image Modal */}
      <Modal
        visible={imageModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setImageModalVisible(false)}>
        <TouchableOpacity
          style={styles.imageModalOverlay}
          activeOpacity={1}
          onPress={() => setImageModalVisible(false)}>
          <View style={styles.imageModalContainer}>
            <Image
              source={{ uri: images[selectedImageIndex] }}
              style={styles.fullScreenImage}
              resizeMode="contain"
            />
            {images.length > 1 && (
              <View style={styles.imageCounter}>
                <Text style={styles.imageCounterText}>{selectedImageIndex + 1} / {images.length}</Text>
              </View>
            )}
            <TouchableOpacity
              style={styles.closeButton}
              onPress={() => setImageModalVisible(false)}>
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
            {images.length > 1 && selectedImageIndex > 0 && (
              <TouchableOpacity
                style={styles.prevButton}
                onPress={() => setSelectedImageIndex(selectedImageIndex - 1)}>
                <Text style={styles.navButtonText}>‹</Text>
              </TouchableOpacity>
            )}
            {images.length > 1 && selectedImageIndex < images.length - 1 && (
              <TouchableOpacity
                style={styles.nextButton}
                onPress={() => setSelectedImageIndex(selectedImageIndex + 1)}>
                <Text style={styles.navButtonText}>›</Text>
              </TouchableOpacity>
            )}
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Video Player Modal */}
      {(videoUrl || localVideoUri) && (
        <VideoPlayer
          videoUrl={videoUrl || localVideoUri}
          thumbnailUrl={thumbnailUrl} // Pass thumbnail for poster/loading
          visible={videoPlayerVisible}
          onClose={() => setVideoPlayerVisible(false)}
        />
      )}
    </>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginHorizontal: 10,
    marginVertical: 0, // Remove default margin, handled by marginBottom in bubble
  },
  rightAlign: {
    justifyContent: 'flex-end',
  },
  leftAlign: {
    justifyContent: 'flex-start',
  },
  rowReverseGap: {  marginBottom: 10 },
  bubbleContainer: {
    flexDirection: 'column',
    maxWidth: '70%',
    overflow: 'visible',
  },
  senderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
    marginBottom: 2,
    marginLeft: 0, // Left aligned
    paddingHorizontal: 0,
    textAlign: 'left',
  },
  bubble: {
    padding: 10,
    borderRadius: 16,
    maxWidth: '100%',
  },
  myBubble: {
    backgroundColor: '#539461',
  },
  theirBubble: {
    backgroundColor: '#E5E5E5',
    borderWidth: 1,
    borderColor: '#D0D0D0',
  },
  text: {
    color: '#000',
  },
  myText: {
    color: '#fff',
  },
  mentionTextMe: {
    color: '#FFFFFF',
    fontWeight: '700',
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  mentionTextThem: {
    color: '#539461',
    fontWeight: '700',
    backgroundColor: 'rgba(83, 148, 97, 0.1)',
    paddingHorizontal: 4,
    paddingVertical: 2,
    borderRadius: 4,
  },
  everyoneMentionMe: {
    color: '#FFD700',
    fontWeight: '800',
    backgroundColor: 'rgba(255, 215, 0, 0.25)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 215, 0, 0.4)',
  },
  everyoneMentionThem: {
    color: '#FF6B35',
    fontWeight: '800',
    backgroundColor: 'rgba(255, 107, 53, 0.15)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: 'rgba(255, 107, 53, 0.3)',
  },
  withAvatar: {
    padding: 10,
    borderRadius: 16,
    maxWidth: '100%',
    marginLeft: 4, // Reduced from 10 to minimize gap
    overflow: 'visible',
  },
  avatarImage: {
    width: 25,
    height: 25,
    borderRadius: 12.5,
    marginRight: 4, // Reduced from 10 to minimize gap
    backgroundColor: '#f0f0f0',
  },
  imageBubble: {
    padding: 0,
    overflow: 'visible', // Changed from 'hidden' to allow stacked cards to peek out
    backgroundColor: 'transparent', // Remove background for image-only messages
  },
  singleImageContainer: {
    width: 250,
    height: 200,
    backgroundColor: '#E4E6EB',
    borderRadius: 20,
    overflow: 'hidden',
  },
  singleImage: {
    width: '100%',
    height: '100%',
  },
  stackedImagesContainer: {
    width: 250,
    height: 200,
    position: 'relative',
    paddingTop: 20, // More space for background cards
    paddingRight: 20,
    zIndex: 1, // Ensure container is above background but below next messages
  },
  backgroundCard: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 250,
    height: 200,
    borderRadius: 20,
    backgroundColor: '#D1D5DB',
    borderWidth: 4,
    borderColor: '#FFFFFF',
    overflow: 'hidden',
    // Stronger shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 3,
    },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    elevation: 5,
  },
  backgroundCardImage: {
    width: '100%',
    height: '100%',
    opacity: 0.95,
  },
  frontCard: {
    width: 250,
    height: 200,
    borderRadius: 20,
    overflow: 'hidden',
    backgroundColor: '#E4E6EB',
    position: 'relative',
    zIndex: 20,
    // Stronger shadow for depth
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 5,
    elevation: 8,
  },
  stackedImage: {
    width: '100%',
    height: '100%',
  },
  imageCountOverlay: {
    position: 'absolute',
    bottom: 16,
    left: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  imageCountText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  imageCaptionContainer: {
    marginTop: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
  },
  imageCaptionWithStacked: {
    marginTop: 16, // More space between stacked images and text caption
  },
  imageCaption: {
    fontSize: 15,
  },
  imageModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.95)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  imageModalContainer: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  fullScreenImage: {
    width: '100%',
    height: '100%',
  },
  closeButton: {
    position: 'absolute',
    top: 50,
    right: 20,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  closeButtonText: {
    color: '#fff',
    fontSize: 24,
    fontWeight: 'bold',
  },
  imageCounter: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    alignItems: 'center',
    zIndex: 10,
  },
  imageCounterText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  prevButton: {
    position: 'absolute',
    left: 20,
    top: '50%',
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  nextButton: {
    position: 'absolute',
    right: 20,
    top: '50%',
    marginTop: -25,
    width: 50,
    height: 50,
    borderRadius: 25,
    backgroundColor: 'rgba(255, 255, 255, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
  },
  navButtonText: {
    color: '#fff',
    fontSize: 36,
    fontWeight: 'bold',
  },
  replyPreviewBubble: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
    padding: 8,
    borderRadius: 8,
    overflow: 'hidden',
    minWidth: 150,
  },
  replyPreviewBubbleMe: {
    backgroundColor: 'rgba(255, 255, 255, 0.15)',
  },
  replyPreviewBubbleThem: {
    backgroundColor: 'rgba(0, 0, 0, 0.05)',
  },
  replyPreviewBar: {
    width: 3,
    height: 40,
    borderRadius: 2,
    marginRight: 8,
  },
  replyPreviewBarMe: {
    backgroundColor: '#FFFFFF',
  },
  replyPreviewBarThem: {
    backgroundColor: '#0084FF',
  },
  replyPreviewContent: {
    flex: 1,
    minWidth: 0,
  },
  replyPreviewSenderName: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyPreviewSenderNameMe: {
    color: '#FFFFFF',
  },
  replyPreviewSenderNameThem: {
    color: '#0084FF',
  },
  replyPreviewText: {
    fontSize: 12,
    flexShrink: 1,
  },
  replyPreviewTextMe: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  replyPreviewTextThem: {
    color: '#666',
  },
  replyThumbnailBubble: {
    width: 36,
    height: 36,
    borderRadius: 4,
    marginRight: 8,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    position: 'relative',
  },
  replyThumbnailImage: {
    width: '100%',
    height: '100%',
  },
  replyVideoOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyIndicatorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    paddingHorizontal: 4,
    alignSelf: 'flex-end',
    gap: 4,
  },
  replyIndicatorIcon: {
    marginRight: 2,
  },
  replyIndicatorText: {
    fontSize: 13,
    color: '#9CA3AF',
    fontWeight: '400',
  },
  bubbleRelative: {
    position: 'relative',
  },
  reactionsContainer: {
    position: 'absolute',
    bottom: -20,
    right: -8,
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 2,
    zIndex: 10,
  },
  reactionItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    minWidth: 28,
    height: 28,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    borderWidth: 1.5,
    borderColor: '#E4E6EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  reactionEmoji: {
    fontSize: 16,
  },
  reactionItemWithCount: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
  },
  reactionEmojiCountBadge: {
    marginLeft: 4,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionEmojiCountText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#666',
  },
  reactionCountItem: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    minWidth: 28,
    height: 28,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 6,
    borderWidth: 1.5,
    borderColor: '#E4E6EB',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3,
    elevation: 3,
  },
  reactionCountText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#666',
  },
  reactionsModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  reactionsModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '80%',
    paddingBottom: 20,
  },
  reactionsModalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 20,
    paddingBottom: 16,
  },
  reactionsModalTitle: {
    fontSize: 20,
    fontWeight: '600',
    color: '#000',
  },
  reactionsModalCloseButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  reactionsModalCloseText: {
    fontSize: 24,
    color: '#666',
  },
  reactionsModalDivider: {
    height: 1,
    backgroundColor: '#E4E6EB',
    marginHorizontal: 20,
  },
  reactionsModalSummary: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    gap: 12,
  },
  reactionsModalSummaryText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#0084FF',
    textDecorationLine: 'underline',
  },
  reactionsModalSummaryEmoji: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  reactionsModalSummaryEmojiText: {
    fontSize: 24,
  },
  reactionsModalSummaryCount: {
    fontSize: 16,
    fontWeight: '600',
    color: '#000',
  },
  reactionsModalList: {
    paddingHorizontal: 20,
    maxHeight: 400,
  },
  reactionsModalEmojiGroup: {
    marginBottom: 8,
  },
  reactionsModalUserItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    gap: 12,
  },
  reactionsModalUserAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
  },
  reactionsModalUserInfo: {
    flex: 1,
  },
  reactionsModalUserName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#000',
    marginBottom: 2,
  },
  reactionsModalUserAction: {
    fontSize: 14,
    color: '#666',
  },
  reactionsModalUserEmoji: {
    fontSize: 24,
  },
  editedLabel: {
    fontSize: 12,
    color: '#B8B8B8', // Lighter gray for better visibility
    fontStyle: 'italic',
    marginTop: 4,
    alignSelf: 'flex-end',
    fontWeight: '500',
  },
  videoContainer: {
    width: 250,
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#000',
    position: 'relative',
    marginBottom: 4,
  },
  videoThumbnail: {
    width: '100%',
    height: '100%',
  },
  videoUploadOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  videoUploadProgressContainer: {
    width: '80%',
    height: 40,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 20,
    overflow: 'hidden',
    justifyContent: 'center',
    alignItems: 'center',
    position: 'relative',
  },
  videoUploadProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#539461',
    borderRadius: 20,
  },
  videoUploadProgressText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
    zIndex: 1,
  },
  videoPlayOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
  },
  videoPlayButton: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: 'rgba(83, 148, 97, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  videoPlayButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    marginLeft: 4,
    fontWeight: 'bold',
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 8,
    right: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  videoDurationText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
});

export default ChatBubble;
