import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Text, Alert, ActivityIndicator, Image, ScrollView } from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import ImageIcon from '../../assets/iconchat/image.svg';

const MessageInput = ({onSend, onSendImage, disabled = false, replyingTo = null, onCancelReply = null, participantDataMap = {}}) => {
  const [message, setMessage] = useState('');
  const [inputHeight, setInputHeight] = useState(40); // Initial height
  const [previewImages, setPreviewImages] = useState([]); // Array of local URIs for preview
  
  // Show send button when there's text or image previews
  const hasText = message.trim().length > 0;
  const hasContent = hasText || previewImages.length > 0;

  const handleSend = () => {
    if (disabled) return;

    const textToSend = message.trim();
    const hasImages = previewImages.length > 0;
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
    } : null;

    // If we have both images and text, send them together
    if (hasImages && hasText && onSendImage) {
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
      onSend(textToSend, false, null, null, null, replyTo);
      setMessage('');
      setInputHeight(40);
    }
  };

  const handleRemovePreview = (index) => {
    setPreviewImages(prev => prev.filter((_, i) => i !== index));
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
    if (replyingTo.imageUrls && replyingTo.imageUrls.length > 0) {
      return replyingTo.imageUrls.length > 1 ? `${replyingTo.imageUrls.length} photos` : 'Photo';
    }
    if (replyingTo.imageUrl) {
      return 'Photo';
    }
    return '';
  };

  const replySenderName = replyingTo 
    ? (replyingTo.senderName || participantDataMap[replyingTo.senderId]?.name || 'Unknown')
    : '';

  return (
    <View style={styles.container}>
      {/* Reply Preview - Above input bar */}
      {replyingTo && (
        <View style={styles.replyPreviewContainer}>
          <View style={styles.replyPreviewContent}>
            <View style={styles.replyPreviewBar} />
            <View style={styles.replyPreviewTextContainer}>
              <Text style={styles.replyPreviewSenderName}>{replySenderName}</Text>
              <Text style={styles.replyPreviewText} numberOfLines={1}>{getReplyPreviewText()}</Text>
            </View>
            <TouchableOpacity onPress={onCancelReply} style={styles.replyCancelButton}>
              <Text style={styles.replyCancelText}>✕</Text>
            </TouchableOpacity>
          </View>
        </View>
      )}
      
      {/* Image Previews - Above input bar */}
      {previewImages.length > 0 && (
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
        {/* Gallery/Image Button - Left side */}
        <TouchableOpacity
          onPress={handleImagePicker}
          onLongPress={handleImagePickerLongPress}
          style={[styles.iconButton, disabled && styles.iconButtonDisabled]}
          disabled={disabled}>
          <ImageIcon width={28} height={28} color={disabled ? "#8E8E93" : "#0084FF"} />
        </TouchableOpacity>
        
        {/* Text Input - Center */}
        <View style={styles.inputContainer}>
          <TextInput
            style={[styles.input, { height: inputHeight }, disabled && styles.inputDisabled]}
            placeholder={disabled ? "Join the group to send messages..." : "Aa"}
            value={message}
            onChangeText={setMessage}
            onContentSizeChange={handleContentSizeChange}
            multiline={true}
            textAlignVertical="center"
            returnKeyType="default"
            blurOnSubmit={false}
            placeholderTextColor="#8E8E93"
            editable={!disabled}
          />
        </View>
        
        {/* Send Button - Right side (always visible) */}
        <TouchableOpacity
          onPress={handleSend}
          style={[styles.sendButton, (disabled || !hasContent) && styles.sendButtonDisabled]}
          disabled={disabled || !hasContent}>
          <View style={styles.sendButtonCircle}>
            <Text style={styles.sendIcon}>➤</Text>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#F0F2F5',
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
    borderLeftColor: '#0084FF',
  },
  replyPreviewBar: {
    width: 3,
    height: 40,
    backgroundColor: '#0084FF',
    borderRadius: 2,
    marginRight: 8,
  },
  replyPreviewTextContainer: {
    flex: 1,
  },
  replyPreviewSenderName: {
    fontSize: 13,
    fontWeight: '600',
    color: '#0084FF',
    marginBottom: 2,
  },
  replyPreviewText: {
    fontSize: 12,
    color: '#666',
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
    backgroundColor: '#0084FF',
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
});

export default MessageInput;