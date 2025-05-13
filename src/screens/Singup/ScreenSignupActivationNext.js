import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';
import {InputBox} from '../../components/Input';

const ScreenSignupActivationCode = ({navigation}) => {
  const handlePressLogin = () => {
    navigation.navigate('LoginForm');
  };

  return (
    <View style={styles.mainContent}>
      <View style={styles.mainContainer}>
        <Text
          style={[
            globalStyles.textXXLPrimaryDark,
            {textAlign: 'center', fontWeight: 'bold'},
          ]}>
          Enter activation code
        </Text>
        <Text
          style={[
            globalStyles.textLGGreyDark,
            styles.subtTitle,
            {textAlign: 'center'},
          ]}>
          Enter the 9-digit that we have sent to your email
        </Text>
        <View style={{marginTop: 40, marginHorizontal: 10}}>
          <InputBox placeholder={'Enter your activation code'}></InputBox>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={globalStyles.primaryButton}
            onPress={handlePressLogin}>
            <Text style={globalStyles.primaryButtonText}>Continue</Text>
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

export default ScreenSignupActivationCode;
