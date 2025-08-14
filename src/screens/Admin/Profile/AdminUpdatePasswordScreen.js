import React, {useState, useRef} from 'react';
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
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {useNavigation} from '@react-navigation/native';
import {updateAdminPasswordApi} from '../../../components/Api';

// Import icons
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import EyeIcon from '../../../assets/icons/greydark/eye-regular.svg';
import EyeSlashIcon from '../../../assets/icons/greydark/eye-closed-regular.svg';

const AdminUpdatePasswordScreen = () => {
  const navigation = useNavigation();
  
  // Refs for input fields
  const currentPasswordRef = useRef(null);
  const newPasswordRef = useRef(null);
  const confirmPasswordRef = useRef(null);
  
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
  const isDifferentPassword = currentPassword !== newPassword;
  const canSubmit = currentPassword.trim() && 
                   newPassword.trim() && 
                   confirmPassword.trim() && 
                   isPasswordValid && 
                   passwordsMatch && 
                   isDifferentPassword;

  const validateForm = () => {
    let errors = [];

    if (!currentPassword.trim()) errors.push('Current password is required.');
    if (!newPassword.trim()) errors.push('New password is required.');
    if (!confirmPassword.trim()) errors.push('Please confirm your new password.');
    if (!isPasswordValid && newPassword.trim()) errors.push('New password does not meet requirements.');
    if (!passwordsMatch && confirmPassword.trim()) errors.push('Passwords do not match.');
    if (currentPassword.trim() === newPassword.trim() && currentPassword.trim() && newPassword.trim()) {
      errors.push('New password must be different from current password.');
    }

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
      // Prepare data for API
      const passwordData = {
        oldPassword: currentPassword.trim(),
        newPassword: newPassword.trim(),
        confirmPassword: confirmPassword.trim(),
      };

      // Call API to update password
      const response = await updateAdminPasswordApi(passwordData);
      
      if (response && response.success) {
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
      } else {
        throw new Error(response?.error || response?.message || 'Failed to update password');
      }
      
    } catch (error) {
      console.log('Update Password Error:', error.message);
      
      // Show more specific error messages
      let errorMessage = 'Failed to update password. Please try again.';
      
      if (error.message.includes('Current password is incorrect')) {
        errorMessage = 'Current password is incorrect. Please check and try again.';
      } else if (error.message.includes('Password must contain')) {
        errorMessage = error.message;
      } else if (error.message.includes('New password must be different')) {
        errorMessage = 'New password must be different from current password.';
      } else if (error.message.includes('do not match')) {
        errorMessage = 'New password and confirm password do not match.';
      }
      
      Alert.alert('Error', errorMessage);
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
    textContentType = "password",
    autoComplete = "password",
    returnKeyType = "next",
    inputRef,
    onSubmitEditing,
  }) => (
    <View style={styles.inputSection}>
      <Text style={styles.inputLabel}>
        {label} {required && <Text style={styles.requiredAsterisk}>*</Text>}
      </Text>
      <View style={styles.passwordField}>
        <TextInput
          ref={inputRef}
          style={styles.passwordInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#888888"
          secureTextEntry={!showPassword}
          autoCapitalize="none"
          autoCorrect={false}
          autoComplete={autoComplete}
          textContentType={textContentType}
          returnKeyType={returnKeyType}
          blurOnSubmit={false}
          onSubmitEditing={onSubmitEditing}
          clearButtonMode="never"
          enablesReturnKeyAutomatically={true}
          keyboardType="default"
          selectTextOnFocus={false}
          caretHidden={false}
          contextMenuHidden={false}
        />
        <TouchableOpacity
          style={styles.eyeButton}
          onPress={onToggleShow}
          activeOpacity={0.7}
          delayPressIn={0}
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
    <KeyboardAvoidingView 
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
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
          style={styles.backButton}
          activeOpacity={0.7}
          delayPressIn={0}
          accessible={true}
          accessibilityLabel="Go back"
          accessibilityRole="button">
          <LeftIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Password</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
        nestedScrollEnabled={false}
        contentContainerStyle={styles.scrollContent}>
        <View style={styles.form}>
          {/* Current Password */}
          <PasswordInput
            label="Current Password"
            value={currentPassword}
            onChangeText={setCurrentPassword}
            placeholder="Enter current password"
            showPassword={showCurrentPassword}
            onToggleShow={() => setShowCurrentPassword(!showCurrentPassword)}
            textContentType="password"
            autoComplete="current-password"
            inputRef={currentPasswordRef}
            onSubmitEditing={() => newPasswordRef.current?.focus()}
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
            textContentType="newPassword"
            autoComplete="new-password"
            inputRef={newPasswordRef}
            onSubmitEditing={() => confirmPasswordRef.current?.focus()}
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
            textContentType="newPassword"
            autoComplete="new-password"
            returnKeyType="done"
            inputRef={confirmPasswordRef}
            onSubmitEditing={canSubmit ? handleUpdatePassword : undefined}
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
    </KeyboardAvoidingView>
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
  scrollContent: {
    flexGrow: 1,
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
