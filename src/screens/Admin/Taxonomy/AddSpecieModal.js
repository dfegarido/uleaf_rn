import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Modal,
  ScrollView,
  Dimensions,
} from 'react-native';

// Import icons
import CloseIcon from '../../../assets/admin-icons/close-x.svg';
import DownIcon from '../../../assets/admin-icons/arrow-down.svg';

const { height: screenHeight } = Dimensions.get('window');

const AddSpecieModal = ({ visible, onClose, onSave }) => {
  const [price, setPrice] = useState('');
  const [quantity, setQuantity] = useState('');
  const [variegation, setVariegation] = useState('');
  const [size, setSize] = useState('');

  const handleSave = () => {
    // Validate fields if needed
    const specieData = {
      price,
      quantity,
      variegation,
      size,
    };
    
    onSave(specieData);
    
    // Reset form
    setPrice('');
    setQuantity('');
    setVariegation('');
    setSize('');
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity style={styles.overlayTouchable} onPress={onClose} />
        
        {/* Action Sheet */}
        <View style={styles.actionSheet}>
          {/* Title */}
          <View style={styles.titleSection}>
            <Text style={styles.titleText}>Add Specie</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <CloseIcon width={24} height={24} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <ScrollView style={styles.form} showsVerticalScrollIndicator={false}>
            {/* Price Field */}
            <View style={styles.fieldSection}>
              <View style={styles.textField}>
                <Text style={styles.label}>
                  Specie name <Text style={styles.asterisk}>*</Text>
                </Text>
                <View style={styles.inputContainer}>
                  <TextInput
                    style={styles.textInput}
                    placeholder="Enter specie name"
                    value={price}
                    onChangeText={setPrice}
                    placeholderTextColor="#647276"
                  />
                </View>
              </View>
            </View>

            {/* Variegation Field */}
            <View style={styles.fieldSection}>
              <View style={styles.textField}>
                <Text style={styles.label}>Variegation</Text>
                <TouchableOpacity style={styles.inputContainer}>
                  <Text style={[styles.textInput, styles.dropdownText]}>
                    {variegation || 'Select...'}
                  </Text>
                  <DownIcon width={24} height={24} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Quantity Field */}
            <View style={styles.fieldSection}>
              <View style={styles.textField}>
                <Text style={styles.label}>
                  Shipping index <Text style={styles.asterisk}>*</Text>
                </Text>
                <TouchableOpacity style={styles.inputContainer}>
                  <Text style={[styles.textInput, styles.dropdownText]}>
                    {quantity || 'Select...'}
                  </Text>
                  <DownIcon width={24} height={24} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Size Field */}
            <View style={styles.fieldSection}>
              <View style={styles.textField}>
                <Text style={styles.label}>
                  Acclimation index <Text style={styles.asterisk}>*</Text>
                </Text>
                <TouchableOpacity style={styles.inputContainer}>
                  <Text style={[styles.textInput, styles.dropdownText]}>
                    {size || 'Select...'}
                  </Text>
                  <DownIcon width={24} height={24} />
                </TouchableOpacity>
              </View>
            </View>

            {/* Action */}
            <View style={styles.actionSection}>
              <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
                <View style={styles.saveButtonText}>
                  <Text style={styles.saveText}>Add Specie</Text>
                </View>
              </TouchableOpacity>
            </View>
          </ScrollView>

          {/* Home Indicator */}
          <View style={styles.homeIndicator}>
            <View style={styles.gestureBar} />
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  
  // Action Sheet
  actionSheet: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingBottom: 34,
    width: '100%',
    height: 586,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },

  // Title
  titleSection: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 16,
    width: '100%',
    height: 60,
    backgroundColor: '#FFFFFF',
  },
  titleText: {
    width: 287,
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: 24,
    height: 24,
  },

  // Form
  form: {
    width: '100%',
    height: 492,
    flex: 1,
  },

  // Field Section
  fieldSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 12,
    width: '100%',
    height: 102,
  },
  textField: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    height: 78,
    alignSelf: 'stretch',
    width: '100%',
  },
  label: {
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    alignSelf: 'stretch',
    width: '100%',
  },
  asterisk: {
    color: '#FF0000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    alignSelf: 'stretch',
    width: '100%',
  },
  textInput: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 1,
    textAlign: 'left',
  },
  dropdownText: {
    color: '#647276',
    textAlign: 'left',
  },

  // Action Section
  actionSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 24,
    gap: 12,
    width: '100%',
    height: 84,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    alignSelf: 'stretch',
    width: '100%',
  },
  saveButtonText: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    flex: 1,
    height: 16,
  },
  saveText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    textAlign: 'center',
  },

  // Home Indicator
  homeIndicator: {
    position: 'absolute',
    width: '100%',
    height: 34,
    left: 0,
    bottom: 0,
  },
  gestureBar: {
    position: 'absolute',
    width: 148,
    height: 5,
    left: '50%',
    marginLeft: -74,
    bottom: 8,
    backgroundColor: '#202325',
    borderRadius: 100,
  },
});

export default AddSpecieModal;
