import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  StatusBar,
  Modal,
  ScrollView,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, query, where, orderBy, limit, startAfter, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import Svg, { Path } from 'react-native-svg';

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
  const [lastDoc, setLastDoc] = useState(null);
  const [hasMore, setHasMore] = useState(true);
  const [allBuyersCache, setAllBuyersCache] = useState([]);
  
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
      
      // 1. Fetch buyers from buyer collection (check both plantCredits and plant_credits)
      const buyersSnap = await getDocs(collection(db, 'buyer'));
      const buyerMap = new Map(); // uid -> buyer data
      
      buyersSnap.forEach(docSnap => {
        const data = docSnap.data();
        const plantCredits = data.plantCredits ?? data.plant_credits ?? 0;
        
        if (plantCredits > 0) {
          buyerMap.set(docSnap.id, {
            uid: docSnap.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            username: data.username || '',
            plantCredits: Number(plantCredits),
            country: data.country || data.region || '',
            createdAt: data.createdAt,
          });
        }
      });
      
      // 2. Also check plant_credits collection for buyers with available credits
      // (catches cases where buyer.plantCredits wasn't synced)
      try {
        const plantCreditsSnap = await getDocs(collection(db, 'plant_credits'));
        const creditsByBuyer = new Map(); // buyerUid -> total available amount
        
        plantCreditsSnap.forEach(docSnap => {
          const data = docSnap.data();
          if (data.buyerUid && (data.status === 'available' || !data.status)) {
            const amount = (data.amount || 0) - (data.usedAmount || 0);
            if (amount > 0) {
              creditsByBuyer.set(data.buyerUid, (creditsByBuyer.get(data.buyerUid) || 0) + amount);
            }
          }
        });
        
        // Add buyers from plant_credits who aren't in buyerMap or have higher balance
        const missingUids = [];
        for (const [buyerUid, totalCredits] of creditsByBuyer) {
          const existing = buyerMap.get(buyerUid);
          const credits = Number(totalCredits.toFixed(2));
          if (credits > 0) {
            if (existing) {
              if (credits > existing.plantCredits) {
                existing.plantCredits = credits;
              }
            } else {
              missingUids.push({ buyerUid, credits });
            }
          }
        }
        const buyerDocs = await Promise.all(missingUids.map(({ buyerUid }) => getDoc(doc(db, 'buyer', buyerUid))));
        missingUids.forEach(({ buyerUid, credits }, i) => {
          const buyerDoc = buyerDocs[i];
          const data = buyerDoc?.exists() ? buyerDoc.data() : {};
          // If the buyer document explicitly has plantCredits set to 0,
          // that is the authoritative source — skip stale plant_credits records
          const buyerDocCredits = data.plantCredits ?? data.plant_credits;
          if (buyerDocCredits === 0) {
            console.log(`⚠️ Skipping ${data.firstName} ${data.lastName}: buyer.plantCredits is 0 (stale plant_credits record)`);
            return;
          }
          buyerMap.set(buyerUid, {
            uid: buyerUid,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            username: data.username || '',
            plantCredits: credits,
            country: data.country || data.region || '',
            createdAt: data.createdAt,
          });
        });
      } catch (plantCreditsErr) {
        console.warn('Could not fetch plant_credits collection:', plantCreditsErr);
      }
      
      // 3. Get latest balance from credit_transactions (authoritative source)
      try {
        const transactionsSnap = await getDocs(
          query(
            collection(db, 'credit_transactions'),
            orderBy('createdAt', 'desc'),
            limit(2000)
          )
        );
        const latestBalanceByBuyer = new Map(); // buyerUid -> balance (from most recent tx)
        transactionsSnap.forEach(docSnap => {
          const data = docSnap.data();
          const isShipping = data.creditType?.toLowerCase().includes('shipping') ||
            data.type?.toLowerCase().includes('shipping');
          if (isShipping) return;
          const buyerUid = data.buyerUid;
          if (!buyerUid || latestBalanceByBuyer.has(buyerUid)) return;
          const balanceAfter = data.balanceAfter ?? 0;
          latestBalanceByBuyer.set(buyerUid, Number(balanceAfter));
        });
        latestBalanceByBuyer.forEach((balance, buyerUid) => {
          if (balance > 0) {
            const existing = buyerMap.get(buyerUid);
            if (existing) {
              existing.plantCredits = balance;
            }
          } else {
            // Balance is 0 or negative — remove from map (credits fully used/reversed)
            if (buyerMap.has(buyerUid)) {
              console.log(`🔄 Removing ${buyerUid} from list: latest transaction balance is ${balance}`);
              buyerMap.delete(buyerUid);
            }
          }
        });
        const uidsNeedingBuyerInfo = [...latestBalanceByBuyer.entries()]
          .filter(([uid, balance]) => balance > 0 && !buyerMap.has(uid))
          .map(([uid]) => uid);
        if (uidsNeedingBuyerInfo.length > 0) {
          const buyerDocs = await Promise.all(uidsNeedingBuyerInfo.map(uid => getDoc(doc(db, 'buyer', uid))));
          uidsNeedingBuyerInfo.forEach((buyerUid, i) => {
            const buyerDoc = buyerDocs[i];
            const data = buyerDoc?.exists() ? buyerDoc.data() : {};
            const balance = latestBalanceByBuyer.get(buyerUid);
            buyerMap.set(buyerUid, {
              uid: buyerUid,
              firstName: data.firstName || '',
              lastName: data.lastName || '',
              email: data.email || '',
              username: data.username || '',
              plantCredits: balance,
              country: data.country || data.region || '',
              createdAt: data.createdAt,
            });
          });
        }
      } catch (txErr) {
        console.warn('Could not fetch latest balance from credit_transactions:', txErr);
      }
      
      const buyersWithCredits = Array.from(buyerMap.values()).filter(b => b.plantCredits > 0);
      
      // Sort by plantCredits descending (highest first)
      buyersWithCredits.sort((a, b) => b.plantCredits - a.plantCredits);
      
      console.log(`💰 Found ${buyersWithCredits.length} total buyers with plant credits`);
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

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setBarStyle('dark-content');
        StatusBar.setBackgroundColor('#FFFFFF');
      }
      fetchBuyersWithPlantCredits();
    }, [fetchBuyersWithPlantCredits])
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
    fetchCreditHistory(buyer.uid);
  };

  const closeHistoryModal = () => {
    setHistoryModalVisible(false);
    setSelectedBuyer(null);
    setCreditHistory([]);
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
    const isPositive = amount > 0;
    const description = item.description || item.reason || '';
    
    // PlantItemCard approach: title = genus || plantName, subtitle = species
    const displayTitle = item.genus || item.plantName || item.plantCode || 'Unknown Plant';
    const displaySubtitle = item.species || '';
    
    // Source badge
    const getSourceBadge = () => {
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
            {isPositive ? '+' : ''}${Math.abs(amount).toFixed(0)}
          </Text>
        </View>
        
        {/* Plant section - PlantItemCard style, clickable */}
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
        
        {/* Required fields - always show on every card */}
        <View style={styles.transactionDetails}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Transaction #</Text>
            <Text style={styles.detailValue}>{item.transactionNumber || item.orderId || '—'}</Text>
          </View>
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
          {item.balanceBefore !== undefined && item.balanceAfter !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Balance</Text>
              <Text style={styles.detailValue}>${item.balanceBefore} → ${item.balanceAfter}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  const renderBuyerItem = ({ item }) => {
    const fullName = `${item.firstName} ${item.lastName}`.trim() || 'Unknown';
    
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
        <View style={styles.creditsContainer}>
          <Text style={styles.creditsValue}>${item.plantCredits}</Text>
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
        <Text style={styles.headerTitle}>Plant Credits</Text>
        <View style={{ width: 24 }} />
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
          {filteredBuyers.length} {filteredBuyers.length === 1 ? 'buyer' : 'buyers'} with plant credits
        </Text>
        {filteredBuyers.length > 0 && (
          <Text style={styles.summarySubtext}>
            Total: ${filteredBuyers.reduce((sum, b) => sum + b.plantCredits, 0)} in credits
          </Text>
        )}
      </View>

      {/* Buyers List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#539461" />
          <Text style={styles.loadingText}>Loading buyers...</Text>
        </View>
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
            {searchText ? 'No buyers found' : 'No buyers with plant credits'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchText ? 'Try a different search term' : 'Buyers will appear here when they receive plant credits'}
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
              <Text style={styles.modalTitle}>Credit History</Text>
              {selectedBuyer && (
                <Text style={styles.modalSubtitle}>
                  {selectedBuyer.firstName} {selectedBuyer.lastName}
                </Text>
              )}
            </View>
            <View style={{ width: 24 }} />
          </View>

          {/* Current Balance */}
          {selectedBuyer && (
            <View style={styles.balanceCard}>
              <Text style={styles.balanceLabel}>Current Balance</Text>
              <Text style={styles.balanceValue}>${selectedBuyer.plantCredits}</Text>
            </View>
          )}

          {/* Transaction History */}
          {loadingHistory ? (
            <View style={styles.loadingWrap}>
              <ActivityIndicator size="large" color="#539461" />
              <Text style={styles.loadingText}>Loading history...</Text>
            </View>
          ) : creditHistory.length > 0 ? (
            <ScrollView 
              style={styles.historyList}
              contentContainerStyle={styles.historyContent}
              showsVerticalScrollIndicator={false}
            >
              <Text style={styles.historyTitle}>Transaction History</Text>
              {creditHistory.map((transaction, index) => (
                <View key={transaction.id || index}>
                  {renderCreditTransaction({ item: transaction })}
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
});

export default PlantCreditsManagement;
