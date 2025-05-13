import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';
import {InputBox} from '../../components/Input';

const ScreenSignup = ({navigation}) => {
  const handlePressNext = () => {
    navigation.navigate('ScreenSignupNext');
  };

  const handlePressGoToLogin = () => {
    navigation.navigate('LoginForm');
  };

  return (
    <View style={styles.mainContent}>
      <View style={styles.mainContainer}>
        <Text style={[globalStyles.title]}>Start your account</Text>
        <View style={{marginTop: 30}}>
          <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
            First name
          </Text>
          <InputBox placeholder={'Enter your first name'}></InputBox>
        </View>
        <View style={{marginTop: 20}}>
          <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
            Last name
          </Text>
          <InputBox placeholder={'Enter your last name'}></InputBox>
        </View>
        <View style={{marginTop: 20}}>
          <Text style={[globalStyles.textLGGreyDark, {paddingBottom: 10}]}>
            Email
          </Text>
          <InputBox placeholder={'Enter your email address'}></InputBox>
        </View>
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={globalStyles.primaryButton}
            onPress={handlePressNext}>
            <Text style={globalStyles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
          <View style={[styles.loginAccountContainer, {paddingTop: 10}]}>
            <TouchableOpacity onPress={handlePressGoToLogin}>
              <Text style={globalStyles.textLGAccent}>
                Login in to your existing account
              </Text>
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
