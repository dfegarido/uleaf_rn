import React from 'react';
import {
  View,
  Text,
  StatusBar,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {useFocusEffect} from '@react-navigation/native';
import {globalStyles} from '../../assets/styles/styles';

const ScreenLogin = ({navigation}) => {
  // useFocusEffect(
  //   React.useCallback(() => {
  //     changeNavigationBarColor('transparent', true); // dark background, light icons
  //   }, []),
  // );

  const handlePressCreateAccount = () => {
    navigation.navigate('Signup');
  };

  const handlePressLogin = () => {
    navigation.navigate('LoginForm');
  };

  const handlePressCreateAccountCode = () => {
    navigation.navigate('ScreenSignupActivationCode');
  };

  return (
    <View style={[styles.mainContent, globalStyles.backgroundAccent]}>
      <StatusBar
        backgroundColor="#DFECDF" // Status bar background color (Android)
        barStyle="dark-content" // Text color: 'default', 'light-content', 'dark-content'
      />
      {/* <CustomHeader></CustomHeader> */}
      <View style={styles.mainContainer}>
        <Image
          source={require('../../assets/images/login-logo.png')} // local image file
          style={{width: 300, height: 300}}
        />
      </View>
      <View style={styles.buttonContainer}>
        <TouchableOpacity
          style={globalStyles.primaryButton}
          onPress={handlePressCreateAccount}>
          <Text style={globalStyles.primaryButtonText}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={globalStyles.secondaryButton}
          onPress={handlePressCreateAccountCode}>
          <Text style={globalStyles.secondaryButtonButtonText}>
            Signup with Code
          </Text>
        </TouchableOpacity>
        <View style={styles.loginAccountContainer}>
          <TouchableOpacity
            style={styles.loginAccountButtonContainer}
            onPress={handlePressLogin}>
            <Text style={{color: '#000'}}>Have an account?</Text>
            <Text style={{color: '#699E73'}}> Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
  },
  mainContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DFECDF',
    // borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
  },
  buttonContainer: {
    flex: 1,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    marginBottom: 30,
    marginHorizontal: 20,
  },
  loginAccountContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  loginAccountButtonContainer: {
    flex: 1,
    flexDirection: 'row',
  },
});

export default ScreenLogin;
