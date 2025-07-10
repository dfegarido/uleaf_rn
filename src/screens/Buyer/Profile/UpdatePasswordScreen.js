import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';

import Svg, { Path } from 'react-native-svg';
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
      <View style={styles.navigationHeader}>
        <View style={styles.statusBar} />
        <View style={styles.headerContent}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
            <LeftIcon width={24} height={24} fill="#393D40" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Update Password</Text>
          <View style={{ width: 40 }} />
        </View>
      </View>
      <ScrollView style={styles.content} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
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
    position: 'relative',
    width: '100%',
    height: 812,
    backgroundColor: '#FFFFFF',
    flex: 1,
    alignSelf: 'stretch',
  },
  navigationHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: '100%',
    height: 106,
    backgroundColor: '#FFFFFF',
    zIndex: 2,
    flexDirection: 'column',
  },
  statusBar: {
    width: '100%',
    height: 24,
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    height: 58,
    width: '100%',
    marginTop: 0,
    paddingHorizontal: 24,
    alignSelf: 'center',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
  },
  content: {
    flex: 1,
    width: '100%',
    minHeight: 812,
    paddingTop: 106,
    paddingBottom: 34,
    alignSelf: 'stretch',
    backgroundColor: '#FFFFFF',
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
