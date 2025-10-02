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
  Modal,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import {createAdminApi} from '../../../components/Api';

const roleOptions = [
  { label: 'Admin', value: 'admin' },
  { label: 'Sub Admin', value: 'sub_admin' },
];

const AddAdmin = () => {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(false);
  const [showRoleDropdown, setShowRoleDropdown] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    firstName: '',
    lastName: '',
    phoneNumber: '',
    email: '',
    password: '',
    role: 'sub_admin', // default to sub_admin
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({...prev, [field]: ''}));
    }
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
    } else if (!/^\+?[\d\s-()]+$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid phone number format';
    }

    if (!formData.email.trim()) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Invalid email format';
    }

    if (!formData.password.trim()) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters';
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
      const adminData = {
        firstName: formData.firstName.trim(),
        lastName: formData.lastName.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: formData.role,
        status: 'active',
      };

      console.log('Creating admin with data:', {
        ...adminData,
        password: '***hidden***',
      });

      const response = await createAdminApi(adminData);

      if (response.success) {
        Alert.alert(
          'Success',
          `Admin user ${formData.firstName} ${formData.lastName} has been created successfully!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        Alert.alert(
          'Error',
          response.error || 'Failed to create admin user',
        );
      }
    } catch (error) {
      console.error('Error creating admin:', error);
      Alert.alert(
        'Error',
        error.message || 'An error occurred while creating the admin user',
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
          <Text style={styles.headerTitle}>Enroll Admin</Text>
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
          {/* First Name */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>
                First Name <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={[styles.textField, errors.firstName && styles.textFieldError]}
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
              <Text style={styles.label}>
                Last Name <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={[styles.textField, errors.lastName && styles.textFieldError]}
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
              <Text style={styles.label}>
                Contact Number <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={[styles.textField, errors.phoneNumber && styles.textFieldError]}
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

          {/* Email */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>
                Email Address <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={[styles.textField, errors.email && styles.textFieldError]}
                placeholder="Enter email address"
                placeholderTextColor="#647276"
                value={formData.email}
                onChangeText={value => handleChange('email', value)}
                keyboardType="email-address"
                autoCapitalize="none"
                editable={!loading}
              />
              {errors.email && (
                <Text style={styles.errorText}>{errors.email}</Text>
              )}
            </View>
          </View>

          {/* Password */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>
                Password <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TextInput
                style={[styles.textField, errors.password && styles.textFieldError]}
                placeholder="Enter password (min 8 characters)"
                placeholderTextColor="#647276"
                value={formData.password}
                onChangeText={value => handleChange('password', value)}
                secureTextEntry
                autoCapitalize="none"
                editable={!loading}
              />
              {errors.password && (
                <Text style={styles.errorText}>{errors.password}</Text>
              )}
            </View>
          </View>

          {/* Role Selection */}
          <View style={styles.inputContainer}>
            <View style={styles.inputWrapper}>
              <Text style={styles.label}>
                Role <Text style={styles.requiredAsterisk}>*</Text>
              </Text>
              <TouchableOpacity
                style={[styles.dropdown, errors.role && styles.textFieldError]}
                onPress={() => !loading && setShowRoleDropdown(true)}
                disabled={loading}>
                <Text
                  style={[
                    styles.dropdownText,
                    !formData.role && styles.dropdownPlaceholder,
                  ]}>
                  {formData.role
                    ? roleOptions.find(opt => opt.value === formData.role)?.label
                    : 'Select role'}
                </Text>
                <DownIcon width={20} height={20} />
              </TouchableOpacity>
              {errors.role && (
                <Text style={styles.errorText}>{errors.role}</Text>
              )}
            </View>
          </View>

          {/* Role Dropdown Modal */}
          <Modal
            visible={showRoleDropdown}
            transparent
            animationType="fade"
            onRequestClose={() => setShowRoleDropdown(false)}>
            <TouchableOpacity
              style={styles.modalOverlay}
              activeOpacity={1}
              onPress={() => setShowRoleDropdown(false)}>
              <View style={styles.modalContent}>
                {roleOptions.map(option => (
                  <TouchableOpacity
                    key={option.value}
                    style={[
                      styles.modalOption,
                      formData.role === option.value && styles.modalOptionSelected,
                    ]}
                    onPress={() => {
                      handleChange('role', option.value);
                      setShowRoleDropdown(false);
                    }}>
                    <Text
                      style={[
                        styles.modalOptionText,
                        formData.role === option.value &&
                          styles.modalOptionTextSelected,
                      ]}>
                      {option.label}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </TouchableOpacity>
          </Modal>

          {/* Submit Button */}
          <View style={styles.actionContainer}>
            <TouchableOpacity
              style={[styles.submitButton, loading && styles.submitButtonDisabled]}
              onPress={handleSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Submit</Text>
              )}
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

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
  keyboardAvoidingView: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollViewContent: {
    paddingTop: 24,
    paddingBottom: 34,
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
  requiredAsterisk: {
    color: '#E53935',
    fontSize: 16,
    fontWeight: '500',
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
  textFieldMultiline: {
    height: 96,
    paddingTop: 12,
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
  dropdown: {
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
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  dropdownText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 1,
  },
  dropdownPlaceholder: {
    color: '#647276',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    width: '100%',
    maxWidth: 300,
    overflow: 'hidden',
  },
  modalOption: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EAEB',
  },
  modalOptionSelected: {
    backgroundColor: '#F0F7F2',
  },
  modalOptionText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    textAlign: 'center',
  },
  modalOptionTextSelected: {
    color: '#539461',
    fontWeight: '700',
  },
  roleContainer: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 4,
  },
  roleButton: {
    flex: 1,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#647276',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  roleButtonActive: {
    backgroundColor: '#539461',
    borderColor: '#539461',
  },
  roleButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#647276',
  },
  roleButtonTextActive: {
    color: '#FFFFFF',
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
  submitButtonDisabled: {
    opacity: 0.6,
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
});

export default AddAdmin;
