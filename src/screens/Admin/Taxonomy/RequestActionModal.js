import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';

// Import API
import { getAdminTaxonomyApi } from '../../../components/Api';

// Import icons - you may need to adjust these paths based on your available icons
import CheckApproveIcon from '../../../assets/admin-icons/check-approve.svg';
import CloseRejectIcon from '../../../assets/admin-icons/close-reject.svg';

const { height: screenHeight } = Dimensions.get('window');

const RequestActionModal = ({ visible, onClose, onApprove, onReject, request }) => {
  const navigation = useNavigation();
  const [existingTaxonomyData, setExistingTaxonomyData] = useState([]);
  const [isLoadingTaxonomy, setIsLoadingTaxonomy] = useState(false);

  // Load existing taxonomy data when modal becomes visible
  useEffect(() => {
    if (visible) {
      loadExistingTaxonomy();
    }
  }, [visible]);

  const loadExistingTaxonomy = async () => {
    try {
      setIsLoadingTaxonomy(true);
      
      // Try to load from API first
      const response = await getAdminTaxonomyApi({ limit: 1000 });
      
      if (response && response.data && response.data.length > 0) {
        setExistingTaxonomyData(response.data);
        console.log('Loaded existing taxonomy from API:', response.data);
      } else {
        // Fallback to mock data if API returns empty or fails
        console.log('API returned empty or failed, using mock data fallback');
        const mockTaxonomyData = [
          { id: 1, genusName: 'Alocasia', name: 'Alocasia', receivedPlants: 5 },
          { id: 2, genusName: 'Anthurium', name: 'Anthurium', receivedPlants: 12 },
          { id: 3, genusName: 'Monstera', name: 'Monstera', receivedPlants: 8 },
          { id: 4, genusName: 'Philodendron', name: 'Philodendron', receivedPlants: 15 },
          { id: 5, genusName: 'Pothos', name: 'Pothos', receivedPlants: 3 },
          { id: 6, genusName: 'Syngonium', name: 'Syngonium', receivedPlants: 7 },
          { id: 7, genusName: 'Aglaonema', name: 'Aglaonema', receivedPlants: 9 },
          { id: 8, genusName: 'Calathea', name: 'Calathea', receivedPlants: 6 },
          { id: 9, genusName: 'Dracaena', name: 'Dracaena', receivedPlants: 4 },
          { id: 10, genusName: 'Ficus', name: 'Ficus', receivedPlants: 11 },
        ];
        setExistingTaxonomyData(mockTaxonomyData);
        console.log('Using mock taxonomy data:', mockTaxonomyData);
      }
    } catch (error) {
      console.error('Error loading existing taxonomy in modal:', error);
      // Use mock data as fallback
      const mockTaxonomyData = [
        { id: 1, genusName: 'Alocasia', name: 'Alocasia', receivedPlants: 5 },
        { id: 2, genusName: 'Anthurium', name: 'Anthurium', receivedPlants: 12 },
        { id: 3, genusName: 'Monstera', name: 'Monstera', receivedPlants: 8 },
        { id: 4, genusName: 'Philodendron', name: 'Philodendron', receivedPlants: 15 },
        { id: 5, genusName: 'Pothos', name: 'Pothos', receivedPlants: 3 },
        { id: 6, genusName: 'Syngonium', name: 'Syngonium', receivedPlants: 7 },
        { id: 7, genusName: 'Aglaonema', name: 'Aglaonema', receivedPlants: 9 },
        { id: 8, genusName: 'Calathea', name: 'Calathea', receivedPlants: 6 },
        { id: 9, genusName: 'Dracaena', name: 'Dracaena', receivedPlants: 4 },
        { id: 10, genusName: 'Ficus', name: 'Ficus', receivedPlants: 11 },
      ];
      setExistingTaxonomyData(mockTaxonomyData);
      console.log('API failed, using mock taxonomy data:', mockTaxonomyData);
    } finally {
      setIsLoadingTaxonomy(false);
    }
  };

  const checkIfGenusExists = (genus) => {
    console.log('Checking if genus exists:', genus);
    console.log('Available taxonomy data:', existingTaxonomyData);
    
    const found = existingTaxonomyData.find(item => {
      const itemGenusName = item.genusName || item.name || '';
      const matches = itemGenusName.toLowerCase() === genus.toLowerCase();
      console.log(`Comparing "${itemGenusName.toLowerCase()}" with "${genus.toLowerCase()}" = ${matches}`);
      return matches;
    });
    
    console.log('Found existing genus:', found);
    return found;
  };

  const handleAddToTaxonomyList = async () => {
    console.log('=== STARTING TAXONOMY CHECK ===');
    
    if (isLoadingTaxonomy) {
      Alert.alert('Please wait', 'Loading taxonomy data...');
      return;
    }

    // Get genus name from request data
    const genusName = request?.genusName || request?.genus || '';
    
    if (!genusName) {
      console.log('No genus name found in request:', request);
      Alert.alert('Error', 'No genus name found in request data');
      return;
    }

    console.log('Request data:', request);
    console.log('Genus name from request:', genusName);
    console.log('Existing taxonomy count:', existingTaxonomyData.length);

    // Check if genus exists
    const existingGenus = checkIfGenusExists(genusName.trim());
    
    console.log('=== DECISION ===');
    console.log('Existing genus found:', !!existingGenus);
    console.log('Navigation decision:', existingGenus ? 'AddToTaxonomyScreen' : 'AddNewPlantTaxonomyScreen');
    
    onClose();
    
    if (existingGenus) {
      // Genus exists - navigate to Add to Existing Taxonomy
      console.log('✅ Genus exists, navigating to AddToTaxonomyScreen');
      navigation.navigate('AddToTaxonomyScreen', { requestData: request });
    } else {
      // Genus doesn't exist - navigate to Add New Plant Taxonomy
      console.log('🆕 Genus does not exist, navigating to AddNewPlantTaxonomyScreen');
      navigation.navigate('AddNewPlantTaxonomyScreen', { requestData: request });
    }
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          activeOpacity={1} 
          onPress={onClose}
        />
        
        {/* Taxonomy: Request->Option */}
        <View style={styles.container}>
          {/* Action Sheet */}
          <View style={styles.actionSheet}>
            {/* System / Action Sheet Indicator */}
            <View style={styles.indicatorContainer}>
              {/* Indicator Bar */}
              <View style={styles.indicatorBar} />
            </View>
            
            {/* Content */}
            <View style={styles.content}>
              {/* First Option - Add to taxonomy list */}
              <View style={styles.options}>
                <TouchableOpacity 
                  style={styles.listLeft}
                  onPress={handleAddToTaxonomyList}
                >
                  {/* Icon */}
                  <View style={styles.iconContainer}>
                    <CheckApproveIcon width={19} height={14} />
                  </View>
                  {/* List title */}
                  <Text style={styles.listTitle}>Add to taxonomy list</Text>
                </TouchableOpacity>
                
                <View style={styles.listRight}>
                  {/* Icon placeholder for right side */}
                </View>
              </View>
              
              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
              </View>
              
              {/* Second Option - Reject */}
              <View style={styles.options}>
                <TouchableOpacity 
                  style={styles.listLeft}
                  onPress={() => {
                    onReject(request);
                    onClose();
                  }}
                >
                  {/* Icon */}
                  <View style={styles.iconContainer}>
                    <CloseRejectIcon width={24} height={24} />
                  </View>
                  {/* List title */}
                  <Text style={styles.listTitle}>Reject request</Text>
                </TouchableOpacity>
                
                <View style={styles.listRight}>
                  {/* Icon placeholder for right side */}
                </View>
              </View>
              
              {/* Final Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
              </View>
            </View>
            
            {/* Action Home Indicator */}
            <View style={styles.actionHomeIndicator}>
              {/* Gesture Bar */}
              <View style={styles.gestureBar} />
            </View>
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
    justifyContent: 'flex-end',
  },
  
  overlayTouchable: {
    flex: 1,
  },
  
  /* Taxonomy: Request->Option */
  container: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 0,
    position: 'relative',
    width: '100%',
    height: 196,
  },
  
  /* Action Sheet */
  actionSheet: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingBottom: 34,
    width: '100%',
    height: 196,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  
  /* System / Action Sheet Indicator */
  indicatorContainer: {
    width: '100%',
    height: 24,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  /* Indicator Bar */
  indicatorBar: {
    position: 'absolute',
    width: '12.8%', // Approximately matches the Figma percentages
    height: '20%',
    backgroundColor: '#E4E7E9',
    borderRadius: 100,
    top: '33.33%',
  },
  
  /* Content */
  content: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 8,
    width: '100%',
    height: 138,
  },
  
  /* Options */
  options: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    width: '100%',
    height: 48,
  },
  
  /* List Left */
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 0,
    gap: 8,
    flex: 1,
    height: 48,
    minHeight: 48,
  },
  
  /* Icon */
  iconContainer: {
    width: 24,
    height: 24,
  },
  
  /* List title */
  listTitle: {
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#393D40',
  },
  
  /* List Right */
  listRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 0,
    paddingRight: 16,
    gap: 8,
    flex: 1,
    height: 48,
    minHeight: 48,
  },
  
  /* Divider Container */
  dividerContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 8,
    width: '100%',
    height: 17,
  },
  
  /* Divider */
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4E7E9',
  },
  
  /* Action Home Indicator */
  actionHomeIndicator: {
    position: 'absolute',
    width: '100%',
    height: 34,
    left: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  /* Gesture Bar */
  gestureBar: {
    position: 'absolute',
    width: 148,
    height: 5,
    backgroundColor: '#202325',
    borderRadius: 100,
    bottom: 8,
  },
});

export default RequestActionModal;
