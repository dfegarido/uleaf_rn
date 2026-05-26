import React, { useState } from 'react';
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import DownIcon from '../../assets/icons/greylight/caret-down-regular.svg';
import PlantFlightFilter from './plantFlightFilter';
import GardenFilter from './gardenFilter';
import SellerFilter from './sellerFilter';
import ScanOptions from './scan';

const parseCsvList = (value) => {
  if (!value) return [];
  if (Array.isArray(value)) {
    return value.filter((v) => typeof v === 'string' && v.trim());
  }
  return String(value)
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean);
};

/** Filter chips only — Print / Export / Scan live in the screen header. */
const LeafTrailHubToolbar = ({
  adminFilters,
  onFilterChange,
  showReceiptStatus = false,
}) => {
  const [filters, setFilters] = useState({
    flightDate: null,
    gardenOrCompanyName: null,
    sellerName: null,
  });
  const [flightVisible, setFlightVisible] = useState(false);
  const [gardenVisible, setGardenVisible] = useState(false);
  const [sellerVisible, setSellerVisible] = useState(false);
  const [scanFilterVisible, setScanFilterVisible] = useState(false);

  const selectedFlightCount = parseCsvList(filters.flightDate).length;
  const selectedGardenCount = parseCsvList(filters.gardenOrCompanyName).length;
  const selectedSellerCount = parseCsvList(filters.sellerName).length;

  const applyFilters = (next) => {
    setFilters(next);
    if (onFilterChange) {
      onFilterChange({ sort: 'desc', ...next });
    }
  };

  const onSelectFlight = (flight) => {
    const flightDate = Array.isArray(flight)
      ? flight.filter((d) => typeof d === 'string' && d.trim()).join(',')
      : flight || null;
    applyFilters({ ...filters, flightDate: flightDate || null });
  };

  const onSelectGarden = (garden) => {
    const gardenOrCompanyName = Array.isArray(garden)
      ? garden.filter((g) => typeof g === 'string' && g.trim()).join(',')
      : garden || null;
    applyFilters({ ...filters, gardenOrCompanyName: gardenOrCompanyName || null });
  };

  const onSelectSeller = (sellers) => {
    const sellerName = Array.isArray(sellers)
      ? sellers.filter((id) => typeof id === 'string' && id.trim()).join(',')
      : sellers || null;
    applyFilters({ ...filters, sellerName: sellerName || null });
  };

  const onApplyReceiptScan = (selectedSort) => {
    applyFilters({ ...filters, scan: selectedSort });
  };

  const handleFlightPress = () => {
    if (selectedFlightCount > 0) {
      onSelectFlight(null);
      setFlightVisible(false);
      return;
    }
    setFlightVisible(true);
  };

  const handleGardenPress = () => {
    if (selectedGardenCount > 0) {
      onSelectGarden(null);
      setGardenVisible(false);
      return;
    }
    setGardenVisible(true);
  };

  const handleSellerPress = () => {
    if (selectedSellerCount > 0) {
      onSelectSeller(null);
      setSellerVisible(false);
      return;
    }
    setSellerVisible(true);
  };

  return (
    <View style={styles.wrap}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.row}>
        <TouchableOpacity
          style={[styles.chip, selectedFlightCount > 0 && styles.chipActive]}
          onPress={handleFlightPress}>
          <Text style={styles.chipText}>
            Plant Flight
            {selectedFlightCount > 0 ? ` (${selectedFlightCount})` : ''}
          </Text>
          <DownIcon />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, selectedGardenCount > 0 && styles.chipActive]}
          onPress={handleGardenPress}>
          <Text style={styles.chipText}>
            Garden
            {selectedGardenCount > 0 ? ` (${selectedGardenCount})` : ''}
          </Text>
          <DownIcon />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.chip, selectedSellerCount > 0 && styles.chipActive]}
          onPress={handleSellerPress}>
          <Text style={styles.chipText}>
            Seller
            {selectedSellerCount > 0 ? ` (${selectedSellerCount})` : ''}
          </Text>
          <DownIcon />
        </TouchableOpacity>

        {showReceiptStatus ? (
          <TouchableOpacity style={styles.chip} onPress={() => setScanFilterVisible(true)}>
            <Text style={styles.chipText}>Receipt Status</Text>
            <DownIcon />
          </TouchableOpacity>
        ) : null}
      </ScrollView>

      <ScanOptions
        isVisible={scanFilterVisible}
        onClose={() => setScanFilterVisible(false)}
        onApplyScan={onApplyReceiptScan}
      />
      <PlantFlightFilter
        isVisible={flightVisible}
        onClose={() => setFlightVisible(false)}
        onSelectFlight={onSelectFlight}
        flightDates={adminFilters?.flightDates || []}
        availableFlightDateIsos={adminFilters?.flightDateIsos || []}
        selectedValues={parseCsvList(filters.flightDate)}
      />
      <GardenFilter
        isVisible={gardenVisible}
        onClose={() => setGardenVisible(false)}
        onSelectGarden={onSelectGarden}
        gardens={adminFilters?.garden || []}
        selectedValues={parseCsvList(filters.gardenOrCompanyName)}
        currentGarden={filters.gardenOrCompanyName}
      />
      <SellerFilter
        isVisible={sellerVisible}
        onClose={() => setSellerVisible(false)}
        onSelectSeller={onSelectSeller}
        sellers={adminFilters?.seller || []}
        selectedValues={parseCsvList(filters.sellerName)}
        currentSeller={filters.sellerName}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    paddingTop: 4,
    paddingBottom: 2,
  },
  row: {
    paddingHorizontal: 10,
    alignItems: 'center',
    paddingVertical: 4,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 10,
    paddingVertical: 6,
    paddingHorizontal: 10,
    marginRight: 6,
    gap: 2,
  },
  chipActive: {
    borderColor: '#539461',
    backgroundColor: '#EFF9F0',
  },
  chipText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#393D40',
  },
});

export default LeafTrailHubToolbar;
