import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import styles from './styles/BuddyDetailsStyles';

/**
 * BuddyDetails - Displays approved buddy details with order count, air cargo date, and shipping address
 */
const BuddyDetails = ({
  buddyRequest,
  formatExpirationDate,
  onCancelRequest,
}) => {
  const navigation = useNavigation();

  return (
    <>
      {/* My Current Orders Section */}
      <View style={styles.myCurrentOrdersSection}>
        <Text style={styles.myCurrentOrdersTitle}>
          Buddy Details
        </Text>
      </View>

      {/* Details Section */}
      <View style={styles.detailsSection}>
        {/* Title */}
        <View style={styles.detailsTitleRow}>
          <Text style={styles.detailsTitle}>
            My Current Orders ({buddyRequest.orderCount || 0})
          </Text>
        </View>

        {/* Order Row */}
        <View style={styles.detailRowOrder}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M20 7H16V4C16 2.9 15.1 2 14 2H10C8.9 2 8 2.9 8 4V7H4C2.9 7 2 7.9 2 9V20C2 21.1 2.9 22 4 22H20C21.1 22 22 21.1 22 20V9C22 7.9 21.1 7 20 7ZM10 4H14V7H10V4ZM20 20H4V9H20V20Z"
              fill="#556065"
            />
            <Path
              d="M11 11H13V13H11V11ZM11 15H13V17H11V15ZM15 11H17V13H15V11ZM15 15H17V17H15V15Z"
              fill="#556065"
            />
          </Svg>
          <View style={styles.detailContentOrder}>
            <View style={styles.detailTextRow}>
              <Text style={styles.detailData}>
                My Current Orders ({buddyRequest.orderCount || 0})
              </Text>
              <TouchableOpacity
                style={styles.viewOrdersLink}
                onPress={() => {
                  navigation.navigate('Orders');
                }}>
                <Text style={styles.viewOrdersText}>View Orders</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Date Row */}
        <View style={styles.detailRow}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              fillRule="evenodd"
              clipRule="evenodd"
              d="M7.5 1.5C7.91421 1.5 8.25 1.83579 8.25 2.25V3H15.75V2.25C15.75 1.83579 16.0858 1.5 16.5 1.5C16.9142 1.5 17.25 1.83579 17.25 2.25V3H19.5C20.3284 3 21 3.67157 21 4.5V19.5C21 20.3284 20.3284 21 19.5 21H4.5C3.67157 21 3 20.3284 3 19.5V4.5C3 3.67157 3.67157 3 4.5 3H6.75V2.25C6.75 1.83579 7.08579 1.5 7.5 1.5ZM6.75 4.5H4.5V7.5H19.5V4.5H17.25V5.25C17.25 5.66421 16.9142 6 16.5 6C16.0858 6 15.75 5.66421 15.75 5.25V4.5H8.25V5.25C8.25 5.66421 7.91421 6 7.5 6C7.08579 6 6.75 5.66421 6.75 5.25V4.5ZM19.5 9H4.5V19.5H19.5V9Z"
              fill="#556065"
            />
          </Svg>
          <View style={styles.detailContent}>
            <View style={styles.detailTextRow}>
              <Text style={styles.detailData}>
                {formatExpirationDate(buddyRequest.expirationDate) || 'N/A'}
              </Text>
            </View>
            <Text style={styles.detailLabel}>
              Air cargo date
            </Text>
          </View>
        </View>

        {/* Shipping Row */}
        <View style={styles.detailRow}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path
              d="M20 8H17V6C17 4.9 16.1 4 15 4H9C7.9 4 7 4.9 7 6V8H4C2.9 8 2 8.9 2 10V19C2 20.1 2.9 21 4 21H20C21.1 21 22 20.1 22 19V10C22 8.9 21.1 8 20 8ZM9 6H15V8H9V6ZM20 19H4V10H20V19Z"
              fill="#556065"
            />
            <Path
              d="M12 12C13.1 12 14 12.9 14 14C14 15.1 13.1 16 12 16C10.9 16 10 15.1 10 14C10 12.9 10.9 12 12 12Z"
              fill="#556065"
            />
          </Svg>
          <View style={styles.detailContent}>
            <View style={styles.detailTextRow}>
              <Text style={styles.detailData}>
                {buddyRequest.shippingAddress || 
                  `${buddyRequest.receiver?.firstName || 'Receiver'} ${buddyRequest.receiver?.lastName || ''}`.trim()}
              </Text>
            </View>
            <Text style={styles.detailLabel}>
              Shipping address
            </Text>
          </View>
        </View>
      </View>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
      </View>

      {/* Note Section */}
      <View style={styles.approvedNoteContainer}>
        <Text style={styles.approvedNoteBold}>
          You can only ship to one receiver per air cargo date.
        </Text>
        <Text style={styles.approvedNoteText}>
          Once your request is approved, checkout will be limited to your assigned receiver instead of your personal address.
        </Text>
        <Text style={styles.approvedNoteText}>
          To become a receiver, your buddy or buddies must submit a receiver request using your username.
        </Text>
      </View>

      {/* Action */}
      <View style={styles.actionContainer}>
        {buddyRequest.status === 'pending_cancel' ? (
          <TouchableOpacity
            style={styles.pendingCancelButton}
            disabled={true}
            activeOpacity={0.8}>
            <Text style={styles.pendingCancelButtonText}>Pending Cancel</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancelRequest}
            activeOpacity={0.8}>
            <Text style={styles.cancelButtonText}>Request a Cancel</Text>
          </TouchableOpacity>
        )}
      </View>
    </>
  );
};

export default BuddyDetails;

