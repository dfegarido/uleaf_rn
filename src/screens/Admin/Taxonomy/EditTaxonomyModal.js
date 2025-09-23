import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  TextInput,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { updatePlantTaxonomyApi } from '../../../auth/updatePlantTaxonomyApi';

// Import icons
import CloseIcon from '../../../assets/iconchat/close.svg';

const EditTaxonomyModal = ({ visible, onClose, taxonomyItem, onUpdate }) => {
  const [name, setName] = useState(taxonomyItem?.name || '');
  const [receivedPlants, setReceivedPlants] = useState(
    taxonomyItem?.receivedPlants?.toString() || '0'
  );
  const [loading, setLoading] = useState(false);

  React.useEffect(() => {
    if (taxonomyItem) {
      setName(taxonomyItem.name || '');
      setReceivedPlants(taxonomyItem.receivedPlants?.toString() || '0');
    }
  }, [taxonomyItem]);

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert('Error', 'Genus name is required');
      return;
    }

    const receivedPlantsNum = parseInt(receivedPlants) || 0;
    if (receivedPlantsNum < 0) {
      Alert.alert('Error', 'Received plants cannot be negative');
      return;
    }

    try {
      setLoading(true);
      
      console.log('🌱 Updating plant taxonomy...');
      console.log('Taxonomy item:', taxonomyItem);
      console.log('New genus name:', name.trim());
      console.log('New species count:', receivedPlantsNum);

      // Call the new updatePlantTaxonomy API
      const response = await updatePlantTaxonomyApi({
        genusId: taxonomyItem.id,
        newGenusName: name.trim() !== taxonomyItem.name ? name.trim() : undefined,
        adminId: 'admin_temp' // TODO: Replace with actual admin ID from auth context
      });

      if (response.success) {
        console.log('✅ Taxonomy updated successfully:', response.data);
        
        // Update the local state with the new data
        const updatedItem = {
          ...taxonomyItem,
          name: name.trim(),
          receivedPlants: receivedPlantsNum
        };
        
        onUpdate(updatedItem);
        
        Alert.alert(
          'Success', 
          response.message || 'Taxonomy updated successfully!',
          [
            { 
              text: 'OK', 
              onPress: () => onClose()
            }
          ]
        );
      } else {
        console.error('❌ Failed to update taxonomy:', response.error);
        Alert.alert(
          'Error', 
          response.error || 'Failed to update taxonomy. Please try again.'
        );
      }
    } catch (error) {
      console.error('❌ Error updating taxonomy:', error);
      Alert.alert(
        'Error', 
        'An unexpected error occurred. Please check your connection and try again.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleCancel = () => {
    // Reset to original values
    if (taxonomyItem) {
      setName(taxonomyItem.name || '');
      setReceivedPlants(taxonomyItem.receivedPlants?.toString() || '0');
    }
    onClose();
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="fade"
      onRequestClose={handleCancel}
    >
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Edit Taxonomy</Text>
            <TouchableOpacity onPress={handleCancel} style={styles.closeButton}>
              <CloseIcon width={24} height={24} />
            </TouchableOpacity>
          </View>

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Genus Name</Text>
              <TextInput
                style={styles.input}
                value={name}
                onChangeText={setName}
                placeholder="Enter genus name"
                placeholderTextColor="#647276"
                autoCapitalize="words"
                editable={!loading}
              />
            </View>

            <View style={styles.fieldContainer}>
              <Text style={styles.label}>Received Plants</Text>
              <TextInput
                style={styles.input}
                value={receivedPlants}
                onChangeText={setReceivedPlants}
                placeholder="Enter number of received plants"
                placeholderTextColor="#647276"
                keyboardType="numeric"
                editable={!loading}
              />
            </View>
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <TouchableOpacity
              style={[styles.button, styles.cancelButton]}
              onPress={handleCancel}
              disabled={loading}
            >
              <Text style={[styles.buttonText, styles.cancelButtonText]}>
                Cancel
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.button, styles.saveButton]}
              onPress={handleSave}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator size="small" color="#FFFFFF" />
              ) : (
                <Text style={[styles.buttonText, styles.saveButtonText]}>
                  Save
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    width: '100%',
    maxWidth: 400,
    padding: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontFamily: 'Inter',
    fontWeight: '700',
    color: '#202325',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  form: {
    marginBottom: 32,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  label: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#393D40',
    marginBottom: 8,
  },
  input: {
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    color: '#202325',
  },
  actions: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  cancelButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
  },
  saveButton: {
    backgroundColor: '#539461',
  },
  buttonText: {
    fontSize: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
  },
  cancelButtonText: {
    color: '#647276',
  },
  saveButtonText: {
    color: '#FFFFFF',
  },
});

export default EditTaxonomyModal;
