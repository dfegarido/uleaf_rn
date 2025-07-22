import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';
import {InputBox, InputPassword} from '../../components/Input';

const ScreenSignup = ({navigation}) => {
  const handlePressLogin = () => {
    navigation.navigate('ScreenSignupNext');
  };

  return (
    <View style={styles.mainContent}>
      <View style={styles.mainContainer}>
        <View style={{}}>
          <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
            Username
          </Text>
          <InputBox placeholder={'Enter your username'}></InputBox>
        </View>
        <View style={{marginTop: 20}}>
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
            onPress={handlePressLogin}>
            <Text style={globalStyles.primaryButtonText}>Submit</Text>
          </TouchableOpacity>
          <View style={[styles.loginAccountContainer, {marginTop: 10}]}>
            <Text style={{color: '#000', textAlign: 'center'}}>
              By clicking login, you agree to the ileafU's{' '}
            </Text>
            <TouchableOpacity>
              <Text style={{color: '#699E73'}}>Terms & Conditions</Text>
            </TouchableOpacity>
            <Text style={{color: '#000'}}> and </Text>
            <TouchableOpacity>
              <Text style={{color: '#699E73'}}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
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

export default ScreenSignup;
