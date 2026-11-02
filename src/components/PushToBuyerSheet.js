import React, {useState} from 'react';
import {Alert} from 'react-native';
import {adminPushListingsToCartApi} from './Api/adminPushListingsToCartApi';
import BuyerPickerSheet, {buyerName} from './BuyerPickerSheet';

/**
 * Pick a buyer and add the given listings to that buyer's cart.
 * Admin can push any listing. A seller can push only their own; the server enforces that.
 */
const PushToBuyerSheet = ({visible, items, onClose, onPushed}) => {
  const [pushing, setPushing] = useState(false);

  const push = async buyer => {
    setPushing(true);
    try {
      const res = await adminPushListingsToCartApi({
        buyerUid: buyer.id,
        items: items.map(item => ({
          plantCode: item.plantCode,
          potSize: item.potSize || undefined,
          quantity: 1,
        })),
      });
      if (!res.success && !(res.added > 0)) {
        Alert.alert('Failed', res.error || 'Could not add to cart');
        return;
      }
      Alert.alert('Done', res.message || `Added ${res.added || 0} listing(s)`);
      onPushed?.();
    } catch (e) {
      Alert.alert('Failed', e?.message || 'Could not add to cart');
    } finally {
      setPushing(false);
    }
  };

  const confirm = buyer => {
    const count = items?.length || 0;
    if (!buyer?.id || !count || pushing) return;
    const name = buyerName(buyer) || buyer.username || 'this buyer';
    Alert.alert('Add to cart', `Push ${count} listing${count > 1 ? 's' : ''} to ${name}?`, [
      {text: 'Cancel', style: 'cancel'},
      {text: 'Add', onPress: () => push(buyer)},
    ]);
  };

  return (
    <BuyerPickerSheet
      visible={visible}
      title="Select customer"
      purpose="cart-push"
      busyText={pushing ? 'Adding to cart…' : ''}
      onSelect={confirm}
      onClose={() => {
        if (!pushing) onClose?.();
      }}
    />
  );
};

export default PushToBuyerSheet;
