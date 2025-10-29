import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import LocationIcon from '../../../../assets/buyer-icons/address.svg';
import ArrowRightIcon from '../../../../assets/icons/greydark/caret-right-regular.svg';
import styles from './styles/AddressSectionStyles';

/**
 * Address section component for checkout screen
 */
const AddressSection = ({ deliveryDetails, onUpdateDeliveryDetails }) => {
  // Safely access address with fallbacks
  const address = deliveryDetails?.address || {};
  const street = address.street || 'No address selected';
  const city = address.city || '';
  const state = address.state || '';
  const zipCode = address.zipCode || '';
  
  const addressText = city && state && zipCode
    ? `${street}\n${city}, ${state} ${zipCode}`
    : street;

  return (
    <View style={styles.shipping}>
      {/* Title */}
      <View style={styles.shippingTitle}>
        <Text style={styles.shippingTitleText}>Shipping Address</Text>
      </View>

      {/* Address List */}
      <View style={styles.addressList}>
        <TouchableOpacity
          style={styles.addressContent}
          onPress={onUpdateDeliveryDetails}>
          {/* Icon Circle */}
          <View style={styles.iconCircle}>
            <View style={styles.iconContainer}>
              <LocationIcon width={24} height={24} />
            </View>
          </View>

          {/* Details */}
          <View style={styles.addressDetails}>
            <View style={styles.addressAction}>
              <Text style={styles.addressText}>
                {addressText}
              </Text>

              {/* Action Arrow */}
              <View style={styles.actionContainer}>
                <View style={styles.arrow}>
                  <ArrowRightIcon width={24} height={24} />
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default AddressSection;
