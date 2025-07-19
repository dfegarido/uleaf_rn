import React, {useState} from 'react';
import {View, TextInput, StyleSheet, TouchableOpacity} from 'react-native';
import EyeIcon from '../.../../../../assets/icons/greydark/eye-regular.svg';
import EyeClosedIcon from '../../../assets/icons/greydark/eye-closed-regular.svg';

const InputPasswordLeftIcon = ({
  IconLeftComponent,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = true,
  rightIcon,
  onRightIconPress,
}) => {
  const [showPassword, setShowPassword] = useState(false);
  return (
    <View style={styles.inputContainer}>
      {IconLeftComponent && (
        <IconLeftComponent width={20} height={20} style={styles.icon} />
      )}
      <TextInput
        style={styles.input}
        placeholder={placeholder || 'Password'}
        placeholderTextColor="#888"
        secureTextEntry={!showPassword}
        value={value}
        onChangeText={onChangeText}
      />
      <TouchableOpacity onPress={() => setShowPassword(v => !v)}>
        {showPassword ? (
          <EyeClosedIcon width={20} height={20} style={styles.icon} />
        ) : (
          <EyeIcon width={20} height={20} style={styles.icon} />
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
    paddingHorizontal: 10,
    // paddingVertical: 8,
    // marginVertical: 10,
    height: 48,
    backgroundColor: '#fff',
  },
  icon: {
    // marginRight: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#000',
  },
  rightIcon: {
    marginLeft: 8,
    padding: 4,
  },
});

export default InputPasswordLeftIcon;
