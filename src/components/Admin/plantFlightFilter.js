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
import CaretLeftIcon from '../../assets/icons/greylight/caret-left-regular.svg';
import CaretRightIcon from '../../assets/icons/greylight/caret-right-regular.svg';

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

// Convert date to ISO format (YYYY-MM-DD)
const toISODateString = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const SelectedDateChip = ({ date, onRemove }) => (
  <View style={styles.selectedChip}>
    <Text style={styles.selectedChipText}>{formatFlightDate(date)}</Text>
    <TouchableOpacity onPress={() => onRemove(date)} style={styles.chipCloseButton}>
      <Text style={styles.chipCloseText}>×</Text>
    </TouchableOpacity>
  </View>
);

const PlantFlightFilter = ({ 
  isVisible, 
  onClose, 
  onSelectFlight, 
  onReset, 
  flightDates = [], 
  selectedValues = [] 
}) => {
  const [draftSelection, setDraftSelection] = useState([]);
  const [currentMonth, setCurrentMonth] = useState(new Date(new Date().getFullYear(), new Date().getMonth(), 1));
  const scrollRef = React.useRef(null);

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];

  // Memoize selectedValues to prevent unnecessary effect runs
  const memoizedSelectedValues = useMemo(() => {
    return Array.isArray(selectedValues)
      ? selectedValues.filter(v => typeof v === 'string' && v.trim().length > 0)
      : [];
  }, [Array.isArray(selectedValues) ? selectedValues.join(',') : '']);

  // Initialize draft selection when modal opens
  useEffect(() => {
    if (isVisible) {
      setDraftSelection(memoizedSelectedValues);
      // Set current month to the first selected date or current month
      if (memoizedSelectedValues.length > 0) {
        const firstDate = new Date(memoizedSelectedValues[0] + 'T00:00:00');
        if (!isNaN(firstDate.getTime())) {
          setCurrentMonth(new Date(firstDate.getFullYear(), firstDate.getMonth(), 1));
        }
      }
    }
  }, [isVisible, memoizedSelectedValues]);

  const getDaysInMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date) => {
    const year = date.getFullYear();
    const month = date.getMonth();
    return new Date(year, month, 1).getDay();
  };

  const handlePreviousMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentMonth(new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 1));
  };

  const handleDateSelect = (day) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateISO = toISODateString(selectedDate);
    
    setDraftSelection(prev => {
      const safePrev = prev.filter(d => typeof d === 'string' && d.trim().length > 0);
      if (safePrev.includes(dateISO)) {
        return safePrev.filter(d => d !== dateISO);
      } else {
        return [...safePrev, dateISO];
      }
    });
  };

  const isDateSelected = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateISO = toISODateString(date);
    return draftSelection.includes(dateISO);
  };

  const isDateAvailable = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateISO = toISODateString(date);
    // Check if this date exists in the flightDates array
    return flightDates.includes(dateISO);
  };

  const handleRemoveDate = (dateToRemove) => {
    setDraftSelection(prev => prev.filter(d => d !== dateToRemove));
  };

  const handleView = () => {
    if (onSelectFlight && typeof onSelectFlight === 'function') {
      const values = Array.isArray(draftSelection) ? draftSelection : [];
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
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

    // Day headers
    const dayHeaders = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
    dayHeaders.forEach((header) => {
      days.push(
        <View key={`header-${header}`} style={styles.dayHeaderCell}>
          <Text style={styles.dayHeaderText}>{header}</Text>
        </View>
      );
    });

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.dayCell}>
          <Text style={styles.emptyDay}></Text>
        </View>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const isSelected = isDateSelected(day);
      const isAvailable = isDateAvailable(day);
      
      days.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[
            styles.dayCell,
            isSelected && styles.selectedDayCell,
            !isAvailable && styles.disabledDayCell,
          ]}
          onPress={() => handleDateSelect(day)}
          disabled={!isAvailable}
        >
          <Text style={[
            styles.dayText,
            isSelected && styles.selectedDayText,
            !isAvailable && styles.disabledDayText,
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  // Sort draft selection by date
  const sortedSelection = [...draftSelection].sort((a, b) => {
    return new Date(a) - new Date(b);
  });

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
                  <Text style={styles.titleText}>Plant Flight Dates</Text>
                  
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
                <ScrollView 
                  ref={scrollRef}
                  style={styles.contentContainer}
                  showsVerticalScrollIndicator={false}
                >
                  {/* Selected Dates Section */}
                  {sortedSelection.length > 0 && (
                    <View style={styles.selectedSection}>
                      <Text style={styles.selectedLabel}>
                        Selected Dates ({sortedSelection.length})
                      </Text>
                      <View style={styles.selectedChipsContainer}>
                        {sortedSelection.map((date) => (
                          <SelectedDateChip 
                            key={date} 
                            date={date} 
                            onRemove={handleRemoveDate}
                          />
                        ))}
                      </View>
                    </View>
                  )}

                  {/* Divider */}
                  {sortedSelection.length > 0 && <View style={styles.divider} />}

                  {/* Calendar Header */}
                  <View style={styles.calendarHeader}>
                    <TouchableOpacity 
                      style={styles.monthArrow}
                      onPress={handlePreviousMonth}
                    >
                      <CaretLeftIcon width={24} height={24} />
                    </TouchableOpacity>
                    <Text style={styles.monthYearText}>
                      {monthNames[currentMonth.getMonth()]} {currentMonth.getFullYear()}
                    </Text>
                    <TouchableOpacity 
                      style={styles.monthArrow}
                      onPress={handleNextMonth}
                    >
                      <CaretRightIcon width={24} height={24} />
                    </TouchableOpacity>
                  </View>

                  {/* Calendar Grid */}
                  <View style={styles.calendarGrid}>
                    {renderCalendar()}
                  </View>

                  {/* Helper Text */}
                  <Text style={styles.helperText}>
                    Only dates with existing orders are selectable. You can select multiple dates.
                  </Text>
                </ScrollView>

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
    maxHeight: 700,
    height: '85%',
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
    width: '100%',
    flex: 1,
    paddingHorizontal: 24,
  },
  selectedSection: {
    paddingVertical: 16,
  },
  selectedLabel: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#647276',
    marginBottom: 12,
  },
  selectedChipsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  selectedChip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E8F3EA',
    borderRadius: 8,
    paddingVertical: 6,
    paddingLeft: 12,
    paddingRight: 8,
    gap: 8,
  },
  selectedChipText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#14632A',
  },
  chipCloseButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: '#14632A',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCloseText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#FFFFFF',
    lineHeight: 18,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4E7E9',
    marginVertical: 8,
  },
  calendarHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 12,
  },
  monthArrow: {
    padding: 8,
  },
  monthYearText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#202325',
  },
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 4,
    paddingBottom: 16,
  },
  dayHeaderCell: {
    width: '14.28%', // 7 days in a week
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  dayHeaderText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    color: '#647276',
  },
  dayCell: {
    width: '14.28%', // 7 days in a week
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  selectedDayCell: {
    backgroundColor: '#539461',
    borderRadius: 12,
  },
  dayText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#393D40',
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  emptyDay: {
    height: 22,
  },
  disabledDayCell: {
    opacity: 0.3,
  },
  disabledDayText: {
    color: '#CDD3D4',
  },
  helperText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 13,
    color: '#647276',
    textAlign: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
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
