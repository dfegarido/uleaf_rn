import React, { useState, useRef } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Text, Alert, ActivityIndicator, Image, ScrollView, Keyboard } from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import { validateVideo, formatDuration } from '../../utils/videoCompression';
import Svg, { Path, G } from 'react-native-svg';
import UserMentionPicker from './UserMentionPicker';

// Image Icon SVG Component
const ImageIcon = ({ width = 24, height = 24, color = '#080341' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path 
      fillRule="evenodd" 
      clipRule="evenodd" 
      d="M3.75 3.75H19.5L20.25 4.5V20.25H4.5L3.75 19.5V3.75ZM5.25 5.25V12.9166L7.90909 10.2575L13.3636 15.7121L16.7727 12.303L18.75 14.2802V5.25H5.25ZM18.75 16.4016L16.7727 14.4243L13.3636 17.8334L7.90909 12.3788L5.25 15.0379V18.75H18.75V16.4016ZM14.7273 7.97727C14.0118 7.97727 13.4318 8.55727 13.4318 9.27273C13.4318 9.98819 14.0118 10.5682 14.7273 10.5682C15.4427 10.5682 16.0227 9.98819 16.0227 9.27273C16.0227 8.55727 15.4427 7.97727 14.7273 7.97727ZM11.9318 9.27273C11.9318 7.72884 13.1834 6.47727 14.7273 6.47727C16.2712 6.47727 17.5227 7.72884 17.5227 9.27273C17.5227 10.8166 16.2712 12.0682 14.7273 12.0682C13.1834 12.0682 11.9318 10.8166 11.9318 9.27273Z" 
      fill={color}
    />
  </Svg>
);

// Video Icon SVG Component
const VideoIcon = ({ width = 24, height = 24, color = '#000000' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path 
      d="M16 10L18.5768 8.45392C19.3699 7.97803 19.7665 7.74009 20.0928 7.77051C20.3773 7.79703 20.6369 7.944 20.806 8.17433C21 8.43848 21 8.90095 21 9.8259V14.1741C21 15.099 21 15.5615 20.806 15.8257C20.6369 16.056 20.3773 16.203 20.0928 16.2295C19.7665 16.2599 19.3699 16.022 18.5768 15.5461L16 14M6.2 18H12.8C13.9201 18 14.4802 18 14.908 17.782C15.2843 17.5903 15.5903 17.2843 15.782 16.908C16 16.4802 16 15.9201 16 14.8V9.2C16 8.0799 16 7.51984 15.782 7.09202C15.5903 6.71569 15.2843 6.40973 14.908 6.21799C14.4802 6 13.9201 6 12.8 6H6.2C5.0799 6 4.51984 6 4.09202 6.21799C3.71569 6.40973 3.40973 6.71569 3.21799 7.09202C3 7.51984 3 8.07989 3 9.2V14.8C3 15.9201 3 16.4802 3.21799 16.908C3.40973 17.2843 3.71569 17.5903 4.09202 17.782C4.51984 18 5.07989 18 6.2 18Z" 
      stroke={color} 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    />
  </Svg>
);

const MessageInput = ({onSend, onSendImage, onSendVideo, disabled = false, replyingTo = null, onCancelReply = null, participantDataMap = {}, editingMessage = null, onCancelEdit = null, onSaveEdit = null, currentUserUid = null, chatType = 'private'}) => {
  const [message, setMessage] = useState('');
  const [inputHeight, setInputHeight] = useState(40); // Initial height
  const [previewImages, setPreviewImages] = useState([]); // Array of local URIs for preview
  const [previewVideo, setPreviewVideo] = useState(null); // Video preview data: { uri, thumbnail, duration }
  const [uploadingVideo, setUploadingVideo] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
  // Mention functionality
  const [showMentionPicker, setShowMentionPicker] = useState(false);
  const [mentionSearchQuery, setMentionSearchQuery] = useState('');
  const [cursorPosition, setCursorPosition] = useState(0);
  const [mentionStartPosition, setMentionStartPosition] = useState(0);
  const [mentions, setMentions] = useState([]); // Array of {uid, name, username}
  const textInputRef = useRef(null);

  // Sync message state with editingMessage
  React.useEffect(() => {
    if (editingMessage) {
      setMessage(editingMessage.text || '');
    }
  }, [editingMessage]);
  
  // Detect @ mentions
  const handleTextChange = (text) => {
    setMessage(text);
    
    // Only process mentions in group chats
    if (chatType !== 'group') {
      return;
    }
    
    // Find @ symbol before cursor
    const textBeforeCursor = text.substring(0, cursorPosition);
    const lastAtIndex = textBeforeCursor.lastIndexOf('@');
    
    if (lastAtIndex >= 0) {
      // Check if there's a space or newline before @ (or it's at the start)
      const charBeforeAt = lastAtIndex > 0 ? text[lastAtIndex - 1] : ' ';
      const isValidMentionStart = charBeforeAt === ' ' || charBeforeAt === '\n' || lastAtIndex === 0;
      
      if (isValidMentionStart) {
        const searchText = textBeforeCursor.substring(lastAtIndex + 1);
        
        // Only show picker if search text doesn't contain space or newline
        if (!searchText.includes(' ') && !searchText.includes('\n')) {
          setMentionSearchQuery(searchText);
          setMentionStartPosition(lastAtIndex);
          setShowMentionPicker(true);
          return;
        }
      }
    }
    
    // Hide mention picker if no valid mention detected
    setShowMentionPicker(false);
  };
  
  // Handle mention selection
  const handleSelectMention = (user) => {
    const mentionText = `@${user.username || user.name}`;
    const textBeforeMention = message.substring(0, mentionStartPosition);
    const textAfterCursor = message.substring(cursorPosition);
    const newMessage = textBeforeMention + mentionText + ' ' + textAfterCursor;
    
    setMessage(newMessage);
    setShowMentionPicker(false);
    setMentionSearchQuery('');
    
    // Add to mentions array
    const newMention = {
      uid: user.uid,
      name: user.name,
      username: user.username || user.name,
    };
    
    if (!mentions.find(m => m.uid === user.uid)) {
      setMentions(prev => [...prev, newMention]);
    }
    
    // Set cursor position after mention
    const newCursorPos = textBeforeMention.length + mentionText.length + 1;
    setCursorPosition(newCursorPos);
    
    // Focus back on input
    if (textInputRef.current) {
      textInputRef.current.focus();
    }
  };
  
  // Get group members for mention picker
  const getGroupMembers = () => {
    if (chatType !== 'group') return [];
    
    return Object.keys(participantDataMap)
      .map(uid => ({
        uid,
        name: participantDataMap[uid]?.name || 'Unknown',
        username: participantDataMap[uid]?.username || participantDataMap[uid]?.name,
        avatarUrl: participantDataMap[uid]?.avatarUrl || null,
      }))
      .filter(user => user.uid !== currentUserUid); // Don't show current user
  };
  
  // Show send button when there's text, image, or video previews
  const hasText = message.trim().length > 0;
  const hasContent = hasText || previewImages.length > 0 || previewVideo !== null;

  const handleSend = () => {
    if (disabled) return;

    // If editing mode, save the edit
    if (editingMessage) {
      const textToSend = message.trim();
      if (!textToSend) {
        Alert.alert('Error', 'Message cannot be empty');
        return;
      }
      if (onSaveEdit) {
        onSaveEdit(textToSend);
        setMessage('');
        setInputHeight(40);
      }
      return;
    }

    const textToSend = message.trim();
    const hasImages = previewImages.length > 0;
    const hasVideo = previewVideo !== null;
    const hasText = textToSend.length > 0;

    // Get reply info if replying - ensure no undefined values
    // If senderName is missing, try to get it from participantDataMap
    const getSenderName = () => {
      if (replyingTo?.senderName) {
        return replyingTo.senderName;
      }
      if (replyingTo?.senderId && participantDataMap[replyingTo.senderId]?.name) {
        return participantDataMap[replyingTo.senderId].name;
      }
      return 'Unknown';
    };
    
    const replyTo = replyingTo ? {
      messageId: replyingTo.id || null,
      senderId: replyingTo.senderId || null,
      senderName: getSenderName(),
      text: replyingTo.text || null,
      imageUrl: replyingTo.imageUrl || null,
      imageUrls: replyingTo.imageUrls || null,
      videoUrl: replyingTo.videoUrl || null,
      thumbnailUrl: replyingTo.thumbnailUrl || null,
    } : null;

    // If we have video (priority over images)
    if (hasVideo && onSendVideo) {
      onSendVideo(previewVideo, textToSend, replyTo);
      setPreviewVideo(null);
      setMessage('');
      setInputHeight(40);
      setUploadProgress(0);
    }
    // If we have both images and text, send them together
    else if (hasImages && hasText && onSendImage) {
      onSendImage(previewImages, textToSend, replyTo); // Send images with text and reply
      setPreviewImages([]);
      setMessage('');
      setInputHeight(40);
    } 
    // If we only have images
    else if (hasImages && onSendImage) {
      onSendImage(previewImages, '', replyTo); // Send images with reply
      setPreviewImages([]);
    }
    // If we only have text
    else if (hasText) {
      // Include mentions in the message
      onSend(textToSend, false, null, null, null, replyTo, mentions.length > 0 ? mentions : null);
      setMessage('');
      setInputHeight(40);
      setMentions([]); // Clear mentions after sending
    }
  };

  const handleRemovePreview = (index) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
  };

  const handleRemoveVideoPreview = () => {
    setPreviewVideo(null);
    setUploadProgress(0);
  };

  const handleImagePicker = () => {
    if (disabled) return;

    // Directly open photo library (like messenger)
    openImageLibrary();
  };

  const handleImagePickerLongPress = () => {
    if (disabled) return;

    // Long press opens camera option
    Alert.alert(
      'Select Image',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: () => openCamera(),
        },
        {
          text: 'Photo Library',
          onPress: () => openImageLibrary(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const openImageLibrary = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
      includeBase64: false,
      selectionLimit: 10, // Allow multiple images (up to 10)
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Error', `Image picker error: ${response.errorMessage}`);
        return;
      }

      if (response.assets && response.assets.length > 0) {
        // Add all selected images to preview
        const newImageUris = response.assets
          .map(asset => asset.uri)
          .filter(Boolean);
        
        if (newImageUris.length > 0) {
          setPreviewImages(prev => [...prev, ...newImageUris]);
        }
      }
    });
  };

  const openCamera = () => {
    const options = {
      mediaType: 'photo',
      quality: 0.8,
      maxWidth: 1920,
      maxHeight: 1920,
      includeBase64: false,
      saveToPhotos: true,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Error', `Camera error: ${response.errorMessage}`);
        return;
      }

      if (response.assets && response.assets[0]) {
        const imageUri = response.assets[0].uri;
        if (imageUri) {
          // Add to preview images
          setPreviewImages(prev => [...prev, imageUri]);
        }
      }
    });
  };

  const handleVideoPicker = () => {
    if (disabled || editingMessage) return;

    // On simulator, skip camera option and go directly to library
    // You can detect simulator with: Platform.OS === 'ios' && !Platform.isPad && Platform.constants.interfaceIdiom === 'phone'
    // But for simplicity, let's always show both options
    Alert.alert(
      'Select Video',
      'Choose an option',
      [
        {
          text: 'Camera',
          onPress: () => openVideoCamera(),
        },
        {
          text: 'Video Library',
          onPress: () => openVideoLibrary(),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  };

  const openVideoLibrary = () => {
    const options = {
      mediaType: 'video',
      quality: 0.8,
      videoQuality: 'medium',
      durationLimit: 300, // 5 minutes max
      includeBase64: false,
    };

    launchImageLibrary(options, (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        Alert.alert('Error', `Error selecting video: ${response.errorMessage}`);
        return;
      }

      if (response.assets && response.assets[0]) {
        const video = response.assets[0];
        
        // Validate video
        if (!validateVideo(video)) {
          return;
        }

        // Set video preview
        setPreviewVideo({
          uri: video.uri,
          thumbnail: video.uri, // Will be replaced with actual thumbnail
          duration: video.duration || 0,
          fileSize: video.fileSize || 0,
          fileName: video.fileName || 'video.mp4',
        });

        // Clear images if any
        setPreviewImages([]);
      }
    });
  };

  const openVideoCamera = () => {
    const options = {
      mediaType: 'video',
      quality: 0.8,
      videoQuality: 'medium',
      durationLimit: 300, // 5 minutes max
      saveToPhotos: true,
      includeBase64: false,
    };

    launchCamera(options, (response) => {
      if (response.didCancel) {
        return;
      }

      if (response.errorCode) {
        // Better error message for simulator
        const errorMsg = response.errorCode === 'camera_unavailable' 
          ? 'Camera is not available on simulator. Please use "Video Library" or test on a real device.'
          : `Camera error: ${response.errorMessage}`;
        Alert.alert('Camera Error', errorMsg);
        return;
      }

      if (response.assets && response.assets[0]) {
        const video = response.assets[0];
        
        // Validate video
        if (!validateVideo(video)) {
          return;
        }

        // Set video preview
        setPreviewVideo({
          uri: video.uri,
          thumbnail: video.uri, // Will be replaced with actual thumbnail
          duration: video.duration || 0,
          fileSize: video.fileSize || 0,
          fileName: video.fileName || 'video.mp4',
        });

        // Clear images if any
        setPreviewImages([]);
      }
    });
  };

  const handleContentSizeChange = (event) => {
    const newHeight = Math.min(Math.max(40, event.nativeEvent.contentSize.height), 120); // Min 40px, Max 120px
    setInputHeight(newHeight);
  };

  // Get reply preview text
  const getReplyPreviewText = () => {
    if (!replyingTo) return '';
    if (replyingTo.text) {
      return replyingTo.text.length > 50 ? replyingTo.text.substring(0, 50) + '...' : replyingTo.text;
    }
    if (replyingTo.videoUrl) {
      return 'Video';
    }
    if (replyingTo.imageUrls && replyingTo.imageUrls.length > 0) {
      return replyingTo.imageUrls.length > 1 ? `${replyingTo.imageUrls.length} photos` : 'Photo';
    }
    if (replyingTo.imageUrl) {
      return 'Photo';
    }
    return '';
  };

  // Get media thumbnail for reply preview
  const getReplyMediaThumbnail = () => {
    if (!replyingTo) return null;
    
    // Video thumbnail
    if (replyingTo.videoUrl || replyingTo.thumbnailUrl) {
      return replyingTo.thumbnailUrl || replyingTo.videoUrl;
    }
    
    // Image thumbnail
    if (replyingTo.imageUrls && replyingTo.imageUrls.length > 0) {
      return replyingTo.imageUrls[0];
    }
    if (replyingTo.imageUrl) {
      return replyingTo.imageUrl;
    }
    
    return null;
  };

  const replySenderName = replyingTo 
    ? (replyingTo.senderName || participantDataMap[replyingTo.senderId]?.name || 'Unknown')
    : '';
  
  const replyMediaThumbnail = getReplyMediaThumbnail();
  const hasVideo = replyingTo?.videoUrl;

  return (
    <View style={styles.container}>
      {/* Edit Mode Indicator - Above input bar */}
      {editingMessage && (
        <View style={styles.editModeContainer}>
          <View style={styles.editModeContent}>
            <Text style={styles.editModeIcon}>✏️</Text>
            <Text style={styles.editModeText}>Editing message</Text>
            <TouchableOpacity onPress={onCancelEdit} style={styles.editCancelButton}>
              <Text style={styles.editCancelText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}

      {/* Reply Preview - Above input bar (hidden during edit mode) */}
      {replyingTo && !editingMessage && (
        <View style={styles.replyPreviewContainer}>
          <View style={styles.replyPreviewContent}>
            <View style={styles.replyPreviewBar} />
            
            {/* Thumbnail for images/videos */}
            {replyMediaThumbnail && (
              <View style={styles.replyThumbnailContainer}>
                <Image 
                  source={{ uri: replyMediaThumbnail }} 
                  style={styles.replyThumbnail}
                  resizeMode="cover"
                />
                {/* Video play icon overlay */}
                {hasVideo && (
                  <View style={styles.replyVideoIconOverlay}>
                    <VideoIcon width={16} height={16} color="#FFFFFF" />
                  </View>
                )}
              </View>
            )}
            
            <View style={styles.replyPreviewTextContainer}>
              <Text style={styles.replyPreviewSenderName}>
                Replying to {replySenderName}
              </Text>
              <View style={styles.replyPreviewMessageRow}>
                {/* Show icon for media without text */}
                {!replyingTo.text && replyMediaThumbnail && (
                  hasVideo ? (
                    <VideoIcon width={14} height={14} color="#666" />
                  ) : (
                    <ImageIcon width={14} height={14} color="#666" />
                  )
                )}
                <Text style={styles.replyPreviewText} numberOfLines={1}>
                  {getReplyPreviewText()}
                </Text>
              </View>
            </View>
            
            <TouchableOpacity onPress={onCancelReply} style={styles.replyCancelButton}>
              <Text style={styles.replyCancelText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Video Preview - Above input bar (hidden during edit mode) */}
      {previewVideo && !editingMessage && (
        <View style={styles.videoPreviewContainer}>
          <View style={styles.videoPreviewItem}>
            <View style={styles.videoThumbnailContainer}>
              <View style={styles.videoPlayIcon}>
                <Text style={styles.videoPlayIconText}>▶</Text>
              </View>
              {previewVideo.duration > 0 && (
                <View style={styles.videoDurationBadge}>
                  <Text style={styles.videoDurationText}>{formatDuration(previewVideo.duration)}</Text>
                </View>
              )}
            </View>
            <View style={styles.videoInfo}>
              <Text style={styles.videoFileName} numberOfLines={1}>{previewVideo.fileName}</Text>
              <Text style={styles.videoFileSize}>
                {(previewVideo.fileSize / 1024 / 1024).toFixed(2)} MB
              </Text>
            </View>
            <TouchableOpacity
              onPress={handleRemoveVideoPreview}
              style={styles.removeVideoButton}>
              <Text style={styles.removeVideoText}>✕</Text>
            </TouchableOpacity>
          </View>
          {uploadingVideo && (
            <View style={styles.uploadProgressContainer}>
              <View style={[styles.uploadProgressBar, { width: `${uploadProgress}%` }]} />
              <Text style={styles.uploadProgressText}>{uploadProgress}%</Text>
            </View>
          )}
        </View>
      )}

      {/* Image Previews - Above input bar (hidden during edit mode and when video is selected) */}
      {previewImages.length > 0 && !editingMessage && !previewVideo && (
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.previewScrollView}
          contentContainerStyle={styles.previewScrollContent}>
          {previewImages.map((imageUri, index) => (
            <View key={index} style={styles.previewItem}>
              <Image 
                source={{ uri: imageUri }} 
                style={styles.previewImage} 
                resizeMode="cover" 
              />
              <TouchableOpacity
                onPress={() => handleRemovePreview(index)}
                style={styles.removePreviewButton}>
                <View style={styles.removePreviewIcon}>
                  <Text style={styles.removePreviewText}>✕</Text>
                </View>
              </TouchableOpacity>
            </View>
          ))}
        </ScrollView>
      )}
      
      <View style={styles.inputRow}>
        {/* Gallery/Image Button - Left side (hidden during edit mode) */}
        {!editingMessage && !previewVideo && (
          <TouchableOpacity
            onPress={handleImagePicker}
            onLongPress={handleImagePickerLongPress}
            style={[styles.iconButton, disabled && styles.iconButtonDisabled]}
            disabled={disabled}>
            <ImageIcon width={28} height={28} color={disabled ? "#8E8E93" : "#539461"} />
          </TouchableOpacity>
        )}

        {/* Video Button - Left side (hidden during edit mode and when images are selected) */}
        {!editingMessage && previewImages.length === 0 && (
          <TouchableOpacity
            onPress={handleVideoPicker}
            style={[styles.iconButton, disabled && styles.iconButtonDisabled]}
            disabled={disabled}>
            <VideoIcon width={28} height={28} color={disabled ? "#8E8E93" : "#539461"} />
          </TouchableOpacity>
        )}

        {/* Text Input - Center */}
        <View style={styles.inputContainer}>
          <TextInput
            ref={textInputRef}
            style={[styles.input, { height: inputHeight }, disabled && styles.inputDisabled]}
            placeholder={disabled ? "Join the group to send messages..." : "Aa"}
            value={message}
            onChangeText={handleTextChange}
            onSelectionChange={(event) => {
              setCursorPosition(event.nativeEvent.selection.start);
            }}
            onContentSizeChange={handleContentSizeChange}
            multiline={true}
            textAlignVertical="center"
            returnKeyType="default"
            blurOnSubmit={false}
            placeholderTextColor="#8E8E93"
            editable={!disabled}
          />
        </View>
        
        {/* Save/Send Button - Right side (always visible) */}
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendButton, (disabled || !hasContent) && styles.sendButtonDisabled]}
          disabled={disabled || !hasContent}>
          <View style={[styles.sendButtonCircle, editingMessage && styles.editSaveButton]}>
            <Text style={styles.sendIcon}>{editingMessage ? '✓' : '➤'}</Text>
          </View>
        </TouchableOpacity>
      </View>
      
      {/* User Mention Picker - Shows when typing @ in group chats */}
      {chatType === 'group' && (
        <UserMentionPicker
          visible={showMentionPicker}
          users={getGroupMembers()}
          onSelectUser={handleSelectMention}
          searchQuery={mentionSearchQuery}
          currentUserUid={currentUserUid}
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 0.5,
    borderTopColor: '#E4E6EB',
  },
  replyPreviewContainer: {
    marginBottom: 8,
    marginHorizontal: 4,
  },
  replyPreviewContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#539461', // Theme green color
  },
  replyPreviewBar: {
    width: 3,
    height: 40,
    backgroundColor: '#539461', // Theme green color
    borderRadius: 2,
    marginRight: 8,
  },
  replyPreviewTextContainer: {
    flex: 1,
  },
  replyPreviewSenderName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#539461', // Theme green color
    marginBottom: 4,
  },
  replyPreviewMessageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  replyPreviewText: {
    fontSize: 13,
    color: '#333',
    flex: 1,
  },
  replyThumbnailContainer: {
    width: 40,
    height: 40,
    borderRadius: 6,
    marginRight: 10,
    overflow: 'hidden',
    backgroundColor: '#F0F0F0',
    position: 'relative',
  },
  replyThumbnail: {
    width: '100%',
    height: '100%',
  },
  replyVideoIconOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  replyCancelButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  replyCancelText: {
    fontSize: 16,
    color: '#666',
    fontWeight: 'bold',
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  iconButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 20,
  },
  iconButtonDisabled: {
    opacity: 0.4,
  },
  previewScrollView: {
    marginBottom: 8,
    maxHeight: 80,
  },
  previewScrollContent: {
    paddingHorizontal: 12,
    gap: 8,
  },
  previewItem: {
    position: 'relative',
    width: 70,
    height: 70,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#E4E6EB',
    borderWidth: 1,
    borderColor: '#E4E6EB',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  removePreviewButton: {
    position: 'absolute',
    top: -6,
    right: -6,
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1.5,
    borderColor: '#FFFFFF',
    zIndex: 10,
  },
  removePreviewIcon: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  removePreviewText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
    lineHeight: 14,
  },
  inputContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    minHeight: 40,
    maxHeight: 100,
    justifyContent: 'center',
    borderWidth: 0.5,
    borderColor: '#E4E6EB',
  },
  input: {
    flex: 1,
    color: '#050505',
    fontSize: 15,
    minHeight: 24,
    maxHeight: 84,
    lineHeight: 20,
    padding: 0,
  },
  inputDisabled: {
    color: '#8E8E93',
  },
  sendButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendButtonCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#539461', // Theme green color (same as chat bubble)
    justifyContent: 'center',
    alignItems: 'center',
  },
  sendIcon: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '600',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  editModeContainer: {
    marginBottom: 8,
    marginHorizontal: 4,
  },
  editModeContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF3CD',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#FFC107',
  },
  editModeIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  editModeText: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#856404',
  },
  editCancelButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  editCancelText: {
    fontSize: 13,
    color: '#856404',
    fontWeight: '600',
  },
  editSaveButton: {
    backgroundColor: '#28A745', // Green for save/checkmark
  },
  videoPreviewContainer: {
    marginBottom: 8,
    marginHorizontal: 4,
  },
  videoPreviewItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E4E6EB',
  },
  videoThumbnailContainer: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#000',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    position: 'relative',
  },
  videoPlayIcon: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: 'rgba(83, 148, 97, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  videoPlayIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    marginLeft: 2,
  },
  videoDurationBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  videoDurationText: {
    color: '#FFFFFF',
    fontSize: 10,
    fontWeight: '600',
  },
  videoInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  videoFileName: {
    fontSize: 14,
    fontWeight: '500',
    color: '#050505',
    marginBottom: 4,
  },
  videoFileSize: {
    fontSize: 12,
    color: '#666',
  },
  removeVideoButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#FF3B30',
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 8,
  },
  removeVideoText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
  },
  uploadProgressContainer: {
    marginTop: 8,
    height: 24,
    backgroundColor: '#F0F2F5',
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
  },
  uploadProgressBar: {
    position: 'absolute',
    left: 0,
    top: 0,
    bottom: 0,
    backgroundColor: '#539461',
    borderRadius: 12,
  },
  uploadProgressText: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    textAlign: 'center',
    lineHeight: 24,
    color: '#050505',
    fontSize: 12,
    fontWeight: '600',
  },
});

export default MessageInput;