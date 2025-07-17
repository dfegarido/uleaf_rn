import React, {useState, useEffect, useContext} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  TextInput,
  Modal,
  ActivityIndicator,
} from 'react-native';
import Svg, {Path} from 'react-native-svg';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';
import {getProfileInfoApi} from '../../../components/Api';
import {AuthContext} from '../../../auth/AuthProvider';

// Import icons
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import AvatarIcon from '../../../assets/buyer-icons/avatar.svg';

// Edit Icon Component (Camera Icon)
const EditIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path
      d="M14 12.6667C14 13.0203 13.8595 13.3594 13.6095 13.6095C13.3594 13.8595 13.0203 14 12.6667 14H3.33333C2.97971 14 2.64057 13.8595 2.39052 13.6095C2.14048 13.3594 2 13.0203 2 12.6667V6C2 5.64638 2.14048 5.30724 2.39052 5.05719C2.64057 4.80714 2.97971 4.66667 3.33333 4.66667H5.33333L6.66667 2.66667H9.33333L10.6667 4.66667H12.6667C13.0203 4.66667 13.3594 4.80714 13.6095 5.05719C13.8595 5.30724 14 5.64638 14 6V12.6667Z"
      stroke="#539461"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <Path
      d="M8 11.3333C9.47276 11.3333 10.6667 10.1394 10.6667 8.66667C10.6667 7.19391 9.47276 6 8 6C6.52724 6 5.33333 7.19391 5.33333 8.66667C5.33333 10.1394 6.52724 11.3333 8 11.3333Z"
      stroke="#539461"
      strokeWidth={1.2}
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
  </Svg>
);

// US Flag Icon Component (simplified)
const USFlagIcon = () => (
  <View style={styles.flagIcon}>
    <Text style={styles.flagEmoji}>🇺🇸</Text>
  </View>
);

// Dropdown Icon Component
const DropdownIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path
      d="M4 6L8 10L12 6"
      stroke="#202325"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AccountInformationScreen = () => {
  const navigation = useNavigation();
  const {userInfo} = useContext(AuthContext);
  const isFocused = useIsFocused();
  
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState({});
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [email, setEmail] = useState('');

  useEffect(() => {
    setLoading(true);
    const fetchData = async () => {
      try {
        await loadProfileData();
      } catch (error) {
        console.log('Fetching profile details:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [isFocused]);

  const loadProfileData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getProfileInfoApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load profile api');
    }

    console.log('Profile data:', res);
    setData(res);
    
    // Populate form fields with fetched data
    setFirstName(res.firstName || '');
    setLastName(res.lastName || '');
    setUsername(res.username || '');
    setPhoneNumber(res.contactNumber || '');
    setEmail(res.email || '');
  };

  return (
    <View style={styles.container}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <LeftIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Account Information</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Form */}
        <View style={styles.form}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <AvatarIcon width={96} height={96} />
            </View>
            <TouchableOpacity style={styles.editButton}>
              <EditIcon />
            </TouchableOpacity>
          </View>

          {/* Email Display */}
          <View style={styles.emailSection}>
            <Text style={styles.emailText}>{email}</Text>
          </View>

          {/* First Name */}
          <View style={styles.inputSection}>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>
                First Name <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.textField}>
                <TextInput
                  style={styles.textInput}
                  value={firstName}
                  onChangeText={setFirstName}
                  placeholder="John"
                  placeholderTextColor="#202325"
                />
              </View>
            </View>
          </View>

          {/* Last Name */}
          <View style={styles.inputSection}>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>
                Last Name <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.textField}>
                <TextInput
                  style={styles.textInput}
                  value={lastName}
                  onChangeText={setLastName}
                  placeholder="Doe"
                  placeholderTextColor="#202325"
                />
              </View>
            </View>
          </View>

          {/* Username */}
          <View style={styles.inputSection}>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>
                Username <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <View style={styles.textField}>
                <TextInput
                  style={styles.textInput}
                  value={username}
                  onChangeText={setUsername}
                  placeholder="username123"
                  placeholderTextColor="#202325"
                />
              </View>
            </View>
          </View>

          {/* Contact Number */}
          <View style={styles.contactSection}>
            <View style={styles.inputField}>
              <Text style={styles.inputLabel}>Contact Number</Text>
              <View style={styles.phoneField}>
                <View style={styles.countryCode}>
                  <View style={styles.countrySection}>
                    <USFlagIcon />
                  </View>
                  <Text style={styles.codeText}>+1</Text>
                  <DropdownIcon />
                </View>
                <TextInput
                  style={styles.phoneInput}
                  value={phoneNumber}
                  onChangeText={setPhoneNumber}
                  placeholder="+1 (555) 123-4567"
                  placeholderTextColor="#202325"
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Action Button */}
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.saveButton}>
              <View style={styles.buttonTextContainer}>
                <Text style={styles.buttonText}>Update Account</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Home Indicator */}
      <View style={styles.homeIndicator}>
        <View style={styles.gestureBar} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 60,
  },
  backButton: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#202325',
    flex: 1,
  },
  spacer: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingBottom: 34,
  },
  form: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start', 
    padding: 0,
    width: 375,
    minWidth: 375,
    maxWidth: 375,
    alignSelf: 'center', 
    flexGrow: 0,
  },
  avatarSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 12,
    width: 375,
    height: 120,
    alignSelf: 'stretch',
    position: 'relative',
  },
  avatarContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 96,
    height: 96,
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: '#539461',
    backgroundColor: '#FFF',
    position: 'relative',
    zIndex: 0,
  },
  editButton: {
    position: 'absolute',
    width: 34,
    minWidth: 34,
    height: 34,
    minHeight: 34,
    left: 223.5,
    top: 43,
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    zIndex: 1,
  },
  emailSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 0,
    paddingRight: 24,
    paddingBottom: 12,
    paddingLeft: 24,
    width: 375,
    height: 34,
    alignSelf: 'stretch',
  },
  emailText: {
    width: 327,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#202325',
    flexGrow: 1,
  },
  inputSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 16,
    width: 375,
    height: 102,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  inputField: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: 327,
    height: 78,
    alignSelf: 'stretch',
  },
  inputLabel: {
    width: 327,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    alignSelf: 'stretch',
  },
  requiredAsterisk: {
    color: '#E53E3E', // Red color for required asterisk
  },
  textField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    width: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#647276',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  textInput: {
    width: 295,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 1,
    paddingVertical: 0,
  },
  contactSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 12,
    width: 375,
    height: 102,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  phoneField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    width: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#647276',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: 67,
    height: 20,
  },
  countrySection: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 2,
    width: 24,
    height: 20,
  },
  codeText: {
    width: 19,
    height: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    color: '#202325',
  },
  phoneInput: {
    width: 216,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 1,
    paddingVertical: 0,
  },
  actionSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingRight: 24,
    paddingBottom: 12,
    paddingLeft: 24,
    gap: 12,
    width: 375,
    height: 84,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#C0DAC2',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  buttonTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    width: 142,
    height: 16,
  },
  buttonText: {
    width: 126,
    height: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    alignItems: 'center',
    display: 'flex',
  },
  homeIndicator: {
    position: 'absolute',
    width: '100%',
    height: 34,
    left: 0,
    bottom: 0,
    zIndex: 1,
  },
  gestureBar: {
    position: 'absolute',
    width: 148,
    height: 5,
    left: '50%',
    marginLeft: -74, // center horizontally
    bottom: 8,
    backgroundColor: '#202325',
    borderRadius: 100,
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default AccountInformationScreen;
