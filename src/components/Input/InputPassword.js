import React, {useState} from 'react';
import {View, TextInput, TouchableOpacity, StyleSheet} from 'react-native';
import IconEyeOpen from '../../assets/icons/greydark/eye-regular.svg';
import IconEyeClose from '../../assets/icons/greydark/eye-closed-regular.svg'; // make sure the .svg extension is added here

const InputPassword = ({placeholder, value, onChangeText}) => {
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
        value={value}
        onChangeText={onChangeText}
      />
      <TouchableOpacity onPress={toggleSecure} style={styles.iconRight}>
        {secureText ? (
          <IconEyeOpen width={20} height={20} />
        ) : (
          <IconEyeClose width={20} height={20} />
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
    paddingLeft: 10,
    paddingRight: 40, // room for icon
    height: 50,
    position: 'relative',
  },
  iconRight: {
    position: 'absolute',
    right: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#333',
  },
});

export default InputPassword;
