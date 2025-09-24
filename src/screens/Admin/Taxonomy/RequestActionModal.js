import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Alert,
  ActivityIndicator,
} from 'react-native';

// Import API
import { approveGenusRequestApi, rejectGenusRequestApi } from '../../../auth/genusRequestActionsApi';
import { getStoredAuthToken } from '../../../utils/getStoredAuthToken';
import { getStoredAdminId } from '../../../utils/getStoredUserInfo';

// Import icons - you may need to adjust these paths based on your available icons
import CheckApproveIcon from '../../../assets/admin-icons/check-approve.svg';
import CloseRejectIcon from '../../../assets/admin-icons/close-reject.svg';

const RequestActionModal = ({ visible, onClose, onApprove, onReject, request }) => {
  const [isProcessing, setIsProcessing] = useState(false);
  const [processingAction, setProcessingAction] = useState(null); // Track which action is processing
  const mountedRef = useRef(false);

  // Debug logging when modal becomes visible
  useEffect(() => {
    mountedRef.current = true;
    if (visible && request) {
      console.log('🔍 RequestActionModal opened:', {
        id: request.id,
        genusName: request.genusName,
        species: request.species,
        status: request.status,
      });
      // Reset processing state when modal opens
      setIsProcessing(false);
      setProcessingAction(null);
    }
    return () => {
      mountedRef.current = false;
    };
  }, [visible, request]);

  // Helper: get auth token
  const getAuthToken = useCallback(async () => {
    try {
      const token = await getStoredAuthToken();
      console.log('🔑 token:', token ? 'retrieved' : 'missing');
      return token;
    } catch (e) {
      console.warn('⚠️ Failed to get auth token:', e?.message || e);
      return null;
    }
  }, []);

  const handleAddToTaxonomyList = useCallback(async () => {
    console.log('✅ Approve pressed - id:', request?.id, 'status:', request?.status);

    if (isProcessing) {
      Alert.alert('Please wait', 'Processing request...');
      return;
    }

    // Get request details
    const requestId = request?.id;
    const genusName = request?.genusName || request?.genus || '';
    const speciesName = request?.species || '';
    
    if (!requestId) {
      console.error('❌ No request ID found:', request);
      Alert.alert('Error', 'Request ID not found');
      return;
    }

    if (!genusName) {
      console.error('❌ No genus name found:', request);
      Alert.alert('Error', 'Genus name not found in request data');
      return;
    }

    console.log('📝 Approving request:', { requestId, genus: genusName, species: speciesName });

    // Check if request is already processed
    if (request?.status === 'approved') {
      console.log('⚠️ Request is already approved');
      Alert.alert('Request Already Processed', 'This request has already been approved.');
      return;
    }

    if (request?.status === 'rejected') {
      console.log('⚠️ Request is already rejected');
      Alert.alert('Request Already Processed', 'This request has already been rejected.');
      return;
    }

    try {
      setIsProcessing(true);
      setProcessingAction('approve');
      console.log('🔒 Setting isProcessing to true for APPROVAL');

      // Retrieve auth token and admin ID
      const authToken = await getAuthToken();
      const storedAdminId = await getStoredAdminId();

      if (!authToken) {
        console.warn('⚠️ No auth token found. Request may fail in production.');
      }

      console.log('🔑 Auth details:', {
        hasAuthToken: !!authToken,
        hasAdminId: !!storedAdminId,
        adminId: storedAdminId ? storedAdminId.substring(0, 8) + '...' : 'none'
      });

      // Call the approve API
      const response = await approveGenusRequestApi({
        requestId: requestId,
        adminId: storedAdminId,
        comment: `Approved genus "${genusName}" with species "${speciesName}"`,
        authToken
      });

      if (response.success) {
        console.log('✅ Request approved successfully:', response.data);
        
        Alert.alert(
          'Success', 
          `${genusName} ${speciesName} has been approved and added to the taxonomy list.`,
          [
            {
              text: 'OK',
              onPress: () => {
                onClose();
                // Call the parent onApprove callback to refresh the list
                if (onApprove) {
                  onApprove(request);
                }
              }
            }
          ]
        );
      } else {
        console.error('❌ Approval failed:', response.error);
        Alert.alert('Error', response.error || 'Failed to approve request');
      }

    } catch (error) {
      console.error('❌ Error approving request:', error);
      Alert.alert('Error', 'An unexpected error occurred while approving the request');
    } finally {
      if (mountedRef.current) {
        setIsProcessing(false);
        setProcessingAction(null);
      }
      console.log('🔓 Setting isProcessing to false for APPROVAL');
    }
  }, [request, isProcessing, getAuthToken, onClose, onApprove]);

  const handleRejectRequest = useCallback(async () => {
    console.log('❌ Reject pressed - id:', request?.id, 'status:', request?.status);
    
    if (isProcessing) {
      Alert.alert('Please wait', 'Processing request...');
      return;
    }

    const requestId = request?.id;
    const genusName = request?.genusName || request?.genus || '';
    const speciesName = request?.species || '';
    
    if (!requestId) {
      console.error('❌ No request ID found:', request);
      Alert.alert('Error', 'Request ID not found');
      return;
    }

    // Check if request is already processed
    if (request?.status === 'approved') {
      console.log('⚠️ Request is already approved');
      Alert.alert('Request Already Processed', 'This request has already been approved.');
      return;
    }

    if (request?.status === 'rejected') {
      console.log('⚠️ Request is already rejected');
      Alert.alert('Request Already Processed', 'This request has already been rejected.');
      return;
    }

    // Show confirmation dialog
    Alert.alert(
      'Reject Request',
      `Are you sure you want to reject "${genusName} ${speciesName}"?`,
      [
        {
          text: 'Cancel',
          style: 'cancel'
        },
        {
          text: 'Reject',
          style: 'destructive',
          onPress: async () => {
            try {
              setIsProcessing(true);
              setProcessingAction('reject');
              console.log('🔒 Setting isProcessing to true for REJECTION');

              // Retrieve auth token and admin ID
              const authToken = await getAuthToken();
              const storedAdminId = await getStoredAdminId();

              if (!authToken) {
                console.warn('⚠️ No auth token found. Request may fail in production.');
              }

              console.log('🔑 Auth details for rejection:', {
                hasAuthToken: !!authToken,
                hasAdminId: !!storedAdminId,
                adminId: storedAdminId ? storedAdminId.substring(0, 8) + '...' : 'none'
              });

              // Call the reject API
              const response = await rejectGenusRequestApi({
                requestId: requestId,
                adminId: storedAdminId,
                reason: 'Request rejected by admin',
                comment: `Rejected genus "${genusName}" with species "${speciesName}"`,
                authToken
              });

              if (response.success) {
                console.log('❌ Request rejected successfully:', response.data);
                
                Alert.alert(
                  'Request Rejected', 
                  `${genusName} ${speciesName} has been rejected.`,
                  [
                    {
                      text: 'OK',
                      onPress: () => {
                        onClose();
                        // Call the parent onReject callback to refresh the list
                        if (onReject) {
                          onReject(request);
                        }
                      }
                    }
                  ]
                );
              } else {
                console.error('❌ Rejection failed:', response.error);
                Alert.alert('Error', response.error || 'Failed to reject request');
              }

            } catch (error) {
              console.error('❌ Error rejecting request:', error);
              Alert.alert('Error', 'An unexpected error occurred while rejecting the request');
            } finally {
              if (mountedRef.current) {
                setIsProcessing(false);
                setProcessingAction(null);
              }
              console.log('🔓 Setting isProcessing to false for REJECTION');
            }
          }
        }
      ]
    );
  }, [request, isProcessing, getAuthToken, onClose, onReject]);

  // Guarded close handler for Android back button and iOS swipe-to-dismiss
  const handleRequestClose = useCallback(() => {
    if (!isProcessing) {
      onClose();
    }
  }, [isProcessing, onClose]);

  return (
    <Modal
      visible={visible}
      transparent={true}
      animationType="slide"
      onRequestClose={handleRequestClose}
      allowSwipeDismissal={!isProcessing}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable}
          activeOpacity={1} 
          onPress={() => { if (!isProcessing) onClose(); }}
          accessible={true}
          accessibilityRole="button"
          accessibilityLabel="Dismiss actions"
          accessibilityHint="Double tap to close the actions menu"
          testID="overlayDismiss"
          hitSlop={8}
        />
        
        {/* Taxonomy: Request->Option */}
        <View
          style={styles.container}
          accessibilityViewIsModal={true}
          accessibilityRole="menu"
          accessibilityLabel="Genus request actions"
          accessibilityHint="Choose to add to taxonomy or reject"
          accessibilityState={{ busy: isProcessing }}
          testID="actionSheet"
        >
          {/* Action Sheet */}
          <View style={styles.actionSheet}>
            {/* System / Action Sheet Indicator */}
            <View style={styles.indicatorContainer}>
              {/* Indicator Bar */}
              <View style={styles.indicatorBar} />
            </View>
            
            {/* Content */}
            <View style={styles.content}>
              {/* First Option - Add to taxonomy list */}
              <View style={styles.options}>
                <TouchableOpacity 
                  style={styles.listLeft}
                  onPress={handleAddToTaxonomyList}
                  disabled={isProcessing}
                  activeOpacity={0.7}
                  delayPressIn={0}
                  delayPressOut={100}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Add to taxonomy"
                  accessibilityHint="Approves this genus request and adds it to taxonomy"
                  accessibilityState={{ disabled: isProcessing, busy: processingAction === 'approve' }}
                  testID="approveButton"
                  hitSlop={8}
                  pressRetentionOffset={{ top: 20, left: 20, right: 20, bottom: 30 }}
                >
                  {/* Icon */}
                  <View style={styles.iconContainer}>
                    {processingAction === 'approve' ? (
                      <ActivityIndicator size="small" color="#34C759" />
                    ) : (
                      <CheckApproveIcon width={19} height={14} />
                    )}
                  </View>
                  {/* List title */}
                  <Text style={[styles.listTitle, isProcessing && styles.disabledText]}>
                    {processingAction === 'approve' ? 'Processing...' : 'Add to taxonomy'}
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.listRight}>
                  {/* Icon placeholder for right side */}
                </View>
              </View>
              
              {/* Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
              </View>
              
              {/* Second Option - Reject */}
              <View style={styles.options}>
                <TouchableOpacity 
                  style={styles.listLeft}
                  onPress={handleRejectRequest}
                  disabled={isProcessing}
                  activeOpacity={0.7}
                  delayPressIn={0}
                  delayPressOut={100}
                  accessible={true}
                  accessibilityRole="button"
                  accessibilityLabel="Reject request"
                  accessibilityHint="Rejects this genus request"
                  accessibilityState={{ disabled: isProcessing, busy: processingAction === 'reject' }}
                  testID="rejectButton"
                  hitSlop={8}
                  pressRetentionOffset={{ top: 20, left: 20, right: 20, bottom: 30 }}
                >
                  {/* Icon */}
                  <View style={styles.iconContainer}>
                    {processingAction === 'reject' ? (
                      <ActivityIndicator size="small" color="#FF3B30" />
                    ) : (
                      <CloseRejectIcon width={24} height={24} />
                    )}
                  </View>
                  {/* List title */}
                  <Text style={[styles.listTitle, isProcessing && styles.disabledText]}>
                    {processingAction === 'reject' ? 'Processing...' : 'Reject request'}
                  </Text>
                </TouchableOpacity>
                
                <View style={styles.listRight}>
                  {/* Icon placeholder for right side */}
                </View>
              </View>
              
              {/* Final Divider */}
              <View style={styles.dividerContainer}>
                <View style={styles.divider} />
              </View>
            </View>
            
            {/* Action Home Indicator */}
            <View style={styles.actionHomeIndicator}>
              {/* Gesture Bar */}
              <View style={styles.gestureBar} />
            </View>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  
  overlayTouchable: {
    flex: 1,
  },
  
  /* Taxonomy: Request->Option */
  container: {
    flexDirection: 'column',
    justifyContent: 'flex-end',
    alignItems: 'flex-start',
    padding: 0,
    position: 'relative',
    width: '100%',
    height: 196,
  },
  
  /* Action Sheet */
  actionSheet: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingBottom: 34,
    width: '100%',
    height: 196,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomLeftRadius: 0,
    borderBottomRightRadius: 0,
  },
  
  /* System / Action Sheet Indicator */
  indicatorContainer: {
    width: '100%',
    height: 24,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  /* Indicator Bar */
  indicatorBar: {
    position: 'absolute',
    width: '12.8%', // Approximately matches the Figma percentages
    height: '20%',
    backgroundColor: '#E4E7E9',
    borderRadius: 100,
    top: '33.33%',
  },
  
  /* Content */
  content: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 8,
    width: '100%',
    height: 138,
  },
  
  /* Options */
  options: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    width: '100%',
    height: 48,
  },
  
  /* List Left */
  listLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingLeft: 16,
    paddingRight: 0,
    gap: 8,
    flex: 1,
    height: 48,
    minHeight: 48,
  },
  
  /* Icon */
  iconContainer: {
    width: 24,
    height: 24,
  },
  
  /* List title */
  listTitle: {
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    color: '#393D40',
  },
  
  /* Disabled text style */
  disabledText: {
    color: '#8E8E93',
    opacity: 0.6,
  },
  
  /* List Right */
  listRight: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    paddingVertical: 8,
    paddingLeft: 0,
    paddingRight: 16,
    gap: 8,
    flex: 1,
    height: 48,
    minHeight: 48,
  },
  
  /* Divider Container */
  dividerContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 8,
    width: '100%',
    height: 17,
  },
  
  /* Divider */
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4E7E9',
  },
  
  /* Action Home Indicator */
  actionHomeIndicator: {
    position: 'absolute',
    width: '100%',
    height: 34,
    left: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  
  /* Gesture Bar */
  gestureBar: {
    position: 'absolute',
    width: 148,
    height: 5,
    backgroundColor: '#202325',
    borderRadius: 100,
    bottom: 8,
  },
});

export default RequestActionModal;
