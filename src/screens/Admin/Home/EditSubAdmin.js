import React, {useState} from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  Alert,
  ActivityIndicator,
  Image,
  Switch,
  Modal,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import TrashIcon from '../../../assets/icons/greydark/trash-regular.svg';
import {updateAdminApi, deleteAdminApi} from '../../../components/Api';

const EditSubAdmin = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {admin} = route.params || {};

  const [loading, setLoading] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);
  const [formData, setFormData] = useState({
    firstName: admin?.firstName || '',
    lastName: admin?.lastName || '',
    phoneNumber: admin?.phoneNumber || '',
    email: admin?.email || '',
    status: admin?.status === 'active',
    role: admin?.role || 'sub_admin',
    profileImage: admin?.profileImage || null,
  });

  const [errors, setErrors] = useState({});

  const roleOptions = [
    {label: 'Admin', value: 'admin'},
    {label: 'Sub Admin', value: 'sub_admin'},
  ];

  const handleChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: ''}));
    }
  };

  const handleRoleSelect = (role) => {
    setFormData(prev => ({...prev, role: role}));
    setShowRoleDropdown(false);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.firstName.trim()) {
      newErrors.firstName = 'First name is required';
    }

    if (!formData.lastName.trim()) {
      newErrors.lastName = 'Last name is required';
    }

    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = 'Contact number is required';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    if (!validateForm()) {
      Alert.alert('Validation Error', 'Please fix the errors before submitting');
      return;
    }

    setLoading(true);
    try {
      const updateData = {
        adminId: admin.adminId || admin.uid,
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        status: formData.status ? 'active' : 'inactive',
        role: formData.role,
      };

      console.log('Updating sub-admin with data:', updateData);

      const response = await updateAdminApi(updateData);

      if (response.success) {
        const roleChangeMessage = formData.role === 'admin' 
          ? ' and promoted to Admin'
          : '';
        Alert.alert(
          'Success',
          `${formData.firstName} ${formData.lastName} has been updated successfully${roleChangeMessage}!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to update sub admin');
      }
    } catch (error) {
      console.error('Error updating sub-admin:', error);
      Alert.alert(
        'Error',
        error.message || 'An error occurred while updating the sub admin',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = () => {
    setShowDeleteModal(true);
  };

  const confirmDelete = async () => {
    setShowDeleteModal(false);
    setLoading(true);
    try {
      const adminId = admin.adminId || admin.uid;
      const response = await deleteAdminApi(adminId);
      
      Alert.alert(
        'Success',
        response.message || `${formData.firstName} ${formData.lastName} has been deleted successfully!`,
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ],
      );
    } catch (error) {
      console.error('Error deleting sub-admin:', error);
      Alert.alert(
        'Error',
        error.message || 'An error occurred while deleting the sub admin',
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.statusBar} />
        <View style={styles.headerContent}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}>
            <BackIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Edit Sub Admin</Text>
          <View style={styles.navbarRight}>
            <TouchableOpacity style={styles.actionButton} onPress={handleDelete}>
              <TrashIcon width={24} height={24} />
            </TouchableOpacity>
          </View>
        </View>
      </View>

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardAvoidingView}>
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollViewContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled">
          {/* Avatar Section */}
          <View style={styles.avatarContainer}>
            <View style={styles.avatarWrapper}>
              {formData.profileImage ? (
                <Image
                  source={{uri: formData.profileImage}}
                  style={styles.avatar}
                />
              ) : (
                <View style={styles.avatarPlaceholder}>
                  <Text style={styles.avatarText}>
                    {formData.firstName.charAt(0).toUpperCase()}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Email Display */}
          <View style={styles.emailContainer}>
            <Text style={styles.emailText}>{formData.email}</Text>
          </View>

          {/* Status Toggle */}
          <View style={styles.statusContainer}>
            <View style={styles.toggleWrapper}>
              <Text style={styles.statusLabel}>Status</Text>
              <View style={styles.toggleControl}>
                <Text style={styles.toggleText}>
                  {formData.status ? 'Active' : 'Inactive'}
                </Text>
                <Switch
                  value={formData.status}
                  onValueChange={value => handleChange('status', value)}
                  trackColor={{false: '#CDD3D4', true: '#539461'}}
                  thumbColor="#FFFFFF"
                  ios_backgroundColor="#CDD3D4"
                  disabled={loading}
                />
              </View>
            </View>
          </View>

          {/* Role Dropdown */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Role</Text>
              <TouchableOpacity
                style={[
                  styles.dropdownButton,
                  errors.role && styles.textFieldError,
                ]}
                onPress={() => setShowRoleDropdown(true)}
                disabled={loading}>
                <Text style={styles.dropdownButtonText}>
                  {roleOptions.find(opt => opt.value === formData.role)?.label ||
                    'Select Role'}
                </Text>
                <View style={styles.dropdownIcon}>
                  <Text style={styles.dropdownIconText}>▼</Text>
                </View>
              </TouchableOpacity>
              {errors.role && (
                <Text style={styles.errorText}>{errors.role}</Text>
              )}
            </View>
          </View>

          {/* First Name */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>First Name</Text>
              <TextInput
                style={[
                  styles.textField,
                  errors.firstName && styles.textFieldError,
                ]}
                placeholder="Enter first name"
                placeholderTextColor="#647276"
                value={formData.firstName}
                onChangeText={value => handleChange('firstName', value)}
                autoCapitalize="words"
                editable={!loading}
              />
              {errors.firstName && (
                <Text style={styles.errorText}>{errors.firstName}</Text>
              )}
            </View>
          </View>

          {/* Last Name */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Last Name</Text>
              <TextInput
                style={[
                  styles.textField,
                  errors.lastName && styles.textFieldError,
                ]}
                placeholder="Enter last name"
                placeholderTextColor="#647276"
                value={formData.lastName}
                onChangeText={value => handleChange('lastName', value)}
                autoCapitalize="words"
                editable={!loading}
              />
              {errors.lastName && (
                <Text style={styles.errorText}>{errors.lastName}</Text>
              )}
            </View>
          </View>

          {/* Contact Number */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>Contact Number</Text>
              <TextInput
                style={[
                  styles.textField,
                  errors.phoneNumber && styles.textFieldError,
                ]}
                placeholder="Enter contact number"
                placeholderTextColor="#647276"
                value={formData.phoneNumber}
                onChangeText={value => handleChange('phoneNumber', value)}
                keyboardType="phone-pad"
                editable={!loading}
              />
              {errors.phoneNumber && (
                <Text style={styles.errorText}>{errors.phoneNumber}</Text>
              )}
            </View>
          </View>

          {/* Submit Button */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.submitButton, loading && {opacity: 0.6}]}
              onPress={handleSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Save Changes</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Home Indicator */}
      <View style={styles.homeIndicator}>
        <View style={styles.gestureBar} />
      </View>

      {/* Role Dropdown Modal */}
      <Modal
        visible={showRoleDropdown}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowRoleDropdown(false)}>
        <TouchableOpacity
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowRoleDropdown(false)}>
          <View style={styles.dropdownModalContent}>
            <View style={styles.dropdownList}>
              {roleOptions.map((option, index) => (
                <TouchableOpacity
                  key={option.value}
                  style={[
                    styles.dropdownItem,
                    index === roleOptions.length - 1 &&
                      styles.dropdownItemLast,
                    formData.role === option.value &&
                      styles.dropdownItemSelected,
                  ]}
                  onPress={() => handleRoleSelect(option.value)}>
                  <Text
                    style={[
                      styles.dropdownItemText,
                      formData.role === option.value &&
                        styles.dropdownItemTextSelected,
                    ]}>
                    {option.label}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableOpacity>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        visible={showDeleteModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalContainer}>
            {/* Popover */}
            <View style={styles.popover}>
              {/* Text Section */}
              <View style={styles.textSection}>
                <Text style={styles.modalTitle}>Delete Sub Admin</Text>
                <Text style={styles.modalMessage}>
                  Are you sure you want to delete {formData.firstName} {formData.lastName}?
                </Text>
              </View>

              {/* Action Section */}
              <View style={styles.actionSection}>
                {/* Delete Button */}
                <TouchableOpacity
                  style={styles.deleteButton}
                  onPress={confirmDelete}
                  disabled={loading}>
                  {loading ? (
                    <ActivityIndicator color="#E7522F" />
                  ) : (
                    <Text style={styles.deleteButtonText}>Delete</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>

            {/* Cancel Button */}
            <TouchableOpacity
              style={styles.cancelButton}
              onPress={() => setShowDeleteModal(false)}
              disabled={loading}>
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    paddingTop: 0,
    minHeight: 106,
  },
  statusBar: {
    width: '100%',
    height: 48,
  },
  headerContent: {
    width: '100%',
    height: 58,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 6,
    paddingBottom: 12,
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    position: 'absolute',
    width: 240,
    left: '50%',
    marginLeft: -120,
    top: 14,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
  },
  navbarRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    position: 'absolute',
    right: 16,
    gap: 12,
  },
  actionButton: {
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: 0,
    paddingBottom: 34,
  },
  avatarContainer: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  avatarWrapper: {
    width: 96,
    height: 96,
    borderRadius: 48,
  },
  avatar: {
    width: 96,
    height: 96,
    borderRadius: 48,
    borderWidth: 1,
    borderColor: '#539461',
  },
  avatarPlaceholder: {
    width: 96,
    height: 96,
    borderRadius: 48,
    backgroundColor: '#F0F7F2',
    borderWidth: 1,
    borderColor: '#539461',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarText: {
    fontSize: 36,
    fontWeight: '700',
    color: '#539461',
  },
  emailContainer: {
    width: '100%',
    height: 34,
    paddingHorizontal: 24,
    paddingBottom: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emailText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#202325',
  },
  statusContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  toggleWrapper: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 4,
  },
  statusLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  toggleControl: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#539461',
  },
  inputContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  inputWrapper: {
    width: '100%',
    gap: 8,
  },
  label: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
  },
  textField: {
    width: '100%',
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#647276',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  textFieldError: {
    borderColor: '#E53935',
  },
  errorText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#E53935',
    marginTop: 4,
  },
  dropdownButton: {
    width: '100%',
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#647276',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  dropdownButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 1,
  },
  dropdownIcon: {
    marginLeft: 8,
  },
  dropdownIconText: {
    fontSize: 12,
    color: '#647276',
  },
  dropdownModalContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  dropdownList: {
    width: '100%',
    maxWidth: 400,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    overflow: 'hidden',
  },
  dropdownItem: {
    width: '100%',
    paddingVertical: 16,
    paddingHorizontal: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#CDD3D4',
  },
  dropdownItemLast: {
    borderBottomWidth: 0,
  },
  dropdownItemSelected: {
    backgroundColor: '#F0F7F2',
  },
  dropdownItemText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  dropdownItemTextSelected: {
    fontWeight: '600',
    color: '#539461',
  },
  actionContainer: {
    width: '100%',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
  },
  submitButton: {
    width: '100%',
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  submitButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  homeIndicator: {
    position: 'absolute',
    width: '100%',
    height: 34,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gestureBar: {
    width: 148,
    height: 5,
    backgroundColor: '#202325',
    borderRadius: 100,
    marginBottom: 8,
  },
  // Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  modalContainer: {
    width: 340,
    flexDirection: 'column',
    alignItems: 'stretch',
    gap: 8,
  },
  popover: {
    width: 340,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingTop: 16,
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  textSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 8,
    alignItems: 'center',
  },
  modalTitle: {
    width: '100%',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#202325',
  },
  modalMessage: {
    width: '100%',
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#647276',
  },
  actionSection: {
    width: '100%',
    flexDirection: 'column',
    alignItems: 'stretch',
  },
  deleteButton: {
    width: '100%',
    height: 48,
    minHeight: 48,
    borderTopWidth: 1,
    borderTopColor: '#CDD3D4',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  deleteButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#E7522F',
  },
  cancelButton: {
    width: 340,
    height: 48,
    minHeight: 48,
    backgroundColor: '#F5F6F6',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#393D40',
  },
});

export default EditSubAdmin;
