import React, { useState, useCallback, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Animated,
  TextInput,
  Platform,
  StatusBar,
  Modal,
  ScrollView,
  Image,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, query, where, orderBy, limit, startAfter, doc, getDoc, getDocsFromServer } from 'firebase/firestore';
import { db } from '../../../../firebase';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import Svg, { Path } from 'react-native-svg';
import { clearCreditsApi } from '../../../components/Api/creditApi';

// Skeleton placeholder blocks for the buyer list — mirrors buyerCard layout
const SKEL_BASE = '#E9ECEF';
const SKEL_LIGHT = '#F1F3F4';

// Drives a gentle opacity pulse on a skeleton card. Each card gets its own
// driver so the rows don't all shimmer in lockstep.
const useShimmer = (duration = 1500, low = 0.35, high = 0.85) => {
  const anim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const loop = Animated.loop(
      Animated.sequence([
        Animated.timing(anim, { toValue: 1, duration, useNativeDriver: true }),
        Animated.timing(anim, { toValue: 0, duration, useNativeDriver: true }),
      ]),
    );
    loop.start();
    return () => loop.stop();
  }, [anim, duration]);

  return anim.interpolate({ inputRange: [0, 1], outputRange: [low, high] });
};

const BuyerSkeletonRow = () => {
  const opacity = useShimmer();
  return (
    <View style={styles.buyerCard}>
      <Animated.View style={[styles.buyerInfo, { opacity }]}>
        <View style={[styles.skelBlock, styles.skelName]} />
        <View style={[styles.skelBlock, styles.skelEmail]} />
        <View style={[styles.skelBlock, styles.skelCountry]} />
      </Animated.View>
      <Animated.View style={[styles.creditsContainer, styles.creditsContainerZero, { opacity }]}>
        <View style={[styles.skelBlock, styles.skelBalanceValue]} />
        <View style={[styles.skelBlock, styles.skelBalanceLabel]} />
      </Animated.View>
    </View>
  );
};

const BuyerSkeletonList = ({ count = 6 }) => (
  <View style={styles.listContent}>
    {Array.from({ length: count }).map((_, idx) => (
      <BuyerSkeletonRow key={`buyer-skel-${idx}`} />
    ))}
  </View>
);

// Skeleton placeholder blocks for the credit history modal — mirrors transactionCard layout
const TransactionSkeletonCard = () => {
  const opacity = useShimmer();
  return (
    <Animated.View style={[styles.transactionCard, { opacity }]}>
      <View style={styles.transactionHeader}>
        <View style={[styles.skelBlock, styles.skelBadge]} />
        <View style={[styles.skelBlock, styles.skelAmount]} />
      </View>
      <View style={styles.plantInfoSection}>
        <View style={[styles.plantImage, styles.skelBlock]} />
        <View style={styles.plantTextInfo}>
          <View style={[styles.skelBlock, styles.skelPlantName]} />
          <View style={[styles.skelBlock, styles.skelPlantSub]} />
          <View style={[styles.skelBlock, styles.skelPlantCode]} />
        </View>
      </View>
      <View style={styles.transactionDetails}>
        {[0, 1, 2, 3, 4].map(i => (
          <View key={`detail-skel-${i}`} style={styles.detailRow}>
            <View style={[styles.skelBlock, styles.skelDetailLabel]} />
            <View style={[styles.skelBlock, styles.skelDetailValue]} />
          </View>
        ))}
      </View>
      <View style={[styles.skelBlock, styles.skelClearButton]} />
    </Animated.View>
  );
};

const TransactionSkeletonList = ({ count = 3 }) => (
  <View style={styles.historyList}>
    <ScrollView contentContainerStyle={styles.historyContent} showsVerticalScrollIndicator={false}>
      <View style={[styles.skelBlock, styles.skelHistoryTitle]} />
      {Array.from({ length: count }).map((_, idx) => (
        <TransactionSkeletonCard key={`tx-skel-${idx}`} />
      ))}
    </ScrollView>
  </View>
);

const CloseIcon = ({ width = 24, height = 24, color = '#202325' }) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M18 6L6 18M6 6L18 18"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const PlantCreditsManagement = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [buyers, setBuyers] = useState([]);
  const [filteredBuyers, setFilteredBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searchText, setSearchText] = useState('');
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [creditHistory, setCreditHistory] = useState([]);
  const [loadingHistory, setLoadingHistory] = useState(false);
  const [historyModalVisible, setHistoryModalVisible] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [allBuyersCache, setAllBuyersCache] = useState([]);
  const [clearingTxId, setClearingTxId] = useState(null); // which tx card is expanded for clearing
  const [clearReason, setClearReason] = useState('');
  const [clearing, setClearing] = useState(false);
  const [activeTab, setActiveTab] = useState('plant'); // 'plant' | 'shipping'

  const PAGE_SIZE = 10;

  const handleLoadMore = useCallback(() => {
    if (searchText) return; // Don't paginate during search
    
    setLoadingMore(true);
    
    // Load more - get next page from cache
    setBuyers(prevBuyers => {
      const currentLength = prevBuyers.length;
      
      setAllBuyersCache(cache => {
        const nextPage = cache.slice(currentLength, currentLength + PAGE_SIZE);
        
        if (nextPage.length > 0) {
          const updatedBuyers = [...prevBuyers, ...nextPage];
          setFilteredBuyers(updatedBuyers);
          setHasMore(currentLength + nextPage.length < cache.length);
          console.log(`📄 Loaded page: ${updatedBuyers.length}/${cache.length} buyers`);
          setLoadingMore(false);
          return cache;
        } else {
          setHasMore(false);
          setLoadingMore(false);
          return cache;
        }
      });
      
      return prevBuyers;
    });
  }, [searchText]);

  const fetchBuyersWithPlantCredits = useCallback(async () => {
    try {
      setLoading(true);
      setHasMore(true);

      const buyerMap = new Map(); // uid -> buyer data

      // Helper to build buyer base object
      const buildBuyer = (buyerUid, data, fallbackBalance = null, lastActivityAt = null) => ({
        uid: buyerUid,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        username: data.username || '',
        plantCredits: fallbackBalance ?? (data.plantCredits ?? data.plant_credits ?? 0),
        country: data.country || data.region || '',
        createdAt: data.createdAt,
        lastActivityAt,
      });

      // Helper to add/update buyer info
      const ensureBuyer = async (buyerUid, fallbackBalance = null, lastActivityAt = null) => {
        const buyerDoc = await getDoc(doc(db, 'buyer', buyerUid));
        const data = buyerDoc?.exists() ? buyerDoc.data() : {};
        if (buyerMap.has(buyerUid)) {
          const existing = buyerMap.get(buyerUid);
          // Only override the balance when a real fallback is supplied; never
          // promote a stale balance above the ledger value already set.
          if (fallbackBalance != null) {
            existing.plantCredits = Number(fallbackBalance);
          }
          if (lastActivityAt != null && (existing.lastActivityAt == null || lastActivityAt > existing.lastActivityAt)) {
            existing.lastActivityAt = lastActivityAt;
          }
        } else {
          buyerMap.set(buyerUid, buildBuyer(buyerUid, data, fallbackBalance, lastActivityAt));
        }
      };

      // 1. Detect plant credit history and last activity from credit_transactions.
      //    Do NOT use balanceAfter as authoritative; it can be stale after cleanups.
      try {
        const transactionsSnap = await getDocs(
          query(
            collection(db, 'credit_transactions'),
            orderBy('createdAt', 'desc'),
            limit(3000)
          )
        );
        const latestBalanceByBuyer = new Map();
        const latestActivityByBuyer = new Map();

        transactionsSnap.forEach(docSnap => {
          const data = docSnap.data();
          const isShipping = data.creditType?.toLowerCase().includes('shipping') ||
            data.type?.toLowerCase().includes('shipping') ||
            data.transactionType?.toLowerCase().includes('shipping');
          if (isShipping) return;
          const buyerUid = data.buyerUid;
          if (!buyerUid) return;
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() :
            data.createdAt ? new Date(data.createdAt) : new Date();
          if (!latestActivityByBuyer.has(buyerUid)) {
            latestActivityByBuyer.set(buyerUid, createdAt);
            // balanceAfter on an old transaction is not a reliable current balance.
            latestBalanceByBuyer.set(buyerUid, 0);
          }
        });

        // Include every buyer with a plant credit history, even if balance is 0
        for (const [buyerUid, balance] of latestBalanceByBuyer) {
          await ensureBuyer(buyerUid, balance, latestActivityByBuyer.get(buyerUid));
        }
      } catch (txErr) {
        console.warn('Could not fetch latest balance from credit_transactions:', txErr);
      }

      // 2. Also include buyers with a positive buyer.plantCredits balance
      try {
        const buyersSnap = await getDocs(collection(db, 'buyer'));
        buyersSnap.forEach(docSnap => {
          const data = docSnap.data();
          const plantCredits = data.plantCredits ?? data.plant_credits ?? 0;
          if (plantCredits > 0) {
            if (buyerMap.has(docSnap.id)) {
              const existing = buyerMap.get(docSnap.id);
              existing.plantCredits = Number(plantCredits);
            } else {
              buyerMap.set(docSnap.id, buildBuyer(docSnap.id, data, Number(plantCredits)));
            }
          }
        });
      } catch (buyerErr) {
        console.warn('Could not fetch buyer collection:', buyerErr);
      }

      // 3. Also check plant_credits collection for buyers with available credits
      //    Fetch from server to avoid stale local-cache records after cleanup.
      try {
        const plantCreditsSnap = await getDocsFromServer(collection(db, 'plant_credits'));
        const creditsByBuyer = new Map();

        plantCreditsSnap.forEach(docSnap => {
          const data = docSnap.data();
          if (data.buyerUid && (data.status === 'available' || !data.status)) {
            const amount = (data.amount || 0) - (data.usedAmount || 0);
            if (amount > 0) {
              creditsByBuyer.set(data.buyerUid, (creditsByBuyer.get(data.buyerUid) || 0) + amount);
            }
          }
        });

        for (const [buyerUid, totalCredits] of creditsByBuyer) {
          const credits = Number(totalCredits.toFixed(2));
          // Ledger sum is authoritative; override any previously-stored value.
          if (buyerMap.has(buyerUid)) {
            const existing = buyerMap.get(buyerUid);
            existing.plantCredits = credits;
          } else {
            await ensureBuyer(buyerUid, credits);
          }
        }
      } catch (plantCreditsErr) {
        console.warn('Could not fetch plant_credits collection:', plantCreditsErr);
      }

      const buyersWithCredits = Array.from(buyerMap.values());

      // Sort by most recent activity first, then by current balance descending
      buyersWithCredits.sort((a, b) => {
        const aActivity = a.lastActivityAt ? a.lastActivityAt.getTime() : 0;
        const bActivity = b.lastActivityAt ? b.lastActivityAt.getTime() : 0;
        if (bActivity !== aActivity) {
          return bActivity - aActivity;
        }
        if (b.plantCredits !== a.plantCredits) {
          return b.plantCredits - a.plantCredits;
        }
        const aName = `${a.firstName} ${a.lastName}`.toLowerCase();
        const bName = `${b.firstName} ${b.lastName}`.toLowerCase();
        return aName.localeCompare(bName);
      });

      console.log(`💰 Found ${buyersWithCredits.length} total buyers with plant credit history`);
      setAllBuyersCache(buyersWithCredits);

      // Get first page
      const firstPage = buyersWithCredits.slice(0, PAGE_SIZE);
      setBuyers(firstPage);
      setFilteredBuyers(firstPage);
      setHasMore(buyersWithCredits.length > PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching buyers with plant credits:', error);
      setBuyers([]);
      setFilteredBuyers([]);
      setAllBuyersCache([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchCreditHistory = useCallback(async (buyerUid) => {
    try {
      setLoadingHistory(true);
      
      const allTransactions = [];
      
      // 1. Fetch from credit_transactions collection
      try {
        const creditsSnap = await getDocs(
          query(
            collection(db, 'credit_transactions'),
            where('buyerUid', '==', buyerUid)
          )
        );
        
        let plantCreditsCount = 0;
        
        // Fetch additional details for each transaction
        for (const docSnapshot of creditsSnap.docs) {
          const data = docSnapshot.data();
          
          // Include all transactions EXCEPT shipping credits
          const isShippingCredit = 
            data.creditType?.toLowerCase().includes('shipping') ||
            data.type?.toLowerCase().includes('shipping');
          
          if (!isShippingCredit) {
            const transaction = {
              id: docSnapshot.id,
              source: 'credit_transactions',
              ...data,
              createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : 
                        data.createdAt ? new Date(data.createdAt) : new Date(),
            };
            
            let fetchedOrderData = null;
            
            // Log raw data to see what fields exist
            console.log(`🔍 Raw transaction data:`, {
              id: docSnapshot.id,
              hasPlantCode: !!data.plantCode,
              hasPlantName: !!data.plantName,
              hasDescription: !!data.description,
              orderId: data.orderId,
              creditType: data.creditType,
              type: data.type,
            });
            
            transaction.transactionNumber = data.orderId;
            if (data.flightDate) {
              transaction.flightDate = data.flightDate?.toDate ? data.flightDate.toDate() : new Date(data.flightDate);
            }
            transaction.plantCode = data.plantCode || 
                                   data.plantDetails?.plantCode;
            
            // Extract plant info from existing transaction data
            transaction.plantName = data.plantName || 
                                   data.plantDetails?.plantName || 
                                   data.scientificName ||
                                   data.plantDetails?.scientificName;
            
            transaction.plantImage = data.plantImage || 
                                    data.plantDetails?.plantImage ||
                                    data.plantDetails?.image ||
                                    data.image;
            
            // Fetch order details if orderId exists
            if (data.orderId) {
              try {
                let orderDoc;
                let orderData;
                
                // Check if orderId is a transaction number (starts with TXN) or a document ID
                if (data.orderId.startsWith('TXN')) {
                  console.log(`📦 Querying order by transaction number: ${data.orderId}`);
                  // Query by transaction number
                  const orderQuery = await getDocs(
                    query(
                      collection(db, 'order'),
                      where('trxNumber', '==', data.orderId),
                      limit(1)
                    )
                  );
                  
                  if (!orderQuery.empty) {
                    orderDoc = orderQuery.docs[0];
                    orderData = orderDoc.data();
                    console.log(`✅ Found order by transaction number`);
                  } else {
                    console.log(`❌ No order found with trxNumber: ${data.orderId}`);
                  }
                } else {
                  // Try to get by document ID
                  console.log(`📦 Getting order by document ID: ${data.orderId}`);
                  orderDoc = await getDoc(doc(db, 'order', data.orderId));
                  if (orderDoc.exists()) {
                    orderData = orderDoc.data();
                    console.log(`✅ Found order by document ID`);
                  }
                }
                
                if (orderData) {
                  fetchedOrderData = orderData;
                  transaction.orderDate = orderData.createdAt?.toDate ? orderData.createdAt.toDate() : orderData.createdAt ? new Date(orderData.createdAt) : null;
                  transaction.transactionNumber = orderData.trxNumber || orderData.orderNumber || orderData.transactionNumber || data.orderId;
                  const fd = orderData.flightDate || orderData.flightDateFormatted || orderData.cargoDate;
                  transaction.flightDate = fd?.toDate ? fd.toDate() : fd ? new Date(fd) : null;
                  
                  // Log the full order structure to see what fields exist
                  console.log(`📦 Order structure:`, {
                    hasProducts: !!orderData.products,
                    productsLength: orderData.products?.length || 0,
                    hasPlantCode: !!orderData.plantCode,
                    hasPlantName: !!orderData.plantName,
                    hasItems: !!orderData.items,
                    itemsLength: orderData.items?.length || 0,
                    allKeys: Object.keys(orderData).slice(0, 10) // First 10 keys
                  });
                  
                  // Try to get plant info from different possible fields
                  let plants = orderData.products || orderData.items || [];
                  
                  console.log(`📦 Found ${plants.length} items in order`);
                  
                  // Get plant info from order products/items
                  if (plants && Array.isArray(plants) && plants.length > 0) {
                    // Try to find plant by code first
                    let plant = null;
                    if (transaction.plantCode) {
                      plant = orderData.products.find(p => p.plantCode === transaction.plantCode);
                    }
                    // If not found and only one product, use it
                    if (!plant && orderData.products.length === 1) {
                      plant = orderData.products[0];
                    }
                    // If still not found, try to match by description
                    if (!plant && data.description) {
                      // Extract plant code from description if it exists
                      // Description format: "Earned plant credits for damaged plant in order #XXX"
                      plant = orderData.products[0]; // Default to first product
                    }
                    
                    if (plant) {
                      console.log(`🌱 Found plant in order items:`, {
                        plantCode: plant.plantCode,
                        plantName: plant.plantName,
                        hasImage: !!plant.plantImage
                      });
                      
                      if (!transaction.plantName) {
                        transaction.plantName = plant.plantName || plant.scientificName || plant.name;
                      }
                      if (!transaction.plantImage) {
                        transaction.plantImage = plant.plantImage || plant.image || plant.photoUrl;
                      }
                      if (!transaction.plantCode) {
                        transaction.plantCode = plant.plantCode || plant.code;
                      }
                      transaction.genus = transaction.genus || plant.genus;
                      transaction.species = transaction.species || plant.species;
                      transaction.unitPrice = transaction.unitPrice ?? plant.unitPrice ?? plant.usdPrice ?? plant.price;
                      if (!transaction.flightDate) {
                        const pfd = plant.flightDate || plant.flightDateFormatted || plant.cargoDate;
                        transaction.flightDate = pfd?.toDate ? pfd.toDate() : pfd ? new Date(pfd) : null;
                      }
                    }
                  } else {
                    // If no items array, check if plant data is directly in order
                    console.log(`📦 Checking order-level fields`);
                    if (orderData.plantCode) {
                      transaction.plantCode = orderData.plantCode;
                      transaction.plantName = orderData.plantName;
                      transaction.plantImage = orderData.plantImage || orderData.imagePrimary;
                      transaction.genus = orderData.genus;
                      transaction.species = orderData.species;
                      transaction.unitPrice = orderData.unitPrice ?? orderData.usdPrice;
                      if (!transaction.flightDate) {
                        const fd = orderData.flightDate || orderData.flightDateFormatted || orderData.cargoDate;
                        transaction.flightDate = fd?.toDate ? fd.toDate() : fd ? new Date(fd) : null;
                      }
                      console.log(`🌱 Found plant data at order level:`, {
                        plantCode: orderData.plantCode,
                        plantName: orderData.plantName,
                        genus: orderData.genus,
                        species: orderData.species,
                        hasImage: !!(orderData.plantImage || orderData.imagePrimary)
                      });
                    }
                  }
                }
              } catch (orderErr) {
                console.log('❌ Error fetching order:', orderErr);
              }
            }
            
            // Fetch admin name if processedBy is a UID
            if (data.processedBy && data.processedBy.length > 20) {
              try {
                const adminDoc = await getDoc(doc(db, 'admin', data.processedBy));
                if (adminDoc.exists()) {
                  const adminData = adminDoc.data();
                  transaction.processedByName = `${adminData.firstName || ''} ${adminData.lastName || ''}`.trim() || adminData.email;
                } else {
                  transaction.processedByName = data.processedBy;
                }
              } catch (adminErr) {
                transaction.processedByName = data.processedBy;
              }
            } else {
              transaction.processedByName = data.processedBy;
            }
            
            // NOW fetch from listings if we have plant code but missing details
            // This happens AFTER order fetch so we have the plantCode
            if (transaction.plantCode && (!transaction.plantName || !transaction.plantImage)) {
              console.log(`🔍 Querying listings for plantCode: ${transaction.plantCode}`);
              try {
                const listingsSnap = await getDocs(
                  query(
                    collection(db, 'listings'),
                    where('plantCode', '==', transaction.plantCode),
                    limit(1)
                  )
                );
                
                console.log(`📚 Listings query result: ${listingsSnap.size} listing(s) found`);
                
                if (!listingsSnap.empty) {
                  const listingData = listingsSnap.docs[0].data();
                  
                  console.log(`📚 Listing data:`, {
                    plantName: listingData.plantName,
                    scientificName: listingData.scientificName,
                    genus: listingData.genus,
                    species: listingData.species,
                    hasImage: !!(listingData.plantImage || listingData.image || listingData.photoUrl)
                  });
                  
                  if (!transaction.plantName) {
                    transaction.plantName = listingData.plantName || 
                                          listingData.scientificName || 
                                          listingData.name;
                  }
                  
                  if (!transaction.plantImage) {
                    transaction.plantImage = listingData.plantImage || 
                                           listingData.image || 
                                           listingData.photoUrl ||
                                           (listingData.images && listingData.images[0]);
                  }
                  
                  transaction.genus = transaction.genus || listingData.genus;
                  transaction.species = transaction.species || listingData.species;
                  if (transaction.unitPrice == null) {
                    transaction.unitPrice = listingData.unitPrice ?? listingData.usdPrice ?? listingData.price;
                  }
                  console.log(`✅ Fetched plant details from listings for ${transaction.plantCode}:`, {
                    plantName: transaction.plantName,
                    genus: transaction.genus,
                    species: transaction.species,
                    hasImage: !!transaction.plantImage
                  });
                } else {
                  console.log(`❌ No listing found for plantCode: ${transaction.plantCode}`);
                  // Fallback: use order data (genus, species, imagePrimary)
                  if (fetchedOrderData) {
                    if (!transaction.plantName) {
                      transaction.plantName = fetchedOrderData.plantName || 
                        (fetchedOrderData.genus && fetchedOrderData.species 
                          ? `${fetchedOrderData.genus} ${fetchedOrderData.species}` 
                          : fetchedOrderData.scientificName);
                    }
                    if (!transaction.plantImage) {
                      transaction.plantImage = fetchedOrderData.plantImage || fetchedOrderData.imagePrimary;
                    }
                    if (!transaction.genus) transaction.genus = fetchedOrderData.genus;
                    if (!transaction.species) transaction.species = fetchedOrderData.species;
                    if (!transaction.unitPrice) transaction.unitPrice = fetchedOrderData.unitPrice || fetchedOrderData.usdPrice;
                    console.log(`✅ Using order fallback:`, {
                      plantName: transaction.plantName,
                      genus: transaction.genus,
                      species: transaction.species,
                      hasImage: !!transaction.plantImage
                    });
                  }
                }
              } catch (listingErr) {
                console.log('❌ Error fetching from listings:', listingErr);
              }
            }
            
            // Log what we found for debugging
            console.log(`🔍 Transaction ${docSnapshot.id}:`, {
              plantName: transaction.plantName,
              plantCode: transaction.plantCode,
              plantImage: transaction.plantImage ? 'YES' : 'NO',
              orderDate: transaction.orderDate ? 'YES' : 'NO'
            });
            
            allTransactions.push(transaction);
            plantCreditsCount++;
          }
        }
        console.log(`📋 Found ${creditsSnap.size} total records, ${plantCreditsCount} plant credit records in credit_transactions`);
      } catch (err) {
        console.log('Error fetching credit_transactions:', err);
      }
      
      // 2. Fetch from creditRequests collection (approved requests)
      try {
        const requestsSnap = await getDocs(
          query(
            collection(db, 'creditRequests'),
            where('buyerUid', '==', buyerUid)
          )
        );
        
        requestsSnap.forEach(doc => {
          const data = doc.data();
          // Only show approved requests or ones with credits issued
          if (data.status === 'approved' || data.creditIssued) {
            // Check if this request is already in transactions (by creditRequestId)
            const alreadyExists = allTransactions.some(t => t.creditRequestId === doc.id);
            
            if (!alreadyExists) {
              const plantName = data.plantDetails?.plantName || data.plantCode || 'Plant';
              const issueType = data.issueType || 'plant issue';
              const amount = data.approvedAmount || data.creditAmount || data.plantDetails?.totalPrice || 0;
              
              allTransactions.push({
                id: doc.id,
                source: 'creditRequests',
                buyerUid: buyerUid,
                amount: amount,
                description: `Credit for ${issueType} - ${plantName}`,
                orderId: data.orderId || data.transactionNumber || null,
                transactionNumber: data.transactionNumber || data.orderId,
                creditRequestId: doc.id,
                processedBy: data.reviewedBy?.name || data.lastModifiedBy || 'Admin',
                plantCode: data.plantCode || data.plantDetails?.plantCode,
                plantName: plantName,
                genus: data.plantDetails?.genus || data.genus,
                species: data.plantDetails?.species || data.species,
                unitPrice: data.plantDetails?.totalPrice || data.approvedAmount || data.creditAmount,
                flightDate: data.flightDate?.toDate ? data.flightDate.toDate() : data.flightDate ? new Date(data.flightDate) : null,
                orderDate: data.orderDate?.toDate ? data.orderDate.toDate() : data.orderDate ? new Date(data.orderDate) : null,
                issueType: issueType,
                status: data.status,
                createdAt: data.reviewedAt?.toDate ? data.reviewedAt.toDate() :
                          data.processedAt?.toDate ? data.processedAt.toDate() :
                          data.createdAt?.toDate ? data.createdAt.toDate() :
                          data.createdAt ? new Date(data.createdAt) : new Date(),
              });
            }
          }
        });
        console.log(`📋 Found ${requestsSnap.size} records in creditRequests`);
      } catch (err) {
        console.log('Error fetching creditRequests:', err);
      }
      
      // Sort by date descending (most recent first)
      allTransactions.sort((a, b) => b.createdAt - a.createdAt);
      
      console.log(`📋 Total: ${allTransactions.length} plant credit records for buyer ${buyerUid}`);
      setCreditHistory(allTransactions);
    } catch (error) {
      console.error('Error fetching credit history:', error);
      setCreditHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // ── Shipping Credits ────────────────────────────────────────────────

  const fetchBuyersWithShippingCredits = useCallback(async () => {
    try {
      setLoading(true);
      setHasMore(true);

      const buyerMap = new Map();

      const buildBuyer = (buyerUid, data, fallbackBalance = null, lastActivityAt = null) => ({
        uid: buyerUid,
        firstName: data.firstName || '',
        lastName: data.lastName || '',
        email: data.email || '',
        username: data.username || '',
        shippingCredits: fallbackBalance ?? (data.shippingCredits ?? 0),
        country: data.country || data.region || '',
        createdAt: data.createdAt,
        lastActivityAt,
      });

      const ensureBuyer = async (buyerUid, fallbackBalance = null, lastActivityAt = null) => {
        const buyerDoc = await getDoc(doc(db, 'buyer', buyerUid));
        const data = buyerDoc?.exists() ? buyerDoc.data() : {};
        if (buyerMap.has(buyerUid)) {
          const existing = buyerMap.get(buyerUid);
          if (fallbackBalance != null) {
            existing.shippingCredits = Math.max(existing.shippingCredits, Number(fallbackBalance));
          }
          if (lastActivityAt != null && (existing.lastActivityAt == null || lastActivityAt > existing.lastActivityAt)) {
            existing.lastActivityAt = lastActivityAt;
          }
        } else {
          buyerMap.set(buyerUid, buildBuyer(buyerUid, data, fallbackBalance, lastActivityAt));
        }
      };

      // 1. Get shipping credit transactions and compute true per-buyer balance
      //    (earned - used - cleared) instead of relying on the latest balanceAfter,
      //    because earned transactions often omit balanceAfter and would show 0.
      try {
        const transactionsSnap = await getDocs(
          query(
            collection(db, 'credit_transactions'),
            where('creditType', '==', 'shipping')
          )
        );
        const balanceByBuyer = new Map();
        const latestActivityByBuyer = new Map();

        transactionsSnap.forEach(docSnap => {
          const data = docSnap.data();
          const buyerUid = data.buyerUid;
          if (!buyerUid) return;

          const amount = Number(data.amount) || 0;
          const type = (data.transactionType || data.type || '').toLowerCase();
          const createdAt = data.createdAt?.toDate ? data.createdAt.toDate() :
            data.createdAt ? new Date(data.createdAt) : new Date();

          if (!latestActivityByBuyer.has(buyerUid) || createdAt > latestActivityByBuyer.get(buyerUid)) {
            latestActivityByBuyer.set(buyerUid, createdAt);
          }

          const current = balanceByBuyer.get(buyerUid) || 0;
          if (type === 'used') {
            balanceByBuyer.set(buyerUid, current - Math.abs(amount));
          } else if (type === 'cleared') {
            balanceByBuyer.set(buyerUid, current - Math.abs(amount));
          } else {
            // earned / credit_refund / credit_issued etc.
            balanceByBuyer.set(buyerUid, current + amount);
          }
        });

        for (const [buyerUid, balance] of balanceByBuyer) {
          await ensureBuyer(buyerUid, balance, latestActivityByBuyer.get(buyerUid));
        }
      } catch (txErr) {
        console.warn('Could not fetch shipping credit transactions:', txErr);
      }

      // 2. Also include buyers with a buyer.shippingCredits balance
      try {
        const buyersSnap = await getDocs(collection(db, 'buyer'));
        buyersSnap.forEach(docSnap => {
          const data = docSnap.data();
          const shippingCredits = data.shippingCredits ?? 0;
          if (buyerMap.has(docSnap.id)) {
            const existing = buyerMap.get(docSnap.id);
            existing.shippingCredits = Math.max(existing.shippingCredits, Number(shippingCredits));
          } else if (shippingCredits !== 0) {
            buyerMap.set(docSnap.id, buildBuyer(docSnap.id, data, Number(shippingCredits)));
          }
        });
      } catch (buyerErr) {
        console.warn('Could not fetch buyer collection for shipping:', buyerErr);
      }

      const buyersWithCredits = Array.from(buyerMap.values());

      buyersWithCredits.sort((a, b) => {
        const aActivity = a.lastActivityAt ? a.lastActivityAt.getTime() : 0;
        const bActivity = b.lastActivityAt ? b.lastActivityAt.getTime() : 0;
        if (bActivity !== aActivity) return bActivity - aActivity;
        if (b.shippingCredits !== a.shippingCredits) return b.shippingCredits - a.shippingCredits;
        const aName = `${a.firstName} ${a.lastName}`.toLowerCase();
        const bName = `${b.firstName} ${b.lastName}`.toLowerCase();
        return aName.localeCompare(bName);
      });

      console.log(`🚢 Found ${buyersWithCredits.length} buyers with shipping credit history`);
      setAllBuyersCache(buyersWithCredits);

      const firstPage = buyersWithCredits.slice(0, PAGE_SIZE);
      setBuyers(firstPage);
      setFilteredBuyers(firstPage);
      setHasMore(buyersWithCredits.length > PAGE_SIZE);
    } catch (error) {
      console.error('Error fetching buyers with shipping credits:', error);
      setBuyers([]);
      setFilteredBuyers([]);
      setAllBuyersCache([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const fetchShippingCreditHistory = useCallback(async (buyerUid) => {
    try {
      setLoadingHistory(true);

      const allTransactions = [];

      try {
        const creditsSnap = await getDocs(
          query(
            collection(db, 'credit_transactions'),
            where('buyerUid', '==', buyerUid),
            where('creditType', '==', 'shipping')
          )
        );

        for (const docSnapshot of creditsSnap.docs) {
          const data = docSnapshot.data();
          const transaction = {
            id: docSnapshot.id,
            source: 'credit_transactions',
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() :
                      data.createdAt ? new Date(data.createdAt) : new Date(),
          };

          transaction.transactionNumber = data.orderId;

          // Fetch the source order to resolve the real transaction number
          if (data.orderId) {
            try {
              let orderDoc;
              let orderData;

              if (data.orderId.startsWith('TXN')) {
                const orderQuery = await getDocs(
                  query(
                    collection(db, 'order'),
                    where('trxNumber', '==', data.orderId),
                    limit(1)
                  )
                );
                if (!orderQuery.empty) {
                  orderDoc = orderQuery.docs[0];
                  orderData = orderDoc.data();
                }
              } else {
                orderDoc = await getDoc(doc(db, 'order', data.orderId));
                if (orderDoc.exists()) {
                  orderData = orderDoc.data();
                }
              }

              if (orderData) {
                transaction.orderDate = orderData.createdAt?.toDate ? orderData.createdAt.toDate() : orderData.createdAt ? new Date(orderData.createdAt) : null;
                transaction.transactionNumber = orderData.trxNumber || orderData.orderNumber || orderData.transactionNumber || data.orderId;
                const fd = orderData.flightDate || orderData.flightDateFormatted || orderData.cargoDate;
                transaction.flightDate = fd?.toDate ? fd.toDate() : fd ? new Date(fd) : null;
                transaction.shippingSpeed = transaction.shippingSpeed || orderData.shippingSpeed || orderData.shippingOption || orderData.deliverySpeed || orderData.upsSpeed || orderData.speed;
              }
            } catch (orderErr) {
              console.warn('Could not resolve order for shipping credit:', orderErr);
            }
          }

          if (data.processedBy && data.processedBy.length > 20) {
            try {
              const adminDoc = await getDoc(doc(db, 'admin', data.processedBy));
              if (adminDoc.exists()) {
                const adminData = adminDoc.data();
                transaction.processedByName = `${adminData.firstName || ''} ${adminData.lastName || ''}`.trim() || adminData.email;
              } else {
                transaction.processedByName = data.processedBy;
              }
            } catch (_) {
              transaction.processedByName = data.processedBy;
            }
          } else {
            transaction.processedByName = data.processedBy;
          }

          allTransactions.push(transaction);
        }
        console.log(`🚢 Found ${allTransactions.length} shipping credit records for buyer ${buyerUid}`);
      } catch (err) {
        console.log('Error fetching shipping credit_transactions:', err);
      }

      allTransactions.sort((a, b) => b.createdAt - a.createdAt);
      setCreditHistory(allTransactions);
    } catch (error) {
      console.error('Error fetching shipping credit history:', error);
      setCreditHistory([]);
    } finally {
      setLoadingHistory(false);
    }
  }, []);

  // ── Tab switching ───────────────────────────────────────────────────

  const handleTabChange = useCallback((tab) => {
    setActiveTab(tab);
    setSearchText('');
    setSelectedBuyer(null);
    setCreditHistory([]);
    setHistoryModalVisible(false);
    setClearingTxId(null);
    setClearReason('');
    if (tab === 'plant') {
      fetchBuyersWithPlantCredits();
    } else {
      fetchBuyersWithShippingCredits();
    }
  }, [fetchBuyersWithPlantCredits, fetchBuyersWithShippingCredits]);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setBarStyle('dark-content');
        StatusBar.setBackgroundColor('#FFFFFF');
      }
      if (activeTab === 'plant') {
        fetchBuyersWithPlantCredits();
      } else {
        fetchBuyersWithShippingCredits();
      }
    }, [activeTab, fetchBuyersWithPlantCredits, fetchBuyersWithShippingCredits])
  );

  const handleSearch = useCallback((text) => {
    setSearchText(text);
    
    if (!text.trim()) {
      // When search is cleared, show current loaded buyers
      setFilteredBuyers(buyers);
      return;
    }
    
    const searchLower = text.toLowerCase();
    // Search within ALL cached buyers, not just loaded ones
    setAllBuyersCache(cache => {
      const filtered = cache.filter(buyer => {
        const fullName = `${buyer.firstName} ${buyer.lastName}`.toLowerCase();
        const email = (buyer.email || '').toLowerCase();
        const username = (buyer.username || '').toLowerCase();
        
        return fullName.includes(searchLower) || 
               email.includes(searchLower) || 
               username.includes(searchLower);
      });
      
      setFilteredBuyers(filtered);
      return cache;
    });
  }, [buyers]);

  const handleBuyerPress = (buyer) => {
    setSelectedBuyer(buyer);
    setHistoryModalVisible(true);
    if (activeTab === 'plant') {
      fetchCreditHistory(buyer.uid);
    } else {
      fetchShippingCreditHistory(buyer.uid);
    }
  };

  const closeHistoryModal = () => {
    setHistoryModalVisible(false);
    setSelectedBuyer(null);
    setCreditHistory([]);
    setClearingTxId(null);
    setClearReason('');
  };

  const handleClearSingleCredit = async (transaction) => {
    if (!clearReason.trim()) return;

    setClearing(true);
    try {
      const result = await clearCreditsApi({
        buyerId: selectedBuyer.uid,
        reason: clearReason.trim(),
        transactionId: transaction.id,
        amount: transaction.amount,
      });

      if (result.success) {
        // Optimistically update local state
        setCreditHistory(prev =>
          prev.map(tx =>
            tx.id === transaction.id
              ? { ...tx, transactionType: 'cleared', description: `Credits cleared by admin: ${clearReason.trim()}`, clearedAt: new Date() }
              : tx
          )
        );
        // Update buyer balance
        const newBalance = Math.max(0, (selectedBuyer.plantCredits || 0) - (transaction.amount || 0));
        setSelectedBuyer(prev => ({ ...prev, plantCredits: newBalance }));
        setClearingTxId(null);
        setClearReason('');
      } else {
        Alert.alert('Error', result.error || 'Failed to clear credit.');
      }
    } catch (error) {
      console.error('Error clearing single credit:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setClearing(false);
    }
  };

  const openClearScreen = () => {
    if (!selectedBuyer) {
      return;
    }
    setHistoryModalVisible(false);
    // Pass only serializable buyer fields to avoid React Navigation warnings.
    navigation.navigate('AdminClearCreditsScreen', {
      buyer: {
        uid: selectedBuyer.uid,
        firstName: selectedBuyer.firstName || '',
        lastName: selectedBuyer.lastName || '',
        email: selectedBuyer.email || '',
        plantCredits: selectedBuyer.plantCredits ?? 0,
      },
    });
  };

  const formatDate = (date) => {
    if (!date) return '—';
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '—';
    return d.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  const renderCreditTransaction = ({ item }) => {
    const amount = item.amount || 0;
    const description = item.description || item.reason || '';
    const isCleared = item.transactionType === 'cleared' ||
                      description.toLowerCase().includes('credits cleared by admin') ||
                      description.toLowerCase().includes('cleared');
    // Cleared credits show as negative (deduction)
    const displayAmount = isCleared ? -Math.abs(amount) : amount;
    const isPositive = displayAmount > 0;

    // PlantItemCard approach: title = genus || plantName, subtitle = species
    const displayTitle = item.genus || item.plantName || item.plantCode || 'Unknown Plant';
    const displaySubtitle = item.species || '';

    // Source badge
    const getSourceBadge = () => {
      if (isCleared) {
        return { text: 'Clear Credit', color: '#E74C3C', bgColor: '#FDEDEC' };
      }
      if (description.toLowerCase().includes('reversed') || amount < 0) {
        return { text: 'Reversed', color: '#E74C3C', bgColor: '#FDEDEC' };
      }
      if (description.toLowerCase().includes('dead on arrival') || description.toLowerCase().includes('doa')) {
        return { text: 'DOA', color: '#E67E22', bgColor: '#FEF5E7' };
      }
      if (description.toLowerCase().includes('damaged')) {
        return { text: 'Damaged', color: '#9B59B6', bgColor: '#F5EEF8' };
      }
      if (description.toLowerCase().includes('missing')) {
        return { text: 'Missing', color: '#F39C12', bgColor: '#FEF9E7' };
      }
      if (description.toLowerCase().includes('mishap') || description.toLowerCase().includes('journey')) {
        return { text: 'Journey Mishap', color: '#3498DB', bgColor: '#EBF5FB' };
      }
      if (description.toLowerCase().includes('refund')) {
        return { text: 'Refund', color: '#27AE60', bgColor: '#E9F7EF' };
      }
      return { text: 'Credit', color: '#539461', bgColor: '#F0F7F1' };
    };

    const badge = getSourceBadge();
    const plantPrice = item.unitPrice ?? item.usdPrice ?? amount;

    return (
      <View style={styles.transactionCard}>
        {/* Header: badge + amount */}
        <View style={styles.transactionHeader}>
          <View style={[styles.sourceBadge, { backgroundColor: badge.bgColor }]}>
            <Text style={[styles.sourceBadgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
          <Text style={[styles.transactionAmount, isPositive ? styles.positiveAmount : styles.negativeAmount]}>
            {isPositive ? '+' : ''}${Math.abs(displayAmount).toFixed(2)}
          </Text>
        </View>

        {/* Plant section - always visible, even for cleared credits */}
        <TouchableOpacity
          style={styles.plantInfoSection}
          onPress={() => {
            if (item.plantCode) {
              closeHistoryModal();
              setTimeout(() => {
                navigation.navigate('ScreenPlantDetail', { plantCode: item.plantCode });
              }, 100);
            }
          }}
          activeOpacity={item.plantCode ? 0.7 : 1}
          disabled={!item.plantCode}
        >
          {item.plantImage ? (
            <Image source={{ uri: item.plantImage }} style={styles.plantImage} resizeMode="cover" />
          ) : (
            <View style={[styles.plantImage, styles.plantImagePlaceholder]}>
              <Text style={styles.plantImagePlaceholderText}>🌿</Text>
            </View>
          )}
          <View style={styles.plantTextInfo}>
            <Text style={styles.plantName} numberOfLines={2}>{displayTitle}</Text>
            {displaySubtitle ? (
              <Text style={styles.plantSubtitle} numberOfLines={1}>{displaySubtitle}</Text>
            ) : null}
            {item.plantCode && (
              <Text style={styles.plantCodeText}>{item.plantCode}</Text>
            )}
          </View>
        </TouchableOpacity>

        {/* Cleared note shown after plant details */}
        {isCleared && (
          <View style={styles.clearedBody}>
            <Text style={styles.clearedLabel}>Cleared</Text>
            <Text style={styles.clearedNote}>{item.reason || description.replace(/^Credits cleared by admin:?\s*/i, '') || '—'}</Text>
            <View style={styles.clearedMeta}>
              <Text style={styles.clearedDate}>{formatDate(item.clearedAt || item.createdAt)}</Text>
              {item.processedByName && (
                <Text style={styles.clearedBy}>by {item.processedByName}</Text>
              )}
            </View>
          </View>
        )}

        {/* Required fields - always show on every card */}
        <View style={styles.transactionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValue}>{item.orderId || '—'}</Text>
          </View>
          {item.transactionNumber && item.transactionNumber !== item.orderId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction Number</Text>
              <Text style={styles.detailValue}>{item.transactionNumber}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Date</Text>
            <Text style={styles.detailValue}>{formatDate(item.orderDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Flight Date</Text>
            <Text style={styles.detailValue}>{formatDate(item.flightDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plant Code</Text>
            <Text style={styles.detailValue}>{item.plantCode || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Genus</Text>
            <Text style={styles.detailValue}>{item.genus || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Species</Text>
            <Text style={styles.detailValue}>{item.species || '—'}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Price (USD)</Text>
            <Text style={styles.detailValue}>${Number(plantPrice).toFixed(2)}</Text>
          </View>
          {item.processedByName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Processed by</Text>
              <Text style={styles.detailValue}>{item.processedByName}</Text>
            </View>
          )}
          {!isCleared && item.balanceBefore !== undefined && item.balanceAfter !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Balance</Text>
              <Text style={styles.detailValue}>${item.balanceBefore} → ${item.balanceAfter}</Text>
            </View>
          )}
        </View>

        {/* View Invoice — always available when a transaction number can be resolved */}
        {(item.transactionNumber || item.orderId) && (
          <TouchableOpacity
            style={styles.viewInvoiceButton}
            onPress={() => {
              closeHistoryModal();
              setTimeout(() => {
                navigation.navigate('InvoiceViewScreen', {
                  transactionNumber: item.transactionNumber || item.orderId,
                });
              }, 100);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.viewInvoiceButtonText}>View Invoice</Text>
          </TouchableOpacity>
        )}

        {/* Clear single credit — only for non-cleared, positive credits */}
        {!isCleared && amount > 0 && (
          <>
            {clearingTxId === item.id ? (
              <View style={styles.clearForm}>
                <TextInput
                  style={styles.clearReasonInput}
                  placeholder="Reason for clearing this credit..."
                  placeholderTextColor="#9AA4A8"
                  value={clearReason}
                  onChangeText={setClearReason}
                  autoFocus
                />
                <View style={styles.clearFormActions}>
                  <TouchableOpacity
                    style={styles.clearFormCancel}
                    onPress={() => { setClearingTxId(null); setClearReason(''); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.clearFormCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.clearFormConfirm, (!clearReason.trim() || clearing) && styles.clearFormConfirmDisabled]}
                    onPress={() => handleClearSingleCredit(item)}
                    disabled={!clearReason.trim() || clearing}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.clearFormConfirmText}>
                      {clearing ? 'Clearing...' : `Clear $${Math.abs(amount).toFixed(2)}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => { setClearingTxId(item.id); setClearReason(''); }}
                activeOpacity={0.7}
              >
                <Text style={styles.clearButtonText}>Clear Credit</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  };

  // ── Shipping credit clear handler ───────────────────────────────────

  const handleClearSingleShippingCredit = async (transaction) => {
    if (!clearReason.trim()) return;

    setClearing(true);
    try {
      const result = await clearCreditsApi({
        buyerId: selectedBuyer.uid,
        reason: clearReason.trim(),
        transactionId: transaction.id,
        amount: transaction.amount,
      });

      if (result.success) {
        setCreditHistory(prev =>
          prev.map(tx =>
            tx.id === transaction.id
              ? { ...tx, transactionType: 'cleared', description: `Credits cleared by admin: ${clearReason.trim()}`, clearedAt: new Date() }
              : tx
          )
        );
        const newBalance = Math.max(0, (selectedBuyer.shippingCredits || 0) - (transaction.amount || 0));
        setSelectedBuyer(prev => ({ ...prev, shippingCredits: newBalance }));
        setClearingTxId(null);
        setClearReason('');
      } else {
        Alert.alert('Error', result.error || 'Failed to clear shipping credit.');
      }
    } catch (error) {
      console.error('Error clearing shipping credit:', error);
      Alert.alert('Error', 'An unexpected error occurred.');
    } finally {
      setClearing(false);
    }
  };

  // ── Shipping credit transaction card ────────────────────────────────

  const renderShippingTransaction = ({ item }) => {
    const amount = item.amount || 0;
    const description = item.description || item.reason || '';
    const isCleared = item.transactionType === 'cleared' ||
                      description.toLowerCase().includes('credits cleared by admin') ||
                      description.toLowerCase().includes('cleared');
    const displayAmount = isCleared ? -Math.abs(amount) : amount;
    const isPositive = displayAmount > 0;

    const getSourceBadge = () => {
      if (isCleared) {
        return { text: 'Cleared', color: '#E74C3C', bgColor: '#FDEDEC' };
      }
      if (description.toLowerCase().includes('missing')) {
        return { text: 'Missing Shipping', color: '#F39C12', bgColor: '#FEF9E7' };
      }
      if (description.toLowerCase().includes('damaged')) {
        return { text: 'Damaged Shipping', color: '#9B59B6', bgColor: '#F5EEF8' };
      }
      return { text: 'Shipping Credit', color: '#3498DB', bgColor: '#EBF5FB' };
    };

    const badge = getSourceBadge();

    return (
      <View style={styles.transactionCard}>
        {/* Header: badge + amount */}
        <View style={styles.transactionHeader}>
          <View style={[styles.sourceBadge, { backgroundColor: badge.bgColor }]}>
            <Text style={[styles.sourceBadgeText, { color: badge.color }]}>{badge.text}</Text>
          </View>
          <Text style={[styles.transactionAmount, isPositive ? styles.positiveAmount : styles.negativeAmount]}>
            {isPositive ? '+' : ''}${Math.abs(displayAmount).toFixed(2)}
          </Text>
        </View>

        {/* Description */}
        <Text style={styles.shippingDescription} numberOfLines={2}>
          {description}
        </Text>

        {/* Cleared note */}
        {isCleared && (
          <View style={styles.clearedBody}>
            <Text style={styles.clearedLabel}>Cleared</Text>
            <Text style={styles.clearedNote}>{item.reason || description.replace(/^Credits cleared by admin:?\s*/i, '') || '—'}</Text>
            <View style={styles.clearedMeta}>
              <Text style={styles.clearedDate}>{formatDate(item.clearedAt || item.createdAt)}</Text>
              {item.processedByName && (
                <Text style={styles.clearedBy}>by {item.processedByName}</Text>
              )}
            </View>
          </View>
        )}

        {/* Details */}
        <View style={styles.transactionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Date</Text>
            <Text style={styles.detailValue}>{formatDate(item.createdAt)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order ID</Text>
            <Text style={styles.detailValue}>{item.orderId || '—'}</Text>
          </View>
          {item.transactionNumber && item.transactionNumber !== item.orderId && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction Number</Text>
              <Text style={styles.detailValue}>{item.transactionNumber}</Text>
            </View>
          )}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Order Date</Text>
            <Text style={styles.detailValue}>{formatDate(item.orderDate)}</Text>
          </View>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Flight Date</Text>
            <Text style={styles.detailValue}>{formatDate(item.flightDate)}</Text>
          </View>
          {item.shippingSpeed && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>UPS Speed</Text>
              <Text style={styles.detailValue}>{
                ['next_day', 'nextday', 'next-day'].includes(String(item.shippingSpeed).toLowerCase())
                  ? 'Next Day'
                  : ['second_day', '2nd_day', '2day', '2-day', 'second-day'].includes(String(item.shippingSpeed).toLowerCase())
                    ? '2nd Day'
                    : String(item.shippingSpeed)
              }</Text>
            </View>
          )}
          {item.processedByName && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Processed by</Text>
              <Text style={styles.detailValue}>{item.processedByName}</Text>
            </View>
          )}
          {!isCleared && item.balanceBefore !== undefined && item.balanceAfter !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Balance</Text>
              <Text style={styles.detailValue}>${item.balanceBefore} → ${item.balanceAfter}</Text>
            </View>
          )}
        </View>

        {/* View Invoice */}
        {(item.transactionNumber || item.orderId) && (
          <TouchableOpacity
            style={styles.viewInvoiceButton}
            onPress={() => {
              closeHistoryModal();
              setTimeout(() => {
                navigation.navigate('InvoiceViewScreen', {
                  transactionNumber: item.transactionNumber || item.orderId,
                });
              }, 100);
            }}
            activeOpacity={0.8}
          >
            <Text style={styles.viewInvoiceButtonText}>View Invoice</Text>
          </TouchableOpacity>
        )}

        {/* Clear button */}
        {!isCleared && amount > 0 && (
          <>
            {clearingTxId === item.id ? (
              <View style={styles.clearForm}>
                <TextInput
                  style={styles.clearReasonInput}
                  placeholder="Reason for clearing this credit..."
                  placeholderTextColor="#9AA4A8"
                  value={clearReason}
                  onChangeText={setClearReason}
                  autoFocus
                />
                <View style={styles.clearFormActions}>
                  <TouchableOpacity
                    style={styles.clearFormCancel}
                    onPress={() => { setClearingTxId(null); setClearReason(''); }}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.clearFormCancelText}>Cancel</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={[styles.clearFormConfirm, (!clearReason.trim() || clearing) && styles.clearFormConfirmDisabled]}
                    onPress={() => handleClearSingleShippingCredit(item)}
                    disabled={!clearReason.trim() || clearing}
                    activeOpacity={0.7}
                  >
                    <Text style={styles.clearFormConfirmText}>
                      {clearing ? 'Clearing...' : `Clear $${Math.abs(amount).toFixed(2)}`}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>
            ) : (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={() => { setClearingTxId(item.id); setClearReason(''); }}
                activeOpacity={0.7}
              >
                <Text style={styles.clearButtonText}>Clear Credit</Text>
              </TouchableOpacity>
            )}
          </>
        )}
      </View>
    );
  };

  const renderBuyerItem = ({ item }) => {
    const fullName = `${item.firstName} ${item.lastName}`.trim() || 'Unknown';
    const isShipping = activeTab === 'shipping';
    const balance = isShipping ? (item.shippingCredits || 0) : (item.plantCredits || 0);

    return (
      <TouchableOpacity
        style={styles.buyerCard}
        onPress={() => handleBuyerPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.buyerInfo}>
          <Text style={styles.buyerName}>{fullName}</Text>
          <Text style={styles.buyerEmail}>{item.email || item.username || '—'}</Text>
          {item.country && (
            <Text style={styles.buyerCountry}>{item.country}</Text>
          )}
        </View>
        <View style={[styles.creditsContainer, balance === 0 && styles.creditsContainerZero]}>
          <Text style={[styles.creditsValue, balance === 0 && styles.creditsValueZero]}>${balance}</Text>
          <Text style={styles.creditsLabel}>credits</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {Platform.OS === 'android' && (
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      )}
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: 12 }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <BackSolidIcon width={24} height={24} color="#202325" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Credits Management</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Tab Bar */}
      <View style={styles.tabBar}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'plant' && styles.tabActive]}
          onPress={() => handleTabChange('plant')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'plant' && styles.tabTextActive]}>Plant Credits</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'shipping' && styles.tabActive]}
          onPress={() => handleTabChange('shipping')}
          activeOpacity={0.7}
        >
          <Text style={[styles.tabText, activeTab === 'shipping' && styles.tabTextActive]}>Shipping Credits</Text>
        </TouchableOpacity>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search buyers by name or email..."
          placeholderTextColor="#9AA4A8"
          value={searchText}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {filteredBuyers.length} {filteredBuyers.length === 1 ? 'buyer' : 'buyers'} with {activeTab === 'plant' ? 'plant' : 'shipping'} credit history
        </Text>
        {filteredBuyers.length > 0 && (
          <Text style={styles.summarySubtext}>
            Current total balance: ${filteredBuyers.reduce((sum, b) => sum + (activeTab === 'plant' ? (b.plantCredits || 0) : (b.shippingCredits || 0)), 0).toFixed(2)}
          </Text>
        )}
      </View>

      {/* Buyers List */}
      {loading ? (
        <BuyerSkeletonList count={6} />
      ) : filteredBuyers.length > 0 ? (
        <FlatList
          data={filteredBuyers}
          keyExtractor={(item) => item.uid}
          renderItem={renderBuyerItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          onEndReached={() => {
            if (!searchText && hasMore && !loadingMore) {
              console.log('📜 Loading more buyers...');
              handleLoadMore();
            }
          }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={() => {
            if (!searchText && loadingMore) {
              return (
                <View style={styles.footerLoader}>
                  <ActivityIndicator size="small" color="#539461" />
                  <Text style={styles.footerLoaderText}>Loading more...</Text>
                </View>
              );
            }
            if (!searchText && !hasMore && buyers.length > PAGE_SIZE) {
              return (
                <View style={styles.footerLoader}>
                  <Text style={styles.footerEndText}>
                    No more buyers to load
                  </Text>
                </View>
              );
            }
            return null;
          }}
        />
      ) : (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>
            {searchText ? 'No buyers found' : 'No buyers with plant credit history'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchText ? 'Try a different search term' : 'Buyers will appear here when they receive or clear plant credits'}
          </Text>
        </View>
      )}

      {/* Credit History Modal */}
      <Modal
        visible={historyModalVisible}
        animationType="slide"
        transparent={false}
        onRequestClose={closeHistoryModal}
      >
        <SafeAreaView style={styles.modalContainer} edges={['bottom']}>
          {Platform.OS === 'android' && (
            <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
          )}

          {/* Modal Header */}
          <View style={[styles.modalHeader, { paddingTop: Math.max(insets.top + 8, 16) }]}>
            <TouchableOpacity
              onPress={closeHistoryModal}
              style={styles.closeButton}
              activeOpacity={0.7}
            >
              <CloseIcon width={24} height={24} />
            </TouchableOpacity>
            <View style={styles.modalHeaderContent}>
              <Text style={styles.modalTitle}>{activeTab === 'plant' ? 'Plant' : 'Shipping'} Credit History</Text>
              {selectedBuyer && (
                <Text style={styles.modalSubtitle}>
                  {selectedBuyer.firstName} {selectedBuyer.lastName}
                </Text>
              )}
            </View>
            <View style={styles.headerSpacer} />
          </View>

          {/* Current Balance */}
          {selectedBuyer && (
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceValue}>
                ${activeTab === 'plant' ? (selectedBuyer.plantCredits || 0) : (selectedBuyer.shippingCredits || 0)}
              </Text>
            </View>
          )}

          {/* Transaction History */}
          {loadingHistory ? (
            <TransactionSkeletonList count={3} />
          ) : creditHistory.length > 0 ? (
            <ScrollView
              style={styles.historyList}
              contentContainerStyle={styles.historyContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.historyTitle}>Transaction History</Text>
              {creditHistory.map((transaction, index) => (
                <View key={transaction.id || index}>
                  {activeTab === 'plant'
                    ? renderCreditTransaction({ item: transaction })
                    : renderShippingTransaction({ item: transaction })
                  }
                </View>
              ))}
            </ScrollView>
          ) : (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyTitle}>No transaction history</Text>
              <Text style={styles.emptySubtitle}>
                No credit transactions found for this buyer
              </Text>
            </View>
          )}
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
};

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
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEEA',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  tabBar: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEEA',
    gap: 0,
  },
  tab: {
    flex: 1,
    paddingVertical: 10,
    alignItems: 'center',
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  tabActive: {
    borderBottomColor: '#539461',
  },
  tabText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#9AA4A8',
  },
  tabTextActive: {
    color: '#539461',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D7E6D9',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#202325',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEEA',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202325',
  },
  summarySubtext: {
    fontSize: 13,
    color: '#6B777B',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  buyerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EEEA',
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  buyerInfo: {
    flex: 1,
    marginRight: 12,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 4,
  },
  buyerEmail: {
    fontSize: 13,
    color: '#6B777B',
    marginBottom: 2,
  },
  buyerCountry: {
    fontSize: 12,
    color: '#9AA4A8',
  },
  creditsContainer: {
    alignItems: 'center',
    backgroundColor: '#FFF4ED',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 80,
  },
  creditsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#FF8C00',
  },
  creditsValueZero: {
    color: '#9AA4A8',
  },
  creditsContainerZero: {
    backgroundColor: '#F0F2F2',
  },
  creditsLabel: {
    fontSize: 11,
    color: '#6B777B',
    marginTop: 2,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B777B',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B777B',
    textAlign: 'center',
  },
  // Modal Styles
  modalContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEEA',
  },
  closeButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modalHeaderContent: {
    flex: 1,
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  modalSubtitle: {
    fontSize: 14,
    color: '#6B777B',
    marginTop: 2,
  },
  balanceCard: {
    backgroundColor: '#FFF4ED',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 14,
    color: '#6B777B',
    marginBottom: 8,
  },
  balanceValue: {
    fontSize: 32,
    fontWeight: '700',
    color: '#FF8C00',
  },
  historyList: {
    flex: 1,
  },
  historyContent: {
    padding: 16,
  },
  historyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 12,
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EEEA',
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  transactionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  sourceBadge: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  sourceBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  transactionDate: {
    fontSize: 12,
    color: '#9AA4A8',
    marginBottom: 8,
  },
  transactionAmount: {
    fontSize: 20,
    fontWeight: '700',
  },
  positiveAmount: {
    color: '#27AE60',
  },
  negativeAmount: {
    color: '#E74C3C',
  },
  plantInfoSection: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEEA',
  },
  plantImage: {
    width: 60,
    height: 60,
    borderRadius: 8,
    backgroundColor: '#F9FAFB',
  },
  plantImagePlaceholder: {
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E8EEEA',
    borderStyle: 'dashed',
  },
  plantImagePlaceholderText: {
    fontSize: 24,
  },
  plantTextInfo: {
    flex: 1,
    marginLeft: 12,
  },
  plantName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 4,
  },
  plantSubtitle: {
    fontSize: 13,
    color: '#6B777B',
    marginTop: 2,
  },
  plantCodeText: {
    fontSize: 11,
    color: '#9AA4A8',
    marginTop: 4,
  },
  datesSection: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEEA',
  },
  dateItem: {
    flex: 1,
  },
  dateLabel: {
    fontSize: 11,
    color: '#9AA4A8',
    marginBottom: 2,
  },
  dateValue: {
    fontSize: 13,
    color: '#202325',
    fontWeight: '600',
  },
  transactionDescription: {
    fontSize: 13,
    color: '#6B777B',
    marginBottom: 12,
    lineHeight: 18,
  },
  shippingDescription: {
    fontSize: 14,
    color: '#202325',
    marginTop: 10,
    marginBottom: 10,
    lineHeight: 20,
    fontWeight: '500',
  },
  transactionDetails: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
  },
  detailLabel: {
    fontSize: 12,
    color: '#6B777B',
  },
  detailValue: {
    fontSize: 12,
    color: '#202325',
    fontWeight: '500',
    flex: 1,
    textAlign: 'right',
    marginLeft: 8,
  },
  footerLoader: {
    paddingVertical: 20,
    alignItems: 'center',
  },
  footerLoaderText: {
    marginTop: 8,
    fontSize: 13,
    color: '#6B777B',
  },
  footerEndText: {
    fontSize: 13,
    color: '#9AA4A8',
    fontStyle: 'italic',
  },
  clearCreditButton: {
    backgroundColor: '#E74C3C',
    paddingVertical: 8,
    paddingHorizontal: 14,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearCreditButtonText: {
    color: '#FFFFFF',
    fontSize: 13,
    fontWeight: '700',
  },
  headerSpacer: {
    width: 40,
  },
  clearedBody: {
    marginTop: 12,
    marginBottom: 12,
    padding: 12,
    backgroundColor: '#FDEDEC',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#E74C3C',
  },
  clearedLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#E74C3C',
    marginBottom: 4,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  clearedNote: {
    fontSize: 14,
    color: '#202325',
    lineHeight: 20,
    fontWeight: '500',
  },
  clearedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    gap: 8,
  },
  clearedDate: {
    fontSize: 12,
    color: '#E74C3C',
    fontWeight: '600',
  },
  clearedBy: {
    fontSize: 12,
    color: '#6B777B',
    fontWeight: '500',
  },
  clearButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E74C3C',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  clearButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#E74C3C',
  },
  clearForm: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E8EEEA',
  },
  clearReasonInput: {
    borderWidth: 1,
    borderColor: '#D7E6D9',
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#202325',
  },
  clearFormActions: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    marginTop: 10,
  },
  clearFormCancel: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#F0F2F2',
  },
  clearFormCancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#6B777B',
  },
  clearFormConfirm: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 8,
    backgroundColor: '#E74C3C',
  },
  clearFormConfirmDisabled: {
    backgroundColor: '#F5A9A9',
  },
  clearFormConfirmText: {
    fontSize: 13,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  viewInvoiceButton: {
    marginTop: 12,
    paddingVertical: 10,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#539461',
    backgroundColor: '#FFFFFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  viewInvoiceButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#539461',
  },
  // Skeleton placeholders
  skelBlock: {
    backgroundColor: SKEL_BASE,
    borderRadius: 6,
  },
  // Buyer card skeleton
  skelName: {
    width: '55%',
    height: 16,
    marginBottom: 8,
  },
  skelEmail: {
    width: '75%',
    height: 12,
    backgroundColor: SKEL_LIGHT,
    marginBottom: 6,
  },
  skelCountry: {
    width: '35%',
    height: 10,
    backgroundColor: SKEL_LIGHT,
  },
  skelBalanceValue: {
    width: 56,
    height: 20,
    marginBottom: 6,
  },
  skelBalanceLabel: {
    width: 40,
    height: 10,
    backgroundColor: SKEL_LIGHT,
  },
  // Transaction card skeleton
  skelBadge: {
    width: 84,
    height: 22,
    borderRadius: 12,
  },
  skelAmount: {
    width: 70,
    height: 20,
  },
  skelPlantName: {
    width: '70%',
    height: 16,
    marginBottom: 6,
  },
  skelPlantSub: {
    width: '50%',
    height: 12,
    backgroundColor: SKEL_LIGHT,
    marginBottom: 6,
  },
  skelPlantCode: {
    width: 90,
    height: 10,
    backgroundColor: SKEL_LIGHT,
  },
  skelDetailLabel: {
    width: 80,
    height: 10,
  },
  skelDetailValue: {
    width: 110,
    height: 10,
    backgroundColor: SKEL_LIGHT,
  },
  skelClearButton: {
    width: 64,
    height: 28,
    borderRadius: 8,
    alignSelf: 'flex-end',
    marginTop: 12,
  },
  skelHistoryTitle: {
    width: 160,
    height: 18,
    marginBottom: 12,
  },
});

export default PlantCreditsManagement;
