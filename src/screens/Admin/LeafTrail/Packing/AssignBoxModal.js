import React, { useEffect, useState } from 'react';
import {
  Alert,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { globalStyles } from '../../../../assets/styles/styles';

const FormInput = ({ label, placeholder, value, onChangeText, keyboardType = 'default' }) => (
  <View style={styles.inputGroup}>
    <Text style={styles.label}>
      {label}
      <Text style={globalStyles.textXSRed}>*</Text>
    </Text>
    <TextInput
      placeholder={placeholder}
      placeholderTextColor="#647276"
      style={styles.input}
      value={value}
      onChangeText={onChangeText}
      keyboardType={keyboardType}
    />
  </View>
);

/** Bottom sheet on the same screen — not a full-screen navigation. */
const AssignBoxModal = ({ visible, onClose, onSave, selectedCount = 0 }) => {
  const insets = useSafeAreaInsets();
  const [boxNumber, setBoxNumber] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit] = useState('lbs');

  useEffect(() => {
    if (!visible) {
      setBoxNumber('');
      setLength('');
      setWidth('');
      setHeight('');
      setWeight('');
    }
  }, [visible]);

  const handleSave = () => {
    if (!boxNumber.trim()) {
      Alert.alert('Missing Box Number', 'Please enter a box number.');
      return;
    }
    if (!length || !width || !height) {
      Alert.alert('Missing dimensions', 'Please enter length, width, and height.');
      return;
    }
    if (!weight) {
      Alert.alert('Missing weight', 'Please enter a weight.');
      return;
    }

    onSave({
      boxNumber: boxNumber.trim(),
      dimensions: { length, width, height },
      weight: { value: weight, unit: weightUnit },
    });
  };

  return (
    <Modal transparent visible={visible} animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <Pressable style={styles.backdrop} onPress={onClose} />
        <View style={[styles.sheet, { paddingBottom: Math.max(insets.bottom, 16) }]}>
          <View style={styles.handle} />
          <Text style={styles.title}>Assign box #</Text>
          <Text style={styles.subtitle}>
            {selectedCount > 0
              ? `Applying to ${selectedCount} selected plant${selectedCount === 1 ? '' : 's'}.`
              : 'Enter box details for the selected plants.'}
          </Text>

          <ScrollView
            style={styles.formScroll}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}>
            <FormInput
              label="Box Number"
              placeholder="Enter box number"
              value={boxNumber}
              onChangeText={setBoxNumber}
            />
            <View style={styles.dimRow}>
              <View style={styles.dimCell}>
                <FormInput
                  label="Length (in)"
                  placeholder="L"
                  value={length}
                  onChangeText={setLength}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.dimCell}>
                <FormInput
                  label="Width (in)"
                  placeholder="W"
                  value={width}
                  onChangeText={setWidth}
                  keyboardType="numeric"
                />
              </View>
              <View style={styles.dimCell}>
                <FormInput
                  label="Height (in)"
                  placeholder="H"
                  value={height}
                  onChangeText={setHeight}
                  keyboardType="numeric"
                />
              </View>
            </View>
            <FormInput
              label={`Weight (${weightUnit})`}
              placeholder="Enter weight"
              value={weight}
              onChangeText={setWeight}
              keyboardType="numeric"
            />
          </ScrollView>

          <TouchableOpacity style={styles.saveButton} onPress={handleSave} activeOpacity={0.85}>
            <Text style={styles.saveButtonText}>Save box assignment</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  flex: { flex: 1, justifyContent: 'flex-end' },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.4)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 10,
    maxHeight: '85%',
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CDD3D4',
    marginBottom: 14,
  },
  title: {
    fontSize: 20,
    fontWeight: '800',
    color: '#202325',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#647276',
    textAlign: 'center',
    marginTop: 4,
    marginBottom: 16,
  },
  formScroll: {
    maxHeight: 340,
  },
  inputGroup: {
    marginBottom: 12,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#393D40',
    marginBottom: 6,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 14,
    fontSize: 16,
    color: '#202325',
    backgroundColor: '#FAFBFB',
  },
  dimRow: {
    flexDirection: 'row',
    gap: 8,
  },
  dimCell: {
    flex: 1,
  },
  saveButton: {
    backgroundColor: '#539461',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  cancelButton: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  cancelButtonText: {
    color: '#647276',
    fontSize: 15,
    fontWeight: '600',
  },
});

export default AssignBoxModal;
