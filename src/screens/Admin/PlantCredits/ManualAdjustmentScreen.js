import React, { useState, useCallback, useContext, useRef } from 'react';
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
import { useQueryClient } from '@tanstack/react-query';
import ScreenHeader from '../../../components/Admin/header';
import Loading from '../../../components/Loading/Loading';
import { AuthContext } from '../../../auth/AuthProvider';
import { manualAdjustCreditsApi, invalidateCreditManagementCache, invalidateCreditStatementCache } from '../../../components/Api/creditApi';
import { REASON_TYPES, REASON_TYPE_META, formatCreditAmount } from '../../../utils/creditEnums';

const REASON_OPTIONS = [
  { key: REASON_TYPES.MISSING_PLANT, label: 'Missing' },
  { key: REASON_TYPES.DAMAGED_PLANT, label: 'Damaged' },
];

const PlantCreditManualAdjustmentScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const queryClient = useQueryClient();
  const { userInfo } = useContext(AuthContext);
  const userInfoRef = useRef(userInfo);
  userInfoRef.current = userInfo;
  const {
    buyer,
    buyerUid: routeBuyerUid,
    buyerName: routeBuyerName,
    currentBalance: routeCurrentBalance,
  } = route.params || {};

  const [amountText, setAmountText] = useState('');
  const [selectedReason, setSelectedReason] = useState(REASON_TYPES.MISSING_PLANT);
  const [reasonText, setReasonText] = useState('');
  const [notes, setNotes] = useState('');
  const [adjusting, setAdjusting] = useState(false);

  const fullName = routeBuyerName || `${buyer?.firstName || ''} ${buyer?.lastName || ''}`.trim() || 'Unknown';
  const buyerUid = routeBuyerUid || buyer?.uid;
  const currentBalance = route.params?.currentBalance ?? routeCurrentBalance ?? buyer?.plantCredits ?? 0;

  const parsedAmount = parseFloat(amountText.replace(/[^0-9.-]/g, ''));
  const amount = isNaN(parsedAmount) ? 0 : parsedAmount;
  const newBalance = currentBalance + amount;
  const canSubmit = amount !== 0 && reasonText.trim().length > 0 && !!buyerUid && !adjusting;

  const handleSubmit = useCallback(async () => {
    if (!canSubmit) return;

    if (newBalance < 0) {
      Alert.alert('Invalid amount', 'Adjustment would make the balance negative.');
      return;
    }

    const adminUid =
      userInfoRef.current?.data?.uid ||
      userInfoRef.current?.user?.uid ||
      userInfoRef.current?.uid ||
      null;

    setAdjusting(true);
    try {
      const result = await manualAdjustCreditsApi({
        buyerUid,
        amount,
        reasonType: selectedReason,
        reason: reasonText,
        notes,
        adminUid,
      });

      if (result.success) {
        invalidateCreditManagementCache(queryClient);
        invalidateCreditStatementCache(queryClient, buyerUid);
        Alert.alert('Adjusted', `Balance updated by ${formatCreditAmount(amount)}.`, [
          { text: 'OK', onPress: () => navigation.goBack() },
        ]);
      } else {
        Alert.alert('Error', result.error || 'Failed to adjust credits.');
      }
    } catch (err) {
      Alert.alert('Error', err.message || 'Unexpected error.');
    } finally {
      setAdjusting(false);
    }
  }, [canSubmit, newBalance, amount, selectedReason, reasonText, notes, buyerUid, navigation, queryClient]);

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {Platform.OS === 'android' && <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />}

      <ScreenHeader navigation={navigation} title="Manual Adjustment" />

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
          <View style={styles.summaryCard}>
            <Text style={styles.summaryName}>{fullName}</Text>
            <Text style={styles.summaryLabel}>Current balance</Text>
            <Text style={styles.summaryValue}>{formatCreditAmount(currentBalance)}</Text>
            <Text style={styles.summaryLabel}>After adjustment</Text>
            <Text style={[styles.summaryValue, newBalance < 0 && styles.negative]}>{formatCreditAmount(newBalance)}</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Amount</Text>
            <View style={styles.amountInputWrap}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.amountInput}
                placeholder="0.00"
                placeholderTextColor="#9AA4A8"
                keyboardType="decimal-pad"
                value={amountText}
                onChangeText={setAmountText}
                autoFocus
              />
            </View>
            <Text style={styles.amountHint}>Use positive to add credit, negative to deduct.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reason Type</Text>
            <View style={styles.reasonOptions}>
              {REASON_OPTIONS.map((opt) => {
                const meta = REASON_TYPE_META[opt.key];
                const selected = selectedReason === opt.key;
                return (
                  <TouchableOpacity
                    key={opt.key}
                    style={[
                      styles.reasonChip,
                      selected && { backgroundColor: meta.bgColor, borderColor: meta.color },
                    ]}
                    onPress={() => setSelectedReason(opt.key)}
                    activeOpacity={0.8}
                  >
                    <Text
                      style={[
                        styles.reasonChipText,
                        selected && { color: meta.color },
                      ]}
                    >
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Reason</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Why is this adjustment being made?"
              placeholderTextColor="#9AA4A8"
              value={reasonText}
              onChangeText={setReasonText}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoCapitalize="sentences"
            />
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Notes (optional)</Text>
            <TextInput
              style={styles.textArea}
              placeholder="Internal notes for audit trail..."
              placeholderTextColor="#9AA4A8"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
              textAlignVertical="top"
              autoCapitalize="sentences"
            />
          </View>

          <TouchableOpacity
            style={[styles.submitButton, (!canSubmit || newBalance < 0) && styles.submitButtonDisabled]}
            onPress={handleSubmit}
            disabled={!canSubmit || newBalance < 0}
            activeOpacity={0.8}
          >
            <Text style={styles.submitButtonText}>
              {adjusting ? 'Applying...' : `Adjust ${formatCreditAmount(amount)}`}
            </Text>
          </TouchableOpacity>
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
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
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
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#202325',
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 16,
  },
  summaryCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 16,
    padding: 16,
    marginBottom: 20,
    borderWidth: 1,
    borderColor: '#E8EEEA',
  },
  summaryName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 12,
  },
  summaryLabel: {
    fontSize: 12,
    color: '#9AA4A8',
    marginBottom: 2,
  },
  summaryValue: {
    fontSize: 24,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 12,
  },
  negative: {
    color: '#E74C3C',
  },
  section: {
    marginBottom: 18,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 10,
  },
  amountInputWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#D7E6D9',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
  },
  currencySymbol: {
    fontSize: 22,
    fontWeight: '700',
    color: '#202325',
    marginRight: 6,
  },
  amountInput: {
    flex: 1,
    fontSize: 22,
    fontWeight: '700',
    color: '#202325',
    padding: 0,
  },
  amountHint: {
    fontSize: 12,
    color: '#9AA4A8',
    marginTop: 6,
  },
  reasonOptions: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  reasonChip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 16,
    backgroundColor: '#F0F2F2',
    borderWidth: 1,
    borderColor: '#E8EEEA',
  },
  reasonChipText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B777B',
  },
  textArea: {
    borderWidth: 1,
    borderColor: '#D7E6D9',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#202325',
    minHeight: 80,
  },
  submitButton: {
    backgroundColor: '#539461',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 8,
  },
  submitButtonDisabled: {
    backgroundColor: '#D7E6D9',
  },
  submitButtonText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
  },
  previewSectionTitle: {
    paddingTop: 12,
  },
});

export default PlantCreditManualAdjustmentScreen;
