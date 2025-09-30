import React, { useState } from 'react';
import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import DownIcon from '../../assets/icons/greylight/caret-down-regular.svg';
import SortIcon from '../../assets/icons/greylight/sort-arrow-regular.svg';
import BuyerFilter from './buyerFilter';
import CountryFilter from './countryFilter';
import GardenFilter from './gardenFilter';
import PlantFlightFilter from './plantFlightFilter';
import ReceiverFilter from './receiverFilter';
import SellerFilter from './sellerFilter';
import SortOptions from './sort';

const FilterBar = ({ onFilterChange }) => {
  const [filters, setFilters] = useState({
    sort: null,
    flightDate: null,
    plantSourceCountry: null,
    gardenOrCompanyName: null,
    sellerName: null,
    buyerUid: null,
    hubReceiverUserName: null,
  });
  const [isSortVisible, setSortVisible] = useState(false);
  const [isCountryVisible, setCountryVisible] = useState(false);
  const [isFlightVisible, setFlightVisible] = useState(false); 
  const [isGardenVisible, setGardenVisible] = useState(false);
  const [isSellerVisible, setSellerVisible] = useState(false);
  const [isBuyerVisible, setBuyerVisible] = useState(false);
  const [isReceiverVisible, setReceiverVisible] = useState(false);

  const onSortPress = (selectedSort) => {
    const updatedFilters = { ...filters, sort: selectedSort === 'Newest' ? 'desc' : 'asc' };
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  }

  const onCountryFilterApply = (countries) => {
    const updatedFilters = { ...filters, plantSourceCountry: countries };    
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  }

  const onSelectFlight = (flight) => {
    const updatedFilters = { ...filters, flightDate: flight };  
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  }

  const onSelectGarden = (garden) => {
    const updatedFilters = { ...filters, gardenOrCompanyName: garden };  
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  }

  const onSelectSeller = (seller) => {
    const updatedFilters = { ...filters, sellerName: seller };  
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  }

  const onSelectBuyer = (buyer) => {
    const updatedFilters = { ...filters, buyerUid: buyer };  
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  }

  const onSelectReceiver = (receiver) => {
    const updatedFilters = { ...filters, hubReceiverUserName: receiver };  
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  }

  return (
    <View style={styles.filterContainer}>
      <ScrollView horizontal showsHorizontalScrollIndicator={false}>
        <TouchableOpacity style={styles.filterButton} onPress={() => setSortVisible(true)}>
          <SortIcon />
          <Text style={styles.filterButtonText}>Sort</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={() => setFlightVisible(true)}>
          <Text style={styles.filterButtonText}>Plant Flight</Text>
          <DownIcon />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={() => setCountryVisible(true)}>
          <Text style={styles.filterButtonText}>Country </Text>
          <DownIcon />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={() => setGardenVisible(true)}>
          <Text style={styles.filterButtonText}>Garden</Text>
          <DownIcon />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={() => setSellerVisible(true)}>
          <Text style={styles.filterButtonText}>Seller</Text>
          <DownIcon />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={() => setBuyerVisible(true)}>
          <Text style={styles.filterButtonText}>Buyer</Text>
          <DownIcon />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={() => setReceiverVisible(true)}>
          <Text style={styles.filterButtonText}>Receiver</Text>
          <DownIcon />
        </TouchableOpacity>
      </ScrollView>

      <SortOptions
        isVisible={isSortVisible}
        onClose={() => setSortVisible(false)}
        onApplySort={onSortPress}
      />

      <CountryFilter
        isVisible={isCountryVisible}
        onClose={() => setCountryVisible(false)}
        onApply={onCountryFilterApply}
      />

      <PlantFlightFilter
        isVisible={isFlightVisible}
        onClose={() => setFlightVisible(false)}
        onSelectFlight={onSelectFlight}
      />  

      <GardenFilter
        isVisible={isGardenVisible}
        onClose={() => setGardenVisible(false)}  
        onSelectGarden={onSelectGarden}
      />

      <SellerFilter
        isVisible={isSellerVisible}
        onClose={() => setSellerVisible(false)}
        onSelectSeller={onSelectSeller}
      />

      <BuyerFilter
        isVisible={isBuyerVisible}
        onClose={() => setBuyerVisible(false)}
        onSelectBuyer={onSelectBuyer}
      />

      <ReceiverFilter
        isVisible={isReceiverVisible}
        onClose={() => setReceiverVisible(false)}
        onSelectReceiver={onSelectReceiver}
      />
    </View>
  )
};

const styles = StyleSheet.create({
  // Filter Bar
    filterContainer: {
        paddingVertical: 16,
    },
    filterButton: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: '#FFFFFF',
        borderWidth: 1,
        borderColor: '#CDD3D4',
        borderRadius: 12,
        paddingVertical: 8,
        paddingHorizontal: 12,
        marginRight: 8,
        gap: 4,
    },
    filterButtonText: {
        fontSize: 16,
        fontWeight: '500',
        color: '#393D40',
    },
});

export default FilterBar;