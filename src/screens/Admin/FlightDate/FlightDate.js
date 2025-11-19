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
import PhilippinesFlag from '../../../assets/buyer-icons/philippines-flag.svg';
import ThailandFlag from '../../../assets/buyer-icons/thailand-flag.svg';
import IndonesiaFlag from '../../../assets/buyer-icons/indonesia-flag.svg';
import { getAdminOrdersApi } from '../../../components/Api/adminOrderApi';

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

// Helper function to validate country code
const validateCountryCode = (code) => {
  if (!code) return null;
  
  // Valid country codes we support
  const validCodes = ['PH', 'TH', 'ID'];
  const upperCode = String(code).toUpperCase().trim();
  
  if (validCodes.includes(upperCode)) {
    return upperCode;
  }
  
  return null;
};

// Helper function to get origin country from orders
const getOriginCountry = (orders) => {
  if (!orders || orders.length === 0) return 'TH';
  
  // Try to get plantSourceCountry from orders - check multiple locations
  for (const order of orders) {
    // Check direct order fields first
    let country = order.plantSourceCountry || 
                  order.originCountry || 
                  order.country;
    
    if (country) {
      const validated = validateCountryCode(country);
      if (validated) return validated;
    }
    
    // Check in products array
    if (order.products && Array.isArray(order.products) && order.products.length > 0) {
      country = order.products[0]?.plantSourceCountry || 
                order.products[0]?.originCountry ||
                order.products[0]?.country;
      if (country) {
        const validated = validateCountryCode(country);
        if (validated) return validated;
      }
    }
    
    // Check in plantDetails if available
    if (order.plantDetails?.plantSourceCountry) {
      const validated = validateCountryCode(order.plantDetails.plantSourceCountry);
      if (validated) return validated;
    }
    
    // Check nested order object
    if (order.order?.plantSourceCountry) {
      const validated = validateCountryCode(order.order.plantSourceCountry);
      if (validated) return validated;
    }
  }
  
  return 'TH'; // Default to Thailand
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
      countryTextColor: '#556065',
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
    countryTextColor: '#FFFFFF',
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
        country: 'TH',
        status: 'Active',
        statusColor: '#23C16B',
        backgroundColor: '#FFFFFF',
        textColor: '#202325',
        countryTextColor: '#556065',
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
        country: 'TH',
        status: 'Active',
        statusColor: '#23C16B',
        backgroundColor: '#FFFFFF',
        textColor: '#202325',
        countryTextColor: '#556065',
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
        country: 'TH',
        status: 'Canceled',
        statusColor: '#E7522F',
        backgroundColor: '#FFFFFF',
        textColor: '#202325',
        countryTextColor: '#556065',
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
        country: 'TH',
        status: 'Active',
        statusColor: '#FFFFFF',
        backgroundColor: '#6B4EFF',
        textColor: '#FFFFFF',
        countryTextColor: '#FFFFFF',
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
        country: 'TH',
        status: 'Active',
        statusColor: '#FFFFFF',
        backgroundColor: '#48A7F8',
        textColor: '#FFFFFF',
        countryTextColor: '#FFFFFF',
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
        country: 'TH',
        status: 'Active',
        statusColor: '#FFFFFF',
        backgroundColor: '#539461',
        textColor: '#FFFFFF',
        countryTextColor: '#FFFFFF',
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
        country: 'TH',
        status: 'Active',
        statusColor: '#FFFFFF',
        backgroundColor: '#6B4EFF',
        textColor: '#FFFFFF',
        countryTextColor: '#FFFFFF',
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
        country: 'TH',
        status: 'Active',
        statusColor: '#FFFFFF',
        backgroundColor: '#539461',
        textColor: '#FFFFFF',
        countryTextColor: '#FFFFFF',
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
        country: 'TH',
        status: 'Canceled',
        statusColor: '#E7522F',
        backgroundColor: '#FFFFFF',
        textColor: '#202325',
        countryTextColor: '#556065',
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
        country: 'TH',
        status: 'Active',
        statusColor: '#FFFFFF',
        backgroundColor: '#6B4EFF',
        textColor: '#FFFFFF',
        countryTextColor: '#FFFFFF',
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
        country: 'TH',
        status: 'Canceled',
        statusColor: '#E7522F',
        backgroundColor: '#FFFFFF',
        textColor: '#202325',
        countryTextColor: '#556065',
      },
    ],
  },
];

// Helper function to get flag component based on country code
const getFlagComponent = (countryCode) => {
  const code = countryCode?.toUpperCase();
  switch (code) {
    case 'PH':
      return PhilippinesFlag;
    case 'TH':
      return ThailandFlag;
    case 'ID':
      return IndonesiaFlag;
    default:
      return ThailandFlag; // Default to Thailand
  }
};

// Country flag component using actual SVG flags
const CountryFlag = ({ countryCode }) => {
  const FlagComponent = getFlagComponent(countryCode);
  return (
    <View style={styles.flagContainer}>
      <FlagComponent width={24} height={16} />
    </View>
  );
};

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
        <View style={styles.countryContainer}>
          <Text style={[styles.countryText, { color: event.countryTextColor }]}>
            {event.country}
          </Text>
          <CountryFlag countryCode={event.country} />
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
                <View style={styles.countryContainer}>
                  <SkeletonItem width={23} height={22} />
                  <SkeletonItem width={24} height={16} style={{ borderRadius: 2 }} />
                </View>
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
                <View style={styles.countryContainer}>
                  <SkeletonItem width={23} height={22} />
                  <SkeletonItem width={24} height={16} style={{ borderRadius: 2 }} />
                </View>
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

  const fetchFlightDates = async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch all orders to get flight dates
      const response = await getAdminOrdersApi({
        limit: 1000, // Fetch a large number to get all flight dates
        page: 1,
      });

      if (response.success && response.orders) {
        // Extract flight dates from orders
        const flightDates = [];
        const ordersByDateMap = {};

        response.orders.forEach((order) => {
          const flightDate = parseFlightDate(order.flightDate);
          if (flightDate) {
            const dateKey = formatDateKey(flightDate);
            if (!ordersByDateMap[dateKey]) {
              ordersByDateMap[dateKey] = [];
              flightDates.push(flightDate);
            }
            ordersByDateMap[dateKey].push(order);
          }
        });

        // Store orders by date in state for navigation
        setOrdersByDate(ordersByDateMap);

        // Find max flight date
        let maxFlightDate = null;
        if (flightDates.length > 0) {
          maxFlightDate = new Date(Math.max(...flightDates.map(d => d.getTime())));
        }

        // Start from current date
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        // If no max date found, use 30 days from today as default
        if (!maxFlightDate) {
          maxFlightDate = new Date(today);
          maxFlightDate.setDate(maxFlightDate.getDate() + 30);
        }

        // Generate date range from today to max flight date
        const dateRange = generateDateRange(today, maxFlightDate);

        // Build schedule data and group by month
        const scheduleByMonth = {};
        
        dateRange.forEach((date) => {
          const dateKey = formatDateKey(date);
          const monthKey = getMonthKey(date);
          const day = date.getDate();
          const dayName = getDayName(date);
          const dateOrders = ordersByDateMap[dateKey] || [];
          
          // Count unique transaction numbers
          const transactionCount = countUniqueTransactions(dateOrders);
          
          // Only create event if there are orders for this date
          if (transactionCount === 0) {
            return; // Skip dates with no orders
          }
          
          // Get origin country from orders (for flag)
          const country = getOriginCountry(dateOrders);

          const styling = getEventStyling(ordersByDateMap, dateKey, transactionCount);
          
          // Safety check: if styling is null, skip this date
          if (!styling) {
            return;
          }

          if (!scheduleByMonth[monthKey]) {
            scheduleByMonth[monthKey] = {
              monthName: getFullMonthName(date),
              year: date.getFullYear(),
              dates: [],
            };
          }

          scheduleByMonth[monthKey].dates.push({
            day,
            dayName,
            date: new Date(date),
            dateKey: dateKey, // Store dateKey for navigation
            orders: dateOrders, // Store orders for navigation
            events: [
              {
                id: dateKey,
                eventType: 'Plant Flight',
                country: country,
                transactionCount: transactionCount,
                ...styling,
              },
            ],
          });
        });

        // Convert to array format for rendering
        const schedule = Object.keys(scheduleByMonth)
          .sort()
          .map(monthKey => scheduleByMonth[monthKey]);

        setScheduleData(schedule);
      } else {
        // If no orders found, return empty schedule (don't show dates without orders)
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
                        date: schedule.date,
                        orders: schedule.orders || [],
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
  countryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 22,
  },
  countryText: {
    width: 23,
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#556065',
  },
  flagContainer: {
    width: 24,
    height: 16,
    borderRadius: 2,
    overflow: 'hidden',
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

