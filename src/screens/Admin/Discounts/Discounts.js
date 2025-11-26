import React, { useState, useEffect, useRef } from 'react';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import {
  ScrollView,
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Modal,
  Dimensions,
  Animated,
  Alert,
} from 'react-native';
import { useNavigation, useFocusEffect, useRoute } from '@react-navigation/native';
import { globalStyles } from '../../../assets/styles/styles';
import EditIcon from '../../../assets/EditIcon';
import Svg, { Path, G, Defs, ClipPath, Rect } from 'react-native-svg';
import ActionSheet from '../../../components/ActionSheet/ActionSheet';
import { getDiscountsApi } from '../../../components/Api/discountApi';
import NetInfo from '@react-native-community/netinfo';

const STATUS_COLORS = {
  Active: '#23C16B',
  Scheduled: '#48A7F8',
  Expired: '#E7522F',
};

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Skeleton Loading Component
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
        backgroundColor: '#E9ECEF',
        borderRadius: 4,
        opacity: pulseAnim,
      }, style]} 
    />
  );
};

const DiscountSkeleton = () => (
  <View style={styles.listSection}>
    <View style={styles.card}>
      <View style={styles.cardContent}>
        {/* Code Row Skeleton */}
        <View style={styles.codeRow}>
          <SkeletonItem width={120} height={24} />
          <SkeletonItem width={80} height={22} />
          <SkeletonItem width={24} height={24} style={{ borderRadius: 12 }} />
        </View>
        
        {/* Status Row Skeleton */}
        <View style={[styles.statusRow, { marginTop: 4 }]}>
          <View style={styles.statusChip}>
            <SkeletonItem width={12} height={12} style={{ borderRadius: 6 }} />
            <SkeletonItem width={60} height={20} style={{ marginLeft: 4 }} />
          </View>
          <SkeletonItem width={4} height={4} style={{ borderRadius: 2, marginHorizontal: 6 }} />
          <SkeletonItem width={100} height={20} />
        </View>
      </View>
    </View>

    {/* Detail Block Skeleton */}
    <View style={styles.detailBlock}>
      <View style={styles.detailWrap}>
        <SkeletonItem width={150} height={22} />
        <SkeletonItem width={4} height={4} style={{ borderRadius: 2, marginHorizontal: 4 }} />
        <SkeletonItem width={120} height={22} />
        <SkeletonItem width={4} height={4} style={{ borderRadius: 2, marginHorizontal: 4 }} />
        <SkeletonItem width={100} height={22} />
      </View>
    </View>
  </View>
);

const Discounts = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  const [showAddSheet, setShowAddSheet] = useState(false);
  const [showSortSheet, setShowSortSheet] = useState(false);
  const [showStatusSheet, setShowStatusSheet] = useState(false);
  const [sortBy, setSortBy] = useState('newest'); // 'newest' | 'oldest'
  const [selectedStatuses, setSelectedStatuses] = useState(['Active', 'Scheduled', 'Expired']); // All selected by default
  const [discounts, setDiscounts] = useState([]);
  const [allDiscounts, setAllDiscounts] = useState([]); // Store all discounts for filtering
  const [loading, setLoading] = useState(true);
  const hasLoadedRef = useRef(false); // Track if data has been initially loaded

  // Filter discounts by status
  const filterDiscountsByStatus = (discountsList, statuses) => {
    if (!Array.isArray(discountsList) || !Array.isArray(statuses) || statuses.length === 0) {
      return discountsList;
    }
    return discountsList.filter(discount => {
      const status = discount.status || '';
      return statuses.includes(status);
    });
  };

  // Sort discounts function
  const sortDiscounts = (discountsList, sortOption) => {
    if (!Array.isArray(discountsList)) return discountsList;
    
    const sorted = [...discountsList];
    
    if (sortOption === 'newest') {
      // Sort by createdAt descending (newest first)
      sorted.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateB - dateA;
      });
    } else if (sortOption === 'oldest') {
      // Sort by createdAt ascending (oldest first)
      sorted.sort((a, b) => {
        const dateA = a.createdAt ? new Date(a.createdAt) : new Date(0);
        const dateB = b.createdAt ? new Date(b.createdAt) : new Date(0);
        return dateA - dateB;
      });
    }
    
    return sorted;
  };

  // Load discounts from API
  const loadDiscounts = async () => {
    try {
      setLoading(true);
      const net = await NetInfo.fetch();
      if (!net.isConnected || !net.isInternetReachable) {
        setLoading(false);
        return Promise.resolve();
      }
      const result = await getDiscountsApi({ limit: 100 });
      if (result.success && Array.isArray(result.data)) {
        setAllDiscounts(result.data);
        const filtered = filterDiscountsByStatus(result.data, selectedStatuses);
        const sortedDiscounts = sortDiscounts(filtered, sortBy);
        setDiscounts(sortedDiscounts);
      } else {
        setAllDiscounts([]);
        setDiscounts([]);
      }
    } catch (error) {
      console.error('Error loading discounts:', error);
      setDiscounts([]);
    } finally {
      setLoading(false);
    }
    return Promise.resolve();
  };

  // Load discounts on mount (only once)
  useEffect(() => {
    if (!hasLoadedRef.current) {
      loadDiscounts().then(() => {
        hasLoadedRef.current = true;
      });
    }
  }, []);

  // Apply sort and reload
  const handleApplySort = () => {
    const filtered = filterDiscountsByStatus(allDiscounts, selectedStatuses);
    const sorted = sortDiscounts(filtered, sortBy);
    setDiscounts(sorted);
    setShowSortSheet(false);
  };

  // Toggle status selection
  const toggleStatus = (status) => {
    setSelectedStatuses(prev => {
      if (prev.includes(status)) {
        // Allow unchecking any checkbox, even if it's the last one
        return prev.filter(s => s !== status);
      } else {
        return [...prev, status];
      }
    });
  };

  // Clear all status filters (uncheck all, show all data by default)
  const handleClearStatus = () => {
    // Clear all selections (uncheck all checkboxes)
    setSelectedStatuses([]);
    // Show all discounts by default (no filtering applied)
    const sorted = sortDiscounts(allDiscounts, sortBy);
    setDiscounts(sorted);
  };

  // Apply status filter
  const handleApplyStatus = () => {
    // If no statuses are selected, show all discounts (no filtering)
    if (selectedStatuses.length === 0) {
      const sorted = sortDiscounts(allDiscounts, sortBy);
      setDiscounts(sorted);
      setShowStatusSheet(false);
      return;
    }
    const filtered = filterDiscountsByStatus(allDiscounts, selectedStatuses);
    const sorted = sortDiscounts(filtered, sortBy);
    setDiscounts(sorted);
    setShowStatusSheet(false);
  };

  // Listen for route param changes (for refresh flag)
  useEffect(() => {
    const refreshFlag = route.params?.refresh;
    if (refreshFlag === true) {
      console.log('🔄 Refreshing discounts due to refresh flag in useEffect');
      // Clear the refresh flag
      navigation.setParams({ refresh: false });
      // Reset the loaded flag and reload data
      hasLoadedRef.current = false;
      loadDiscounts().then(() => {
        hasLoadedRef.current = true;
      });
    }
  }, [route.params?.refresh, navigation]);

  // Reload discounts when screen comes into focus ONLY if:
  // 1. Data hasn't been loaded yet, OR
  // 2. Route params indicate a refresh is needed (e.g., after creating/updating/deleting)
  useFocusEffect(
    React.useCallback(() => {
      // Check if we need to refresh (e.g., after creating/editing a discount)
      const refreshFlag = route.params?.refresh;
      const shouldRefresh = refreshFlag === true;
      
      if (shouldRefresh) {
        console.log('🔄 Refreshing discounts due to refresh flag in useFocusEffect');
        // Clear the refresh flag immediately to prevent multiple refreshes
        navigation.setParams({ refresh: false });
        // Reset the loaded flag and reload data
        hasLoadedRef.current = false;
        loadDiscounts().then(() => {
          hasLoadedRef.current = true;
        });
      } else if (!hasLoadedRef.current) {
        // Only load if data hasn't been loaded yet
        loadDiscounts().then(() => {
          hasLoadedRef.current = true;
        });
      }
      // Otherwise, use cached data - no reload needed
    }, [route.params?.refresh, navigation])
  );

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#FFFFFF'}}>
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => {
            console.log('Back button pressed');
            try {
              if (navigation.canGoBack()) {
                navigation.goBack();
              } else {
                // Fallback if no previous screen
                navigation.navigate('AdminDashboard'); // Adjust route name as needed
              }
            } catch (error) {
              console.error('Navigation error:', error);
            }
          }} 
          style={styles.backBtn}
          activeOpacity={0.7}
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
        >
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M15.5303 3.96967C15.8232 4.26256 15.8232 4.73744 15.5303 5.03033L8.56066 12L15.5303 18.9697C15.8232 19.2626 15.8232 19.7374 15.5303 20.0303C15.2374 20.3232 14.7626 20.3232 14.4697 20.0303L6.96967 12.5303C6.67678 12.2374 6.67678 11.7626 6.96967 11.4697L14.4697 3.96967C14.7626 3.67678 15.2374 3.67678 15.5303 3.96967Z"
              fill="#393D40"
            />
          </Svg>
        </TouchableOpacity>
        <Text style={styles.headerTitle} pointerEvents="none">Discounts</Text>
        <View style={styles.headerRight}>
          <TouchableOpacity 
            style={styles.headerAction} 
            onPress={() => {
              console.log('+ button pressed, showAddSheet current value:', showAddSheet);
              console.log('Setting showAddSheet to true');
              try {
                setShowAddSheet(true);
                console.log('showAddSheet set to true');
              } catch (error) {
                console.error('Error setting showAddSheet:', error);
              }
            }}
            activeOpacity={0.7}
            hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          >
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M12 3C12.4142 3 12.75 3.33579 12.75 3.75V11.25H20.25C20.6642 11.25 21 11.5858 21 12C21 12.4142 20.6642 12.75 20.25 12.75H12.75V20.25C12.75 20.6642 12.4142 21 12 21C11.5858 21 11.25 20.6642 11.25 20.25V12.75H3.75C3.33579 12.75 3 12.4142 3 12C3 11.5858 3.33579 11.25 3.75 11.25H11.25V3.75C11.25 3.33579 11.5858 3 12 3Z"
                fill="#556065"
              />
            </Svg>
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView
        style={{flex: 1}}
        contentContainerStyle={{paddingBottom: 24}}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.tabsRow}>
          <TouchableOpacity style={styles.tabPill} onPress={() => setShowSortSheet(true)}>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M5 2.25C5.41421 2.25 5.75 2.58579 5.75 3V11.1893L6.46967 10.4697C6.76256 10.1768 7.23744 10.1768 7.53033 10.4697C7.82322 10.7626 7.82322 11.2374 7.53033 11.5303L5.53033 13.5303C5.23744 13.8232 4.76256 13.8232 4.46967 13.5303L2.46967 11.5303C2.17678 11.2374 2.17678 10.7626 2.46967 10.4697C2.76256 10.1768 3.23744 10.1768 3.53033 10.4697L4.25 11.1893V3C4.25 2.58579 4.58579 2.25 5 2.25ZM10.4697 2.46967C10.7626 2.17678 11.2374 2.17678 11.5303 2.46967L13.5303 4.46967C13.8232 4.76256 13.8232 5.23744 13.5303 5.53033C13.2374 5.82322 12.7626 5.82322 12.4697 5.53033L11.75 4.81066V13C11.75 13.4142 11.4142 13.75 11 13.75C10.5858 13.75 10.25 13.4142 10.25 13V4.81066L9.53033 5.53033C9.23744 5.82322 8.76256 5.82322 8.46967 5.53033C8.17678 5.23744 8.17678 4.76256 8.46967 4.46967L10.4697 2.46967Z"
                fill="#202325"
              />
            </Svg>
            <Text style={styles.tabPillText}>Sort</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.tabPill} onPress={() => setShowStatusSheet(true)}>
            <Text style={styles.tabPillText}>Status</Text>
            <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
              <Path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M2.46967 5.46967C2.76256 5.17678 3.23744 5.17678 3.53033 5.46967L8 9.93934L12.4697 5.46967C12.7626 5.17678 13.2374 5.17678 13.5303 5.46967C13.8232 5.76256 13.8232 6.23744 13.5303 6.53033L8.53033 11.5303C8.23744 11.8232 7.76256 11.8232 7.46967 11.5303L2.46967 6.53033C2.17678 6.23744 2.17678 5.76256 2.46967 5.46967Z"
                fill="#202325"
              />
            </Svg>
          </TouchableOpacity>
        </View>

        {loading ? (
          <>
            <DiscountSkeleton />
            <DiscountSkeleton />
            <DiscountSkeleton />
            <DiscountSkeleton />
            <DiscountSkeleton />
          </>
        ) : discounts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No discounts found</Text>
            <Text style={styles.emptySubtext}>Create your first discount code to get started</Text>
          </View>
        ) : (
          discounts.map(item => (
          <View key={item.id} style={styles.listSection}>
            <View style={styles.card}>
              <View style={styles.cardContent}>
                <View style={styles.codeRow}>
                  <Text style={styles.codeText}>{item.code}</Text>
                  <Text style={styles.usedText}>Used {item.used}</Text>
                  <TouchableOpacity 
                    style={styles.editBtn}
                    onPress={() => {
                      // Ensure discountId is set - use item.id or fallback to item.discountId
                      const discountIdToPass = item.id || item.discountId;
                      console.log('🔍 Discounts - Navigating to EditDiscount with:', {
                        discountId: discountIdToPass,
                        code: item.code,
                        discountType: item.discountType,
                        itemId: item.id,
                        itemKeys: Object.keys(item),
                      });
                      
                      if (!discountIdToPass) {
                        console.error('❌ Discounts - item.id is missing! Item:', JSON.stringify(item, null, 2));
                        Alert.alert('Error', 'Discount ID is missing. Cannot edit this discount.');
                        return;
                      }
                      
                      navigation.navigate('AdminDiscountEdit', { 
                        discountId: discountIdToPass, 
                        id: discountIdToPass, // Also pass as 'id' as fallback
                        code: item.code,
                        discountType: item.discountType || 'buyXGetY', // Required: 'buyXGetY', 'amountOffPlantsPercentage', 'eventGift', 'eventGiftFixed'
                        mode: item.mode || 'percentage', // 'percentage' or 'fixed' (for amountOffPlantsPercentage and eventGift)
                        ...item, // Pass all discount data
                      });
                    }}
                  >
                    <EditIcon width={24} height={24} />
                  </TouchableOpacity>
                </View>

                <View style={styles.statusRow}>
                  <View style={styles.statusChip}>
                    <View style={[styles.dot, {backgroundColor: STATUS_COLORS[item.status] || '#7F8D91'}]} />
                    <Text style={[styles.statusText, {color: STATUS_COLORS[item.status] || '#7F8D91'}]}>{item.status}</Text>
                  </View>
                  <View style={styles.dividerSmall} />
                  <View style={styles.dateRow}>
                    {item.start && (
                      <>
                        <Text style={styles.dateText}>{item.start}</Text>
                        {item.end && (
                          <>
                            <Text style={styles.dateSep}>•</Text>
                            <Text style={styles.dateText}>{item.end}</Text>
                          </>
                        )}
                      </>
                    )}
                  </View>
                </View>
              </View>
            </View>

            <View style={styles.detailBlock}>
              <View style={styles.detailWrap}>
                {item.details.map((d, idx) => (
                  <React.Fragment key={idx}>
                    <Text style={styles.detailText}>{d}</Text>
                    {idx < item.details.length - 1 && <View style={styles.detailDivider} />}
                  </React.Fragment>
                ))}
              </View>
            </View>
          </View>
          ))
        )}
      </ScrollView>

      <ActionSheet 
        visible={showAddSheet} 
        onClose={() => {
          console.log('ActionSheet onClose called');
          setShowAddSheet(false);
        }} 
        heightPercent={insets.bottom > 0 ? '42%' : '37%'}
      >
        <View style={styles.sheetContainer}>
          <View style={styles.sheetIndicatorArea}>
            <View style={styles.sheetIndicatorBar} />
          </View>
          <ScrollView 
            style={styles.sheetContentScroll}
            contentContainerStyle={[styles.sheetContent, {paddingBottom: Math.max(insets.bottom, 16)}]}
            showsVerticalScrollIndicator={false}
          >
            <TouchableOpacity style={[styles.optionCard, {height: 80}]} onPress={() => { setShowAddSheet(false); navigation.navigate('AdminDiscountFreeShipping'); }}>
              <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
                <Path d="M40 13H8C6.89543 13 6 13.8954 6 15V33C6 34.1046 6.89543 35 8 35H40C41.1046 35 42 34.1046 42 33V15C42 13.8954 41.1046 13 40 13Z" fill="#4A90E2"/>
                <Path d="M32 20H16V28H32V20Z" fill="#5BA3F5"/>
                <Path d="M24 16C22.8954 16 22 16.8954 22 18V30C22 31.1046 22.8954 32 24 32C25.1046 32 26 31.1046 26 30V18C26 16.8954 25.1046 16 24 16Z" fill="#357ABD"/>
                <Path d="M36 22C36 20.8954 35.1046 20 34 20H14C12.8954 20 12 20.8954 12 22V26C12 27.1046 12.8954 28 14 28H34C35.1046 28 36 27.1046 36 26V22Z" fill="#FFFFFF" fillOpacity="0.3"/>
                <Path d="M24 10L20 14H28L24 10Z" fill="#23C16B"/>
                <Path d="M24 38L28 34H20L24 38Z" fill="#23C16B"/>
              </Svg>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Free Shipping</Text>
                <Text style={styles.optionSubtitle}>Free UPS shipping and/or air cargo for eligible orders.</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionCard} onPress={() => { setShowAddSheet(false); navigation.navigate('AdminDiscountAmountOffPlants'); }}>
              <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
                <Path d="M39.6006 40.834H36.9736V20.9941C36.0134 21.2788 34.9973 21.4324 33.946 21.4324C33.1042 21.4324 32.2639 21.3332 31.4486 21.1377L31.3326 21.1098L31.334 21.3045C31.334 23.5751 30.7892 25.7206 29.8242 27.618V40.834H27.1972C26.9049 40.834 26.755 41.1841 26.9568 41.3956L33.1584 47.8971C33.2893 48.0344 33.5084 48.0344 33.6394 47.8971L39.841 41.3956C40.0428 41.1841 39.8929 40.834 39.6006 40.834Z" fill="#FC502A"/>
                <Path d="M30.1776 41.3954C29.9759 41.1839 30.1258 40.8337 30.4181 40.8337H32.0793C32.6127 40.8337 33.0451 40.4013 33.0451 39.8679V21.4876C32.4928 21.4416 31.9522 21.3546 31.4268 21.2285C31.4269 21.2538 31.4277 21.2789 31.4277 21.3042C31.4277 23.66 30.8478 25.8801 29.8242 27.8309V40.8336H27.1972C26.9049 40.8336 26.755 41.1838 26.9568 41.3953L33.1584 47.8967C33.2894 48.034 33.5084 48.034 33.6394 47.8967L35.0093 46.4605L30.1776 41.3954Z" fill="#E60D28"/>
                <Path d="M23.5615 40.834H20.9345V34.8145C19.793 35.1167 18.5951 35.2786 17.3598 35.2786C16.1246 35.2786 14.9267 35.1167 13.7852 34.8145V40.834H11.1582C10.8659 40.834 10.716 41.1842 10.9177 41.3957L17.1194 47.8972C17.2503 48.0344 17.4693 48.0344 17.6003 47.8972L23.802 41.3957C24.0037 41.1842 23.8538 40.834 23.5615 40.834Z" fill="#FC502A"/>
                <Path d="M14.1453 41.3953C13.9436 41.1838 14.0935 40.8337 14.3858 40.8337H16.047C16.5804 40.8337 17.0128 40.4013 17.0128 39.8679V35.3664C15.9002 35.3393 14.8194 35.184 13.7852 34.9131V40.8336H11.1582C10.8659 40.8336 10.716 41.1837 10.9177 41.3952L17.1194 47.8967C17.2503 48.034 17.4693 48.034 17.6003 47.8967L18.9737 46.457L14.1453 41.3953Z" fill="#E60D28"/>
                <Path d="M23.2766 10.7626C23.2766 10.0356 23.35 9.32536 23.4892 8.63873C21.6364 7.74042 19.5571 7.23633 17.3597 7.23633C9.59031 7.23633 3.29199 13.5346 3.29199 21.3041C3.29199 29.0735 9.59031 35.3718 17.3597 35.3718C25.1292 35.3718 31.4275 29.0735 31.4275 21.3041C31.4275 21.246 31.426 21.1882 31.4253 21.1304C26.7548 19.9947 23.2766 15.7775 23.2766 10.7626Z" fill="#FFE27A"/>
                <Path d="M23.5334 13.0927C21.8133 11.7961 19.6746 11.0264 17.3595 11.0264C11.6926 11.0264 7.08203 15.6367 7.08203 21.3038C7.08203 26.9708 11.6925 31.5812 17.3595 31.5812C23.0265 31.5812 27.6369 26.9709 27.6369 21.3038C27.6369 20.5817 27.5617 19.877 27.4193 19.1967C25.4888 17.6994 24.0843 15.5555 23.5334 13.0927Z" fill="#FFBA57"/>
                <Path d="M11.1551 21.3037C11.1551 16.3337 14.7012 12.1769 19.396 11.2293C18.7375 11.0964 18.0566 11.0264 17.3595 11.0264C11.6926 11.0264 7.08203 15.6368 7.08203 21.3038C7.08203 26.9708 11.6925 31.5812 17.3595 31.5812C18.0565 31.5812 18.7375 31.5111 19.396 31.3783C14.7012 30.4306 11.1551 26.2737 11.1551 21.3037Z" fill="#FFAC3E"/>
                <Path d="M18.5868 20.6011H16.1321C15.2952 20.6011 14.6143 19.9202 14.6143 19.0833C14.6143 18.2464 15.2952 17.5655 16.1321 17.5655H20.4571C20.8454 17.5655 21.1603 17.2507 21.1603 16.8624C21.1603 16.474 20.8454 16.1592 20.4571 16.1592H18.0626V14.583C18.0626 14.1947 17.7478 13.8799 17.3594 13.8799C16.9711 13.8799 16.6563 14.1947 16.6563 14.583V16.1592H16.1321C14.5198 16.1592 13.208 17.471 13.208 19.0833C13.208 20.6956 14.5198 22.0074 16.1321 22.0074H18.5868C19.4237 22.0074 20.1046 22.6883 20.1046 23.5252C20.1046 24.3621 19.4237 25.043 18.5868 25.043H14.2619C13.8735 25.043 13.5587 25.3578 13.5587 25.7461C13.5587 26.1344 13.8735 26.4492 14.2619 26.4492H16.6563V28.0254C16.6563 28.4138 16.9711 28.7286 17.3594 28.7286C17.7478 28.7286 18.0626 28.4138 18.0626 28.0254V26.4492H18.5868C20.1991 26.4492 21.5109 25.1375 21.5109 23.5252C21.5109 21.9129 20.1991 20.6011 18.5868 20.6011Z" fill="#FFE27A"/>
                <Path d="M33.9457 21.5261C39.89 21.5261 44.7087 16.7073 44.7087 10.7631C44.7087 4.81879 39.89 0 33.9457 0C28.0014 0 23.1826 4.81879 23.1826 10.7631C23.1826 16.7073 28.0014 21.5261 33.9457 21.5261Z" fill="#80D261"/>
                <Path d="M28.0567 10.7631C28.0567 5.65697 31.6123 1.38141 36.3827 0.277219C35.5996 0.0959063 34.7839 0 33.9457 0C28.0015 0 23.1826 4.81875 23.1826 10.7631C23.1826 16.7074 28.0014 21.5261 33.9457 21.5261C34.7838 21.5261 35.5996 21.4302 36.3826 21.249C31.6123 20.1446 28.0567 15.8692 28.0567 10.7631Z" fill="#4FC122"/>
                <Path d="M35.9813 4.89575C36.1495 4.54589 36.5702 4.39852 36.9199 4.56645C37.2698 4.73461 37.4172 5.15513 37.2492 5.50512L31.909 16.6297C31.788 16.8814 31.5368 17.0282 31.275 17.0282C31.173 17.0282 31.0696 17.006 30.9715 16.959C30.6213 16.7909 30.473 16.3704 30.641 16.0204L35.9813 4.89575Z" fill="#EAF6FF"/>
                <Path fillRule="evenodd" clipRule="evenodd" d="M37.5059 12.2844C38.8134 12.2847 39.8765 13.3487 39.8766 14.6563C39.8766 15.9639 38.8134 17.0279 37.5059 17.0282C36.198 17.0282 35.134 15.9641 35.134 14.6563C35.134 13.3485 36.1981 12.2844 37.5059 12.2844ZM37.5059 13.6907C36.9734 13.6907 36.5403 14.124 36.5402 14.6563C36.5402 15.1887 36.9734 15.6219 37.5059 15.6219C38.0379 15.6216 38.4703 15.1885 38.4703 14.6563C38.4702 14.1241 38.038 13.691 37.5059 13.6907Z" fill="#EAF6FF"/>
                <Path fillRule="evenodd" clipRule="evenodd" d="M30.3855 4.49731C31.6933 4.49736 32.7574 5.56143 32.7574 6.86919C32.7574 8.17697 31.6933 9.24101 30.3855 9.24106C29.0777 9.24106 28.0137 8.177 28.0137 6.86919C28.0137 5.5614 29.0778 4.49731 30.3855 4.49731ZM30.3855 5.90356C29.8532 5.90356 29.42 6.3368 29.4199 6.86919C29.4199 7.40159 29.8531 7.83481 30.3855 7.83481C30.918 7.83476 31.3512 7.40156 31.3512 6.86919C31.3511 6.33683 30.918 5.90361 30.3855 5.90356Z" fill="#EAF6FF"/>
              </Svg>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Amount off plants</Text>
                <Text style={styles.optionSubtitle}>Discount specific plants or genus taxonomy.</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={styles.optionCard} onPress={() => { setShowAddSheet(false); navigation.navigate('AdminDiscountBuyXGetY'); }}>
              <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
                <Path d="M34.7372 42.0604L34.8952 8.81541C34.8952 8.54325 34.6746 8.32256 34.4024 8.32256L33.1728 7.92188H3.45159C3.17943 7.92188 2.95874 8.14256 2.95874 8.41472V42.0915C2.95874 42.2159 2.95668 42.3398 2.93652 42.4621L4.98805 43.7753H30.9316L34.7676 42.431C34.7475 42.3087 34.7372 42.1848 34.7372 42.0604Z" fill="#E9BB91"/>
                <Path d="M35.5298 42.0915V8.41472C35.5298 8.14256 35.3915 7.92188 35.2208 7.92188H32.9798C33.1505 7.92188 33.2888 8.14256 33.2888 8.41472V14.557L30.4178 17.7409H24.5737C23.2424 17.7409 22.1592 18.824 22.1592 20.1554V42.2377L21.7969 43.7754H30.4178H30.9319H32.6589L35.5491 42.4622C35.5363 42.3397 35.5298 42.2158 35.5298 42.0915Z" fill="#CA936C"/>
                <Path d="M29.7594 26.3278L28.4516 28.4521C28.3841 28.5365 28.355 28.6451 28.3714 28.7519L28.7866 31.3053C28.814 31.4843 28.7135 31.6582 28.5447 31.7238L26.0401 32.7578C25.9391 32.7971 25.8593 32.8768 25.82 32.9778L24.8148 35.2425C24.7491 35.4113 24.5752 35.5118 24.3963 35.4844L21.8462 35.2106C21.7394 35.1943 21.6306 35.2234 21.5464 35.2909L19.4839 36.965C19.3428 37.078 19.1421 37.078 19.001 36.965L16.978 35.2744C16.8936 35.2069 16.785 35.1778 16.6782 35.1941L13.986 35.7848C13.807 35.8121 13.6331 35.7116 13.5675 35.5429L12.6753 33.6947L12.5046 33.2559C12.4654 33.1549 12.3856 33.0751 12.2846 33.0358L9.75814 32.0534C9.58939 31.9878 9.48889 31.8139 9.51627 31.6349L9.92623 28.9556C9.94255 28.8489 9.91348 28.7401 9.84598 28.6558L8.15211 26.5395C8.03914 26.3984 8.03914 26.1978 8.15211 26.0567L9.84598 23.9404C9.91348 23.856 9.94255 23.7474 9.92623 23.6406L9.51627 20.9612C9.48889 20.7822 9.58939 20.6083 9.75814 20.5427L12.2846 19.5603C12.3856 19.521 12.4654 19.4412 12.5046 19.3403L13.487 16.8138C13.5527 16.6451 13.7266 16.5446 13.9055 16.5719L16.5848 16.9819C16.6916 16.9982 16.8004 16.9691 16.8846 16.9016L19.001 15.2078C19.142 15.0948 19.3427 15.0948 19.4838 15.2078L21.6001 16.9016C21.6845 16.9691 21.7931 16.9982 21.8999 16.9819L24.5793 16.5719C24.7582 16.5446 24.9321 16.6451 24.9978 16.8138L25.3582 17.7407C25.3975 17.8417 25.6925 19.6957 25.7934 19.7349L26.6015 19.9369L28.1779 20.8369C28.3466 20.9025 28.4471 21.0764 28.4197 21.2554L28.2438 23.7288C28.2275 23.8356 28.2565 23.9443 28.324 24.0286L29.7594 25.845C29.8724 25.9861 29.8724 26.1867 29.7594 26.3278Z" fill="#FC502A"/>
                <Path d="M30.3323 26.5399C30.4453 26.3988 30.4453 26.1982 30.3323 26.0571L28.6385 23.9408C28.571 23.8564 28.5419 23.7478 28.5582 23.641L28.9682 20.9617C28.9956 20.7827 28.8951 20.6088 28.7263 20.5432L26.6387 19.7314L26.1998 19.5608C26.0989 19.5215 26.0191 19.4417 25.9798 19.3408L25.3578 17.7412H24.5728C23.2393 17.7412 22.1583 18.8222 22.1583 20.1557V27.2002C22.1583 30.2949 19.9995 33.0041 16.9642 33.6074C16.1901 33.7612 15.3898 33.8419 14.5705 33.8419C13.9257 33.8419 13.2926 33.7916 12.6748 33.6953L13.4866 35.7828C13.5522 35.9516 13.7261 36.0521 13.9051 36.0247L16.5845 35.6147C16.6912 35.5984 16.8 35.6275 16.8843 35.695L19.0006 37.3889C19.1417 37.5018 19.3423 37.5018 19.4834 37.3889L21.5997 35.695C21.6841 35.6275 21.7927 35.5984 21.8995 35.6147L24.5788 36.0248C24.7578 36.0522 24.9317 35.9517 24.9973 35.7829L25.9797 33.2565C26.019 33.1555 26.0988 33.0757 26.1997 33.0364L28.7262 32.054C28.895 31.9884 28.9955 31.8145 28.9681 31.6355L28.5581 28.9561C28.5418 28.8494 28.5709 28.7406 28.6384 28.6563L30.3323 26.5399Z" fill="#E60D28"/>
                <Path d="M30.4174 43.7761C30.3791 43.6612 28.9497 44.2461 28.9301 44.127L22.1059 42.4629H2.9363C2.9167 42.582 2.88783 42.6996 2.84958 42.8145L1.3372 47.3517C1.2308 47.6708 1.46836 48.0003 1.80473 48.0003H21.0293L31.1449 47.5868C31.4813 47.5868 31.7189 47.2573 31.6125 46.9381L30.4174 43.7761Z" fill="#E9BB91"/>
                <Path d="M35.6361 42.8145C35.5978 42.6995 35.569 42.582 35.5494 42.4629H22.1067L21.0463 46.9636C20.9645 47.3104 20.9612 47.663 21.03 48.0004H23.3964L35.6361 42.8145Z" fill="#CA936C"/>
                <Path d="M27.1888 3.74016V11.0695H23.4482V2.64844L27.1888 3.74016Z" fill="#FFD301"/>
                <Path d="M15.0374 2.64844V11.0695H11.2969V3.74016L15.0374 2.64844Z" fill="#FFD301"/>
                <Path d="M16.0889 10.6589V12.6739C16.0889 12.8339 15.9591 12.9637 15.7991 12.9637H10.5359C10.3758 12.9637 10.2461 12.8339 10.2461 12.6739V10.6589C10.2461 10.4989 10.3758 10.3691 10.5359 10.3691H15.7991C15.9591 10.3692 16.0889 10.499 16.0889 10.6589Z" fill="#FEE55A"/>
                <Path d="M28.2392 10.6589V12.6739C28.2392 12.8339 28.1094 12.9637 27.9494 12.9637H22.6863C22.5262 12.9637 22.3965 12.8339 22.3965 12.6739V10.6589C22.3965 10.4989 22.5262 10.3691 22.6863 10.3691H27.9495C28.1094 10.3692 28.2392 10.499 28.2392 10.6589Z" fill="#FEE55A"/>
                <Path d="M27.1883 3.74053H11.2969L14.9242 0.113156C14.9967 0.0406875 15.095 0 15.1974 0H23.2105C23.3116 0 23.4086 0.0395625 23.4808 0.11025L27.1883 3.74053Z" fill="#FEE55A"/>
                <Path d="M46.0717 42.4354L46.5055 20.3C46.5055 20.0333 46.2894 19.8171 46.0226 19.8171L43.8136 19.6738H24.5731C24.3064 19.6738 24.0902 19.89 24.0902 20.1567V42.4074C24.0902 42.4261 24.0891 42.4449 24.0869 42.4635L26.7609 43.7768H43.89L46.075 42.4915C46.0728 42.4729 46.0717 42.4541 46.0717 42.4354Z" fill="#60B8FE"/>
                <Path d="M46.4415 42.8612C46.4373 42.8432 44.1053 42.4245 44.1031 42.4062L24.0867 42.4624C24.0845 42.4808 24.0813 42.499 24.0771 42.517L22.9252 47.4062C22.8538 47.7094 23.0837 47.9998 23.3953 47.9998H44.9911L47.0561 47.6866C47.3675 47.6866 47.5976 47.3962 47.5261 47.093L46.4415 42.8612Z" fill="#60B8FE"/>
                <Path d="M46.7119 42.4074V20.1567C46.7119 19.89 46.4957 19.6738 46.229 19.6738H43.6211C43.8878 19.6738 44.104 19.89 44.104 20.1567V42.4074C44.104 42.4261 44.1456 42.4344 44.1478 42.453L45.6981 43.5854L46.6591 42.4676L46.7119 42.4074Z" fill="#23A8FE"/>
                <Path d="M47.8762 47.4062L46.7243 42.517C46.7201 42.499 46.7115 42.4439 46.7115 42.4062H44.1035C44.1035 42.448 44.1121 42.499 44.1164 42.517L45.2683 47.4062C45.3397 47.7094 45.1097 47.9998 44.7982 47.9998H47.4061C47.7177 47.9998 47.9476 47.7094 47.8762 47.4062Z" fill="#23A8FE"/>
                <Path d="M41.9028 16.4511V21.8756H38.8418V15.9277L41.9028 16.4511Z" fill="#FFD301"/>
                <Path d="M31.9595 15.8018V21.8772H28.8984V16.4528L31.9595 15.8018Z" fill="#FFD301"/>
                <Path d="M41.903 16.4517H28.8984L31.8746 13.4755C31.929 13.4211 32.0027 13.3906 32.0795 13.3906H38.6586C38.7343 13.3906 38.8072 13.4203 38.8612 13.4733L41.903 16.4517Z" fill="#FEE55A"/>
                <Path d="M32.8194 22.1667V24.1277C32.8194 24.2877 32.6897 24.4175 32.5296 24.4175H28.3279C28.1678 24.4175 28.0381 24.2877 28.0381 24.1277V22.1667C28.0381 22.0067 28.1678 21.877 28.3279 21.877H32.5296C32.6897 21.877 32.8194 22.0067 32.8194 22.1667Z" fill="#FEE55A"/>
                <Path d="M42.7628 22.1667V24.1277C42.7628 24.2877 42.633 24.4175 42.473 24.4175H38.2712C38.1112 24.4175 37.9814 24.2877 37.9814 24.1277V22.1667C37.9814 22.0067 38.1112 21.877 38.2712 21.877H42.473C42.633 21.877 42.7628 22.0067 42.7628 22.1667Z" fill="#FEE55A"/>
                <Path d="M37.8953 42.6177C36.7408 43.2475 36.5366 43.3915 35.9068 44.5459C35.8391 44.67 35.6623 44.67 35.5946 44.5459C35.2093 43.8397 34.8437 43.7827 34.3537 43.3645C34.0427 43.0991 33.6818 42.8623 33.2336 42.6178C33.1096 42.5501 33.1096 42.3733 33.2336 42.3056C34.3881 41.6758 34.9649 41.0989 35.5946 39.9446C35.6623 39.8206 35.8391 39.8206 35.9068 39.9446C36.1513 40.3928 36.3879 40.7539 36.6533 41.0649C37.0716 41.5549 37.189 41.9204 37.8952 42.3057C38.0193 42.3732 38.0193 42.55 37.8953 42.6177Z" fill="#FEE55A"/>
                <Path d="M38.2678 42.3052C37.5616 41.92 37.0714 41.5544 36.6532 41.0645C36.4297 42.2263 35.5154 43.1406 34.3535 43.3641C34.8435 43.7824 35.2093 44.2723 35.5945 44.9784C35.6622 45.1025 35.839 45.1025 35.9067 44.9784C36.5365 43.8241 37.1133 43.2471 38.2677 42.6174C38.3918 42.5497 38.3918 42.3729 38.2678 42.3052Z" fill="#FFD301"/>
                <Path d="M42.5314 36.4286C41.5407 36.9691 41.3655 37.0927 40.825 38.0833C40.767 38.1897 40.6152 38.1897 40.5571 38.0833C40.2264 37.4773 39.9127 37.4284 39.4922 37.0694C39.2254 36.8416 38.9156 36.6385 38.531 36.4286C38.4246 36.3705 38.4246 36.2187 38.531 36.1606C39.5216 35.6201 40.0166 35.1251 40.5571 34.1345C40.6151 34.0281 40.7669 34.0281 40.825 34.1345C41.0349 34.5191 41.2378 34.829 41.4656 35.0959C41.8246 35.5164 41.9254 35.8301 42.5314 36.1606C42.6379 36.2188 42.6379 36.3706 42.5314 36.4286Z" fill="#FEE55A"/>
                <Path d="M42.8512 36.1614C42.2452 35.8308 41.8245 35.5171 41.4656 35.0967C41.2738 36.0937 40.4892 36.8784 39.4922 37.0702C39.9127 37.4291 40.2265 37.8496 40.5571 38.4555C40.6151 38.5619 40.7669 38.5619 40.825 38.4555C41.3655 37.4648 41.8605 36.9698 42.8512 36.4293C42.9577 36.3713 42.9577 36.2195 42.8512 36.1614Z" fill="#FFD301"/>
                <Path d="M5.29412 15.0921C4.03552 15.7787 3.81287 15.9357 3.12624 17.1943C3.05246 17.3295 2.85962 17.3295 2.78584 17.1943C2.36574 16.4243 1.96712 16.3622 1.43284 15.9062C1.09384 15.6168 0.700367 15.3586 0.211742 15.0921C0.0765547 15.0183 0.0765547 14.8254 0.211742 14.7517C1.47034 14.065 2.09921 13.4362 2.78584 12.1776C2.85962 12.0424 3.05246 12.0424 3.12624 12.1776C3.39277 12.6662 3.65068 13.0599 3.94009 13.3989C4.39609 13.9331 4.52415 14.3316 5.29412 14.7517C5.4294 14.8255 5.4294 15.0184 5.29412 15.0921Z" fill="#FEE55A"/>
                <Path d="M5.701 14.7521C4.93113 14.3321 4.39675 13.9335 3.94075 13.3994C3.69709 14.6661 2.70025 15.663 1.43359 15.9067C1.96769 16.3627 2.36659 16.8968 2.78659 17.6666C2.86038 17.8018 3.05322 17.8018 3.127 17.6666C3.81363 16.408 4.4425 15.7792 5.70109 15.0925C5.83619 15.0188 5.83619 14.8259 5.701 14.7521Z" fill="#FFD301"/>
                <Path d="M0 0H48V48H0V0Z" fill="white" fillOpacity="0"/>
              </Svg>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Buy X get Y</Text>
                <Text style={styles.optionSubtitle}>Discount specific plants or genus taxonomy.</Text>
              </View>
            </TouchableOpacity>
            <TouchableOpacity style={[styles.optionCard, {height: 80}]} onPress={() => { setShowAddSheet(false); navigation.navigate('AdminDiscountEventGiftPercentage'); }}> 
              <Svg width={48} height={48} viewBox="0 0 48 48" fill="none">
                <G clipPath="url(#clip0_5833_54454)">
                  <Path d="M47.9063 4.21472V30.0751C47.9063 32.3741 46.0411 34.2393 43.741 34.2393H4.07044C1.77026 34.2393 -0.09375 32.3741 -0.09375 30.0751V4.21472C-0.09375 1.93945 1.75085 0.09375 4.02649 0.09375H43.7853C46.0606 0.09375 47.9063 1.93945 47.9063 4.21472Z" fill="#D8ECFE"/>
                  <Path d="M33.5884 39.7958L23.9069 42.0018L14.2246 39.7958L15.551 34.2396L23.4956 31.3184L32.262 34.2396L32.6912 36.0381L33.5884 39.7958Z" fill="#537983"/>
                  <Path d="M47.9063 29.584V30.0736C47.9063 32.3738 46.0411 34.2389 43.741 34.2389H4.07044C1.77026 34.2389 -0.09375 32.3738 -0.09375 30.0736V29.584H47.9063Z" fill="#678D98"/>
                  <Path d="M33.5878 39.7968H18.7793L19.6765 36.0391H32.6906L33.5878 39.7968Z" fill="#3C3F4D"/>
                  <Path d="M39.2931 42.8893V44.2087H8.51855V42.8893C8.51855 41.1809 9.90356 39.7959 11.6119 39.7959H36.1997C37.9081 39.7959 39.2931 41.1809 39.2931 42.8893Z" fill="#678D98"/>
                  <Path d="M42.7752 34.2395H21.0391L22.1036 23.9893H41.7102L42.7752 34.2395Z" fill="#82AEE3"/>
                  <Path d="M22.3478 12.4415L22.0911 14.4004L21.2693 20.6593C21.1213 21.7865 20.1615 22.6292 19.024 22.6292H9.21436C8.07727 22.6292 7.11707 21.7865 6.96912 20.6593L5.89062 12.4415L14.1194 10.2373L22.3478 12.4415Z" fill="#26A6FE"/>
                  <Path d="M22.0909 14.4004L21.2691 20.6593C21.1212 21.7865 20.1613 22.6292 19.0239 22.6292H12.349C11.2115 22.6292 10.2517 21.7865 10.1037 20.6593L9.54671 16.4175C9.40645 15.3489 10.2385 14.4004 11.3162 14.4004H22.0909Z" fill="#60B7FF"/>
                  <Path d="M23.4738 10.226V11.4249C23.4738 11.9863 23.0186 12.4419 22.4572 12.4419H5.78064C5.21924 12.4419 4.76367 11.9863 4.76367 11.4249V10.226C4.76367 9.66455 5.21924 9.20898 5.78064 9.20898H22.4572C23.0186 9.20898 23.4738 9.66455 23.4738 10.226Z" fill="#26A6FE"/>
                  <Path d="M23.4742 10.226V11.4249C23.4742 11.9863 23.019 12.4419 22.4576 12.4419H9.69922C9.13818 12.4419 8.68262 11.9863 8.68262 11.4249V10.226C8.68262 9.66455 9.13818 9.20898 9.69922 9.20898H22.4576C23.019 9.20898 23.4742 9.66455 23.4742 10.226Z" fill="#60B7FF"/>
                  <Path d="M14.1187 4.60449C13.1987 4.60449 12.4531 5.3501 12.4531 6.26965V14.2043C12.4531 15.1243 13.1987 15.8699 14.1187 15.8699C15.0382 15.8699 15.7838 15.1243 15.7838 14.2043V6.26965C15.7838 5.3501 15.0382 4.60449 14.1187 4.60449Z" fill="#495959"/>
                  <Path d="M42.6769 34.2389H20.9404L21.4235 29.584H42.1939L42.6769 34.2389Z" fill="#2D303B"/>
                  <Path d="M42.9821 23.9883H23.3759L20.8779 48.0289H45.48L42.9821 23.9883Z" fill="#FC502A"/>
                  <Path d="M31.4819 31.7617H17.8534L16.1172 48.0292H33.2185L31.4819 31.7617Z" fill="#FFC344"/>
                  <Path d="M38.47 27.0748C38.0638 27.0748 37.735 26.746 37.735 26.3402V21.4919C37.735 18.9801 35.6919 16.937 33.1804 16.937C30.6686 16.937 28.6255 18.9805 28.6255 21.4919V26.3402C28.6255 26.746 28.2966 27.0748 27.8909 27.0748C27.4851 27.0748 27.1562 26.746 27.1562 26.3402V21.4919C27.1562 18.17 29.8585 15.4678 33.1804 15.4678C36.502 15.4678 39.2046 18.17 39.2046 21.4919V26.3402C39.2046 26.746 38.8757 27.0748 38.47 27.0748Z" fill="white"/>
                  <Path d="M24.6664 41.7816C22.5193 41.7816 20.7725 40.0348 20.7725 37.8877V34.7288C20.7725 34.323 21.1017 33.9941 21.5074 33.9941C21.9132 33.9941 22.2421 34.323 22.2421 34.7288V37.8877C22.2421 39.2244 23.3297 40.312 24.6664 40.312C26.0034 40.312 27.0907 39.2247 27.0907 37.8877V34.7288C27.0907 34.323 27.4196 33.9941 27.8253 33.9941C28.2311 33.9941 28.5599 34.323 28.5599 34.7288V37.8877C28.5599 40.0348 26.8135 41.7816 24.6664 41.7816Z" fill="#495959"/>
                  <Path d="M30.8508 8.2915H27.7161C27.3103 8.2915 26.9814 7.96265 26.9814 7.55688C26.9814 7.15112 27.3103 6.82227 27.7161 6.82227H30.8508C31.2566 6.82227 31.5854 7.15112 31.5854 7.55688C31.5854 7.96265 31.2566 8.2915 30.8508 8.2915Z" fill="#FC502A"/>
                  <Path d="M44.2719 8.2915H34.0842C33.6785 8.2915 33.3496 7.96265 33.3496 7.55688C33.3496 7.15112 33.6785 6.82227 34.0842 6.82227H44.2719C44.678 6.82227 45.0068 7.15112 45.0068 7.55688C45.0068 7.96265 44.6776 8.2915 44.2719 8.2915Z" fill="#495959"/>
                  <Path d="M30.8508 11.7216H27.7161C27.3103 11.7216 26.9814 11.3923 26.9814 10.9866C26.9814 10.5808 27.3103 10.252 27.7161 10.252H30.8508C31.2566 10.252 31.5854 10.5808 31.5854 10.9866C31.5854 11.3923 31.2566 11.7216 30.8508 11.7216Z" fill="#FC502A"/>
                  <Path d="M44.2719 11.7216H34.0842C33.6785 11.7216 33.3496 11.3923 33.3496 10.9866C33.3496 10.5808 33.6785 10.252 34.0842 10.252H44.2719C44.678 10.252 45.0068 10.5808 45.0068 10.9866C45.0068 11.3923 44.6776 11.7216 44.2719 11.7216Z" fill="#495959"/>
                </G>
                <Defs>
                  <ClipPath id="clip0_5833_54454">
                    <Rect width="48" height="48" fill="white"/>
                  </ClipPath>
                </Defs>
              </Svg>
              <View style={styles.optionTextWrap}>
                <Text style={styles.optionTitle}>Event Gift</Text>
                <Text style={styles.optionSubtitle}>Discount UPS shipping and or air cargo.</Text>
              </View>
            </TouchableOpacity>
          </ScrollView>
          {insets.bottom === 0 && (
            <View style={styles.sheetHomeIndicator}>
              <View style={styles.sheetGestureBar} />
            </View>
          )}
        </View>
      </ActionSheet>

      {/* Sort Action Sheet */}
      <Modal
        visible={showSortSheet}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowSortSheet(false)}
      >
        <TouchableOpacity
          style={styles.sortModalOverlay}
          activeOpacity={1}
          onPress={() => setShowSortSheet(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.sortSheetContainer}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <View style={styles.sortTitleRow}>
              <Text style={styles.sortTitleText}>Sort</Text>
              <TouchableOpacity
                style={styles.sortCloseButton}
                onPress={() => setShowSortSheet(false)}
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.46967 5.46967C5.76256 5.17678 6.23744 5.17678 6.53033 5.46967L12 10.9393L17.4697 5.46967C17.7626 5.17678 18.2374 5.17678 18.5303 5.46967C18.8232 5.76256 18.8232 6.23744 18.5303 6.53033L13.0607 12L18.5303 17.4697C18.8232 17.7626 18.8232 18.2374 18.5303 18.5303C18.2374 18.8232 17.7626 18.8232 17.4697 18.5303L12 13.0607L6.53033 18.5303C6.23744 18.8232 5.76256 18.8232 5.46967 18.5303C5.17678 18.2374 5.17678 17.7626 5.46967 17.4697L10.9393 12L5.46967 6.53033C5.17678 6.23744 5.17678 5.76256 5.46967 5.46967Z"
                    fill="#7F8D91"
                  />
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.sortContent}>
              {/* Option 1: Newest */}
              <TouchableOpacity
                style={styles.sortOptionRow}
                onPress={() => setSortBy('newest')}
              >
                <View style={styles.sortOptionLeft}>
                  <Text style={styles.sortOptionText}>Newest</Text>
                </View>
                <View style={styles.sortOptionRight}>
                  <View style={[
                    styles.sortRadioButton,
                    sortBy === 'newest' && styles.sortRadioButtonSelected
                  ]}>
                    {sortBy === 'newest' && (
                      <View style={styles.sortRadioCircle} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Option 2: Oldest */}
              <TouchableOpacity
                style={styles.sortOptionRow}
                onPress={() => setSortBy('oldest')}
              >
                <View style={styles.sortOptionLeft}>
                  <Text style={styles.sortOptionText}>Oldest</Text>
                </View>
                <View style={styles.sortOptionRight}>
                  <View style={[
                    styles.sortRadioButton,
                    sortBy === 'oldest' && styles.sortRadioButtonSelected
                  ]}>
                    {sortBy === 'oldest' && (
                      <View style={styles.sortRadioCircle} />
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Action Button */}
            <View style={styles.sortActionRow}>
              <TouchableOpacity
                style={styles.sortApplyButton}
                onPress={handleApplySort}
              >
                <Text style={styles.sortApplyButtonText}>Apply</Text>
              </TouchableOpacity>
            </View>

            {/* Gesture Bar */}
            <View style={styles.sortGestureBarContainer}>
              <View style={styles.sortGestureBar} />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      {/* Status Filter Action Sheet */}
      <Modal
        visible={showStatusSheet}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setShowStatusSheet(false)}
      >
        <TouchableOpacity
          style={styles.sortModalOverlay}
          activeOpacity={1}
          onPress={() => setShowStatusSheet(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.statusSheetContainer}
            onPress={(e) => e.stopPropagation()}
          >
            {/* Title */}
            <View style={styles.sortTitleRow}>
              <Text style={styles.sortTitleText}>Discount Status</Text>
              <TouchableOpacity
                style={styles.sortCloseButton}
                onPress={() => setShowStatusSheet(false)}
              >
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
                  <Path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M5.46967 5.46967C5.76256 5.17678 6.23744 5.17678 6.53033 5.46967L12 10.9393L17.4697 5.46967C17.7626 5.17678 18.2374 5.17678 18.5303 5.46967C18.8232 5.76256 18.8232 6.23744 18.5303 6.53033L13.0607 12L18.5303 17.4697C18.8232 17.7626 18.8232 18.2374 18.5303 18.5303C18.2374 18.8232 17.7626 18.8232 17.4697 18.5303L12 13.0607L6.53033 18.5303C6.23744 18.8232 5.76256 18.8232 5.46967 18.5303C5.17678 18.2374 5.17678 17.7626 5.46967 17.4697L10.9393 12L5.46967 6.53033C5.17678 6.23744 5.17678 5.76256 5.46967 5.46967Z"
                    fill="#7F8D91"
                  />
                </Svg>
              </TouchableOpacity>
            </View>

            {/* Content */}
            <View style={styles.sortContent}>
              {/* Option 1: Active */}
              <TouchableOpacity
                style={styles.sortOptionRow}
                onPress={() => toggleStatus('Active')}
              >
                <View style={styles.sortOptionLeft}>
                  <Text style={styles.sortOptionText}>Active</Text>
                </View>
                <View style={styles.sortOptionRight}>
                  <View style={[
                    styles.statusCheckbox,
                    selectedStatuses.includes('Active') && styles.statusCheckboxSelected
                  ]}>
                    {selectedStatuses.includes('Active') && (
                      <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                        <Path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645C13.6583 2.95118 13.3417 2.95118 13.1464 3.14645L6 10.2929L2.85355 7.14645C2.65829 6.95118 2.34171 6.95118 2.14645 7.14645C1.95118 7.34171 1.95118 7.65829 2.14645 7.85355L5.64645 11.3536C5.84171 11.5488 6.15829 11.5488 6.35355 11.3536L13.8536 3.85355Z"
                          fill="#FFFFFF"
                        />
                      </Svg>
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Option 2: Scheduled */}
              <TouchableOpacity
                style={styles.sortOptionRow}
                onPress={() => toggleStatus('Scheduled')}
              >
                <View style={styles.sortOptionLeft}>
                  <Text style={styles.sortOptionText}>Scheduled</Text>
                </View>
                <View style={styles.sortOptionRight}>
                  <View style={[
                    styles.statusCheckbox,
                    selectedStatuses.includes('Scheduled') && styles.statusCheckboxSelected
                  ]}>
                    {selectedStatuses.includes('Scheduled') && (
                      <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                        <Path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645C13.6583 2.95118 13.3417 2.95118 13.1464 3.14645L6 10.2929L2.85355 7.14645C2.65829 6.95118 2.34171 6.95118 2.14645 7.14645C1.95118 7.34171 1.95118 7.65829 2.14645 7.85355L5.64645 11.3536C5.84171 11.5488 6.15829 11.5488 6.35355 11.3536L13.8536 3.85355Z"
                          fill="#FFFFFF"
                        />
                      </Svg>
                    )}
                  </View>
                </View>
              </TouchableOpacity>

              {/* Option 3: Expired */}
              <TouchableOpacity
                style={styles.sortOptionRow}
                onPress={() => toggleStatus('Expired')}
              >
                <View style={styles.sortOptionLeft}>
                  <Text style={styles.sortOptionText}>Expired</Text>
                </View>
                <View style={styles.sortOptionRight}>
                  <View style={[
                    styles.statusCheckbox,
                    selectedStatuses.includes('Expired') && styles.statusCheckboxSelected
                  ]}>
                    {selectedStatuses.includes('Expired') && (
                      <Svg width={16} height={16} viewBox="0 0 16 16" fill="none">
                        <Path
                          fillRule="evenodd"
                          clipRule="evenodd"
                          d="M13.8536 3.85355C14.0488 3.65829 14.0488 3.34171 13.8536 3.14645C13.6583 2.95118 13.3417 2.95118 13.1464 3.14645L6 10.2929L2.85355 7.14645C2.65829 6.95118 2.34171 6.95118 2.14645 7.14645C1.95118 7.34171 1.95118 7.65829 2.14645 7.85355L5.64645 11.3536C5.84171 11.5488 6.15829 11.5488 6.35355 11.3536L13.8536 3.85355Z"
                          fill="#FFFFFF"
                        />
                      </Svg>
                    )}
                  </View>
                </View>
              </TouchableOpacity>
            </View>

            {/* Action Buttons */}
            <View style={styles.statusActionRow}>
              <TouchableOpacity
                style={styles.statusClearButton}
                onPress={handleClearStatus}
              >
                <Text style={styles.statusClearButtonText}>Clear</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={styles.statusViewButton}
                onPress={handleApplyStatus}
              >
                <Text style={styles.statusViewButtonText}>View</Text>
              </TouchableOpacity>
            </View>

            {/* Gesture Bar */}
            <View style={styles.sortGestureBarContainer}>
              <View style={styles.sortGestureBar} />
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

export default Discounts;

const styles = StyleSheet.create({
  header: {
    height: 58,
    minHeight: 58,
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    backgroundColor: '#FFFFFF',
  },
  backBtn: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 8,
    zIndex: 10,
  },
  backIcon: {
    fontSize: 22,
    color: '#393D40',
  },
  headerTitle: {
    position: 'absolute',
    left: 0,
    right: 0,
    textAlign: 'center',
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    zIndex: 1,
  },
  headerRight: {
    marginLeft: 'auto',
  },
  headerAction: {
    width: 44,
    height: 44,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#FFFFFF',
    zIndex: 10,
  },
  headerActionText: {
    fontSize: 18,
    color: '#556065',
    fontWeight: '700',
  },
  tabsRow: {
    height: 48,
    paddingTop: 2,
    paddingBottom: 12,
    paddingHorizontal: 15,
    flexDirection: 'row',
    gap: 8,
  },
  tabPill: {
    height: 34,
    minHeight: 34,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
    gap: 6,
    backgroundColor: '#FFFFFF',
  },
  tabPillText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    color: '#393D40',
  },
  listSection: {
    backgroundColor: '#F5F6F6',
    paddingHorizontal: 12,
    paddingTop: 12,
    paddingBottom: 16,
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
  },
  cardContent: {
    gap: 4,
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  codeText: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  usedText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  editBtn: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 4,
  },
  statusChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dot: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  statusText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
  },
  dividerSmall: {
    width: 4,
    height: 4,
    borderRadius: 100,
    backgroundColor: '#7F8D91',
  },
  dateRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  dateText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
  },
  dateSep: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
  },
  detailBlock: {
    paddingHorizontal: 6,
    paddingTop: 8,
  },
  detailWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    alignItems: 'center',
    gap: 4,
  },
  detailText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  detailDivider: {
    width: 4,
    height: 4,
    borderRadius: 100,
    backgroundColor: '#7F8D91',
  },
  // Action sheet styles
  sheetContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    overflow: 'hidden',
    flexDirection: 'column',
  },
  sheetIndicatorArea: {
    height: 24,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetIndicatorBar: {
    width: 148,
    height: 5,
    backgroundColor: '#E4E7E9',
    borderRadius: 100,
  },
  sheetContentScroll: {
    flex: 1,
  },
  sheetContent: {
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
    gap: 12,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    padding: 16,
    height: 92,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    backgroundColor: '#FFFFFF',
  },
  optionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: '#F2F4F5',
  },
  optionTextWrap: {
    flex: 1,
    justifyContent: 'center',
    gap: 4,
  },
  optionTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  optionSubtitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 17,
    color: '#647276',
  },
  sheetHomeIndicator: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: 34,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sheetGestureBar: {
    width: 148,
    height: 5,
    borderRadius: 100,
    backgroundColor: '#202325',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  loadingText: {
    marginTop: 16,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#647276',
  },
  emptyContainer: {
    paddingVertical: 60,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
    marginBottom: 8,
  },
  emptySubtext: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#647276',
    textAlign: 'center',
  },
  // Sort Sheet Styles
  sortModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sortSheetContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  sortTitleRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingHorizontal: 24,
    paddingBottom: 12,
    gap: 16,
  },
  sortTitleText: {
    flex: 1,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  sortCloseButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortContent: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 8,
    gap: 0,
  },
  sortOptionRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    width: SCREEN_WIDTH - 32,
    height: 48,
    minHeight: 48,
  },
  sortOptionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    gap: 8,
    flex: 1,
  },
  sortOptionText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
  },
  sortOptionRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 8,
    paddingRight: 16,
    gap: 8,
    flex: 1,
  },
  sortRadioButton: {
    width: 24,
    minWidth: 24,
    height: 24,
    minHeight: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#647276',
    borderRadius: 1000,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortRadioButtonSelected: {
    backgroundColor: '#539461',
    borderColor: '#539461',
  },
  sortRadioCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  sortActionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 0,
    gap: 8,
  },
  sortApplyButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    width: SCREEN_WIDTH - 48,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    flex: 1,
  },
  sortApplyButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    paddingHorizontal: 8,
  },
  sortGestureBarContainer: {
    position: 'absolute',
    width: SCREEN_WIDTH,
    height: 34,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  sortGestureBar: {
    width: 148,
    height: 5,
    borderRadius: 100,
    backgroundColor: '#202325',
  },
  // Status Sheet Styles
  statusSheetContainer: {
    width: SCREEN_WIDTH,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
  },
  statusCheckbox: {
    width: 24,
    minWidth: 24,
    height: 24,
    minHeight: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#647276',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  statusCheckboxSelected: {
    backgroundColor: '#539461',
    borderColor: '#539461',
  },
  statusActionRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 24,
    paddingBottom: 0,
    gap: 8,
  },
  statusClearButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    width: (SCREEN_WIDTH - 48 - 8) / 2,
    height: 48,
    minHeight: 48,
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    flex: 1,
  },
  statusClearButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#539461',
    paddingHorizontal: 8,
  },
  statusViewButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    width: (SCREEN_WIDTH - 48 - 8) / 2,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    flex: 1,
  },
  statusViewButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    paddingHorizontal: 8,
  },
});


