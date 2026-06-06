import React, { useState } from 'react';
import { ScrollView,
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

const FilterBar = ({
  onFilterChange,
  adminFilters,
  showScan = false,
  sellersLoading = false,
  gardensLoading = false,
}) => {
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

  const parseFlightFilterValues = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter((d) => typeof d === 'string' && d.trim());
    }
    return String(value)
      .split(',')
      .map((d) => d.trim())
      .filter(Boolean);
  };

  const onSelectFlight = (flight) => {
    const flightDate = Array.isArray(flight)
      ? flight.filter((d) => typeof d === 'string' && d.trim()).join(',')
      : flight || null;
    const updatedFilters = { ...filters, flightDate: flightDate || null };
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };

  const selectedFlightCount = parseFlightFilterValues(filters.flightDate).length;

  const handleFlightPress = () => {
    if (selectedFlightCount > 0) {
      onSelectFlight(null);
      setFlightVisible(false);
      return;
    }
    setFlightVisible(true);
  };

  const parseGardenFilterValues = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter((g) => typeof g === 'string' && g.trim());
    }
    return String(value)
      .split(',')
      .map((g) => g.trim())
      .filter(Boolean);
  };

  const onSelectGarden = (garden) => {
    const gardenOrCompanyName = Array.isArray(garden)
      ? garden.filter((g) => typeof g === 'string' && g.trim()).join(',')
      : garden || null;
    const updatedFilters = { ...filters, gardenOrCompanyName: gardenOrCompanyName || null };
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };

  const selectedGardenCount = parseGardenFilterValues(filters.gardenOrCompanyName).length;

  const handleGardenPress = () => {
    if (selectedGardenCount > 0) {
      onSelectGarden(null);
      setGardenVisible(false);
      return;
    }
    setGardenVisible(true);
  };

  const parseSellerFilterValues = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter((id) => typeof id === 'string' && id.trim());
    }
    return String(value)
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  };

  const onSelectSeller = (sellers) => {
    const sellerName = Array.isArray(sellers)
      ? sellers.filter((id) => typeof id === 'string' && id.trim()).join(',')
      : sellers || null;
    const updatedFilters = { ...filters, sellerName: sellerName || null };
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };

  const selectedSellerCount = parseSellerFilterValues(filters.sellerName).length;

  const handleSellerPress = () => {
    if (selectedSellerCount > 0) {
      onSelectSeller(null);
      setSellerVisible(false);
      return;
    }
    setSellerVisible(true);
  };

  const parseBuyerFilterValues = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter((id) => typeof id === 'string' && id.trim());
    }
    return String(value)
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  };

  const onSelectBuyer = (buyers) => {
    const buyerUid = Array.isArray(buyers)
      ? buyers.filter((id) => typeof id === 'string' && id.trim()).join(',')
      : buyers || null;
    const updatedFilters = { ...filters, buyerUid: buyerUid || null };
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };

  const selectedBuyerCount = parseBuyerFilterValues(filters.buyerUid).length;

  const handleBuyerPress = () => {
    if (selectedBuyerCount > 0) {
      onSelectBuyer(null);
      setBuyerVisible(false);
      return;
    }
    setBuyerVisible(true);
  };

  const parseOrderReceiverFilterValues = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter((id) => typeof id === 'string' && id.trim());
    }
    return String(value)
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  };

  const onSelectOrderReceiver = (orderReceivers) => {
    const receiverUid = Array.isArray(orderReceivers)
      ? orderReceivers.filter((id) => typeof id === 'string' && id.trim()).join(',')
      : orderReceivers || null;
    const updatedFilters = { ...filters, receiverUid: receiverUid || null };
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };

  const selectedOrderReceiverCount = parseOrderReceiverFilterValues(filters.receiverUid).length;

  const handleOrderReceiverPress = () => {
    if (selectedOrderReceiverCount > 0) {
      onSelectOrderReceiver(null);
      setOrderReceiverVisible(false);
      return;
    }
    setOrderReceiverVisible(true);
  };

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
    const updatedFilters = { ...filters };
    delete updatedFilters.startDate;
    delete updatedFilters.endDate;
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

  const parseHubStaffFilterValues = (value) => {
    if (!value) return [];
    if (Array.isArray(value)) {
      return value.filter((id) => typeof id === 'string' && id.trim());
    }
    return String(value)
      .split(',')
      .map((id) => id.trim())
      .filter(Boolean);
  };

  const onSelectReceiver = (receivers) => {
    const hubReceiverUserName = Array.isArray(receivers)
      ? receivers.filter((id) => typeof id === 'string' && id.trim()).join(',')
      : receivers || null;
    const updatedFilters = { ...filters, hubReceiverUserName: hubReceiverUserName || null };
    setFilters(updatedFilters);
    if (onFilterChange) {
      onFilterChange(updatedFilters);
    }
  };

  const selectedHubStaffCount = parseHubStaffFilterValues(filters.hubReceiverUserName).length;

  const handleHubStaffPress = () => {
    if (selectedHubStaffCount > 0) {
      onSelectReceiver(null);
      setReceiverVisible(false);
      return;
    }
    setReceiverVisible(true);
  };

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
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedFlightCount > 0 ? styles.filterButtonActive : null,
          ]}
          onPress={handleFlightPress}
        >
          <Text style={styles.filterButtonText}>
            Plant Flight
            {selectedFlightCount > 0
              ? selectedFlightCount === 1
                ? ' ✓'
                : ` (${selectedFlightCount})`
              : ''}
          </Text>
          <DownIcon />
        </TouchableOpacity>
        <TouchableOpacity style={styles.filterButton} onPress={() => setCountryVisible(true)}>
          <Text style={styles.filterButtonText}>Country </Text>
          <DownIcon />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedGardenCount > 0 ? styles.filterButtonActive : null,
          ]}
          onPress={handleGardenPress}
        >
          <Text style={styles.filterButtonText}>
            Garden
            {selectedGardenCount > 0
              ? selectedGardenCount === 1
                ? ' ✓'
                : ` (${selectedGardenCount})`
              : ''}
          </Text>
          <DownIcon />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedSellerCount > 0 ? styles.filterButtonActive : null,
          ]}
          onPress={handleSellerPress}
        >
          <Text style={styles.filterButtonText}>
            Seller
            {selectedSellerCount > 0
              ? selectedSellerCount === 1
                ? ' ✓'
                : ` (${selectedSellerCount})`
              : ''}
          </Text>
          <DownIcon />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedBuyerCount > 0 ? styles.filterButtonActive : null,
          ]}
          onPress={handleBuyerPress}
        >
          <Text style={styles.filterButtonText}>
            Buyer
            {selectedBuyerCount > 0
              ? selectedBuyerCount === 1
                ? ' ✓'
                : ` (${selectedBuyerCount})`
              : ''}
          </Text>
          <DownIcon />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedOrderReceiverCount > 0 ? styles.filterButtonActive : null,
          ]}
          onPress={handleOrderReceiverPress}
        >
          <Text style={styles.filterButtonText}>
            Order Receiver
            {selectedOrderReceiverCount > 0
              ? selectedOrderReceiverCount === 1
                ? ' ✓'
                : ` (${selectedOrderReceiverCount})`
              : ''}
          </Text>
          <DownIcon />
        </TouchableOpacity>
        <TouchableOpacity
          style={[
            styles.filterButton,
            selectedHubStaffCount > 0 ? styles.filterButtonActive : null,
          ]}
          onPress={handleHubStaffPress}
        >
          <Text style={styles.filterButtonText}>
            Hub Staff
            {selectedHubStaffCount > 0
              ? selectedHubStaffCount === 1
                ? ' ✓'
                : ` (${selectedHubStaffCount})`
              : ''}
          </Text>
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
        availableFlightDateIsos={adminFilters?.flightDateIsos || []}
        selectedValues={
          filters.flightDate
            ? String(filters.flightDate).split(',').map((d) => d.trim()).filter(Boolean)
            : []
        }
      />  

      <GardenFilter
        isVisible={isGardenVisible}
        onClose={() => setGardenVisible(false)}
        onSelectGarden={onSelectGarden}
        gardens={adminFilters?.garden || []}
        selectedValues={parseGardenFilterValues(filters.gardenOrCompanyName)}
        currentGarden={filters.gardenOrCompanyName}
        gardensLoading={gardensLoading}
      />

      <SellerFilter
        isVisible={isSellerVisible}
        onClose={() => setSellerVisible(false)}
        onSelectSeller={onSelectSeller}
        sellers={adminFilters?.seller || []}
        selectedValues={parseSellerFilterValues(filters.sellerName)}
        currentSeller={filters.sellerName}
        sellersLoading={sellersLoading}
      />

      <BuyerFilter
        isVisible={isBuyerVisible}
        onClose={() => setBuyerVisible(false)}
        onSelectBuyer={onSelectBuyer}
        buyers={adminFilters?.buyer || []}
        selectedValues={parseBuyerFilterValues(filters.buyerUid)}
        currentBuyer={filters.buyerUid}
      />

      <OrderReceiverFilter
        isVisible={isOrderReceiverVisible}
        onClose={() => setOrderReceiverVisible(false)}
        onSelectOrderReceiver={onSelectOrderReceiver}
        orderReceivers={adminFilters?.buyerReceiver || []}
        selectedValues={parseOrderReceiverFilterValues(filters.receiverUid)}
        currentReceiverUid={filters.receiverUid}
      />

      <ReceiverFilter
        isVisible={isReceiverVisible}
        onClose={() => setReceiverVisible(false)}
        onSelectReceiver={onSelectReceiver}
        receivers={adminFilters?.receiver || []}
        selectedValues={parseHubStaffFilterValues(filters.hubReceiverUserName)}
        currentHubReceiver={filters.hubReceiverUserName}
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
    filterButtonActive: {
        borderColor: '#539461',
        backgroundColor: '#EFF9F0',
    },
});

export default FilterBar;