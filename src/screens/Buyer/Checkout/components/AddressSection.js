import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import LocationIcon from '../../../../assets/buyer-icons/address.svg';
import ArrowRightIcon from '../../../../assets/icons/greydark/caret-right-regular.svg';
import styles from './styles/AddressSectionStyles';

/**
 * Address section component for checkout screen
 */
const AddressSection = ({ deliveryDetails, onUpdateDeliveryDetails, disabled = false }) => {
  // Safely access address with fallbacks
  const address = deliveryDetails?.address || {};
  const street = address.street || 'No address selected';
  const city = address.city || '';
  const state = address.state || '';
  const zipCode = address.zipCode || '';
  
  // Build address text with all available components
  let addressText = street;
  if (city) {
    addressText += `\n${city}`;
    if (state) {
      addressText += `, ${state}`;
      if (zipCode) {
        addressText += ` ${zipCode}`;
      }
    } else if (zipCode) {
      addressText += ` ${zipCode}`;
    }
  } else if (state) {
    addressText += `\n${state}`;
    if (zipCode) {
      addressText += ` ${zipCode}`;
    }
  } else if (zipCode) {
    addressText += `\n${zipCode}`;
  }

  return (
    <View style={styles.shipping}>
      {/* Title */}
      <View style={styles.shippingTitle}>
        <Text style={styles.shippingTitleText}>Shipping Address</Text>
        {disabled && (
          <Text style={styles.disabledNote}>Locked to receiver address</Text>
        )}
      </View>

      {/* Address List */}
      <View style={styles.addressList}>
        <TouchableOpacity
          style={[styles.addressContent, disabled && styles.addressContentDisabled]}
          onPress={onUpdateDeliveryDetails}
          disabled={disabled}
          activeOpacity={disabled ? 1 : 0.7}>
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
