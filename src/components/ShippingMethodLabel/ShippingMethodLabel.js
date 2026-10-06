import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TruckIcon from '../../assets/buyer-icons/truck-gray.svg';

const DEFAULT_SHIPPING_MAIN = 'UPS 2nd Day $50, add-on plant $5';
const DEFAULT_SHIPPING_SUB = 'Single plant – Upgrade to next day UPS is available at checkout';

const ShippingMethodLabel = ({ shippingMethod, iconStyle, variant }) => {
  const mainText = shippingMethod || DEFAULT_SHIPPING_MAIN;
  const isDefault = !shippingMethod;
  // LIVE bottom sheet runs a heavier main line; keyed off an explicit prop so the
  // full checkout page (PlantList / CheckoutScreenLive) is unaffected.
  const isLiveModal = variant === 'liveModal';

  return (
    <View style={styles.container}>
      <TruckIcon width={24} height={24} style={[styles.icon, iconStyle]} />
      <View style={styles.textWrap}>
        <Text style={[styles.mainText, isLiveModal && styles.liveMainText]}>{mainText}</Text>
        {isDefault && (
          <Text style={[styles.subText, isLiveModal && styles.liveSubText]}>
            {DEFAULT_SHIPPING_SUB}
          </Text>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  icon: {
    color: '#6B7280',
    marginTop: 2,
  },
  textWrap: {
    flex: 1,
    gap: 2,
  },
  mainText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  subText: {
    fontSize: 12,
    fontWeight: '400',
    color: '#9CA3AF',
  },
  liveMainText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#111111',
  },
  liveSubText: {
    fontSize: 13,
    fontWeight: '400',
    color: '#6B6B6B',
  },
});

export default ShippingMethodLabel;
