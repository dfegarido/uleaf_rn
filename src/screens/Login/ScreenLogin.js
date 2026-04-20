import React, {useContext, useEffect} from 'react';
import {
  View,
  Text,
  StatusBar,
  Image,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import changeNavigationBarColor from 'react-native-navigation-bar-color';
import {useFocusEffect} from '@react-navigation/native';
import {globalStyles} from '../../assets/styles/styles';

import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../../../firebase';

import AsyncStorage from '@react-native-async-storage/async-storage';
import {AuthContext} from '../../auth/AuthProvider';

const screenHeight = Dimensions.get('window').height;

const ScreenLogin = ({navigation}) => {
  const {setIsLoggedIn} = useContext(AuthContext);
  const insets = useSafeAreaInsets();
  // auth comes from Web Firebase SDK via shared initializer

  // Simplified safe area calculation for Nokia devices
  const safeBottomPadding = Platform.OS === 'android' ? Math.max(insets.bottom, 16) : insets.bottom;

  useEffect(() => {
    // #region agent log
    fetch('http://127.0.0.1:7925/ingest/9a196955-a083-44bc-acca-b2ca885f3d02',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0a9adf'},body:JSON.stringify({sessionId:'0a9adf',hypothesisId:'H8',location:'ScreenLogin.js:mount',message:'ScreenLogin mounted',data:{},timestamp:Date.now(),runId:'pre-fix'})}).catch(()=>{});
    // #endregion
    const fetchData = async () => {
      const currentUser = auth?.currentUser;
      // #region agent log
      fetch('http://127.0.0.1:7925/ingest/9a196955-a083-44bc-acca-b2ca885f3d02',{method:'POST',headers:{'Content-Type':'application/json','X-Debug-Session-Id':'0a9adf'},body:JSON.stringify({sessionId:'0a9adf',hypothesisId:'H9',location:'ScreenLogin.js:fetchData',message:'fetchData auth.currentUser check',data:{hasCachedUser:!!currentUser,uid:currentUser?.uid||null},timestamp:Date.now(),runId:'pre-fix'})}).catch(()=>{});
      // #endregion

      if (currentUser) {
        console.log('here mike');
        try {
          const token = await currentUser.getIdToken();
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
        barStyle="dark-content"
        {...(Platform.OS === 'android'
          ? {backgroundColor: '#DFECDF'}
          : {})}
      />
      
      <View style={styles.logoContainer}>
        <Image
          source={require('../../assets/images/login-logo.png')} // local image file
          style={styles.logo}
        />
      </View>
      
      <View style={[styles.buttonContainer, {paddingBottom: safeBottomPadding + 20}]}>
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
            <Text style={styles.loginText}>Have an account?</Text>
            <Text style={styles.loginLinkText}> Login</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    justifyContent: 'space-between',
    minHeight: screenHeight,
  },
  logoContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#DFECDF',
    paddingTop: 60,
    paddingBottom: 40,
  },
  logo: {
    width: Math.min(350, screenHeight * 0.35),
    height: Math.min(350, screenHeight * 0.35),
    resizeMode: 'contain',
  },
  buttonContainer: {
    paddingHorizontal: 20,
    paddingTop: 20,
    backgroundColor: '#DFECDF',
  },
  loginAccountContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 20,
  },
  loginAccountButtonContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  loginText: {
    color: '#000',
    fontSize: 16,
  },
  loginLinkText: {
    color: '#699E73',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ScreenLogin;
