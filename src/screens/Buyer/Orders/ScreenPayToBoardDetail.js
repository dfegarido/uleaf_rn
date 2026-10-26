import React, {useState} from 'react';
import {View, Text, ScrollView, StyleSheet, TouchableOpacity} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import BackIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import {emit} from '../../../services/notifications/notificationEvents';
import {
  PASS_COLORS,
  PassRoute,
  PlantRow,
  PayButton,
  ConfirmingNote,
  Perforation,
  PassConfirmSheet,
} from './components/BoardingPass';
import {
  PAY_TO_BOARD_ACTION,
  orderTotalOf,
  flightDateOf,
  originCodesOf,
  plantsByGrower,
  priceBreakdown,
  plantCountText,
  formatUsd,
  passSheetText,
} from './payToBoardOrder';

/**
 * Everything on one Pay to Board order, for an order with more plants than its pass lists:
 * the plants grouped by grower, what the buyer pays line by line, and the pass's stub pinned
 * to the bottom so Pay is always in reach.
 *
 * The order comes in the route params, already loaded by the list - nothing is fetched here.
 * Pay and Cancel are confirmed here, then handed back to the list (PAY_TO_BOARD_ACTION), which
 * owns the payment state and the pass animations, so the buyer sees the result there.
 */
const ScreenPayToBoardDetail = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  const {group, status = 'idle', vaulted, venmoUsername} = useRoute().params;
  const [sheetType, setSheetType] = useState(null);

  const plantCount = (group.plants || []).length;
  const totalText = formatUsd(orderTotalOf(group));
  const growers = plantsByGrower(group);
  const breakdown = priceBreakdown(group);
  const idle = status === 'idle';

  const confirm = () => {
    const type = sheetType;
    setSheetType(null);
    navigation.goBack();
    emit(PAY_TO_BOARD_ACTION, {type, transactionNumber: group.transactionNumber});
  };

  return (
    <View style={styles.container}>
      <View style={[styles.topBar, {paddingTop: insets.top + 8}]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={12}
          accessibilityRole="button"
          accessibilityLabel="Back">
          <BackIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.topBarTitle}>Order details</Text>
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 140 + insets.bottom}}>
        <View style={styles.section}>
          <PassRoute originCodes={originCodesOf(group)} flightDate={flightDateOf(group)} />
          <Text style={styles.summaryLine}>
            {plantCountText(plantCount)} from {growers.length}{' '}
            {growers.length === 1 ? 'grower' : 'growers'}
          </Text>
        </View>

        <View style={[styles.section, styles.plants]}>
          {growers.map(grower => (
            <View key={grower.name}>
              <View style={styles.growerHeader}>
                <Text style={styles.growerName} numberOfLines={1}>
                  {grower.name}
                </Text>
                <Text style={styles.caption}>
                  {plantCountText(grower.plants.length)}, {formatUsd(grower.total)}
                </Text>
              </View>
              {grower.plants.map(plant => (
                <PlantRow key={plant.key} plant={plant} />
              ))}
            </View>
          ))}
        </View>

        <View style={styles.section}>
          <Text style={styles.breakdownTitle}>What you're paying</Text>
          {breakdown.lines.map(line => (
            <View key={line.label} style={styles.breakdownLine}>
              <Text style={[styles.breakdownText, line.amount < 0 && styles.saving]}>
                {line.label}
              </Text>
              <Text style={[styles.breakdownText, line.amount < 0 && styles.saving]}>
                {line.amount < 0 ? `−${formatUsd(-line.amount)}` : formatUsd(line.amount)}
              </Text>
            </View>
          ))}
          <View style={[styles.breakdownLine, styles.breakdownTotal]}>
            <Text style={styles.breakdownTotalText}>Total</Text>
            <Text style={styles.breakdownTotalText}>{totalText}</Text>
          </View>
        </View>

        <View style={styles.footer}>
          <Text style={styles.caption} numberOfLines={1}>
            Order {group.transactionNumber}
          </Text>
          {idle ? (
            <TouchableOpacity
              onPress={() => setSheetType('cancel')}
              hitSlop={10}
              accessibilityRole="button">
              <Text style={styles.cancelText}>Cancel order</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.stub, {paddingBottom: Math.max(insets.bottom, 16)}]}>
        <Perforation style={styles.stubPerforation} />
        {status === 'confirming' ? (
          <ConfirmingNote totalText={totalText} />
        ) : (
          <View style={styles.stubRow}>
            <View style={styles.stubTotal}>
              <Text style={styles.caption}>Total for {plantCountText(plantCount)}</Text>
              <Text style={styles.total}>{totalText}</Text>
            </View>
            <PayButton
              totalText={totalText}
              vaulted={vaulted}
              venmoUsername={venmoUsername}
              paying={!idle}
              onPress={() => setSheetType('pay')}
            />
          </View>
        )}
      </View>

      <PassConfirmSheet
        visible={!!sheetType}
        {...(sheetType ? passSheetText({type: sheetType, group, vaulted, venmoUsername}) : {})}
        confirmColor={
          sheetType === 'cancel'
            ? PASS_COLORS.danger
            : vaulted
              ? PASS_COLORS.venmo
              : PASS_COLORS.leaf
        }
        onConfirm={confirm}
        onClose={() => setSheetType(null)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: PASS_COLORS.screen,
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: PASS_COLORS.card,
    borderBottomWidth: 1,
    borderBottomColor: PASS_COLORS.edge,
  },
  topBarTitle: {
    fontSize: 17,
    fontWeight: '600',
    color: PASS_COLORS.ink,
    fontFamily: 'Inter',
  },
  section: {
    backgroundColor: PASS_COLORS.card,
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: PASS_COLORS.edge,
  },
  plants: {
    paddingTop: 0,
    marginTop: 10,
    borderTopWidth: 1,
    borderTopColor: PASS_COLORS.edge,
  },
  summaryLine: {
    marginTop: 10,
    fontSize: 14,
    color: PASS_COLORS.ink,
    fontFamily: 'Inter',
  },
  growerHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'baseline',
    gap: 12,
    paddingTop: 16,
    paddingBottom: 4,
  },
  growerName: {
    flexShrink: 1,
    fontSize: 14,
    fontWeight: '600',
    color: PASS_COLORS.ink,
    fontFamily: 'Inter',
  },
  caption: {
    fontSize: 12,
    color: PASS_COLORS.slate,
    fontFamily: 'Inter',
    fontVariant: ['tabular-nums'],
  },
  breakdownTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PASS_COLORS.ink,
    fontFamily: 'Inter',
    marginBottom: 6,
  },
  breakdownLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 5,
  },
  breakdownText: {
    fontSize: 14,
    color: PASS_COLORS.ink,
    fontFamily: 'Inter',
    fontVariant: ['tabular-nums'],
  },
  saving: {
    color: '#3B7A4A',
  },
  breakdownTotal: {
    marginTop: 6,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F0',
  },
  breakdownTotalText: {
    fontSize: 15,
    fontWeight: '700',
    color: PASS_COLORS.ink,
    fontFamily: 'Inter',
    fontVariant: ['tabular-nums'],
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 16,
    paddingVertical: 16,
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: PASS_COLORS.danger,
    fontFamily: 'Inter',
  },
  // The pass's stub, torn off and pinned to the bottom of the screen.
  stub: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: PASS_COLORS.card,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  stubPerforation: {
    position: 'absolute',
    top: -9,
    left: 0,
    right: 0,
  },
  stubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  stubTotal: {
    flex: 1,
  },
  total: {
    fontSize: 22,
    fontWeight: '700',
    letterSpacing: -0.3,
    color: PASS_COLORS.ink,
    fontFamily: 'Inter',
    fontVariant: ['tabular-nums'],
  },
});

export default ScreenPayToBoardDetail;
