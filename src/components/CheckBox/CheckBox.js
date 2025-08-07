import React from 'react';
import {TouchableOpacity, View, StyleSheet} from 'react-native';

const CheckBox = ({isChecked = false, onToggle, style}) => {
  return (
    <TouchableOpacity
      style={[styles.checkbox, style, isChecked && styles.checked]}
      onPress={onToggle}
      activeOpacity={0.7}>
      {isChecked && <View style={styles.checkmark} />}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  checkbox: {
    width: 24,
    height: 24,
    borderWidth: 1,
    borderColor: '#647276',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  checked: {
    backgroundColor: '#539461',
    borderColor: '#539461',
  },
  checkmark: {
    width: 12,
    height: 8,
    borderLeftWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{rotate: '-45deg'}],
    marginTop: -2,
  },
});

export default CheckBox;
