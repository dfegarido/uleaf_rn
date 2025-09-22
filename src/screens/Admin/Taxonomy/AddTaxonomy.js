import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';

// Import icons
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import AddSpecieIcon from '../../../assets/admin-icons/add-specie.svg';
import AddSpecieModal from './AddSpecieModal';

// Import API
import { addPlantTaxonomyApi, validateSpeciesData, formatSpeciesForApi } from '../../../auth/addPlantTaxonomyApi';

const AddTaxonomy = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [genusName, setGenusName] = useState('');
  const [speciesList, setSpeciesList] = useState([]);
  const [addSpecieModalVisible, setAddSpecieModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Debug function to track text input changes
  const handleGenusNameChange = (text) => {
    console.log('Genus name changed to:', text);
    setGenusName(text);
  };

  const handleBack = () => {
    navigation.goBack();
  };

  const handleAddSpecie = () => {
    setAddSpecieModalVisible(true);
  };

  const handleSaveSpecie = (specieData) => {
    // Add the new specie to the list
    const newSpecie = {
      id: Date.now(), // Simple ID generation
      ...specieData,
    };
    setSpeciesList(prev => [...prev, newSpecie]);
    setAddSpecieModalVisible(false);
  };

  const handleCloseSpecieModal = () => {
    setAddSpecieModalVisible(false);
  };

  const handleSave = async () => {
    if (!genusName.trim()) {
      Alert.alert('Error', 'Please enter a genus name');
      return;
    }

    if (speciesList.length === 0) {
      Alert.alert('Error', 'Please add at least one species');
      return;
    }

    // Validate species data
    const validation = validateSpeciesData(speciesList);
    if (!validation.isValid) {
      Alert.alert('Validation Error', validation.errors.join('\n'));
      return;
    }

    setIsLoading(true);

    try {
      console.log('🌱 Creating new plant taxonomy...');
      console.log('Genus name:', genusName);
      console.log('Species list:', speciesList);

      // Format species data for API
      const formattedSpecies = formatSpeciesForApi(speciesList);

      // Call the API
      const response = await addPlantTaxonomyApi({
        genusName: genusName.trim(),
        species: formattedSpecies,
        adminId: 'admin_temp' // TODO: Replace with actual admin ID from auth context
      });

      if (response.success) {
        console.log('✅ Taxonomy created successfully:', response.data);
        
        Alert.alert(
          'Success', 
          `Taxonomy "${genusName}" with ${speciesList.length} species created successfully!`,
          [
            { 
              text: 'OK', 
              onPress: () => navigation.goBack() 
            }
          ]
        );
      } else {
        console.error('❌ Failed to create taxonomy:', response.error);
        Alert.alert(
          'Error', 
          response.error || 'Failed to create taxonomy. Please try again.'
        );
      }
    } catch (error) {
      console.error('❌ Error creating taxonomy:', error);
      Alert.alert(
        'Error', 
        'An unexpected error occurred. Please check your connection and try again.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {/* Navigation Header */}
      <View style={[styles.navigationHeader, { paddingTop: insets.top + 18 }]}>
        <View style={styles.controls}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <BackIcon width={24} height={24} />
          </TouchableOpacity>
          <Text style={styles.titleText}>New Plant Taxonomy</Text>
        </View>
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Form Taxonomy */}
        <View style={styles.formTaxonomy}>
          {/* Genus Input */}
          <View style={styles.genusSection}>
            <View style={styles.textField}>
              <View style={styles.labelContainer}>
                <Text style={styles.label}>Genus name</Text>
                <Text style={styles.asterisk}>*</Text>
              </View>
              <View style={styles.inputContainer}>
                <TextInput
                  style={styles.textInput}
                  placeholder="Enter genus name"
                  value={genusName}
                  onChangeText={handleGenusNameChange}
                  placeholderTextColor="#647276"
                  autoCapitalize="words"
                  autoCorrect={false}
                  selectionColor="#539461"
                />
              </View>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.dividerSection}>
          <View style={styles.divider} />
        </View>

        {/* Specie List Title */}
        <View style={styles.specieListTitle}>
          <View style={styles.titleRow}>
            <Text style={styles.sectionTitleText}>Specie List</Text>
            <Text style={styles.quantityText}>{speciesList.length} specie(s)</Text>
          </View>
        </View>

        {/* Add Specie Button */}
        <View style={styles.addSpecieSection}>
          <TouchableOpacity style={styles.addSpecieButton} onPress={handleAddSpecie}>
            <View style={styles.addButtonIcon}>
              <AddSpecieIcon width={24} height={24} />
            </View>
            <View style={styles.addButtonText}>
              <Text style={styles.buttonText}>Add Specie</Text>
            </View>
          </TouchableOpacity>
        </View>

        {/* Action Section */}
        <View style={styles.actionSection}>
          <TouchableOpacity 
            style={[styles.saveButton, isLoading && styles.saveButtonDisabled]} 
            onPress={handleSave}
            disabled={isLoading}
          >
            <View style={styles.saveButtonText}>
              <Text style={styles.saveText}>
                {isLoading ? 'Creating...' : 'Submit'}
              </Text>
            </View>
          </TouchableOpacity>
        </View>
      </ScrollView>

      <AddSpecieModal
        visible={addSpecieModalVisible}
        onClose={handleCloseSpecieModal}
        onSave={handleSaveSpecie}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  
  // Navigation Header
  navigationHeader: {
    backgroundColor: '#FFFFFF',
    paddingHorizontal: 16,
    paddingBottom: 12,
    minHeight: 106,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 6,
    paddingBottom: 12,
    gap: 10,
    height: 58,
    position: 'relative',
  },
  backButton: {
    width: 24,
    height: 24,
    position: 'absolute',
    left: 0,
    zIndex: 1,
  },
  titleText: {
    flex: 1,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
  },

  // Content
  content: {
    flex: 1,
  },

  // Form Taxonomy
  formTaxonomy: {
    borderRadius: 0,
  },
  genusSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 12,
  },
  textField: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    flex: 1,
  },
  label: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
  },
  labelContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  asterisk: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#E53E3E',
    marginLeft: 4,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 12,
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    paddingVertical: 0,
    paddingHorizontal: 0,
    textAlignVertical: 'center',
  },

  // Divider
  dividerSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  divider: {
    width: '100%',
    height: 12,
    backgroundColor: '#F5F6F6',
  },

  // Specie List Title
  specieListTitle: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 16,
    paddingHorizontal: 0,
    borderRadius: 0,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    gap: 10,
  },
  sectionTitleText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  quantityText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },

  // Add Specie
  addSpecieSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 12,
  },
  addSpecieButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 48,
    minHeight: 48,
    backgroundColor: '#414649',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  addButtonIcon: {
    width: 24,
    height: 24,
  },
  addButtonText: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  buttonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },

  // Action Section
  actionSection: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 24,
    gap: 12,
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
    flex: 1,
  },
  saveButtonText: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
  },
  saveText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  saveButtonDisabled: {
    backgroundColor: '#8B8B8B',
    opacity: 0.6,
  },

});

export default AddTaxonomy;
