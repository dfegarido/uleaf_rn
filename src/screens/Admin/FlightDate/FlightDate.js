import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import { getAdminFlightChangeRequestsApi } from '../../../components/Api/adminOrderApi';
import NetInfo from '@react-native-community/netinfo';

// Helper function to parse flight date from order
const parseFlightDate = (flightDate) => {
  if (!flightDate) return null;
  
  try {
    let date = null;
    if (flightDate?.toDate && typeof flightDate.toDate === 'function') {
      date = flightDate.toDate();
    } else if (flightDate?._seconds) {
      date = new Date(flightDate._seconds * 1000);
    } else if (flightDate instanceof Date) {
      date = flightDate;
    } else if (typeof flightDate === 'string') {
      date = new Date(flightDate);
    } else if (typeof flightDate === 'number') {
      date = flightDate < 1e12 ? new Date(flightDate * 1000) : new Date(flightDate);
    }
    
    if (date && !isNaN(date.getTime())) {
      return date;
    }
  } catch (e) {
    console.warn('Failed to parse flightDate:', e);
  }
  return null;
};

// Helper function to format date to YYYY-MM-DD
const formatDateKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

// Helper function to get day name abbreviation
const getDayName = (date) => {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[date.getDay()];
};

// Helper function to get month abbreviation
const getMonthName = (date) => {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return months[date.getMonth()];
};

// Helper function to get full month name
const getFullMonthName = (date) => {
  const months = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
  return months[date.getMonth()];
};

// Helper function to get month key for grouping (YYYY-MM)
const getMonthKey = (date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  return `${year}-${month}`;
};

// Helper function to generate dates from start to end
const generateDateRange = (startDate, endDate) => {
  const dates = [];
  const current = new Date(startDate);
  const end = new Date(endDate);
  
  while (current <= end) {
    dates.push(new Date(current));
    current.setDate(current.getDate() + 1);
  }
  
  return dates;
};

// Helper function to count unique transaction numbers
const countUniqueTransactions = (orders) => {
  if (!orders || orders.length === 0) return 0;
  const uniqueTransactions = new Set();
  orders.forEach(order => {
    const txNumber = order.transactionNumber || order.trxNumber;
    if (txNumber) {
      uniqueTransactions.add(txNumber);
    }
  });
  return uniqueTransactions.size;
};


// Helper function to determine event styling based on order data
const getEventStyling = (orders, dateKey, orderCount) => {
  const dateOrders = orders[dateKey] || [];
  if (dateOrders.length === 0 || orderCount === 0) {
    return null; // Return null if no orders
  }
  
  // Check if any order is cancelled
  const hasCancelled = dateOrders.some(order => 
    order.status === 'cancelled' || order.status === 'Cancelled'
  );
  
  if (hasCancelled) {
    return {
      status: 'Canceled',
      statusColor: '#E7522F',
      backgroundColor: '#FFFFFF',
      textColor: '#202325',
    };
  }
  
  // Determine background color based on some logic (you can customize this)
  const colors = ['#6B4EFF', '#48A7F8', '#539461', '#6B4EFF'];
  const colorIndex = orderCount % colors.length;
  const bgColor = colors[colorIndex];
  
  // Check if this is today's date (highlight it)
  const today = new Date();
  const isToday = formatDateKey(today) === dateKey;
  
  return {
    status: 'Active',
    statusColor: '#FFFFFF',
    backgroundColor: bgColor,
    textColor: '#FFFFFF',
    isHighlighted: isToday,
    highlightColor: isToday ? '#DFECDF' : undefined,
    borderColor: isToday ? '#539461' : undefined,
  };
};

// Mock data for schedule events (fallback)
const mockScheduleData = [
  {
    day: 15,
    dayName: 'Mon',
    events: [
      {
        id: 1,
        eventType: 'Plant Flight',
        status: 'Active',
        statusColor: '#23C16B',
        backgroundColor: '#FFFFFF',
        textColor: '#202325',
      },
    ],
  },
  {
    day: 16,
    dayName: 'Tue',
    events: [
      {
        id: 2,
        eventType: 'Plant Flight',
        status: 'Active',
        statusColor: '#23C16B',
        backgroundColor: '#FFFFFF',
        textColor: '#202325',
      },
    ],
  },
  {
    day: 17,
    dayName: 'Wed',
    events: [
      {
        id: 3,
        eventType: 'Plant Flight',
        status: 'Canceled',
        statusColor: '#E7522F',
        backgroundColor: '#FFFFFF',
        textColor: '#202325',
      },
    ],
  },
  {
    day: 18,
    dayName: 'Thu',
    events: [
      {
        id: 4,
        eventType: 'Plant Flight',
        status: 'Active',
        statusColor: '#FFFFFF',
        backgroundColor: '#6B4EFF',
        textColor: '#FFFFFF',
        isHighlighted: true,
        highlightColor: '#DFECDF',
        borderColor: '#539461',
      },
    ],
  },
  {
    day: 19,
    dayName: 'Fri',
    events: [
      {
        id: 5,
        eventType: 'Plant Flight',
        status: 'Active',
        statusColor: '#FFFFFF',
        backgroundColor: '#48A7F8',
        textColor: '#FFFFFF',
      },
    ],
  },
  {
    day: 20,
    dayName: 'Sat',
    events: [
      {
        id: 6,
        eventType: 'Plant Flight',
        status: 'Active',
        statusColor: '#FFFFFF',
        backgroundColor: '#539461',
        textColor: '#FFFFFF',
      },
    ],
  },
  {
    day: 21,
    dayName: 'Sun',
    events: [
      {
        id: 7,
        eventType: 'Plant Flight',
        status: 'Active',
        statusColor: '#FFFFFF',
        backgroundColor: '#6B4EFF',
        textColor: '#FFFFFF',
      },
    ],
  },
  {
    day: 22,
    dayName: 'Mon',
    events: [
      {
        id: 8,
        eventType: 'Plant Flight',
        status: 'Active',
        statusColor: '#FFFFFF',
        backgroundColor: '#539461',
        textColor: '#FFFFFF',
      },
    ],
  },
  {
    day: 23,
    dayName: 'Tue',
    events: [
      {
        id: 9,
        eventType: 'Plant Flight',
        status: 'Canceled',
        statusColor: '#E7522F',
        backgroundColor: '#FFFFFF',
        textColor: '#202325',
      },
    ],
  },
  {
    day: 24,
    dayName: 'Wed',
    events: [
      {
        id: 10,
        eventType: 'Plant Flight',
        status: 'Active',
        statusColor: '#FFFFFF',
        backgroundColor: '#6B4EFF',
        textColor: '#FFFFFF',
      },
    ],
  },
  {
    day: 25,
    dayName: 'Thu',
    events: [
      {
        id: 11,
        eventType: 'Plant Flight',
        status: 'Canceled',
        statusColor: '#E7522F',
        backgroundColor: '#FFFFFF',
        textColor: '#202325',
      },
    ],
  },
];


// Schedule Event Card Component
const ScheduleEventCard = ({ event }) => {
  return (
    <View
      style={[
        styles.eventCard,
        {
          backgroundColor: event.backgroundColor,
        },
      ]}>
      {/* Event Type Row */}
      <View style={styles.eventTypeRow}>
        <View style={{ flex: 1, flexDirection: 'column', gap: 2 }}>
          <Text
            style={[
              styles.eventTypeText,
              { color: event.textColor, opacity: event.textColor === '#202325' ? 0.5 : 1 },
            ]}>
            {event.eventType}
          </Text>
          {event.transactionCount > 0 && (
            <Text
              style={[
                styles.transactionCountText,
                { color: event.textColor, opacity: event.textColor === '#202325' ? 0.7 : 0.9 },
              ]}>
              {event.transactionCount} {event.transactionCount === 1 ? 'order' : 'orders'}
            </Text>
          )}
        </View>
      </View>

      {/* Status Row */}
      <View style={styles.statusRow}>
        <View style={styles.statusContainer}>
          <View
            style={[
              styles.statusDot,
              { backgroundColor: event.statusColor },
            ]}
          />
          <Text style={[styles.statusText, { color: event.statusColor }]}>
            {event.status}
          </Text>
        </View>
      </View>
    </View>
  );
};

// Skeleton Item Component
const SkeletonItem = ({ width, height = 20, style }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  
  useEffect(() => {
    const pulseTiming = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseTiming.start();
    
    return () => {
      pulseTiming.stop();
    };
  }, [pulseAnim]);
  
  return (
    <Animated.View 
      style={[{
        width,
        height,
        backgroundColor: '#E4E7E9',
        borderRadius: 4,
        opacity: pulseAnim,
      }, style]} 
    />
  );
};

// Flight Date Skeleton Component
const FlightDateSkeleton = () => {
  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}>
      {/* Month Header Skeleton */}
      <View style={styles.monthHeader}>
        <SkeletonItem width={150} height={24} />
      </View>
      
      {/* Date Row Skeletons */}
      {Array.from({ length: 5 }).map((_, index) => (
        <View key={index} style={styles.scheduleEvent}>
          {/* Day Column Skeleton */}
          <View style={styles.dayColumn}>
            <SkeletonItem width={40} height={32} style={{ marginBottom: 8 }} />
            <SkeletonItem width={40} height={22} />
          </View>
          
          {/* Event Card Skeleton */}
          <View style={styles.eventsList}>
            <View style={[styles.eventCard, { backgroundColor: '#FFFFFF' }]}>
              {/* Event Type Row Skeleton */}
              <View style={styles.eventTypeRow}>
                <SkeletonItem width={120} height={24} />
              </View>
              
              {/* Status Row Skeleton */}
              <View style={styles.statusRow}>
                <View style={styles.statusContainer}>
                  <SkeletonItem width={12} height={12} style={{ borderRadius: 6 }} />
                  <SkeletonItem width={50} height={20} style={{ marginLeft: 4 }} />
                </View>
              </View>
            </View>
          </View>
        </View>
      ))}
      
      {/* Another Month Header Skeleton */}
      <View style={styles.monthHeader}>
        <SkeletonItem width={150} height={24} />
      </View>
      
      {/* More Date Row Skeletons */}
      {Array.from({ length: 3 }).map((_, index) => (
        <View key={`second-${index}`} style={styles.scheduleEvent}>
          <View style={styles.dayColumn}>
            <SkeletonItem width={40} height={32} style={{ marginBottom: 8 }} />
            <SkeletonItem width={40} height={22} />
          </View>
          
          <View style={styles.eventsList}>
            <View style={[styles.eventCard, { backgroundColor: '#FFFFFF' }]}>
              <View style={styles.eventTypeRow}>
                <SkeletonItem width={120} height={24} />
              </View>
              
              <View style={styles.statusRow}>
                <View style={styles.statusContainer}>
                  <SkeletonItem width={12} height={12} style={{ borderRadius: 6 }} />
                  <SkeletonItem width={50} height={20} style={{ marginLeft: 4 }} />
                </View>
              </View>
            </View>
          </View>
        </View>
      ))}
    </ScrollView>
  );
};

// Month Header Component
const MonthHeader = ({ monthName, year }) => {
  return (
    <View style={styles.monthHeader}>
      <Text style={styles.monthHeaderText}>{monthName} {year}</Text>
    </View>
  );
};

// Schedule Day Component
const ScheduleDay = ({ day, dayName, events, date, orders, onPress }) => {
  const isHighlighted = events.some((e) => e.isHighlighted);
  
  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={onPress}
      style={[
        styles.scheduleEvent,
        isHighlighted && {
          backgroundColor: events[0]?.highlightColor || '#DFECDF',
          borderBottomWidth: 2,
          borderBottomColor: events[0]?.borderColor || '#539461',
        },
      ]}>
      {/* Day Column */}
      <View style={styles.dayColumn}>
        <Text
          style={[
            styles.dayNumber,
            isHighlighted && { color: '#539461' },
          ]}>
          {day}
        </Text>
        <Text
          style={[
            styles.dayName,
            isHighlighted && { color: '#539461' },
          ]}>
          {dayName}
        </Text>
      </View>

      {/* Events List */}
      <View style={styles.eventsList}>
        {events.map((event) => (
          <ScheduleEventCard key={event.id} event={event} />
        ))}
      </View>
    </TouchableOpacity>
  );
};

// Custom Header with Centered Title
const FlightDateHeader = ({ navigation }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <BackSolidIcon />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Flight Date</Text>
      <View style={styles.backButton} />
    </View>
  );
};

const FlightDate = ({ navigation }) => {
  const [scheduleData, setScheduleData] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [ordersByDate, setOrdersByDate] = useState({});

  useEffect(() => {
    fetchFlightDates();
  }, []);

  // Helper function to parse formatted date string (e.g., "Dec 3, 2024")
  const parseFormattedDate = (dateString) => {
    if (!dateString) return null;
    try {
      // Try using Date object first (for ISO strings)
      let date = new Date(dateString);
      if (!isNaN(date.getTime())) {
        return date;
      }
      
      // If that fails, try parsing the formatted string manually
      // Format: "Dec 3, 2024" or "December 3, 2024"
      const months = {
        'jan': 0, 'feb': 1, 'mar': 2, 'apr': 3, 'may': 4, 'jun': 5,
        'jul': 6, 'aug': 7, 'sep': 8, 'oct': 9, 'nov': 10, 'dec': 11
      };
      
      const parts = dateString.trim().split(/[\s,]+/).filter(p => p.length > 0);
      if (parts.length >= 3) {
        const monthName = parts[0].toLowerCase().substring(0, 3);
        const day = parseInt(parts[1], 10);
        const year = parseInt(parts[2], 10);
        
        if (months[monthName] !== undefined && !isNaN(day) && !isNaN(year) && year > 0) {
          date = new Date(year, months[monthName], day);
          if (!isNaN(date.getTime())) {
            // Verify the parsed date matches the input
            const parsedMonth = date.getMonth();
            const parsedDay = date.getDate();
            const parsedYear = date.getFullYear();
            if (parsedMonth === months[monthName] && parsedDay === day && parsedYear === year) {
              return date;
            }
          }
        }
      }
    } catch (e) {
      console.warn('Failed to parse formatted date:', dateString, e);
    }
    return null;
  };

  const fetchFlightDates = async () => {
    try {
      setLoading(true);
      setError(null);

      // Get today's date for filtering (set at the very beginning)
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      console.log('📅 Today date for filtering:', today.toISOString(), formatDateKey(today));

      // Fetch flight change requests to get dates with pending requests
      let flightChangeRequestsByDate = {};
      try {
        const netState = await NetInfo.fetch();
        if (netState.isConnected && netState.isInternetReachable) {
          const requestsResponse = await getAdminFlightChangeRequestsApi({
            limit: 1000,
            offset: 0
          });

          console.log(`📦 Fetched ${requestsResponse.data?.data?.requests?.length || 0} flight change requests from API`);

          if (requestsResponse.success && requestsResponse.data?.data?.requests) {
            // Group requests by currentFlightDate
            requestsResponse.data.data.requests.forEach((request) => {
              if (request.currentFlightDate) {
                // Try to use currentFlightDateObj first (more reliable)
                let date = null;
                if (request.currentFlightDateObj) {
                  try {
                    date = new Date(request.currentFlightDateObj);
                    if (isNaN(date.getTime())) {
                      date = null;
                    } else {
                      // Ensure it's a valid date
                      date.setHours(0, 0, 0, 0);
                    }
                  } catch (e) {
                    console.warn('Error parsing currentFlightDateObj:', request.currentFlightDateObj, e);
                    date = null;
                  }
                }
                
                // If currentFlightDateObj didn't work, parse the formatted string
                if (!date) {
                  date = parseFormattedDate(request.currentFlightDate);
                  if (date) {
                    date.setHours(0, 0, 0, 0);
                  }
                }
                
                if (date && !isNaN(date.getTime())) {
                  // Only include dates that are today or in the future
                  const isFutureOrToday = date.getTime() >= today.getTime();
                  if (isFutureOrToday) {
                    const dateKey = formatDateKey(date);
                    if (!flightChangeRequestsByDate[dateKey]) {
                      flightChangeRequestsByDate[dateKey] = [];
                    }
                    flightChangeRequestsByDate[dateKey].push(request);
                    console.log(`✅ Added flight change request for date: ${dateKey} (${request.currentFlightDate})`);
                  } else {
                    console.log(`⏭️ Skipped past date: ${formatDateKey(date)} (${request.currentFlightDate})`);
                  }
                } else {
                  console.warn('⚠️ Failed to parse date from request:', {
                    currentFlightDate: request.currentFlightDate,
                    currentFlightDateObj: request.currentFlightDateObj
                  });
                }
              }
            });
          }
        }
      } catch (err) {
        console.warn('Error fetching flight change requests:', err);
        // Continue even if requests fail
      }

      // Only use flight change requests data
      const validDateKeys = new Set(); // Track which dates actually have data
      const ordersByDateMap = {}; // Empty since we're not using orders

      // Add dates from flight change requests (only future dates or today)
      Object.keys(flightChangeRequestsByDate).forEach((dateKey) => {
        try {
          const [year, month, day] = dateKey.split('-').map(Number);
          const date = new Date(year, month - 1, day);
          date.setHours(0, 0, 0, 0);
          if (!isNaN(date.getTime()) && date >= today) {
            validDateKeys.add(dateKey); // Mark this date as having requests
          }
        } catch (e) {
          console.warn('Failed to parse dateKey:', dateKey);
        }
      });

      // Store empty orders by date (not using orders anymore)
      setOrdersByDate(ordersByDateMap);

      // Build schedule data ONLY from flight change requests
      const scheduleByMonth = {};
      
      // Only process dates that are in validDateKeys (have requests)
      const sortedDateKeys = Array.from(validDateKeys).sort();
      console.log(`📋 Processing ${sortedDateKeys.length} valid date keys from flight change requests:`, sortedDateKeys);
      console.log(`📅 Today is: ${today.toISOString()} (${formatDateKey(today)})`);
      
      if (sortedDateKeys.length > 0) {
        sortedDateKeys.forEach((dateKey) => {
          try {
            const [year, month, day] = dateKey.split('-').map(Number);
            const date = new Date(year, month - 1, day);
            date.setHours(0, 0, 0, 0);
            
            // Double check: ensure date is today or future
            if (date < today) {
              console.log(`❌ Final check: Skipping past date ${dateKey} (${date.toISOString()} < ${today.toISOString()})`);
              return; // Skip past dates
            }
            
            console.log(`✅ Processing date: ${dateKey} (${date.toISOString()})`);
            
            const monthKey = getMonthKey(date);
            const dayNum = date.getDate();
            const dayName = getDayName(date);
            const dateOrders = []; // No orders, only using flight change requests
            const dateRequests = flightChangeRequestsByDate[dateKey] || [];
            
            // Only show dates that have requests
            if (dateRequests.length === 0) {
              return; // Skip dates without requests
            }
            
            // Style for dates with requests
            const styling = {
              backgroundColor: '#FEF3C7', // Light yellow/orange for pending requests
              borderColor: '#F59E0B',
              borderWidth: 2,
            };

          if (!scheduleByMonth[monthKey]) {
            scheduleByMonth[monthKey] = {
              monthName: getFullMonthName(date),
              year: date.getFullYear(),
              dates: [],
            };
          }

            scheduleByMonth[monthKey].dates.push({
              day: dayNum,
              dayName,
              date: new Date(date),
              dateKey: dateKey, // Store dateKey for navigation
              orders: [], // No orders, only using flight change requests
              hasRequests: true, // All dates shown have requests
              requests: dateRequests, // Store requests for navigation
              events: [
                {
                  id: dateKey,
                  eventType: 'Flight Change Request',
                  transactionCount: dateRequests.length,
                  ...styling,
                },
              ],
            });
        } catch (e) {
          console.warn('Error processing date:', dateKey, e);
        }
      });

      // Convert to array format for rendering
      const schedule = Object.keys(scheduleByMonth)
        .sort()
        .map(monthKey => scheduleByMonth[monthKey]);

      setScheduleData(schedule);
      } else {
        // No flight change requests found, show empty schedule
        setScheduleData([]);
      }
    } catch (err) {
      console.error('Error fetching flight dates:', err);
      setError(err.message);
      // Fallback to mock data on error
      setScheduleData(mockScheduleData);
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <FlightDateHeader navigation={navigation} />
      
      {loading ? (
        <FlightDateSkeleton />
      ) : error ? (
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Error: {error}</Text>
          <TouchableOpacity onPress={fetchFlightDates} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}>
          {scheduleData.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No flight dates found</Text>
            </View>
          ) : (
            scheduleData.map((monthData, monthIndex) => (
              <View key={monthData.monthName + monthData.year}>
                <MonthHeader monthName={monthData.monthName} year={monthData.year} />
                {monthData.dates.map((schedule, index) => (
                  <ScheduleDay
                    key={schedule.events[0].id || `${monthIndex}-${index}`}
                    day={schedule.day}
                    dayName={schedule.dayName}
                    events={schedule.events}
                    date={schedule.date}
                    orders={schedule.orders || []}
                    onPress={() => {
                      navigation.navigate('FlightDateOrders', {
                        date: schedule.date instanceof Date ? schedule.date.toISOString() : schedule.date,
                        orders: schedule.orders || [],
                        requests: schedule.requests || [],
                      });
                    }}
                  />
                ))}
              </View>
            ))
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
};

export default FlightDate;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    height: 58,
  },
  backButton: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    textAlign: 'center',
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 20,
  },
  monthHeader: {
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  monthHeaderText: {
    fontSize: 20,
    fontWeight: '700',
    color: '#202325',
    fontFamily: 'Inter',
  },
  scheduleEvent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: '#F5F6F6',
  },
  dayColumn: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    width: 40,
    minHeight: 68,
  },
  dayNumber: {
    width: 40,
    height: 32,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 28,
    lineHeight: 32,
    color: '#7F8D91',
  },
  dayName: {
    width: 40,
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#7F8D91',
  },
  eventsList: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 6,
    flex: 1,
  },
  eventCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 12,
    paddingLeft: 14,
    paddingRight: 14,
    gap: 4,
    flex: 1,
    borderRadius: 12,
  },
  eventTypeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    height: 24,
  },
  eventTypeText: {
    flex: 1,
    height: 24,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    color: '#202325',
  },
  transactionCountText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 2,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    height: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    height: 20,
  },
  statusDot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    height: 20,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  errorText: {
    fontSize: 16,
    color: '#E7522F',
    marginBottom: 16,
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  retryButton: {
    backgroundColor: '#60B8FE',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#647276',
    fontFamily: 'Inter',
  },
});

