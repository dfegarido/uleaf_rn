// CheckBoxGroup.js
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';

const CheckBoxGroup = ({
  options = [],
  selectedValues = [],
  onChange,
  containerStyle,
  optionStyle,
  boxStyle,
  checkStyle,
  labelStyle,
}) => {
  const toggleSelection = value => {
    if (selectedValues.includes(value)) {
      onChange(selectedValues.filter(v => v !== value));
    } else {
      onChange([...selectedValues, value]);
    }
  };

  return (
    <View style={[styles.container, containerStyle]}>
      {options.map(opt => (
        <TouchableOpacity
          key={opt.value}
          style={[styles.optionContainer, optionStyle]}
          onPress={() => toggleSelection(opt.value)}>
          <Text style={[styles.optionText, labelStyle]}>{opt.label}</Text>
          <View style={[styles.checkBox, boxStyle]}>
            {selectedValues.includes(opt.value) && (
              <View style={[styles.checked, checkStyle]} />
            )}
          </View>
        </TouchableOpacity>
      ))}
    </View>
  );
};

export default CheckBoxGroup;

const styles = StyleSheet.create({
  container: {
    flexDirection: 'column',
  },
  optionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkBox: {
    height: 20,
    width: 20,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checked: {
    width: 12,
    height: 12,
    backgroundColor: '#539461',
  },
  optionText: {
    fontSize: 16,
  },
});
