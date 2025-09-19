import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  FlatList,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

// Import components
import AddSpecieModal from './AddSpecieModal';
import SpecieOptionsModal from './SpecieOptionsModal';

// Import icons
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import PlusIcon from '../../../assets/admin-icons/plus.svg';
import ThreeDotsIcon from '../../../assets/admin-icons/three-dots.svg';
import DeleteIcon from '../../../assets/admin-icons/delete-new.svg';
import ShippingIcon from '../../../assets/admin-icons/shipping.svg';
import AcclimationIcon from '../../../assets/admin-icons/acclimation.svg';
import InfoIcon from '../../../assets/admin-icons/info.svg';

const EditTaxonomy = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  // Get the taxonomy data passed from the previous screen
  const { taxonomyData = {} } = route.params || {};
  
  const [genusName, setGenusName] = useState('');
  const [isAddSpecieModalVisible, setIsAddSpecieModalVisible] = useState(false);
  const [isSpecieOptionsModalVisible, setIsSpecieOptionsModalVisible] = useState(false);
  const [selectedSpecie, setSelectedSpecie] = useState(null);
  
  // Debug log to check if state is empty
  console.log('genusName state:', genusName, 'length:', genusName.length);
  const [species, setSpecies] = useState([
    { id: 1, name: 'Accuminata', shipping: 'Better (7-10)', acclimation: 'Better (4-6)' },
    { id: 2, name: 'Adansonii', variegation: 'Green Marble', shipping: 'Good (5-8)', acclimation: 'Average (3-5)' },
  ]);

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

  const handleSave = () => {
    console.log('Save taxonomy:', { genusName, species });
    // Handle save logic and navigate back
    navigation.goBack();
  };

  const handleDelete = () => {
    console.log('Delete taxonomy');
    // Handle delete logic - could show confirmation modal
    navigation.goBack();
  };

  const renderSpecieItem = ({ item }) => (
    <View style={styles.specieCard}>
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
            <View style={styles.shippingTextTooltip}>
              <Text style={styles.shippingText}>
                Best (7-10)
              </Text>
              <View style={styles.tooltipContainer}>
                <InfoIcon width={28} height={28} />
              </View>
            </View>
          </View>
          <View style={styles.indexItem}>
            <AcclimationIcon width={19} height={18} />
            <View style={styles.acclimationTextTooltip}>
              <Text style={styles.acclimationText}>
                Better (4-6)
              </Text>
              <View style={styles.tooltipContainer}>
                <InfoIcon width={28} height={28} />
              </View>
            </View>
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      {/* Header */}
      <View style={[styles.header, { paddingTop: insets.top + 18 }]}>
        <TouchableOpacity onPress={handleGoBack} style={styles.backButton}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Update Plant Taxonomy</Text>
        <TouchableOpacity onPress={handleDelete} style={styles.deleteButton}>
          <DeleteIcon width={40} height={40} />
        </TouchableOpacity>
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
                  placeholder="Montsera"
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

          {/* Save Button */}
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.saveButton} onPress={handleSave}>
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
  },
  deleteButton: {
    width: 40,
    height: 40,
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
    backgroundColor: '#F5F6F6',
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
  shippingTextTooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 6,
    width: 130,
    height: 28,
  },
  acclimationTextTooltip: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 6,
    width: 140,
    height: 28,
  },
  tooltipContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 0,
    marginTop: 5,
    width: 28,
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
    backgroundColor: '#C0DAC2',
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

export default EditTaxonomy;
