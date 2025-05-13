import React, {useState} from 'react';
import {View, TextInput, StyleSheet} from 'react-native';

const InputBox = ({placeholder, value, setValue}) => {
  const [internalValue, setInternalValue] = useState('');

  const handleChangeText = text => {
    if (setValue) {
      setValue(text); // controlled input
    } else {
      setInternalValue(text); // uncontrolled input
    }
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#888"
        value={value !== undefined ? value : internalValue}
        onChangeText={handleChangeText}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 10,
    height: 48,
    backgroundColor: '#fff',
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
});

export default InputBox;
