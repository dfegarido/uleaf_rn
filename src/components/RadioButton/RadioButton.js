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
  shape = 'circle', // 'circle' | 'square'
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
              styles.radioBase,
              radioOuterStyle,
              {
                borderColor: selected === opt.value ? '#539461' : '#647276',
                borderRadius: shape === 'square' ? 6 : 12,
                borderWidth: shape === 'square' && selected === opt.value ? 0 : 2,
              },
            ]}>
            {selected === opt.value && (
              shape === 'square' ? (
                <View style={[styles.selectedSquare, radioInnerStyle]}>
                  <View style={styles.checkmark}>
                    <View style={styles.checkmarkVector} />
                  </View>
                </View>
              ) : (
                <View
                  style={[
                    styles.selectedBase,
                    radioInnerStyle,
                    { borderRadius: 5 },
                  ]}
                />
              )
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
  radioBase: {
    width: 24,
    minWidth: 24,
    height: 24,
    minHeight: 24,
    borderWidth: 2,
    borderColor: '#444',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  selectedBase: {
    width: 10,
    height: 10,
    backgroundColor: '#539461',
  },
  selectedSquare: {
    width: 24,
    minWidth: 24,
    height: 24,
    minHeight: 24,
    backgroundColor: '#539461',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    position: 'absolute',
    width: 16,
    height: 16,
    left: '50%',
    top: '50%',
    marginLeft: -8,
    marginTop: -8,
  },
  checkmarkVector: {
    width: 6,
    height: 10,
    borderRightWidth: 2,
    borderBottomWidth: 2,
    borderColor: '#FFFFFF',
    transform: [{rotate: '45deg'}],
    marginLeft: 3,
    marginTop: 1,
  },
  optionText: {
    color: '#393D40',
    fontSize: 16,
  },
});
