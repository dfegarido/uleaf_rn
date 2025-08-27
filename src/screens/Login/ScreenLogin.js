import React, {useContext, useEffect} from 'react';
import {
  View,
  Text,
  StatusBar,
  Image,
  TouchableOpacity,
  StyleSheet,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {useFocusEffect} from '@react-navigation/native';
import {globalStyles} from '../../assets/styles/styles';

import {getApp} from '@react-native-firebase/app';
import {getAuth, signInWithEmailAndPassword} from '@react-native-firebase/auth';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthContext} from '../../auth/AuthProvider';

const ScreenLogin = ({navigation}) => {
  const {setIsLoggedIn} = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  const app = getApp();
  const auth = getAuth(app);

  // Calculate proper bottom padding for safe area
  const safeBottomPadding = Math.max(insets.bottom, 8); // At least 8px padding

  useEffect(() => {
    const fetchData = async () => {
      const currentUser = auth.currentUser;

      if (currentUser) {
        console.log('here mike');
        try {
          const token = await user.getIdToken();
          // On login success:
          await AsyncStorage.setItem('authToken', token); // your token logic
          setIsLoggedIn(true);
        } catch (err) {
          console.log('Session token error:', err.message);
        }
      }
    };

    fetchData();
  }, []);

  // const handlePressCreateAccount = () => {
  //   navigation.navigate('Signup');
  // };

  const handlePressCreateAccount = () => {
    navigation.navigate('BuyerAuthStack', {
      screen: 'BuyerSignup',
    });
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
          style={{width: 350, height: 350}}
        />
      </View>
      <View style={[styles.buttonContainer, {marginBottom: safeBottomPadding + 20}]}>
        <TouchableOpacity
          style={globalStyles.primaryButton}
          onPress={handlePressCreateAccount}>
          <Text style={globalStyles.primaryButtonText}>Create Account</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={globalStyles.secondaryButton}
          onPress={handlePressCreateAccountCode}>
          <Text style={globalStyles.secondaryButtonButtonText}>
            Sign-up with a code
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
    paddingTop: 100,
    // justifyContent: 'center',
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
    // marginBottom handled dynamically based on safe area
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
