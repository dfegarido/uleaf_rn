import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View, Text } from 'react-native';
import AttachIcon from '../../assets/iconchat/attach.svg';

const MessageInput = ({onSend}) => {
  const [message, setMessage] = useState('');

  const handleSend = () => {
    if (message.trim()) {
      onSend(message);
      setMessage('');
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          value={message}
          onChangeText={setMessage}
          onSubmitEditing={handleSend}
          returnKeyType="send"
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
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 16,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    paddingVertical: 8,
    color: '#000', // Force black text color
    fontSize: 16,
    minHeight: 40, // Ensure minimum height for better visibility
  },
  sendButton: {
    padding: 8,
    backgroundColor: '#5ca15c',
    borderRadius: 12,
    marginLeft: 8,
  },
  sendText: {
    color: '#fff',
    fontWeight: 'bold',
  }
});

export default MessageInput;