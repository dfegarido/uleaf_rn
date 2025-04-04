import React from 'react';
import {View, Text, StyleSheet} from 'react-native';
// import CustomHeader from '../../components/CustomHeader';

const ScreenHome = () => {
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
        <Text style={{color: '#202325'}}>Screen Home</Text>
      </View>
    </View>
  );
};

export default ScreenHome;
