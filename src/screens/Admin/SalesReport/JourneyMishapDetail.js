import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Image,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Modal,
  Animated,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useNavigation, useRoute} from '@react-navigation/native';
import ScreenHeader from '../../../components/Admin/header';
import CalendarIcon from '../../../assets/icons/greylight/calendar-blank-regular.svg';
import QuestionIcon from '../../../assets/icons/greylight/question-regular.svg';
import CopyIcon from '../../../assets/icons/greylight/copy-regular.svg';
import CountryFlagIcon from '../../../components/CountryFlagIcon/CountryFlagIcon';
import {Linking, Alert, ActivityIndicator} from 'react-native';
import {updateJourneyMishapStatusApi} from '../../../components/Api/orderManagementApi';

const {width: SCREEN_WIDTH} = Dimensions.get('window');

const JourneyMishapDetail = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  // Get data passed from navigation
  const {creditRequest, onStatusUpdate} = route.params || {};
  const [tooltipVisible, setTooltipVisible] = useState(null);
  const [reviewModalVisible, setReviewModalVisible] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  // Debug: Log credit request status
  console.log('📋 Credit Request Status:', {
    status: creditRequest.status,
    creditStatus: creditRequest.creditStatus,
  });

  useEffect(() => {
    if (reviewModalVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }).start();
    }
  }, [reviewModalVisible]);

  const handleViewInvoice = () => {
    if (!creditRequest.transactionNumber) {
      console.warn('No transaction number available for invoice');
      return;
    }
    
    // Navigate to invoice view screen with transaction number and plant code
    navigation.navigate('InvoiceViewScreen', {
      transactionNumber: creditRequest.transactionNumber,
      plantCode: creditRequest.plantCode
    });
  };

  const handleApproveCredit = async () => {
    setReviewModalVisible(false);
    
    const currentStatus = (creditRequest.status || '')?.toLowerCase();
    const isUpdatingDecision = currentStatus === 'rejected';
    
    setIsUpdating(true);

    try {
      const response = await updateJourneyMishapStatusApi({
        creditRequestId: creditRequest.id,
        status: 'approved',
        reviewNotes: isUpdatingDecision ? 'Credit decision updated to approved by admin' : 'Credit approved by admin'
      });

      setIsUpdating(false);

      if (response.success) {
        // Optimistically update the status in the parent screen
        if (onStatusUpdate) {
          onStatusUpdate(creditRequest.id, 'approved');
        }
        
        Alert.alert(
          'Success',
          isUpdatingDecision 
            ? `Credit decision updated to approved! Amount: $${response.data.approvedAmount || 0}`
            : `Credit approved successfully! Amount: $${response.data.approvedAmount || 0}`,
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back to the list
                navigation.goBack();
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to approve credit');
      }
    } catch (error) {
      setIsUpdating(false);
      Alert.alert('Error', error.message || 'An error occurred');
    }
  };

  const handleRejectCredit = async () => {
    setReviewModalVisible(false);
    
    const currentStatus = (creditRequest.status || '')?.toLowerCase();
    const isUpdatingDecision = currentStatus === 'approved';
    
    // Show confirmation dialog
    Alert.alert(
      isUpdatingDecision ? 'Update Credit Decision' : 'Reject Credit Request',
      isUpdatingDecision 
        ? 'Are you sure you want to change this decision to rejected?'
        : 'Are you sure you want to reject this credit request?',
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            setIsUpdating(true);

            try {
              const response = await updateJourneyMishapStatusApi({
                creditRequestId: creditRequest.id,
                status: 'rejected',
                reviewNotes: isUpdatingDecision ? 'Credit decision updated to rejected by admin' : 'Credit rejected by admin'
              });

              setIsUpdating(false);

              if (response.success) {
                // Optimistically update the status in the parent screen
                if (onStatusUpdate) {
                  onStatusUpdate(creditRequest.id, 'rejected');
                }
                
                Alert.alert(
                  'Success',
                  isUpdatingDecision 
                    ? 'Credit decision updated to rejected successfully'
                    : 'Credit request rejected successfully',
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        // Navigate back to the list
                        navigation.goBack();
                      }
                    }
                  ]
                );
              } else {
                Alert.alert('Error', response.error || 'Failed to reject credit');
              }
            } catch (error) {
              setIsUpdating(false);
              Alert.alert('Error', error.message || 'An error occurred');
            }
          }
        }
      ]
    );
  };

  if (!creditRequest) {
    return (
      <SafeAreaView style={styles.container}>
        <ScreenHeader title="Journey Mishap" />
        <View style={styles.emptyContainer}>
          <Text style={styles.emptyText}>No data available</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />
      <ScreenHeader title="Journey Mishap" navigation={navigation} />
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Status Details */}
        <View style={styles.statusDetailsSection}>
          <View style={styles.titleRow}>
            <Text style={styles.title}>Journey Mishap</Text>
            <View style={[styles.creditStatusBadge, {backgroundColor: creditRequest.creditStatusColor || '#48A7F8'}]}>
              <Text style={styles.creditStatusText}>{creditRequest.creditStatus || 'Pending Review'}</Text>
            </View>
          </View>
          
          {/* Invoice Number */}
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Invoice Number</Text>
            <View style={styles.detailValueRow}>
              <Text style={styles.detailValue}>{creditRequest.transactionNumber || creditRequest.orderId || 'N/A'}</Text>
              <TouchableOpacity>
                <CopyIcon width={24} height={24} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Plant List */}
        <View style={styles.plantListSection}>
          <View style={styles.plantCard}>
            <View style={styles.plantItem}>
              {/* Plant Image */}
              <View style={styles.plantImageContainer}>
                {creditRequest.plantImage ? (
                  <Image 
                    source={{uri: creditRequest.plantImage}} 
                    style={styles.plantImage}
                    resizeMode="cover"
                  />
                ) : (
                  <View style={styles.plantImagePlaceholder}>
                    <Text style={styles.placeholderText}>No Image</Text>
                  </View>
                )}
              </View>

              {/* Plant Details */}
              <View style={styles.plantDetails}>
                {/* Code + Country */}
                <View style={styles.codeCountryRow}>
                  <View style={styles.codeContainer}>
                    <Text style={styles.plantCodeNumber}>{creditRequest.plantCode}</Text>
                    <TouchableOpacity 
                      onPress={() => setTooltipVisible(tooltipVisible === creditRequest.id ? null : creditRequest.id)}
                      style={styles.questionIconContainer}
                    >
                      <QuestionIcon width={20} height={20} />
                      {tooltipVisible === creditRequest.id && (
                        <View style={styles.tooltip}>
                          <Text style={styles.tooltipText}>Plant Code</Text>
                        </View>
                      )}
                    </TouchableOpacity>
                  </View>
                  <View style={styles.countryContainer}>
                    <Text style={styles.countryText}>{creditRequest.country}</Text>
                    <CountryFlagIcon code={creditRequest.country} width={24} height={16} />
                  </View>
                </View>

                {/* Plant Name */}
                <Text style={styles.plantName}>{creditRequest.genusSpecie}</Text>

                {/* Variegation + Size */}
                <View style={styles.variegationSizeRow}>
                  <Text style={styles.variegationText}>{creditRequest.variegation}</Text>
                  {creditRequest.size && (
                    <>
                      <View style={styles.dividerDot} />
                      <Text style={styles.sizeText}>{creditRequest.size}</Text>
                    </>
                  )}
                </View>

                {/* Price + Quantity */}
                <View style={styles.priceQuantityRow}>
                  <Text style={styles.priceText}>{creditRequest.price}</Text>
                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantityText}>{creditRequest.quantity}x</Text>
                  </View>
                </View>
              </View>
            </View>
          </View>
        </View>

        {/* Request Details */}
        <View style={styles.requestDetailsSection}>
          <Text style={styles.sectionTitle}>Request Details</Text>
          
          {/* Requested Date */}
          <View style={styles.requestedDateContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Requested Date</Text>
              <Text style={styles.detailValueBold}>
                {(() => {
                  // Extract date from creditRequest.date which is already formatted
                  // We need to get the raw date and format it with time in EST
                  const rawDate = creditRequest.rawDate || creditRequest.createdAt || creditRequest.date;
                  if (!rawDate) return 'N/A';
                  
                  try {
                    let dateObj;
                    if (typeof rawDate === 'string') {
                      dateObj = new Date(rawDate);
                    } else if (rawDate.toDate) {
                      dateObj = rawDate.toDate();
                    } else if (rawDate instanceof Date) {
                      dateObj = rawDate;
                    } else {
                      dateObj = new Date(rawDate);
                    }
                    
                    if (isNaN(dateObj.getTime())) return 'N/A';
                    
                    // Format date: Jul-25-2025, 03:35 PM (EST)
                    const month = dateObj.toLocaleDateString('en-US', { month: 'short', timeZone: 'America/New_York' });
                    const day = dateObj.toLocaleDateString('en-US', { day: '2-digit', timeZone: 'America/New_York' });
                    const year = dateObj.toLocaleDateString('en-US', { year: 'numeric', timeZone: 'America/New_York' });
                    const time = dateObj.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true,
                      timeZone: 'America/New_York'
                    });
                    
                    return `${month}-${day}-${year}, ${time}`;
                  } catch (error) {
                    console.error('Error formatting requested date:', error);
                    return creditRequest.date || 'N/A';
                  }
                })()}
              </Text>
            </View>
          </View>

          {/* Attachment */}
          {creditRequest.attachments && creditRequest.attachments.length > 0 && (
            <View style={styles.attachmentSection}>
              <Text style={styles.attachmentLabel}>Attachment</Text>
              <ScrollView horizontal style={styles.attachmentScroll} showsHorizontalScrollIndicator={false}>
                {creditRequest.attachments.map((attachment, index) => (
                  <View key={index} style={styles.attachmentItem}>
                    {attachment.type === 'video' ? (
                  <View style={styles.videoContainer}>
                    <Image source={{uri: attachment.thumbnail}} style={styles.attachmentImage} />
                    <View style={styles.playButton}>
                      <Text style={styles.playText}>▶</Text>
                    </View>
                  </View>
                    ) : (
                      <Image source={{uri: attachment.url}} style={styles.attachmentImage} />
                    )}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Message */}
          {creditRequest.description && (
            <View style={styles.messageSection}>
              <Text style={styles.messageLabel}>Message</Text>
              <View style={styles.messageBox}>
                <Text style={styles.messageText}>{creditRequest.description}</Text>
              </View>
            </View>
          )}

          {/* Action Button */}
          <View style={styles.actionSection}>
            {(() => {
              const status = (creditRequest.status || '')?.toLowerCase();
              const isReviewed = status === 'approved' || status === 'rejected';
              
              return (
                <TouchableOpacity 
                  style={[
                    styles.actionButton, 
                    isReviewed && styles.actionButtonReviewed
                  ]}
                  onPress={() => {
                    if (!isUpdating) {
                      setReviewModalVisible(true);
                    }
                  }}
                  disabled={isUpdating}
                >
                  {isUpdating ? (
                    <ActivityIndicator color="#FFFFFF" />
                  ) : (
                    <Text style={styles.actionButtonText}>
                      {isReviewed ? 'Update Credit Decision' : 'Review Request'}
                    </Text>
                  )}
                </TouchableOpacity>
              );
            })()}
          </View>
        </View>

        {/* Shipping Details */}
        <View style={styles.shippingDetailsSection}>
          <Text style={styles.sectionTitle}>Shipping Details</Text>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Tracking Number</Text>
            <View style={styles.detailValueRow}>
              <Text style={styles.detailValue}>{creditRequest.trackingNumber || 'N/A'}</Text>
              <TouchableOpacity>
                <CopyIcon width={24} height={24} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Transaction Details */}
        <View style={styles.transactionDetailsSection}>
          <Text style={styles.sectionTitle}>Transaction Details</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Transaction Number</Text>
              <View style={styles.detailValueRow}>
                <Text style={styles.detailValue}>{creditRequest.transactionNumber || creditRequest.orderId || 'N/A'}</Text>
                <TouchableOpacity>
                  <CopyIcon width={24} height={24} />
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Order Date</Text>
              <Text style={styles.detailValueBold}>
                {(() => {
                  const orderDate = creditRequest.orderDate;
                  if (!orderDate) return 'N/A';
                  
                  try {
                    let dateObj;
                    if (typeof orderDate === 'string') {
                      dateObj = new Date(orderDate);
                    } else if (orderDate.toDate) {
                      dateObj = orderDate.toDate();
                    } else if (orderDate instanceof Date) {
                      dateObj = orderDate;
                    } else {
                      dateObj = new Date(orderDate);
                    }
                    
                    if (isNaN(dateObj.getTime())) return 'N/A';
                    
                    // Format: Jul-25-2025, 03:35 PM (EST)
                    const month = dateObj.toLocaleDateString('en-US', { month: 'short', timeZone: 'America/New_York' });
                    const day = dateObj.toLocaleDateString('en-US', { day: '2-digit', timeZone: 'America/New_York' });
                    const year = dateObj.toLocaleDateString('en-US', { year: 'numeric', timeZone: 'America/New_York' });
                    const time = dateObj.toLocaleTimeString('en-US', { 
                      hour: '2-digit', 
                      minute: '2-digit',
                      hour12: true,
                      timeZone: 'America/New_York'
                    });
                    
                    return `${month}-${day}-${year}, ${time}`;
                  } catch (error) {
                    console.error('Error formatting order date:', error);
                    return 'N/A';
                  }
                })()}
              </Text>
            </View>
          </View>
        </View>

        {/* Purchase Details */}
        <View style={styles.purchaseDetailsSection}>
          <Text style={styles.sectionTitle}>Purchase Details</Text>
          
          {/* Buyer */}
          <View style={styles.userListItem}>
            <View style={styles.userCard}>
              <View style={styles.userAvatarContainer}>
                {creditRequest.userAvatar ? (
                  <Image source={{uri: creditRequest.userAvatar}} style={styles.userAvatar} />
                ) : (
                  <View style={styles.userAvatarPlaceholder}>
                    <Text style={styles.avatarPlaceholderText}>{creditRequest.userName?.charAt(0) || 'U'}</Text>
                  </View>
                )}
              </View>
              <View style={styles.userContent}>
                <View style={styles.userNameRow}>
                  <Text style={styles.userNameText}>{creditRequest.userName || 'Unknown'}</Text>
                  <Text style={styles.userUsernameText}>{creditRequest.userUsername || ''}</Text>
                </View>
                <Text style={styles.userRoleText}>{creditRequest.userRole || 'Buyer'}</Text>
              </View>
            </View>
          </View>

          {/* Receiver - if different from buyer */}
          {creditRequest.receiverInfo && (
            <View style={styles.userListItem}>
              <View style={styles.userCard}>
                <View style={styles.userAvatarContainer}>
                  {creditRequest.receiverInfo.avatar || creditRequest.receiverInfo.profileImage ? (
                    <Image 
                      source={{uri: creditRequest.receiverInfo.avatar || creditRequest.receiverInfo.profileImage}} 
                      style={styles.userAvatar} 
                    />
                  ) : (
                    <View style={styles.userAvatarPlaceholder}>
                      <Text style={styles.avatarPlaceholderText}>
                        {(creditRequest.receiverInfo.firstName?.charAt(0) || creditRequest.receiverInfo.name?.charAt(0) || 'R')}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.userContent}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userNameText}>
                      {creditRequest.receiverInfo.firstName && creditRequest.receiverInfo.lastName
                        ? `${creditRequest.receiverInfo.firstName} ${creditRequest.receiverInfo.lastName}`
                        : creditRequest.receiverInfo.name || creditRequest.receiverInfo.username || 'Unknown'}
                    </Text>
                    <Text style={styles.userUsernameText}>
                      {creditRequest.receiverInfo.username ? `@${creditRequest.receiverInfo.username}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.userRoleText}>Receiver</Text>
                </View>
              </View>
            </View>
          )}

          {/* Seller */}
          {creditRequest.sellerInfo && (
            <View style={styles.userListItem}>
              <View style={styles.userCard}>
                <View style={styles.userAvatarContainer}>
                  {creditRequest.sellerInfo.profileImage || creditRequest.sellerInfo.avatar ? (
                    <Image 
                      source={{uri: creditRequest.sellerInfo.profileImage || creditRequest.sellerInfo.avatar}} 
                      style={styles.userAvatar} 
                    />
                  ) : (
                    <View style={styles.userAvatarPlaceholder}>
                      <Text style={styles.avatarPlaceholderText}>
                        {(creditRequest.sellerInfo.firstName?.charAt(0) || creditRequest.sellerInfo.name?.charAt(0) || 'S')}
                      </Text>
                    </View>
                  )}
                </View>
                <View style={styles.userContent}>
                  <View style={styles.userNameRow}>
                    <Text style={styles.userNameText}>
                      {creditRequest.sellerInfo.firstName && creditRequest.sellerInfo.lastName 
                        ? `${creditRequest.sellerInfo.firstName} ${creditRequest.sellerInfo.lastName}`
                        : creditRequest.sellerInfo.name || creditRequest.sellerInfo.username || 'Unknown'}
                    </Text>
                    <Text style={styles.userUsernameText}>
                      {creditRequest.sellerInfo.username ? `@${creditRequest.sellerInfo.username}` : ''}
                    </Text>
                  </View>
                  <Text style={styles.userRoleText}>Supplier</Text>
                </View>
              </View>
            </View>
          )}
        </View>

        {/* Pricing Details */}
        <View style={styles.pricingDetailsSection}>
          <Text style={styles.sectionTitle}>Pricing Details</Text>
          <View style={styles.detailsContainer}>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Plant Price</Text>
              <Text style={styles.priceValue}>{creditRequest.price || '$0.00'}</Text>
            </View>
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Shipping Cost</Text>
              <Text style={styles.detailValue}>{creditRequest.shippingCost || '$0.00'}</Text>
            </View>
          </View>
        </View>

        {/* Invoice Button */}
        <View style={styles.invoiceSection}>
          <TouchableOpacity 
            style={styles.invoiceButton}
            onPress={handleViewInvoice}
          >
            <Text style={styles.invoiceButtonText}>View Invoice</Text>
          </TouchableOpacity>
        </View>

        <View style={{height: 20}} />
      </ScrollView>

      {/* Review Options Modal */}
      <Modal
        visible={reviewModalVisible}
        transparent={true}
        animationType="slide"
        onRequestClose={() => setReviewModalVisible(false)}
      >
        <Animated.View 
          style={[
            styles.modalOverlay,
            {
              opacity: fadeAnim,
            }
          ]}
        >
          <TouchableOpacity 
            style={styles.modalOverlayTouchable}
            activeOpacity={1}
            onPress={() => setReviewModalVisible(false)}
          >
            <View style={styles.actionSheet}>
            {/* Indicator */}
            <View style={styles.sheetIndicatorContainer}>
              <View style={styles.sheetIndicator} />
            </View>

            {/* Content */}
            <View style={styles.sheetContent}>
              {(() => {
                const status = (creditRequest.status || '')?.toLowerCase();
                
                // If approved, show reject option only
                if (status === 'approved') {
                  return (
                    <>
                      <TouchableOpacity 
                        style={styles.sheetOption}
                        onPress={handleRejectCredit}
                      >
                        <View style={styles.optionLeft}>
                          <Text style={styles.optionText}>Reject Credit</Text>
                        </View>
                        <View style={styles.optionRight}>
                          <Text style={styles.optionIcon}>✕</Text>
                        </View>
                      </TouchableOpacity>
                      <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                      </View>
                    </>
                  );
                }
                
                // If rejected, show approve option only
                if (status === 'rejected') {
                  return (
                    <>
                      <TouchableOpacity 
                        style={styles.sheetOption}
                        onPress={handleApproveCredit}
                      >
                        <View style={styles.optionLeft}>
                          <Text style={styles.optionText}>Approve Credit</Text>
                        </View>
                        <View style={styles.optionRight}>
                          <Text style={styles.optionIcon}>✓</Text>
                        </View>
                      </TouchableOpacity>
                      <View style={styles.dividerContainer}>
                        <View style={styles.divider} />
                      </View>
                    </>
                  );
                }
                
                // If pending, show both options
                return (
                  <>
                    <TouchableOpacity 
                      style={styles.sheetOption}
                      onPress={handleApproveCredit}
                    >
                      <View style={styles.optionLeft}>
                        <Text style={styles.optionText}>Approve Credit</Text>
                      </View>
                      <View style={styles.optionRight}>
                        <Text style={styles.optionIcon}>✓</Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                      <View style={styles.divider} />
                    </View>

                    <TouchableOpacity 
                      style={styles.sheetOption}
                      onPress={handleRejectCredit}
                    >
                      <View style={styles.optionLeft}>
                        <Text style={styles.optionText}>Reject Credit</Text>
                      </View>
                      <View style={styles.optionRight}>
                        <Text style={styles.optionIcon}>✕</Text>
                      </View>
                    </TouchableOpacity>

                    <View style={styles.dividerContainer}>
                      <View style={styles.divider} />
                    </View>
                  </>
                );
              })()}
            </View>
          </View>
          </TouchableOpacity>
        </Animated.View>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  scrollView: {
    flex: 1,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyText: {
    fontSize: 16,
    color: '#647276',
  },
  statusDetailsSection: {
    paddingHorizontal: 15,
    paddingTop: 12,
    paddingBottom: 20,
    gap: 8,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    height: 32,
    gap: 12,
  },
  title: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 24,
    lineHeight: 32,
    color: '#E7522F',
  },
  creditStatusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 28,
    backgroundColor: '#48A7F8',
    borderRadius: 8,
  },
  creditStatusText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#FFFFFF',
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    gap: 4,
    minHeight: 32,
  },
  detailLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  detailValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  detailValue: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  detailValueBold: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  plantListSection: {
    gap: 6,
  },
  plantCard: {
    padding: 12,
    backgroundColor: '#F5F6F6',
  },
  plantItem: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  plantImageContainer: {
    width: 96,
    height: 128,
    borderRadius: 6,
    overflow: 'hidden',
  },
  plantImage: {
    width: '100%',
    height: '100%',
  },
  plantImagePlaceholder: {
    width: '100%',
    height: '100%',
    backgroundColor: '#E4E7E9',
    justifyContent: 'center',
    alignItems: 'center',
  },
  placeholderText: {
    fontSize: 12,
    color: '#7F8D91',
  },
  plantDetails: {
    flex: 1,
    gap: 4,
  },
  codeCountryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: 8,
    height: 28,
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 4,
  },
  plantCodeNumber: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
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
  countryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  countryText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#556065',
  },
  plantName: {
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
    borderRadius: 100,
  },
  sizeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  priceQuantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  quantityText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    textAlign: 'right',
  },
  requestDetailsSection: {
    paddingTop: 16,
    paddingBottom: 20,
    gap: 16,
  },
  sectionTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    paddingHorizontal: 15,
  },
  requestedDateContainer: {
    paddingHorizontal: 15,
  },
  attachmentSection: {
    gap: 8,
  },
  attachmentLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    paddingHorizontal: 15,
  },
  attachmentScroll: {
    paddingHorizontal: 15,
  },
  attachmentItem: {
    width: 345,
    height: 140,
    marginRight: 12,
    borderRadius: 12,
    overflow: 'hidden',
  },
  videoContainer: {
    width: '100%',
    height: '100%',
    backgroundColor: '#202325',
    justifyContent: 'center',
    alignItems: 'center',
  },
  attachmentImage: {
    width: '100%',
    height: '100%',
    opacity: 0.8,
  },
  playButton: {
    position: 'absolute',
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  playText: {
    fontSize: 24,
    color: '#202325',
  },
  messageSection: {
    gap: 8,
    paddingHorizontal: 15,
  },
  messageLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  messageBox: {
    padding: 12,
    backgroundColor: '#FFE7E2',
    borderWidth: 1,
    borderColor: '#F18D76',
    borderRadius: 12,
  },
  messageText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  actionSection: {
    paddingHorizontal: 15,
  },
  actionButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#539461',
    borderRadius: 12,
    minHeight: 48,
    width: '100%',
  },
  actionButtonDisabled: {
    backgroundColor: '#A0C4A8',
    opacity: 0.7,
  },
  actionButtonReviewed: {
    backgroundColor: '#414649',
  },
  actionButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  shippingDetailsSection: {
    paddingHorizontal: 15,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 8,
    backgroundColor: '#F5F6F6',
  },
  transactionDetailsSection: {
    paddingHorizontal: 15,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 8,
  },
  detailsContainer: {
    gap: 0,
  },
  purchaseDetailsSection: {
    paddingTop: 16,
    paddingBottom: 8,
    backgroundColor: '#F5F6F6',
  },
  userListItem: {
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  userCard: {
    flexDirection: 'row',
    padding: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
  },
  userAvatarContainer: {
    width: 40,
    height: 40,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 1000,
    borderWidth: 1,
    borderColor: '#539461',
  },
  userAvatarPlaceholder: {
    width: 40,
    height: 40,
    borderRadius: 1000,
    backgroundColor: '#539461',
    justifyContent: 'center',
    alignItems: 'center',
  },
  avatarPlaceholderText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#FFFFFF',
  },
  userContent: {
    flex: 1,
    gap: 0,
  },
  userNameRow: {
    flexDirection: 'row',
    gap: 4,
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
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#7F8D91',
  },
  userRoleText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
  },
  pricingDetailsSection: {
    paddingHorizontal: 15,
    paddingTop: 16,
    paddingBottom: 20,
    gap: 8,
  },
  priceValue: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    color: '#202325',
  },
  invoiceSection: {
    paddingHorizontal: 15,
    paddingVertical: 20,
  },
  invoiceButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    minHeight: 48,
  },
  invoiceButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#393D40',
  },
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  modalOverlayTouchable: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.2)',
  },
  actionSheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 34,
    width: '100%',
  },
  sheetIndicatorContainer: {
    width: '100%',
    height: 24,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  sheetIndicator: {
    width: 48,
    height: 5,
    backgroundColor: '#E4E7E9',
    borderRadius: 100,
  },
  sheetContent: {
    paddingTop: 8,
  },
  sheetOption: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    height: 48,
    minHeight: 48,
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 16,
    paddingRight: 0,
    paddingVertical: 12,
    gap: 8,
    flex: 1,
    minHeight: 48,
  },
  optionText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
  },
  optionRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingRight: 16,
    paddingLeft: 0,
    paddingVertical: 8,
    gap: 8,
    flex: 1,
    minHeight: 48,
  },
  optionIcon: {
    fontSize: 24,
    color: '#556065',
  },
  dividerContainer: {
    paddingVertical: 8,
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4E7E9',
  },
});

export default JourneyMishapDetail;

