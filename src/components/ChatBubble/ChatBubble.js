import React, { useState } from 'react';
import { Image, StyleSheet, Text, View, TouchableOpacity, Modal, ActivityIndicator } from 'react-native';
import ListingMessage from '../../screens/ChatScreen/ListingMessage';

const DefaultAvatar = require('../../assets/images/AvatarBig.png');

const ChatBubble = ({ currentUserUid, isSeller=false, isBuyer=false, listingId, isListing = false, navigation, text, isMe, showAvatar, senderName, senderAvatarUrl, isGroupChat, isFirstInGroup, isLastInGroup, imageUrl, imageUrls, prevMessageHasStackedImages }) => {
  const [imageModalVisible, setImageModalVisible] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  
  // Determine which images to display
  const images = imageUrls && imageUrls.length > 0 ? imageUrls : (imageUrl ? [imageUrl] : []);
  // Show sender name for group chats, not from current user, only on first message of group
  const shouldShowSenderName = isGroupChat && !isMe && senderName && isFirstInGroup;
  
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
              images.length > 1 && { marginTop: 20, marginRight: 20 }
            ]}>
            {/* Render images */}
            {images.length > 0 && renderImageGrid()}
            
            {/* Render text only for text-only messages (no images) */}
            {!isListing && images.length === 0 && text && text.trim().length > 0 && (
              <Text style={[isMe ? styles.myText : styles.text]}>{text}</Text>
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
              </View>
            )}
            
            {/* Render listing message */}
            {isListing && (
              <ListingMessage currentUserUid={currentUserUid} isSeller={isSeller} isBuyer={isBuyer} listingId={listingId} navigation={navigation} />
            )}
          </View>
        </View>
      </View>

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
});

export default ChatBubble;
