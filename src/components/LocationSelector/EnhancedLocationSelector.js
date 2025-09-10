import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
  ScrollView,
  SafeAreaView,
} from 'react-native';
import { Dropdown } from 'react-native-element-dropdown';
import { getUSRegionsApi, getRegionCitiesApi, formatRegionsForApp, formatCitiesForApp } from '../../components/Api/geoDbApi';

const EnhancedLocationSelector = ({ onLocationSelected }) => {
  const [regions, setRegions] = useState([]);
  const [cities, setCities] = useState([]);
  const [selectedRegion, setSelectedRegion] = useState(null);
  const [selectedCity, setSelectedCity] = useState(null);
  const [loadingRegions, setLoadingRegions] = useState(false);
  const [loadingCities, setLoadingCities] = useState(false);

  // Load US regions when component mounts
  useEffect(() => {
    loadUSRegions();
  }, []);

  // Load cities when a region is selected
  useEffect(() => {
    if (selectedRegion) {
      loadCitiesForRegion(selectedRegion.isoCode);
    } else {
      setCities([]);
      setSelectedCity(null);
    }
  }, [selectedRegion]);

  const loadUSRegions = async () => {
    setLoadingRegions(true);
    try {
      console.log('🏛️ Loading US regions from GeoDB...');
      const response = await getUSRegionsApi(55); // Get all US states + territories
      
      if (response.success && response.data) {
        const formattedRegions = formatRegionsForApp(response.data);
        
        // Transform for dropdown component
        const dropdownRegions = formattedRegions.map(region => ({
          label: region.name,
          value: region.isoCode,
          ...region
        }));
        
        // Sort alphabetically
        dropdownRegions.sort((a, b) => a.label.localeCompare(b.label));
        
        setRegions(dropdownRegions);
        console.log('✅ Loaded', dropdownRegions.length, 'US regions');
      } else {
        throw new Error(response.error || 'Failed to load regions');
      }
    } catch (error) {
      console.error('❌ Error loading US regions:', error);
      Alert.alert('Error', 'Failed to load US states. Please try again.');
    } finally {
      setLoadingRegions(false);
    }
  };

  const loadCitiesForRegion = async (regionCode) => {
    setLoadingCities(true);
    setCities([]);
    setSelectedCity(null);
    
    try {
      console.log('🏙️ Loading cities for region:', regionCode);
      
      // Load cities in batches since GeoDB has pagination
      let allCities = [];
      let offset = 0;
      const limit = 100;
      let hasMore = true;
      
      while (hasMore && allCities.length < 1000) { // Safety limit
        const response = await getRegionCitiesApi('US', regionCode, limit, offset);
        
        if (response.success && response.data) {
          const batchCities = formatCitiesForApp(response.data);
          allCities = [...allCities, ...batchCities];
          
          // Check if there are more cities to load
          hasMore = response.data.length === limit;
          offset += limit;
          
          console.log(`📦 Batch loaded: ${batchCities.length} cities (total: ${allCities.length})`);
        } else {
          hasMore = false;
        }
      }
      
      if (allCities.length > 0) {
        // Transform for dropdown component
        const dropdownCities = allCities.map(city => ({
          label: city.name,
          value: city.name,
          ...city
        }));
        
        // Sort alphabetically and remove duplicates
        const uniqueCities = dropdownCities.filter((city, index, arr) => 
          arr.findIndex(c => c.label === city.label) === index
        );
        uniqueCities.sort((a, b) => a.label.localeCompare(b.label));
        
        setCities(uniqueCities);
        console.log('✅ Loaded', uniqueCities.length, 'cities for', regionCode);
      } else {
        console.log('⚠️ No cities found for region:', regionCode);
      }
    } catch (error) {
      console.error('❌ Error loading cities:', error);
      Alert.alert('Error', `Failed to load cities for ${regionCode}. Please try again.`);
    } finally {
      setLoadingCities(false);
    }
  };

  const handleRegionSelect = (item) => {
    setSelectedRegion(item);
    setSelectedCity(null);
    console.log('🎯 Selected region:', item.label, '(' + item.value + ')');
  };

  const handleCitySelect = (item) => {
    setSelectedCity(item);
    console.log('🎯 Selected city:', item.label);
    
    // Notify parent component
    if (onLocationSelected) {
      onLocationSelected({
        region: selectedRegion,
        city: item
      });
    }
  };

  const isLocationComplete = selectedRegion && selectedCity;

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.title}>Select Your Location</Text>
        <Text style={styles.subtitle}>Choose your state and city from the lists below</Text>

        {/* State/Region Selector */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>State/Region *</Text>
          {loadingRegions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0066cc" />
              <Text style={styles.loadingText}>Loading US states...</Text>
            </View>
          ) : (
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={regions}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select your state"
              value={selectedRegion?.value}
              onChange={handleRegionSelect}
              search
              searchPlaceholder="Search states..."
            />
          )}
        </View>

        {/* City Selector */}
        <View style={styles.fieldContainer}>
          <Text style={styles.fieldLabel}>City *</Text>
          {!selectedRegion ? (
            <View style={styles.disabledDropdown}>
              <Text style={styles.disabledText}>Please select a state first</Text>
            </View>
          ) : loadingCities ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color="#0066cc" />
              <Text style={styles.loadingText}>Loading cities for {selectedRegion.label}...</Text>
            </View>
          ) : cities.length === 0 ? (
            <View style={styles.disabledDropdown}>
              <Text style={styles.disabledText}>No cities found for {selectedRegion.label}</Text>
            </View>
          ) : (
            <Dropdown
              style={styles.dropdown}
              placeholderStyle={styles.placeholderStyle}
              selectedTextStyle={styles.selectedTextStyle}
              data={cities}
              maxHeight={300}
              labelField="label"
              valueField="value"
              placeholder="Select your city"
              value={selectedCity?.value}
              onChange={handleCitySelect}
              search
              searchPlaceholder="Search cities..."
            />
          )}
        </View>

        {/* Selected Location Summary */}
        {isLocationComplete && (
          <View style={styles.summaryContainer}>
            <Text style={styles.summaryTitle}>Selected Location:</Text>
            <Text style={styles.summaryText}>
              {selectedCity.label}, {selectedRegion.label}
            </Text>
            {selectedCity.population && (
              <Text style={styles.populationText}>
                Population: {selectedCity.population.toLocaleString()}
              </Text>
            )}
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.buttonContainer}>
          <TouchableOpacity 
            style={styles.refreshButton} 
            onPress={loadUSRegions}
            disabled={loadingRegions}
          >
            <Text style={styles.refreshButtonText}>
              {loadingRegions ? 'Loading...' : 'Refresh States'}
            </Text>
          </TouchableOpacity>

          {selectedRegion && (
            <TouchableOpacity 
              style={styles.refreshButton} 
              onPress={() => loadCitiesForRegion(selectedRegion.isoCode)}
              disabled={loadingCities}
            >
              <Text style={styles.refreshButtonText}>
                {loadingCities ? 'Loading...' : 'Refresh Cities'}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  scrollContent: {
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    textAlign: 'center',
    color: '#333',
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    textAlign: 'center',
    color: '#666',
    marginBottom: 30,
  },
  fieldContainer: {
    marginBottom: 20,
  },
  fieldLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  dropdown: {
    height: 50,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: 'white',
  },
  disabledDropdown: {
    height: 50,
    borderColor: '#eee',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#f5f5f5',
    justifyContent: 'center',
  },
  disabledText: {
    color: '#999',
    fontSize: 14,
  },
  placeholderStyle: {
    fontSize: 14,
    color: '#999',
  },
  selectedTextStyle: {
    fontSize: 14,
    color: '#333',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    backgroundColor: 'white',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  loadingText: {
    marginLeft: 10,
    fontSize: 14,
    color: '#666',
  },
  summaryContainer: {
    backgroundColor: '#e8f5e8',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    borderLeftWidth: 4,
    borderLeftColor: '#28a745',
  },
  summaryTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#155724',
    marginBottom: 5,
  },
  summaryText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#155724',
  },
  populationText: {
    fontSize: 14,
    color: '#155724',
    marginTop: 4,
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
  },
  refreshButton: {
    backgroundColor: '#6c757d',
    paddingVertical: 10,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginVertical: 5,
    minWidth: 120,
  },
  refreshButtonText: {
    color: 'white',
    textAlign: 'center',
    fontWeight: '500',
  },
});

export default EnhancedLocationSelector;
