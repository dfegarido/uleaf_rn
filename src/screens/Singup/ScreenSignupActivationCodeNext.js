import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';
import {InputPassword} from '../../components/Input';

const ScreenSignupActivationCodeNext = ({navigation}) => {
  const handlePressSubmit = () => {
    navigation.navigate('MainTabs');
  };

  return (
    <View style={styles.mainContent}>
      <View style={styles.mainContainer}>
        <View style={{}}>
          <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
            Password
          </Text>
          <InputPassword placeholder={'Enter your password'}></InputPassword>
        </View>
        <View style={{marginTop: 20}}>
          <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
            Re-type password
          </Text>
          <InputPassword placeholder={'Re-type your password'}></InputPassword>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={globalStyles.primaryButton}
            onPress={handlePressSubmit}>
            <Text style={globalStyles.primaryButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#fff',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    margin: 20,
  },
  subtTitle: {
    paddingTop: 10,
  },
  buttonContainer: {
    flex: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: 30,
    marginHorizontal: 10,
  },
  loginAccountContainer: {
    flex: 1,
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    alignItems: 'center',
    paddingBottom: 10,
  },
});

export default ScreenSignupActivationCodeNext;
