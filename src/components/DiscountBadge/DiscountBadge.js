import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const DiscountBadge = ({offPercentage}) => {
  return (
    <View style={styles.container}>
      {/* Left Notch */}
      {/* <View style={styles.notchLeft} /> */}

      {/* Tag Body */}
      <View style={styles.tag}>
        <Text style={styles.text}>{offPercentage}</Text>
      </View>

      {/* Right Notch */}
      <View style={styles.notchRight} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  tag: {
    backgroundColor: '#FF5E5E',
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 8,
  },
  text: {
    color: 'white',
    fontWeight: 'bold',
    marginRight: 5,
  },
  notchLeft: {
    width: 10,
    height: 20,
    backgroundColor: 'white',
    borderTopRightRadius: 10,
    borderBottomRightRadius: 10,
    marginRight: -5,
    zIndex: 1,
  },
  notchRight: {
    width: 10,
    height: 20,
    backgroundColor: 'white',
    borderTopLeftRadius: 10,
    borderBottomLeftRadius: 10,
    marginLeft: -5,
    zIndex: 1,
  },
});

export default DiscountBadge;
