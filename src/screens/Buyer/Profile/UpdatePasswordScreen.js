import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';

import Svg, { Path } from 'react-native-svg';

// Eye Icon Component (placeholder - replace with your Figma SVG)
const EyeIcon = ({width = 24, height = 24, fill = "#647276"}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M12 4.5C7 4.5 2.73 7.61 1 12C2.73 16.39 7 19.5 12 19.5S21.27 16.39 23 12C21.27 7.61 17 4.5 12 4.5ZM12 17C9.24 17 7 14.76 7 12S9.24 7 12 7S17 9.24 17 12S14.76 17 12 17ZM12 9C10.34 9 9 10.34 9 12S10.34 15 12 15S15 13.66 15 12S13.66 9 12 9Z"
      fill={fill}
    />
  </Svg>
);

// Password Strength Icon Component (from Figma SVG)
const PasswordStrengthIcon = ({width = 20, height = 10, fill = "#7F8D91"}) => (
  <Svg width={width} height={height} viewBox="0 0 20 10" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M0.528843 0.166565C0.851062 -0.0937184 1.32327 -0.0435098 1.58356 0.278709C2.11306 0.934207 2.79114 1.65229 3.63213 2.30733C3.64585 2.31724 3.65916 2.32756 3.67203 2.33826C5.21214 3.52686 7.29271 4.49999 10.0001 4.49999C12.7075 4.49999 14.7881 3.52687 16.3282 2.33827C16.3411 2.32757 16.3544 2.31724 16.3681 2.30732C17.2091 1.65229 17.8872 0.934204 18.4167 0.278709C18.677 -0.0435098 19.1492 -0.0937184 19.4714 0.166565C19.7936 0.426849 19.8438 0.899061 19.5836 1.22128C19.1041 1.81485 18.5037 2.46692 17.7742 3.09337L19.6513 6.37786C19.8568 6.73748 19.7319 7.19563 19.3723 7.40116C19.0126 7.60668 18.5545 7.48176 18.349 7.12213L16.5709 4.01087C15.6125 4.65497 14.4893 5.21497 13.1898 5.57522L13.7399 8.87672C13.808 9.28531 13.532 9.67171 13.1234 9.7398C12.7148 9.80788 12.3284 9.53185 12.2603 9.12327L11.7201 5.88086C11.1734 5.95812 10.6003 5.99999 10.0001 5.99999C9.39996 5.99999 8.82686 5.95812 8.2802 5.88086L7.73993 9.12327C7.67185 9.53185 7.28544 9.80788 6.87686 9.7398C6.46828 9.67171 6.19225 9.28531 6.26033 8.87672L6.81045 5.57522C5.511 5.21497 4.38776 4.65497 3.42937 4.01087L1.65129 7.12213C1.44576 7.48176 0.987617 7.60668 0.62799 7.40116C0.268363 7.19563 0.143439 6.73748 0.348966 6.37786L2.22604 3.09337C1.49654 2.46692 0.896177 1.81485 0.416699 1.22128C0.156415 0.899061 0.206624 0.426849 0.528843 0.166565Z"
      fill={fill}
    />
  </Svg>
);

// Custom Checkmark Icon Component (from Figma SVG)
const CheckmarkIcon = ({width = 24, height = 24}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    {/* Black circle background */}
    <Path
      d="M12 2.25C10.0716 2.25 8.18657 2.82183 6.58319 3.89317C4.97982 4.96451 3.73013 6.48726 2.99218 8.26884C2.25422 10.0504 2.06114 12.0108 2.43735 13.9021C2.81355 15.7934 3.74215 17.5307 5.10571 18.8943C6.46928 20.2579 8.20656 21.1865 10.0979 21.5627C11.9892 21.9389 13.9496 21.7458 15.7312 21.0078C17.5127 20.2699 19.0355 19.0202 20.1068 17.4168C21.1782 15.8134 21.75 13.9284 21.75 12C21.7473 9.41498 20.7192 6.93661 18.8913 5.10872C17.0634 3.28084 14.585 2.25273 12 2.25Z"
      fill="#202325"
    />
    {/* White checkmark */}
    <Path
      d="M16.2806 10.2806L11.0306 15.5306C10.961 15.6004 10.8783 15.6557 10.7872 15.6934C10.6962 15.7312 10.5986 15.7506 10.5 15.7506C10.4014 15.7506 10.3038 15.7312 10.2128 15.6934C10.1218 15.6557 10.039 15.6004 9.96938 15.5306L7.71938 13.2806C7.57865 13.1399 7.49959 12.949 7.49959 12.75C7.49959 12.551 7.57865 12.3601 7.71938 12.2194C7.86011 12.0786 8.05098 11.9996 8.25 11.9996C8.44903 11.9996 8.6399 12.0786 8.78063 12.2194L10.5 13.9397L15.2194 9.21937C15.2891 9.14969 15.3718 9.09442 15.4628 9.0567C15.5539 9.01899 15.6515 8.99958 15.75 8.99958C15.8486 8.99958 15.9461 9.01899 16.0372 9.0567C16.1282 9.09442 16.2109 9.14969 16.2806 9.21937C16.3503 9.28906 16.4056 9.37178 16.4433 9.46283C16.481 9.55387 16.5004 9.65145 16.5004 9.75C16.5004 9.84855 16.481 9.94613 16.4433 10.0372C16.4056 10.1282 16.3503 10.2109 16.2806 10.2806Z"
      fill="#fff"
    />
  </Svg>
);

const UpdatePasswordScreen = ({ navigation }) => {
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  // Password strength and checklist logic can be added here

  return (
    <View style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <LeftIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Password</Text>
        <View style={{ width: 40 }} />
      </View>
      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Current Password */}
        <View style={styles.inputSection}>
          <View style={styles.inputFieldWrap}>
            <Text style={styles.inputLabel}>Current Password</Text>
            <View style={styles.textField}>
              <TextInput
                style={styles.input}
                placeholder="****"
                placeholderTextColor="#647276"
                value={currentPassword}
                onChangeText={setCurrentPassword}
                secureTextEntry
              />
              <TouchableOpacity style={styles.iconContainer}>
                <EyeIcon width={24} height={24} fill="#647276" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* New Password */}
        <View style={styles.inputSection}>
          <View style={styles.inputFieldWrap}>
            <Text style={styles.inputLabel}>New Password</Text>
            <View style={styles.textField}>
              <TextInput
                style={styles.input}
                placeholder="8@N~!r8HiN6"
                placeholderTextColor="#647276"
                value={newPassword}
                onChangeText={setNewPassword}
                secureTextEntry
              />
              <TouchableOpacity style={styles.iconContainer}>
                <PasswordStrengthIcon width={20} height={10} fill="#7F8D91" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Password Guide */}
        <View style={styles.passwordGuideBox}>
          <View style={styles.strengthRow}>
            <View style={styles.strengthIndicatorActive} />
            <View style={styles.strengthIndicatorActive} />
            <View style={styles.strengthIndicatorInactive} />
            <Text style={styles.strengthText}>Good Password</Text>
          </View>
          <View style={styles.guideList}>
            <View style={styles.checkListRow}>
              <View style={styles.checkIcon}>
                <CheckmarkIcon width={24} height={24} fill="#fff" />
              </View>
              <Text style={styles.guideText}>Use at least 8 Characters</Text>
            </View>
            <View style={styles.checkListRow}>
              <View style={styles.checkIcon}>
                <CheckmarkIcon width={24} height={24} fill="#fff" />
              </View>
              <Text style={styles.guideText}>Use at least 1 capital letter</Text>
            </View>
            <View style={styles.checkListRow}>
              <View style={styles.checkIcon}>
                <CheckmarkIcon width={24} height={24} fill="#fff" />
              </View>
              <Text style={styles.guideText}>Use at least 1 number</Text>
            </View>
            <View style={styles.checkListRow}>
              <View style={styles.checkIcon}>
                <CheckmarkIcon width={24} height={24} fill="#fff" />
              </View>
              <Text style={styles.guideText}>No spaces</Text>
            </View>
          </View>
        </View>
        {/* Confirm Password */}
        <View style={styles.inputSection}>
          <View style={styles.inputFieldWrap}>
            <Text style={styles.inputLabel}>Re-type new password</Text>
            <View style={styles.textField}>
              <TextInput
                style={styles.input}
                placeholder="************"
                placeholderTextColor="#647276"
                value={confirmPassword}
                onChangeText={setConfirmPassword}
                secureTextEntry
              />
              <TouchableOpacity style={styles.iconContainer}>
                <EyeIcon width={24} height={24} fill="#647276" />
              </TouchableOpacity>
            </View>
          </View>
        </View>
        {/* Action Button */}
        <View style={styles.actionSection}>
          <TouchableOpacity style={styles.saveBtn}>
            <Text style={styles.saveBtnText}>Update Password</Text>
          </TouchableOpacity>
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
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  scrollContent: {
    alignItems: 'flex-start',
    width: '100%',
    minHeight: 812,
    flexGrow: 1,
    paddingBottom: 34,
    paddingTop: 0,
  },
  inputSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 12,
    width: '100%',
    height: 102,
    alignSelf: 'center',
    flexGrow: 0,
  },
  inputFieldWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: 327,
    height: 78,
    alignSelf: 'center',
    flexGrow: 0,
  },
  inputLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    width: 327,
    height: 22,
    textAlign: 'left',
    alignSelf: 'flex-start',
  },
  textField: {
    position: 'relative',
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
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  input: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    height: 24,
    padding: 0,
  },
  iconContainer: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  passwordGuideBox: {
    width: 327,
    height: 190,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
    marginTop: 12,
    alignSelf: 'center',
  },
  strengthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    height: 20,
    marginBottom: 16,
  },
  strengthIndicatorActive: {
    width: 40,
    height: 8,
    backgroundColor: '#23C16B',
    borderRadius: 100,
    marginRight: 8,
  },
  strengthIndicatorInactive: {
    width: 40,
    height: 8,
    backgroundColor: '#E4E7E9',
    borderRadius: 100,
    marginRight: 8,
  },
  strengthText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#202325',
    marginLeft: 8,
  },
  guideList: {
    flexDirection: 'column',
    gap: 8,
    width: '100%',
    height: 120,
  },
  checkListRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: 295,
    height: 24,
  },
  checkIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#202325',
    marginRight: 8,
  },
  guideText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#202325',
  },
  actionSection: {
    flexDirection: 'column',
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 12,
    width: '100%',
    alignSelf: 'center',
  },
  saveBtn: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    paddingHorizontal: 24,
    width: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#C0DAC2',
    borderRadius: 12,
  },
  saveBtnText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    alignSelf: 'center',
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
    marginLeft: -74,
    bottom: 8,
    backgroundColor: '#202325',
    borderRadius: 100,
  },
});

export default UpdatePasswordScreen;
