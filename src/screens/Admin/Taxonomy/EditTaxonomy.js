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
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';

// Import API
import { updatePlantTaxonomyApi } from '../../../auth/updatePlantTaxonomyApi';
import { deletePlantTaxonomyApi } from '../../../auth/deletePlantTaxonomyApi';
import eventBus from '../../../utils/eventBus';
import { getSpeciesForGenusApi, formatSpeciesForDisplay } from '../../../auth/getSpeciesForGenusApi';
import { getStoredAuthToken } from '../../../utils/getStoredAuthToken';
import { getStoredAdminId } from '../../../utils/getStoredUserInfo';

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
import SearchIcon from '../../../assets/iconnav/search.svg';

const EditTaxonomy = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  // Get the taxonomy data passed from the previous screen
  const { taxonomyData = {} } = route.params || {};
  
  const [genusName, setGenusName] = useState(taxonomyData.name || '');
  const [originalGenusName] = useState(taxonomyData.name || ''); // Keep track of original name
  const [isLoading, setIsLoading] = useState(false);
  const [isLoadingSpecies, setIsLoadingSpecies] = useState(true);
  const [isAddSpecieModalVisible, setIsAddSpecieModalVisible] = useState(false);
  const [isSpecieOptionsModalVisible, setIsSpecieOptionsModalVisible] = useState(false);
  const [selectedSpecie, setSelectedSpecie] = useState(null);
  
  // Initialize with empty species - will be loaded from API
  const [species, setSpecies] = useState([]);
  const [speciesError, setSpeciesError] = useState(null);
  
  // Track newly added species that need to be saved to API
  const [newlyAddedSpecies, setNewlyAddedSpecies] = useState([]);
  
  // Search query for filtering species
  const [searchQuery, setSearchQuery] = useState('');

  // Debug logging
  console.log('🌿 EditTaxonomy render state:', {
    taxonomyData: !!taxonomyData,
    genusName,
    genusId: taxonomyData.id,
    isLoading,
    isLoadingSpecies,
    hasGenusName: !!genusName.trim()
  });

  // Initialize data when component mounts
  useEffect(() => {
    if (taxonomyData && taxonomyData.name) {
      setGenusName(taxonomyData.name);
      console.log('📝 Initialized genus name:', taxonomyData.name);
    }
    
    // Load species data
    if (taxonomyData && taxonomyData.id) {
      loadSpeciesData();
    }
  }, [taxonomyData]);

  // Refresh species when returning from EditSpecieScreen
  useEffect(() => {
    const unsubscribe = navigation.addListener('focus', () => {
      // Reload species list to reflect any edits
      if (taxonomyData && taxonomyData.id) {
        loadSpeciesData();
      }
    });
    return unsubscribe;
  }, [navigation, taxonomyData?.id]);

  // Function to load species data for this genus
  const loadSpeciesData = async () => {
    if (!taxonomyData.id) {
      console.warn('⚠️ No genus ID provided, cannot load species');
      setIsLoadingSpecies(false);
      return;
    }

    try {
      setIsLoadingSpecies(true);
      setSpeciesError(null);
      
      console.log('🔄 Loading species for genus:', {
        id: taxonomyData.id,
        name: taxonomyData.name,
        source: taxonomyData.source
      });

      // Retrieve auth token
      const authToken = await getStoredAuthToken();
      if (!authToken) {
        console.warn('⚠️ No auth token found. Request may fail in production.');
      }

      // Send both ID and name to allow backend fallback when needed
      const response = await getSpeciesForGenusApi({
        genusId: taxonomyData.id,
        genusName: taxonomyData.name,
        authToken
      });

      if (response.success) {
        console.log('✅ Species loaded successfully:', {
          count: response.count,
          genusName: response.genusInfo?.name
        });

        // Format species data for display
        const formattedSpecies = formatSpeciesForDisplay(response.data);
        setSpecies(formattedSpecies);
      } else {
        console.log('🔍 No species response received, treating as empty species list');
        setSpecies([]);
        setSpeciesError(null); // Clear any previous errors
      }
    } catch (error) {
      console.error('❌ getSpeciesForGenusApi error:', error);
      // Don't treat API errors as failures - just show empty state
      setSpecies([]);
      setSpeciesError(null);
      console.log('🔄 API error occurred, showing empty species list instead of error state');
    } finally {
      setIsLoadingSpecies(false);
    }
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
    
    // Create the new specie object for display
    const newSpecie = {
      id: `temp_${Date.now()}`, // Use timestamp for temp ID
      name: specieData.name || specieData.specieName,
      variegation: specieData.variegation,
      shipping: specieData.shippingIndex,
      acclimation: specieData.acclimationIndex,
    };
    
    // Create the new specie object for API (matching expected format)
    const newSpecieForAPI = {
      name: specieData.name || specieData.specieName,
      variegation: specieData.variegation || '',
      shippingIndex: specieData.shippingIndex || '',
      acclimationIndex: specieData.acclimationIndex || '',
    };
    
    // Add to display list
    setSpecies([...species, newSpecie]);
    
    // Add to newly added species for API submission
    setNewlyAddedSpecies([...newlyAddedSpecies, newSpecieForAPI]);
    
    setIsAddSpecieModalVisible(false);
    
    console.log('Added to newly added species:', newSpecieForAPI);
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
    // Navigate to EditSpecieScreen with specie data and genus context
    navigation.navigate('EditSpecieScreen', { 
      specieData: selectedSpecie,
      genusId: taxonomyData.id,
      genusName: taxonomyData.name
    });
  };

  const handleDeleteSpecieAction = () => {
    if (!selectedSpecie) return;
    console.log('Request delete specie:', selectedSpecie);

    // Guard: Require a formal species id (catalog_* cannot be deleted)
    // This allows deletion of manually-added species even in catalog-derived genera
    const invalidId = !selectedSpecie.id || String(selectedSpecie.id).startsWith('catalog_');
    if (invalidId) {
      Alert.alert(
        'Not available',
        'This species comes from the catalog and is not a formal taxonomy entry yet, so it cannot be deleted here.'
      );
      return;
    }

    Alert.alert(
      'Delete species?',
      `Are you sure you want to delete "${selectedSpecie.name}" from ${genusName}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoadingSpecies(true);

              // Retrieve auth token
              const authToken = await getStoredAuthToken();
              if (!authToken) {
                console.warn('⚠️ No auth token found. Delete may fail in production.');
              }

              // Optional: retrieve adminId from storage for emulator/local testing fallback
              const storedAdminId = await getStoredAdminId();

              // Persist single deletion immediately
              const response = await updatePlantTaxonomyApi({
                genusId: taxonomyData.id,
                genusName: taxonomyData.name, // Include genus name for synthetic ID resolution
                authToken,
                // Provide adminId only if available (useful for emulator/local mode)
                ...(storedAdminId ? { adminId: storedAdminId } : {}),
                species: [{ id: selectedSpecie.id, name: selectedSpecie.name, action: 'delete' }]
              });

              if (response?.success) {
                // Update UI list
                setSpecies(prev => prev.filter(s => s.id !== selectedSpecie.id));
                // Emit event so Genus List can update the count immediately
                eventBus.emit('speciesDeleted', {
                  genusId: taxonomyData.id,
                  genusName: taxonomyData.name,
                  delta: -1
                });
                // Optionally notify user
                Alert.alert('Deleted', `${selectedSpecie.name} was deleted.`);
              } else {
                Alert.alert('Error', response?.error || 'Failed to delete species.');
              }
            } catch (err) {
              console.error('❌ delete specie error:', err);
              Alert.alert('Error', 'Failed to delete species.');
            } finally {
              setIsLoadingSpecies(false);
            }
          }
        }
      ]
    );
  };

  const handleSave = async () => {
    if (!genusName.trim()) {
      Alert.alert('Error', 'Please enter a genus name');
      return;
    }

    if (!taxonomyData.id) {
      Alert.alert('Error', 'Taxonomy ID is missing');
      return;
    }

    setIsLoading(true);

    try {
      console.log('🌱 Updating plant taxonomy...');
      console.log('Original genus name:', originalGenusName);
      console.log('New genus name:', genusName.trim());
      console.log('Taxonomy ID:', taxonomyData.id);
      console.log('Newly added species:', newlyAddedSpecies);

      // Retrieve auth token
      const authToken = await getStoredAuthToken();
      if (!authToken) {
        console.warn('⚠️ No auth token found. Update may fail in production.');
      }

      // Optional: retrieve adminId from storage for emulator/local testing fallback
      const storedAdminId = await getStoredAdminId();

      // First, handle genus name update if needed
      if (genusName.trim() !== originalGenusName) {
        console.log('📝 Updating genus name...');
        const genusUpdateData = {
          genusId: taxonomyData.id,
          genusName: originalGenusName, // Include original genus name for synthetic ID resolution
          newGenusName: genusName.trim(),
          authToken,
          ...(storedAdminId ? { adminId: storedAdminId } : {}),
        };

        const genusResponse = await updatePlantTaxonomyApi(genusUpdateData);
        
        if (!genusResponse.success) {
          throw new Error(genusResponse.error || 'Failed to update genus name');
        }
        console.log('✅ Genus name updated successfully');
      }

      // Then, handle newly added species if any
      if (newlyAddedSpecies.length > 0) {
        console.log('🌿 Adding new species...');
        
        // Prepare species data with action: 'add'
        const speciesWithAction = newlyAddedSpecies.map(species => ({
          ...species,
          action: 'add'
        }));
        
        const speciesUpdateData = {
          genusId: taxonomyData.id,
          genusName: genusName.trim(), // Include genus name for synthetic ID resolution
          species: speciesWithAction,
          authToken,
          ...(storedAdminId ? { adminId: storedAdminId } : {}),
        };

        const speciesResponse = await updatePlantTaxonomyApi(speciesUpdateData);

        if (!speciesResponse.success) {
          throw new Error(speciesResponse.error || 'Failed to add new species');
        }
        console.log('✅ New species added successfully');
        
        // Clear newly added species after successful save
        setNewlyAddedSpecies([]);
      }

      // Set success response
      const response = { success: true, message: 'Taxonomy updated successfully!' };

      if (response.success) {
        console.log('✅ Taxonomy updated successfully:', response.data);
        
        Alert.alert(
          'Success', 
          response.message || 'Taxonomy updated successfully!',
          [
      { text: 'OK', onPress: () => navigation.goBack() }
          ]
        );
  // no-op
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
      setIsLoading(false);
    }
  };

  const handleDelete = () => {
    // Check if this is a plant catalog genus that cannot be deleted
    if (taxonomyData.source === 'plant_catalog') {
      Alert.alert(
        'Cannot Delete',
        'This genus is derived from the plant catalog and cannot be deleted. Only taxonomy entries created through the admin interface can be deleted.',
        [{ text: 'OK' }]
      );
      return;
    }

    // Check if genusId looks like a Firestore document ID (not a catalog ID like "26")
    if (!taxonomyData.id || typeof taxonomyData.id === 'number' || taxonomyData.id.length < 10) {
      Alert.alert(
        'Cannot Delete',
        'This genus appears to be from the plant catalog and cannot be deleted through the admin interface.',
        [{ text: 'OK' }]
      );
      return;
    }

    Alert.alert(
      'Delete Taxonomy',
      `Are you sure you want to delete the genus "${genusName}" and all its species? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsLoading(true);
              console.log('🗑️ Deleting taxonomy:', taxonomyData.id);

              // Retrieve auth token
              const authToken = await getStoredAuthToken();
              if (!authToken) {
                console.warn('⚠️ No auth token found. Delete may fail in production.');
              }

              // Optional: retrieve adminId from storage for emulator/local testing fallback
              const storedAdminId = await getStoredAdminId();
              
              // Call delete API
              const response = await deletePlantTaxonomyApi({
                genusId: taxonomyData.id,
                authToken,
                // Provide adminId only if available (useful for emulator/local mode)
                ...(storedAdminId ? { adminId: storedAdminId } : {}),
              });

              if (response.success) {
                // Emit event to refresh genus list
                eventBus.emit('genusListUpdate');
                
                Alert.alert(
                  'Deleted',
                  `Genus "${genusName}" and ${response.data.deletedSpeciesCount} species have been deleted.`,
                  [{ text: 'OK', onPress: () => navigation.goBack() }]
                );
              } else {
                throw new Error(response.error || 'Failed to delete taxonomy');
              }
            } catch (error) {
              console.error('❌ Error deleting taxonomy:', error);
              Alert.alert('Error', 'Failed to delete taxonomy. Please try again.');
            } finally {
              setIsLoading(false);
            }
          }
        }
      ]
    );
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
                {item.shipping || 'N/A'}
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
                {item.acclimation || 'N/A'}
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

  // Filter species based on search query
  const filteredSpecies = searchQuery.trim() 
    ? species.filter(specie => 
        specie.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
        specie.variegation?.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : species;

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
      <FlatList
        style={styles.content}
        data={isLoadingSpecies || speciesError ? [] : filteredSpecies}
        keyExtractor={(item) => item.id.toString()}
        renderItem={renderSpecieItem}
        ItemSeparatorComponent={() => <View style={{ height: 6 }} />}
        showsVerticalScrollIndicator={true}
        keyboardDismissMode="on-drag"
        keyboardShouldPersistTaps="handled"
        contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
        ListHeaderComponent={(
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
                    value={genusName.toUpperCase()}
                    onChangeText={(text) => setGenusName(text.toUpperCase())}
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

            {/* Specie List Title with Search */}
            <View style={styles.specieTitleSection}>
              <View style={styles.titleRow}>
                <Text style={styles.specieListTitle}>Specie List</Text>
                <Text style={styles.quantityText}>{`${species.length} specie(s)`}</Text>
              </View>
              <View style={styles.searchBarContainer}>
                <SearchIcon width={20} height={20} />
                <TextInput
                  style={styles.searchInput}
                  placeholder="Search species..."
                  placeholderTextColor="#647276"
                  value={searchQuery}
                  onChangeText={setSearchQuery}
                  autoCapitalize="none"
                  autoCorrect={false}
                />
              </View>
            </View>

            {/* Loading / Error States */}
            {isLoadingSpecies && (
              <View style={[styles.specieListSection, { paddingBottom: 0 }]}>
                <View style={styles.loadingContainer}>
                  <ActivityIndicator size="small" color="#4A90E2" />
                  <Text style={styles.loadingText}>Loading species...</Text>
                </View>
              </View>
            )}

            {speciesError && !isLoadingSpecies && (
              <View style={styles.specieListSection}>
                <View style={styles.errorContainer}>
                  <Text style={styles.errorText}>{speciesError}</Text>
                  <TouchableOpacity 
                    style={styles.retryButton} 
                    onPress={loadSpeciesData}
                  >
                    <Text style={styles.retryButtonText}>Retry</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>
        )}
        ListEmptyComponent={(!isLoadingSpecies && !speciesError) ? (
          <View style={styles.specieListSection}>
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No species added yet for {genusName}</Text>
              <Text style={styles.emptySubtext}>
                {taxonomyData.source === 'plant_catalog' 
                  ? 'This genus exists in the plant catalog. Add species to organize the taxonomy.'
                  : 'Add species to get started with this genus.'
                }
              </Text>
            </View>
          </View>
        ) : null}
        ListFooterComponent={(
          <View>
            {/* Add Specie Button */}
            <View style={styles.addSpecieSection}>
              <TouchableOpacity style={styles.addSpecieButton} onPress={handleAddSpecie}>
                <PlusIcon width={24} height={24} />
                <Text style={styles.addSpecieText}>Add Specie</Text>
              </TouchableOpacity>
            </View>

            {/* Save Button */}
            <View style={styles.actionSection}>
              <TouchableOpacity 
                style={[
                  styles.saveButton, 
                  (isLoading || !genusName.trim()) && styles.saveButtonDisabled
                ]} 
                onPress={() => {
                  console.log('🔘 Save button pressed, isLoading:', isLoading, 'genusName:', genusName.trim());
                  handleSave();
                }}
                disabled={isLoading || !genusName.trim()}
                accessibilityRole="button"
                accessibilityLabel="Update taxonomy"
                accessibilityHint="Saves changes to the genus name"
                accessibilityState={{ disabled: isLoading || !genusName.trim() }}
              >
                <View style={styles.saveButtonTextContainer}>
                  {isLoading ? (
                    <ActivityIndicator color="#FFFFFF" size="small" />
                  ) : (
                    <Text style={styles.saveButtonText}>
                      Update Taxonomy{newlyAddedSpecies.length > 0 || genusName.trim() !== originalGenusName ? ` (${newlyAddedSpecies.length + (genusName.trim() !== originalGenusName ? 1 : 0)} changes)` : ''}
                    </Text>
                  )}
                </View>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />

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
    paddingHorizontal: 24,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
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
  searchBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 8,
    height: 40,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    padding: 0,
  },

  // Specie List
  specieListSection: {
  paddingHorizontal: 12,
  paddingBottom: 12,
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
    alignSelf: 'stretch',
  },
  indexInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    alignSelf: 'stretch',
  },
  indexItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 6,
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
    backgroundColor: '#56a65dff',
    borderRadius: 12,
  },
  saveButtonDisabled: {
    backgroundColor: '#B0B0B0',
    opacity: 0.6,
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
  loadingContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 20,
    gap: 8,
  },
  loadingText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
  },
  errorContainer: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: 12,
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#FF3B30',
    textAlign: 'center',
  },
  retryButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#4A90E2',
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    alignItems: 'center',
    paddingVertical: 32,
    gap: 8,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    color: '#333',
    textAlign: 'center',
  },
  emptySubtext: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
});

export default EditTaxonomy;
