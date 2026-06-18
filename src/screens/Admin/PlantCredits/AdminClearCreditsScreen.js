import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Platform,
  StatusBar,
  Alert,
  KeyboardAvoidingView,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import Loading from '../../../components/Loading/Loading';
import { clearCreditsApi } from '../../../components/Api/creditApi';

const AdminClearCreditsScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { buyer } = route.params || {};

  const [note, setNote] = useState('');
  const [clearing, setClearing] = useState(false);

  const fullName = `${buyer?.firstName || ''} ${buyer?.lastName || ''}`.trim() || 'Unknown';
  const balance = buyer?.plantCredits ?? 0;

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleClear = async () => {
    if (!note.trim()) {
      Alert.alert('Note required', 'Please enter a reason for clearing credits.');
      return;
    }

    if (!buyer?.uid) {
      Alert.alert('Error', 'Buyer information is missing.');
      return;
    }

    setClearing(true);
    try {
      const result = await clearCreditsApi({
        buyerId: buyer.uid,
        reason: note.trim(),
      });

      if (result.success) {
        navigation.goBack();
      } else {
        Alert.alert('Error', result.error || 'Failed to clear credits.');
      }
    } catch (error) {
      console.error('Error clearing credits:', error);
      Alert.alert('Error', 'An unexpected error occurred while clearing credits.');
    } finally {
      setClearing(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {Platform.OS === 'android' && (
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      )}

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={handleCancel}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <BackSolidIcon width={24} height={24} color="#202325" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Clear Credits</Text>
        <View style={styles.headerRightSpacer} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 24 : 0}
      >
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
        >
          {/* Buyer summary */}
          <View style={styles.summaryCard}>
            <Text style={styles.summaryName}>{fullName}</Text>
            <Text style={styles.summaryBalance}>
              Current balance: <Text style={styles.summaryBalanceValue}>${balance}</Text>
            </Text>
          </View>

          {/* Note input */}
          <View style={styles.inputSection}>
            <Text style={styles.inputLabel}>Reason / Note</Text>
            <TextInput
              style={styles.input}
              placeholder="Enter the reason for clearing these credits..."
              placeholderTextColor="#9AA4A8"
              value={note}
              onChangeText={setNote}
              multiline
              numberOfLines={6}
              textAlignVertical="top"
              autoCapitalize="sentences"
              autoCorrect
            />
          </View>

          <View style={styles.flex} />

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.actionButton, styles.cancelButton]}
              onPress={handleCancel}
              activeOpacity={0.8}
            >
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={[
                styles.actionButton,
                styles.submitButton,
                !note.trim() && styles.submitButtonDisabled,
              ]}
              onPress={handleClear}
              activeOpacity={0.8}
              disabled={!note.trim()}
            >
              <Text style={styles.submitButtonText}>Clear Credits</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>

      <Loading visible={clearing} fullscreen />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEEA',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerRightSpacer: {
    width: 24,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
    flexGrow: 1,
  },
  summaryCard: {
    backgroundColor: '#FFF4ED',
    borderRadius: 12,
    padding: 20,
    marginBottom: 20,
  },
  summaryName: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 6,
  },
  summaryBalance: {
    fontSize: 15,
    color: '#6B777B',
  },
  summaryBalanceValue: {
    color: '#FF8C00',
    fontWeight: '700',
  },
  inputSection: {
    marginBottom: 16,
  },
  inputLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: '#202325',
    marginBottom: 10,
  },
  input: {
    borderWidth: 1,
    borderColor: '#D7E6D9',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingTop: 14,
    paddingBottom: 14,
    fontSize: 15,
    color: '#202325',
    minHeight: 140,
    textAlignVertical: 'top',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
    paddingTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F7F1',
  },
  cancelButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#539461',
  },
  submitButton: {
    backgroundColor: '#E74C3C',
  },
  submitButtonDisabled: {
    backgroundColor: '#F5A9A9',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default AdminClearCreditsScreen;
