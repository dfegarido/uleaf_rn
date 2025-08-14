import React, {useContext, useEffect, useState} from 'react';
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
  Alert,
} from 'react-native';
import {AuthContext} from '../../../auth/AuthProvider';
import {useIsFocused, useNavigation} from '@react-navigation/native';
import {getAdminInfoApi, updateAdminInfoApi} from '../../../components/Api';

// Import icons
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import AvatarIcon from '../../../assets/admin-icons/avatar.svg';
import EditIcon from '../../../assets/EditIcon';

const AdminAccountInformationScreen = () => {
  const navigation = useNavigation();
  const {userInfo} = useContext(AuthContext);
  const isFocused = useIsFocused();
  
  const [loading, setLoading] = useState(false);
  const [initialLoading, setInitialLoading] = useState(true);
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [adminId, setAdminId] = useState('');
  const [originalData, setOriginalData] = useState({});
  const [hasChanges, setHasChanges] = useState(false);

  // Fetch admin info from API
  const fetchAdminInfo = async () => {
    try {
      setInitialLoading(true);
      const adminData = await getAdminInfoApi();
      
      if (adminData && adminData.success && adminData.data) {
        const userData = adminData.data;
        console.log('Admin API Response:', userData); // Debug log
        const newFirstName = userData.firstName || '';
        const newLastName = userData.lastName || '';
        const newEmail = userData.email || '';
        const newAdminId = userData.uid || userData.adminId || userData.id || userData._id || '';
        
        console.log('Extracted adminId:', newAdminId); // Debug log
        setFirstName(newFirstName);
        setLastName(newLastName);
        setEmail(newEmail);
        setAdminId(newAdminId);
        
        setOriginalData({
          firstName: newFirstName,
          lastName: newLastName,
        });
      }
    } catch (error) {
      console.error('Error fetching admin info:', error);
      Alert.alert('Error', 'Failed to load admin information. Please try again.');
    } finally {
      setInitialLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchAdminInfo();
    }
  }, [isFocused]);

  // Fallback to userInfo if API fails
  useEffect(() => {
    if (userInfo && initialLoading) {
      const userData = userInfo.user || userInfo;
      const newFirstName = userData.firstName || '';
      const newLastName = userData.lastName || '';
      const newEmail = userData.email || '';
      const newAdminId = userData.uid || userData.adminId || userData.id || userData._id || '';
      
      setFirstName(newFirstName);
      setLastName(newLastName);
      setEmail(newEmail);
      setAdminId(newAdminId);
      
      setOriginalData({
        firstName: newFirstName,
        lastName: newLastName,
      });
      setInitialLoading(false);
    }
  }, [userInfo, initialLoading]);

  // Check for changes in form fields
  useEffect(() => {
    if (Object.keys(originalData).length === 0) return;
    
    const currentData = {
      firstName,
      lastName,
    };
    
    const hasFormChanges = JSON.stringify(currentData) !== JSON.stringify(originalData);
    setHasChanges(hasFormChanges);
  }, [firstName, lastName, originalData]);

  const validateForm = () => {
    let errors = [];

    if (!firstName.trim()) errors.push('First name is required.');
    if (!lastName.trim()) errors.push('Last name is required.');

    return errors;
  };

  const handleRefresh = () => {
    // Clear all state and refetch
    setFirstName('');
    setLastName('');
    setEmail('');
    setAdminId('');
    setOriginalData({});
    setHasChanges(false);
    fetchAdminInfo();
  };

  const handleSave = async () => {
    const errors = validateForm();
    
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    // Check if we have adminId
    if (!adminId) {
      console.log('Admin ID is missing:', adminId); // Debug log
      Alert.alert(
        'Error', 
        'Admin ID not found. Please refresh and try again.',
        [
          { text: 'Refresh', onPress: handleRefresh },
          { text: 'Cancel', style: 'cancel' }
        ]
      );
      return;
    }

    console.log('Saving with adminId:', adminId); // Debug log
    setLoading(true);

    try {
      // Prepare data for API - only send editable fields (firstName, lastName)
      // Email is read-only and should not be updated from this screen
      const updateData = {
        adminId: adminId,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
      };

      console.log('Update data being sent:', updateData); // Debug log
      
      // Call API to update admin info
      const response = await updateAdminInfoApi(updateData);
      
      if (response && response.success) {
        Alert.alert('Success', 'Account information updated successfully!');
        
        // Reset changes flag and update original data
        setHasChanges(false);
        const updatedOriginalData = {
          firstName,
          lastName,
        };
        setOriginalData(updatedOriginalData);
      } else {
        throw new Error(response?.error || response?.message || 'Failed to update account information');
      }
      
    } catch (error) {
      console.log('Update Account Error:', error.message);
      // Show the actual backend error message
      const errorMessage = error.message.includes('Admin not found') 
        ? 'Admin ID not found. Please refresh and try again.'
        : error.message || 'Failed to update account information. Please try again.';
      Alert.alert('Error', errorMessage);
    } finally {
      setLoading(false);
    }
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

      {/* Show loading indicator for initial data fetch */}
      {initialLoading ? (
        <View style={styles.initialLoadingContainer}>
          <ActivityIndicator size="large" color="#699E73" />
          <Text style={styles.loadingText}>Loading admin information...</Text>
        </View>
      ) : (
        /* Content */
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Form */}
        <View style={styles.form}>
          {/* Avatar Section */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarContainer}>
              <AvatarIcon width={96} height={96} />
            </View>
            <TouchableOpacity style={styles.editButton} disabled>
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
                  placeholder="Enter first name"
                  placeholderTextColor="#888888"
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
                  placeholder="Enter last name"
                  placeholderTextColor="#888888"
                />
              </View>
            </View>
          </View>

          {/* Action Button */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={[
                styles.saveButton,
                !hasChanges && styles.saveButtonDisabled
              ]} 
              onPress={handleSave}
              disabled={!hasChanges}
            >
              <View style={styles.buttonTextContainer}>
                <Text style={[
                  styles.buttonText,
                  !hasChanges && styles.buttonTextDisabled
                ]}>
                  Update Account
                </Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
      )}
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
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202325',
  },
  headerSpacer: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  form: {
    paddingBottom: 100,
  },
  avatarSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 24,
    position: 'relative',
  },
  avatarContainer: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F2F7F3',
    justifyContent: 'center',
    alignItems: 'center',
  },
  editButton: {
    position: 'absolute',
    width: 34,
    height: 34,
    right: 140,
    top: 67,
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    opacity: 0.5,
  },
  emailSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  emailText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    textAlign: 'center',
  },
  inputSection: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  inputField: {
    gap: 8,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202325',
  },
  requiredAsterisk: {
    color: '#FF6B6B',
  },
  textField: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 0,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
  },
  disabledField: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
  },
  textInput: {
    fontSize: 16,
    color: '#202325',
    flex: 1,
    paddingVertical: 12,
  },
  disabledInput: {
    color: '#6B7280',
  },
  actionSection: {
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 12,
  },
  saveButton: {
    backgroundColor: '#539461',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  saveButtonDisabled: {
    backgroundColor: '#C4C4C4',
  },
  buttonTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    textAlign: 'center',
  },
  buttonTextDisabled: {
    color: '#888888',
  },
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  initialLoadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 50,
  },
  loadingText: {
    fontSize: 16,
    color: '#556065',
    marginTop: 16,
    textAlign: 'center',
  },
});

export default AdminAccountInformationScreen;
