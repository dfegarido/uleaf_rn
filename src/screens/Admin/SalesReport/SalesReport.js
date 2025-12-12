import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useFocusEffect} from '@react-navigation/native';
import ScreenHeader from '../../../components/Admin/header';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import RightIcon from '../../../assets/icons/greylight/caret-right-regular.svg';
import CalendarIcon from '../../../assets/icons/greylight/calendar-blank-regular.svg';
import QuestionIcon from '../../../assets/icons/greylight/question-regular.svg';
import {getSalesReportApi} from '../../../components/Api/reportsApi';
import {getAdminJourneyMishapDataApi} from '../../../components/Api/orderManagementApi';
import {getPlantDetailApi} from '../../../components/Api/getPlantDetailApi';
import CountryFlagIcon from '../../../components/CountryFlagIcon/CountryFlagIcon';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const SalesReport = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const [loading, setLoading] = useState(false);
  const [reportData, setReportData] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState('Period');
  const [selectedCountry, setSelectedCountry] = useState('Country');
  const [selectedSeller, setSelectedSeller] = useState('Seller');
  const [selectedBuyer, setSelectedBuyer] = useState('Buyer');
  const [activeTab, setActiveTab] = useState(0);
  const [journeyMishapData, setJourneyMishapData] = useState([]);
  const [journeyMishapLoading, setJourneyMishapLoading] = useState(false);
  const [journeyMishapLoadingMore, setJourneyMishapLoadingMore] = useState(false);
  const [journeyMishapCount, setJourneyMishapCount] = useState(0);
  const [journeyMishapOffset, setJourneyMishapOffset] = useState(0);
  const [journeyMishapHasMore, setJourneyMishapHasMore] = useState(true);
  const [journeyMishapTotalRecords, setJourneyMishapTotalRecords] = useState(0);

  // Optimistic update function
  const updateCreditRequestStatus = (creditRequestId, newStatus) => {
    setJourneyMishapData(prevData => {
      const updatedData = prevData.map(item => {
        if (item.id === creditRequestId) {
          const getCreditStatusText = (status) => {
            switch (status?.toLowerCase()) {
              case 'approved':
                return 'Credit Approved';
              case 'pending':
                return 'Pending Review';
              case 'rejected':
                return 'Credit Rejected';
              default:
                return 'Pending Review';
            }
          };
          
          const getCreditStatusColor = (status) => {
            switch (status?.toLowerCase()) {
              case 'approved':
                return '#23C16B';
              case 'pending':
                return '#48A7F8';
              case 'rejected':
                return '#E7522F';
              default:
                return '#48A7F8';
            }
          };
          
          return {
            ...item,
            status: newStatus,
            creditStatus: getCreditStatusText(newStatus),
            creditStatusColor: getCreditStatusColor(newStatus)
          };
        }
        return item;
      });
      
      // Update badge count to only show pending requests
      const pendingCount = updatedData.filter(item => item.status === 'pending').length;
      setJourneyMishapCount(pendingCount);
      
      return updatedData;
    });
  };
  const [tooltipVisible, setTooltipVisible] = useState(null); // Store the plant ID that has tooltip visible

  // Sample data structure - all zeros for now
  const sampleTableData = [
    {period: 'APR 10', totalSales: '0', plantSold: '0', plantListed: '0', percentSold: '0%'},
    {period: 'MAR 10', totalSales: '0', plantSold: '0', plantListed: '0', percentSold: '0%'},
    {period: 'FEB 10', totalSales: '0', plantSold: '0', plantListed: '0', percentSold: '0%'},
    {period: 'JAN 10', totalSales: '0', plantSold: '0', plantListed: '0', percentSold: '0%'},
  ];

  const sampleChartData = [
    {date: 'MAR 24 MAR 30', totalListing: 0, sold: 0},
    {date: 'MAR 17 MAR 23', totalListing: 0, sold: 0},
    {date: 'MAR 10 MAR 16', totalListing: 0, sold: 0},
    {date: 'MAR 03 MAR 09', totalListing: 0, sold: 0},
  ];

  // API call disabled for now
  // useEffect(() => {
  //   fetchSalesReport();
  // }, [selectedPeriod, selectedCountry, selectedSeller, selectedBuyer]);

  // const fetchSalesReport = async () => {
  //   try {
  //     setLoading(true);
  //     const response = await getSalesReportApi({
  //       period: selectedPeriod,
  //       country: selectedCountry,
  //       seller: selectedSeller,
  //       buyer: selectedBuyer,
  //     });
  //     if (response.success) {
  //       setReportData(response.data);
  //     }
  //   } catch (error) {
  //     console.error('Error fetching sales report:', error);
  //   } finally {
  //     setLoading(false);
  //   }
  // };

  const formatNumber = (num) => {
    if (num >= 1000) {
      return `${(num / 1000).toFixed(1)}k`;
    }
    return num.toString();
  };

  // Refresh journey mishap data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      // Fetch data when screen is focused (reset to first page)
      fetchJourneyMishapData(false);
    }, [])
  );

  // Handle scroll for infinite loading
  const handleWildgoneScroll = (event) => {
    if (!journeyMishapHasMore || journeyMishapLoadingMore || journeyMishapLoading) {
      return;
    }

    const {contentOffset, contentSize, layoutMeasurement} = event.nativeEvent;
    const scrollPosition = contentOffset.y;
    const contentHeight = contentSize.height;
    const screenHeight = layoutMeasurement.height;

    // Calculate middle point (50% of content)
    const middlePoint = contentHeight / 2;

    // Trigger load more when user scrolls past the middle
    if (scrollPosition + screenHeight >= middlePoint) {
      console.log('📜 Loading more Journey Mishap data...');
      fetchJourneyMishapData(true);
    }
  };

  const calculateBarHeight = (value, maxValue) => {
    const maxHeight = 174; // Max bar height from design
    if (maxValue === 0) return 0; // Return 0 if all values are zero
    return (value / maxValue) * maxHeight;
  };

  // Set maxChartValue to 1 to avoid division by zero, but bars will still be 0
  const maxChartValue = Math.max(
    ...sampleChartData.map(d => Math.max(d.totalListing, d.sold)),
    1 // Default to 1 to avoid division by zero
  );

  // Fetch Journey Mishap data when Wildgone tab is active
  useEffect(() => {
    if (activeTab === 2) {
      fetchJourneyMishapData();
    }
  }, [activeTab]);

  const fetchJourneyMishapData = async (loadMore = false) => {
    try {
      if (loadMore) {
        setJourneyMishapLoadingMore(true);
      } else {
        setJourneyMishapLoading(true);
        setJourneyMishapOffset(0);
      }

      const currentOffset = loadMore ? journeyMishapOffset : 0;
      
      const response = await getAdminJourneyMishapDataApi({
        limit: 10,
        offset: currentOffset,
        includeOrderDetails: true,
        includeListingDetails: true,
        includePlantDetails: true,
        includeSellerInfo: true,
      });

      if (response.success && response.data?.data) {
        const creditRequests = response.data.data.creditRequests || [];
        const totalRecords = response.data.data.totalRecords || 0;
        
        setJourneyMishapTotalRecords(totalRecords);
        
        // Count only pending requests for the badge (from total, not just this page)
        const allData = loadMore ? [...journeyMishapData, ...creditRequests] : creditRequests;
        const pendingCount = allData.filter(req => req.status === 'pending').length;
        setJourneyMishapCount(pendingCount);
        
        
        // Log the raw data to inspect plant details structure
        console.log('🌿 Plant Details Debug (First Request):', {
          requestId: creditRequests[0]?.requestId || creditRequests[0]?.id,
          plantDetails: creditRequests[0]?.plantDetails,
          orderDetails: creditRequests[0]?.orderDetails ? {
            hasProducts: !!creditRequests[0].orderDetails.products,
            productsCount: creditRequests[0].orderDetails.products?.length,
            firstProduct: creditRequests[0].orderDetails.products?.[0],
            plantSourceCountry: creditRequests[0].orderDetails.plantSourceCountry,
            country: creditRequests[0].orderDetails.country,
            sellerUid: creditRequests[0].orderDetails.sellerUid,
            supplierUid: creditRequests[0].orderDetails.supplierUid,
            // Date fields
            createdAt: creditRequests[0].orderDetails.createdAt,
            orderDate: creditRequests[0].orderDetails.orderDate,
            dateCreated: creditRequests[0].orderDetails.dateCreated,
            // Transaction info
            transactionNumber: creditRequests[0].orderDetails.transactionNumber,
            trackingNumber: creditRequests[0].orderDetails.trackingNumber,
            awbNumber: creditRequests[0].orderDetails.awbNumber,
            // Pricing
            shippingCost: creditRequests[0].orderDetails.shippingCost,
            totalShippingCost: creditRequests[0].orderDetails.totalShippingCost
          } : null,
          listingDetails: creditRequests[0]?.listingDetails,
          sellerInfo: creditRequests[0]?.sellerInfo,
          supplierInfo: creditRequests[0]?.supplierInfo,
          plantSourceCountry: creditRequests[0]?.plantSourceCountry,
          country: creditRequests[0]?.country
        });
        
        // Transform the data for display (with async image fetching)
        const transformedDataPromises = creditRequests.map((item, index) => 
          transformJourneyMishapItem(item, index, creditRequests)
        );
        const transformedData = await Promise.all(transformedDataPromises);
        
        if (loadMore) {
          setJourneyMishapData(prev => [...prev, ...transformedData]);
          setJourneyMishapOffset(currentOffset + creditRequests.length);
        } else {
          setJourneyMishapData(transformedData);
          setJourneyMishapOffset(creditRequests.length);
        }
        
        // Check if there's more data to load
        const hasMore = (currentOffset + creditRequests.length) < totalRecords;
        setJourneyMishapHasMore(hasMore);
      } else {
        console.error('Failed to fetch Journey Mishap data:', response.error);
        if (!loadMore) {
          setJourneyMishapData([]);
          setJourneyMishapCount(0);
        }
        setJourneyMishapHasMore(false);
      }
    } catch (error) {
      console.error('Error fetching Journey Mishap data:', error);
      if (!loadMore) {
        setJourneyMishapData([]);
        setJourneyMishapCount(0);
      }
      setJourneyMishapHasMore(false);
    } finally {
      if (loadMore) {
        setJourneyMishapLoadingMore(false);
      } else {
        setJourneyMishapLoading(false);
      }
    }
  };

  // Transform Journey Mishap API data to component format
  const transformJourneyMishapItem = async (creditRequest, index, array) => {
    // Store reference to array for logging
    const creditRequests = array;
    const orderDetails = creditRequest.orderDetails || {};
    const listingDetails = creditRequest.listingDetails || {};
    const plantDetails = creditRequest.plantDetails || listingDetails.plantDetails || {};
    const orderProduct = orderDetails.products?.find(product => product.plantCode === creditRequest.plantCode) || {};

    // Get buyer information (from API response or order details)
    const buyerUid = creditRequest.buyerUid || orderDetails.buyerUid;
    const buyerInfo = creditRequest.buyerInfo || 
                     orderDetails.buyerInfo || 
                     orderDetails.buyer || 
                     orderDetails.buyerDetails ||
                     {};


    // Extract buyer name - try multiple field combinations
    const getBuyerName = () => {
      // Try fullName first
      if (buyerInfo.fullName) return buyerInfo.fullName;
      
      // Try firstName + lastName combination
      if (buyerInfo.firstName || buyerInfo.lastName) {
        const fullName = `${buyerInfo.firstName || ''} ${buyerInfo.lastName || ''}`.trim();
        if (fullName) return fullName;
      }
      
      // Try displayName
      if (buyerInfo.displayName) return buyerInfo.displayName;
      
      // Try name
      if (buyerInfo.name) return buyerInfo.name;
      
      // Try username
      if (buyerInfo.username) return buyerInfo.username;
      
      // Try email (extract name part)
      if (buyerInfo.email) {
        const emailName = buyerInfo.email.split('@')[0];
        return emailName.charAt(0).toUpperCase() + emailName.slice(1);
      }
      
      return 'Unknown User';
    };

    const getBuyerUsername = () => {
      if (buyerInfo.username) return `@${buyerInfo.username}`;
      if (buyerInfo.email) return buyerInfo.email;
      if (buyerUid) return `@${buyerUid.substring(0, 8)}`;
      return '@unknown';
    };

    // Format date - use createdAt as the requested date (when user requested credit)
    // Priority: createdAt (when credit was requested) > requestDate > requestedAt
    const requestDate = creditRequest.createdAt || 
                       creditRequest.requestDate || 
                       creditRequest.requestedAt ||
                       creditRequest.date;
    
    let formattedDate = 'Requested N/A';
    if (requestDate) {
      try {
        // Handle ISO string dates from backend
        let dateObj;
        if (typeof requestDate === 'string') {
          dateObj = new Date(requestDate);
        } else if (requestDate.toDate) {
          // Firestore timestamp object
          dateObj = requestDate.toDate();
        } else if (requestDate instanceof Date) {
          dateObj = requestDate;
        } else {
          dateObj = new Date(requestDate);
        }
        
        if (!isNaN(dateObj.getTime())) {
          // Format: "Requested Jun-5-2025" (no leading zero on day)
          const month = dateObj.toLocaleDateString('en-US', { month: 'short' });
          const day = dateObj.getDate().toString(); // No leading zero
          const year = dateObj.getFullYear();
          formattedDate = `Requested ${month}-${day}-${year}`;
          
        } else {
          console.warn('Invalid date value:', requestDate, 'Type:', typeof requestDate);
        }
      } catch (error) {
        console.error('Error formatting date:', error, 'Raw date:', requestDate, 'Type:', typeof requestDate);
      }
    } else {
      console.warn('⚠️ No request date found for credit request:', {
        requestId: creditRequest.requestId || creditRequest.id,
        hasCreatedAt: !!creditRequest.createdAt,
        hasRequestDate: !!creditRequest.requestDate,
        hasRequestedAt: !!creditRequest.requestedAt,
        creditRequestKeys: Object.keys(creditRequest).filter(k => 
          k.toLowerCase().includes('date') || 
          k.toLowerCase().includes('created') || 
          k.toLowerCase().includes('time')
        )
      });
    }

    // Get seller/supplier information for country
    const sellerInfo = creditRequest.sellerInfo || orderDetails.sellerInfo || {};
    const supplierInfo = creditRequest.supplierInfo || orderDetails.supplierInfo || {};
    
    // Get country code - prioritize seller's country
    const countryCode = sellerInfo.country ||
                       supplierInfo.country ||
                       orderDetails.plantSourceCountry || 
                       plantDetails?.plantSourceCountry || 
                       plantDetails?.country ||
                       orderProduct?.plantSourceCountry ||
                       orderProduct?.country ||
                       listingDetails?.plantSourceCountry || 
                       creditRequest.plantSourceCountry ||
                       creditRequest.country ||
                       'ID'; // Default to Indonesia
    const countryCodeShort = countryCode.length > 2 ? countryCode.substring(0, 2).toUpperCase() : countryCode.toUpperCase();
    
    // Log country info for debugging (first item only)
    if (index === 0) {
      console.log('🏳️ Country Debug:', {
        requestId: creditRequest.requestId || creditRequest.id,
        plantCode: creditRequest.plantCode,
        rawCountryCode: countryCode,
        countryCodeShort: countryCodeShort,
        sources: {
          sellerCountry: sellerInfo.country,
          supplierCountry: supplierInfo.country,
          orderDetailsPlantSourceCountry: orderDetails.plantSourceCountry,
          plantDetails: plantDetails?.plantSourceCountry || plantDetails?.country,
          orderProduct: orderProduct?.plantSourceCountry || orderProduct?.country,
          listingDetails: listingDetails?.plantSourceCountry,
          creditRequest: creditRequest.plantSourceCountry || creditRequest.country
        }
      });
    }

    // Get plant image - check multiple sources first
    let plantImage = plantDetails?.imageCollectionWebp?.[0] ||
                    plantDetails?.imagePrimary ||
                    plantDetails?.image ||
                    plantDetails?.imageCollection?.[0] ||
                    orderProduct?.imageCollectionWebp?.[0] || 
                    orderProduct?.imagePrimary || 
                    orderProduct?.images?.[0] ||
                    orderProduct?.image ||
                    listingDetails?.imageCollectionWebp?.[0] ||
                    listingDetails?.imagePrimary ||
                    listingDetails?.image ||
                    null;

    // If no image found, fetch plant details as fallback
    if (!plantImage && creditRequest.plantCode) {
      try {
        console.log('🖼️ Fetching plant image for:', creditRequest.plantCode);
        const plantDetailResponse = await getPlantDetailApi(creditRequest.plantCode);
        if (plantDetailResponse.success && plantDetailResponse.data) {
          const fetchedPlantData = plantDetailResponse.data;
          plantImage = fetchedPlantData.imageCollectionWebp?.[0] ||
                      fetchedPlantData.imagePrimary ||
                      fetchedPlantData.image ||
                      fetchedPlantData.imageCollection?.[0] ||
                      null;
          console.log('✅ Fetched plant image:', plantImage ? 'Found' : 'Not found');
        }
      } catch (error) {
        console.warn('Failed to fetch plant details for image:', error);
      }
    }

    // Determine credit status color
    const getCreditStatusColor = (status) => {
      switch (status?.toLowerCase()) {
        case 'approved':
          return '#23C16B';
        case 'pending':
          return '#48A7F8';
        case 'rejected':
          return '#E7522F';
        default:
          return '#48A7F8';
      }
    };

    const getCreditStatusText = (status) => {
      switch (status?.toLowerCase()) {
        case 'approved':
          return 'Credit Approved';
        case 'pending':
          return 'Pending Review';
        case 'rejected':
          return 'Credit Rejected';
        default:
          return 'Pending Review';
      }
    };

    const transformedItem = {
      id: creditRequest.requestId || creditRequest.id,
      fulfillmentStatus: 'Journey Mishap',
      status: creditRequest.status, // Raw status for logic checks (approved, rejected, pending)
      creditStatus: getCreditStatusText(creditRequest.status),
      creditStatusColor: getCreditStatusColor(creditRequest.status),
      date: formattedDate,
      rawDate: requestDate, // Keep the raw date for detail screen formatting
      userName: getBuyerName(),
      userUsername: getBuyerUsername(),
      userRole: buyerInfo.role || 'Buyer',
      userAvatar: buyerInfo.avatar || 
                 buyerInfo.profileImage || 
                 buyerInfo.profilePhotoUrl ||
                 null,
      plantCode: creditRequest.plantCode || orderProduct?.plantCode || '',
      country: countryCodeShort,
      genusSpecie: plantDetails?.plantName || 
                  plantDetails?.scientificName ||
                  orderProduct?.plantName || 
                  orderProduct?.title || 
                  `${plantDetails?.genus || ''} ${plantDetails?.species || ''}`.trim() ||
                  listingDetails?.title ||
                  'Unknown Plant',
      variegation: plantDetails?.variegation ||
                  orderProduct?.variegation || 
                  listingDetails?.variegation || 
                  'Standard',
      size: plantDetails?.potSize ||
            orderProduct?.potSize || 
            listingDetails?.potSize || 
            '',
      views: '0', // Views not available in credit request data
      listingType: orderProduct?.listingType || listingDetails?.listingType || 'Single Plant',
      price: `$${(
        plantDetails?.unitPrice ||
        plantDetails?.totalPrice ||
        orderProduct?.price ||
        orderProduct?.finalPrice ||
        orderProduct?.unitPrice ||
        listingDetails?.finalPrice ||
        listingDetails?.price ||
        creditRequest.orderAmount ||
        creditRequest.amount ||
        0
      ).toFixed(2)}`,
      quantity: plantDetails?.quantity || orderProduct?.quantity || creditRequest.quantity || 1,
      plantImage: plantImage,
      issueType: creditRequest.issueType || 'Unknown Issue',
      orderId: creditRequest.orderId,
      creditRequestId: creditRequest.requestId || creditRequest.id,
      // Additional fields for detail screen
      description: creditRequest.description || '',
      attachments: creditRequest.attachments || [],
      trackingNumber: orderDetails?.trackingNumber || orderDetails?.awbNumber || 'N/A',
      orderDate: (() => {
        // Convert Firestore Timestamp to ISO string
        const dateField = orderDetails?.createdAt || orderDetails?.orderDate || orderDetails?.dateCreated;
        if (!dateField) return null;
        if (dateField._seconds) {
          // Firestore Timestamp object
          return new Date(dateField._seconds * 1000 + (dateField._nanoseconds || 0) / 1000000).toISOString();
        }
        return dateField;
      })(),
      transactionNumber: orderDetails?.transactionNumber || creditRequest.orderId,
      shippingCost: `$${(orderDetails?.shippingCost || orderDetails?.totalShippingCost || 0).toFixed(2)}`,
      // Supplier/Seller info
      supplierInfo: supplierInfo,
      sellerInfo: supplierInfo, // Using supplierInfo as sellerInfo
      // Receiver info if different from buyer
      receiverInfo: orderDetails?.receiverInfo || null,
    };

    // Log the transformed item (first item only) to verify all fields
    if (index === 0) {
      console.log('🔍 Transformed Item (First):', {
        id: transformedItem.id,
        date: transformedItem.date,
        userName: transformedItem.userName,
        plantCode: transformedItem.plantCode,
        genusSpecie: transformedItem.genusSpecie,
        price: transformedItem.price,
        plantImage: transformedItem.plantImage,
        variegation: transformedItem.variegation,
        size: transformedItem.size,
        allKeys: Object.keys(transformedItem)
      });
    }

    return transformedItem;
  };

  // Render Wildgone plant items from real data
  const renderWildgonePlantItems = () => {
    if (journeyMishapLoading) {
      // Skeleton Loading
      return [1, 2, 3].map((skeletonItem) => (
        <View key={`skeleton-${skeletonItem}`} style={styles.plantItemContainer}>
          {/* Skeleton Details Section */}
          <View style={styles.plantDetailsSection}>
            {/* Skeleton Status Row */}
            <View style={styles.fulfillmentStatusRow}>
              <View style={[styles.skeletonBox, {width: 120, height: 20}]} />
              <View style={[styles.skeletonBox, {width: 80, height: 24, borderRadius: 12}]} />
            </View>

            {/* Skeleton Date */}
            <View style={styles.plantDateRow}>
              <View style={styles.dateContent}>
                <View style={[styles.skeletonBox, {width: 24, height: 24, borderRadius: 4}]} />
                <View style={[styles.skeletonBox, {width: 150, height: 16}]} />
              </View>
            </View>

            {/* Skeleton User Section */}
            <View style={styles.userSection}>
              <View style={styles.userRow}>
                <View style={styles.skeletonCircle} />
                <View style={styles.userContent}>
                  <View style={styles.userNameRow}>
                    <View style={[styles.skeletonBox, {width: 120, height: 16}]} />
                    <View style={[styles.skeletonBox, {width: 80, height: 14}]} />
                  </View>
                  <View style={styles.userRoleRow}>
                    <View style={[styles.skeletonBox, {width: 60, height: 14}]} />
                  </View>
                </View>
              </View>
            </View>
          </View>

          {/* Skeleton Plant Card */}
          <View style={styles.plantCard}>
            <View style={styles.plantImageContainer}>
              <View style={styles.skeletonPlantImage} />
            </View>
            <View style={styles.plantDetails}>
              <View style={styles.codeCountryRow}>
                <View style={[styles.skeletonBox, {width: 100, height: 14}]} />
                <View style={[styles.skeletonBox, {width: 40, height: 20}]} />
              </View>
              <View style={[styles.skeletonBox, {width: '90%', height: 16, marginTop: 4}]} />
              <View style={styles.plantMetaRow}>
                <View style={[styles.skeletonBox, {width: 60, height: 14}]} />
                <View style={[styles.skeletonBox, {width: 60, height: 14}]} />
                <View style={[styles.skeletonBox, {width: 60, height: 14}]} />
              </View>
              <View style={styles.plantPriceRow}>
                <View style={[styles.skeletonBox, {width: 50, height: 18}]} />
                <View style={[styles.skeletonBox, {width: 40, height: 14}]} />
              </View>
            </View>
          </View>
        </View>
      ));
    }

    if (journeyMishapData.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No Journey Mishap requests found</Text>
        </View>
      );
    }

    return journeyMishapData.map((plant) => (
      <TouchableOpacity 
        key={plant.id} 
        style={styles.plantItemContainer}
        onPress={() => navigation.navigate('JourneyMishapDetail', {
          creditRequest: plant,
          onStatusUpdate: updateCreditRequestStatus
        })}
        activeOpacity={0.7}
      >
        {/* Details Section */}
        <View style={styles.plantDetailsSection}>
          {/* Plant / Fulfillment Status */}
          <View style={styles.fulfillmentStatusRow}>
            <Text style={styles.fulfillmentStatusText}>{plant.fulfillmentStatus}</Text>
            <View style={[styles.creditStatusBadge, {backgroundColor: plant.creditStatusColor}]}>
              <Text style={styles.creditStatusText}>{plant.creditStatus}</Text>
            </View>
          </View>

          {/* Plant / Date */}
          <View style={styles.plantDateRow}>
            <View style={styles.dateContent}>
              <CalendarIcon width={24} height={24} />
              <Text style={styles.dateText}>{plant.date}</Text>
            </View>
          </View>

          {/* User Section */}
          <View style={styles.userSection}>
            <View style={styles.userRow}>
              <View style={styles.avatarContainer}>
                {plant.userAvatar ? (
                  <Image source={{uri: plant.userAvatar}} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatar} />
                )}
              </View>
              <View style={styles.userContent}>
                <View style={styles.userNameRow}>
                  <Text style={styles.userNameText}>{plant.userName}</Text>
                  <Text style={styles.userUsernameText}>{plant.userUsername}</Text>
                </View>
                <View style={styles.userRoleRow}>
                  <Text style={styles.userRoleText}>{plant.userRole}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Plant Card */}
        <View style={styles.plantCard}>
          {/* Image */}
          <View style={styles.plantImageContainer}>
            {plant.plantImage ? (
              <Image source={{uri: plant.plantImage}} style={styles.plantImage} />
            ) : (
              <View style={styles.plantImagePlaceholder} />
            )}
          </View>

          {/* Details */}
          <View style={styles.plantDetails}>
            {/* Code + Country */}
            <View style={styles.codeCountryRow}>
              <View style={styles.codeContainer}>
                <Text style={styles.plantCodeText}>{plant.plantCode}</Text>
                <TouchableOpacity 
                  onPress={() => setTooltipVisible(tooltipVisible === plant.id ? null : plant.id)}
                  style={styles.questionIconContainer}
                >
                  <QuestionIcon width={20} height={20} />
                  {tooltipVisible === plant.id && (
                    <View style={styles.tooltip}>
                      <Text style={styles.tooltipText}>Plant Code</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.countryContainer}>
                <Text style={styles.countryText}>{plant.country}</Text>
                <CountryFlagIcon code={plant.country} width={24} height={16} />
              </View>
            </View>

            {/* Genus + Specie */}
            <Text style={styles.genusSpecieText}>{plant.genusSpecie}</Text>

            {/* Variegation + Size */}
            <View style={styles.variegationSizeRow}>
              <Text style={styles.variegationText}>{plant.variegation}</Text>
              {plant.size && (
                <>
                  <View style={styles.dividerDot} />
                  <Text style={styles.sizeText}>{plant.size}</Text>
                </>
              )}
              {plant.views && plant.views !== '0' && (
                <>
                  <View style={styles.dividerDot} />
                  <Text style={styles.viewsText}>{plant.views} Views</Text>
                </>
              )}
            </View>

            {/* Type (if applicable) */}
            {plant.listingType && plant.listingType !== 'Single Plant' && (
              <View style={styles.typeRow}>
                <View style={styles.listingTypeBadge}>
                  <Text style={styles.listingTypeText}>{plant.listingType}</Text>
                </View>
              </View>
            )}

            {/* Price + Quantity */}
            <View style={styles.priceQuantityRow}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceText}>{plant.price}</Text>
              </View>
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityText}>{plant.quantity}x</Text>
              </View>
            </View>
          </View>
        </View>
      </TouchableOpacity>
    ));
  };

  // Legacy sample data (kept for reference, not used)
  const wildgonePlantDataSample = [
    {
      id: 1,
      fulfillmentStatus: 'Journey Mishap',
      creditStatus: 'Credit Approved',
      creditStatusColor: '#23C16B',
      date: 'MAR 10, 2024',
      userName: 'John Doe',
      userUsername: '@johndoe',
      userRole: 'Buyer',
      plantCode: 'PL-001',
      country: 'TH',
      genusSpecie: 'Monstera deliciosa',
      variegation: 'Inner Variegated',
      size: '4"',
      views: '1.2K',
      listingType: 'Single Plant',
      price: '$65.27',
      quantity: '1x',
    },
    {
      id: 2,
      fulfillmentStatus: 'Journey Mishap',
      creditStatus: 'Pending Review',
      creditStatusColor: '#48A7F8',
      date: 'MAR 15, 2024',
      userName: 'Jane Smith',
      userUsername: '@janesmith',
      userRole: 'Buyer',
      plantCode: 'PL-002',
      country: 'TH',
      genusSpecie: 'Philodendron birkin',
      variegation: 'White Stripe',
      size: '6"',
      views: '856',
      listingType: 'Multiple',
      price: '$89.50',
      quantity: '2x',
    },
    {
      id: 3,
      fulfillmentStatus: 'Journey Mishap',
      creditStatus: 'Credit Approved',
      creditStatusColor: '#23C16B',
      date: 'MAR 20, 2024',
      userName: 'John Doe',
      userUsername: '@johndoe',
      userRole: 'Buyer',
      plantCode: 'PL-003',
      country: 'TH',
      genusSpecie: 'Alocasia amazonica',
      variegation: 'Dark Green',
      size: '4"',
      views: '2.1K',
      listingType: 'Single Plant',
      price: '$45.00',
      quantity: '1x',
    },
    {
      id: 4,
      fulfillmentStatus: 'Journey Mishap',
      creditStatus: 'Credit Rejected',
      creditStatusColor: '#E7522F',
      date: 'MAR 25, 2024',
      userName: 'Jane Smith',
      userUsername: '@janesmith',
      userRole: 'Buyer',
      plantCode: 'PL-004',
      country: 'TH',
      genusSpecie: 'Ficus lyrata',
      variegation: 'Variegated',
      size: '8"',
      views: '3.5K',
      listingType: 'Single Plant',
      price: '$120.00',
      quantity: '1x',
    },
    {
      id: 5,
      fulfillmentStatus: 'Journey Mishap',
      creditStatus: 'Pending Review',
      creditStatusColor: '#48A7F8',
      date: 'MAR 28, 2024',
      userName: 'John Doe',
      userUsername: '@johndoe',
      userRole: 'Buyer',
      plantCode: 'PL-005',
      country: 'TH',
      genusSpecie: 'Monstera adansonii',
      variegation: 'Swiss Cheese',
      size: '6"',
      views: '1.8K',
      listingType: 'Multiple',
      price: '$75.30',
      quantity: '3x',
    },
    {
      id: 6,
      fulfillmentStatus: 'Journey Mishap',
      creditStatus: 'Credit Approved',
      creditStatusColor: '#23C16B',
      date: 'APR 01, 2024',
      userName: 'Jane Smith',
      userUsername: '@janesmith',
      userRole: 'Buyer',
      plantCode: 'PL-006',
      country: 'TH',
      genusSpecie: 'Pothos golden',
      variegation: 'Golden',
      size: '4"',
      views: '950',
      listingType: 'Single Plant',
      price: '$25.00',
      quantity: '1x',
    },
    {
      id: 7,
      fulfillmentStatus: 'Journey Mishap',
      creditStatus: 'Credit Rejected',
      creditStatusColor: '#E7522F',
      date: 'APR 05, 2024',
      userName: 'John Doe',
      userUsername: '@johndoe',
      userRole: 'Buyer',
      plantCode: 'PL-007',
      country: 'TH',
      genusSpecie: 'Sansevieria trifasciata',
      variegation: 'Laurentii',
      size: '6"',
      views: '1.5K',
      listingType: 'Single Plant',
      price: '$35.00',
      quantity: '1x',
    },
  ];

  // Legacy render function (replaced above)
  const renderWildgonePlantItemsLegacy = () => {
    return wildgonePlantDataSample.map((plant) => (
      <View key={plant.id} style={styles.plantItemContainer}>
        {/* Details Section */}
        <View style={styles.plantDetailsSection}>
          {/* Plant / Fulfillment Status */}
          <View style={styles.fulfillmentStatusRow}>
            <Text style={styles.fulfillmentStatusText}>{plant.fulfillmentStatus}</Text>
            <View style={[styles.creditStatusBadge, {backgroundColor: plant.creditStatusColor}]}>
              <Text style={styles.creditStatusText}>{plant.creditStatus}</Text>
            </View>
          </View>

          {/* Plant / Date */}
          <View style={styles.plantDateRow}>
            <View style={styles.dateContent}>
              <CalendarIcon width={24} height={24} />
              <Text style={styles.dateText}>{plant.date}</Text>
            </View>
          </View>

          {/* User Section */}
          <View style={styles.userSection}>
            <View style={styles.userRow}>
              <View style={styles.avatarContainer}>
                <View style={styles.avatar} />
              </View>
              <View style={styles.userContent}>
                <View style={styles.userNameRow}>
                  <Text style={styles.userNameText}>{plant.userName}</Text>
                  <Text style={styles.userUsernameText}>{plant.userUsername}</Text>
                </View>
                <View style={styles.userRoleRow}>
                  <Text style={styles.userRoleText}>{plant.userRole}</Text>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Plant Card */}
        <View style={styles.plantCard}>
          {/* Image */}
          <View style={styles.plantImageContainer}>
            <View style={styles.plantImage} />
          </View>

          {/* Details */}
          <View style={styles.plantDetails}>
            {/* Code + Country */}
            <View style={styles.codeCountryRow}>
              <View style={styles.codeContainer}>
                <Text style={styles.plantCodeText}>{plant.plantCode}</Text>
                <TouchableOpacity 
                  onPress={() => setTooltipVisible(tooltipVisible === plant.id ? null : plant.id)}
                  style={styles.questionIconContainer}
                >
                  <QuestionIcon width={20} height={20} />
                  {tooltipVisible === plant.id && (
                    <View style={styles.tooltip}>
                      <Text style={styles.tooltipText}>Plant Code</Text>
                    </View>
                  )}
                </TouchableOpacity>
              </View>
              <View style={styles.countryContainer}>
                <Text style={styles.countryText}>{plant.country}</Text>
                <CountryFlagIcon code={plant.country} width={24} height={16} />
              </View>
            </View>

            {/* Genus + Specie */}
            <Text style={styles.genusSpecieText}>{plant.genusSpecie}</Text>

            {/* Variegation + Size */}
            <View style={styles.variegationSizeRow}>
              <Text style={styles.variegationText}>{plant.variegation}</Text>
              <View style={styles.dividerDot} />
              <Text style={styles.sizeText}>{plant.size}</Text>
              <View style={styles.dividerDot} />
              <Text style={styles.viewsText}>{plant.views} Views</Text>
            </View>

            {/* Type (if applicable) */}
            {plant.listingType !== 'Single Plant' && (
              <View style={styles.typeRow}>
                <View style={styles.listingTypeBadge}>
                  <Text style={styles.listingTypeText}>{plant.listingType}</Text>
                </View>
              </View>
            )}

            {/* Price + Quantity */}
            <View style={styles.priceQuantityRow}>
              <View style={styles.priceContainer}>
                <Text style={styles.priceText}>{plant.price}</Text>
              </View>
              <View style={styles.quantityContainer}>
                <Text style={styles.quantityText}>{plant.quantity}</Text>
              </View>
            </View>
          </View>
        </View>
      </View>
    ));
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      
      {/* Header */}
      <ScreenHeader
        navigation={navigation}
        title="Sales Report"
      />

      {/* Tabs */}
      <View style={styles.tabsContainer}>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.tabsContent}>
            <TouchableOpacity
              style={[styles.tab, activeTab === 0 && styles.tabActive]}
              onPress={() => setActiveTab(0)}>
              <View style={styles.tabContent}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 0 && styles.tabTextActive,
                  ]}>
                  Sales Chart
                </Text>
              </View>
              {activeTab === 0 && <View style={styles.tabIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 1 && styles.tabActive]}
              onPress={() => setActiveTab(1)}>
              <View style={styles.tabContent}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 1 && styles.tabTextActive,
                  ]}>
                  Sold Plants
                </Text>
              </View>
              {activeTab === 1 && <View style={styles.tabIndicator} />}
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.tab, activeTab === 2 && styles.tabActive]}
              onPress={() => setActiveTab(2)}>
              <View style={styles.tabContent}>
                <Text
                  style={[
                    styles.tabText,
                    activeTab === 2 && styles.tabTextActive,
                  ]}>
                  Wildgone
                </Text>
                {journeyMishapCount > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{journeyMishapCount}</Text>
                  </View>
                )}
              </View>
              {activeTab === 2 && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          </ScrollView>
        </View>

      {/* Content */}
      <View style={styles.content}>
        {activeTab === 0 && (
          <>
            {/* Navigation / Filter */}
            <View style={styles.filterContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.filterScrollContent}>
                {/* Period */}
                <TouchableOpacity style={styles.filterButton}>
                  <Text style={styles.filterButtonText}>{selectedPeriod}</Text>
                  <DownIcon width={16} height={16} />
                </TouchableOpacity>

                {/* Country */}
                <TouchableOpacity style={styles.filterButton}>
                  <Text style={styles.filterButtonText}>{selectedCountry}</Text>
                  <DownIcon width={16} height={16} />
                </TouchableOpacity>

                {/* Seller */}
                <TouchableOpacity style={styles.filterButton}>
                  <Text style={styles.filterButtonText}>{selectedSeller}</Text>
                  <DownIcon width={16} height={16} />
                </TouchableOpacity>

                {/* Buyer */}
                <TouchableOpacity style={styles.filterButton}>
                  <Text style={styles.filterButtonText}>{selectedBuyer}</Text>
                  <DownIcon width={16} height={16} />
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Graph Section */}
            <View style={styles.graphSection}>
          {/* Table */}
          <View style={styles.tableContainer}>
            <View style={styles.table}>
              {/* Labels Column */}
              <View style={styles.labelsColumn}>
                <Text style={styles.labelText}>Total Sales</Text>
                <Text style={styles.labelText}>Plant Sold</Text>
                <Text style={styles.labelText}>Plant Listed</Text>
                <Text style={styles.labelText}>Percent Sold</Text>
              </View>

              {/* Data Columns */}
              <View style={styles.dataColumns}>
                {sampleTableData.map((row, index) => (
                  <View key={index} style={styles.dataColumn}>
                    <Text style={styles.periodText}>{row.period}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.dataTextBold}>{row.totalSales}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.dataText}>{row.plantSold}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.dataText}>{row.plantListed}</Text>
                    <View style={styles.divider} />
                    <Text style={styles.dataTextBold}>{row.percentSold}</Text>
                  </View>
                ))}
              </View>
            </View>
          </View>

          {/* Chart */}
          <View style={styles.chartContainer}>
            {/* Legends */}
            <View style={styles.legendsContainer}>
              <View style={styles.legend}>
                <View style={[styles.legendColor, {backgroundColor: '#FFB323'}]} />
                <Text style={styles.legendText}>Total Listing</Text>
              </View>
              <View style={styles.legend}>
                <View style={[styles.legendColor, {backgroundColor: '#539461'}]} />
                <Text style={styles.legendText}>Sold</Text>
              </View>
              <View style={styles.legend}>
                <View style={[styles.legendColor, {backgroundColor: '#202325'}]} />
                <Text style={styles.legendText}>Amount</Text>
              </View>
            </View>

            {/* Chart with Bars */}
            <View style={styles.chartBarsContainer}>
              {/* Y-axis Labels */}
              <View style={styles.yAxisContainer}>
                {[100, 75, 50, 25, 0].map((value, index) => (
                  <View key={index} style={styles.yAxisLabel}>
                    <Text style={styles.yAxisText}>{value}K</Text>
                    {index < 4 && <View style={styles.yAxisDivider} />}
                  </View>
                ))}
              </View>

              {/* Bars */}
              <View style={styles.barsContainer}>
                {sampleChartData.map((data, index) => {
                  const totalListingHeight = calculateBarHeight(
                    data.totalListing,
                    maxChartValue,
                  );
                  const soldHeight = calculateBarHeight(
                    data.sold,
                    maxChartValue,
                  );

                  return (
                    <View key={index} style={styles.bar}>
                      {/* Dot - only show if there's data */}
                      {data.totalListing > 0 || data.sold > 0 ? (
                        <View style={styles.barDot}>
                          <View style={styles.dot} />
                        </View>
                      ) : (
                        <View style={styles.barDot} />
                      )}

                      {/* Bar Content - only show bars if values are greater than 0 */}
                      <View style={styles.barContent}>
                        {totalListingHeight > 0 && (
                          <View
                            style={[
                              styles.barSection,
                              {
                                height: totalListingHeight,
                                backgroundColor: '#FFB323',
                                borderTopLeftRadius: 6,
                                borderTopRightRadius: 6,
                              },
                            ]}
                          />
                        )}
                        {soldHeight > 0 && (
                          <View
                            style={[
                              styles.barSection,
                              {
                                height: soldHeight,
                                backgroundColor: '#539461',
                                borderBottomLeftRadius: 6,
                                borderBottomRightRadius: 6,
                              },
                            ]}
                          />
                        )}
                      </View>

                      {/* Date - Removed per user request */}
                    </View>
                  );
                })}
              </View>
            </View>
          </View>
        </View>
        </>
        )}

        {activeTab === 1 && (
          <View style={styles.blankContainer}>
            {/* Blank Sold Plants Screen */}
          </View>
        )}

        {activeTab === 2 && (
          <View style={styles.wildgoneContainer}>
            {/* Navigation / Filter */}
            <View style={styles.wildgoneFilterContainer}>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.wildgoneFilterScrollContent}>
                {/* Journey Mishap */}
                <TouchableOpacity style={styles.wildgoneFilterButton}>
                  <Text style={styles.wildgoneFilterButtonText}>Journey Mishap</Text>
                  <RightIcon width={16} height={16} />
                </TouchableOpacity>

                {/* Request Status */}
                <TouchableOpacity style={styles.wildgoneFilterButton}>
                  <Text style={styles.wildgoneFilterButtonText}>Request Status</Text>
                  <RightIcon width={16} height={16} />
                </TouchableOpacity>

                {/* Receiver */}
                <TouchableOpacity style={styles.wildgoneFilterButton}>
                  <Text style={styles.wildgoneFilterButtonText}>Receiver</Text>
                  <RightIcon width={16} height={16} />
                </TouchableOpacity>
              </ScrollView>
            </View>

            {/* Plant List */}
            <ScrollView 
              style={styles.plantListContainer}
              onScroll={handleWildgoneScroll}
              scrollEventThrottle={400}
            >
              {renderWildgonePlantItems()}
              
              {/* Loading More Indicator */}
              {journeyMishapLoadingMore && (
                <View style={styles.loadingMoreContainer}>
                  <Text style={styles.loadingMoreText}>Loading more...</Text>
                </View>
              )}
              
              {/* End of List Indicator */}
              {!journeyMishapHasMore && journeyMishapData.length > 0 && !journeyMishapLoading && (
                <View style={styles.endOfListContainer}>
                  <Text style={styles.endOfListText}>No more requests</Text>
                </View>
              )}
            </ScrollView>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  tabsContainer: {
    width: '100%',
    height: 48,
    borderBottomWidth: 1,
    borderBottomColor: '#CDD3D4',
  },
  tabsContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 14,
    paddingVertical: 8,
    gap: 24,
  },
  tab: {
    flexDirection: 'column',
    justifyContent: 'space-between',
    alignItems: 'center',
    minWidth: 100,
    height: 40,
    minHeight: 40,
  },
  tabActive: {
    // Active state handled by indicator
  },
  tabContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 40,
    height: 24,
  },
  tabText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#647276',
  },
  tabTextActive: {
    fontWeight: '600',
    color: '#202325',
  },
  badge: {
    width: 18,
    minWidth: 18,
    height: 18,
    minHeight: 18,
    backgroundColor: '#E7522F',
    borderRadius: 1000,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 4,
    marginLeft: 3,
  },
  badgeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 17,
    textAlign: 'center',
    color: '#FFFFFF',
  },
  tabIndicator: {
    width: 100,
    height: 3,
    maxHeight: 3,
    backgroundColor: '#202325',
    marginTop: 12,
  },
  content: {
    flex: 1,
    paddingBottom: 16,
  },
  filterContainer: {
    width: '100%',
    height: 66,
    paddingVertical: 16,
  },
  filterScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 8,
  },
  filterButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    minHeight: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    gap: 4,
  },
  filterButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    color: '#393D40',
    paddingHorizontal: 4,
  },
  graphSection: {
    flex: 1,
    gap: 16,
  },
  tableContainer: {
    paddingHorizontal: 15,
    paddingVertical: 4,
  },
  table: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: 16,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7E9',
    borderRadius: 12,
  },
  labelsColumn: {
    width: 74,
    gap: 6,
  },
  labelText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 17,
    color: '#647276',
    height: 24,
  },
  dataColumns: {
    flex: 1,
    flexDirection: 'row',
    gap: 0,
  },
  dataColumn: {
    flex: 1,
    gap: 6,
  },
  periodText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 10,
    lineHeight: 12,
    color: '#647276',
    height: 12,
  },
  divider: {
    height: 1,
    backgroundColor: '#A9B3B7',
  },
  dataText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 17,
    color: '#202325',
    height: 17,
  },
  dataTextBold: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 12,
    lineHeight: 17,
    color: '#202325',
    height: 17,
  },
  chartContainer: {
    paddingVertical: 4,
    gap: 16,
  },
  legendsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    gap: 24,
    height: 20,
  },
  legend: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  legendColor: {
    width: 12,
    height: 12,
    borderRadius: 2,
  },
  legendText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#393D40',
  },
  chartBarsContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingLeft: 56,
    paddingRight: 15,
    height: 208,
  },
  yAxisContainer: {
    position: 'absolute',
    left: 0,
    width: '100%',
    height: 200,
    paddingBottom: 34,
    justifyContent: 'space-between',
  },
  yAxisLabel: {
    paddingHorizontal: 15,
    height: 18,
    justifyContent: 'center',
  },
  yAxisText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 17,
    color: '#7F8D91',
    height: 17,
  },
  yAxisDivider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4E7E9',
    marginTop: 0,
    marginHorizontal: 15,
  },
  barsContainer: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    height: 208,
  },
  bar: {
    flex: 1,
    height: 208,
    alignItems: 'center',
  },
  barDot: {
    width: 76,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 8,
  },
  dot: {
    width: 8,
    height: 8,
    backgroundColor: '#202325',
    borderRadius: 4,
  },
  barContent: {
    width: 48,
    paddingHorizontal: 14,
    gap: 0,
  },
  barSection: {
    width: 48,
  },
  blankContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  wildgoneContainer: {
    flex: 1,
    width: '100%',
    backgroundColor: '#FFFFFF',
  },
  wildgoneFilterContainer: {
    width: '100%',
    height: 66,
    paddingVertical: 16,
  },
  wildgoneFilterScrollContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 15,
    gap: 8,
    height: 34,
  },
  wildgoneFilterButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    minHeight: 34,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    gap: 4,
  },
  wildgoneFilterButtonText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 16,
    color: '#393D40',
    paddingHorizontal: 4,
  },
  plantListContainer: {
    flex: 1,
    width: '100%',
  },
  plantItemContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 12,
    paddingBottom: 16,
    gap: 12,
    width: '100%',
    backgroundColor: '#F5F6F6',
  },
  plantDetailsSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 6,
    gap: 8,
    width: '100%',
  },
  fulfillmentStatusRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 10,
    width: '100%',
    height: 28,
  },
  fulfillmentStatusText: {
    flex: 1,
    height: 24,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#E7522F',
  },
  creditStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 1,
    minHeight: 28,
    borderRadius: 8,
  },
  creditStatusText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  plantDateRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    height: 24,
  },
  dateContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 24,
  },
  dateText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    height: 22,
  },
  userSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
    height: 44,
    borderRadius: 12,
  },
  userRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    width: '100%',
    height: 44,
  },
  avatarContainer: {
    width: 40,
    minWidth: 40,
    height: 40,
    minHeight: 40,
    borderRadius: 1000,
    position: 'relative',
  },
  avatar: {
    position: 'absolute',
    width: 40,
    height: 40,
    borderRadius: 1000,
    backgroundColor: '#E4E7E9',
    borderWidth: 1,
    borderColor: '#539461',
  },
  avatarImage: {
    width: 40,
    height: 40,
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: '#539461',
  },
  plantImagePlaceholder: {
    width: 96,
    height: 128,
    borderRadius: 8,
    backgroundColor: '#E4E7E9',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#647276',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  emptyText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#647276',
  },
  userContent: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    height: 44,
    flex: 1,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    height: 24,
  },
  userNameText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  userUsernameText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#7F8D91',
    flex: 1,
  },
  userRoleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    width: '100%',
    height: 20,
  },
  userRoleText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
  },
  plantCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  plantImageContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    gap: 8,
    width: 96,
    height: 128,
  },
  plantImage: {
    width: 96,
    height: 128,
    borderRadius: 8,
    backgroundColor: '#E4E7E9',
  },
  plantDetails: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    flex: 1,
  },
  codeCountryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    width: '100%',
    height: 28,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    height: 28,
  },
  questionIconContainer: {
    position: 'relative',
    padding: 2,
  },
  tooltip: {
    position: 'absolute',
    bottom: 25,
    left: -20,
    backgroundColor: '#539461',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    zIndex: 1000,
    minWidth: 100,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.25,
    shadowRadius: 3.84,
    elevation: 5,
  },
  tooltipText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    color: '#FFFFFF',
    textAlign: 'center',
  },
  plantCodeText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  countryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    height: 22,
  },
  countryText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#556065',
  },
  genusSpecieText: {
    width: '100%',
    height: 24,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    color: '#202325',
  },
  variegationSizeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    width: '100%',
    height: 22,
  },
  variegationText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  dividerDot: {
    width: 4,
    height: 4,
    backgroundColor: '#7F8D91',
    borderRadius: 2,
  },
  sizeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  viewsText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  typeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    width: '100%',
    height: 24,
  },
  listingTypeBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingBottom: 1,
    minHeight: 24,
    backgroundColor: '#202325',
    borderRadius: 6,
  },
  listingTypeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 17,
    color: '#FFFFFF',
  },
  priceQuantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: 4,
    width: '100%',
    height: 24,
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    gap: 4,
    flex: 1,
    height: 24,
  },
  priceText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    color: '#202325',
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    height: 22,
  },
  quantityText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'right',
    color: '#393D40',
  },
  // Skeleton Styles
  skeletonBox: {
    backgroundColor: '#E4E7E9',
    borderRadius: 4,
  },
  skeletonCircle: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E4E7E9',
  },
  skeletonPlantImage: {
    width: 100,
    height: 100,
    borderRadius: 8,
    backgroundColor: '#E4E7E9',
  },
  loadingMoreContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingMoreText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#647276',
  },
  endOfListContainer: {
    paddingVertical: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  endOfListText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#9CA4AB',
  },
});

export default SalesReport;

