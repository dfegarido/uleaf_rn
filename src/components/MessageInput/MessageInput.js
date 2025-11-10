import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Text } from 'react-native';
import AttachIcon from '../../assets/iconchat/attach.svg';

const MessageInput = ({onSend}) => {
  const [message, setMessage] = useState('');
  const [inputHeight, setInputHeight] = useState(40); // Initial height

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
      setInputHeight(40); // Reset height after sending
    }
  };

  const handleContentSizeChange = (event) => {
    const newHeight = Math.min(Math.max(40, event.nativeEvent.contentSize.height), 120); // Min 40px, Max 120px
    setInputHeight(newHeight);
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={[styles.input, { height: inputHeight }]}
          placeholder="Message..."
          value={message}
          onChangeText={setMessage}
          onContentSizeChange={handleContentSizeChange}
          multiline={true}
          textAlignVertical="top"
          returnKeyType="default"
          blurOnSubmit={false}
          placeholderTextColor="#999"
        />
        <TouchableOpacity
          onPress={handleSend}
          style={styles.sendButton}>
          <Text style={styles.sendText}>Send</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 8,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#ddd',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'flex-end', // Changed from 'center' to 'flex-end' for better alignment with multiline
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 8, // Added vertical padding for better spacing
    backgroundColor: '#fff',
    minHeight: 56, // Increased minimum height to accommodate send button
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    color: '#000',
    fontSize: 16,
    minHeight: 40,
    maxHeight: 120, // Maximum height before scrolling
    lineHeight: 20, // Better line spacing for readability
  },
  sendButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#5ca15c',
    borderRadius: 12,
    marginLeft: 8,
    alignSelf: 'flex-end', // Align to bottom for better visual balance
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 14,
  }
});

export default MessageInput;