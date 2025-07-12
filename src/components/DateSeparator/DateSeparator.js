import React from 'react';
import { StyleSheet, Text, View } from 'react-native';

const DateSeparator = ({text}) => {
  return (
    <View style={styles.container}>
      <Text style={styles.text}>{text}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    marginVertical: 8,
  },
  text: {
    fontSize: 12,
    color: '#666',
  },
});

export default DateSeparator;
