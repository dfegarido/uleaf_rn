import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from 'react-native';
import CloseIcon from '../../assets/admin-icons/x.svg';

// A single selectable flight option row
const FlightOption = ({ label, isSelected, onSelect }) => (
  <TouchableOpacity
    style={[styles.optionRow, isSelected && styles.optionRowSelected]}
    onPress={onSelect}
  >
    <Text style={[styles.optionLabel, isSelected && styles.optionLabelSelected]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const PlantFlightFilter = ({ isVisible, onClose, onSelectFlight }) => {
  // Mock data for the list of flights
  const availableFlights = [
    'May-30-2024',
    'June-15-2024',
    'June-30-2024',
    'July-12-2024',
  ];
  
  // State to manage the currently selected flight
  const [selectedFlight, setSelectedFlight] = useState(null);

  const handleSelect = (flight) => {
    setSelectedFlight(flight);
    // Immediately pass the selection back to the parent
    onSelectFlight(flight);
    // Close the sheet after selection
    onClose();
  };
  
  const handleViewAll = () => {
    // This could navigate to a new screen or clear the filter
    console.log("View All Plant Flights pressed");
    onSelectFlight(null); // Example of clearing filter
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.actionSheetContainer}>
              <SafeAreaView>
                {/* Header */}
                <View style={styles.header}>
                  <Text style={styles.headerTitle}>Plant Flight</Text>
                  <TouchableOpacity onPress={onClose}>
                    <CloseIcon />
                  </TouchableOpacity>
                </View>

                {/* Content with selectable options */}
                <View style={styles.content}>
                  {availableFlights.map(flight => (
                    <FlightOption
                      key={flight}
                      label={flight}
                      isSelected={selectedFlight === flight}
                      onSelect={() => handleSelect(flight)}
                    />
                  ))}
                </View>

                {/* Action Button */}
                <View style={styles.actionContainer}>
                  <TouchableOpacity style={styles.viewAllButton} onPress={handleViewAll}>
                    <Text style={styles.viewAllButtonText}>Update Schedule</Text>
                  </TouchableOpacity>
                </View>
              </SafeAreaView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// --- Styles ---
const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 20, // For home indicator area
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 60,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
  },
  closeIconText: {
    fontSize: 16,
    color: '#7F8D91',
  },
  content: {
    padding: 8,
  },
  optionRow: {
    justifyContent: 'center',
    paddingHorizontal: 16,
    height: 48,
    borderRadius: 8, // Added for better visual feedback on selection
  },
  optionRowSelected: {
    backgroundColor: '#F2F7F3', // Highlight color for selected item
  },
  optionLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#393D40',
  },
  optionLabelSelected: {
    color: '#539461', // Highlight text color for selected item
  },
  actionContainer: {
    paddingHorizontal: 24,
    paddingTop: 12,
    height: 60,
  },
  viewAllButton: {
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#539461',
  },
});

export default PlantFlightFilter;