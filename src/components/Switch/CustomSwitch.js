import React from 'react';
import {View, Text, Switch, StyleSheet} from 'react-native';

const CustomSwitch = ({
  label = '',
  value = false,
  onValueChange = () => {},
  disabled = false,
  labelPosition = 'left', // 'left' or 'right'
  accentColor = '#549361', // default accent color
}) => {
  return (
    <View style={styles.container}>
      {labelPosition === 'left' && label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
      <Switch
        trackColor={{false: '#ccc', true: `${accentColor}80`}} // 50% opacity track
        thumbColor={value ? accentColor : '#f4f3f4'}
        ios_backgroundColor="#ccc"
        onValueChange={onValueChange}
        value={value}
        disabled={disabled}
      />
      {labelPosition === 'right' && label ? (
        <Text style={styles.label}>{label}</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontSize: 16,
    color: '#333',
  },
});

export default CustomSwitch;
