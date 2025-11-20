import React, { useState } from 'react';
import {
  Alert,
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import BackSolidIcon from '../../../../assets/iconnav/caret-left-bold.svg';
import DropdownIcon from '../../../../assets/icons/greylight/caret-down-regular.svg';
import { globalStyles } from '../../../../assets/styles/styles';

const FormInput = ({ label, placeholder, value, onChangeText, keyboardType = 'default' }) => (
  <View style={styles.inputSection}>
    <View style={styles.inputContainer}>
      <Text style={styles.label}>{label}<Text style={globalStyles.textXSRed}>*</Text></Text>
      <View style={styles.textField}>
        <TextInput
          placeholder={placeholder}
          placeholderTextColor="#647276"
          style={styles.input}
          value={value}
          onChangeText={onChangeText}
          keyboardType={keyboardType}
        />
      </View>
    </View>
  </View>
);

const AssignBoxModal = ({ visible, onClose, onSave }) => {
  const [boxNumber, setBoxNumber] = useState('');
  const [length, setLength] = useState('');
  const [width, setWidth] = useState('');
  const [height, setHeight] = useState('');
  const [weight, setWeight] = useState('');
  const [weightUnit, setWeightUnit] = useState('lbs'); // Default unit

  const handleSave = () => {

    if (!boxNumber.trim()) {
          Alert.alert('Missing Box Number', 'Please enter a Box Number.');
          return;
    }
    if (!length) {
      Alert.alert('Missing length', 'Please enter a length.');
      return;
    }
    if (!width) {
      Alert.alert('Missing width', 'Please enter a width.');
      return;
    }
    if (!height) {
      Alert.alert('Missing height', 'Please enter a height.');
      return;
    }
    if (!weight) {
      Alert.alert('Missing weight', 'Please enter a weight.');
      return;
    }

    const boxDetails = {
      boxNumber,
      dimensions: { length, width, height },
      weight: { value: weight, unit: weightUnit },
    };
    onSave(boxDetails);

    setBoxNumber('')
    setLength('')
    setWidth('')
    setHeight('')
    setWeight('')
    onClose(); // Close modal after saving
  };

  return (
    <Modal
      animationType="slide"
      transparent={false}
      visible={visible}
      onRequestClose={onClose}>
      <SafeAreaView style={styles.screen}>
        {/* Header */}
        <View style={styles.headerContainer}>
          <TouchableOpacity onPress={onClose}>
            <BackSolidIcon />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Box Assignment</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.formContainer}>
            <FormInput
              label="Box Number"
              placeholder="Enter box number"
              value={boxNumber}
              onChangeText={setBoxNumber}
            />
            <FormInput
              label="Length (in)"
              placeholder="Enter length"
              value={length}
              onChangeText={setLength}
              keyboardType="numeric"
            />
            <FormInput
              label="Width (in)"
              placeholder="Enter width"
              value={width}
              onChangeText={setWidth}
              keyboardType="numeric"
            />
            <FormInput
              label="Height (in)"
              placeholder="Enter height"
              value={height}
              onChangeText={setHeight}
              keyboardType="numeric"
            />

            {/* Weight Input */}
            <View style={styles.inputSection}>
                <View style={styles.weightInputRow}>
                    <View style={{flex: 1}}>
                        <Text style={styles.label}>Weight<Text style={globalStyles.textXSRed}>*</Text></Text>
                        <View style={styles.textField}>
                            <TextInput
                            placeholder="Enter weight"
                            placeholderTextColor="#647276"
                            style={styles.input}
                            value={weight}
                            onChangeText={setWeight}
                            keyboardType="numeric"
                            />
                        </View>
                    </View>
                    <View>
                        <Text style={styles.label}>Unit<Text style={globalStyles.textXSRed}>*</Text></Text>
                        <TouchableOpacity style={styles.unitSelector}>
                            <Text style={styles.unitText}>{weightUnit}</Text>
                            <DropdownIcon />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
          </View>
        </ScrollView>

        {/* Action Button */}
        <View style={styles.actionContainer}>
          <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
            <Text style={styles.saveButtonText}>Submit</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 16,
    height: 58,
    backgroundColor: '#FFFFFF',
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
  },
  scrollContent: {
    paddingBottom: 100, // Space for the save button
  },
  formContainer: {
    paddingTop: 18,
  },
  inputSection: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  inputContainer: {
    gap: 8,
  },
  label: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#393D40',
    lineHeight: 22.4,
  },
  textField: {
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  input: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#202325',
    height: '100%',
  },
  weightInputRow: {
    flexDirection: 'row',
    gap: 12,
    alignItems: 'flex-end',
  },
  unitSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
    gap: 12,
    width: 100,
  },
  unitText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#647276',
    flex: 1,
  },
  actionContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 34, // For home indicator
    backgroundColor: '#FFFFFF',
  },
  saveButton: {
    backgroundColor: '#539461',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default AssignBoxModal;
