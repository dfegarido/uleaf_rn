import React, {useState} from 'react';
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
import {useNavigation} from '@react-navigation/native';

// Import icons
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import EyeIcon from '../../../assets/icons/greydark/eye-regular.svg';
import EyeSlashIcon from '../../../assets/icons/greydark/eye-closed-regular.svg';

const AdminUpdatePasswordScreen = () => {
  const navigation = useNavigation();
  
  const [loading, setLoading] = useState(false);
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Password requirements
  const PASSWORD_REQUIREMENTS = [
    { test: (pwd) => pwd.length >= 8, text: 'At least 8 characters' },
    { test: (pwd) => /[A-Z]/.test(pwd), text: 'One uppercase letter' },
    { test: (pwd) => /[a-z]/.test(pwd), text: 'One lowercase letter' },
    { test: (pwd) => /\d/.test(pwd), text: 'One number' },
    { test: (pwd) => /[!@#$%^&*(),.?":{}|<>]/.test(pwd), text: 'One special character' },
  ];

  const passwordChecks = PASSWORD_REQUIREMENTS.map(req => req.test(newPassword));
  const isPasswordValid = passwordChecks.every(Boolean);
  const passwordsMatch = newPassword === confirmPassword;
  const canSubmit = currentPassword && isPasswordValid && passwordsMatch;

  const validateForm = () => {
    let errors = [];

    if (!currentPassword) errors.push('Current password is required.');
    if (!newPassword) errors.push('New password is required.');
    if (!confirmPassword) errors.push('Please confirm your new password.');
    if (!isPasswordValid) errors.push('New password does not meet requirements.');
    if (!passwordsMatch) errors.push('Passwords do not match.');

    return errors;
  };

  const handleUpdatePassword = async () => {
    const errors = validateForm();
    
    if (errors.length > 0) {
      Alert.alert('Validation Error', errors.join('\n'));
      return;
    }

    setLoading(true);

    try {
      // Here you would typically call an API to update the password
      // For now, we'll just simulate a successful update
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      Alert.alert(
        'Success', 
        'Password updated successfully!',
        [
          {
            text: 'OK',
            onPress: () => navigation.goBack(),
          },
        ]
      );
      
      // Clear form
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
      
    } catch (error) {
      console.log('Update Password:', error.message);
      Alert.alert('Error', 'Failed to update password. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const PasswordInput = ({
    label,
    value,
    onChangeText,
    placeholder,
    showPassword,
    onToggleShow,
    required = false,
  }) => (
    <View style={styles.inputSection}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.requiredAsterisk}>*</Text>}
      </Text>
      <View style={styles.passwordField}>
        <TextInput
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#888888"
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={onToggleShow}
        >
          {showPassword ? (
            <EyeSlashIcon width={20} height={20} fill="#888888" />
          ) : (
            <EyeIcon width={20} height={20} fill="#888888" />
          )}
        </TouchableOpacity>
      </View>
    </View>
  );

  const RequirementItem = ({met, text}) => (
    <View style={styles.requirementItem}>
      <Text style={[styles.requirementBullet, met && styles.requirementMet]}>
        {met ? '✓' : '○'}
      </Text>
      <Text style={[styles.requirementText, met && styles.requirementMet]}>
        {text}
      </Text>
    </View>
  );

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
        <Text style={styles.headerTitle}>Update Password</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.form}>
          {/* Current Password */}
          <PasswordInput
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            showPassword={showCurrentPassword}
            onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
            required
          />

          {/* New Password */}
          <PasswordInput
            label="New Password"
            value={newPassword}
            onChangeText={setNewPassword}
            placeholder="Enter new password"
            showPassword={showNewPassword}
            onToggleShow={() => setShowNewPassword(!showNewPassword)}
            required
          />

          {/* Password Requirements */}
          {newPassword.length > 0 && (
            <View style={styles.requirementsSection}>
              <Text style={styles.requirementsTitle}>Password Requirements:</Text>
              {PASSWORD_REQUIREMENTS.map((req, index) => (
                <RequirementItem
                  key={index}
                  met={req.test(newPassword)}
                  text={req.text}
                />
              ))}
            </View>
          )}

          {/* Confirm Password */}
          <PasswordInput
            label="Confirm New Password"
            value={confirmPassword}
            onChangeText={setConfirmPassword}
            placeholder="Confirm new password"
            showPassword={showConfirmPassword}
            onToggleShow={() => setShowConfirmPassword(!showConfirmPassword)}
            required
          />

          {/* Password Match Indicator */}
          {confirmPassword.length > 0 && (
            <View style={styles.matchSection}>
              <Text style={[
                styles.matchText,
                passwordsMatch ? styles.matchSuccess : styles.matchError
              ]}>
                {passwordsMatch ? '✓ Passwords match' : '✗ Passwords do not match'}
              </Text>
            </View>
          )}

          {/* Action Button */}
          <View style={styles.actionSection}>
            <TouchableOpacity 
              style={[
                styles.updateButton,
                !canSubmit && styles.updateButtonDisabled
              ]} 
              onPress={handleUpdatePassword}
              disabled={!canSubmit}
            >
              <Text style={[
                styles.buttonText,
                !canSubmit && styles.buttonTextDisabled
              ]}>
                Update Password
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
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
    padding: 24,
    paddingBottom: 100,
  },
  inputSection: {
    marginBottom: 20,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202325',
    marginBottom: 8,
  },
  requiredAsterisk: {
    color: '#FF6B6B',
  },
  passwordField: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    minHeight: 48,
  },
  passwordInput: {
    flex: 1,
    fontSize: 16,
    color: '#202325',
    paddingHorizontal: 12,
    paddingVertical: 12,
  },
  eyeButton: {
    padding: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  requirementsSection: {
    marginTop: 12,
    marginBottom: 8,
  },
  requirementsTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202325',
    marginBottom: 8,
  },
  requirementItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  requirementBullet: {
    fontSize: 12,
    color: '#888888',
    marginRight: 8,
    width: 16,
  },
  requirementText: {
    fontSize: 14,
    color: '#888888',
  },
  requirementMet: {
    color: '#539461',
  },
  matchSection: {
    marginTop: 8,
  },
  matchText: {
    fontSize: 14,
    fontWeight: '500',
  },
  matchSuccess: {
    color: '#539461',
  },
  matchError: {
    color: '#FF6B6B',
  },
  actionSection: {
    marginTop: 32,
  },
  updateButton: {
    backgroundColor: '#539461',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  updateButtonDisabled: {
    backgroundColor: '#C4C4C4',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
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
});

export default AdminUpdatePasswordScreen;
