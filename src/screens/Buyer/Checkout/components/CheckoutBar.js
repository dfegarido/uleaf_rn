import React from 'react';
import { View, Text, TouchableOpacity, Alert } from 'react-native';
import CaretDownIcon from '../../../../assets/icons/greylight/caret-down-regular.svg';
import WhiteCaretLeftIcon from '../../../../assets/icons/white/caret-left-regular.svg';
import VenmoLogoIcon from '../../../../assets/buyer-icons/venmo-logo.svg';
import { formatCurrencyFull } from '../../../../utils/formatCurrency';
import styles from './styles/CheckoutBarStyles';

/**
 * Fixed checkout bar shown at the bottom of the Checkout screen
 */
const CheckoutBar = ({ total = 0, discount = 0, loading = false, selectedFlightDateIso, onCheckoutPress, vaultedPaymentId, vaultedPaymentUsername, variant}) => {
  const isBelowMinimum = total < 1;
  const isDisabled = loading || !selectedFlightDateIso || isBelowMinimum;
  // Display total: if less than $1 (including negative), always show $0.00
  const displayTotal = total < 1 ? 0 : total;
  // LIVE bottom sheet styling. Deliberately NOT keyed off `isLive` — the full
  // CheckoutScreen can also be opened with isLive: true (ScreenPlantDetailPurge).
  const isLiveModal = variant === 'liveModal';

  const maskUsername = (username) => {
    if (!username || username.length < 3) {
      return ''; // Don't show for very short or empty usernames
    }
    const firstChar = username[0];
    const secondChar = username[1];
    const lastChar = username.slice(-1);
    const secondToTheLastChar = username.slice(-2, -1);
    // Show first and last char, with up to 8 asterisks in between
    const middle = '*'.repeat(Math.min(username.length - 2, 8));
    return `@${firstChar}${secondChar}${middle}${secondToTheLastChar}${lastChar}`;
  };

  return (
    <View style={styles.checkoutBar}>
      {/* Minimum order warning - only show if flight date is selected */}
      {isBelowMinimum && selectedFlightDateIso && (
        <View style={styles.warningContainer}>
          <Text style={styles.warningText}>
            Sorry, a minimum purchase of $1 is required to process payment. Please add more plants to your order.
          </Text>
        </View>
      )}
      
      <View style={styles.checkoutContent}>
        <View style={styles.checkoutSummary}>
          <View style={styles.amountRow}>
            <Text style={[styles.amountLabel, isLiveModal && styles.liveAmountLabel]}>Total</Text>
            <Text style={[styles.amountValue, isLiveModal && styles.liveAmountValue]}>
              {formatCurrencyFull(displayTotal)}
            </Text>
            {/* Dead affordance on the live sheet — nothing is wired to it, and
                the design has no breakdown sheet. The full checkout page keeps it. */}
            {!isLiveModal && <CaretDownIcon width={24} height={24} style={styles.infoIcon} />}
          </View>

          {discount > 0 && (
            <View style={styles.discountRow}>
              <Text style={styles.discountSavings}>You're saving</Text>
              <Text style={styles.discountAmount}>{formatCurrencyFull(discount)}</Text>
            </View>
          )}
        </View>

        <TouchableOpacity
          style={[
            vaultedPaymentId
              ? [styles.venmoButton, isLiveModal && styles.liveVenmoButton]
              : [styles.placeOrderButton, isLiveModal && styles.livePlaceOrderButton],
            isDisabled && (vaultedPaymentId ? styles.venmoButtonDisabled : styles.placeOrderButtonDisabled)
          ]}
          // onPress={onCheckoutPress}
          onPress={() => {
            Alert.alert('Are you sure?', '', [
                  {
                    text: 'No',
                    onPress: () => {
                      return null;
                    },
                    style: 'cancel'
                  },
                  {
                    text: 'Yes',
                    onPress: () => {
                      onCheckoutPress();
                    },
                  },
                ])
            }}
          disabled={isDisabled}
        >
          <View style={styles.buttonText}>
            {loading ? (
              <View style={styles.buttonSkeleton} />
            ) : vaultedPaymentId ? (
              <View style={styles.venmoButtonContent}>
                <View style={styles.venmoFirstLine}>
                  <Text style={styles.venmoButtonText}>Pay with </Text>
                  <VenmoLogoIcon width={51} height={13} fill={!isDisabled ? '#FFFFFF' : '#008CFF'} />
                </View>
                {vaultedPaymentUsername && (
                  <Text style={styles.venmoUsernameText}>{maskUsername(vaultedPaymentUsername)}</Text>
                )}
              </View>
            ) : (
              <View style={styles.placeOrderLabelRow}>
                <Text
                  style={[isDisabled ? styles.buttonLabelDisabled : styles.buttonLabel, isLiveModal && styles.liveButtonLabel]}
                  numberOfLines={1}>
                  Place Order
                </Text>
                {/* No white right-caret exists in the asset tree; the white
                    left-caret is mirrored instead of adding a duplicate SVG. */}
                {isLiveModal && <WhiteCaretLeftIcon width={16} height={16} style={styles.arrowMirror} />}
              </View>
            )}
          </View>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CheckoutBar;
