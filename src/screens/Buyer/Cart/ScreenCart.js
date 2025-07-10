import React from 'react';
import {View, Text, StyleSheet} from 'react-native';

const ScreenCart = () => {
  return (
    <>
      <View style={styles.stickyHeader}>
        <View style={styles.header}>
          <Text>Cart</Text>
        </View>
      </View>
    </>
  );
};

const styles = StyleSheet.create({
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
  },
  header: {
    backgroundColor: '#fff',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#e0e0e0',
  },
});
export default ScreenCart;
