// CheckBoxGroup.js
import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';

const CheckBoxGroup = ({
  options = [],
  selectedValues = [],
  onChange,
  containerStyle,
  optionStyle,
  boxStyle,
  checkStyle,
  labelStyle,
  checkboxPosition = 'left', // 'left' | 'right'
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
      {options.map((opt, index) => (
        <TouchableOpacity
          key={index}
          style={[styles.optionContainer, optionStyle]}
          onPress={() => toggleSelection(opt.value)}>
          {checkboxPosition === 'left' ? (
            <>
              <View style={[styles.checkBox, boxStyle]}>
                {selectedValues.includes(opt.value) && (
                  <View style={[styles.checked, checkStyle]}>
                    <View style={styles.checkmark}>
                      <View style={styles.checkmarkVector} />
                    </View>
                  </View>
                )}
              </View>
              <Text style={[globalStyles.textMDGreyDark, labelStyle]}>
                {opt.label}
              </Text>
            </>
          ) : (
            <>
              <Text style={[globalStyles.textMDGreyDark, {flex: 1}, labelStyle]}>
                {opt.label}
              </Text>
              <View style={[styles.checkBox, boxStyle]}>
                {selectedValues.includes(opt.value) && (
                  <View style={[styles.checked, checkStyle]}>
                    <View style={styles.checkmark}>
                      <View style={styles.checkmarkVector} />
                    </View>
                  </View>
                )}
              </View>
            </>
          )}
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
    width: 24,
    minWidth: 24,
    height: 24,
    minHeight: 24,
    borderWidth: 2,
    borderColor: '#444',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  checked: {
    width: 24,
    minWidth: 24,
    height: 24,
    minHeight: 24,
    backgroundColor: '#539461',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 0,
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
});
