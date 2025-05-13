import React, {useState} from 'react';
import {View, Text, TouchableOpacity, StyleSheet} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';
import OtpInput from '../../components/InputOtp/OtpInput';

const ScreenLoginOtp = ({navigation}) => {
  const handlePressLogin = () => {
    navigation.navigate('MainTabs');
  };

  const [otp, setOtp] = useState('');

  return (
    <View style={styles.mainContent}>
      <View style={styles.mainContainer}>
        <Text
          style={[
            globalStyles.textXXLPrimaryDark,
            {textAlign: 'center', fontWeight: 'bold'},
          ]}>
          Enter authentication code
        </Text>
        <Text
          style={[
            globalStyles.textLGGreyDark,
            styles.subtTitle,
            {textAlign: 'center'},
          ]}>
          Enter the 4-digit that we have sent via the email
        </Text>
        <OtpInput length={4} onChangeOtp={setOtp} />
        <View style={styles.buttonContainer}>
          <TouchableOpacity
            style={globalStyles.primaryButton}
            onPress={handlePressLogin}>
            <Text style={globalStyles.primaryButtonText}>Continue</Text>
          </TouchableOpacity>
          <View style={[styles.loginAccountContainer, {paddingTop: 10}]}>
            <TouchableOpacity>
              <Text style={globalStyles.textLGAccent}>Resend Code</Text>
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

export default ScreenLoginOtp;
