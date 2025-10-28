import React, { useState } from 'react';
import {
  Modal,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import CloseIcon from '../../assets/admin-icons/x.svg';
import CaretLeftIcon from '../../assets/icons/greylight/caret-left-regular.svg';
import CaretRightIcon from '../../assets/icons/greylight/caret-right-regular.svg';

const DateRangeFilter = ({ isVisible, onClose, onSelectDateRange, onReset }) => {
  const now = new Date();
  const [fromDate, setFromDate] = useState(null);
  const [toDate, setToDate] = useState(null);
  const [currentMonth, setCurrentMonth] = useState(new Date(now.getFullYear(), now.getMonth(), 1));
  const [selectingFrom, setSelectingFrom] = useState(true); // true = selecting "from", false = selecting "to"

  const monthNames = ['January', 'February', 'March', 'April', 'May', 'June', 
                      'July', 'August', 'September', 'October', 'November', 'December'];
  
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

  const formatDateDisplay = (date) => {
    if (!date) return 'Select date';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const handleDateSelect = (day) => {
    const selectedDate = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    
    if (selectingFrom) {
      setFromDate(selectedDate);
      setToDate(null); // Reset "to" date when selecting new "from" date
      setSelectingFrom(false); // Switch to selecting "to" date
    } else {
      // Make sure "to" date is after "from" date
      if (fromDate && selectedDate < fromDate) {
        // If selected date is before "from", swap them
        setToDate(fromDate);
        setFromDate(selectedDate);
      } else {
        setToDate(selectedDate);
      }
    }
  };

  const adjustFromDate = (days) => {
    if (fromDate) {
      const newDate = new Date(fromDate);
      newDate.setDate(newDate.getDate() + days);
      setFromDate(newDate);
      // Reset "to" date if it becomes invalid
      if (toDate && newDate > toDate) {
        setToDate(null);
      }
    }
  };

  const adjustToDate = (days) => {
    if (toDate) {
      const newDate = new Date(toDate);
      newDate.setDate(newDate.getDate() + days);
      // Make sure "to" date doesn't go before "from" date
      if (fromDate && newDate >= fromDate) {
        setToDate(newDate);
      }
    }
  };

  const handleReset = () => {
    setFromDate(null);
    setToDate(null);
    setSelectingFrom(true);
    if (onReset && typeof onReset === 'function') {
      onReset();
    }
  };

  const handleView = () => {
    if (onSelectDateRange && fromDate && toDate) {
      onSelectDateRange({ from: fromDate, to: toDate });
    }
    onClose();
  };

  const isDateInRange = (day) => {
    if (!fromDate || !toDate) return false;
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    return date >= fromDate && date <= toDate;
  };

  const isDateSelected = (day) => {
    const date = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), day);
    const dateStr = date.toDateString();
    return (fromDate && dateStr === fromDate.toDateString()) || 
           (toDate && dateStr === toDate.toDateString());
  };

  const renderCalendar = () => {
    const daysInMonth = getDaysInMonth(currentMonth);
    const firstDay = getFirstDayOfMonth(currentMonth);
    const days = [];

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
      const inRange = isDateInRange(day);
      days.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[
            styles.dayCell, 
            inRange && styles.dayInRange,
            isSelected && styles.selectedDayCell
          ]}
          onPress={() => handleDateSelect(day)}
        >
          <Text style={[
            styles.dayText, 
            (isSelected || inRange) && styles.selectedDayText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    return days;
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <View style={styles.modalOverlay}>
        <View style={styles.filterContainer}>
          {/* Action Sheet */}
          <View style={styles.actionSheetContainer}>
            {/* Title */}
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>Selected Date Range</Text>
              
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
              style={styles.contentContainer}
              showsVerticalScrollIndicator={false}
            >
              {/* From Section */}
              <View style={styles.dateSection}>
                <Text style={styles.dateSectionLabel}>From</Text>
                <View style={[styles.dateSelector, selectingFrom && styles.dateSelectorActive]}>
                  <TouchableOpacity 
                    style={styles.arrowButton}
                    onPress={() => adjustFromDate(-1)}
                    disabled={!fromDate}
                  >
                    <CaretLeftIcon width={24} height={24} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.dateTouchable}
                    onPress={() => setSelectingFrom(true)}
                  >
                    <Text style={[styles.dateText, !fromDate && styles.placeholderText]}>
                      {formatDateDisplay(fromDate)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.arrowButton}
                    onPress={() => adjustFromDate(1)}
                    disabled={!fromDate}
                  >
                    <CaretRightIcon width={24} height={24} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

              {/* To Section */}
              <View style={styles.dateSection}>
                <Text style={styles.dateSectionLabel}>To</Text>
                <View style={[styles.dateSelector, !selectingFrom && styles.dateSelectorActive]}>
                  <TouchableOpacity 
                    style={styles.arrowButton}
                    onPress={() => adjustToDate(-1)}
                    disabled={!toDate}
                  >
                    <CaretLeftIcon width={24} height={24} />
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.dateTouchable}
                    onPress={() => setSelectingFrom(false)}
                  >
                    <Text style={[styles.dateText, !toDate && styles.placeholderText]}>
                      {formatDateDisplay(toDate)}
                    </Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.arrowButton}
                    onPress={() => adjustToDate(1)}
                    disabled={!toDate}
                  >
                    <CaretRightIcon width={24} height={24} />
                  </TouchableOpacity>
                </View>
              </View>

              {/* Divider */}
              <View style={styles.divider} />

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
            </ScrollView>

            {/* Action Buttons */}
            <View style={styles.actionContainer}>
              <TouchableOpacity 
                style={styles.resetButton} 
                onPress={handleReset}
                activeOpacity={0.7}
              >
                <Text style={styles.resetButtonText}>Reset</Text>
              </TouchableOpacity>

              <TouchableOpacity 
                style={[styles.viewButton, (!fromDate || !toDate) && styles.viewButtonDisabled]} 
                onPress={handleView}
                activeOpacity={0.7}
                disabled={!fromDate || !toDate}
              >
                <Text style={[styles.viewButtonText, (!fromDate || !toDate) && styles.viewButtonTextDisabled]}>
                  View
                </Text>
              </TouchableOpacity>
            </View>

            {/* System / Home Indicator */}
            <View style={styles.homeIndicator}>
              <View style={styles.gestureBar} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  // Filter Container
  filterContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 0,
    position: 'relative',
    width: '100%',
    height: 663,
  },
  // Action Sheet
  actionSheetContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: '100%',
    height: 663,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    flex: 0,
    alignSelf: 'stretch',
  },
  // Title
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 24,
    gap: 16,
    width: '100%',
    height: 60,
    backgroundColor: '#FFFFFF',
    flex: 0,
  },
  titleText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  closeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: 24,
    height: 24,
    flex: 0,
  },
  closeIcon: {
    width: 24,
    height: 24,
    flex: 0,
  },
  // Content
  contentContainer: {
    width: '100%',
    flex: 1,
    paddingHorizontal: 24,
  },
  // Date Section
  dateSection: {
    paddingVertical: 16,
  },
  dateSectionLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
    marginBottom: 8,
  },
  dateSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  dateSelectorActive: {
    borderColor: '#539461',
    borderWidth: 2,
    backgroundColor: '#F2F7F3',
  },
  arrowButton: {
    padding: 0,
  },
  dateTouchable: {
    flex: 1,
  },
  dateText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    textAlign: 'center',
  },
  placeholderText: {
    color: '#9BA5A8',
    fontWeight: '500',
  },
  // Divider
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4E7E9',
  },
  // Calendar Header
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
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  // Calendar Grid
  calendarGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: 12,
    paddingBottom: 16,
  },
  dayCell: {
    width: '14.28%', // 7 days in a week
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
  },
  dayInRange: {
    backgroundColor: '#E8F3EA',
  },
  selectedDayCell: {
    backgroundColor: '#539461',
    borderRadius: 12,
  },
  dayText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
  },
  selectedDayText: {
    color: '#FFFFFF',
  },
  emptyDay: {
    height: 22,
  },
  // Action Container
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingBottom: 0,
    paddingHorizontal: 24,
    gap: 8,
    width: '100%',
    height: 60,
    flex: 0,
    alignSelf: 'stretch',
  },
  // Reset Button
  resetButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 48,
    minHeight: 48,
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    flex: 1,
  },
  resetButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#539461',
  },
  // View Button
  viewButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    flex: 1,
  },
  viewButtonDisabled: {
    backgroundColor: '#CDD3D4',
  },
  viewButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  viewButtonTextDisabled: {
    color: '#9BA5A8',
  },
  // System / Home Indicator
  homeIndicator: {
    width: '100%',
    height: 34,
    backgroundColor: '#FFFFFF',
    flex: 0,
  },
  // Gesture Bar
  gestureBar: {
    position: 'absolute',
    width: 148,
    height: 5,
    left: '50%',
    marginLeft: -74,
    bottom: 8,
    backgroundColor: '#202325',
    borderRadius: 100,
  },
});

export default DateRangeFilter;

