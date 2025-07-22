import React from 'react';
import {View, TextInput, Text, StyleSheet} from 'react-native';

const InputGroupAddon = ({
  addonText,
  position = 'left',
  value,
  onChangeText,
  placeholder,
  ...props
}) => {
  return (
    <View style={styles.wrapper}>
      {position === 'left' && (
        <View style={styles.addon}>
          <Text style={styles.addonText}>{addonText}</Text>
        </View>
      )}
      <TextInput
        style={styles.input}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor="#888"
        {...props}
      />
      {position === 'right' && (
        <View style={styles.addon}>
          <Text style={styles.addonText}>{addonText}</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    overflow: 'hidden',
  },
  addon: {
    paddingHorizontal: 10,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignSelf: 'stretch', // Fills full height of parent
  },
  addonText: {
    fontSize: 16,
    color: '#555',
  },
  input: {
    flex: 1,
    color: '#000',
    paddingHorizontal: 10,
    paddingVertical: 10,
    fontSize: 16,
  },
});

export default InputGroupAddon;
