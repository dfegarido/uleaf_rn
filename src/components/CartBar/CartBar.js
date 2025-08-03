import React from 'react';
import {View, Text, TouchableOpacity, StyleSheet, Dimensions} from 'react-native';
import CheckBox from '../CheckBox/CheckBox';

const {width: screenWidth} = Dimensions.get('window');

const CartBar = ({
  isSelectAllChecked = false,
  onSelectAllToggle,
  selectedItemsCount = 0,
  totalAmount = 0,
  discountAmount = 0,
  onCheckoutPress,
}) => {
  const formattedTotal = totalAmount.toFixed(2);
  const formattedDiscount = discountAmount.toFixed(2);
  const finalAmount = (totalAmount - discountAmount).toFixed(2);

  return (
    <View style={styles.cartBar}>
      <View style={styles.content}>
        {/* Select + Amount */}
        <View style={styles.selectAmountRow}>
          {/* Checkbox */}
          <View style={styles.checkboxContainer}>
            <CheckBox
              isChecked={isSelectAllChecked}
              onToggle={onSelectAllToggle}
              style={styles.checkbox}
            />
            <Text style={styles.checkboxLabel}>{selectedItemsCount}</Text>
          </View>

          {/* Summary */}
          <View style={styles.summary}>
            {/* Amount */}
            <View style={styles.amountRow}>
              <Text style={styles.amountLabel}>Total amount</Text>
              <Text style={styles.amountValue}>
                ${discountAmount > 0 ? finalAmount : formattedTotal}
              </Text>
              <View style={styles.iconContainer}>
                <Text style={styles.infoIcon}>ⓘ</Text>
              </View>
            </View>

            {/* Discount */}
            {discountAmount > 0 && (
              <View style={styles.discountRow}>
                <Text style={styles.discountLabel}>Discount</Text>
                <Text style={styles.discountValue}>-${formattedDiscount}</Text>
              </View>
            )}
          </View>
        </View>

        {/* Action */}
        <View style={styles.actionContainer}>
          <TouchableOpacity
            style={[
              styles.checkoutButton,
              {opacity: selectedItemsCount > 0 ? 1 : 0.5},
            ]}
            onPress={onCheckoutPress}
            disabled={selectedItemsCount === 0}>
            <View style={styles.buttonContent}>
              <Text style={styles.buttonText}>Checkout ({selectedItemsCount})</Text>
            </View>
          </TouchableOpacity>
        </View>
      </View>

      {/* Home Indicator */}
      <View style={styles.homeIndicator}>
        <View style={styles.gestureBar} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cartBar: {
    position: 'absolute',
    width: screenWidth,
    height: 158,
    left: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    shadowColor: '#141414',
    shadowOffset: {
      width: 0,
      height: 0,
    },
    shadowOpacity: 0.04,
    shadowRadius: 1,
    elevation: 8,
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    zIndex: 1,
  },
  content: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 15,
    paddingTop: 16,
    paddingBottom: 0,
    gap: 12,
    width: screenWidth,
    height: 124,
    flex: 1,
  },
  selectAmountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 12,
    width: screenWidth - 30,
    height: 48,
    flex: 0,
  },
  checkboxContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 12,
    width: 56,
    height: 24,
    flex: 0,
  },
  checkbox: {
    width: 24,
    minWidth: 24,
    height: 24,
    minHeight: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#647276',
    borderRadius: 6,
    flex: 0,
  },
  checkboxLabel: {
    width: 20,
    height: 24,
    minHeight: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
    flex: 0,
    textAlignVertical: 'center',
  },
  summary: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-end',
    padding: 0,
    gap: 4,
    width: 277,
    height: 48,
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: 227,
    height: 24,
    flex: 0,
  },
  amountLabel: {
    width: 126,
    height: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    flex: 0,
  },
  amountValue: {
    width: 69,
    height: 24,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    color: '#202325',
    flex: 0,
  },
  iconContainer: {
    width: 24,
    height: 24,
    flex: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIcon: {
    fontSize: 16,
    color: '#7F8D91',
  },
  discountRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: 105,
    height: 20,
    flex: 0,
  },
  discountLabel: {
    width: 53,
    height: 20,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#E7522F',
    flex: 0,
  },
  discountValue: {
    width: 48,
    height: 20,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#E7522F',
    flex: 0,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: screenWidth - 30,
    height: 48,
    flex: 0,
  },
  checkoutButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: screenWidth - 30,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    flex: 1,
  },
  buttonContent: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    width: 133,
    height: 16,
    flex: 0,
  },
  buttonText: {
    width: 117,
    height: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
    textAlign: 'center',
    flex: 0,
  },
  homeIndicator: {
    width: screenWidth,
    height: 34,
    minHeight: 34,
    backgroundColor: '#FFFFFF',
    flex: 0,
    justifyContent: 'center',
    alignItems: 'center',
  },
  gestureBar: {
    width: 148,
    height: 5,
    backgroundColor: '#202325',
    borderRadius: 100,
    position: 'absolute',
    bottom: 8,
  },
});

export default CartBar;
