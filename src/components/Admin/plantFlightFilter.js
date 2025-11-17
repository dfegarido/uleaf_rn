import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import SearchIcon from '../../assets/admin-icons/search.svg';
import CloseIcon from '../../assets/admin-icons/x.svg';

// Format date from ISO (YYYY-MM-DD) to readable format (MMM DD, YYYY)
const formatFlightDate = (isoDate) => {
  if (!isoDate) return '';
  try {
    const date = new Date(isoDate + 'T00:00:00'); // Add time to avoid timezone issues
    if (isNaN(date.getTime())) return isoDate;
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch (e) {
    return isoDate;
  }
};

const FlightDateItem = ({ date, formattedDate, onToggle, isSelected }) => (
  <TouchableOpacity 
    style={[styles.flightDateItemContainer, isSelected && styles.flightDateItemActive]}
    onPress={onToggle}
    activeOpacity={0.7}
  >
    <Text style={[styles.flightDateText, isSelected && styles.flightDateTextActive]}>
      {formattedDate}
    </Text>
    <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
      {isSelected && (
        <View style={styles.checkboxInner}>
          <Text style={styles.checkmark}>✓</Text>
        </View>
      )}
    </View>
  </TouchableOpacity>
);

const PlantFlightFilter = ({ 
  isVisible, 
  onClose, 
  onSelectFlight, 
  onReset, 
  flightDates = [], 
  selectedValues = [] 
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [draftSelection, setDraftSelection] = useState([]);
  const scrollRef = React.useRef(null);

  // Memoize selectedValues to prevent unnecessary effect runs
  const memoizedSelectedValues = useMemo(() => {
    return Array.isArray(selectedValues)
      ? selectedValues.filter(v => typeof v === 'string' && v.trim().length > 0)
      : [];
  }, [Array.isArray(selectedValues) ? selectedValues.join(',') : '']); // Only recompute if the actual values change

  // Initialize draft selection when modal opens
  useEffect(() => {
    if (isVisible) {
      // Safely initialize draft - only include string values (dates)
      setDraftSelection(memoizedSelectedValues);
    }
  }, [isVisible, memoizedSelectedValues]);

  // Filter flightDates based on the search query
  const filteredFlightDates = flightDates.filter(date => {
    if (!date) return false;
    const formatted = formatFlightDate(date);
    return formatted.toLowerCase().includes(searchQuery.toLowerCase()) || 
           date.toLowerCase().includes(searchQuery.toLowerCase());
  });

  const handleToggle = (date) => {
    // Ensure date is a valid string before toggling
    if (!date || typeof date !== 'string' || !date.trim()) {
      console.warn('Invalid date value in handleToggle:', date);
      return;
    }
    setDraftSelection(prev => {
      // Ensure prev only contains strings
      const safePrev = prev.filter(d => typeof d === 'string' && d.trim().length > 0);
      if (safePrev.includes(date)) {
        return safePrev.filter(d => d !== date);
      } else {
        return [...safePrev, date];
      }
    });
  };

  const handleView = () => {
    // Commit draft selections - parent will handle the actual filter update
    if (onSelectFlight && typeof onSelectFlight === 'function') {
      const values = Array.isArray(draftSelection) ? draftSelection : [];
      // Ensure we only pass strings (dates), not objects or events
      const safeValues = values.filter(v => typeof v === 'string' && v.trim().length > 0);
      onSelectFlight(safeValues);
    }
    onClose();
  };

  const handleReset = () => {
    setDraftSelection([]);
    if (onReset && typeof onReset === 'function') {
      onReset();
    }
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
              <KeyboardAvoidingView 
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
                keyboardVerticalOffset={80}
                style={{flex: 1}}
              >
                <SafeAreaView style={{flex: 1}}>
                {/* Title */}
                <View style={styles.titleContainer}>
                  <Text style={styles.titleText}>Plant Flight</Text>
                  
                  {/* Close */}
                  <TouchableOpacity 
                    style={styles.closeButton}
                    onPress={onClose}
                    activeOpacity={0.7}
                  >
                    <CloseIcon width={24} height={24} style={styles.closeIcon} />
          </TouchableOpacity>
        </View>

                {/* Content */}
                <View style={styles.contentContainer}>
                  {/* Search Field */}
                  <View style={styles.searchFieldContainer}>
                    <SearchIcon width={24} height={24} />
                    <TextInput
                      style={styles.textInput}
                      placeholder="Search"
                      placeholderTextColor="#647276"
                      value={searchQuery}
                      onChangeText={setSearchQuery}
                      onFocus={() => {
                        setTimeout(() => {
                          try {
                            if (scrollRef && scrollRef.current && typeof scrollRef.current.scrollTo === 'function') {
                              scrollRef.current.scrollTo({ y: 0, animated: true });
                            }
                          } catch (e) {
                            // ignore
                          }
                        }, 120);
                      }}
                      caretColor="#539461"
                      selectionColor="#539461"
                      autoCorrect={false}
                      autoCapitalize="none"
                      allowFontScaling={false}
                      editable={true}
                    />
          </View>

                  {/* Lists */}
                  <ScrollView 
                    ref={scrollRef}
                    style={styles.listsContainer} 
                    showsVerticalScrollIndicator={true}
                    contentContainerStyle={[
                      styles.listsContentContainer,
                      (flightDates.length === 0 || filteredFlightDates.length === 0) && styles.listsContentContainerEmpty
                    ]}
                  >
                    {flightDates.length === 0 ? (
                      <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>No flight dates available</Text>
                        <Text style={styles.emptyStateSubtext}>
                          No flight date data found in the order collection. Please ensure orders have flight dates.
                        </Text>
                      </View>
                    ) : filteredFlightDates.length === 0 ? (
                      <View style={styles.emptyStateContainer}>
                        <Text style={styles.emptyStateText}>No flight dates found</Text>
                        <Text style={styles.emptyStateSubtext}>
                          Try adjusting your search query
                        </Text>
                      </View>
                    ) : (
                      filteredFlightDates.map((date, index) => {
                        const formattedDate = formatFlightDate(date);
                        const isSelected = draftSelection.includes(date);
                        return (
                          <View key={date}>
                            <FlightDateItem
                              date={date}
                              formattedDate={formattedDate}
                              onToggle={() => handleToggle(date)}
                              isSelected={isSelected}
                            />
                            {/* Divider */}
                            {index < filteredFlightDates.length - 1 && (
                              <View style={styles.dividerWrapper}>
                                <View style={styles.divider} />
                              </View>
                            )}
                          </View>
                        );
                      })
                    )}
                  </ScrollView>
                </View>

                {/* Action */}
                <View style={styles.actionContainer}>
                  {/* Reset Button */}
                  <TouchableOpacity 
                    style={styles.resetButton} 
                    onPress={handleReset}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.resetButtonText}>Reset</Text>
            </TouchableOpacity>
                  {/* Button View */}
                  <TouchableOpacity 
                    style={styles.buttonView} 
                    onPress={handleView}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.buttonText}>View</Text>
            </TouchableOpacity>
          </View>

                </SafeAreaView>
              </KeyboardAvoidingView>
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
    maxHeight: 620,
    height: '80%',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 24,
    height: 60,
    backgroundColor: '#FFFFFF',
    flex: 0,
  },
  titleText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
    flex: 1,
  },
  closeButton: {
    padding: 6,
    width: 24,
    height: 24,
    flex: 0,
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  contentContainer: {
    flexDirection: 'column',
    paddingVertical: 8,
    paddingHorizontal: 24,
    width: '100%',
    flex: 1,
    alignSelf: 'stretch',
  },
  searchFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 8,
  },
  textInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#202325',
    height: '100%',
  },
  listsContainer: {
    width: '100%',
    marginTop: 16,
    flex: 1,
  },
  listsContentContainer: {
    paddingBottom: 8,
  },
  listsContentContainerEmpty: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyStateContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyStateText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#393D40',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptyStateSubtext: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#647276',
    textAlign: 'center',
  },
  flightDateItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 0,
    minHeight: 48,
  },
  flightDateItemActive: {
    backgroundColor: '#EFF9F0',
    borderRadius: 8,
    paddingHorizontal: 8,
  },
  flightDateText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
    flex: 1,
  },
  flightDateTextActive: {
    color: '#14632A',
  },
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 4,
    borderWidth: 2,
    borderColor: '#CDD3D4',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 12,
  },
  checkboxSelected: {
    borderColor: '#23C16B',
    backgroundColor: '#23C16B',
  },
  checkboxInner: {
    width: '100%',
    height: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: 'bold',
  },
  dividerWrapper: {
    paddingVertical: 8,
    paddingHorizontal: 0,
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E7E9',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 24,
    gap: 8,
    width: '100%',
    height: 60,
    flex: 0,
    alignSelf: 'stretch',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#23C16B',
  },
  buttonView: {
    flex: 1,
    backgroundColor: '#23C16B',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default PlantFlightFilter;
