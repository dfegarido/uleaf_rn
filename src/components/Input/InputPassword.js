import React, {useState} from 'react';
import {View, TextInput, TouchableOpacity, StyleSheet} from 'react-native';
import IconEyeOpen from '../../assets/icons/greydark/eye-regular.svg';
import IconEyeClose from '../../assets/icons/greydark/eye-closed-regular';

const InputPassword = ({placeholder}) => {
  const [secureText, setSecureText] = useState(true);

  const toggleSecure = () => {
    setSecureText(!secureText);
  };

  return (
    <View style={styles.inputContainer}>
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        secureTextEntry={secureText}
        placeholderTextColor="#aaa"
      />
      <TouchableOpacity onPress={toggleSecure} style={styles.iconLeft}>
        {secureText ? (
          <IconEyeOpen width={20} height={20}></IconEyeOpen>
        ) : (
          <IconEyeClose width={20} height={20}></IconEyeClose>
        )}
      </TouchableOpacity>
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
    paddingLeft: 10, // to make room for the icon on the left
    paddingRight: 10,
    height: 50,
    // margin: 10,
  },
  iconLeft: {
    position: 'absolute',
    right: 10,
    zIndex: 1,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});

export default InputPassword;
