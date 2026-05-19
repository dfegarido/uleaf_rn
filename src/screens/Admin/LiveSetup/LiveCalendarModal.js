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

const LiveCalendarModal = ({ visible, onClose, onSelectDate, initialDate = new Date(), requests = [] }) => {
  const [currentDate, setCurrentDate] = useState(initialDate);
  const [selectedDate, setSelectedDate] = useState(initialDate);
  const slideAnim = useRef(new Animated.Value(680)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    if (visible) {
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

  const formatDateKey = (date) => {
    const d = new Date(date);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  };

  // Build request dots map from requests array
  const requestDots = React.useMemo(() => {
    const map = new Map();
    requests.forEach(req => {
      if (!req.requestedDate) return;
      const key = formatDateKey(req.requestedDate);
      const existing = map.get(key) || { pending: 0, approved: 0 };
      if (req.status === 'pending') existing.pending++;
      else if (req.status === 'approved') existing.approved++;
      map.set(key, existing);
    });
    return map;
  }, [requests]);

  const getCalendarData = () => {
    const year = currentDate.getFullYear();
    const month = currentDate.getMonth();

    const firstDay = new Date(year, month, 1);
    const startingDayOfWeek = firstDay.getDay();

    const lastDay = new Date(year, month + 1, 0);
    const daysInMonth = lastDay.getDate();

    const prevMonthLastDay = new Date(year, month, 0).getDate();
    const prevMonthDays = Array.from(
      { length: startingDayOfWeek },
      (_, i) => ({
        day: prevMonthLastDay - startingDayOfWeek + i + 1,
        isCurrentMonth: false,
        date: new Date(year, month - 1, prevMonthLastDay - startingDayOfWeek + i + 1),
      })
    );

    const currentMonthDays = Array.from(
      { length: daysInMonth },
      (_, i) => ({
        day: i + 1,
        isCurrentMonth: true,
        date: new Date(year, month, i + 1),
      })
    );

    const totalCells = prevMonthDays.length + currentMonthDays.length;
    const nextMonthDays = Array.from(
      { length: 42 - totalCells },
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

  const hasRequests = (date) => {
    const key = formatDateKey(date);
    return requestDots.has(key);
  };

  const getDots = (date) => {
    const key = formatDateKey(date);
    return requestDots.get(key) || { pending: 0, approved: 0 };
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
            <View style={styles.actionSheet}>
              <View style={styles.titleContainer}>
                <Text style={styles.titleText}>Select Date</Text>
                <TouchableOpacity onPress={onClose} style={styles.closeButton}>
                  <CloseIcon width={24} height={24} fill="#7F8D91" />
                </TouchableOpacity>
              </View>

              <View style={styles.contentContainer}>
                <View style={styles.calendarContainer}>
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

                  <View style={styles.weekContainer}>
                    {WEEKDAYS.map((day) => (
                      <View key={day} style={styles.weekDayContainer}>
                        <Text style={styles.weekDayText}>{day}</Text>
                      </View>
                    ))}
                  </View>

                  <View style={styles.daysGrid}>
                    {calendarDays.map((dateData, index) => {
                      const isCurrentMonth = dateData.isCurrentMonth;
                      const isTodayDate = isToday(dateData.date);
                      const isSelectedDate = isSelected(dateData.date);
                      const dayDots = hasRequests(dateData.date) ? getDots(dateData.date) : null;

                      return (
                        <TouchableOpacity
                          key={index}
                          style={[
                            styles.dayContainer,
                            isSelectedDate && styles.selectedDayContainer,
                            dayDots && !isSelectedDate && styles.hasRequestsDayContainer,
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
                            {dayDots && (
                              <View style={styles.dotsContainer}>
                                {dayDots.pending > 0 && (
                                  <View style={[styles.dot, styles.pendingDot]} />
                                )}
                                {dayDots.approved > 0 && (
                                  <View style={[styles.dot, styles.approvedDot]} />
                                )}
                              </View>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                  </View>
                </View>
              </View>

              <View style={styles.legendContainer}>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.pendingDot]} />
                  <Text style={styles.legendText}>Pending</Text>
                </View>
                <View style={styles.legendItem}>
                  <View style={[styles.legendDot, styles.approvedDot]} />
                  <Text style={styles.legendText}>Approved</Text>
                </View>
              </View>

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
    height: 680,
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
    height: 680,
    backgroundColor: '#FFFFFF',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 12,
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
    height: 468,
  },
  calendarContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingBottom: 12,
    gap: 12,
    width: '100%',
    height: 452,
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
    height: 316,
    gap: 4.67,
  },
  dayContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    width: 42,
    height: 48,
    borderRadius: 12,
    marginBottom: 4.67,
  },
  selectedDayContainer: {
    backgroundColor: '#C0DAC2',
  },
  hasRequestsDayContainer: {
    backgroundColor: '#FFF8F0',
  },
  dayContent: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 2,
    width: 42,
    maxWidth: 42,
    height: 48,
    maxHeight: 48,
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
  dotsContainer: {
    flexDirection: 'row',
    gap: 3,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  dot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
  },
  pendingDot: {
    backgroundColor: '#F59E0B',
  },
  approvedDot: {
    backgroundColor: '#539461',
  },
  legendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 20,
    paddingHorizontal: 24,
    paddingVertical: 8,
    width: '100%',
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  legendText: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#6B777B',
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 24,
    marginBottom: 24,
    gap: 8,
    width: '100%',
    height: 84,
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

export default LiveCalendarModal;
