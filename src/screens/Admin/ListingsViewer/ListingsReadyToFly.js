import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  TextInput,
  Switch,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import AppImage from '../../../components/AppImage/AppImage';
import { adminListingsReadyToFlyApi } from '../../../components/Api/adminListingsReadyToFlyApi';

const money = (n) => `$${(Number(n) || 0).toFixed(2)}`;

const PAYMENT_METHODS = [
  { id: 'VENMO', label: 'Venmo' },
  { id: 'ZELLE', label: 'Zelle' },
];

/**
 * Admin: check out the listings picked in Listings Viewer for a buyer who already paid by
 * Venmo or Zelle. The order goes straight to Ready to Fly, priced like the buyer checkout.
 */
const ListingsReadyToFly = ({ navigation, route }) => {
  const buyer = route?.params?.buyer || {};
  const [items, setItems] = useState(route?.params?.items || []);
  const [upsNextDay, setUpsNextDay] = useState(true);
  const [codeInput, setCodeInput] = useState('');
  const [discountCode, setDiscountCode] = useState('');
  const [useLeafPoints, setUseLeafPoints] = useState(false);
  const [usePlantCredits, setUsePlantCredits] = useState(false);
  const [useShippingCredits, setUseShippingCredits] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [quote, setQuote] = useState(null);
  const [error, setError] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const seqRef = useRef(0);

  const payload = useCallback(
    (action) => ({
      action,
      buyerUid: buyer.id,
      items,
      upsNextDay,
      discountCode: discountCode || undefined,
      useLeafPoints,
      usePlantCredits,
      useShippingCredits,
    }),
    [buyer.id, items, upsNextDay, discountCode, useLeafPoints, usePlantCredits, useShippingCredits],
  );

  useEffect(() => {
    if (!buyer.id || items.length === 0) return undefined;
    const seq = ++seqRef.current;
    setLoading(true);
    const timer = setTimeout(async () => {
      const res = await adminListingsReadyToFlyApi(payload('preview'));
      if (seq !== seqRef.current) return;
      setLoading(false);
      if (!res.success) {
        setError(res.error || 'Could not price this order');
        setQuote(null);
        return;
      }
      setError(null);
      setQuote(res);
    }, 300);
    return () => clearTimeout(timer);
  }, [buyer.id, items.length, payload]);

  const lineFor = (plantCode) => quote?.lines?.find((l) => l.plantCode === plantCode);

  const setQuantity = (plantCode, quantity) =>
    setItems((prev) => prev.map((i) => (i.plantCode === plantCode ? { ...i, quantity } : i)));

  const removeItem = (plantCode) => setItems((prev) => prev.filter((i) => i.plantCode !== plantCode));

  const toggleUpsNextDay = () => {
    if (quote?.upsNextDayLocked) return;
    if (!upsNextDay) {
      setUpsNextDay(true);
      return;
    }
    Alert.alert('UPS 2nd Day', 'Bye-bye, Live Arrival Guarantee! Switch to 2nd Day Shipping anyway?', [
      { text: 'Keep Next Day', style: 'cancel' },
      { text: 'Switch', style: 'destructive', onPress: () => setUpsNextDay(false) },
    ]);
  };

  const migrate = () => {
    if (!quote || loading || submitting) return;
    if (!paymentMethod) {
      Alert.alert('Payment method', 'Choose Venmo or Zelle.');
      return;
    }
    if (!quote.deliveryDetails) {
      Alert.alert('No address', 'This buyer has no delivery address yet.');
      return;
    }
    const method = PAYMENT_METHODS.find((m) => m.id === paymentMethod)?.label;
    Alert.alert(
      'Migrate to Ready to Fly',
      `${quote.buyer?.name || buyer.name || 'Buyer'} paid ${money(quote.total)} by ${method}.\n` +
        `Flight ${quote.flight?.flightDateFormatted}. The order will be marked paid and the seller notified.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Confirm',
          onPress: async () => {
            setSubmitting(true);
            try {
              const res = await adminListingsReadyToFlyApi({
                ...payload('migrate'),
                paymentMethod,
                expectedTotal: quote.total,
              });
              if (!res.success) {
                if (res.status === 409 && res.lines) setQuote(res);
                Alert.alert('Not migrated', res.error || 'Could not migrate this order');
                return;
              }
              Alert.alert('Ready to Fly', res.message || `${res.transactionNumber} created.`, [
                { text: 'OK', onPress: () => navigation.goBack() },
              ]);
            } finally {
              setSubmitting(false);
            }
          },
        },
      ],
    );
  };

  const credits = quote?.credits?.available || {};
  const applied = quote?.credits?.applied || {};
  const shipping = quote?.shipping || {};

  const creditRow = (label, balance, used, value, onChange) => (
    <View style={styles.creditRow}>
      <View style={styles.flex}>
        <Text style={styles.label}>{label}</Text>
        <Text style={styles.meta}>
          Balance {money(balance)}
          {value && used ? ` · using ${money(used)}` : ''}
        </Text>
      </View>
      <Switch value={value} onValueChange={onChange} disabled={!(balance > 0)} trackColor={{ true: '#539461' }} />
    </View>
  );

  const summaryRow = (label, amount, negative) =>
    amount ? (
      <View style={styles.summaryRow}>
        <Text style={styles.summaryLabel}>{label}</Text>
        <Text style={[styles.summaryValue, negative && styles.negative]}>
          {negative ? '−' : ''}
          {money(amount)}
        </Text>
      </View>
    ) : null;

  const buyerName = quote?.buyer?.name || buyer.name || buyer.id || 'Buyer';
  const buyerEmail = quote?.buyer?.email || buyer.email || '';
  const address = quote?.deliveryDetails?.address;
  const addressLine = address
    ? [address.street, address.city, address.state, address.zipCode].filter(Boolean).join(', ')
    : '';
  const nextDayOn = quote?.upsNextDayLocked ? quote.upsNextDay : upsNextDay;

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Ready to Fly</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <View style={styles.card}>
          <View style={styles.buyerRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{String(buyerName).charAt(0).toUpperCase()}</Text>
            </View>
            <View style={styles.flex}>
              <Text style={styles.buyerName} numberOfLines={1}>{buyerName}</Text>
              {buyerEmail ? <Text style={styles.meta} numberOfLines={1}>{buyerEmail}</Text> : null}
            </View>
          </View>
          {quote && !quote.deliveryDetails ? (
            <Text style={styles.warning}>No delivery address on file.</Text>
          ) : null}
          {addressLine ? <Text style={styles.meta}>{addressLine}</Text> : null}
          {quote?.flight ? (
            <View style={styles.flightBox}>
              <View style={styles.flex}>
                <Text style={styles.flightLabel}>Plant flight</Text>
                <Text style={styles.flightDate}>{quote.flight.flightDateFormatted}</Text>
              </View>
              <View style={[styles.badge, quote.flight.joinsExistingFlight ? styles.badgeBlue : styles.badgeGreen]}>
                <Text style={[styles.badgeText, quote.flight.joinsExistingFlight ? styles.badgeTextBlue : styles.badgeTextGreen]}>
                  {quote.flight.joinsExistingFlight ? 'Same flight' : 'First order'}
                </Text>
              </View>
            </View>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Plants</Text>
        <View style={styles.card}>
          {items.map((item, index) => {
            const line = lineFor(item.plantCode);
            const qty = item.quantity || 1;
            const name = line ? `${line.genus} ${line.species}`.trim() : item.plantCode;
            return (
              <View key={item.plantCode} style={[styles.lineRow, index > 0 && styles.lineDivider]}>
                {line?.image ? (
                  <AppImage source={{ uri: line.image }} style={styles.thumb} resizeWidth={200} />
                ) : (
                  <View style={styles.thumb} />
                )}
                <View style={styles.flex}>
                  <Text style={styles.label} numberOfLines={1}>{name}</Text>
                  <Text style={styles.meta} numberOfLines={1}>
                    {[item.plantCode, line?.listingType, line?.potSize].filter(Boolean).join(' · ')}
                  </Text>
                  {line ? (
                    <Text style={styles.price}>
                      {money(line.unitPrice)}
                      {line.originalPrice > line.unitPrice ? `  was ${money(line.originalPrice)}` : ''}
                    </Text>
                  ) : null}
                  {items.length > 1 ? (
                    <TouchableOpacity onPress={() => removeItem(item.plantCode)} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
                      <Text style={styles.removeText}>Remove</Text>
                    </TouchableOpacity>
                  ) : null}
                </View>
                {line?.quantityEditable ? (
                  <View style={styles.stepper}>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      disabled={qty <= 1}
                      onPress={() => setQuantity(item.plantCode, qty - 1)}>
                      <Text style={styles.stepText}>−</Text>
                    </TouchableOpacity>
                    <Text style={styles.stepQty}>{qty}</Text>
                    <TouchableOpacity
                      style={styles.stepBtn}
                      disabled={qty >= (line.maxQuantity || 1)}
                      onPress={() => setQuantity(item.plantCode, qty + 1)}>
                      <Text style={styles.stepText}>+</Text>
                    </TouchableOpacity>
                  </View>
                ) : (
                  <Text style={styles.qtyFixed}>×1</Text>
                )}
              </View>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Shipping</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <View style={styles.flex}>
              <Text style={styles.label}>{nextDayOn ? 'UPS Next Day' : 'UPS 2nd Day'}</Text>
              <Text style={styles.meta}>
                {quote?.upsNextDayLocked
                  ? "Follows the buyer's earlier order on this flight."
                  : nextDayOn
                    ? 'Live Arrival Guarantee'
                    : 'No Live Arrival Guarantee'}
              </Text>
            </View>
            <Switch
              value={nextDayOn}
              onValueChange={toggleUpsNextDay}
              disabled={!!quote?.upsNextDayLocked}
              trackColor={{ true: '#539461' }}
            />
          </View>
        </View>

        <Text style={styles.sectionTitle}>Discount code</Text>
        <View style={styles.card}>
          <View style={styles.row}>
            <TextInput
              style={styles.input}
              placeholder="Enter code"
              placeholderTextColor="#8B9496"
              autoCapitalize="characters"
              autoCorrect={false}
              value={codeInput}
              onChangeText={setCodeInput}
            />
            {discountCode ? (
              <TouchableOpacity
                style={styles.smallBtn}
                onPress={() => {
                  setDiscountCode('');
                  setCodeInput('');
                }}>
                <Text style={styles.smallBtnText}>Remove</Text>
              </TouchableOpacity>
            ) : (
              <TouchableOpacity
                style={[styles.smallBtn, !codeInput.trim() && styles.smallBtnDisabled]}
                disabled={!codeInput.trim()}
                onPress={() => setDiscountCode(codeInput.trim().toUpperCase())}>
                <Text style={styles.smallBtnText}>Apply</Text>
              </TouchableOpacity>
            )}
          </View>
          {quote?.discount?.error ? <Text style={styles.warning}>{quote.discount.error}</Text> : null}
          {quote?.discount?.code && !quote.discount.error ? (
            <Text style={styles.appliedCode}>
              {quote.discount.code} applied{quote.discount.amount ? ` · −${money(quote.discount.amount)}` : ''}
            </Text>
          ) : null}
        </View>

        <Text style={styles.sectionTitle}>Credits</Text>
        <View style={styles.card}>
          {creditRow('Leaf Points', credits.leafPoints, applied.leafPoints, useLeafPoints, setUseLeafPoints)}
          {creditRow('Plant Credits', credits.plantCredits, applied.plantCredits, usePlantCredits, setUsePlantCredits)}
          {creditRow(
            'Shipping Credits',
            credits.shippingCredits,
            applied.shippingCredits,
            useShippingCredits,
            setUseShippingCredits,
          )}
        </View>

        <Text style={styles.sectionTitle}>Paid via</Text>
        <View style={styles.methodRow}>
          {PAYMENT_METHODS.map((m) => {
            const active = paymentMethod === m.id;
            return (
              <TouchableOpacity
                key={m.id}
                style={[styles.methodChip, active && styles.methodChipActive]}
                onPress={() => setPaymentMethod(m.id)}>
                <Text style={[styles.methodText, active && styles.methodTextActive]}>{m.label}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        <Text style={styles.sectionTitle}>Summary{loading && quote ? ' · updating' : ''}</Text>
        <View style={styles.card}>
          {error ? <Text style={styles.warning}>{error}</Text> : null}
          {loading && !quote ? <ActivityIndicator color="#539461" style={styles.loader} /> : null}
          {quote ? (
            <>
              {summaryRow('Plants', quote.subtotal)}
              {summaryRow(
                nextDayOn ? 'UPS shipping (Next Day)' : 'UPS shipping (2nd Day)',
                (shipping.baseUpsShipping || 0) + (shipping.upsNextDayUpgrade || 0),
              )}
              {summaryRow('Air cargo / import doc fee', shipping.airCargo)}
              {summaryRow('Wholesale air cargo', shipping.wholesaleAirCargo)}
              {summaryRow('Import doc fee refund', shipping.shippingCreditsDiscount, true)}
              {summaryRow('Free shipping', shipping.freeShippingDiscount, true)}
              {summaryRow('Discount code', quote.discount?.error ? 0 : quote.discount?.amount, true)}
              {summaryRow('Leaf Points', applied.leafPoints, true)}
              {summaryRow('Plant Credits', applied.plantCredits, true)}
              {summaryRow('Shipping Credits', applied.shippingCredits, true)}
              <View style={styles.totalRow}>
                <Text style={styles.totalLabel}>Total paid</Text>
                <Text style={styles.totalValue}>{money(quote.total)}</Text>
              </View>
            </>
          ) : null}
        </View>
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity
          style={[styles.confirmBtn, (!quote || loading || submitting || !!error) && styles.confirmDisabled]}
          disabled={!quote || loading || submitting || !!error}
          onPress={migrate}>
          {submitting ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.confirmText}>
              {quote ? `Migrate  ·  ${money(quote.total)}` : 'Migrate to Ready to Fly'}
            </Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#F4F6F6' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8ECEC',
  },
  headerTitle: { flex: 1, textAlign: 'center', fontSize: 17, fontWeight: '700', color: '#202325' },
  headerSpacer: { width: 32 },
  backButton: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  content: { padding: 16, paddingBottom: 28 },
  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    marginLeft: 4,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    color: '#647276',
    textTransform: 'uppercase',
  },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: '#E4E7E9',
  },
  flex: { flex: 1 },
  buyerRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  avatar: {
    width: 42,
    height: 42,
    borderRadius: 21,
    backgroundColor: '#1F6FB2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: { color: '#fff', fontWeight: '700', fontSize: 16 },
  buyerName: { fontSize: 16, fontWeight: '700', color: '#202325' },
  meta: { fontSize: 13, lineHeight: 18, color: '#647276', marginTop: 2 },
  warning: { marginTop: 8, fontSize: 13, color: '#D23B2F' },
  flightBox: {
    marginTop: 12,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F1',
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  flightLabel: { fontSize: 12, fontWeight: '600', color: '#647276' },
  flightDate: { marginTop: 2, fontSize: 16, fontWeight: '700', color: '#202325' },
  badge: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 20 },
  badgeGreen: { backgroundColor: '#E7F6EC' },
  badgeBlue: { backgroundColor: '#E7F1FA' },
  badgeText: { fontSize: 12, fontWeight: '700' },
  badgeTextGreen: { color: '#1E8A4B' },
  badgeTextBlue: { color: '#1F6FB2' },
  lineRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  lineDivider: { marginTop: 12, paddingTop: 12, borderTopWidth: 1, borderTopColor: '#EEF1F1' },
  thumb: { width: 56, height: 56, borderRadius: 10, backgroundColor: '#EEF1F1' },
  label: { fontSize: 15, fontWeight: '600', color: '#202325' },
  price: { marginTop: 2, fontSize: 13, fontWeight: '600', color: '#202325' },
  qtyFixed: { fontSize: 14, fontWeight: '700', color: '#647276' },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    backgroundColor: '#fff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: { fontSize: 16, fontWeight: '700', color: '#202325' },
  stepQty: { fontSize: 15, fontWeight: '700', color: '#202325', minWidth: 18, textAlign: 'center' },
  removeText: { marginTop: 4, fontSize: 12, color: '#D23B2F', fontWeight: '600' },
  row: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  creditRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 8,
  },
  input: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: '#E4E7E9',
    borderRadius: 12,
    paddingHorizontal: 12,
    fontSize: 15,
    color: '#202325',
    backgroundColor: '#F7F8F8',
  },
  smallBtn: {
    height: 44,
    paddingHorizontal: 14,
    borderRadius: 12,
    backgroundColor: '#E7F6EC',
    alignItems: 'center',
    justifyContent: 'center',
  },
  smallBtnDisabled: { opacity: 0.45 },
  smallBtnText: { color: '#1E8A4B', fontWeight: '700' },
  appliedCode: { marginTop: 8, fontSize: 13, fontWeight: '600', color: '#1E8A4B' },
  methodRow: { flexDirection: 'row', gap: 10 },
  methodChip: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 14,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E4E7E9',
    backgroundColor: '#FFFFFF',
  },
  methodChipActive: { borderColor: '#539461', backgroundColor: '#E7F6EC' },
  methodText: { fontSize: 15, fontWeight: '700', color: '#647276' },
  methodTextActive: { color: '#1E8A4B' },
  loader: { marginVertical: 8 },
  summaryRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 3 },
  summaryLabel: { fontSize: 14, color: '#393D40' },
  summaryValue: { fontSize: 14, color: '#202325', fontWeight: '600' },
  negative: { color: '#1E8A4B' },
  totalRow: {
    marginTop: 8,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F1',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalLabel: { fontSize: 15, fontWeight: '700', color: '#202325' },
  totalValue: { fontSize: 22, fontWeight: '700', color: '#202325' },
  footer: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor: '#E8ECEC',
  },
  confirmBtn: { backgroundColor: '#539461', borderRadius: 12, paddingVertical: 15, alignItems: 'center' },
  confirmDisabled: { opacity: 0.4 },
  confirmText: { color: '#fff', fontSize: 16, fontWeight: '700' },
});

export default ListingsReadyToFly;
