import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';
import {
  InputGroupLeftIcon,
  InputPasswordLeftIcon,
} from '../../components/InputGroup/Left';

import EmailIcon from '../../assets/icons/greydark/envelope-simple-regular.svg';
import PasswordIcon from '../../assets/icons/greydark/lock-key-regular.svg';

const ScreenLoginForm = ({navigation}) => {
  const handlePressLogin = () => {
    navigation.navigate('LoginOtp');
  };

  return (
    <View style={styles.mainContent}>
      <View style={styles.mainContainer}>
        <Text style={[globalStyles.title]}>Welcome back!</Text>
        <Text style={[globalStyles.textXXLGrayDark, styles.subtTitle]}>
          Log in to your account
        </Text>
        <View style={{paddingTop: 30}}>
          <InputGroupLeftIcon
            IconLeftComponent={EmailIcon}
            placeholder={'Email'}
          />
        </View>
        <View style={{paddingTop: 30}}>
          <InputPasswordLeftIcon IconLeftComponent={PasswordIcon} />
        </View>
        <View style={{paddingTop: 20}}>
          <Text style={[globalStyles.textLGAccent, {textAlign: 'right'}]}>
            Forgot password?
          </Text>
        </View>
        <View style={styles.buttonContainer}>
          <View style={styles.loginAccountContainer}>
            <Text style={{color: '#000', textAlign: 'center'}}>
              By clicking login, you agree to the I LEAF U's{' '}
            </Text>
            <TouchableOpacity>
              <Text style={{color: '#699E73'}}>Terms & Conditions</Text>
            </TouchableOpacity>
            <Text> and </Text>
            <TouchableOpacity>
              <Text style={{color: '#699E73'}}>Privacy Policy</Text>
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            style={globalStyles.primaryButton}
            onPress={handlePressLogin}>
            <Text style={globalStyles.primaryButtonText}>Login</Text>
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

export default ScreenLoginForm;
