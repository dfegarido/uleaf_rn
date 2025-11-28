import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  Modal,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import CloseIcon from '../../../assets/admin-icons/x.svg';
import ChevronLeftIcon from '../../../assets/iconnav/caret-left-bold.svg';
import ChevronRightIcon from '../../../assets/admin-icons/arrow-right.svg';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

const CalendarModal = ({ visible, onClose, onSelectDate, initialDate = new Date() }) => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const slideAnim = useRef(new Animated.Value(582)).current; // Start off-screen (height of modal)
  const fadeAnim = useRef(new Animated.Value(0)).current; // Start transparent

  // Animate modal in/out when visibility changes
  useEffect(() => {
    if (visible) {
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
  }, [visible]);

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
    setSelectedDate(dateData.date);
  };

  const handleApply = () => {
    onSelectDate(selectedDate);
    onClose();
  };

  const isToday = (date) => {
    const today = new Date();
    return date.getDate() === today.getDate() &&
           date.getMonth() === today.getMonth() &&
           date.getFullYear() === today.getFullYear();
  };

  const isSelected = (date) => {
    return date.getDate() === selectedDate.getDate() &&
           date.getMonth() === selectedDate.getMonth() &&
           date.getFullYear() === selectedDate.getFullYear();
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
              <Text style={styles.titleText}>Select Date</Text>
              <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                <CloseIcon width={24} height={24} fill="#7F8D91" />
              </TouchableOpacity>
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

                  <Text style={styles.monthYearText}>
                    {MONTHS[currentDate.getMonth()]}, {currentDate.getFullYear()}
                  </Text>

                  <TouchableOpacity style={styles.navButton} onPress={handleNextMonth}>
                    <ChevronRightIcon width={24} height={24} fill="#202325" />
                  </TouchableOpacity>
                </View>

                {/* Week Days */}
                <View style={styles.weekContainer}>
                  {WEEKDAYS.map((day) => (
                    <View key={day} style={styles.weekDayContainer}>
                      <Text style={styles.weekDayText}>{day}</Text>
                    </View>
                  ))}
                </View>

                {/* Days Grid */}
                <View style={styles.daysGrid}>
                  {calendarDays.map((dateData, index) => {
                    const isCurrentMonth = dateData.isCurrentMonth;
                    const isTodayDate = isToday(dateData.date);
                    const isSelectedDate = isSelected(dateData.date);

                    return (
                      <TouchableOpacity
                        key={index}
                        style={[
                          styles.dayContainer,
                          isSelectedDate && styles.selectedDayContainer,
                        ]}
                        onPress={() => handleDateSelect(dateData)}
                        activeOpacity={0.7}
                      >
                        <View
                          style={[
                            styles.dayContent,
                            isSelectedDate && styles.selectedDayContent,
                          ]}
                        >
                          <Text
                            style={[
                              styles.dayText,
                              !isCurrentMonth && styles.disabledDayText,
                              isSelectedDate && styles.selectedDayText,
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

              <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
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
    height: 582,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden', // Important for Android to clip border radius
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
    height: 582,
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
  monthYearText: {
    width: 102,
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
    color: '#393D40',
    flexShrink: 0,
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
    color: '#539461',
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
    color: '#A9B3B7',
  },
  selectedDayText: {
    color: '#FFFFFF',
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

export default CalendarModal;
