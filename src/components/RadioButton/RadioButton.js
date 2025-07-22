// RadioButton.js
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

const RadioButton = ({
  options = [],
  selected,
  onSelect,
  containerStyle,
  optionStyle,
  radioOuterStyle,
  radioInnerStyle,
  labelStyle,
}) => {
  return (
    <View style={[styles.container, containerStyle]}>
      {options.map((opt, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.optionContainer, optionStyle]}
          onPress={() => onSelect(opt.value)}>
          <Text style={[styles.optionText, labelStyle]}>{opt.label}</Text>
          <View
            style={[
              styles.radioCircle,
              radioOuterStyle,
              {borderColor: selected === opt.value ? '#539461' : '#647276'},
            ]}>
            {selected === opt.value && (
              <View style={[styles.selectedRb, radioInnerStyle]} />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default RadioButton;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  radioCircle: {
    height: 20,
    width: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedRb: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#539461',
  },
  optionText: {
    color: '#393D40',
    fontSize: 16,
  },
});
