import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
  SafeAreaView,
  Platform,
  KeyboardAvoidingView,
  TouchableWithoutFeedback,
  Keyboard,
  Modal,
  ActivityIndicator,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import Svg, { Path } from 'react-native-svg';
import { getBuyerOrdersApi, submitFlightChangeRequestApi, getFlightChangeRequestsApi } from '../../../components/Api/orderManagementApi';
import { getActiveFlightDatesApi } from '../../../components/Api/getActiveFlightDatesApi';

// Dropdown Icon Component
const DropdownIcon = () => (
  <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
    <Path
      d="M4 6L8 10L12 6"
      stroke="#202325"
      strokeWidth={1.5}
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const AddRequestChangePlantFlightScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [selectedFlight, setSelectedFlight] = useState(null);
  const [newFlightDate, setNewFlightDate] = useState('');
  const [reason, setReason] = useState('');
  const [showFlightPicker, setShowFlightPicker] = useState(false);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [flightOptions, setFlightOptions] = useState([]);
  const [loadingFlights, setLoadingFlights] = useState(false);
  const [calendarMonth, setCalendarMonth] = useState(new Date());
  const [submitting, setSubmitting] = useState(false);
  const [showNoticeModal, setShowNoticeModal] = useState(false);
  const [activeFlightDates, setActiveFlightDates] = useState([]);
  const [loadingActiveDates, setLoadingActiveDates] = useState(false);

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      return dateString;
    }
  };

  // Calendar rendering functions
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

  const renderCalendarDays = () => {
    const daysInMonth = getDaysInMonth(calendarMonth);
    const firstDay = getFirstDayOfMonth(calendarMonth);
    const days = [];
    const allowedDates = getAllowedDates();

    // Empty cells for days before the first day of the month
    for (let i = 0; i < firstDay; i++) {
      days.push(
        <View key={`empty-${i}`} style={styles.calendarDayCell}>
          <Text style={styles.calendarEmptyDay}></Text>
        </View>
      );
    }

    // Days of the month
    for (let day = 1; day <= daysInMonth; day++) {
      const date = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth(), day);
      const isSaturday = date.getDay() === 6;
      const isAllowed = isDateAllowed(date);
      const isSelected = newFlightDate && 
        new Date(newFlightDate).toDateString() === date.toDateString();
      
      // A Saturday is shown but grayed out if it's not in the allowed dates list
      const isInactiveSaturday = isSaturday && !isAllowed && activeFlightDates.length > 0;

      days.push(
        <TouchableOpacity
          key={`day-${day}`}
          style={[
            styles.calendarDayCell,
            isSelected && styles.calendarSelectedDay,
            !isAllowed && styles.calendarDisabledDay,
            isInactiveSaturday && styles.calendarInactiveSaturday
          ]}
          onPress={() => {
            if (isAllowed) {
              const formattedDate = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              });
              setNewFlightDate(formattedDate);
              setShowDatePicker(false);
            }
          }}
          disabled={!isAllowed}
        >
          <Text style={[
            styles.calendarDayText,
            isSelected && styles.calendarSelectedDayText,
            !isAllowed && styles.calendarDisabledDayText,
            isInactiveSaturday && styles.calendarInactiveSaturdayText
          ]}>
            {day}
          </Text>
        </TouchableOpacity>
      );
    }

    // Group days into rows
    const rows = [];
    for (let i = 0; i < days.length; i += 7) {
      rows.push(
        <View key={`row-${i}`} style={styles.calendarRow}>
          {days.slice(i, i + 7)}
        </View>
      );
    }

    return rows;
  };

  // Load flight dates from user's orders
  useEffect(() => {
    loadFlightDates();
  }, []);

  const loadFlightDates = async () => {
    setLoadingFlights(true);
    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        Alert.alert('Error', 'No internet connection.');
        setLoadingFlights(false);
        return;
      }

      // Fetch orders with flight dates (Ready to Fly status)
      const params = {
        status: 'Ready to Fly',
        includeDetails: true,
        limit: 200,
        offset: 0,
      };

      const response = await getBuyerOrdersApi(params);

      if (!response.success) {
        throw new Error(response.error || 'Failed to load orders');
      }

      // Fetch existing flight change requests to filter out flight dates that already have requests
      let existingRequests = [];
      try {
        const requestsResponse = await getFlightChangeRequestsApi({
          limit: 100,
          offset: 0
        });
        if (requestsResponse.success) {
          existingRequests = requestsResponse.data?.data?.requests || [];
        }
      } catch (error) {
        console.warn('Error fetching existing requests:', error);
        // Continue even if we can't fetch existing requests
      }

      // Create a set of flight dates that already have pending or approved requests
      const blockedFlightDates = new Set();
      existingRequests.forEach(request => {
        if (request.status === 'pending' || request.status === 'approved') {
          // Normalize the currentFlightDate for comparison
          let normalizedDate = null;
          if (request.currentFlightDateObj) {
            try {
              normalizedDate = new Date(request.currentFlightDateObj);
              if (!isNaN(normalizedDate.getTime())) {
                const dateKey = normalizedDate.toISOString().split('T')[0];
                blockedFlightDates.add(dateKey);
              }
            } catch (e) {
              // If currentFlightDateObj is not available, try parsing currentFlightDate string
              if (request.currentFlightDate) {
                try {
                  // Try to parse the formatted date string (e.g., "Dec 3, 2024")
                  const parsed = new Date(request.currentFlightDate);
                  if (!isNaN(parsed.getTime())) {
                    const dateKey = parsed.toISOString().split('T')[0];
                    blockedFlightDates.add(dateKey);
                  }
                } catch (e2) {
                  // If parsing fails, use the string as-is for comparison
                  blockedFlightDates.add(request.currentFlightDate);
                }
              }
            }
          } else if (request.currentFlightDate) {
            // Fallback: use the string directly
            try {
              const parsed = new Date(request.currentFlightDate);
              if (!isNaN(parsed.getTime())) {
                const dateKey = parsed.toISOString().split('T')[0];
                blockedFlightDates.add(dateKey);
              } else {
                blockedFlightDates.add(request.currentFlightDate);
              }
            } catch (e) {
              blockedFlightDates.add(request.currentFlightDate);
            }
          }
        }
      });

      // Extract and group orders by flight date
      const plantsData = response.data?.data?.plants || [];
      const flightMap = new Map();

      plantsData.forEach((plant) => {
        const orderMeta = plant.order || {};
        const transactionNumber = orderMeta.transactionNumber || orderMeta.id;
        const flightDate = orderMeta.flightDateFormatted || orderMeta.cargoDateFormatted;
        let flightDateObj = orderMeta.flightDate || orderMeta.cargoDate;
        
        // Skip orders that have already had their flight date changed
        if (orderMeta.flightDateChanged === true) {
          console.log(`Skipping order ${orderMeta.id || transactionNumber} - flight date already changed`);
          return;
        }

        // Normalize flightDateObj to a Date object for consistent grouping
        let normalizedDate = null;
        if (flightDateObj) {
          if (flightDateObj.toDate && typeof flightDateObj.toDate === 'function') {
            normalizedDate = flightDateObj.toDate();
          } else if (flightDateObj._seconds) {
            normalizedDate = new Date(flightDateObj._seconds * 1000);
          } else if (flightDateObj instanceof Date) {
            normalizedDate = flightDateObj;
          } else if (typeof flightDateObj === 'string') {
            normalizedDate = new Date(flightDateObj);
          }
        }

        if (flightDate && normalizedDate) {
          // Use ISO string of the date as the key for grouping (same date = same key)
          const dateKey = normalizedDate.toISOString().split('T')[0]; // Use just the date part (YYYY-MM-DD)
          
          // Skip this flight date if it already has a pending or approved request
          if (blockedFlightDates.has(dateKey)) {
            console.log(`Skipping flight date ${dateKey} - already has a pending/approved request`);
            return;
          }
          
          if (!flightMap.has(dateKey)) {
            flightMap.set(dateKey, {
              flightDate,
              flightDateObj: normalizedDate,
              transactionNumbers: [],
              orderIds: [],
            });
          }
          
          // Add transaction number and order ID to the group
          const flightGroup = flightMap.get(dateKey);
          if (transactionNumber && !flightGroup.transactionNumbers.includes(transactionNumber)) {
            flightGroup.transactionNumbers.push(transactionNumber);
          }
          if (orderMeta.id && !flightGroup.orderIds.includes(orderMeta.id)) {
            flightGroup.orderIds.push(orderMeta.id);
          }
        }
      });

      // Convert map to array and sort by flight date
      const flights = Array.from(flightMap.values()).sort((a, b) => {
        const dateA = a.flightDateObj || new Date(0);
        const dateB = b.flightDateObj || new Date(0);
        return dateA - dateB;
      });

      setFlightOptions(flights);
    } catch (error) {
      console.error('Error loading flight dates:', error);
      Alert.alert(
        'Error',
        'Failed to load flight dates. Please try again later.',
        [{ text: 'OK' }]
      );
    } finally {
      setLoadingFlights(false);
    }
  };

  // Fetch active flight dates from API when a flight is selected
  const fetchActiveFlightDates = async (currentFlightDateObj) => {
    if (!currentFlightDateObj) {
      console.log('⚠️ No flight date provided, skipping active dates fetch');
      return;
    }

    try {
      setLoadingActiveDates(true);
      
      const currentFlightDate = new Date(currentFlightDateObj);
      
      // Add 1 week to current flight date
      const oneWeekLater = new Date(currentFlightDate);
      oneWeekLater.setDate(oneWeekLater.getDate() + 7);
      
      // Find the next Saturday (including oneWeekLater if it's already a Saturday)
      const dayOfWeek = oneWeekLater.getDay(); // 0 = Sunday, 6 = Saturday
      let daysUntilSaturday;
      
      if (dayOfWeek === 6) {
        // If oneWeekLater is already a Saturday, use it
        daysUntilSaturday = 0;
      } else {
        // Find days until the next Saturday
        daysUntilSaturday = 6 - dayOfWeek;
      }
      
      // First selectable Saturday
      const firstSaturday = new Date(oneWeekLater);
      firstSaturday.setDate(oneWeekLater.getDate() + daysUntilSaturday);
      
      // Format as YYYY-MM-DD for API
      const year = firstSaturday.getFullYear();
      const month = String(firstSaturday.getMonth() + 1).padStart(2, '0');
      const day = String(firstSaturday.getDate()).padStart(2, '0');
      const startDateISO = `${year}-${month}-${day}`;
      
      console.log('📅 Fetching active flight dates starting from:', startDateISO);
      
      // Call API to get active flight dates
      const response = await getActiveFlightDatesApi(startDateISO, 3);
      
      if (response.success && response.data?.activeDates) {
        const activeDates = response.data.activeDates;
        console.log('✅ Received active flight dates:', activeDates);
        
        // Convert ISO dates to Date objects for comparison
        const activeDateObjects = activeDates.map(dateObj => {
          const [y, m, d] = dateObj.iso.split('-').map(Number);
          return new Date(y, m - 1, d);
        });
        
        setActiveFlightDates(activeDateObjects);
      } else {
        console.error('❌ API returned no active dates');
        setActiveFlightDates([]);
      }
    } catch (error) {
      console.error('❌ Error fetching active flight dates:', error);
      // On error, fallback to showing all Saturdays (old behavior)
      setActiveFlightDates([]);
    } finally {
      setLoadingActiveDates(false);
    }
  };

  // Calculate allowed dates from active flight dates
  const getAllowedDates = () => {
    return activeFlightDates;
  };

  const isDateAllowed = (date) => {
    const allowedDates = getAllowedDates();
    return allowedDates.some(allowedDate => {
      return date.toDateString() === allowedDate.toDateString();
    });
  };

  const handleDatePicker = () => {
    if (!selectedFlight) {
      Alert.alert('Error', 'Please select a flight date first');
      return;
    }
    
    if (loadingActiveDates) {
      Alert.alert('Please Wait', 'Loading available flight dates...');
      return;
    }
    
    const allowedDates = getAllowedDates();
    
    if (allowedDates.length === 0) {
      Alert.alert(
        'No Available Dates',
        'No active flight dates are available within the next year. Please contact support for assistance.',
        [{ text: 'OK' }]
      );
      return;
    }
    
    // Set calendar month to show the first allowed date
    if (allowedDates.length > 0) {
      const firstDate = allowedDates[0];
      setCalendarMonth(new Date(firstDate.getFullYear(), firstDate.getMonth(), 1));
    }
    
    setShowDatePicker(true);
  };

  const handleSubmit = async () => {
    if (!selectedFlight) {
      Alert.alert('Error', 'Please select a flight date');
      return;
    }
    
    if (!newFlightDate.trim()) {
      Alert.alert('Error', 'Please select a new flight date');
      return;
    }
    
    if (!reason.trim()) {
      Alert.alert('Error', 'Please provide a reason for the change');
      return;
    }
    
    setSubmitting(true);
    
    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        Alert.alert('Error', 'No internet connection. Please check your connection and try again.');
        setSubmitting(false);
        return;
      }

      // Check if there's already a request for this flight date
      const existingRequestsResponse = await getFlightChangeRequestsApi({
        limit: 100,
        offset: 0
      });

      if (existingRequestsResponse.success) {
        const existingRequests = existingRequestsResponse.data?.data?.requests || [];
        const hasExistingRequest = existingRequests.some(request => {
          // Check if there's a pending or approved request for the same current flight date
          return request.currentFlightDate === selectedFlight.flightDate &&
                 (request.status === 'pending' || request.status === 'approved');
        });

        if (hasExistingRequest) {
          Alert.alert(
            'Request Already Exists',
            'You already have a pending or approved request for this flight date. Please wait for it to be processed before submitting a new request.',
            [{ text: 'OK' }]
          );
          setSubmitting(false);
          return;
        }
      }

      // Convert newFlightDate string to Date object for the API
      const newFlightDateObj = new Date(newFlightDate);
      
      const response = await submitFlightChangeRequestApi({
        transactionNumbers: selectedFlight.transactionNumbers,
        orderIds: selectedFlight.orderIds,
        currentFlightDate: selectedFlight.flightDate,
        currentFlightDateObj: selectedFlight.flightDateObj,
        newFlightDate: newFlightDate,
        reason: reason.trim(),
      });
      
      if (!response.success) {
        throw new Error(response.error || 'Failed to submit request');
      }
      
      Alert.alert(
        'Request Submitted',
        'Your request to change plant flight has been submitted successfully. We will review your request and get back to you soon.',
        [
          {
            text: 'OK',
            onPress: () => {
              navigation.goBack();
            },
          },
        ]
      );
    } catch (error) {
      // Check if error is about orders already changed
      if (error.message && error.message.includes('already had their flight date changed')) {
        console.warn('Flight change request blocked - orders already changed:', error.message);
        setShowNoticeModal(true);
      } else {
        console.error('Error submitting request:', error);
        Alert.alert(
          'Error',
          error.message || 'Failed to submit your request. Please try again later.',
          [{ text: 'OK' }]
        );
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#FFFFFF'}} edges={Platform.OS === 'android' ? ['top'] : []}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{flex: 1}}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        <TouchableWithoutFeedback onPress={Keyboard.dismiss} accessible={false}>
          <View style={{flex: 1}}>
            <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

            {/* Header */}
            <View style={[styles.header, {paddingTop: Platform.OS === 'android' ? Math.max(insets.top + 10, 16) : 16}]}>
              <TouchableOpacity
                onPress={() => navigation.goBack()}
                style={styles.backButton}>
                <LeftIcon width={24} height={24} fill="#393D40" />
              </TouchableOpacity>
              <Text style={styles.headerTitle}>Add Flight Change Request</Text>
              <View style={styles.headerSpacer} />
            </View>

            {/* Content */}
            <ScrollView 
              style={styles.content} 
              contentContainerStyle={{paddingBottom: Math.max(insets.bottom, 20) + 40}}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps='handled'
              keyboardDismissMode='on-drag'
            >
              {/* Form */}
              <View style={styles.form}>
                {/* Flight Date Selection */}
                <View style={styles.inputSection}>
                  <View style={styles.inputField}>
                    <Text style={styles.inputLabel}>
                      Select Flight Date <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    {loadingFlights ? (
                      <View style={styles.loadingContainer}>
                        <ActivityIndicator size="small" color="#539461" />
                        <Text style={styles.loadingText}>Loading flight dates...</Text>
                      </View>
                    ) : (
                    <TouchableOpacity 
                      style={[
                        styles.selectField,
                        (flightOptions.length === 0 || submitting) && styles.selectButtonDisabled
                      ]}
                      onPress={() => setShowFlightPicker(true)}
                      disabled={flightOptions.length === 0 || submitting}
                    >
                      <Text style={[
                        styles.selectText, 
                        !selectedFlight && styles.placeholderText,
                        (flightOptions.length === 0 || submitting) && styles.disabledText
                      ]}>
                        {selectedFlight 
                          ? `${selectedFlight.flightDate}${selectedFlight.transactionNumbers.length > 1 ? ` (${selectedFlight.transactionNumbers.length} transactions)` : ''}`
                          : flightOptions.length === 0 
                            ? 'No flight dates available'
                            : 'Select a flight date'}
                      </Text>
                      <DropdownIcon />
                    </TouchableOpacity>
                    )}
                  </View>
                </View>

                {/* New Flight Date */}
                <View style={styles.inputSection}>
                  <View style={styles.inputField}>
                    <Text style={styles.inputLabel}>
                      New Flight Date <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <TouchableOpacity 
                      style={[
                        styles.selectField,
                        (!selectedFlight || submitting) && styles.selectButtonDisabled
                      ]}
                      onPress={handleDatePicker}
                      disabled={!selectedFlight || submitting}
                    >
                      <Text style={[
                        styles.selectText, 
                        !newFlightDate && styles.placeholderText,
                        (!selectedFlight || submitting) && styles.disabledText
                      ]}>
                        {!selectedFlight 
                          ? 'Select a flight date first'
                          : newFlightDate || 'Select new flight date'}
                      </Text>
                      <DropdownIcon />
                    </TouchableOpacity>
                  </View>
                </View>

                {/* Reason */}
                <View style={styles.inputSection}>
                  <View style={styles.inputField}>
                    <Text style={styles.inputLabel}>
                      Reason for Change <Text style={styles.requiredAsterisk}>*</Text>
                    </Text>
                    <View style={styles.textField}>
                      <TextInput
                        style={styles.textInput}
                        value={reason}
                        onChangeText={setReason}
                        placeholder="Please provide a reason for changing the flight date"
                        placeholderTextColor="#888888"
                        multiline
                        textAlignVertical="top"
                        editable={!submitting}
                      />
                    </View>
                  </View>
                </View>

                {/* Info Note */}
                <View style={styles.infoSection}>
                  <Text style={styles.infoText}>
                    Note: Your request will be reviewed by our team. We will notify you once your request has been processed.
                  </Text>
                </View>

                {/* Action Button */}
                <View style={styles.actionSection}>
                  <TouchableOpacity 
                    style={[
                      styles.submitButton,
                      submitting && styles.submitButtonDisabled
                    ]} 
                    onPress={handleSubmit}
                    disabled={submitting}
                  >
                    <View style={styles.buttonTextContainer}>
                      {submitting ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.buttonText}>
                          Submit Request
                        </Text>
                      )}
                    </View>
                  </TouchableOpacity>
                </View>
              </View>
            </ScrollView>

            {/* New Flight Date Calendar Modal */}
            <Modal 
              visible={showDatePicker} 
              transparent 
              animationType="slide"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.calendarModalContent}>
                  <View style={styles.calendarHeader}>
                    <Text style={styles.calendarTitle}>Select New Flight Date</Text>
                    <TouchableOpacity 
                      onPress={() => setShowDatePicker(false)}
                      style={styles.closeButton}
                    >
                      <Text style={styles.closeButtonText}>✕</Text>
                    </TouchableOpacity>
                  </View>
                  
                  {selectedFlight && (
                    <View style={styles.calendarInfo}>
                      <Text style={styles.calendarInfoText}>
                        Current Flight Date: {selectedFlight.flightDate}
                      </Text>
                      <Text style={styles.calendarInfoSubtext}>
                        You can only select the 3 Saturdays after 1 week from the current flight date
                      </Text>
                    </View>
                  )}

                  <View style={styles.calendarContainer}>
                    {/* Calendar Navigation */}
                    <View style={styles.calendarNav}>
                      <TouchableOpacity 
                        onPress={() => {
                          setCalendarMonth(prevMonth => {
                            const newMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() - 1, 1);
                            return newMonth;
                          });
                        }}
                        style={styles.calendarNavButton}
                      >
                        <Text style={styles.calendarNavText}>‹</Text>
                      </TouchableOpacity>
                      <Text style={styles.calendarMonthText}>
                        {calendarMonth.toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}
                      </Text>
                      <TouchableOpacity 
                        onPress={() => {
                          setCalendarMonth(prevMonth => {
                            const newMonth = new Date(prevMonth.getFullYear(), prevMonth.getMonth() + 1, 1);
                            return newMonth;
                          });
                        }}
                        style={styles.calendarNavButton}
                      >
                        <Text style={styles.calendarNavText}>›</Text>
                      </TouchableOpacity>
                    </View>

                    {/* Calendar Grid */}
                    <View style={styles.calendarGrid}>
                      {/* Day headers */}
                      <View style={styles.calendarRow}>
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                          <View key={day} style={styles.calendarDayHeader}>
                            <Text style={styles.calendarDayHeaderText}>{day}</Text>
                          </View>
                        ))}
                      </View>

                      {/* Calendar days */}
                      {renderCalendarDays()}
                    </View>
                  </View>
                </View>
              </View>
            </Modal>

            {/* Flight Date Picker Modal */}
            <Modal 
              visible={showFlightPicker} 
              transparent 
              animationType="slide"
              onRequestClose={() => setShowFlightPicker(false)}
            >
              <View style={styles.modalOverlay}>
                <View style={styles.modalContent}>
                  <Text style={styles.modalTitle}>Select Flight Date</Text>
                  {flightOptions.length === 0 ? (
                    <View style={styles.emptyModalContainer}>
                      <Text style={styles.emptyModalText}>
                        No flight dates available. You need to have orders with "Ready to Fly" status.
                      </Text>
                    </View>
                  ) : (
                    <ScrollView style={styles.modalScrollView} showsVerticalScrollIndicator={true}>
                      {flightOptions.map((flight, index) => (
                        <TouchableOpacity
                          key={`${flight.flightDate}_${index}`}
                          style={styles.flightOption}
                          onPress={() => {
                            setSelectedFlight(flight);
                            setShowFlightPicker(false);
                            // Fetch active flight dates for the selected flight
                            fetchActiveFlightDates(flight.flightDateObj);
                          }}
                        >
                          <View style={styles.flightInfo}>
                            <Text style={styles.flightDateText}>{flight.flightDate}</Text>
                            <Text style={styles.transactionText}>
                              {flight.transactionNumbers.length === 1 
                                ? `Transaction: ${flight.transactionNumbers[0]}`
                                : `${flight.transactionNumbers.length} transactions`}
                            </Text>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </ScrollView>
                  )}
                  <TouchableOpacity 
                    style={styles.cancelButton}
                    onPress={() => setShowFlightPicker(false)}
                  >
                    <Text style={styles.cancelText}>Cancel</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </Modal>
            
            {/* Notice Modal for Orders Already Changed */}
            <Modal
              visible={showNoticeModal}
              transparent={true}
              animationType="fade"
              onRequestClose={() => setShowNoticeModal(false)}>
              <TouchableOpacity
                style={styles.modalOverlay}
                activeOpacity={1}
                onPress={() => setShowNoticeModal(false)}>
                <TouchableOpacity
                  style={styles.noticeModalContent}
                  activeOpacity={1}
                  onPress={(e) => e.stopPropagation()}>
                  <Text style={styles.noticeModalTitle}>Notice</Text>
                  <Text style={styles.noticeModalMessage}>
                    Each order flight date can only be changed once. These orders have already had their flight date changed and cannot be modified again.
                  </Text>
                  <TouchableOpacity
                    style={styles.noticeModalButton}
                    onPress={() => setShowNoticeModal(false)}
                    activeOpacity={0.7}>
                    <Text style={styles.noticeModalButtonText}>Understood</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          </View>
        </TouchableWithoutFeedback>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingBottom: 12,
    paddingHorizontal: 12,
    backgroundColor: '#FFFFFF',
    width: '100%',
  },
  backButton: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#202325',
    flex: 1,
  },
  headerSpacer: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingBottom: 34,
  },
  form: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'flex-start', 
    padding: 0,
    width: 375,
    minWidth: 375,
    maxWidth: 375,
    alignSelf: 'center', 
    flexGrow: 0,
  },
  inputSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 16,
    width: 375,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  inputField: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: 327,
    alignSelf: 'stretch',
  },
  inputLabel: {
    width: 327,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    alignSelf: 'stretch',
  },
  requiredAsterisk: {
    color: '#E53E3E',
  },
  selectField: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    width: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#647276',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  selectText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 1,
  },
  placeholderText: {
    color: '#888888',
  },
  disabledText: {
    color: '#C4C4C4',
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    gap: 8,
  },
  loadingText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
  },
  textField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    width: 327,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#647276',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  textInput: {
    width: 295,
    minHeight: 100,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 1,
    paddingVertical: 0,
  },
  infoSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
    width: 375,
    alignSelf: 'stretch',
  },
  infoText: {
    width: 327,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
    alignSelf: 'stretch',
  },
  actionSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingRight: 24,
    paddingBottom: 12,
    paddingLeft: 24,
    gap: 12,
    width: 375,
    alignSelf: 'stretch',
    flexGrow: 0,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  submitButtonDisabled: {
    backgroundColor: '#C4C4C4',
    opacity: 0.6,
  },
  buttonTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    height: 16,
  },
  buttonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    alignItems: 'center',
    display: 'flex',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: 'white',
    borderRadius: 12,
    padding: 20,
    margin: 20,
    minWidth: 280,
    maxWidth: '90%',
    maxHeight: '80%',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    textAlign: 'center',
    marginBottom: 20,
    color: '#202325',
    fontFamily: 'Inter',
  },
  modalScrollView: {
    maxHeight: 400,
  },
  emptyModalContainer: {
    paddingVertical: 20,
    paddingHorizontal: 16,
  },
  emptyModalText: {
    fontSize: 14,
    color: '#647276',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  flightOption: {
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  flightInfo: {
    flexDirection: 'column',
    gap: 6,
  },
  flightDateText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    fontFamily: 'Inter',
  },
  transactionText: {
    fontSize: 14,
    color: '#647276',
    fontFamily: 'Inter',
  },
  cancelButton: {
    marginTop: 16,
    paddingVertical: 12,
    alignItems: 'center',
    backgroundColor: '#E4E7E9',
    borderRadius: 8,
  },
  cancelText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    fontFamily: 'Inter',
  },
  // Notice Modal Styles
  noticeModalContent: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 24,
    margin: 20,
    width: '90%',
    maxWidth: 400,
    alignItems: 'center',
  },
  noticeModalTitle: {
    fontSize: 20,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: 16,
    color: '#202325',
    fontFamily: 'Inter',
  },
  noticeModalMessage: {
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    marginBottom: 24,
    color: '#393D40',
    fontFamily: 'Inter',
  },
  noticeModalButton: {
    backgroundColor: '#539461',
    paddingVertical: 12,
    paddingHorizontal: 32,
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  noticeModalButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  // Calendar Modal Styles
  calendarModalContent: {
    backgroundColor: 'white',
    borderRadius: 16,
    padding: 20,
    margin: 20,
    maxWidth: '90%',
    maxHeight: '90%',
    alignSelf: 'center',
  },
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202325',
    fontFamily: 'Inter',
  },
  closeButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 24,
    color: '#647276',
    fontFamily: 'Inter',
  },
  calendarInfo: {
    backgroundColor: '#F2F7F3',
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
  },
  calendarInfoText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202325',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  calendarInfoSubtext: {
    fontSize: 12,
    color: '#647276',
    fontFamily: 'Inter',
  },
  calendarContainer: {
    marginTop: 8,
  },
  calendarNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  calendarNavButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#F2F7F3',
  },
  calendarNavText: {
    fontSize: 20,
    color: '#202325',
    fontFamily: 'Inter',
  },
  calendarMonthText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    fontFamily: 'Inter',
  },
  calendarGrid: {
    width: '100%',
  },
  calendarRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  calendarDayHeader: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 8,
  },
  calendarDayHeaderText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#647276',
    fontFamily: 'Inter',
  },
  calendarDayCell: {
    flex: 1,
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    margin: 2,
    borderRadius: 8,
  },
  calendarDayText: {
    fontSize: 14,
    color: '#202325',
    fontFamily: 'Inter',
  },
  calendarSelectedDay: {
    backgroundColor: '#539461',
  },
  calendarSelectedDayText: {
    color: '#FFFFFF',
    fontWeight: '600',
  },
  calendarDisabledDay: {
    opacity: 0.3,
  },
  calendarDisabledDayText: {
    color: '#C4C4C4',
  },
  calendarInactiveSaturday: {
    backgroundColor: '#F5F5F5',
    opacity: 0.6,
  },
  calendarInactiveSaturdayText: {
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  calendarEmptyDay: {
    fontSize: 14,
  },
  selectButtonDisabled: {
    opacity: 0.5,
  },
});

export default AddRequestChangePlantFlightScreen;
