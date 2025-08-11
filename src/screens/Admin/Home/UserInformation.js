import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import TrashIcon from '../../../assets/admin-icons/trash-can.svg';
import CheckedBoxIcon from '../../../assets/admin-icons/checked-box.svg';

const UserInformationHeader = ({ user }) => {
  const navigation = useNavigation();

  return (
    <View style={styles.headerContainer}>
      <View style={styles.topRow}>
        <TouchableOpacity
          accessibilityRole="button"
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.8}
        >
          <BackIcon width={24} height={24} />
        </TouchableOpacity>

        <View style={styles.titleContainer}>
          <Text style={styles.headerTitle}>{user.role} Information</Text>
        </View>

        <TouchableOpacity
          accessibilityRole="button"
          style={styles.deleteButton}
          activeOpacity={0.8}
        >
          <View style={styles.deleteButtonContainer}>
            <TrashIcon width={40} height={40} />
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const UserInformation = () => {
  const route = useRoute();
  const { user } = route.params || {};
  const [isVideoLiveEnabled, setIsVideoLiveEnabled] = useState(false);
  const [isAccountActive, setIsAccountActive] = useState(user?.status === 'Active');

  if (!user) {
    return (
      <View style={styles.container}>
        <Text style={styles.errorText}>No user data provided</Text>
      </View>
    );
  }

  // Get status color based on current toggle state
  const getStatusColor = (status) => {
    return status === 'Active' ? '#23C16B' : '#E7522F';
  };

  // Get profile color based on user ID
  const getProfileColor = (id) => {
    const colors = ['#E3F2FD', '#FFF3E0', '#E8F5E8', '#FFF9C4', '#F3E5F5', '#FFE0B2', '#E0F2F1'];
    return colors[(id - 1) % colors.length];
  };

  // Extract first and last name from user.name
  const nameParts = user.name.split(' ');
  const firstName = nameParts[0] || '';
  const lastName = nameParts.slice(1).join(' ') || '';

  // Handle account status toggle
  const handleAccountStatusToggle = () => {
    setIsAccountActive(!isAccountActive);
  };

  // Get current status text based on toggle state
  const currentStatus = isAccountActive ? 'Active' : 'Deactivated';

  return (
    <View style={styles.container}>
      <UserInformationHeader user={user} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: getProfileColor(user.id) }]}>
              <Text style={styles.avatarText}>{user.name.charAt(0)}</Text>
            </View>
            <Text style={styles.username}>@{user.username}</Text>
          </View>
          
          {/* Account Status Alert - Only show if account is deactivated */}
          {!isAccountActive && (
            <View style={styles.alertBox}>
              <View style={styles.alertIconContainer}>
                <Text style={styles.alertIcon}>?</Text>
              </View>
              <View style={styles.alertContent}>
                <Text style={styles.alertTitle}>Inactive account</Text>
                <Text style={styles.alertMessage}>
                  The account has been deactivated due to failure to post for 4 consecutive weeks.
                </Text>
              </View>
            </View>
          )}
          
          {/* Account Status Toggle */}
          <View style={styles.statusRow}>
            <Text style={styles.statusLabel}>Account Status</Text>
            <View style={styles.statusContainer}>
              <Text style={[styles.statusText, { color: getStatusColor(currentStatus) }]}>
                {currentStatus}
              </Text>
              <TouchableOpacity 
                style={[styles.toggleSwitch, { backgroundColor: isAccountActive ? '#23C16B' : '#D1D5DB' }]}
                onPress={handleAccountStatusToggle}
                activeOpacity={0.8}
              >
                <View style={[styles.toggleHandle, { 
                  transform: [{ translateX: isAccountActive ? 20 : 0 }] 
                }]} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>User Details</Text>
          
          {/* Country */}
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Country*</Text>
            <View style={styles.dropdownContainer}>
              <Text style={styles.dropdownText}>Philippines</Text>
              <Text style={styles.dropdownIcon}>▼</Text>
            </View>
          </View>
          
          {/* Garden/Company Name */}
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Garden / company name*</Text>
            <Text style={styles.formValue}>{user.role === 'Seller' ? 'Meteor Garden' : 'N/A'}</Text>
          </View>
          
          {/* First Name */}
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>First name*</Text>
            <Text style={styles.formValue}>{firstName}</Text>
          </View>
          
          {/* Last Name */}
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Last name*</Text>
            <Text style={styles.formValue}>{lastName}</Text>
          </View>
          
          {/* Contact Number */}
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Contact number*</Text>
            <View style={styles.phoneContainer}>
              <View style={styles.countryCode}>
                <Text style={styles.flagIcon}>🇵🇭</Text>
                <Text style={styles.codeText}>+63</Text>
                <Text style={styles.codeIcon}>▼</Text>
              </View>
              <Text style={styles.phonePlaceholder}>XXX-XXX-XXXX</Text>
            </View>
          </View>
          
          {/* Email Address */}
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Email address*</Text>
            <Text style={styles.formValue}>{user.username}@gmail.com</Text>
          </View>
          
          {/* Video Live Features - Only show for certain roles */}
          {(user.role === 'Seller' || user.role === 'Super Admin') && (
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Allow video live features</Text>
              <TouchableOpacity 
                style={styles.checkboxContainer}
                onPress={() => setIsVideoLiveEnabled(!isVideoLiveEnabled)}
                activeOpacity={0.8}
              >
                <View style={styles.checkbox}>
                  {isVideoLiveEnabled && <CheckedBoxIcon width={24} height={24} />}
                </View>
                <Text style={styles.checkboxLabel}>Allow video live features</Text>
              </TouchableOpacity>
            </View>
          )}

          {/* VIP Status - Only show if user is VIP */}
          {user.isVip && (
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>VIP Status</Text>
              <View style={styles.vipContainer}>
                <Text style={styles.vipText}>VIP Member</Text>
              </View>
            </View>
          )}
        </View>

        {/* Update Account Button */}
        <TouchableOpacity style={styles.updateButton} activeOpacity={0.8}>
          <Text style={styles.updateButtonText}>Update Account</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    backgroundColor: '#FFFFFF',
    paddingTop: 30,
    paddingBottom: 1,
    paddingHorizontal: 20,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    textAlign: 'center',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonContainer: {
    width: 40,
    height: 40,
    backgroundColor: '#F3F4F6',
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#D1D5DB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  deleteIcon: {
    fontSize: 18,
  },
  content: {
    flex: 1,
    padding: 20,
    backgroundColor: '#FFFFFF',
  },
  profileSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 5,
  },
  formSection: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
  },
  avatarContainer: {
    alignItems: 'center',
    marginBottom: 20,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {
    fontSize: 32,
    color: '#1F2937',
    fontWeight: '600',
  },
  username: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
  },
  alertBox: {
    backgroundColor: '#FEE2E2',
    borderWidth: 1,
    borderColor: '#EF4444',
    borderRadius: 8,
    padding: 16,
    marginBottom: 20,
    flexDirection: 'row',
    alignItems: 'flex-start',
  },
  alertIconContainer: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#EF4444',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  alertIcon: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#EF4444',
  },
  alertContent: {
    flex: 1,
  },
  alertTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2937',
    marginBottom: 4,
  },
  alertMessage: {
    fontSize: 14,
    color: '#1F2937',
    lineHeight: 20,
  },
  statusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  statusLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1F2937',
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  statusText: {
    fontSize: 16,
    fontWeight: '600',
    marginRight: 12,
  },
  toggleSwitch: {
    width: 44,
    height: 24,
    borderRadius: 12,
    padding: 2,
  },
  toggleHandle: {
    width: 20,
    height: 20,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
  },
  section: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 20,
    marginBottom: 16,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1F2937',
    marginBottom: 16,
  },
  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#F3F4F6',
  },
  infoLabel: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  infoValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1F2937',
  },
  formRow: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  formValue: {
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  dropdownText: {
    fontSize: 16,
    color: '#1F2937',
  },
  dropdownIcon: {
    fontSize: 12,
    color: '#6B7280',
  },
  phoneContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
  },
  countryCode: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRightWidth: 1,
    borderRightColor: '#E5E7EB',
  },
  flagIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  codeText: {
    fontSize: 16,
    color: '#1F2937',
    marginRight: 8,
  },
  codeIcon: {
    fontSize: 12,
    color: '#6B7280',
  },
  phonePlaceholder: {
    flex: 1,
    fontSize: 16,
    color: '#9CA3AF',
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderWidth: 2,
    borderColor: '#D1D5DB',
    borderRadius: 4,
    marginRight: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxLabel: {
    fontSize: 16,
    color: '#1F2937',
  },
  vipContainer: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#F59E0B',
  },
  vipText: {
    fontSize: 16,
    color: '#92400E',
    fontWeight: '600',
  },
  updateButton: {
    backgroundColor: '#539461',
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 32,
    alignItems: 'center',
    marginTop: 20,
    marginBottom: 40,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 100,
  },
});

export default UserInformation;
