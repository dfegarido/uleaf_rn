import React from 'react';
import {View, TextInput, StyleSheet, TouchableOpacity} from 'react-native';

const InputPasswordLeftIcon = ({
  IconLeftComponent,
  placeholder,
  value,
  onChangeText,
  secureTextEntry = true,
  rightIcon,
  onRightIconPress,
}) => {
  return (
    <View style={styles.inputContainer}>
      {IconLeftComponent && (
        <IconLeftComponent width={20} height={20} style={styles.icon} />
      )}
      <TextInput
        style={styles.input}
        placeholder={'Password'}
        placeholderTextColor="#888"
        secureTextEntry={secureTextEntry}
        value={value}
        onChangeText={onChangeText}
      />
      {rightIcon && (
        <TouchableOpacity onPress={onRightIconPress} style={styles.rightIcon}>
          {rightIcon}
        </TouchableOpacity>
      )}
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
