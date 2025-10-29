import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import CaretDownIcon from '../../../../assets/icons/greylight/caret-down-regular.svg';
import { formatCurrencyFull } from '../../../../utils/formatCurrency';
import styles from './styles/CheckoutBarStyles';

/**
 * Fixed checkout bar shown at the bottom of the Checkout screen
 */
const CheckoutBar = ({ total = 0, discount = 0, loading = false, selectedFlightDateIso, onCheckoutPress }) => {
  const isDisabled = loading || !selectedFlightDateIso;

  return (
    <View style={styles.checkoutBar}>
      <View style={styles.checkoutContent}>
        <View style={styles.checkoutSummary}>
          <View style={styles.amountRow}>
            <Text style={styles.amountLabel}>Total</Text>
            <Text style={styles.amountValue}>{formatCurrencyFull(total)}</Text>
            <CaretDownIcon width={24} height={24} style={styles.infoIcon} />
          </View>

          {discount > 0 && (
            <View style={styles.discountRow}>
              <Text style={styles.discountSavings}>You're saving</Text>
              <Text style={styles.discountAmount}>{formatCurrencyFull(discount)}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[styles.placeOrderButton, isDisabled && styles.placeOrderButtonDisabled]}
          onPress={onCheckoutPress}
          disabled={isDisabled}
        >
          <View style={styles.buttonText}>
            {loading ? (
              <View style={styles.buttonSkeleton} />
            ) : (
              <Text 
                style={isDisabled ? styles.buttonLabelDisabled : styles.buttonLabel}
                numberOfLines={1}
              >
                Place Order
              </Text>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CheckoutBar;


