import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
  Alert,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

// Import components
import AddSpecieModal from './AddSpecieModal';
import SpecieOptionsModal from './SpecieOptionsModal';

// Import APIs
import { getAdminTaxonomyApi, updateTaxonomyItemApi } from '../../../components/Api';

// Import icons
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import PlusIcon from '../../../assets/admin-icons/plus.svg';
import ThreeDotsIcon from '../../../assets/admin-icons/three-dots.svg';
import ShippingIcon from '../../../assets/admin-icons/shipping.svg';
import AcclimationIcon from '../../../assets/admin-icons/acclimation.svg';
import InfoIcon from '../../../assets/admin-icons/info.svg';

const AddToTaxonomyScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  // Get the request data passed from the previous screen
  const { requestData = {} } = route.params || {};
  
  const [genusName, setGenusName] = useState(requestData.genusName || '');
  const [isAddSpecieModalVisible, setIsAddSpecieModalVisible] = useState(false);
  const [isSpecieOptionsModalVisible, setIsSpecieOptionsModalVisible] = useState(false);
  const [selectedSpecie, setSelectedSpecie] = useState(null);
  const [existingTaxonomyData, setExistingTaxonomyData] = useState([]);
  const [isLoadingTaxonomy, setIsLoadingTaxonomy] = useState(false);
  
  // Debug log to check if state is empty
  console.log('genusName state:', genusName, 'length:', genusName.length);
  const [species, setSpecies] = useState([
    { id: 1, name: 'Acuminata', shipping: 'Best (7-10)', acclimation: 'Better (4-6)' },
    { id: 2, name: 'Adansonii', variegation: 'Green on Green', shipping: 'Best (7-10)', acclimation: 'Good (1-3)' },
  ]);

  // Load existing taxonomy data on component mount
  useEffect(() => {
    loadExistingTaxonomy();
  }, []);

  const loadExistingTaxonomy = async () => {
    try {
      setIsLoadingTaxonomy(true);
      const response = await getAdminTaxonomyApi({ limit: 1000 }); // Get all taxonomy data
      if (response && response.data) {
        setExistingTaxonomyData(response.data);
        console.log('Loaded existing taxonomy:', response.data);
      }
    } catch (error) {
      console.error('Error loading existing taxonomy:', error);
      // Continue with empty data if API fails
      setExistingTaxonomyData([]);
    } finally {
      setIsLoadingTaxonomy(false);
    }
  };

  const checkIfGenusExists = (genus) => {
    return existingTaxonomyData.find(item => 
      item.genusName && item.genusName.toLowerCase() === genus.toLowerCase()
    );
  };

  const handleGoBack = () => {
    navigation.goBack();
  };

  const handleAddSpecie = () => {
    console.log('Opening Add Specie Modal');
    setIsAddSpecieModalVisible(true);
  };

  const handleCloseAddSpecieModal = () => {
    setIsAddSpecieModalVisible(false);
  };

  const handleSaveSpecie = (specieData) => {
    console.log('Saving new specie:', specieData);
    // Add the new specie to the species list
    const newSpecie = {
      id: species.length + 1,
      name: specieData.specieName || 'New Specie',
      variegation: specieData.variegation,
      shipping: specieData.shipping,
      acclimation: specieData.acclimation,
    };
    setSpecies([...species, newSpecie]);
    setIsAddSpecieModalVisible(false);
  };

  const handleEditSpecie = (specie) => {
    console.log('Opening specie options for:', specie);
    setSelectedSpecie(specie);
    setIsSpecieOptionsModalVisible(true);
  };

  const handleCloseSpecieOptions = () => {
    setIsSpecieOptionsModalVisible(false);
    setSelectedSpecie(null);
  };

  const handleEditSpecieAction = () => {
    console.log('Edit specie:', selectedSpecie);
    // Navigate to EditSpecieScreen with specie data
    navigation.navigate('EditSpecieScreen', { specieData: selectedSpecie });
  };

  const handleDeleteSpecieAction = () => {
    console.log('Delete specie:', selectedSpecie);
    if (selectedSpecie) {
      // Remove the specie from the list
      setSpecies(species.filter(specie => specie.id !== selectedSpecie.id));
    }
  };

  const handleApproveRequest = async () => {
    if (!genusName.trim()) {
      Alert.alert('Error', 'Please enter a genus name');
      return;
    }

    if (species.length === 0) {
      Alert.alert('Error', 'Please add at least one species');
      return;
    }

    try {
      console.log('Adding species to existing taxonomy:', { genusName, species });
      
      // Check if genus exists
      const existingGenus = checkIfGenusExists(genusName.trim());
      
      if (!existingGenus) {
        Alert.alert(
          'Genus Not Found', 
          `The genus "${genusName}" does not exist in the taxonomy. This screen is only for adding species to existing genera.`,
          [{ text: 'OK' }]
        );
        return;
      }

      // Add species to existing genus
      await addSpeciesToExistingGenus(existingGenus, species);
      Alert.alert(
        'Success', 
        `${species.length} species successfully added to existing genus "${genusName}".`,
        [{ text: 'OK', onPress: () => navigation.goBack() }]
      );

    } catch (error) {
      console.error('Error adding species to taxonomy:', error);
      Alert.alert('Error', 'Failed to add species to taxonomy. Please try again.');
    }
  };

  const addSpeciesToExistingGenus = async (existingGenus, newSpecies) => {
    try {
      // Merge new species with existing species (avoid duplicates)
      const existingSpeciesNames = existingGenus.species ? 
        existingGenus.species.map(s => s.name.toLowerCase()) : [];
      
      const speciesToAdd = newSpecies.filter(newSpecie => 
        !existingSpeciesNames.includes(newSpecie.name.toLowerCase())
      );

      if (speciesToAdd.length === 0) {
        Alert.alert('Info', 'All species already exist in this genus.');
        return;
      }

      const updatedSpecies = [
        ...(existingGenus.species || []),
        ...speciesToAdd
      ];

      const updateData = {
        ...existingGenus,
        species: updatedSpecies,
        receivedPlants: (existingGenus.receivedPlants || 0) + speciesToAdd.length
      };

      await updateTaxonomyItemApi(existingGenus.id, updateData);
      console.log(`Added ${speciesToAdd.length} new species to existing genus:`, speciesToAdd);
    } catch (error) {
      console.error('Error adding species to existing genus:', error);
      throw error;
    }
  };

  const renderSpecieItem = ({ item }) => {
    // Determine background color based on species name
    const cardBackgroundColor = item.name === 'Adansonii' ? '#F5F6F6' : '#DFECDF';
    
    return (
      <View style={[styles.specieCard, { backgroundColor: cardBackgroundColor }]}>
        <View style={styles.specieContent}>
          <View style={styles.specieInfo}>
            <Text style={styles.specieName}>{item.name}</Text>
            {item.variegation && (
              <Text style={styles.variegationText}>{item.variegation}</Text>
            )}
          </View>
          <TouchableOpacity onPress={() => handleEditSpecie(item)} style={styles.editAction}>
            <ThreeDotsIcon width={24} height={24} />
          </TouchableOpacity>
        </View>
        <View style={styles.specieDetails}>
          <View style={styles.indexInfo}>
            <View style={styles.indexItem}>
              <ShippingIcon width={24} height={24} />
              <Text style={styles.shippingText}>
                {item.shipping || 'Best (7-10)'}
              </Text>
            </View>
            <View style={styles.indexItem}>
              <AcclimationIcon width={19} height={18} />
              <Text style={styles.acclimationText}>
                {item.acclimation || 'Better (4-6)'}
              </Text>
            </View>
          </View>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 18 }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Add to Existing Taxonomy</Text>
        <View style={styles.headerRight} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {/* Form */}
        <View style={styles.formSection}>
          {/* Genus Field */}
          <View style={styles.fieldSection}>
            <View style={styles.textField}>
              <Text style={styles.label}>
                Genus name <Text style={styles.asterisk}>*</Text>
              </Text>
              <View style={styles.inputContainer}>
                <TextInput
                  style={[styles.textInput, { minHeight: 22 }]}
                  placeholder="Monstera"
                  value={genusName}
                  onChangeText={setGenusName}
                  placeholderTextColor="#666666"
                  autoCapitalize="words"
                  autoCorrect={false}
                  returnKeyType="done"
                  multiline={false}
                />
              </View>
            </View>
          </View>

          {/* Divider */}
          <View style={styles.dividerSection}>
            <View style={styles.divider} />
          </View>

          {/* Specie List Title */}
          <View style={styles.specieTitleSection}>
            <View style={styles.titleRow}>
              <Text style={styles.specieListTitle}>Specie List</Text>
              <Text style={styles.quantityText}>{`${species.length} specie(s)`}</Text>
            </View>
          </View>

          {/* Specie List */}
          <View style={styles.specieListSection}>
            <FlatList
              data={species}
              keyExtractor={(item) => item.id.toString()}
              renderItem={renderSpecieItem}
              scrollEnabled={false}
              showsVerticalScrollIndicator={false}
              ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
            />
          </View>

          {/* Add Specie Button */}
          <View style={styles.addSpecieSection}>
            <TouchableOpacity style={styles.addSpecieButton} onPress={handleAddSpecie}>
              <PlusIcon width={24} height={24} />
              <Text style={styles.addSpecieText}>Add Specie</Text>
            </TouchableOpacity>
          </View>

          {/* Approve Request Button */}
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.saveButton} onPress={handleApproveRequest}>
              <View style={styles.saveButtonTextContainer}>
                <Text style={styles.saveButtonText}>Update Taxonomy</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Add Specie Modal */}
      <AddSpecieModal
        visible={isAddSpecieModalVisible}
        onClose={handleCloseAddSpecieModal}
        onSave={handleSaveSpecie}
      />

      {/* Specie Options Modal */}
      <SpecieOptionsModal
        visible={isSpecieOptionsModalVisible}
        onClose={handleCloseSpecieOptions}
        onEdit={handleEditSpecieAction}
        onDelete={handleDeleteSpecieAction}
        specieName={selectedSpecie?.name}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  backButton: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  headerRight: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },

  // Content
  content: {
    flex: 1,
    paddingTop: 18,
  },

  // Form Section
  formSection: {
    flex: 1,
  },

  // Field Section
  fieldSection: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  textField: {
    gap: 8,
  },
  label: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
  },
  asterisk: {
    color: '#FF0000',
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#202325',
    lineHeight: 22,
    paddingVertical: 0,
  },

  // Divider
  dividerSection: {
    paddingVertical: 8,
  },
  divider: {
    height: 12,
    backgroundColor: '#F5F6F6',
  },

  // Specie Title
  specieTitleSection: {
    paddingVertical: 16,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  specieListTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  quantityText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },

  // Specie List
  specieListSection: {
    paddingHorizontal: 12,
  },
  specieCard: {
    borderRadius: 0,
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  specieContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    marginBottom: 6,
  },
  specieInfo: {
    flex: 1,
    gap: 4,
  },
  specieName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  variegationText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  editAction: {
    width: 24,
    height: 24,
  },
  specieDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 6,
    paddingVertical: 0,
    gap: 8,
    width: 351,
    height: 28,
    alignSelf: 'stretch',
  },
  indexInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: 375,
    height: 28,
    alignSelf: 'stretch',
  },
  indexItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 6,
    width: 185,
    height: 28,
    flex: 1,
  },
  indexText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    height: 22,
  },
  shippingText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    height: 22,
  },
  acclimationText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    height: 22,
  },
  textTooltipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    height: 28,
  },

  // Add Specie Section
  addSpecieSection: {
    paddingVertical: 12,
    paddingHorizontal: 24,
  },
  addSpecieButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 48,
    backgroundColor: '#414649',
    borderRadius: 12,
    gap: 8,
  },
  addSpecieTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  addSpecieText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },

  // Action Section
  actionSection: {
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
  saveButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
  },
  saveButtonTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
  },
  saveButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },
});

export default AddToTaxonomyScreen;
