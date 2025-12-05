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
import OrderReceiverFilter from './orderReceiverFilter';
import CountryFilter from './countryFilter';
import GardenFilter from './gardenFilter';
import PlantFlightFilter from './plantFlightFilter';
import ReceiverFilter from './receiverFilter';
import ScanOptions from './scan';
import SellerFilter from './sellerFilter';
import SortOptions from './sort';
import { globalStyles } from '../../assets/styles/styles';
import OrderActionSheet from '../../screens/Seller/Order/components/OrderActionSheet';

const FilterBar = ({ onFilterChange, adminFilters, showScan = false }) => {
  const [filters, setFilters] = useState({
    sort: null,
    flightDate: null,
    plantSourceCountry: null,
    gardenOrCompanyName: null,
    sellerName: null,
    buyerUid: null,
    hubReceiverUserName: null,
    scan: null,
  });
  const [isSortVisible, setSortVisible] = useState(false);
  const [isScantVisible, setScanVisible] = useState(false);
  const [isCountryVisible, setCountryVisible] = useState(false);
  const [isFlightVisible, setFlightVisible] = useState(false); 
  const [isGardenVisible, setGardenVisible] = useState(false);
  const [isSellerVisible, setSellerVisible] = useState(false);
  const [isBuyerVisible, setBuyerVisible] = useState(false);
  const [isOrderReceiverVisible, setOrderReceiverVisible] = useState(false);
  const [isReceiverVisible, setReceiverVisible] = useState(false);
  const [reusableStartDate, setReusableStartDate] = useState('');
  const [reusableEndDate, setReusableEndDate] = useState('');
  const [code, setCode] = useState(null);
  const [showSheet, setShowSheet] = useState(false);

  const onSortPress = (selectedSort) => {
    const updatedFilters = { ...filters, sort: selectedSort === 'Newest' ? 'desc' : 'asc' };
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  }

  const onScanPress = (selectedSort) => {
    const updatedFilters = { ...filters, scan: selectedSort };    
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

  const onSelectOrderReceiver = (orderReceiver) => {
    const updatedFilters = { ...filters, receiverUid: orderReceiver };  
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  }

  const handleSearchSubmitRange = (startDate, endDate) => {
    // Fix timezone issue: format date in local timezone, not UTC
    const formatLocalDate = (date) => {
      if (!date) return '';
      const d = new Date(date);
      const year = d.getFullYear();
      const month = String(d.getMonth() + 1).padStart(2, '0');
      const day = String(d.getDate()).padStart(2, '0');
      return `${year}-${month}-${day}`;
    };
    
    const formattedStart = formatLocalDate(startDate);
    const formattedEnd = formatLocalDate(endDate);
    
    console.log('📅 [Frontend] Date Range Selected:', {
      originalDates: { 
        start: startDate?.toString(), 
        end: endDate?.toString() 
      },
      formattedDates: { 
        start: formattedStart, 
        end: formattedEnd 
      },
      willApplyFilter: true
    });
    
    // Update state for visual indicators
    setReusableStartDate(formattedStart);
    setReusableEndDate(formattedEnd);
    
    const updatedFilters = { ...filters, startDate: formattedStart, endDate: formattedEnd };  
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
    
    setShowSheet(false);
  };

  const handleResetDateRange = () => {
    console.log('🔄 [Frontend] Resetting date range filter');
    setReusableStartDate('');
    setReusableEndDate('');
    // Pass empty dates directly to clear filter
    const updatedFilters = { ...filters, startDate: formattedStart, endDate: formattedEnd };  
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
    setShowSheet(false);
  };

  const onPressFilter = (pressCode) => {
    setCode(pressCode);
    setShowSheet(true);
  };

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
        {showScan && (
          <TouchableOpacity style={styles.filterButton} onPress={() => setScanVisible(true)}>
            <Text style={styles.filterButtonText}>Receipt Status</Text>
            <DownIcon />
          </TouchableOpacity>
        )}
        <TouchableOpacity
          onPress={() => onPressFilter('DATERANGE')}
          style={[
            styles.filterButton,
            (reusableStartDate && reusableEndDate) && styles.filterButtonActive
          ]}>
          <Text style={styles.filterButtonText}>
            Date Range
            {(reusableStartDate && reusableEndDate) && ' ✓'}
          </Text>
          <DownIcon width={20} height={20}></DownIcon>
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
        <TouchableOpacity style={styles.filterButton} onPress={() => setOrderReceiverVisible(true)}>
          <Text style={styles.filterButtonText}>Order Receiver</Text>
          <DownIcon />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={() => setReceiverVisible(true)}>
          <Text style={styles.filterButtonText}>Hub Staff</Text>
          <DownIcon />
        </TouchableOpacity>
      </ScrollView>

      <SortOptions
        isVisible={isSortVisible}
        onClose={() => setSortVisible(false)}
        onApplySort={onSortPress}
      />

      <ScanOptions
        isVisible={isScantVisible}
        onClose={() => setScanVisible(false)}
        onApplyScan={onScanPress}
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
        flightDates={adminFilters?.flightDates || []}
      />  

      <GardenFilter
        isVisible={isGardenVisible}
        onClose={() => setGardenVisible(false)}  
        onSelectGarden={onSelectGarden}
        gardens={adminFilters?.garden || []}
      />

      <SellerFilter
        isVisible={isSellerVisible}
        onClose={() => setSellerVisible(false)}
        onSelectSeller={onSelectSeller}
        sellers={adminFilters?.seller || []}
      />

      <BuyerFilter
        isVisible={isBuyerVisible}
        onClose={() => setBuyerVisible(false)}
        onSelectBuyer={onSelectBuyer}
        buyers={adminFilters?.buyer || []}
      />

      <OrderReceiverFilter
        isVisible={isOrderReceiverVisible}
        onClose={() => setOrderReceiverVisible(false)}
        onSelectOrderReceiver={onSelectOrderReceiver}
        orderReceivers={adminFilters?.buyerReceiver || []}
      />

      <ReceiverFilter
        isVisible={isReceiverVisible}
        onClose={() => setReceiverVisible(false)}
        onSelectReceiver={onSelectReceiver}
        receivers={adminFilters?.receiver || []}
      />

      <OrderActionSheet
        code={code}
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        handleSearchSubmitRange={handleSearchSubmitRange}
        handleResetDateRange={handleResetDateRange}
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