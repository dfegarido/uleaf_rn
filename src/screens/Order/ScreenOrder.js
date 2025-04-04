import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
// import CustomHeader from '../../components/CustomHeader';

const ScreenOrder = () => {
  return (
    <View
      style={{
        flex: 1,
      }}>
      {/* <CustomHeader></CustomHeader> */}
      <View
        style={{
          flex: 1,
          justifyContent: 'center',
          alignItems: 'center',
        }}>
        <Text style={{color: '#202325'}}>Screen Order</Text>
      </View>
    </View>
  );
};

export default ScreenOrder;
