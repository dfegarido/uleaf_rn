import React from 'react';
import {View, TextInput, StyleSheet} from 'react-native';

const InputGroupLeftIcon = ({
  IconLeftComponent,
  IconRightComponent,
  placeholder,
}) => {
  return (
    <View style={styles.inputContainer}>
      {IconLeftComponent && (
        <IconLeftComponent width={20} height={20} style={styles.icon} />
      )}
      <TextInput
        style={styles.input}
        placeholder={placeholder}
        placeholderTextColor="#888"
      />
      {IconRightComponent && (
        <IconRightComponent width={20} height={20} style={styles.icon} />
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
});

export default InputGroupLeftIcon;
