import React, { useState, useEffect, useCallback } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, Alert, ActivityIndicator, TextInput, Modal, SafeAreaView } from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import TrashIcon from '../../../assets/admin-icons/trash-can.svg';
import CheckedBoxIcon from '../../../assets/admin-icons/checked-box.svg';
import PhFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import ThFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import IdFlag from '../../../assets/buyer-icons/indonesia-flag.svg';
import UsFlag from '../../../assets/buyer-icons/usa-flag.svg';
import { getStoredAuthToken } from '../../../utils/getStoredAuthToken';
import { API_ENDPOINTS, API_CONFIG } from '../../../config/apiConfig';
import { deleteUserApi } from '../../../components/Api/deleteUserApi';
import { UserInformationHeader } from './UserInformationHeader';

const UserInformation = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user } = route.params || {};
  const [isVideoLiveEnabled, setIsVideoLiveEnabled] = useState(false);
  const [isAccountActive, setIsAccountActive] = useState(user?.status?.toLowerCase() === 'active');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  const [isCountryModalVisible, setIsCountryModalVisible] = useState(false);
  const [isDeletingUser, setIsDeletingUser] = useState(false);
  
  // Available countries (Buyers are US only)
  const countries = [
    { code: 'US', name: 'United States' },
    { code: 'PH', name: 'Philippines' },
    { code: 'TH', name: 'Thailand' },
    { code: 'ID', name: 'Indonesia' }
  ];
  
  // Editable fields state
  const [editableFields, setEditableFields] = useState({
    country: user?.country || '',
    countryCode: user?.countryCode || '',
    gardenOrCompanyName: user?.gardenOrCompanyName || '',
    firstName: '',
    lastName: '',
    contactNumber: user?.contactNumber || user?.phone || ''
  });
  
  // Form editing mode
  const [isEditing, setIsEditing] = useState(false);

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
  
  // Convert country name to country code
  const getCountryCodeFromName = (countryName) => {
    if (!countryName) return '';
    
    const nameToCodeMap = {
      'United States': 'US',
      'Philippines': 'PH',
      'Thailand': 'TH',
      'Indonesia': 'ID'
    };
    
    // If it's already a country code, just return it
    if (Object.values(nameToCodeMap).includes(countryName)) {
      return countryName;
    }
    
    // Return the code if it exists in our map, otherwise return the name
    return nameToCodeMap[countryName] || countryName;
  };
  
  // Convert country code to full country name
  const getFullCountryName = (countryCode) => {
    if (!countryCode) return '';
    
    const countryMap = {
      'US': 'United States',
      'PH': 'Philippines',
      'TH': 'Thailand',
      'ID': 'Indonesia'
    };
    
    // If it's already a full country name, just return it
    if (Object.values(countryMap).includes(countryCode)) {
      return countryCode;
    }
    
    // Return the full name if it exists in our map, otherwise return the code
    return countryMap[countryCode] || countryCode;
  };

  // Extract first and last name properly
  let firstName = user?.firstName || '';
  let lastName = user?.lastName || '';
  
  // Fallback to splitting user.name if firstName and lastName are not available
  if ((!firstName || !lastName) && user?.name) {
    const nameParts = user.name.split(' ');
    const extractedFirstName = nameParts[0] || '';
    const extractedLastName = nameParts.slice(1).join(' ') || '';
    if (!firstName) firstName = extractedFirstName;
    if (!lastName) lastName = extractedLastName;
  }

  // Set editable fields initial values from user data
  useEffect(() => {
    if (user) {
      // Handle country code and name conversion
      const countryCode = user.country && user.country.length <= 2 ? user.country : '';
      const countryName = getFullCountryName(user.country) || '';

      console.log('Setting initial fields:', { 
        country: countryName || 'United States', 
        countryCode: countryCode || 'US' 
      });

      setEditableFields({
        country: countryName || 'United States',
        countryCode: countryCode || 'US',
        gardenOrCompanyName: user.gardenOrCompanyName || '',
        firstName: firstName || '',
        lastName: lastName || '',
        contactNumber: user.contactNumber || user.phone || ''
      });
    }
  }, [user]);

  // Handle user profile update
  const handleProfileUpdate = async () => {
    if (isUpdatingProfile) return;
    
    try {
      setIsUpdatingProfile(true);
      
      // Get auth token
      const authToken = await getStoredAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not available');
      }
      
      // Prepare request data
      const requestData = {
        userId: user.id || user.userId,
        // Send the 2-letter country code (PH, TH, ID) to the API
        country: editableFields.countryCode || getCountryCodeFromName(editableFields.country),
        gardenOrCompanyName: editableFields.gardenOrCompanyName,
        firstName: editableFields.firstName,
        lastName: editableFields.lastName,
        contactNumber: editableFields.contactNumber
      };
      
      console.log('Updating user profile:', requestData);
      
      // Make API call to update user
      const response = await fetch(`${API_CONFIG.BASE_URL}/updateUserStatus`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestData)
      });
      
      const responseText = await response.text();
      console.log('Response:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Failed to update user profile');
      }
      
      // Turn off editing mode
      setIsEditing(false);
      
      // Show success message
      Alert.alert(
        "Success",
        "User profile updated successfully.",
        [{ text: "OK" }]
      );
      
    } catch (error) {
      console.error('Error updating user profile:', error);
      
      // Show error message
      Alert.alert(
        "Error",
        `Failed to update user profile: ${error.message}`,
        [{ text: "OK" }]
      );
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // Toggle editing mode
  const toggleEditMode = () => {
    if (isUpdatingProfile) return;
    
    if (isEditing) {
      // If we're currently editing, submit the changes
      handleProfileUpdate();
    } else {
      // If we're not editing, enter edit mode
      // Make sure country information is properly set before entering edit mode
      if (!editableFields.country && user.country) {
        const countryCode = user.country && user.country.length <= 2 ? user.country : '';
        const countryName = getFullCountryName(user.country) || '';
        
        setEditableFields(prev => ({
          ...prev,
          country: countryName,
          countryCode: countryCode || getCountryCodeFromName(countryName)
        }));
      }
      setIsEditing(true);
    }
  };
  
  // Handle country selection
  const handleCountrySelect = (country) => {
    // Store the full country name for display, but keep track of the code too
    setEditableFields(prev => ({
      ...prev, 
      country: country.name,
      countryCode: country.code // Store the code for API calls
    }));
    setIsCountryModalVisible(false);
  };

  // Handle account status toggle
  const handleAccountStatusToggle = async () => {
    // Don't allow multiple simultaneous updates
    if (isUpdatingStatus) return;
    
    try {
      setIsUpdatingStatus(true);
      
      // Determine the new status (opposite of current)
      const newStatus = isAccountActive ? 'inactive' : 'active';
      
      // Get auth token
      const authToken = await getStoredAuthToken();
      if (!authToken) {
        throw new Error('Authentication token not available');
      }
      
      // Prepare request data
      const requestData = {
        userId: user.id || user.userId,
        status: newStatus
      };
      
      console.log('Updating user status:', requestData);
      
      // Make API call to update user status
      const response = await fetch(`${API_CONFIG.BASE_URL}/updateUserStatus`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`
        },
        body: JSON.stringify(requestData)
      });
      
      const responseText = await response.text();
      console.log('Response:', responseText);
      
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch (e) {
        console.error('Error parsing response:', e);
        throw new Error('Invalid response from server');
      }
      
      if (!response.ok) {
        throw new Error(responseData.error || responseData.message || 'Failed to update user status');
      }
      
      // Update local state
      setIsAccountActive(!isAccountActive);
      
      // Show success message
      Alert.alert(
        "Success",
        `User account has been ${newStatus === 'active' ? 'activated' : 'deactivated'} successfully.`,
        [{ text: "OK" }]
      );
      
    } catch (error) {
      console.error('Error updating user status:', error);
      
      // Show error message
      Alert.alert(
        "Error",
        `Failed to update user status: ${error.message}`,
        [{ text: "OK" }]
      );
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  // Get current status text based on toggle state
  const currentStatus = isAccountActive ? 'Active' : 'Inactive';

  // Handle user deletion with useCallback to avoid React hook errors
  const confirmDeleteUser = useCallback(async () => {
    try {
      setIsDeletingUser(true);
      
      const userId = user.id || user.userId;
      console.log('Deleting user with ID:', userId);
      
      const response = await deleteUserApi(userId, "Deleted by administrator");
      console.log('Delete response:', response);
      
      Alert.alert(
        "Success",
        "User account has been deleted successfully",
        [
          { 
            text: "OK",
            onPress: () => navigation.goBack()
          }
        ]
      );
    } catch (error) {
      console.error('Error deleting user:', error);
      
      Alert.alert(
        "Error",
        `Failed to delete user: ${error.message}`,
        [{ text: "OK" }]
      );
    } finally {
      setIsDeletingUser(false);
    }
  }, [user, navigation]);

  const handleDeleteUser = useCallback(() => {
    Alert.alert(
      "Delete User",
      `Are you sure you want to delete this user account? This action cannot be undone.`,
      [
        { 
          text: "Cancel",
          style: "cancel"
        },
        {
          text: "Delete",
          style: "destructive",
          onPress: confirmDeleteUser
        }
      ]
    );
  }, [confirmDeleteUser]);

  return (
    <SafeAreaView style={styles.container}>
      <UserInformationHeader user={user} onDeleteUser={handleDeleteUser} isDeleting={isDeletingUser} />
      
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.profileSection}>
          <View style={styles.avatarContainer}>
            <View style={[styles.avatar, { backgroundColor: getProfileColor(user.id) }]}>
              <Text style={styles.avatarText}>{firstName ? firstName.charAt(0) : (user.username ? user.username.charAt(0) : '?')}</Text>
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
                  This account is currently inactive. Toggle the account status to activate it.
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
              {isUpdatingStatus ? (
                <ActivityIndicator size="small" color="#0ea5e9" style={{ marginLeft: 10 }} />
              ) : (
                <TouchableOpacity 
                  style={[styles.toggleSwitch, { backgroundColor: isAccountActive ? '#23C16B' : '#D1D5DB' }]}
                  onPress={handleAccountStatusToggle}
                  activeOpacity={0.8}
                  disabled={isUpdatingStatus}
                >
                  <View style={[styles.toggleHandle, { 
                    transform: [{ translateX: isAccountActive ? 20 : 0 }] 
                  }]} />
                </TouchableOpacity>
              )}
            </View>
          </View>
        </View>

        {/* Form Section */}
        <View style={styles.formSection}>
          <Text style={styles.sectionTitle}>User Details</Text>
          
          {/* Country */}
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Country*</Text>
            {isEditing ? (
              <TouchableOpacity 
                style={styles.textInput}
                onPress={() => setIsCountryModalVisible(true)}
              >
                <View style={styles.countryFlagContainer}>
                  {getCountryCodeFromName(editableFields.country) === 'US' && <UsFlag width={20} height={20} />}
                  {getCountryCodeFromName(editableFields.country) === 'PH' && <PhFlag width={20} height={20} />}
                  {getCountryCodeFromName(editableFields.country) === 'TH' && <ThFlag width={20} height={20} />}
                  {getCountryCodeFromName(editableFields.country) === 'ID' && <IdFlag width={20} height={20} />}
                  <Text style={{ color: editableFields.country ? '#1F2937' : '#9CA3AF', marginLeft: 8 }}>
                    {editableFields.country || 'Select Country'}
                  </Text>
                </View>
              </TouchableOpacity>
            ) : (
              <View style={styles.dropdownContainer}>
                <View style={styles.countryFlagContainer}>
                  {getCountryCodeFromName(editableFields.country) === 'US' && <UsFlag width={20} height={20} />}
                  {getCountryCodeFromName(editableFields.country) === 'PH' && <PhFlag width={20} height={20} />}
                  {getCountryCodeFromName(editableFields.country) === 'TH' && <ThFlag width={20} height={20} />}
                  {getCountryCodeFromName(editableFields.country) === 'ID' && <IdFlag width={20} height={20} />}
                  <Text style={styles.dropdownText}>{editableFields.country || 'Select Country'}</Text>
                </View>
                
              </View>
            )}
          </View>
          
          {/* Garden/Company Name - Only show for non-Buyer roles */}
          {user.role !== 'Buyer' && user.role !== 'buyer' && (
            <View style={styles.formRow}>
              <Text style={styles.formLabel}>Garden / company name*</Text>
              {isEditing ? (
                <TextInput
                  style={styles.textInput}
                  value={editableFields.gardenOrCompanyName}
                  onChangeText={(text) => setEditableFields(prev => ({...prev, gardenOrCompanyName: text}))}
                  placeholder="Enter garden or company name"
                />
              ) : (
                <Text style={styles.formValue}>{editableFields.gardenOrCompanyName || (user.role === 'Seller' ? 'Not provided' : 'N/A')}</Text>
              )}
            </View>
          )}
          
          {/* First Name */}
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>First name*</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editableFields.firstName}
                onChangeText={(text) => setEditableFields(prev => ({...prev, firstName: text}))}
                placeholder="Enter first name"
              />
            ) : (
              <Text style={styles.formValue}>{editableFields.firstName || 'Not provided'}</Text>
            )}
          </View>
          
          {/* Last Name */}
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Last name*</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editableFields.lastName}
                onChangeText={(text) => setEditableFields(prev => ({...prev, lastName: text}))}
                placeholder="Enter last name"
              />
            ) : (
              <Text style={styles.formValue}>{editableFields.lastName || 'Not provided'}</Text>
            )}
          </View>
          
          {/* Contact Number */}
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Contact number*</Text>
            {isEditing ? (
              <TextInput
                style={styles.textInput}
                value={editableFields.contactNumber}
                onChangeText={(text) => setEditableFields(prev => ({...prev, contactNumber: text}))}
                placeholder="Enter contact number"
                keyboardType="phone-pad"
              />
            ) : (
              <Text style={styles.formValue}>{editableFields.contactNumber || 'Not provided'}</Text>
            )}
          </View>
          
          {/* Email Address */}
          <View style={styles.formRow}>
            <Text style={styles.formLabel}>Email address*</Text>
            <Text style={styles.formValue}>{user.email || (user.username ? `${user.username}@gmail.com` : 'Not provided')}</Text>
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
        <TouchableOpacity 
          style={[styles.updateButton, isUpdatingProfile && styles.disabledButton]} 
          activeOpacity={0.8}
          onPress={toggleEditMode}
          disabled={isUpdatingProfile}
        >
          {isUpdatingProfile ? (
            <ActivityIndicator color="#FFFFFF" />
          ) : (
            <Text style={styles.updateButtonText}>
              {isEditing ? 'Save Changes' : 'Edit Information'}
            </Text>
          )}
        </TouchableOpacity>
      </ScrollView>
      
      {/* Country Selection Modal */}
      <Modal
        visible={isCountryModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setIsCountryModalVisible(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.modalContent}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Select Country</Text>
              <TouchableOpacity
                style={styles.closeButton}
                onPress={() => setIsCountryModalVisible(false)}
              >
                <Text style={styles.closeButtonText}>✕</Text>
              </TouchableOpacity>
            </View>
            
            <ScrollView>
              {countries.map((country) => (
                <TouchableOpacity
                  key={country.code}
                  style={styles.countryOption}
                  onPress={() => handleCountrySelect(country)}
                >
                  <View style={styles.countryFlagContainer}>
                    {country.code === 'US' && <UsFlag width={24} height={24} />}
                    {country.code === 'PH' && <PhFlag width={24} height={24} />}
                    {country.code === 'TH' && <ThFlag width={24} height={24} />}
                    {country.code === 'ID' && <IdFlag width={24} height={24} />}
                    <Text style={styles.countryName}>{country.name}</Text>
                  </View>
                  {editableFields.country === country.name && (
                    <CheckedBoxIcon width={24} height={24} />
                  )}
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
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
    color: '#1F2937',
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
    marginTop: 0,
    marginBottom: 100,
  },
  updateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
  disabledButton: {
    backgroundColor: '#93C5FD',
    opacity: 0.7,
  },
  textInput: {
    fontSize: 16,
    color: '#1F2937',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#0ea5e9',
  },
  errorText: {
    fontSize: 16,
    color: '#EF4444',
    textAlign: 'center',
    marginTop: 100,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 16,
    maxHeight: '70%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  closeButton: {
    padding: 8,
  },
  closeButtonText: {
    fontSize: 18,
    color: '#6B7280',
  },
  countryOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#F1F2F6',
  },
  countryFlagContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  countryName: {
    fontSize: 16,
    color: '#1F2937',
    marginLeft: 8,
  },
});

export default UserInformation;
