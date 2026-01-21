import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Text, Alert, ActivityIndicator, Image, ScrollView } from 'react-native';
import { launchImageLibrary, launchCamera } from 'react-native-image-picker';
import ImageIcon from '../../assets/iconchat/image.svg';

const MessageInput = ({onSend, onSendImage, disabled = false}) => {
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

    // If we have both images and text, send them together
    if (hasImages && hasText && onSendImage) {
      onSendImage(previewImages, textToSend); // Send images with text
      setPreviewImages([]);
      setMessage('');
      setInputHeight(40);
    } 
    // If we only have images
    else if (hasImages && onSendImage) {
      onSendImage(previewImages); // Send images only
      setPreviewImages([]);
    }
    // If we only have text
    else if (hasText) {
      onSend(textToSend);
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

  return (
    <View style={styles.container}>
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