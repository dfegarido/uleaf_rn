import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import CloseIcon from '../../assets/admin-icons/x.svg';

const TransactionFilter = ({ isVisible, onClose, onSelectTransaction, onReset, currentTransaction = '' }) => {
  const [transactionNumber, setTransactionNumber] = useState(currentTransaction);

  // Initialize with current value when modal opens
  React.useEffect(() => {
    if (isVisible) {
      setTransactionNumber(currentTransaction || '');
    }
  }, [isVisible, currentTransaction]);

  const handleView = () => {
    if (onSelectTransaction && typeof onSelectTransaction === 'function') {
      onSelectTransaction(transactionNumber.trim() || null);
    }
    onClose();
  };

  const handleReset = () => {
    setTransactionNumber('');
    if (onReset && typeof onReset === 'function') {
      onReset();
    }
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.actionSheetContainer}>
              <SafeAreaView style={styles.safeArea}>
                <KeyboardAvoidingView 
                  behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                  keyboardVerticalOffset={80}
                  style={styles.keyboardView}
                >
                  {/* Title */}
                  <View style={styles.titleContainer}>
                    <Text style={styles.titleText}>Transaction</Text>
                    
                    {/* Close */}
                    <TouchableOpacity 
                      style={styles.closeButton}
                      onPress={onClose}
                      activeOpacity={0.7}
                    >
                      <CloseIcon width={24} height={24} style={styles.closeIcon} />
                    </TouchableOpacity>
                  </View>

                  {/* Content */}
                  <View style={styles.contentContainer}>
                    {/* Transaction Input Field */}
                    <View style={styles.inputFieldContainer}>
                      <Text style={styles.inputLabel}>Transaction Number</Text>
                      <TextInput
                        style={styles.textInput}
                        placeholder="Enter transaction number"
                        placeholderTextColor="#647276"
                        value={transactionNumber}
                        onChangeText={setTransactionNumber}
                        autoCapitalize="none"
                        autoCorrect={false}
                        caretColor="#539461"
                        selectionColor="#539461"
                      />
                    </View>
                  </View>

                  {/* Action */}
                  <View style={styles.actionContainer}>
                    {/* Reset Button */}
                    <TouchableOpacity 
                      style={styles.resetButton} 
                      onPress={handleReset}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.resetButtonText}>Reset</Text>
                    </TouchableOpacity>
                    {/* Button View */}
                    <TouchableOpacity 
                      style={styles.buttonView} 
                      onPress={handleView}
                      activeOpacity={0.7}
                    >
                      <Text style={styles.buttonText}>View</Text>
                    </TouchableOpacity>
                  </View>
                </KeyboardAvoidingView>
              </SafeAreaView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 300,
  },
  safeArea: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
  },
  titleText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
    flex: 1,
  },
  closeButton: {
    padding: 6,
    width: 24,
    height: 24,
    flex: 0,
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  contentContainer: {
    flexDirection: 'column',
    paddingVertical: 24,
    paddingHorizontal: 24,
    width: '100%',
  },
  inputFieldContainer: {
    marginBottom: 16,
  },
  inputLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#647276',
    marginBottom: 8,
  },
  textInput: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#202325',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    height: 48,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 24,
    paddingHorizontal: 24,
    gap: 8,
    width: '100%',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#23C16B',
  },
  buttonView: {
    flex: 1,
    backgroundColor: '#23C16B',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default TransactionFilter;

