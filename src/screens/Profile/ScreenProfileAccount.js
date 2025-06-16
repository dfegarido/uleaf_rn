import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  StatusBar,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Image,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {globalStyles} from '../../assets/styles/styles';
import {InputBox} from '../../components/Input';
import {PhoneInput} from '../../components/PhoneInput';
import {InputDropdown} from '../../components/Input';

import LeftIcon from '../../assets/icons/greylight/caret-left-regular.svg';
import CameraIcon from '../../assets/icons/accent/camera.svg';

const ScreenProfileAccount = ({navigation}) => {
  const insets = useSafeAreaInsets();

  useFocusEffect(() => {
    if (Platform.OS === 'android') {
      StatusBar.setBarStyle('dark-content');
      StatusBar.setBackgroundColor('#fff');
    }
  });

  const [selectedCountry, setSelectedCountry] = useState('');

  const handleUpdate = () => {
    navigation.navigate('LoginOtp');
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      <ScrollView style={[styles.container, {paddingTop: insets.top}]}>
        {/* Search and Icons */}
        <View style={styles.stickyHeader}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={{
                // padding: 5,
                // backgroundColor: '#fff',
                flexDirection: 'row',
                justifyContent: 'flex-start',
                alignItems: 'flex-start',
              }}>
              <LeftIcon width={30} hegiht={30} />
            </TouchableOpacity>
            <View style={{flex: 1}}>
              <Text
                style={[
                  globalStyles.textLGGreyDark,
                  {textAlign: 'center', paddingRight: 20},
                ]}>
                Account Information
              </Text>
            </View>
          </View>
        </View>
        {/* Search and Icons */}

        {/* Main Content */}
        <View style={{marginHorizontal: 20}}>
          <View style={{flexDirection: 'row', justifyContent: 'center'}}>
            <View style={{position: 'relative'}}>
              <Image
                source={require('../../assets/images/AvatarBig.png')}
                style={styles.image}
                resizeMode="contain"
              />
              <View
                style={{
                  position: 'absolute',
                  bottom: 5,
                  right: 5, // ⬅️ Add this line to move it to bottom-right
                  backgroundColor: '#F2F7F3',
                  padding: 10,
                  borderRadius: 20,
                }}>
                <CameraIcon width={20} height={20} />
              </View>
            </View>
          </View>
          <View style={{flexDirection: 'row', justifyContent: 'center'}}>
            <Text style={globalStyles.textMDGreyDark}>olla@gmail.com</Text>
          </View>

          <View style={{paddingTop: 20}}>
            <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
              Owner name <Text style={globalStyles.textXSRed}>*</Text>
            </Text>
            <InputBox placeholder={''} />
          </View>
          <View style={{paddingTop: 20}}>
            <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
              First name <Text style={globalStyles.textXSRed}>*</Text>
            </Text>
            <InputBox placeholder={''} />
          </View>
          <View style={{paddingTop: 20}}>
            <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
              Last name <Text style={globalStyles.textXSRed}>*</Text>
            </Text>
            <InputBox placeholder={''} />
          </View>
          <View style={{paddingTop: 20}}>
            <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
              Contact number <Text style={globalStyles.textXSRed}>*</Text>
            </Text>
            <PhoneInput required />
          </View>
          <View style={{paddingTop: 20}}>
            <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
              Garden / company name{' '}
              <Text style={globalStyles.textXSRed}>*</Text>
            </Text>
            <InputBox placeholder={''} />
          </View>
          <View style={{paddingTop: 20}}>
            <Text style={[globalStyles.textMDGreyDark, {paddingBottom: 10}]}>
              Country <Text style={globalStyles.textXSRed}>*</Text>
            </Text>
            <InputDropdown
              options={['Option 1', 'Option 2', 'Option 3']}
              selectedOption={selectedCountry}
              onSelect={setSelectedCountry}
              placeholder="Choose an option"
            />
          </View>
          <View style={{paddingVertical: 20}}>
            <TouchableOpacity style={globalStyles.primaryButton}>
              <Text style={globalStyles.primaryButtonText}>Update Acount</Text>
            </TouchableOpacity>
          </View>
        </View>
        {/* Main Content */}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  mainContent: {
    flex: 1,
    backgroundColor: '#DFECDF',
  },
  mainContainer: {
    flex: 1,
    backgroundColor: '#fff',
    borderTopLeftRadius: 10,
    borderTopRightRadius: 10,
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
});

export default ScreenProfileAccount;
