import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import TruckIcon from '../../assets/buyer-icons/truck-gray.svg';
import { formatPrice, getNextDayRates } from '../UpsShippingOptions/UpsShippingOptions';
import {
  LIVE_ARRIVAL_GUARANTEE_LABEL,
  UPS_2ND_DAY_SHIPPING_LABEL,
  UPS_NEXT_DAY_UPGRADE_LABEL,
} from '../../config/shippingConstants';

const DEFAULT_RATES = { cost: 50, addOnCost: 5 };
// Cart passes e.g. "UPS 2nd Day $70, add-on plant $7"; anything else (expired, unavailable) is shown as-is.
const RATES_PATTERN = /\$(\d+(?:\.\d+)?), add-on plant \$(\d+(?:\.\d+)?)/;

const parseRates = (shippingMethod) => {
  if (!shippingMethod) return DEFAULT_RATES;
  const match = String(shippingMethod).match(RATES_PATTERN);
  return match ? { cost: Number(match[1]), addOnCost: Number(match[2]) } : null;
};

const ShippingMethodLabel = ({ shippingMethod, iconStyle, variant }) => {
  // LIVE bottom sheet runs a heavier main line; keyed off an explicit prop so the
  // full checkout page (PlantList / CheckoutScreenLive) is unaffected.
  const isLiveModal = variant === 'liveModal';
  const mainStyle = [styles.mainText, isLiveModal && styles.liveMainText];
  const rates = parseRates(shippingMethod);
  const nextDay = rates && getNextDayRates(rates);

  return (
    <View style={styles.container}>
      <TruckIcon width={24} height={24} style={[styles.icon, iconStyle]} />
      <View style={styles.textWrap}>
        {rates ? (
          <>
            <Text style={mainStyle}>
              <Text style={styles.optionName}>{UPS_2ND_DAY_SHIPPING_LABEL}</Text>{' '}
              <Text style={styles.price}>{formatPrice(rates.cost)}</Text>, add-on plant{' '}
              <Text style={styles.price}>{formatPrice(rates.addOnCost)}</Text> each
            </Text>
            <Text style={mainStyle}>
              <Text style={styles.optionName}>{UPS_NEXT_DAY_UPGRADE_LABEL}</Text>{' '}
              <Text style={styles.price}>{formatPrice(nextDay.cost)}</Text>, add-on plant{' '}
              <Text style={styles.price}>{formatPrice(nextDay.addOnCost)}</Text> each
            </Text>
            <Text style={styles.guarantee}>✓ {LIVE_ARRIVAL_GUARANTEE_LABEL}</Text>
          </>
        ) : (
          <Text style={mainStyle}>{shippingMethod}</Text>
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
  liveMainText: {
    fontSize: 15,
    color: '#111111',
  },
  optionName: {
    fontWeight: '700',
    color: '#202325',
  },
  price: {
    fontWeight: '700',
    color: '#2E7D32',
  },
  guarantee: {
    fontSize: 12,
    fontWeight: '700',
    color: '#2E7D32',
  },
});

export default ShippingMethodLabel;
