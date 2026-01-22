import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, TouchableOpacity, Modal, ActivityIndicator, ScrollView } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import ListingMessage from '../../screens/ChatScreen/ListingMessage';
import VideoPlayer from '../VideoPlayer/VideoPlayer';
import { formatDuration } from '../../utils/videoCompression';

const DefaultAvatar = require('../../assets/images/AvatarBig.png');

// Play Icon SVG Component
const PlayIcon = ({ width = 60, height = 60, color = '#FFFFFF' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M16.6582 9.28638C18.098 10.1862 18.8178 10.6361 19.0647 11.2122C19.2803 11.7152 19.2803 12.2847 19.0647 12.7878C18.8178 13.3638 18.098 13.8137 16.6582 14.7136L9.896 18.94C8.29805 19.9387 7.49907 20.4381 6.83973 20.385C6.26501 20.3388 5.73818 20.0469 5.3944 19.584C5 19.053 5 18.1108 5 16.2264V7.77357C5 5.88919 5 4.94701 5.3944 4.41598C5.73818 3.9531 6.26501 3.66111 6.83973 3.6149C7.49907 3.5619 8.29805 4.06126 9.896 5.05998L16.6582 9.28638Z"
      stroke={color}
      strokeWidth="2"
      strokeLinejoin="round"
      fill={color}
    />
  </Svg>
);

const ChatBubble = ({ currentUserUid, isSeller=false, isBuyer=false, listingId, isListing = false, navigation, text, isMe, showAvatar, senderName, senderAvatarUrl, isGroupChat, isFirstInGroup, isLastInGroup, imageUrl, imageUrls, videoUrl, thumbnailUrl, videoDuration, uploadProgress, prevMessageHasStackedImages, replyTo, onMessagePress, onMessageLongPress, onReplyPress, participantDataMap = {}, messages = [], messageId, reactions, isEdited = false, lastEditedAt = null, editHistory = [], onViewEditHistory }) => {
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
              <Svg width={14} height={14} viewBox="0 0 16 16" fill="#9CA3AF" style={styles.replyIndicatorIcon}>
                <Path
                  d="M6.497 1.035C7.593-.088 9.5.688 9.5 2.257V4.54c1.923.215 3.49 1.246 4.593 2.672C15.328 8.808 16 10.91 16 13v.305c0 .632-.465 1.017-.893 1.127-.422.11-.99.005-1.318-.493-.59-.894-1.2-1.482-1.951-1.859-.611-.307-1.359-.496-2.338-.558v2.23c0 1.57-1.908 2.346-3.003 1.222L.893 9.223a1.75 1.75 0 0 1 .001-2.444l5.603-5.744z"
                />
              </Svg>
              <Text style={styles.replyIndicatorText}>
                You replied to {originalMessageSenderName}
              </Text>
            </View>
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
              // Only apply bubble colors if it's a text-only message (has text and no images)
              images.length === 0 && text && text.trim().length > 0 && (isMe ? styles.myBubble : styles.theirBubble),
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
                <View style={styles.replyPreviewContent}>
                  {originalMessageText ? (
                    <Text style={[
                      styles.replyPreviewText,
                      isMe ? styles.replyPreviewTextMe : styles.replyPreviewTextThem
                    ]} numberOfLines={1}>
                      {originalMessageText}
                    </Text>
                  ) : originalMessageImages.length > 0 ? (
                    <Text style={[
                      styles.replyPreviewText,
                      isMe ? styles.replyPreviewTextMe : styles.replyPreviewTextThem
                    ]}>
                      {originalMessageImages.length > 1 ? `${originalMessageImages.length} photos` : 'Photo'}
                    </Text>
                  ) : null}
                </View>
              </TouchableOpacity>
            )}
            
            {/* Render video - show if we have thumbnail (optimistic) or videoUrl (uploaded) */}
            {!isListing && (thumbnailUrl || videoUrl) && (
              <TouchableOpacity
                onPress={() => {
                  if (videoUrl) {
                    setVideoPlayerVisible(true);
                  }
                }}
                activeOpacity={videoUrl ? 0.9 : 1}
                disabled={!videoUrl}
                style={styles.videoContainer}>
                <Image
                  source={{ uri: thumbnailUrl || videoUrl }}
                  style={styles.videoThumbnail}
                  resizeMode="cover"
                />
                {/* Upload progress indicator */}
                {uploadProgress !== undefined && uploadProgress < 100 && (
                  <View style={styles.videoUploadOverlay}>
                    <View style={styles.videoUploadProgressContainer}>
                      <View style={[styles.videoUploadProgressBar, { width: `${uploadProgress}%` }]} />
                      <Text style={styles.videoUploadProgressText}>{uploadProgress}%</Text>
                    </View>
                  </View>
                )}
                {/* Play button overlay - only show if video is uploaded */}
                {videoUrl && (
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

            {/* Render images */}
            {images.length > 0 && renderImageGrid()}
            
            {/* Render text only for text-only messages (no images or video) */}
            {!isListing && images.length === 0 && !videoUrl && text && text.trim().length > 0 && (
              <View>
                <Text style={[isMe ? styles.myText : styles.text]}>{text}</Text>
                {/* Edited indicator */}
                {isEdited && (
                  <TouchableOpacity 
                    onPress={() => {
                      console.log('📝 Edited label tapped:', { messageId, isEdited, editHistory });
                      onViewEditHistory && onViewEditHistory({ id: messageId, text, isEdited, lastEditedAt, editHistory });
                    }}
                    activeOpacity={0.7}>
                    <Text style={styles.editedLabel}>Edited</Text>
                  </TouchableOpacity>
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
                <Text style={[isMe ? styles.myText : styles.text, styles.imageCaption]}>{text}</Text>
                {/* Edited indicator */}
                {isEdited && (
                  <TouchableOpacity 
                    onPress={() => onViewEditHistory && onViewEditHistory({ id: messageId, text, isEdited, lastEditedAt, editHistory })}
                    activeOpacity={0.7}>
                    <Text style={styles.editedLabel}>Edited</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}

            {/* Render caption below video if there's text with video */}
            {!isListing && videoUrl && text && text.trim().length > 0 && (
              <View style={[
                styles.imageCaptionContainer,
                isMe ? styles.myBubble : styles.theirBubble,
              ]}>
                <Text style={[isMe ? styles.myText : styles.text, styles.imageCaption]}>{text}</Text>
                {/* Edited indicator */}
                {isEdited && (
                  <TouchableOpacity 
                    onPress={() => onViewEditHistory && onViewEditHistory({ id: messageId, text, isEdited, lastEditedAt, editHistory })}
                    activeOpacity={0.7}>
                    <Text style={styles.editedLabel}>Edited</Text>
                  </TouchableOpacity>
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
      {videoUrl && (
        <VideoPlayer
          videoUrl={videoUrl}
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
  },
  replyPreviewTextMe: {
    color: 'rgba(255, 255, 255, 0.8)',
  },
  replyPreviewTextThem: {
    color: '#666',
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
