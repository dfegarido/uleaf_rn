import React, { useState } from 'react';
import { StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import AttachIcon from '../../assets/iconchat/attach.svg';

const MessageInput = ({onSend}) => {
  const [message, setMessage] = useState('');

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        <TextInput
          style={styles.input}
          placeholder="Message..."
          value={message}
          onChangeText={setMessage}
          onSubmitEditing={() => {
            if (message.trim()) {
              onSend(message);
              setMessage('');
            }
          }}
          returnKeyType="send"
        />
        <TouchableOpacity
          onPress={() => {
            if (message.trim()) {
              onSend(message);
              setMessage('');
            }
          }}>
          <AttachIcon />
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
  },
});

export default MessageInput;