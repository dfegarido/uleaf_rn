import React, {useCallback, useEffect, useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  TextInput,
  Switch,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useNavigation} from '@react-navigation/native';
import {getAppVersionApi, setAppVersionApi} from '../../../components/Api/appVersionApi';
import {version as appVersion} from '../../../../package.json';
import Loading from '../../../components/Loading';

// Import icons
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import EditIcon from '../../../assets/icons/greydark/note-edit.svg';

// Semver format: x.y.z (each part is a non-negative integer, length 1-3)
const SEMVER_REGEX = /^\d{1,3}\.\d{1,3}\.\d{1,3}$/;

const AdminVersionControlScreen = () => {
  const navigation = useNavigation();

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [versionData, setVersionData] = useState(null);
  const [localVersion, setLocalVersion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);

  // Editable form state
  const [minimumVersion, setMinimumVersion] = useState('');
  const [currentVersion, setCurrentVersion] = useState('');
  const [forceUpdate, setForceUpdate] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  const fetchVersionData = useCallback(async (isPullToRefresh = false) => {
    try {
      if (isPullToRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }
      setError(null);

      const response = await getAppVersionApi();
      if (response?.success) {
        // API response shape: { success, data: { minimumVersion, currentVersion, forceUpdate, ... } }
        const data = response?.data?.data || response?.data || null;
        setVersionData(data);
        setLocalVersion(appVersion);
        // Seed the form (only meaningful when user enters edit mode)
        if (data) {
          setMinimumVersion(data.minimumVersion || '');
          setCurrentVersion(data.currentVersion || '');
          setForceUpdate(Boolean(data.forceUpdate));
        }
      } else {
        setError(response?.error || 'Failed to load version information');
      }
    } catch (err) {
      console.error('Error fetching version data:', err);
      setError(err?.message || 'An unexpected error occurred');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchVersionData(false);
  }, [fetchVersionData]);

  const onRefresh = () => fetchVersionData(true);

  // Helper: render a value or dash placeholder
  const renderValue = value => {
    if (value === null || value === undefined || value === '') {
      return <Text style={styles.valueMuted}>—</Text>;
    }
    if (typeof value === 'boolean') {
      return (
        <Text style={[styles.value, value ? styles.valuePositive : styles.valueNegative]}>
          {value ? 'Enabled' : 'Disabled'}
        </Text>
      );
    }
    return <Text style={styles.value}>{String(value)}</Text>;
  };

  const renderRow = (label, value, isLast = false) => (
    <View style={[styles.row, !isLast && styles.rowDivider]}>
      <Text style={styles.rowLabel}>{label}</Text>
      <View style={styles.rowValueWrap}>{renderValue(value)}</View>
    </View>
  );

  const validateForm = () => {
    const errors = {};
    if (!minimumVersion.trim()) {
      errors.minimumVersion = 'Minimum version is required.';
    } else if (!SEMVER_REGEX.test(minimumVersion.trim())) {
      errors.minimumVersion = 'Use x.y.z format (e.g. 1.0.0).';
    }
    if (!currentVersion.trim()) {
      errors.currentVersion = 'Current version is required.';
    } else if (!SEMVER_REGEX.test(currentVersion.trim())) {
      errors.currentVersion = 'Use x.y.z format (e.g. 1.0.0).';
    }
    return errors;
  };

  const handleEdit = () => {
    // Reseed form values from the latest data so we always edit the current state
    if (versionData) {
      setMinimumVersion(versionData.minimumVersion || '');
      setCurrentVersion(versionData.currentVersion || '');
      setForceUpdate(Boolean(versionData.forceUpdate));
    }
    setFormErrors({});
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormErrors({});
  };

  const handleSave = async () => {
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    Alert.alert(
      'Update System Version',
      'This will update the version values used by the app to detect required updates. Continue?',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Update', onPress: performSave},
      ],
    );
  };

  const performSave = async () => {
    setSaving(true);
    try {
      const payload = {
        minimumVersion: minimumVersion.trim(),
        currentVersion: currentVersion.trim(),
        forceUpdate: Boolean(forceUpdate),
      };
      const response = await setAppVersionApi(payload);
      if (response?.success) {
        // Refresh local state from server response (or from our payload as a fallback)
        const next = response?.data?.data || response?.data || payload;
        setVersionData(next);
        setIsEditing(false);
        setFormErrors({});
        Alert.alert('Success', 'System version updated successfully.');
      } else {
        throw new Error(response?.error || 'Failed to update system version');
      }
    } catch (err) {
      console.error('Error saving version data:', err);
      Alert.alert(
        'Error',
        err?.message || 'Failed to update system version. Please try again.',
      );
    } finally {
      setSaving(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <Loading visible={saving} fullscreen />
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <LeftIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Version Control</Text>
        {isEditing ? (
          // Cancel button when editing
          <TouchableOpacity
            onPress={handleCancel}
            style={styles.headerAction}
            disabled={saving}>
            <Text style={[styles.headerActionText, saving && styles.headerActionDisabled]}>
              Cancel
            </Text>
          </TouchableOpacity>
        ) : (
          // Edit button when viewing
          <TouchableOpacity
            onPress={handleEdit}
            style={styles.headerAction}
            disabled={loading || !versionData}>
            <Text
              style={[
                styles.headerActionText,
                (loading || !versionData) && styles.headerActionDisabled,
              ]}>
              Edit
            </Text>
          </TouchableOpacity>
        )}
      </View>

      <KeyboardAvoidingView
        style={styles.keyboardContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}>
        <ScrollView
          style={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            !isEditing ? (
              <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
            ) : undefined
          }>
          {loading ? (
            <View style={styles.loadingContainer}>
              <Text style={styles.loadingText}>Loading version information...</Text>
            </View>
          ) : error ? (
            <View style={styles.errorContainer}>
              <Text style={styles.errorTitle}>Unable to load version data</Text>
              <Text style={styles.errorMessage}>{error}</Text>
              <TouchableOpacity
                style={styles.retryButton}
                onPress={() => fetchVersionData(false)}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
            </View>
          ) : isEditing ? (
            // EDIT MODE
            <View style={styles.form}>
              {/* Editable: System Version (Firestore) */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>System Version</Text>
                <Text style={styles.cardSubtitle}>
                  Values stored in Firestore and used by the app
                </Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Minimum Version <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      formErrors.minimumVersion && styles.textInputError,
                    ]}
                    value={minimumVersion}
                    onChangeText={text => {
                      setMinimumVersion(text);
                      if (formErrors.minimumVersion) {
                        setFormErrors(prev => ({...prev, minimumVersion: undefined}));
                      }
                    }}
                    placeholder="e.g. 1.0.0"
                    placeholderTextColor="#8F9AA3"
                    keyboardType="numbers-and-punctuation"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="next"
                    editable={!saving}
                  />
                  {formErrors.minimumVersion ? (
                    <Text style={styles.errorText}>{formErrors.minimumVersion}</Text>
                  ) : null}
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>
                    Current Version <Text style={styles.requiredAsterisk}>*</Text>
                  </Text>
                  <TextInput
                    style={[
                      styles.textInput,
                      formErrors.currentVersion && styles.textInputError,
                    ]}
                    value={currentVersion}
                    onChangeText={text => {
                      setCurrentVersion(text);
                      if (formErrors.currentVersion) {
                        setFormErrors(prev => ({...prev, currentVersion: undefined}));
                      }
                    }}
                    placeholder="e.g. 1.2.0"
                    placeholderTextColor="#8F9AA3"
                    keyboardType="numbers-and-punctuation"
                    autoCapitalize="none"
                    autoCorrect={false}
                    returnKeyType="done"
                    editable={!saving}
                  />
                  {formErrors.currentVersion ? (
                    <Text style={styles.errorText}>{formErrors.currentVersion}</Text>
                  ) : null}
                </View>

                <View style={[styles.row, styles.toggleRow]}>
                  <View style={styles.toggleLeft}>
                    <Text style={styles.toggleTitle}>Force Update</Text>
                    <Text style={styles.toggleDescription}>
                      Show the "update now" card to all users
                    </Text>
                  </View>
                  <Switch
                    value={forceUpdate}
                    onValueChange={setForceUpdate}
                    trackColor={{false: '#CDD3D4', true: '#539461'}}
                    thumbColor="#FFFFFF"
                    ios_backgroundColor="#CDD3D4"
                    disabled={saving}
                  />
                </View>
              </View>

              {/* Save Button */}
              <View style={styles.actionSection}>
                <TouchableOpacity
                  style={[styles.saveButton, saving && styles.saveButtonDisabled]}
                  onPress={handleSave}
                  disabled={saving}
                  activeOpacity={0.7}>
                  <Text style={styles.saveButtonText}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            // VIEW MODE
            <>
              {/* Card: System Version (from Firestore) */}
              <View style={styles.card}>
                <View style={styles.cardHeaderRow}>
                  <View style={styles.cardHeaderTextWrap}>
                    <Text style={styles.cardTitle}>System Version</Text>
                    <Text style={styles.cardSubtitle}>
                      Source of truth stored in Firestore
                    </Text>
                  </View>
                  <View style={styles.cardHeaderIcon}>
                    <EditIcon width={20} height={20} fill="#8F9AA3" />
                  </View>
                </View>

                {renderRow('Minimum Version', versionData?.minimumVersion)}
                {renderRow('Current Version', versionData?.currentVersion)}
                {renderRow('Force Update', versionData?.forceUpdate, true)}
              </View>

              {/* Card: Local Build (for comparison) */}
              <View style={styles.card}>
                <Text style={styles.cardTitle}>Local Build</Text>
                <Text style={styles.cardSubtitle}>
                  Version bundled in this app build
                </Text>

                {renderRow('App Version', localVersion, true)}
              </View>
            </>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  keyboardContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#F0F0F0',
  },
  backButton: {
    width: 44,
    height: 44,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 22,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202325',
  },
  headerAction: {
    paddingHorizontal: 8,
    height: 32,
    justifyContent: 'center',
    minWidth: 56,
    alignItems: 'flex-end',
  },
  headerActionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#539461',
  },
  headerActionDisabled: {
    color: '#C4C4C4',
  },
  headerSpacer: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  card: {
    backgroundColor: '#F8F9F9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  cardHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  cardHeaderTextWrap: {
    flex: 1,
  },
  cardHeaderIcon: {
    marginLeft: 12,
    marginTop: 2,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 4,
  },
  cardSubtitle: {
    fontSize: 13,
    color: '#8F9AA3',
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
  },
  rowDivider: {
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  rowLabel: {
    fontSize: 14,
    color: '#556065',
    fontWeight: '500',
  },
  rowValueWrap: {
    flexShrink: 1,
    alignItems: 'flex-end',
  },
  value: {
    fontSize: 14,
    color: '#202325',
    fontWeight: '600',
    textAlign: 'right',
  },
  valueMuted: {
    fontSize: 14,
    color: '#8F9AA3',
    fontWeight: '500',
  },
  valuePositive: {
    color: '#539461',
  },
  valueNegative: {
    color: '#C75450',
  },
  loadingContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    fontSize: 14,
    color: '#556065',
  },
  errorContainer: {
    paddingVertical: 48,
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    marginBottom: 8,
  },
  errorMessage: {
    fontSize: 14,
    color: '#556065',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: '#539461',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '600',
  },
  // Form (edit mode) styles
  form: {
    paddingBottom: 24,
  },
  inputGroup: {
    marginBottom: 16,
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
  textInput: {
    borderWidth: 1,
    borderColor: '#E5E7EB',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 12,
    paddingVertical: 12,
    fontSize: 16,
    color: '#202325',
    minHeight: 48,
  },
  textInputError: {
    borderColor: '#FF6B6B',
  },
  errorText: {
    fontSize: 13,
    color: '#FF6B6B',
    marginTop: 6,
  },
  toggleRow: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
    marginTop: 8,
    paddingTop: 16,
  },
  toggleLeft: {
    flex: 1,
    marginRight: 16,
  },
  toggleTitle: {
    fontSize: 14,
    color: '#202325',
    fontWeight: '600',
    marginBottom: 4,
  },
  toggleDescription: {
    fontSize: 12,
    color: '#8F9AA3',
    lineHeight: 16,
  },
  actionSection: {
    marginTop: 8,
  },
  saveButton: {
    backgroundColor: '#539461',
    paddingVertical: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    backgroundColor: '#C4C4C4',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default AdminVersionControlScreen;
