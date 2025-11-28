import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import CalendarIcon from '../../../assets/admin-icons/calendar.svg';
import ArrowDownIcon from '../../../assets/admin-icons/arrow-down.svg';
import ThailandFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import PhilippinesFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import IndonesiaFlag from '../../../assets/buyer-icons/indonesia-flag.svg';
import { getFlightScheduleApi } from '../../../components/Api/getFlightScheduleApi';
import CalendarModal from './CalendarModal';
import FilterModal from './FilterModal';

// Helper to get country flag component
const getCountryFlag = (countryCode) => {
  switch (countryCode) {
    case 'TH':
      return ThailandFlag;
    case 'PH':
      return PhilippinesFlag;
    case 'ID':
      return IndonesiaFlag;
    default:
      return ThailandFlag;
  }
};

// Event Card Component
const EventCard = ({ event }) => {
  const FlagComponent = getCountryFlag(event.country);

  // Determine card background color based on type
  const getCardStyle = () => {
    switch (event.type) {
      case 'purple':
        return { backgroundColor: '#6B4EFF' };
      case 'blue':
        return { backgroundColor: '#48A7F8' };
      case 'green':
        return { backgroundColor: '#539461' };
      case 'white':
      default:
        return { backgroundColor: '#FFFFFF' };
    }
  };

  // Determine text color based on card type
  const getTextColor = () => {
    return event.type === 'white' ? '#202325' : '#FFFFFF';
  };

  // Determine status color
  const getStatusColor = () => {
    return event.status === 'active' ? '#23C16B' : '#E7522F';
  };

  const getStatusText = () => {
    return event.status === 'active' ? 'Active' : 'Canceled';
  };

  return (
    <View style={[styles.eventCard, getCardStyle()]}>
      <View style={styles.eventHeader}>
        <View style={styles.eventStatus}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, event.type !== 'white' && { color: '#FFFFFF' }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>
      <Text style={[styles.eventTitle, { color: getTextColor() }]} numberOfLines={2}>
        {event.title}
      </Text>
    </View>
  );
};

// Day Schedule Component
const DaySchedule = React.forwardRef(({ dayData }, ref) => {
  const dayContainerStyle = dayData.isToday
    ? [styles.dayContainer, styles.todayContainer]
    : styles.dayContainer;

  const dayNumberStyle = dayData.isToday
    ? [styles.dayNumber, styles.todayDayNumber]
    : styles.dayNumber;

  return (
    <View ref={ref} style={dayContainerStyle}>
      {/* Day Indicator */}
      <View style={styles.dayIndicator}>
        <Text style={dayNumberStyle}>{dayData.day}</Text>
        <Text style={styles.dayMonth}>{dayData.month}</Text>
      </View>

      {/* Events for this day */}
      <View style={styles.eventsContainer}>
        {dayData.events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </View>
    </View>
  );
});

const Schedule = () => {
  const navigation = useNavigation();
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showCalendarModal, setShowCalendarModal] = useState(false);
  const [selectedDate, setSelectedDate] = useState(new Date());
  const scrollViewRef = useRef(null);
  const dayRefs = useRef({});

  // Filter states
  const [showFilterModal, setShowFilterModal] = useState(false);
  const [activeFilterType, setActiveFilterType] = useState(null);
  const [selectedEventTypes, setSelectedEventTypes] = useState([]);
  const [selectedStatuses, setSelectedStatuses] = useState([]);
  const [selectedCountries, setSelectedCountries] = useState([]);

  // Fetch flight schedule data
  const fetchScheduleData = async () => {
    try {
      setLoading(true);
      setError(null);
      console.log('📅 Schedule - Fetching flight schedule...');

      const response = await getFlightScheduleApi();

      if (response.success && response.data) {
        console.log('✅ Schedule - Data loaded successfully:', response.data.length, 'days');
        setScheduleData(response.data);
      } else {
        throw new Error('Failed to load schedule data');
      }
    } catch (err) {
      console.error('❌ Schedule - Error loading data:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Fetch data on mount and when screen is focused
  useFocusEffect(
    React.useCallback(() => {
      fetchScheduleData();
    }, [])
  );

  // Function to scroll to a specific date
  const scrollToDate = (date) => {
    if (!scheduleData.length) return;

    // Find the day card that matches the selected date
    const selectedDateStr = new Date(date).toDateString();
    const dayIndex = scheduleData.findIndex(dayData => {
      const dayDate = new Date(dayData.date);
      return dayDate.toDateString() === selectedDateStr;
    });

    if (dayIndex !== -1 && dayRefs.current[dayIndex]) {
      // Measure and scroll to the position
      dayRefs.current[dayIndex].measureLayout(
        scrollViewRef.current,
        (x, y) => {
          scrollViewRef.current?.scrollTo({
            y: y - 20, // Offset by 20px for some top padding
            animated: true,
          });
        },
        (error) => {
          console.error('Error measuring layout:', error);
        }
      );
    }
  };

  // Handle date selection from calendar
  const handleDateSelect = (date) => {
    setSelectedDate(date);
    console.log('Selected date:', date);
    // Scroll to the selected date after modal closes
    setTimeout(() => {
      scrollToDate(date);
    }, 400); // Wait for modal close animation
  };

  // Handle filter button press
  const handleFilterPress = (filterType) => {
    setActiveFilterType(filterType);
    setShowFilterModal(true);
  };

  // Handle filter apply
  const handleFilterApply = (values) => {
    switch (activeFilterType) {
      case 'eventType':
        setSelectedEventTypes(values);
        break;
      case 'status':
        setSelectedStatuses(values);
        break;
      case 'country':
        setSelectedCountries(values);
        break;
    }
    console.log(`Applied ${activeFilterType} filter:`, values);
  };

  // Get selected values for current filter type
  const getSelectedFilterValues = () => {
    switch (activeFilterType) {
      case 'eventType':
        return selectedEventTypes;
      case 'status':
        return selectedStatuses;
      case 'country':
        return selectedCountries;
      default:
        return [];
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.headerContent}>
        <View style={styles.headerControls}>
          {/* Back Button */}
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.7}
          >
            <BackSolidIcon width={24} height={24} fill="#393D40" />
          </TouchableOpacity>

          {/* Navbar Right - Action Button */}
          <View style={styles.navbarRight}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => setShowCalendarModal(true)}
              activeOpacity={0.7}
            >
              <CalendarIcon width={24} height={24} />
            </TouchableOpacity>
          </View>

          {/* Title - Centered */}
          <Text style={styles.headerTitle}>Schedule</Text>
        </View>
      </View>

      {/* Filter Section */}
      <View style={styles.filterContainer}>
        {/* Event Type Filter */}
        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.7}
          onPress={() => handleFilterPress('eventType')}
        >
          <View style={styles.filterTextContainer}>
            <Text style={styles.filterButtonText}>Event Type</Text>
          </View>
          <ArrowDownIcon width={16} height={16} fill="#202325" />
        </TouchableOpacity>

        {/* Status Filter */}
        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.7}
          onPress={() => handleFilterPress('status')}
        >
          <View style={styles.filterTextContainer}>
            <Text style={styles.filterButtonText}>Status</Text>
          </View>
          <ArrowDownIcon width={16} height={16} fill="#202325" />
        </TouchableOpacity>

        {/* Country Filter */}
        <TouchableOpacity
          style={styles.filterButton}
          activeOpacity={0.7}
          onPress={() => handleFilterPress('country')}
        >
          <View style={styles.filterTextContainer}>
            <Text style={styles.filterButtonText}>Country</Text>
          </View>
          <ArrowDownIcon width={16} height={16} fill="#202325" />
        </TouchableOpacity>
      </View>

      {/* Loading State */}
      {loading && (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#539461" />
          <Text style={styles.loadingText}>Loading flight schedule...</Text>
        </View>
      )}

      {/* Error State */}
      {error && !loading && (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load schedule</Text>
          <TouchableOpacity
            style={styles.retryButton}
            onPress={fetchScheduleData}
            activeOpacity={0.7}
          >
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Schedule List */}
      {!loading && !error && (
        <ScrollView
          ref={scrollViewRef}
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {scheduleData.length > 0 ? (
            scheduleData.map((dayData, index) => (
              <DaySchedule
                key={dayData.id}
                ref={(ref) => (dayRefs.current[index] = ref)}
                dayData={dayData}
              />
            ))
          ) : (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No flight schedule available</Text>
            </View>
          )}
        </ScrollView>
      )}

      {/* Calendar Modal */}
      <CalendarModal
        visible={showCalendarModal}
        onClose={() => setShowCalendarModal(false)}
        onSelectDate={handleDateSelect}
        initialDate={selectedDate}
      />

      {/* Filter Modal */}
      <FilterModal
        visible={showFilterModal}
        onClose={() => setShowFilterModal(false)}
        onApply={handleFilterApply}
        filterType={activeFilterType}
        selectedValues={getSelectedFilterValues()}
      />
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  // Header Content - width: 375px, height: 58px, min-height: 58px
  headerContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: '100%',
    height: 58,
    minHeight: 58,
    alignSelf: 'stretch',
  },
  // Controls - padding: 6px 16px 12px
  headerControls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingHorizontal: 16,
    paddingBottom: 12,
    width: '100%',
    height: 58,
    minHeight: 58,
    alignSelf: 'stretch',
    position: 'relative',
  },
  // Back Button - width: 24px, height: 24px
  backButton: {
    width: 24,
    height: 24,
    zIndex: 0,
  },
  // Navbar Right - justify-content: flex-end, gap: 12px
  navbarRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    width: 319,
    height: 40,
    flex: 1,
    zIndex: 1,
  },
  // Action Button - width: 40px, height: 40px, border: 1px solid #CDD3D4, border-radius: 12px
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    width: 40,
    height: 40,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  // Title - Centered, font-size: 18px, line-height: 24px
  headerTitle: {
    position: 'absolute',
    width: 240,
    height: 24,
    left: '50%',
    top: 14,
    transform: [{ translateX: -120 }], // Center the 240px width title
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
    zIndex: 2,
  },
  // Filter Container - padding: 0px 15px, gap: 8px
  filterContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 8,
    height: 34,
    marginBottom: 0,
  },
  // Filter Button - width varies, height: 34px
  filterButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    height: 34,
    minHeight: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  // Filter Text Container
  filterTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    gap: 8,
    height: 16,
  },
  // Filter Button Text
  filterButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    color: '#393D40',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingTop: 16,
    paddingBottom: 34,
    paddingHorizontal: 20,
  },
  dayContainer: {
    backgroundColor: '#F5F6F6',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  todayContainer: {
    backgroundColor: '#DFECDF',
    borderBottomWidth: 2,
    borderBottomColor: '#539461',
  },
  dayIndicator: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 12,
    gap: 6,
  },
  dayNumber: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 36,
    color: '#202325',
  },
  todayDayNumber: {
    color: '#539461',
  },
  dayMonth: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 24,
    color: '#647276',
  },
  eventsContainer: {
    gap: 12,
  },
  eventCard: {
    borderRadius: 12,
    padding: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  eventHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  eventCountry: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  eventStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
  },
  eventTitle: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#647276',
    marginTop: 16,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
    paddingVertical: 40,
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#E7522F',
    marginBottom: 20,
    textAlign: 'center',
  },
  retryButton: {
    backgroundColor: '#539461',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#647276',
    textAlign: 'center',
  },
});

export default Schedule;
