import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  SafeAreaView,
  Dimensions,
} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {InputPassword} from '../../components/Input';

import LeftIcon from '../../assets/icons/greylight/caret-left-regular.svg';
import CheckIcon from '../../assets/icons/white/check-regular.svg';
import ExIcon from '../../assets/icons/white/x-regular.svg';

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const ScreenProfilePassword = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew, setShowNew] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const passwordCriteria = {
    minLength: newPassword.length >= 8,
    hasUpperCase: /[A-Z]/.test(newPassword),
    hasNumber: /\d/.test(newPassword),
    noSpaces: !/\s/.test(newPassword),
  };

  const allValid =
    Object.values(passwordCriteria).every(Boolean) &&
    newPassword === confirmPassword;

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <View style={{flex: 1}}>
        <ScrollView
          style={[styles.container, {paddingTop: insets.top}]}
          contentContainerStyle={{paddingBottom: 120}}
          stickyHeaderIndices={[0]}>
          {/* Header */}
          <View style={styles.stickyHeader}>
            <View style={styles.header}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={{
                  flexDirection: 'row',
                  justifyContent: 'flex-start',
                  alignItems: 'flex-start',
                }}>
                <LeftIcon width={30} height={30} />
              </TouchableOpacity>
              <View style={{flex: 1}}>
                <Text
                  style={[
                    globalStyles.textLGGreyDark,
                    {textAlign: 'center', paddingRight: 20},
                  ]}>
                  Update Password
                </Text>
              </View>
            </View>
          </View>
          <View style={styles.mainContainer}>
            {/* Current Password */}
            <View style={{paddingTop: 20}}>
              <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
                Current password
              </Text>
              <InputPassword
                placeholder={'Enter current password'}></InputPassword>
            </View>

            {/* New Password */}
            <View style={{paddingTop: 20}}>
              <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
                New password
              </Text>
              <InputPassword placeholder={'Enter new password'}></InputPassword>
            </View>

            {/* Password Rules */}
            <View style={[styles.rulesBox, {marginTop: 20}]}>
              <Text style={styles.ruleHeader}>Good Password</Text>
              <RuleItem
                valid={passwordCriteria.minLength}
                label="Use at least 8 Characters"
              />
              <RuleItem
                valid={passwordCriteria.hasUpperCase}
                label="Use at least 1 capital letter"
              />
              <RuleItem
                valid={passwordCriteria.hasNumber}
                label="Use at least 1 number"
              />
              <RuleItem valid={passwordCriteria.noSpaces} label="No spaces" />
            </View>

            {/* Confirm Password */}
            <View style={{paddingTop: 20}}>
              <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
                Confirm password
              </Text>
              <InputPassword
                placeholder={'Enter confirm password'}></InputPassword>
            </View>
          </View>
        </ScrollView>

        {/* Button always at the bottom */}
        <View style={{padding: 20, backgroundColor: '#fff'}}>
          <TouchableOpacity
            style={[globalStyles.primaryButton]}
            disabled={!allValid}>
            <Text style={styles.buttonText}>Update Password</Text>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};

const RuleItem = ({valid, label}) => (
  <View style={styles.ruleItem}>
    {valid ? (
      <View style={{backgroundColor: '#000', padding: 2, borderRadius: 20}}>
        <CheckIcon width={20} height={20} />
      </View>
    ) : (
      <View style={{backgroundColor: '#000', padding: 2, borderRadius: 20}}>
        <ExIcon width={20} height={20} />
      </View>
    )}
    <Text style={{marginLeft: 8, color: '#333'}}>{label}</Text>
  </View>
);

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#DFECDF',
  },
  mainContainer: {
    minHeight: screenHeight * 0.9,
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
    paddingHorizontal: 20,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 10,
  },
  stickyHeader: {
    backgroundColor: '#fff',
    zIndex: 10,
    paddingTop: 12,
    paddingBottom: 12,
  },
  title: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: 20,
    textAlign: 'center',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  icon: {
    position: 'absolute',
    right: 30,
    top: 60,
  },
  rulesBox: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 10,
    padding: 15,
    marginBottom: 20,
  },
  ruleHeader: {
    fontWeight: '600',
    marginBottom: 10,
    color: 'green',
  },
  ruleItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 3,
  },
  button: {
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
  },
  buttonText: {
    color: '#fff',
    textAlign: 'center',
    fontWeight: 'bold',
  },
});

export default ScreenProfilePassword;
