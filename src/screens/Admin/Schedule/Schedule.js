import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Modal,
  Switch,
  Animated,
  Dimensions,
  Alert,
  Platform,
  TextInput,
} from 'react-native';

const { height: SCREEN_HEIGHT } = Dimensions.get('window');
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import CalendarIcon from '../../../assets/admin-icons/calendar.svg';
import ArrowDownIcon from '../../../assets/admin-icons/arrow-down.svg';
import CloseIcon from '../../../assets/admin-icons/close-x.svg';
import ThailandFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import PhilippinesFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import IndonesiaFlag from '../../../assets/buyer-icons/indonesia-flag.svg';
import { getFlightScheduleApi } from '../../../components/Api/getFlightScheduleApi';
import { updateFlightDateStatusApi } from '../../../components/Api/updateFlightDateStatusApi';
import { updateFlightDateForScheduleApi } from '../../../components/Api/updateFlightDateForScheduleApi';
import Toast from '../../../components/Toast/Toast';
import CalendarModal from './CalendarModal';
import FilterModal from './FilterModal';
import SaturdayPickerModal from './SaturdayPickerModal';

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

// Order Details Modal Component
const OrderDetailsModal = ({
  visible,
  onClose,
  event,
  flightDate,
  onStatusUpdate,
  onShowToast,
  onOpenUpdateSchedule,
}) => {
  const [isActive, setIsActive] = useState(event?.status === 'active' || event?.isActive !== false);
  const [inactiveNote, setInactiveNote] = useState(event?.inactiveNote || '');
  const [showNoteInput, setShowNoteInput] = useState(false);
  const FlagComponent = getCountryFlag(event?.countries?.[0] || 'TH');
  
  // Animation values
  const slideAnim = useRef(new Animated.Value(SCREEN_HEIGHT)).current;
  const backdropAnim = useRef(new Animated.Value(0)).current;

  // Sync isActive state when event changes
  useEffect(() => {
    if (event) {
      setIsActive(event.status === 'active' || event.isActive !== false);
      setInactiveNote(event.inactiveNote || '');
      setShowNoteInput(false);
    }
  }, [event]);

  useEffect(() => {
    if (visible) {
      // Animate in
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          damping: 25,
          stiffness: 200,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      // Animate out
      Animated.parallel([
        Animated.timing(backdropAnim, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: SCREEN_HEIGHT,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const handleClose = () => {
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
    });
  };

  if (!event) return null;

  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  };

  const handleUpdateSchedulePress = () => {
    if (!flightDate || !onOpenUpdateSchedule) {
      handleClose();
      return;
    }

    // Normalize flightDate to YYYY-MM-DD and formatted string
    let dateStr;
    let formattedStr;
    if (typeof flightDate === 'string') {
      if (flightDate.includes('T')) {
        const d = new Date(flightDate);
        dateStr = d.toISOString().split('T')[0];
        formattedStr = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      } else if (flightDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateStr = flightDate;
        const d = new Date(flightDate);
        formattedStr = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      } else {
        const d = new Date(flightDate);
        dateStr = d.toISOString().split('T')[0];
        formattedStr = d.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          year: 'numeric',
        });
      }
    } else {
      const d = new Date(flightDate);
      dateStr = d.toISOString().split('T')[0];
      formattedStr = d.toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      });
    }

    // Close first modal with animation, then open second modal after animation completes
    Animated.parallel([
      Animated.timing(backdropAnim, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: SCREEN_HEIGHT,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onClose();
      // Wait a bit more to ensure modal is fully dismissed before opening new one
      setTimeout(() => {
        onOpenUpdateSchedule(dateStr, formattedStr);
      }, 100);
    });
  };

  const handleToggleStatus = async (newValue) => {
    if (!flightDate) return;

    // Prevent deactivation if there are orders
    if (!newValue && event?.hasOrders) {
      Alert.alert(
        'Cannot Deactivate',
        `This flight date has ${event.orderCount} order${event.orderCount > 1 ? 's' : ''} scheduled. Please remove or reassign orders before deactivating.`,
        [{ text: 'OK' }]
      );
      return;
    }

    // If deactivating, show note input
    if (!newValue) {
      setShowNoteInput(true);
      setIsActive(false);
      return;
    }

    // If activating, clear note and proceed
    setInactiveNote('');
    await submitStatusChange(newValue, '');
  };

  const submitStatusChange = async (newValue, note) => {
    if (!flightDate) return;

    try {
      // Extract date string from flightDate (could be ISO string or YYYY-MM-DD)
      let dateStr;
      if (typeof flightDate === 'string') {
        if (flightDate.includes('T')) {
          // ISO string format
          dateStr = new Date(flightDate).toISOString().split('T')[0];
        } else if (flightDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
          // Already in YYYY-MM-DD format
          dateStr = flightDate;
        } else {
          // Try to parse as date
          dateStr = new Date(flightDate).toISOString().split('T')[0];
        }
      } else {
        // Date object
        dateStr = new Date(flightDate).toISOString().split('T')[0];
      }

      console.log(`🔄 Updating flight date status: ${dateStr} to ${newValue ? 'active' : 'inactive'}`);

      // Optimistic update: update UI immediately
      const previousValue = isActive;
      const previousNote = inactiveNote;
      setIsActive(newValue);
      setInactiveNote(note);
      if (onStatusUpdate) {
        onStatusUpdate(dateStr, newValue, note);
      }

      // Call API in background
      await updateFlightDateStatusApi(dateStr, newValue, note);

      console.log('✅ Flight date status updated successfully');
      if (onShowToast) {
        onShowToast(
          'success',
          `Flight date ${dateStr} ${newValue ? 'activated' : 'deactivated'}`
        );
      }
      setShowNoteInput(false);
    } catch (error) {
      console.error('❌ Failed to update flight date status:', error);
      // Revert optimistic update on error
      const previousValue = !newValue;
      setIsActive(previousValue);
      if (onStatusUpdate) {
        // Revert parent state as well
        let dateStr;
        if (typeof flightDate === 'string') {
          if (flightDate.includes('T')) {
            dateStr = new Date(flightDate).toISOString().split('T')[0];
          } else if (flightDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
            dateStr = flightDate;
          } else {
            dateStr = new Date(flightDate).toISOString().split('T')[0];
          }
        } else {
          dateStr = new Date(flightDate).toISOString().split('T')[0];
        }
        onStatusUpdate(dateStr, previousValue, event?.inactiveNote || '');
      }
      if (onShowToast) {
        onShowToast(
          'error',
          error.message || 'Failed to update flight date status. Please try again.'
        );
      }
      setShowNoteInput(false);
    }
  };

  const handleSaveNote = async () => {
    if (!inactiveNote.trim()) {
      Alert.alert('Note Required', 'Please provide a reason for marking this flight date as inactive.');
      return;
    }
    
    // Optimistic update: close modal immediately and update UI
    setShowNoteInput(false);
    
    // Extract date string
    let dateStr;
    if (typeof flightDate === 'string') {
      if (flightDate.includes('T')) {
        dateStr = new Date(flightDate).toISOString().split('T')[0];
      } else if (flightDate.match(/^\d{4}-\d{2}-\d{2}$/)) {
        dateStr = flightDate;
      } else {
        dateStr = new Date(flightDate).toISOString().split('T')[0];
      }
    } else {
      dateStr = new Date(flightDate).toISOString().split('T')[0];
    }
    
    // Update parent state immediately
    if (onStatusUpdate) {
      onStatusUpdate(dateStr, false, inactiveNote);
    }
    
    // Close modal
    handleClose();
    
    // Call API in background
    try {
      await updateFlightDateStatusApi(dateStr, false, inactiveNote);
      console.log('✅ Flight date status updated successfully');
      if (onShowToast) {
        onShowToast('success', `Flight date ${dateStr} deactivated`);
      }
    } catch (error) {
      console.error('❌ Failed to update flight date status:', error);
      // Revert optimistic update on error
      if (onStatusUpdate) {
        onStatusUpdate(dateStr, true, ''); // Revert to active with no note
      }
      if (onShowToast) {
        onShowToast('error', error.message || 'Failed to update flight date status. Please try again.');
      }
    }
  };

  const handleCancelNote = () => {
    setIsActive(true);
    setInactiveNote(event?.inactiveNote || '');
    setShowNoteInput(false);
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="none"
      onRequestClose={handleClose}
    >
      <Animated.View 
        style={[
          styles.modalOverlay,
          {
            opacity: backdropAnim,
          }
        ]}
      >
        <TouchableOpacity 
          style={StyleSheet.absoluteFill} 
          activeOpacity={1} 
          onPress={handleClose}
        />
        <Animated.View 
          style={[
            styles.modalContent,
            {
              transform: [{ translateY: slideAnim }],
            }
          ]}
        >
          {/* Header */}
          <View style={[styles.modalHeader, styles.modalHeaderRounded]}>
            <Text style={styles.modalTitle}>Air Cargo Flight</Text>
            <TouchableOpacity onPress={handleClose} style={styles.closeButton}>
              <CloseIcon width={24} height={24} fill="#7F8D91" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.modalBody}>
            {/* Date */}
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Date</Text>
              <Text style={styles.modalValue}>{formatDate(flightDate)}</Text>
            </View>

            {/* Status Toggle */}
            <View style={styles.modalRowToggle}>
              <Text style={styles.modalLabel}>Status</Text>
              <View style={styles.toggleContainer}>
                <Text style={[
                  styles.toggleText, 
                  isActive && styles.toggleTextActive,
                  (event?.hasOrders && isActive) && styles.toggleTextDisabled
                ]}>
                  {isActive ? 'Active' : 'Inactive'}
                </Text>
                <View style={[
                  styles.switchWrapper,
                  (event?.hasOrders && isActive) && styles.switchWrapperDisabled
                ]}>
                  <Switch
                    value={isActive}
                    onValueChange={handleToggleStatus}
                    trackColor={{ 
                      false: '#E7522F', 
                      true: '#539461' 
                    }}
                    thumbColor="#FFFFFF"
                    disabled={event?.hasOrders && isActive}
                    ios_backgroundColor="#D1D5DB"
                  />
                </View>
              </View>
            </View>

            {/* Show existing note if inactive and not editing */}
            {!isActive && !showNoteInput && inactiveNote && (
              <View style={styles.noteDisplayContainer}>
                <Text style={styles.noteLabel}>Reason:</Text>
                <Text style={styles.noteText}>{inactiveNote}</Text>
              </View>
            )}

            {/* Note Input (shown when deactivating) */}
            {showNoteInput && (
              <View style={styles.noteInputContainer}>
                <Text style={styles.noteInputLabel}>Reason for marking as inactive:</Text>
                <TextInput
                  style={styles.noteInput}
                  value={inactiveNote}
                  onChangeText={setInactiveNote}
                  placeholder="e.g., Holiday, No flights scheduled, Weather conditions..."
                  placeholderTextColor="#9CA3AF"
                  multiline
                  numberOfLines={3}
                  textAlignVertical="top"
                />
                <View style={styles.noteButtonsContainer}>
                  <TouchableOpacity 
                    style={styles.noteCancelButton}
                    onPress={handleCancelNote}
                  >
                    <Text style={styles.noteCancelButtonText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity 
                    style={styles.noteSaveButton}
                    onPress={handleSaveNote}
                  >
                    <Text style={styles.noteSaveButtonText}>Save</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </View>

          {/* Action Button - Only show if there are orders */}
          {event.hasOrders && (
            <View style={styles.modalActions}>
              <TouchableOpacity 
                style={[
                  styles.viewOrdersButton,
                ]}
                onPress={handleUpdateSchedulePress}
              >
                <Text style={styles.viewOrdersButtonText}>
                  Update Schedule
                </Text>
              </TouchableOpacity>
            </View>
          )}

        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

// Event Card Component
const EventCard = ({ event, onPress }) => {
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
    <TouchableOpacity 
      style={[styles.eventCard, getCardStyle()]} 
      onPress={onPress}
      activeOpacity={0.7}
    >
      <View style={styles.eventHeader}>
        <View style={styles.eventStatus}>
          <View style={[styles.statusDot, { backgroundColor: getStatusColor() }]} />
          <Text style={[styles.statusText, event.type !== 'white' && { color: '#FFFFFF' }]}>
            {getStatusText()}
          </Text>
        </View>
      </View>
      {/* Only show title if it's not "Available" or if the status is active */}
      {(event.title !== 'Available' || event.status === 'active') && (
        <Text style={[styles.eventTitle, { color: getTextColor() }]} numberOfLines={2}>
          {event.title}
        </Text>
      )}
      {event.inactiveNote && event.status !== 'active' && (
        <View style={styles.eventNoteContainer}>
          <Text style={[styles.eventNoteLabel, { color: getTextColor() }]}>
            Note:
          </Text>
          <Text style={[styles.eventNoteText, { color: getTextColor() }]} numberOfLines={2}>
            {event.inactiveNote}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );
};

// Day Schedule Component
const DaySchedule = React.forwardRef(({ dayData, onEventPress }, ref) => {
  const dayContainerStyle = dayData.isToday
    ? [styles.dayContainer, styles.todayContainer]
    : styles.dayContainer;

  const dayNumberStyle = dayData.isToday
    ? [styles.dayNumber, styles.todayDayNumber]
    : styles.dayNumber;

  const year =
    dayData.date ? new Date(dayData.date).getFullYear() : null;

  return (
    <View ref={ref} style={dayContainerStyle}>
      {/* Day Indicator */}
      <View style={styles.dayIndicator}>
        <Text style={dayNumberStyle}>{dayData.day}</Text>
        <Text style={styles.dayMonth}>{dayData.month}</Text>
        {year && (
          <Text style={styles.dayYear}>{year}</Text>
        )}
      </View>

      {/* Events for this day */}
      <View style={styles.eventsContainer}>
        {dayData.events.map((event) => (
          <EventCard 
            key={event.id} 
            event={event} 
            onPress={() => onEventPress(event, dayData.date)}
          />
        ))}
      </View>
    </View>
  );
});

// Skeleton Day Schedule Component (for loading state)
const SkeletonDaySchedule = () => {
  return (
    <View style={[styles.dayContainer, styles.skeletonDayContainer]}>
      {/* Day Indicator skeleton */}
      <View style={styles.dayIndicator}>
        <View style={styles.skeletonCircle} />
        <View style={styles.skeletonRectSmall} />
      </View>

      {/* Event skeleton */}
      <View style={styles.eventsContainer}>
        <View style={[styles.eventCard, styles.skeletonCard]}>
          <View style={styles.skeletonStatusRow}>
            <View style={[styles.statusDot, styles.skeletonStatusDot]} />
            <View style={styles.skeletonRectSmall} />
          </View>
          <View style={styles.skeletonRectLarge} />
        </View>
      </View>
    </View>
  );
};

// Update Schedule Modal Component
const UpdateScheduleModal = ({
  visible,
  onClose,
  oldFlightDate,
  oldFlightDateDisplay,
  onSubmit,
}) => {
  const [newDate, setNewDate] = useState('');
  const [errorText, setErrorText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showSaturdayPicker, setShowSaturdayPicker] = useState(false);

  useEffect(() => {
    if (visible) {
      setNewDate('');
      setErrorText('');
      setIsSubmitting(false);
      setShowSaturdayPicker(false);
    }
  }, [visible]);

  const validateNewDate = (value) => {
    if (!value) {
      setErrorText('');
      return false;
    }

    const regex = /^\d{4}-\d{2}-\d{2}$/;
    if (!regex.test(value)) {
      setErrorText('Use format YYYY-MM-DD');
      return false;
    }

    if (value === oldFlightDate) {
      setErrorText('New date must be different from old date');
      return false;
    }

    const [year, month, day] = value.split('-').map(Number);
    const d = new Date(year, month - 1, day);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(d.getTime())) {
      setErrorText('Invalid date');
      return false;
    }

    // Check if it's a Saturday
    if (d.getDay() !== 6) {
      setErrorText('Date must be a Saturday');
      return false;
    }

    setErrorText('');
    return true;
  };

  const handleDateSelect = (dateStr) => {
    setNewDate(dateStr);
    validateNewDate(dateStr);
    setShowSaturdayPicker(false);
  };

  const handleSubmit = async () => {
    if (!validateNewDate(newDate) || !onSubmit) return;
    try {
      setIsSubmitting(true);
      await onSubmit(oldFlightDate, newDate);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDisplayDate = (dateStr) => {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.modalOverlay}>
        <TouchableOpacity
          style={StyleSheet.absoluteFill}
          activeOpacity={1}
          onPress={onClose}
        />
        <View style={styles.modalContent}>
          {/* Header */}
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Update Schedule</Text>
            <TouchableOpacity onPress={onClose} style={styles.closeButton}>
              <CloseIcon width={24} height={24} fill="#7F8D91" />
            </TouchableOpacity>
          </View>

          {/* Content */}
          <View style={styles.modalBody}>
            {/* Old Date */}
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>Old Flight Date</Text>
              <Text style={styles.modalValue}>
                {oldFlightDateDisplay || oldFlightDate}
              </Text>
            </View>

            {/* New Date Input */}
            <View style={styles.modalRow}>
              <Text style={styles.modalLabel}>New Flight Date</Text>
              <TouchableOpacity 
                style={styles.datePickerButton}
                onPress={() => setShowSaturdayPicker(true)}
                activeOpacity={0.7}
              >
                <Text style={[
                  styles.datePickerButtonText,
                  !newDate && styles.datePickerPlaceholder
                ]}>
                  {newDate ? formatDisplayDate(newDate) : 'Select Saturday'}
                </Text>
              </TouchableOpacity>
            </View>

            {!!errorText && (
              <Text style={styles.modalErrorText}>{errorText}</Text>
            )}
          </View>

          {/* Action Button */}
          <View style={styles.modalActions}>
            <TouchableOpacity
              style={[
                styles.viewOrdersButton,
                (!newDate || !!errorText || isSubmitting) &&
                  styles.viewOrdersButtonDisabled,
              ]}
              onPress={handleSubmit}
              disabled={!newDate || !!errorText || isSubmitting}
            >
              <Text style={styles.viewOrdersButtonText}>
                {isSubmitting ? 'Updating...' : 'Submit'}
              </Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Saturday Picker Modal */}
        <SaturdayPickerModal
          visible={showSaturdayPicker}
          onClose={() => setShowSaturdayPicker(false)}
          onSelectDate={handleDateSelect}
          minDate={oldFlightDate}
        />
      </View>
    </Modal>
  );
};

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

  // Order details modal states
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [selectedFlightDate, setSelectedFlightDate] = useState(null);

  // Toast state
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (type, message) => {
    setToastType(type);
    setToastMessage(message);
    setToastVisible(true);
  };

  // Handle event card press
  const handleEventPress = (event, flightDate) => {
    setSelectedEvent(event);
    setSelectedFlightDate(flightDate);
    setShowOrderModal(true);
  };

  const handleOpenUpdateSchedule = (oldDateStr, oldDateDisplay) => {
    setUpdateOldFlightDate(oldDateStr);
    setUpdateOldFlightDateDisplay(oldDateDisplay);
    setShowUpdateScheduleModal(true);
  };

  const handleSubmitUpdateSchedule = async (oldDateStr, newDateStr) => {
    try {
      const result = await updateFlightDateForScheduleApi(oldDateStr, newDateStr);
      showToast(
        'success',
        result?.message ||
          `Updated ${result?.updatedCount || 0} orders from ${oldDateStr} to ${newDateStr}`
      );
      setShowUpdateScheduleModal(false);
      // Refresh schedule to reflect moved orders
      await fetchScheduleData();
    } catch (error) {
      showToast(
        'error',
        error.message || 'Failed to update schedule. Please try again.'
      );
    }
  };

  // Update Schedule modal state
  const [showUpdateScheduleModal, setShowUpdateScheduleModal] = useState(false);
  const [updateOldFlightDate, setUpdateOldFlightDate] = useState(null); // YYYY-MM-DD
  const [updateOldFlightDateDisplay, setUpdateOldFlightDateDisplay] = useState(null); // formatted

  // Optimistically update a single flight date status in local state
  const handleFlightDateStatusUpdate = (flightDateStr, isActive, inactiveNote = '') => {
    setScheduleData(prevData =>
      prevData.map(dayData => {
        if (!dayData.date) return dayData;

        const dayDateKey = new Date(dayData.date).toISOString().split('T')[0];
        if (dayDateKey !== flightDateStr) {
          return dayData;
        }

        const updatedEvents = (dayData.events || []).map(event => ({
          ...event,
          status: isActive ? 'active' : 'inactive',
          isActive,
          inactiveNote: isActive ? '' : inactiveNote,
        }));

        return {
          ...dayData,
          events: updatedEvents,
        };
      })
    );
  };

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

      {/* Filter Section - Hidden for now */}
      {/* <View style={styles.filterContainer}>
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
      </View> */}

      {/* Loading State - Skeleton */}
      {loading && !error && (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
        >
          {[1, 2, 3, 4].map((key) => (
            <SkeletonDaySchedule key={key} />
          ))}
        </ScrollView>
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
                onEventPress={handleEventPress}
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

      {/* Order Details Modal */}
      <OrderDetailsModal
        visible={showOrderModal}
        onClose={() => setShowOrderModal(false)}
        event={selectedEvent}
        flightDate={selectedFlightDate}
        onStatusUpdate={handleFlightDateStatusUpdate}
        onShowToast={showToast}
        onOpenUpdateSchedule={handleOpenUpdateSchedule}
      />

      {/* Update Schedule Modal */}
      <UpdateScheduleModal
        visible={showUpdateScheduleModal}
        onClose={() => setShowUpdateScheduleModal(false)}
        oldFlightDate={updateOldFlightDate}
        oldFlightDateDisplay={updateOldFlightDateDisplay}
        onSubmit={handleSubmitUpdateSchedule}
      />

      {/* Toast Notification */}
      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        onHide={() => setToastVisible(false)}
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
  dayYear: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 18,
    color: '#9CA3AF',
    marginTop: 2,
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
  // Skeleton styles
  skeletonDayContainer: {
    opacity: 0.8,
  },
  skeletonCard: {
    backgroundColor: '#F3F4F6',
  },
  skeletonRectSmall: {
    width: 80,
    height: 14,
    borderRadius: 7,
    backgroundColor: '#E5E7EB',
    marginLeft: 8,
  },
  skeletonRectLarge: {
    width: '80%',
    height: 18,
    borderRadius: 9,
    backgroundColor: '#E5E7EB',
    marginTop: 12,
  },
  skeletonCircle: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#E5E7EB',
  },
  skeletonStatusRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  skeletonStatusDot: {
    backgroundColor: '#D1D5DB',
  },
  modalHint: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#9CA3AF',
    marginBottom: 4,
  },
  modalTextInputWrapper: {
    minWidth: 120,
    paddingVertical: 6,
  },
  modalTextInput: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
  },
  modalErrorText: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#E7522F',
    marginTop: 4,
    textAlign: 'right',
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#F5F6F6',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    minWidth: 150,
  },
  datePickerButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
  },
  datePickerPlaceholder: {
    color: '#9CA3AF',
    fontWeight: '500',
  },
  // Note styles
  noteDisplayContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#FEF3F2',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E7522F',
  },
  noteLabel: {
    fontFamily: 'Inter',
    fontSize: 12,
    fontWeight: '600',
    color: '#E7522F',
    marginBottom: 4,
  },
  noteText: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
  },
  noteInputContainer: {
    marginTop: 12,
    padding: 12,
    backgroundColor: '#F5F6F6',
    borderRadius: 8,
  },
  noteInputLabel: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#393D40',
    marginBottom: 8,
  },
  noteInput: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    color: '#202325',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    padding: 12,
    minHeight: 80,
    marginBottom: 12,
  },
  noteButtonsContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  noteCancelButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#F2F7F3',
    borderRadius: 8,
    minHeight: 40,
  },
  noteCancelButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#647276',
  },
  noteSaveButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 10,
    backgroundColor: '#E7522F',
    borderRadius: 8,
    minHeight: 40,
  },
  noteSaveButtonText: {
    fontFamily: 'Inter',
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  eventNoteContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
  },
  eventNoteLabel: {
    fontFamily: 'Inter',
    fontSize: 11,
    fontWeight: '600',
    marginBottom: 2,
    opacity: 0.8,
  },
  eventNoteText: {
    fontFamily: 'Inter',
    fontSize: 12,
    lineHeight: 16,
    opacity: 0.9,
  },
  // Order Details Modal Styles
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    minHeight: 320,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 12,
    elevation: 8,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  modalHeaderRounded: {
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
  },
  modalTitle: {
    fontFamily: 'Inter',
    fontSize: 18,
    fontWeight: '700',
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  closeButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalBody: {
    paddingHorizontal: 24,
    paddingVertical: 8,
    gap: 8,
  },
  modalRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 32,
  },
  modalRowToggle: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
  },
  modalLabel: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '500',
    lineHeight: 22,
    color: '#647276',
  },
  modalValue: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 22,
    color: '#202325',
  },
  countryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  toggleText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '700',
    lineHeight: 22,
    color: '#E7522F',
  },
  toggleTextActive: {
    color: '#539461',
  },
  toggleTextDisabled: {
    color: '#9CA3AF',
    opacity: 0.6,
  },
  switchWrapper: {
    // Wrapper for Switch to apply disabled styling
  },
  switchWrapperDisabled: {
    opacity: 0.5,
  },
  modalActions: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 0,
  },
  viewOrdersButton: {
    backgroundColor: '#539461',
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 24,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewOrdersButtonDisabled: {
    backgroundColor: '#C0DAC2',
  },
  viewOrdersButtonText: {
    fontFamily: 'Inter',
    fontSize: 16,
    fontWeight: '600',
    lineHeight: 16,
    color: '#FFFFFF',
  },
  homeIndicator: {
    width: '100%',
    height: 34,
    backgroundColor: '#FFFFFF',
    justifyContent: 'center',
    alignItems: 'center',
  },
  gestureBar: {
    width: 148,
    height: 5,
    backgroundColor: '#202325',
    borderRadius: 100,
  },
});

export default Schedule;
