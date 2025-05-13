import React, {useState} from 'react';
import {View, TextInput, StyleSheet} from 'react-native';

const InputTextArea = ({text, setText, lines, height}) => {
  return (
    <View style={styles.container}>
      <TextInput
        style={[
          styles.textArea,
          {
            height: height,
          },
        ]}
        multiline={true}
        numberOfLines={lines}
        value={text}
        onChangeText={setText}
        placeholder="Type your message here..."
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // paddingVertical: 16,
  },
  textArea: {
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    padding: 10,
    textAlignVertical: 'top', // makes text start from the top-left corner
  },
});

export default InputTextArea;
