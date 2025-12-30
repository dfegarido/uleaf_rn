import React, {useState, useCallback, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  Image,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput,
  ScrollView,
  TouchableWithoutFeedback,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {useFocusEffect} from '@react-navigation/native';
import {useNavigation} from '@react-navigation/native';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import SearchIcon from '../../../assets/admin-icons/search.svg';
import CloseIcon from '../../../assets/admin-icons/x.svg';
import ArrowDownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import {searchBuyersApi} from '../../../components/Api/searchBuyersApi';
import {getAllUsersApi} from '../../../components/Api/getAllUsersApi';
import {generateInvoiceApi, getInvoicePdfApi} from '../../../components/Api/orderManagementApi';
import {getAdminOrdersApi} from '../../../components/Api/adminOrderApi';
import NetInfo from '@react-native-community/netinfo';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';

// Buyer Selection Modal Component
const BuyerSelectionModal = ({ isVisible, onClose, onSelectBuyer, buyers, loading, searchQuery, onSearchChange }) => {
  // Filter buyers based on the search query
  const filteredBuyers = buyers.filter(buyer => {
    const name = buyer.name || `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() || '';
    const email = buyer.email || '';
    const username = buyer.username || '';
    const searchLower = searchQuery.toLowerCase();
    return name.toLowerCase().includes(searchLower) || 
           email.toLowerCase().includes(searchLower) ||
           username.toLowerCase().includes(searchLower);
  });

  const handleSelect = (buyer) => {
    onSelectBuyer(buyer);
    onClose();
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.actionSheetContainer}>
              <SafeAreaView>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderTitle}>Select Buyer</Text>
                  <TouchableOpacity onPress={onClose}>
                    <CloseIcon width={24} height={24} />
                  </TouchableOpacity>
                </View>

                {/* Content Area */}
                <View style={styles.modalContentContainer}>
                  {/* Search Bar */}
                  <View style={styles.searchFieldContainer}>
                    <SearchIcon width={20} height={20} />
                    <TextInput
                      style={styles.searchTextInput}
                      placeholder="Search by name, email, or username..."
                      placeholderTextColor="#647276"
                      value={searchQuery}
                      onChangeText={onSearchChange}
                    />
                  </View>

                  {/* Scrollable List of Buyers */}
                  {loading ? (
                    <View style={styles.loadingContainer}>
                      <ActivityIndicator size="small" color="#539461" />
                      <Text style={styles.loadingText}>Loading buyers...</Text>
                    </View>
                  ) : (
                    <ScrollView style={styles.buyerListContainer} showsVerticalScrollIndicator={false}>
                      {filteredBuyers.length === 0 ? (
                        <View style={styles.emptyBuyerContainer}>
                          <Text style={styles.emptyBuyerText}>
                            {searchQuery ? 'No buyers found' : 'No buyers available'}
                          </Text>
                        </View>
                      ) : (
                        filteredBuyers.map((buyer, index) => {
                          const buyerName = buyer.name || `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() || buyer.email || 'Unknown';
                          const avatarUrl = buyer.profileImage || buyer.avatar || '';
                          return (
                            <View key={buyer.id || buyer.uid || index}>
                              <TouchableOpacity 
                                style={styles.buyerItemContainer} 
                                onPress={() => handleSelect(buyer)}
                              >
                                {avatarUrl ? (
                                  <Image source={{ uri: avatarUrl }} style={styles.buyerAvatar} />
                                ) : (
                                  <View style={[styles.buyerAvatar, styles.buyerAvatarPlaceholder]}>
                                    <Text style={styles.buyerAvatarText}>
                                      {buyerName.charAt(0).toUpperCase()}
                                    </Text>
                                  </View>
                                )}
                                <View style={styles.buyerInfo}>
                                  <Text style={styles.buyerName}>{buyerName}</Text>
                                  {buyer.email && (
                                    <Text style={styles.buyerEmail}>{buyer.email}</Text>
                                  )}
                                  {buyer.username && buyer.username !== buyer.email && (
                                    <Text style={styles.buyerUsername}>@{buyer.username}</Text>
                                  )}
                                </View>
                              </TouchableOpacity>
                              {index < filteredBuyers.length - 1 && <View style={styles.divider} />}
                            </View>
                          );
                        })
                      )}
                    </ScrollView>
                  )}
                </View>
              </SafeAreaView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Invoice Generation Modal Component
const InvoiceGenerationModal = ({ isVisible, onClose, buyer, transaction, onGenerate }) => {
  const [transactionNumber, setTransactionNumber] = useState('');
  const [plantCode, setPlantCode] = useState('');
  const [loading, setLoading] = useState(false);

  // Update transaction number when transaction prop changes or modal opens
  useEffect(() => {
    if (isVisible && transaction?.transactionNumber) {
      setTransactionNumber(transaction.transactionNumber);
    } else if (!isVisible) {
      // Reset when modal closes
      setTransactionNumber('');
      setPlantCode('');
    }
  }, [transaction, isVisible]);

  const handleGenerate = async () => {
    if (!transactionNumber.trim()) {
      Alert.alert('Error', 'Please enter a transaction number');
      return;
    }

    setLoading(true);
    try {
      const response = await generateInvoiceApi({
        transactionNumber: transactionNumber.trim(),
        plantCode: plantCode.trim() || undefined,
      });

      if (response.success) {
        Alert.alert(
          'Success',
          response.message || 'Invoice generated and sent successfully',
          [{text: 'OK', onPress: () => {
            setTransactionNumber('');
            setPlantCode('');
            onClose();
            onGenerate();
          }}]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to generate invoice');
      }
    } catch (error) {
      console.error('Error generating invoice:', error);
      Alert.alert('Error', error.message || 'An error occurred while generating invoice');
    } finally {
      setLoading(false);
    }
  };

  const buyerName = buyer?.name || `${buyer?.firstName || ''} ${buyer?.lastName || ''}`.trim() || buyer?.email || 'Unknown';

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={styles.invoiceModalContainer}>
              <SafeAreaView>
                {/* Header */}
                <View style={styles.modalHeader}>
                  <Text style={styles.modalHeaderTitle}>Generate Invoice</Text>
                  <TouchableOpacity onPress={onClose}>
                    <CloseIcon width={24} height={24} />
                  </TouchableOpacity>
                </View>

                {/* Content Area */}
                <ScrollView style={styles.invoiceModalContent} showsVerticalScrollIndicator={false}>
                  {/* Selected Buyer Info */}
                  {buyer && (
                    <View style={styles.selectedBuyerCard}>
                      <View style={styles.selectedBuyerContent}>
                        {buyer.profileImage ? (
                          <Image source={{ uri: buyer.profileImage }} style={styles.selectedBuyerAvatar} />
                        ) : (
                          <View style={[styles.selectedBuyerAvatar, styles.buyerAvatarPlaceholder]}>
                            <Text style={styles.buyerAvatarText}>
                              {buyerName.charAt(0).toUpperCase()}
                            </Text>
                          </View>
                        )}
                        <View style={styles.selectedBuyerInfo}>
                          <Text style={styles.selectedBuyerName}>{buyerName}</Text>
                          {buyer.email && (
                            <Text style={styles.selectedBuyerEmail}>{buyer.email}</Text>
                          )}
                        </View>
                      </View>
                    </View>
                  )}

                  <View style={styles.invoiceFormContainer}>
                    <Text style={styles.invoiceDescription}>
                      Enter the transaction number to generate and send an invoice via email.
                    </Text>

                    {/* Transaction Number Input */}
                    <View style={styles.invoiceInputContainer}>
                      <Text style={styles.invoiceLabel}>Transaction Number *</Text>
                      <TextInput
                        style={styles.invoiceInput}
                        placeholder="Enter transaction number"
                        placeholderTextColor="#9CA3AF"
                        value={transactionNumber}
                        onChangeText={setTransactionNumber}
                        autoCapitalize="none"
                        editable={!loading}
                      />
                    </View>

                    {/* Plant Code Input (Optional) */}
                    <View style={styles.invoiceInputContainer}>
                      <Text style={styles.invoiceLabel}>Plant Code (Optional)</Text>
                      <Text style={styles.invoiceOptionalLabel}>Leave empty to generate invoice for all plants in the order</Text>
                      <TextInput
                        style={styles.invoiceInput}
                        placeholder="Enter plant code (optional)"
                        placeholderTextColor="#9CA3AF"
                        value={plantCode}
                        onChangeText={setPlantCode}
                        autoCapitalize="none"
                        editable={!loading}
                      />
                    </View>

                    {/* Generate Button */}
                    <TouchableOpacity
                      style={[styles.invoiceGenerateButton, loading && styles.invoiceGenerateButtonDisabled]}
                      onPress={handleGenerate}
                      disabled={loading}>
                      {loading ? (
                        <ActivityIndicator size="small" color="#FFFFFF" />
                      ) : (
                        <Text style={styles.invoiceGenerateButtonText}>Generate & Send Invoice</Text>
                      )}
                    </TouchableOpacity>
                  </View>
                </ScrollView>
              </SafeAreaView>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

// Custom Header
const GenerateInvoiceHeader = ({ navigation }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <BackSolidIcon />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>Generate Invoice</Text>
      <View style={styles.backButton} />
    </View>
  );
};

const GenerateInvoice = ({navigation}) => {
  const [buyers, setBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedBuyer, setSelectedBuyer] = useState(null);
  const [loadingBuyers, setLoadingBuyers] = useState(false);
  const [showBuyerModal, setShowBuyerModal] = useState(false);
  const [buyerSearchQuery, setBuyerSearchQuery] = useState('');
  const [showInvoiceModal, setShowInvoiceModal] = useState(false);
  const [transactions, setTransactions] = useState([]);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [transactionError, setTransactionError] = useState(null);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  const [processingTransaction, setProcessingTransaction] = useState(null);
  const searchDebounceRef = useRef(null);

  // Load 10 suggested buyers on mount
  const fetchBuyers = useCallback(async () => {
    try {
      setLoadingBuyers(true);
      const net = await NetInfo.fetch();
      if (!net.isConnected || !net.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      const res = await getAllUsersApi({ role: 'buyer', limit: 10, page: 1 });
      const list =
        (Array.isArray(res?.data?.users) && res.data.users) ||
        (Array.isArray(res?.data) && res.data) ||
        (Array.isArray(res?.results) && res.results) ||
        (Array.isArray(res?.users) && res.users) ||
        [];

      const normalized = list.map(b => ({
        id: b.id || b.userId || b.uid,
        name: [b.firstName, b.lastName].filter(Boolean).join(' ') || b.username || b.email || 'Unknown',
        firstName: b.firstName || '',
        lastName: b.lastName || '',
        username: b.username || b.email || '',
        email: b.email || '',
        profileImage: b.profileImage || b.avatarUrl || null,
      })).filter(x => x.id);

      // Sort alphabetically
      const sorted = normalized.sort((a, b) => {
        const nameA = (a.firstName && a.lastName ? `${a.firstName} ${a.lastName}` : a.name || a.username || '').toLowerCase();
        const nameB = (b.firstName && b.lastName ? `${b.firstName} ${b.lastName}` : b.name || b.username || '').toLowerCase();
        return nameA.localeCompare(nameB);
      });

      setBuyers(sorted);
    } catch (err) {
      console.error('Failed to load buyers:', err);
      setError('Failed to load buyers. Please check your connection and try again.');
    } finally {
      setLoadingBuyers(false);
      setLoading(false);
    }
  }, []);

  // Search buyers with debounce
  useEffect(() => {
    const q = buyerSearchQuery.trim();
    
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    if (q.length === 0) {
      // Reset to initial 10 buyers when search is cleared
      fetchBuyers();
      return;
    }

    if (q.length < 2) {
      return;
    }

    searchDebounceRef.current = setTimeout(async () => {
      try {
        setLoadingBuyers(true);
        const net = await NetInfo.fetch();
        if (!net.isConnected || !net.isInternetReachable) {
          throw new Error('No internet connection.');
        }

        const res = await searchBuyersApi({ query: q, limit: 50, offset: 0 });
        if (!res?.success) {
          throw new Error(res?.error || 'Failed to search buyers.');
        }

        const searchResults = res.data?.buyers || [];
        const normalized = searchResults.map(b => ({
          id: b.id,
          name: [b.firstName, b.lastName].filter(Boolean).join(' ') || b.username || b.email || 'Unknown',
          firstName: b.firstName || '',
          lastName: b.lastName || '',
          username: b.username || '',
          email: b.email || '',
          profileImage: b.profileImage || null,
        }));

        // Sort alphabetically
        const sorted = normalized.sort((a, b) => {
          const nameA = (a.firstName && a.lastName ? `${a.firstName} ${a.lastName}` : a.name || a.username || '').toLowerCase();
          const nameB = (b.firstName && b.lastName ? `${b.firstName} ${b.lastName}` : b.name || b.username || '').toLowerCase();
          return nameA.localeCompare(nameB);
        });

        setBuyers(sorted);
      } catch (error) {
        console.error('Search error:', error);
        setBuyers([]);
      } finally {
        setLoadingBuyers(false);
      }
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [buyerSearchQuery, fetchBuyers]);

  useFocusEffect(
    useCallback(() => {
      fetchBuyers();
    }, [fetchBuyers])
  );

  // Fetch paid transactions for selected buyer
  const fetchTransactions = useCallback(async (buyer) => {
    if (!buyer) {
      setTransactions([]);
      return;
    }

    try {
      setLoadingTransactions(true);
      setTransactionError(null);
      const net = await NetInfo.fetch();
      if (!net.isConnected || !net.isInternetReachable) {
        throw new Error('No internet connection.');
      }

      // Fetch orders for this buyer - only "Ready to Fly" status
      // Try multiple identifiers: UID, ID, email, name for better matching
      // The backend does fuzzy matching on firstName, lastName, email, username
      const buyerIdentifier = buyer.uid || buyer.id || buyer.email || `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim();
      
      console.log('[GenerateInvoice] Fetching transactions for buyer:', {
        identifier: buyerIdentifier,
        buyer: {
          id: buyer.id,
          uid: buyer.uid,
          email: buyer.email,
          name: `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim(),
        }
      });
      
      const response = await getAdminOrdersApi({
        buyer: buyerIdentifier,
        status: 'readyToFly', // This maps to "Ready to Fly" in the backend
        sort: 'latest', // Newest to oldest
        limit: 100, // Fetch a reasonable number
        page: 1,
      });

      console.log('[GenerateInvoice] Full API response:', JSON.stringify(response, null, 2));
      console.log('[GenerateInvoice] API response keys:', Object.keys(response || {}));
      console.log('[GenerateInvoice] API response:', {
        success: response?.success,
        ordersCount: response?.orders?.length || 0,
        totalCount: response?.total || 0,
        hasOrders: !!response?.orders,
        ordersType: typeof response?.orders,
        ordersIsArray: Array.isArray(response?.orders),
      });

      if (!response || !response.success) {
        throw new Error(response?.error || 'Failed to fetch transactions');
      }

      // Get orders from response - API returns orders directly, not nested under data
      const allOrders = response.orders || [];
      
      console.log('[GenerateInvoice] Extracted allOrders:', allOrders.length, 'Type:', typeof allOrders, 'IsArray:', Array.isArray(allOrders));
      
      console.log('[GenerateInvoice] All orders before filtering:', allOrders.length);
      
      // Helper function to get timestamp
      const getTimestamp = (date) => {
        if (!date) return 0;
        if (date.toDate && typeof date.toDate === 'function') {
          return date.toDate().getTime();
        }
        if (date.seconds) {
          return date.seconds * 1000;
        }
        if (date._seconds) {
          return date._seconds * 1000;
        }
        if (typeof date === 'string') {
          return new Date(date).getTime() || 0;
        }
        if (typeof date === 'number') {
          return date < 4102444800000 ? date * 1000 : date;
        }
        return 0;
      };
      
      // Filter to exclude pending_payment orders (show all other statuses)
      // This includes: ready to fly, delivered, completed, cancelled, etc.
      const readyToFlyOrders = allOrders.filter(order => {
        const status = (order.status || '').toLowerCase().trim();
        const isPendingPayment = status === 'pending_payment' || 
                                status === 'pending payment' || 
                                status === 'pendingpayment';
        if (isPendingPayment) {
          console.log('[GenerateInvoice] Order filtered out (pending payment) - status:', order.status, 'Transaction:', order.transactionNumber);
        }
        return !isPendingPayment;
      });
      
      console.log('[GenerateInvoice] Paid orders (excluding pending payment) after filtering:', readyToFlyOrders.length);
      
      // Helper function to format flight date
      const formatFlightDate = (dateInput) => {
        if (!dateInput) return null;
        try {
          let date = null;
          if (dateInput && typeof dateInput === 'object') {
            if (dateInput.toDate && typeof dateInput.toDate === 'function') {
              date = dateInput.toDate();
            } else if (dateInput.seconds) {
              date = new Date(dateInput.seconds * 1000);
            } else if (dateInput._seconds) {
              date = new Date(dateInput._seconds * 1000);
            }
          } else if (typeof dateInput === 'string') {
            date = new Date(dateInput);
          } else if (typeof dateInput === 'number') {
            date = new Date(dateInput < 4102444800000 ? dateInput * 1000 : dateInput);
          }
          
          if (!date || isNaN(date.getTime())) return null;
          
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        } catch (e) {
          return null;
        }
      };

      // Group orders by transaction number
      const transactionsMap = new Map();
      readyToFlyOrders.forEach(order => {
        const txNumber = order.transactionNumber || order.trxNumber || order.id;
        if (!txNumber) return;
        
        if (!transactionsMap.has(txNumber)) {
          transactionsMap.set(txNumber, {
            transactionNumber: txNumber,
            orders: [],
            createdAt: order.createdAt || order.orderDate || order.dateCreated,
            finalTotal: 0,
            status: order.status,
            flightDate: null,
            cargoDate: null,
            flightDateFormatted: null,
            cargoDateFormatted: null,
          });
        }
        
        const transaction = transactionsMap.get(txNumber);
        transaction.orders.push(order);
        // Sum up the final total (use the order's finalTotal if available)
        transaction.finalTotal += (order.finalTotal || order.subtotal || order.totalPrice || 0);
        // Keep the earliest date for sorting
        const orderDate = order.createdAt || order.orderDate || order.dateCreated;
        if (orderDate && (!transaction.createdAt || getTimestamp(orderDate) < getTimestamp(transaction.createdAt))) {
          transaction.createdAt = orderDate;
        }
        
        // Get flight date from order (prefer cargoDate, then flightDate)
        const flightDate = order.cargoDate || order.flightDate || order.flightDateFormatted || order.cargoDateFormatted;
        if (flightDate && !transaction.flightDate) {
          transaction.flightDate = flightDate;
          transaction.cargoDate = order.cargoDate || order.flightDate;
          transaction.flightDateFormatted = formatFlightDate(flightDate);
          transaction.cargoDateFormatted = order.cargoDateFormatted || order.flightDateFormatted || transaction.flightDateFormatted;
        }
        
        // Also check products array for flight date
        if (order.products && Array.isArray(order.products) && order.products.length > 0) {
          const productWithFlightDate = order.products.find(p => p.flightDate || p.cargoDate || p.flightDateFormatted || p.cargoDateFormatted);
          if (productWithFlightDate && !transaction.flightDate) {
            const productFlightDate = productWithFlightDate.cargoDate || productWithFlightDate.flightDate || productWithFlightDate.flightDateFormatted || productWithFlightDate.cargoDateFormatted;
            if (productFlightDate) {
              transaction.flightDate = productFlightDate;
              transaction.cargoDate = productWithFlightDate.cargoDate || productWithFlightDate.flightDate;
              transaction.flightDateFormatted = formatFlightDate(productFlightDate);
              transaction.cargoDateFormatted = productWithFlightDate.cargoDateFormatted || productWithFlightDate.flightDateFormatted || transaction.flightDateFormatted;
            }
          }
        }
      });
      
      // Convert map to array and sort by date (newest to oldest)
      const transactions = Array.from(transactionsMap.values());
      
      // Sort transactions by date (newest to oldest)
      const sortedTransactions = transactions.sort((a, b) => {
        const dateA = getTimestamp(a.createdAt);
        const dateB = getTimestamp(b.createdAt);
        return dateB - dateA; // Newest first
      });
      
      console.log('[GenerateInvoice] Transactions grouped and sorted:', sortedTransactions.length);
      
      setTransactions(sortedTransactions);
    } catch (err) {
      console.error('Failed to fetch transactions:', err);
      setTransactionError(err.message || 'Failed to load transactions');
      setTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  }, []);

  // Fetch transactions when buyer is selected
  useEffect(() => {
    if (selectedBuyer) {
      fetchTransactions(selectedBuyer);
    } else {
      setTransactions([]);
      setTransactionError(null);
    }
  }, [selectedBuyer, fetchTransactions]);

  const handleSelectBuyer = (buyer) => {
    setSelectedBuyer(buyer);
    setShowBuyerModal(false);
  };

  const handleBuyerClick = (buyer) => {
    setSelectedBuyer(buyer);
  };

  const handleViewInvoice = async (transaction) => {
    const txNumber = transaction.transactionNumber || transaction.trxNumber;
    if (!txNumber) {
      Alert.alert('Error', 'Transaction number is missing');
      return;
    }

    // Prevent multiple simultaneous requests
    if (processingTransaction) {
      return;
    }

    try {
      setProcessingTransaction(txNumber);

      const viewResponse = await getInvoicePdfApi({
        transactionNumber: txNumber,
      });

      if (viewResponse.success && viewResponse.pdfBase64) {
        // Save and open PDF
        const fileName = viewResponse.filename || `Invoice_${txNumber}_${Date.now()}.pdf`;
        const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
        await RNFS.writeFile(filePath, viewResponse.pdfBase64, 'base64');
        
        try {
          await FileViewer.open(filePath);
        } catch (viewerError) {
          Alert.alert('Error', 'Failed to open PDF viewer');
        }
      } else {
        throw new Error(viewResponse.error || 'Failed to load invoice');
      }
    } catch (error) {
      console.error('Error viewing invoice:', error);
      Alert.alert('Error', error.message || 'Failed to view invoice');
    } finally {
      setProcessingTransaction(null);
    }
  };

  const handleSendInvoice = async (transaction) => {
    const txNumber = transaction.transactionNumber || transaction.trxNumber;
    if (!txNumber) {
      Alert.alert('Error', 'Transaction number is missing');
      return;
    }

    // Prevent multiple simultaneous requests
    if (processingTransaction) {
      return;
    }

    try {
      setProcessingTransaction(txNumber);

      const emailResponse = await generateInvoiceApi({
        transactionNumber: txNumber,
      });

      if (emailResponse.success) {
        const emailAddress = emailResponse.sentTo || emailResponse.details?.sentTo || selectedBuyer?.email || 'the buyer';
        Alert.alert(
          'Success',
          `Invoice has been sent successfully to:\n\n${emailAddress}\n\nPlease check the email inbox.`,
          [{text: 'OK'}]
        );
      } else {
        throw new Error(emailResponse.error || 'Failed to send invoice');
      }
    } catch (error) {
      console.error('Error sending invoice:', error);
      Alert.alert('Error', error.message || 'Failed to send invoice');
    } finally {
      setProcessingTransaction(null);
    }
  };

  const handleInvoiceGenerated = () => {
    // Refresh transactions after invoice generation
    if (selectedBuyer) {
      fetchTransactions(selectedBuyer);
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <GenerateInvoiceHeader navigation={navigation} />
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#539461" />
          <Text style={styles.loadingText}>Loading buyers...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && buyers.length === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
        <GenerateInvoiceHeader navigation={navigation} />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>{error}</Text>
          <TouchableOpacity style={styles.retryButton} onPress={fetchBuyers}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <GenerateInvoiceHeader navigation={navigation} />
      
      {/* Buyer Selection Dropdown */}
      <View style={styles.buyerDropdownContainer}>
        <TouchableOpacity 
          style={styles.buyerDropdown}
          onPress={() => setShowBuyerModal(true)}
        >
          <Text style={styles.buyerDropdownText} numberOfLines={1}>
            {selectedBuyer 
              ? (selectedBuyer.name || `${selectedBuyer.firstName || ''} ${selectedBuyer.lastName || ''}`.trim() || selectedBuyer.email || 'Selected Buyer')
              : 'Select Buyer'}
          </Text>
          <ArrowDownIcon width={20} height={20} fill="#647276" />
        </TouchableOpacity>
        {selectedBuyer && (
          <TouchableOpacity 
            style={styles.clearBuyerButton}
            onPress={() => setSelectedBuyer(null)}
          >
            <Text style={styles.clearBuyerText}>Clear</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Buyer Selection Modal */}
      <BuyerSelectionModal
        isVisible={showBuyerModal}
        onClose={() => {
          setShowBuyerModal(false);
          setBuyerSearchQuery('');
        }}
        onSelectBuyer={handleSelectBuyer}
        buyers={buyers}
        loading={loadingBuyers}
        searchQuery={buyerSearchQuery}
        onSearchChange={setBuyerSearchQuery}
      />

      {/* Invoice Generation Modal */}
      <InvoiceGenerationModal
        isVisible={showInvoiceModal}
        onClose={() => {
          setShowInvoiceModal(false);
          setSelectedTransaction(null);
        }}
        buyer={selectedBuyer}
        transaction={selectedTransaction}
        onGenerate={handleInvoiceGenerated}
      />

      {/* Transactions List (when buyer is selected) or Buyers List */}
      {selectedBuyer ? (
        <>
          {loadingTransactions ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="large" color="#539461" />
              <Text style={styles.loadingText}>Loading transactions...</Text>
            </View>
          ) : transactionError ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>{transactionError}</Text>
              <TouchableOpacity style={styles.retryButton} onPress={() => fetchTransactions(selectedBuyer)}>
                <Text style={styles.retryButtonText}>Retry</Text>
              </TouchableOpacity>
            </View>
          ) : transactions.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No paid transactions found for this buyer</Text>
            </View>
          ) : (
            <FlatList
              data={transactions}
              keyExtractor={(item) => item.id?.toString() || item.transactionNumber || item.orderId || Math.random().toString()}
              contentContainerStyle={styles.flatListContent}
              renderItem={({item: transaction}) => {
                const formatDate = (dateInput) => {
                  if (!dateInput) return 'Unknown';
                  try {
                    let date = null;
                    if (dateInput && typeof dateInput === 'object') {
                      if (dateInput.toDate && typeof dateInput.toDate === 'function') {
                        date = dateInput.toDate();
                      } else if (dateInput.seconds) {
                        date = new Date(dateInput.seconds * 1000);
                      } else if (dateInput._seconds) {
                        date = new Date(dateInput._seconds * 1000);
                      }
                    } else if (typeof dateInput === 'string') {
                      date = new Date(dateInput);
                    } else if (typeof dateInput === 'number') {
                      date = new Date(dateInput < 4102444800000 ? dateInput * 1000 : dateInput);
                    }
                    
                    if (!date || isNaN(date.getTime())) return 'Unknown';
                    
                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit'
                    });
                  } catch (e) {
                    return 'Unknown';
                  }
                };

                const txNumber = transaction.transactionNumber || transaction.trxNumber || transaction.id || 'N/A';
                const status = transaction.status || 'Unknown';
                const orderDate = formatDate(transaction.createdAt || transaction.orderDate || transaction.dateCreated);
                const totalPrice = transaction.totalPrice || transaction.price || transaction.finalTotal || 'N/A';
                
                // Format flight date
                const formatFlightDateForDisplay = (dateInput) => {
                  if (!dateInput) return null;
                  try {
                    let date = null;
                    if (dateInput && typeof dateInput === 'object') {
                      if (dateInput.toDate && typeof dateInput.toDate === 'function') {
                        date = dateInput.toDate();
                      } else if (dateInput.seconds) {
                        date = new Date(dateInput.seconds * 1000);
                      } else if (dateInput._seconds) {
                        date = new Date(dateInput._seconds * 1000);
                      }
                    } else if (typeof dateInput === 'string') {
                      date = new Date(dateInput);
                    } else if (typeof dateInput === 'number') {
                      date = new Date(dateInput < 4102444800000 ? dateInput * 1000 : dateInput);
                    }
                    
                    if (!date || isNaN(date.getTime())) return null;
                    
                    return date.toLocaleDateString('en-US', {
                      month: 'short',
                      day: 'numeric',
                      year: 'numeric'
                    });
                  } catch (e) {
                    return null;
                  }
                };
                
                const flightDate = transaction.cargoDateFormatted || 
                                  transaction.flightDateFormatted || 
                                  formatFlightDateForDisplay(transaction.cargoDate) ||
                                  formatFlightDateForDisplay(transaction.flightDate);
                
                return (
                  <View style={styles.transactionCard}>
                    <View style={styles.transactionCardContent}>
                      <View style={styles.transactionCardInfo}>
                        <Text style={styles.transactionCardTitle}>Transaction #{txNumber}</Text>
                        <Text style={styles.transactionCardDate}>{orderDate}</Text>
                        {flightDate && (
                          <Text style={styles.transactionCardFlightDate}>Flight Date: {flightDate}</Text>
                        )}
                        <View style={styles.transactionCardMeta}>
                          <Text style={styles.transactionCardStatus}>Status: {status}</Text>
                        </View>
                      </View>
                      <View style={styles.buttonsContainer}>
                        <TouchableOpacity
                          style={[
                            styles.viewButton,
                            processingTransaction === txNumber && styles.buttonDisabled
                          ]}
                          onPress={() => handleViewInvoice(transaction)}
                          disabled={processingTransaction === txNumber}
                          activeOpacity={0.7}
                        >
                          {processingTransaction === txNumber ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.viewButtonText}>View</Text>
                          )}
                        </TouchableOpacity>
                        <TouchableOpacity
                          style={[
                            styles.sendButton,
                            processingTransaction === txNumber && styles.buttonDisabled
                          ]}
                          onPress={() => handleSendInvoice(transaction)}
                          disabled={processingTransaction === txNumber}
                          activeOpacity={0.7}
                        >
                          {processingTransaction === txNumber ? (
                            <ActivityIndicator size="small" color="#FFFFFF" />
                          ) : (
                            <Text style={styles.sendButtonText}>Send to Email</Text>
                          )}
                        </TouchableOpacity>
                      </View>
                    </View>
                  </View>
                );
              }}
            />
          )}
        </>
      ) : (
        <>
          {buyers.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyText}>No buyers available</Text>
            </View>
          ) : (
            <FlatList
              data={buyers}
              keyExtractor={(item) => item.id?.toString() || item.email || Math.random().toString()}
              contentContainerStyle={styles.flatListContent}
              renderItem={({item: buyer}) => {
                const buyerName = buyer.name || `${buyer.firstName || ''} ${buyer.lastName || ''}`.trim() || buyer.email || 'Unknown';
                const avatarUrl = buyer.profileImage || buyer.avatar || '';
                
                return (
                  <TouchableOpacity
                    style={styles.buyerCard}
                    onPress={() => handleBuyerClick(buyer)}
                    activeOpacity={0.7}
                  >
                    {avatarUrl ? (
                      <Image source={{ uri: avatarUrl }} style={styles.buyerCardAvatar} />
                    ) : (
                      <View style={[styles.buyerCardAvatar, styles.buyerCardAvatarPlaceholder]}>
                        <Text style={styles.buyerCardAvatarText}>
                          {buyerName.charAt(0).toUpperCase()}
                        </Text>
                      </View>
                    )}
                    <View style={styles.buyerCardInfo}>
                      <Text style={styles.buyerCardName}>{buyerName}</Text>
                      {buyer.email && (
                        <Text style={styles.buyerCardEmail}>{buyer.email}</Text>
                      )}
                      {buyer.username && buyer.username !== buyer.email && (
                        <Text style={styles.buyerCardUsername}>@{buyer.username}</Text>
                      )}
                    </View>
                  </TouchableOpacity>
                );
              }}
            />
          )}
        </>
      )}
    </SafeAreaView>
  );
};

export default GenerateInvoice;

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
    fontFamily: 'Inter',
  },
  buyerDropdownContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    gap: 8,
    backgroundColor: '#FFFFFF',
  },
  buyerDropdown: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  buyerDropdownText: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#202325',
    marginRight: 8,
  },
  clearBuyerButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    backgroundColor: '#F2F7F3',
  },
  clearBuyerText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#539461',
  },
  flatListContent: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  buyerCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 12,
    marginBottom: 8,
  },
  buyerCardAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#539461',
    marginRight: 12,
  },
  buyerCardAvatarPlaceholder: {
    backgroundColor: '#48A7F8',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#539461',
  },
  buyerCardAvatarText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#FFFFFF',
  },
  buyerCardInfo: {
    flex: 1,
  },
  buyerCardName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
    marginBottom: 4,
  },
  buyerCardEmail: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#647276',
    marginBottom: 2,
  },
  buyerCardUsername: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    color: '#9CA3AF',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    fontFamily: 'Inter',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyText: {
    fontSize: 16,
    color: '#666',
    textAlign: 'center',
    marginBottom: 20,
    fontFamily: 'Inter',
  },
  retryButton: {
    backgroundColor: '#539461',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    height: 569,
  },
  invoiceModalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    height: 60,
  },
  modalHeaderTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
  },
  modalContentContainer: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  searchFieldContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
    gap: 12,
  },
  searchTextInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#202325',
    height: '100%',
  },
  buyerListContainer: {
    height: 343,
    marginTop: 16,
  },
  buyerItemContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 8,
    minHeight: 56,
  },
  buyerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#539461',
  },
  buyerAvatarPlaceholder: {
    backgroundColor: '#E4E7E9',
    justifyContent: 'center',
    alignItems: 'center',
    borderColor: '#CDD3D4',
  },
  buyerAvatarText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
  },
  buyerInfo: {
    flex: 1,
    flexDirection: 'column',
    gap: 4,
  },
  buyerName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
  },
  buyerEmail: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#647276',
  },
  buyerUsername: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 12,
    color: '#9CA3AF',
  },
  divider: {
    height: 1,
    backgroundColor: '#E4E7E9',
    marginVertical: 4,
  },
  emptyBuyerContainer: {
    paddingVertical: 40,
    alignItems: 'center',
  },
  emptyBuyerText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#647276',
  },
  invoiceModalContent: {
    paddingHorizontal: 24,
    paddingVertical: 8,
  },
  selectedBuyerCard: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 24,
  },
  selectedBuyerContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  selectedBuyerAvatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#539461',
    marginRight: 12,
  },
  selectedBuyerInfo: {
    flex: 1,
  },
  selectedBuyerName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    fontFamily: 'Inter',
    marginBottom: 4,
  },
  selectedBuyerEmail: {
    fontSize: 14,
    color: '#647276',
    fontFamily: 'Inter',
  },
  invoiceFormContainer: {
    paddingBottom: 20,
  },
  invoiceDescription: {
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
    fontFamily: 'Inter',
    marginBottom: 24,
  },
  invoiceInputContainer: {
    marginBottom: 20,
  },
  invoiceLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202325',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  invoiceOptionalLabel: {
    fontSize: 12,
    color: '#9CA3AF',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  invoiceInput: {
    borderWidth: 1,
    borderColor: '#D1D5DB',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    color: '#202325',
    fontFamily: 'Inter',
    backgroundColor: '#FFFFFF',
  },
  invoiceGenerateButton: {
    backgroundColor: '#539461',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 8,
  },
  invoiceGenerateButtonDisabled: {
    opacity: 0.6,
  },
  invoiceGenerateButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
    fontFamily: 'Inter',
  },
  transactionCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#E5E7EB',
    padding: 16,
    marginBottom: 8,
  },
  transactionCardContent: {
    flexDirection: 'column',
  },
  transactionCardInfo: {
    marginBottom: 12,
  },
  transactionCardTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
    marginBottom: 4,
  },
  transactionCardDate: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#647276',
    marginBottom: 4,
  },
  transactionCardFlightDate: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#647276',
    marginBottom: 8,
  },
  transactionCardMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  transactionCardStatus: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    color: '#539461',
  },
  buttonsContainer: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 8,
  },
  viewButton: {
    backgroundColor: '#539461',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    flex: 1,
  },
  sendButton: {
    backgroundColor: '#539461',
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 8,
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 80,
    flex: 1,
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 12,
    fontWeight: '600',
    fontFamily: 'Inter',
    textAlign: 'center',
  },
  transactionCardPrice: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    color: '#202325',
    marginTop: 4,
    textAlign: 'right',
  },
});
