import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  RefreshControl,
  SafeAreaView,
  Platform,
} from 'react-native';
import { useNavigation, useIsFocused } from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import NetInfo from '@react-native-community/netinfo';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import PlusIcon from '../../../assets/icons/greylight/plus-regular.svg';
import { getFlightChangeRequestsApi } from '../../../components/Api/orderManagementApi';

const RequestChangePlantFlightScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const isFocused = useIsFocused();
  const [requests, setRequests] = useState([]);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const loadRequests = async () => {
    setLoading(true);
    try {
      const netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection');
      }

      const response = await getFlightChangeRequestsApi({
        limit: 100,
        offset: 0
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to load requests');
      }

      const requests = response.data?.data?.requests || [];
      setRequests(requests);
    } catch (error) {
      console.error('Error loading flight change requests:', error);
      // Don't show alert on initial load, just log the error
      if (!loading) {
        // Only show alert if it's a refresh
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      loadRequests();
    }
  }, [isFocused]);

  const onRefresh = async () => {
    setRefreshing(true);
    await loadRequests();
  };

  const handleAddRequest = () => {
    navigation.navigate('AddRequestChangePlantFlightScreen');
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) {
        return dateString; // Return original if invalid date
      }
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (error) {
      return dateString;
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return '#FFA500';
      case 'approved':
        return '#539461';
      case 'rejected':
        return '#E7522F';
      default:
        return '#647276';
    }
  };

  const getStatusText = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      default:
        return 'Unknown';
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={Platform.OS === 'android' ? ['top'] : []}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Header */}
      <View style={[styles.header, {paddingTop: Platform.OS === 'android' ? Math.max(insets.top + 10, 16) : 16}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <LeftIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Plant Flight Requests</Text>
        <TouchableOpacity
          onPress={handleAddRequest}
          style={styles.addButton}>
          <PlusIcon width={24} height={24} fill="#539461" />
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView 
        style={styles.content} 
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={['#539461']}
            tintColor="#539461"
          />
        }>
        {loading ? (
          <View style={styles.loadingContainer}>
            <Text style={styles.loadingText}>Loading requests...</Text>
          </View>
        ) : requests.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyTitle}>No Flight Change Requests</Text>
            <Text style={styles.emptySubtitle}>
              You haven't submitted any requests to change plant flight dates yet.
            </Text>
            <TouchableOpacity 
              style={styles.emptyButton}
              onPress={handleAddRequest}>
              <Text style={styles.emptyButtonText}>Add Request</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.listContainer}>
            {requests.map((request, index) => (
              <View key={request.id || index} style={styles.requestCard}>
                <View style={styles.requestHeader}>
                  <View style={styles.requestInfo}>
                    <Text style={styles.orderNumber}>
                      {request.transactionNumbers && request.transactionNumbers.length > 0
                        ? request.transactionNumbers.length === 1
                          ? `Transaction: ${request.transactionNumbers[0]}`
                          : `${request.transactionNumbers.length} Transactions`
                        : 'N/A'}
                    </Text>
                    <View style={[styles.statusBadge, { backgroundColor: getStatusColor(request.status) + '20' }]}>
                      <Text style={[styles.statusText, { color: getStatusColor(request.status) }]}>
                        {getStatusText(request.status)}
                      </Text>
                    </View>
                  </View>
                </View>
                
                <View style={styles.requestDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Current Flight Date:</Text>
                    <Text style={styles.detailValue}>
                      {request.currentFlightDate || 'N/A'}
                    </Text>
                  </View>
                  
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Requested Flight Date:</Text>
                    <Text style={styles.detailValue}>
                      {request.newFlightDate || 'N/A'}
                    </Text>
                  </View>
                  
                  {request.reason && (
                    <View style={styles.reasonContainer}>
                      <Text style={styles.detailLabel}>Reason:</Text>
                      <Text style={styles.reasonText}>{request.reason}</Text>
                    </View>
                  )}
                  
                  <View style={styles.dateContainer}>
                    <Text style={styles.dateLabel}>
                      Requested on: {formatDate(request.createdAt)}
                    </Text>
                  </View>
                </View>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
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
  addButton: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
    width: '100%',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 40,
  },
  loadingText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
    paddingHorizontal: 24,
  },
  emptyTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
    textAlign: 'center',
    marginBottom: 24,
  },
  emptyButton: {
    backgroundColor: '#539461',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyButtonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  listContainer: {
    paddingHorizontal: 24,
    paddingVertical: 16,
    gap: 16,
  },
  requestCard: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E4E7E9',
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 4,
  },
  requestInfo: {
    flex: 1,
    gap: 8,
  },
  orderNumber: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  statusBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 16,
  },
  requestDetails: {
    gap: 12,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  detailLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
  },
  detailValue: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#202325',
  },
  reasonContainer: {
    gap: 4,
  },
  reasonText: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 14,
    lineHeight: 20,
    color: '#393D40',
  },
  dateContainer: {
    marginTop: 4,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4E7E9',
  },
  dateLabel: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '400',
    fontSize: 12,
    lineHeight: 16,
    color: '#647276',
  },
});

export default RequestChangePlantFlightScreen;
