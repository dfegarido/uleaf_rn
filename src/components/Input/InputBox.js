import React, {useState} from 'react';
import {View, TextInput, StyleSheet} from 'react-native';

const InputBox = ({placeholder, value, setValue, isNumeric = false}) => {
  const [internalValue, setInternalValue] = useState('');

  const handleChangeText = text => {
    let newValue = text;

    if (isNumeric) {
      newValue = text.replace(/[^0-9]/g, ''); // allow digits only
    }

    if (typeof setValue === 'function') {
      setValue(newValue);
    } else {
      setInternalValue(newValue);
    }
  };

  const displayValue =
    value !== undefined && value !== null ? String(value) : internalValue;

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#888"
        keyboardType={isNumeric ? 'numeric' : 'default'}
        value={displayValue}
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
