import React, {useState, useEffect} from 'react';
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
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import EditIcon from '../../../assets/admin-icons/edit.svg';
import {updateAdminApi} from '../../../components/Api';

const EditAdmin = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const {admin} = route.params || {};

  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    firstName: admin?.firstName || '',
    lastName: admin?.lastName || '',
    phoneNumber: admin?.phoneNumber || '',
    email: admin?.email || '',
    profileImage: admin?.profileImage || null,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (field, value) => {
    setFormData(prev => ({...prev, [field]: value}));
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
      };

      console.log('Updating admin with data:', updateData);

      const response = await updateAdminApi(updateData);

      if (response.success) {
        Alert.alert(
          'Success',
          `Admin ${formData.firstName} ${formData.lastName} has been updated successfully!`,
          [
            {
              text: 'OK',
              onPress: () => navigation.goBack(),
            },
          ],
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to update admin');
      }
    } catch (error) {
      console.error('Error updating admin:', error);
      Alert.alert(
        'Error',
        error.message || 'An error occurred while updating the admin',
      );
    } finally {
      setLoading(false);
    }
  };

  const handleEditAvatar = () => {
    Alert.alert('Edit Avatar', 'Avatar editing functionality coming soon');
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
          <Text style={styles.headerTitle}>Edit Admin</Text>
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
              <TouchableOpacity
                style={styles.editAvatarButton}
                onPress={handleEditAvatar}>
                <EditIcon width={16} height={16} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Email Display */}
          <View style={styles.emailContainer}>
            <Text style={styles.emailText}>{formData.email}</Text>
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
              style={[
                styles.submitButton,
                loading && {opacity: 0.6},
              ]}
              onPress={handleSubmit}
              disabled={loading}>
              {loading ? (
                <ActivityIndicator color="#FFFFFF" />
              ) : (
                <Text style={styles.submitButtonText}>Update Account</Text>
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
    position: 'relative',
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
  editAvatarButton: {
    position: 'absolute',
    right: -15,
    top: '50%',
    marginTop: -17,
    width: 34,
    height: 34,
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
    borderColor: '#CDD3D4',
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
    backgroundColor: '#C0DAC2',
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

export default EditAdmin;
