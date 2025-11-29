import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CloseIcon from '../../../assets/admin-icons/x.svg';
import ChevronLeftIcon from '../../../assets/iconnav/caret-left-bold.svg';
import ChevronRightIcon from '../../../assets/admin-icons/arrow-right.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const SaturdayPickerModal = ({ visible, onClose, onSelectDate, initialDate = new Date(), minDate }) => {
  // Start from the month of minDate (or current month if minDate not provided)
  const getInitialCurrentDate = () => {
    if (minDate) {
      const min = new Date(minDate);
      return new Date(min.getFullYear(), min.getMonth(), 1);
    }
    const today = new Date();
    return new Date(today.getFullYear(), today.getMonth(), 1);
  };

  const [currentDate, setCurrentDate] = useState(getInitialCurrentDate());
  const [selectedDate, setSelectedDate] = useState(null);
  const slideAnim = useRef(new Animated.Value(582)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Reset to appropriate month when modal opens
  useEffect(() => {
    if (visible) {
      setCurrentDate(getInitialCurrentDate());
      setSelectedDate(null);
      
      // Animate in
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: 582,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible, minDate]);

  // Check if a date is a Saturday
  const isSaturday = (date) => {
    return date.getDay() === 6;
  };

  // Check if a date is after the minimum date (old flight date)
  const isAfterMinDate = (date) => {
    if (!minDate) {
      // If no minDate provided, check if after today
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const compareDate = new Date(date);
      compareDate.setHours(0, 0, 0, 0);
      return compareDate > today;
    }
    
    // Parse minDate (YYYY-MM-DD format)
    const [year, month, day] = minDate.split('-').map(Number);
    const min = new Date(year, month - 1, day);
    min.setHours(0, 0, 0, 0);
    
    const compareDate = new Date(date);
    compareDate.setHours(0, 0, 0, 0);
    
    return compareDate > min;
  };

  // Check if a date is selectable (Saturday after minDate)
  const isSelectableDate = (date) => {
    return isSaturday(date) && isAfterMinDate(date);
  };

  // Get calendar data for current month
  const getCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    // First day of month
    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();

    // Last day of month
    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    // Days from previous month
    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = Array.from(
      { length: startingDayOfWeek },
      (_, i) => ({
        day: prevMonthLastDay - startingDayOfWeek + i + 1,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - startingDayOfWeek + i + 1),
      })
    );

    // Days in current month
    const currentMonthDays = Array.from(
      { length: daysInMonth },
      (_, i) => ({
        day: i + 1,
        isCurrentMonth: true,
        date: new Date(year, month, i + 1),
      })
    );

    // Days from next month
    const totalCells = prevMonthDays.length + currentMonthDays.length;
    const nextMonthDays = Array.from(
      { length: 42 - totalCells }, // 6 weeks x 7 days = 42 cells
      (_, i) => ({
        day: i + 1,
        isCurrentMonth: false,
        date: new Date(year, month + 1, i + 1),
      })
    );

    return [...prevMonthDays, ...currentMonthDays, ...nextMonthDays];
  };

  const handlePreviousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1, 1));
  };

  const handleNextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1, 1));
  };

  const handleDateSelect = (dateData) => {
    if (isSelectableDate(dateData.date)) {
      setSelectedDate(dateData.date);
    }
  };

  const handleApply = () => {
    if (selectedDate) {
      // Format as YYYY-MM-DD using local timezone to avoid timezone shift
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const formattedDate = `${year}-${month}-${day}`;
      onSelectDate(formattedDate);
      onClose();
    }
  };

  const isSelected = (date) => {
    if (!selectedDate) return false;
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const [year, month, day] = dateStr.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const calendarDays = getCalendarData();

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.modalOverlay, { opacity: fadeAnim }]}>
        <TouchableOpacity
          style={styles.backdrop}
          activeOpacity={1}
          onPress={onClose}
        />

        <Animated.View
          style={[
            styles.modalContainer,
            {
              transform: [{ translateY: slideAnim }],
            },
          ]}
        >
          <SafeAreaView style={styles.safeArea} edges={['bottom']}>
            {/* Action Sheet */}
            <View style={styles.actionSheet}>
              {/* Title */}
              <View style={styles.titleContainer}>
                <Text style={styles.titleText}>Select Saturday</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <CloseIcon width={24} height={24} fill="#7F8D91" />
                </TouchableOpacity>
              </View>

              {/* Hint */}
              <View style={styles.hintContainer}>
                <Text style={styles.hintText}>
                  {minDate 
                    ? `Only Saturdays after ${formatDisplayDate(minDate)} can be selected`
                    : 'Only future Saturdays can be selected'
                  }
                </Text>
              </View>

              {/* Content */}
              <View style={styles.contentContainer}>
                {/* Calendar */}
                <View style={styles.calendarContainer}>
                  {/* Month Year Navigation */}
                  <View style={styles.monthYearContainer}>
                    <TouchableOpacity style={styles.navButton} onPress={handlePreviousMonth}>
                      <ChevronLeftIcon width={24} height={24} fill="#202325" />
                    </TouchableOpacity>

                    <View style={styles.monthYearTextContainer}>
                      <Text style={styles.monthText}>
                        {MONTHS[currentDate.getMonth()]}
                      </Text>
                      <Text style={styles.yearText}>
                        {currentDate.getFullYear()}
                      </Text>
                    </View>

                    <TouchableOpacity style={styles.navButton} onPress={handleNextMonth}>
                      <ChevronRightIcon width={24} height={24} fill="#202325" />
                    </TouchableOpacity>
                  </View>

                  {/* Week Days */}
                  <View style={styles.weekContainer}>
                    {WEEKDAYS.map((day, index) => (
                      <View key={day} style={styles.weekDayContainer}>
                        <Text 
                          style={[
                            styles.weekDayText,
                            index === 6 && styles.saturdayWeekDayText // Highlight Saturday column
                          ]}
                        >
                          {day}
                        </Text>
                      </View>
                    ))}
                  </View>

                  {/* Days Grid */}
                  <View style={styles.daysGrid}>
                    {calendarDays.map((dateData, index) => {
                      const isCurrentMonth = dateData.isCurrentMonth;
                      const isSelectedDate = isSelected(dateData.date);
                      const isSelectable = isSelectableDate(dateData.date);
                      const isSat = isSaturday(dateData.date);

                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.dayContainer,
                            isSelectedDate && styles.selectedDayContainer,
                          ]}
                          onPress={() => handleDateSelect(dateData)}
                          activeOpacity={isSelectable ? 0.7 : 1}
                          disabled={!isSelectable}
                        >
                          <View
                            style={[
                              styles.dayContent,
                              isSelectedDate && styles.selectedDayContent,
                              isSat && isSelectable && !isSelectedDate && styles.saturdayDayContent,
                            ]}
                          >
                            <Text
                              style={[
                                styles.dayText,
                                !isCurrentMonth && styles.disabledDayText,
                                !isSelectable && styles.disabledDayText,
                                isSelectedDate && styles.selectedDayText,
                                isSat && isSelectable && !isSelectedDate && styles.saturdayDayText,
                              ]}
                            >
                              {dateData.day}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionContainer}>
                <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
                  <Text style={styles.cancelButtonText}>Cancel</Text>
                </TouchableOpacity>

                <TouchableOpacity 
                  style={[
                    styles.applyButton,
                    !selectedDate && styles.applyButtonDisabled
                  ]} 
                  onPress={handleApply}
                  disabled={!selectedDate}
                >
                  <Text style={styles.applyButtonText}>Apply</Text>
                </TouchableOpacity>
              </View>
            </View>
          </SafeAreaView>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  backdrop: {
    flex: 1,
  },
  modalContainer: {
    width: SCREEN_WIDTH,
    height: 620,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  safeArea: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  actionSheet: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: '100%',
    height: 620,
    backgroundColor: '#FFFFFF',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 16,
    width: '100%',
    height: 60,
    backgroundColor: '#FFFFFF',
  },
  titleText: {
    width: 287,
    height: 24,
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
  },
  hintContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    width: '100%',
  },
  hintText: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
    textAlign: 'center',
  },
  contentContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    paddingVertical: 8,
    paddingHorizontal: 24,
    width: '100%',
    height: 428,
  },
  calendarContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingBottom: 12,
    gap: 12,
    width: '100%',
    height: 412,
  },
  monthYearContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 0,
    width: '100%',
    height: 80,
  },
  navButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    width: 48,
    minWidth: 48,
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  monthYearTextContainer: {
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 2,
    flex: 1,
  },
  monthText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
  },
  yearText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 18,
    textAlign: 'center',
    color: '#647276',
  },
  weekContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 0,
    gap: 8,
    width: '100%',
    height: 20,
  },
  weekDayContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 8,
    flex: 1,
    height: 20,
  },
  weekDayText: {
    flex: 1,
    height: 20,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
    color: '#647276',
  },
  saturdayWeekDayText: {
    color: '#539461',
    fontWeight: '700',
  },
  daysGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    width: '100%',
    height: 276,
    gap: 4.67,
  },
  dayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    width: 42,
    height: 42,
    borderRadius: 12,
    marginBottom: 4.67,
  },
  selectedDayContainer: {
    backgroundColor: '#C0DAC2',
  },
  dayContent: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 10,
    width: 42,
    maxWidth: 42,
    height: 42,
    maxHeight: 42,
    borderRadius: 12,
  },
  selectedDayContent: {
    backgroundColor: '#539461',
  },
  saturdayDayContent: {
    backgroundColor: '#F2F7F3',
    borderWidth: 1,
    borderColor: '#C0DAC2',
  },
  dayText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    textAlign: 'center',
    color: '#393D40',
  },
  disabledDayText: {
    color: '#D1D5DB',
  },
  selectedDayText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  saturdayDayText: {
    color: '#539461',
    fontWeight: '600',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 0,
    gap: 8,
    width: '100%',
    height: 60,
  },
  cancelButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    flex: 1,
    height: 48,
    minHeight: 48,
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
  },
  cancelButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    textAlign: 'center',
    color: '#539461',
  },
  applyButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    flex: 1,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
  },
  applyButtonDisabled: {
    backgroundColor: '#C0DAC2',
  },
  applyButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    textAlign: 'center',
    color: '#FFFFFF',
  },
});

export default SaturdayPickerModal;

