import React, { useState, useEffect, useContext } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  Image,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import Svg, { Path } from 'react-native-svg';
import { collection, query, where, getDocs, addDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import { AuthContext } from '../../../auth/AuthProvider';
import { getAdminFlightChangeRequestsApi, updateFlightChangeRequestApi } from '../../../components/Api/adminOrderApi';
import NetInfo from '@react-native-community/netinfo';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';

// White Chat Icon Component
const WhiteChatIcon = ({ width = 20, height = 20 }) => (
  <Svg width={width} height={height} viewBox="0 0 21 22" fill="none">
    <Path
      d="M8.24915 12.5001C9.07757 12.5001 9.74915 11.8285 9.74915 11.0001C9.74915 10.1717 9.07757 9.50012 8.24915 9.50012C7.42072 9.50012 6.74915 10.1717 6.74915 11.0001C6.74915 11.8285 7.42072 12.5001 8.24915 12.5001Z"
      fill="#FFFFFF"
    />
    <Path
      d="M12.7491 12.5001C13.5776 12.5001 14.2491 11.8285 14.2491 11.0001C14.2491 10.1717 13.5776 9.50012 12.7491 9.50012C11.9207 9.50012 11.2491 10.1717 11.2491 11.0001C11.2491 11.8285 11.9207 12.5001 12.7491 12.5001Z"
      fill="#FFFFFF"
    />
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M4.33286 2.97276C6.2816 1.47581 8.70824 0.738644 11.1603 0.898714C13.6125 1.05878 15.9227 2.10516 17.6603 3.84275C19.3979 5.58035 20.4442 7.89056 20.6043 10.3427C20.7644 12.7948 20.0272 15.2214 18.5303 17.1702C17.0333 19.1189 14.8787 20.4567 12.4682 20.9342C10.2278 21.378 7.90835 21.0504 5.88453 20.0136L2.8432 21.028C2.51283 21.1381 2.15828 21.1541 1.81934 21.0741C1.4804 20.9942 1.17043 20.8214 0.924175 20.5751C0.677922 20.3288 0.505117 20.0189 0.425128 19.6799C0.345139 19.341 0.361128 18.9865 0.471302 18.6561L1.48898 15.6177C0.452492 13.5941 0.125041 11.275 0.568797 9.03478C1.04629 6.62429 2.38412 4.46972 4.33286 2.97276ZM11.0138 3.14393C9.10659 3.01944 7.2192 3.59278 5.70352 4.75708C4.18783 5.92138 3.14729 7.59716 2.77591 9.47199C2.40453 11.3468 2.72764 13.2927 3.68502 14.9469C3.84671 15.2263 3.88061 15.5617 3.77809 15.8677L2.84426 18.6558L5.63666 17.7245C5.94239 17.6225 6.27717 17.6566 6.55611 17.818C8.2103 18.7754 10.1562 19.0985 12.031 18.7271C13.9059 18.3557 15.5816 17.3152 16.7459 15.7995C17.9102 14.2838 18.4836 12.3964 18.3591 10.4892C18.2346 8.58204 17.4207 6.78521 16.0693 5.43374C14.7178 4.08228 12.921 3.26843 11.0138 3.14393Z"
      fill="#FFFFFF"
    />
  </Svg>
);

// Helper function to format date
const formatDate = (date) => {
  if (!date) return '';
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    return d.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      year: 'numeric' 
    });
  } catch (e) {
    return String(date);
  }
};


// Custom Header Component
const FlightDateOrdersHeader = ({ navigation, date }) => {
  return (
    <View style={styles.header}>
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
        <BackSolidIcon />
      </TouchableOpacity>
      <Text style={styles.headerTitle}>{formatDate(date)}</Text>
      <View style={styles.backButton} />
    </View>
  );
};

// Flight Change Request Status Badge
const RequestStatusBadge = ({ status }) => {
  const getStatusConfig = (status) => {
    switch (status) {
      case 'pending':
        return { color: '#F59E0B', bgColor: '#FEF3C7', text: 'Pending' };
      case 'approved':
        return { color: '#23C16B', bgColor: '#DFECDF', text: 'Approved' };
      case 'rejected':
        return { color: '#E7522F', bgColor: '#FEE2E2', text: 'Rejected' };
      default:
        return { color: '#7F8D91', bgColor: '#F5F6F6', text: 'No Request' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
      <View style={[styles.statusDot, { backgroundColor: config.color }]} />
      <Text style={[styles.statusBadgeText, { color: config.color }]}>
        {config.text}
      </Text>
    </View>
  );
};

// Helper function to format date to match API format (YYYY-MM-DD)
const formatDateForAPI = (date) => {
  if (!date) return '';
  try {
    const d = date instanceof Date ? date : new Date(date);
    if (isNaN(d.getTime())) return '';
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  } catch (e) {
    return '';
  }
};

// User Card Component with Flight Change Request
const UserCard = ({ buyerInfo, currentFlightDate, orders, navigation, flightChangeRequest }) => {
  const { userInfo } = useContext(AuthContext);
  const [updating, setUpdating] = useState(false);
  
  // Get order count for this user
  const getOrderCount = () => {
    // First try to get from orders array
    if (orders && orders.length > 0) {
      return orders.length;
    }
    // If no orders, get count from flight change request
    if (flightChangeRequest) {
      // Count from orderIds if available
      if (flightChangeRequest.orderIds && Array.isArray(flightChangeRequest.orderIds)) {
        return flightChangeRequest.orderIds.length;
      }
      // Or count from transactionNumbers if available
      if (flightChangeRequest.transactionNumbers && Array.isArray(flightChangeRequest.transactionNumbers)) {
        return flightChangeRequest.transactionNumbers.length;
      }
    }
    return 0;
  };

  const orderCount = getOrderCount();
  
  // Get buyer request data from the flight change request
  const getBuyerRequest = () => {
    if (!flightChangeRequest) return null;
    return {
      requestedDate: flightChangeRequest.newFlightDateObj ? new Date(flightChangeRequest.newFlightDateObj) : null,
      reason: flightChangeRequest.reason || '',
      requestId: flightChangeRequest.id,
      status: flightChangeRequest.status || 'pending',
    };
  };

  const buyerRequest = getBuyerRequest();

  const handleApprove = async () => {
    if (!buyerRequest || !buyerRequest.requestId) {
      Alert.alert('Error', 'Flight change request not found');
      return;
    }

    Alert.alert(
      'Approve Flight Change',
      `Approve flight change request for ${orderCount > 0 ? `${orderCount} request${orderCount > 1 ? 's' : ''}` : 'this request'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Approve',
          onPress: async () => {
            setUpdating(true);
            try {
              const netState = await NetInfo.fetch();
              if (!netState.isConnected || !netState.isInternetReachable) {
                Alert.alert('Error', 'No internet connection. Please check your connection and try again.');
                setUpdating(false);
                return;
              }

              const response = await updateFlightChangeRequestApi({
                requestId: buyerRequest.requestId,
                status: 'approved',
              });

              if (!response.success) {
                throw new Error(response.error || 'Failed to approve request');
              }

              Alert.alert('Success', 'Flight change request has been approved.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error approving request:', error);
              Alert.alert('Error', error.message || 'Failed to approve request. Please try again.');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleReject = async () => {
    if (!buyerRequest || !buyerRequest.requestId) {
      Alert.alert('Error', 'Flight change request not found');
      return;
    }

    Alert.alert(
      'Reject Flight Change',
      `Reject flight change request for ${orderCount > 0 ? `${orderCount} request${orderCount > 1 ? 's' : ''}` : 'this request'}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setUpdating(true);
            try {
              const netState = await NetInfo.fetch();
              if (!netState.isConnected || !netState.isInternetReachable) {
                Alert.alert('Error', 'No internet connection. Please check your connection and try again.');
                setUpdating(false);
                return;
              }

              const response = await updateFlightChangeRequestApi({
                requestId: buyerRequest.requestId,
                status: 'rejected',
              });

              if (!response.success) {
                throw new Error(response.error || 'Failed to reject request');
              }

              Alert.alert('Rejected', 'Flight change request has been rejected.', [
                { text: 'OK', onPress: () => navigation.goBack() }
              ]);
            } catch (error) {
              console.error('Error rejecting request:', error);
              Alert.alert('Error', error.message || 'Failed to reject request. Please try again.');
            } finally {
              setUpdating(false);
            }
          },
        },
      ]
    );
  };

  const handleChat = async () => {
    if (!buyerInfo || !buyerInfo.uid) {
      Alert.alert('Error', 'Buyer information not available');
      return;
    }

    try {
      // Get current user UID
      const currentUserUid = userInfo?.data?.uid || userInfo?.user?.uid || userInfo?.uid || '';
      
      if (!currentUserUid) {
        Alert.alert('Error', 'Your user profile is not available');
        return;
      }

      // Check if a private chat already exists with this buyer
      const existingChatQuery = query(
        collection(db, 'chats'),
        where('participantIds', 'array-contains', currentUserUid),
        where('type', '==', 'private'),
      );

      const existingChatsSnapshot = await getDocs(existingChatQuery);
      let existingChat = null;

      existingChatsSnapshot.forEach(doc => {
        const chatData = doc.data();
        // Ensure it's a private chat with exactly 2 participants
        if (chatData.type === 'private' && 
            chatData.participantIds && 
            chatData.participantIds.length === 2 &&
            chatData.participantIds.includes(buyerInfo.uid)) {
          existingChat = {id: doc.id, ...chatData};
        }
      });

      // If chat exists, navigate to it
      if (existingChat) {
        navigation.navigate('ChatScreen', {
          id: existingChat.id,
          participantIds: existingChat.participantIds,
          participants: existingChat.participants,
          avatarUrl: buyerInfo.avatar || '',
          name: buyerInfo.fullName,
          type: 'private',
        });
        return;
      }

      // Otherwise create a new chat
      const currentUserAvatar = userInfo?.data?.profileImage || 
                                 userInfo?.data?.profilePhotoUrl || 
                                 userInfo?.profileImage || 
                                 userInfo?.profilePhotoUrl || '';
      const currentUserName = `${userInfo?.data?.firstName || userInfo?.user?.firstName || userInfo?.firstName || ''} ${userInfo?.data?.lastName || userInfo?.user?.lastName || userInfo?.lastName || ''}`.trim() || 
                               userInfo?.data?.email || 
                               userInfo?.user?.email || 
                               'Admin';

      const chatData = {
        participants: [
          {
            uid: currentUserUid,
            name: currentUserName,
            avatarUrl: currentUserAvatar,
          },
          {
            uid: buyerInfo.uid,
            name: buyerInfo.fullName,
            avatarUrl: buyerInfo.avatar || '',
          },
        ],
        participantIds: [currentUserUid, buyerInfo.uid],
        type: 'private',
        createdAt: new Date(),
        lastMessage: null,
        lastMessageTime: null,
        unreadBy: [],
      };

      const chatRef = await addDoc(collection(db, 'chats'), chatData);
      
      // Navigate to the newly created chat
      navigation.navigate('ChatScreen', {
        id: chatRef.id,
        participantIds: chatData.participantIds,
        participants: chatData.participants,
        avatarUrl: buyerInfo.avatar || '',
        name: buyerInfo.fullName,
        type: 'private',
      });
    } catch (error) {
      console.error('Error creating/opening chat:', error);
      Alert.alert('Error', 'Failed to open chat. Please try again.');
    }
  };

  return (
    <View style={styles.userCard}>
      {/* User Information Section */}
      {buyerInfo && (
        <View style={styles.buyerSection}>
          <View style={styles.buyerInfo}>
            <View style={styles.buyerAvatarContainer}>
              {buyerInfo.avatar ? (
                <Image 
                  source={{ uri: buyerInfo.avatar }} 
                  style={styles.buyerAvatar}
                />
              ) : (
                <View style={styles.buyerAvatarPlaceholder}>
                  <Text style={styles.buyerAvatarText}>
                    {buyerInfo.firstName?.charAt(0)?.toUpperCase() || buyerInfo.fullName?.charAt(0)?.toUpperCase() || 'U'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.buyerDetails}>
              <Text style={styles.buyerName}>{buyerInfo.fullName}</Text>
              {buyerInfo.email && (
                <Text style={styles.buyerEmail}>{buyerInfo.email}</Text>
              )}
            </View>
          </View>
          <TouchableOpacity
            style={styles.chatButton}
            onPress={handleChat}
            activeOpacity={0.7}>
            <WhiteChatIcon width={20} height={20} />
            <Text style={styles.chatButtonText}>Chat</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Request Count Section */}
      <View style={styles.ordersSection}>
        <Text style={styles.sectionLabel}>Requests</Text>
        <View style={styles.orderCountContainer}>
          <Text style={styles.orderCountText}>
            {orderCount} {orderCount === 1 ? 'request' : 'requests'}
          </Text>
        </View>
      </View>

      {/* Current Flight Date Section */}
      <View style={styles.currentFlightSection}>
        <Text style={styles.sectionLabel}>Current Flight Date</Text>
        <Text style={styles.currentFlightDate}>{formatDate(currentFlightDate)}</Text>
      </View>

      {/* Flight Change Request Section */}
      {buyerRequest ? (
        <View style={styles.requestSection}>
          <View style={styles.requestHeader}>
            <Text style={styles.sectionLabel}>Flight Change Request</Text>
            <RequestStatusBadge status={buyerRequest.status} />
          </View>

          {buyerRequest.status === 'pending' && (
            <>
              {/* Buyer's Requested New Date (Read-only) */}
              <View style={styles.requestField}>
                <Text style={styles.fieldLabel}>Requested New Flight Date</Text>
                <View style={styles.readOnlyDateContainer}>
                  <Text style={styles.readOnlyDate}>
                    {buyerRequest.requestedDate ? formatDate(buyerRequest.requestedDate) : 'N/A'}
                  </Text>
                </View>
              </View>

              {/* Buyer's Reason for Change (Read-only) */}
              <View style={styles.requestField}>
                <Text style={styles.fieldLabel}>Reason for Change</Text>
                <View style={styles.readOnlyReasonContainer}>
                  <Text style={styles.readOnlyReason}>
                    {buyerRequest.reason}
                  </Text>
                </View>
              </View>

              {/* Action Buttons */}
              <View style={styles.actionButtons}>
                <TouchableOpacity
                  style={[styles.actionButton, styles.rejectButton, updating && styles.actionButtonDisabled]}
                  onPress={handleReject}
                  disabled={updating}
                  activeOpacity={0.7}>
                  <Text style={styles.rejectButtonText}>{updating ? 'Processing...' : 'Reject'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.actionButton, styles.approveButton, updating && styles.actionButtonDisabled]}
                  onPress={handleApprove}
                  disabled={updating}
                  activeOpacity={0.7}>
                  <Text style={styles.approveButtonText}>{updating ? 'Processing...' : 'Approve'}</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {buyerRequest.status === 'approved' && (
            <View style={styles.approvedSection}>
              <Text style={styles.approvedText}>
                ✓ Flight change approved. New flight date: {buyerRequest.requestedDate ? formatDate(buyerRequest.requestedDate) : 'N/A'}
              </Text>
            </View>
          )}

          {buyerRequest.status === 'rejected' && (
            <View style={styles.rejectedSection}>
              <Text style={styles.rejectedText}>
                ✗ Flight change request has been rejected.
              </Text>
            </View>
          )}
        </View>
      ) : (
        <View style={styles.requestSection}>
          <View style={styles.requestHeader}>
            <Text style={styles.sectionLabel}>Flight Change Request</Text>
            <RequestStatusBadge status="none" />
          </View>
          <View style={styles.noRequestSection}>
            <Text style={styles.noRequestText}>
              No flight change request for this flight date.
            </Text>
          </View>
        </View>
      )}
    </View>
  );
};

const FlightDateOrders = ({ navigation, route }) => {
  const { date } = route.params || {};
  const [flightChangeRequests, setFlightChangeRequests] = useState([]);
  const [loading, setLoading] = useState(false);

  // Format date to match the format stored in currentFlightDate field
  // The format is like "Jan 3, 2024" (from toLocaleDateString)
  const formatDateForAPI = (date) => {
    if (!date) return '';
    try {
      const d = date instanceof Date ? date : new Date(date);
      if (isNaN(d.getTime())) return '';
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch (e) {
      return '';
    }
  };

  // Fetch flight change requests for this flight date
  useEffect(() => {
    const loadFlightChangeRequests = async () => {
      if (!date) return;
      
      setLoading(true);
      try {
        const netState = await NetInfo.fetch();
        if (!netState.isConnected || !netState.isInternetReachable) {
          setLoading(false);
          return;
        }

        const currentFlightDateFormatted = formatDateForAPI(date);
        const response = await getAdminFlightChangeRequestsApi({
          currentFlightDate: currentFlightDateFormatted,
          limit: 100,
          offset: 0
        });

        if (response.success && response.data?.data?.requests) {
          setFlightChangeRequests(response.data.data.requests);
        }
      } catch (error) {
        console.error('Error loading flight change requests:', error);
      } finally {
        setLoading(false);
      }
    };

    loadFlightChangeRequests();
  }, [date]);

  // Group requests by buyer
  const requestsByBuyer = {};
  flightChangeRequests.forEach((request) => {
    const buyerUid = request.buyerUid;
    if (!requestsByBuyer[buyerUid]) {
      requestsByBuyer[buyerUid] = {
        buyerInfo: {
          uid: buyerUid,
          fullName: request.buyerName || 'Unknown Buyer',
          email: request.buyerEmail || '',
          avatar: null, // Avatar not stored in request, would need to fetch from buyer collection
        },
        request: request,
      };
    }
  });

  const buyers = Object.keys(requestsByBuyer).sort((a, b) => {
    const nameA = requestsByBuyer[a].buyerInfo.fullName.toLowerCase();
    const nameB = requestsByBuyer[b].buyerInfo.fullName.toLowerCase();
    return nameA.localeCompare(nameB);
  });

  return (
    <SafeAreaView style={styles.container} edges={['top', 'bottom']}>
      <FlightDateOrdersHeader navigation={navigation} date={date} />
      
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}>
        {loading ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>Loading...</Text>
          </View>
        ) : buyers.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No flight change requests for this date</Text>
          </View>
        ) : (
          buyers.map((buyerUid) => {
            const buyerData = requestsByBuyer[buyerUid];
            return (
              <UserCard
                key={buyerUid}
                buyerInfo={buyerData.buyerInfo}
                currentFlightDate={date}
                orders={[]} // No orders data, just showing requests
                navigation={navigation}
                flightChangeRequest={buyerData.request}
              />
            );
          })
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
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  backButton: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    fontFamily: 'Inter',
    flex: 1,
    textAlign: 'center',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 16,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 60,
  },
  emptyText: {
    fontSize: 16,
    color: '#7F8D91',
    fontFamily: 'Inter',
  },
  userCard: {
    backgroundColor: '#F5F6F6',
    borderRadius: 12,
    padding: 16,
    gap: 16,
    marginBottom: 16,
  },
  ordersSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4E7E9',
    gap: 8,
  },
  orderCountContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E4E7E9',
  },
  orderCountText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    fontFamily: 'Inter',
  },
  buyerSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4E7E9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  buyerInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 12,
  },
  buyerAvatarContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    overflow: 'hidden',
  },
  buyerAvatar: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  buyerAvatarPlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#48A7F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buyerAvatarText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  buyerDetails: {
    flex: 1,
    gap: 4,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    fontFamily: 'Inter',
  },
  buyerEmail: {
    fontSize: 14,
    fontWeight: '400',
    color: '#7F8D91',
    fontFamily: 'Inter',
  },
  chatButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#539461',
    borderRadius: 12,
    minHeight: 44,
  },
  chatButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  currentFlightSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4E7E9',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7F8D91',
    fontFamily: 'Inter',
    marginBottom: 8,
  },
  currentFlightDate: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    fontFamily: 'Inter',
  },
  requestSection: {
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#E4E7E9',
    gap: 12,
  },
  requestHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  requestField: {
    gap: 8,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7F8D91',
    fontFamily: 'Inter',
  },
  readOnlyDateContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E4E7E9',
  },
  readOnlyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202325',
    fontFamily: 'Inter',
  },
  readOnlyReasonContainer: {
    backgroundColor: '#FFFFFF',
    borderRadius: 8,
    padding: 12,
    borderWidth: 1,
    borderColor: '#E4E7E9',
    minHeight: 80,
  },
  readOnlyReason: {
    fontSize: 14,
    fontWeight: '400',
    color: '#202325',
    fontFamily: 'Inter',
    lineHeight: 20,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: 12,
    marginTop: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButtonDisabled: {
    opacity: 0.5,
  },
  rejectButton: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#E7522F',
  },
  rejectButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#E7522F',
    fontFamily: 'Inter',
  },
  approveButton: {
    backgroundColor: '#23C16B',
  },
  approveButtonText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 12,
  },
  statusBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    fontFamily: 'Inter',
  },
  approvedSection: {
    backgroundColor: '#DFECDF',
    borderRadius: 8,
    padding: 12,
  },
  approvedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#23C16B',
    fontFamily: 'Inter',
  },
  rejectedSection: {
    backgroundColor: '#FEE2E2',
    borderRadius: 8,
    padding: 12,
  },
  rejectedText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#E7522F',
    fontFamily: 'Inter',
  },
  noRequestSection: {
    backgroundColor: '#F5F6F6',
    borderRadius: 8,
    padding: 12,
  },
  noRequestText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#7F8D91',
    fontFamily: 'Inter',
    fontStyle: 'italic',
  },
});

export default FlightDateOrders;
