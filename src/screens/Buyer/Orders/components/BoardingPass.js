import React, {useEffect, useRef, useState} from 'react';
import {
  View,
  Text,
  Image,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Easing,
  AccessibilityInfo,
} from 'react-native';
import VenmoLogoIcon from '../../../../assets/buyer-icons/venmo-logo.svg';
import PlaneGrayIcon from '../../../../assets/buyer-icons/plane-gray.svg';
import CaretDownIcon from '../../../../assets/icons/accent/caret-down-regular.svg';
import Loading from '../../../../components/Loading';
import ActionSheet from '../../../../components/ActionSheet/ActionSheet';

export const PASS_COLORS = {
  screen: '#F3F5F4',
  card: '#FFFFFF',
  edge: '#E3E8E6',
  ink: '#202325',
  slate: '#647276',
  leaf: '#539461',
  mist: '#F2F7F3',
  route: '#9DB8A3',
  venmo: '#008CFF',
  danger: '#C2412A',
};

const COUNTRY_NAMES = {PH: 'Philippines', TH: 'Thailand', ID: 'Indonesia'};

// ponytail: buyers are US-only today (Venmo/PayPal US); read the delivery country if that changes.
const DESTINATION = 'US';

const MAX_THUMBS = 3;
// More plants than this and the pass lists only these, with a link to the order detail screen.
const MAX_INLINE_PLANTS = 3;

const PERFORATION_DASHES = 22;
const TEAR_LOOP_MS = 1100;
const FOLD_AWAY_MS = 280;

// Dashed lines are drawn as small views: RN's dashed border only renders reliably on a full border.
const Dashes = ({count, color, style}) => (
  <View style={[styles.dashes, style]}>
    {Array.from({length: count}).map((_, i) => (
      <View key={i} style={[styles.dash, {backgroundColor: color}]} />
    ))}
  </View>
);

/**
 * The perforation between the plants and the stub. While the order is being cancelled a
 * red tear runs along it, left to right, on a loop - the pass is being torn. One looping
 * value drives every dash; each dash lights up at its own point of the loop. With reduce
 * motion on, the line just turns red.
 */
export const Perforation = ({tearing = false, style}) => {
  const tear = useRef(new Animated.Value(0)).current;
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
  }, []);

  useEffect(() => {
    if (!tearing || reduceMotion) {
      return undefined;
    }
    tear.setValue(0);
    const loop = Animated.loop(
      Animated.timing(tear, {
        toValue: 1,
        duration: TEAR_LOOP_MS,
        easing: Easing.linear,
        useNativeDriver: true,
      }),
    );
    loop.start();
    return () => loop.stop();
  }, [tearing, reduceMotion, tear]);

  return (
    <View style={[styles.perforation, style]}>
      <View style={[styles.dashes, styles.perforationLine]}>
        {Array.from({length: PERFORATION_DASHES}).map((_, i) => {
          // The tear crosses the line in the first 60% of the loop, then rests.
          const at = 0.02 + (i / PERFORATION_DASHES) * 0.6;
          const torn = tear.interpolate({
            inputRange: [0, at, at + 0.08, at + 0.3, 1],
            outputRange: [0, 0, 1, 0, 0],
          });
          return (
            <View key={i} style={[styles.dash, {backgroundColor: PASS_COLORS.edge}]}>
              {tearing ? (
                <Animated.View
                  style={[
                    styles.tornDash,
                    reduceMotion
                      ? null
                      : {
                          opacity: torn,
                          transform: [
                            {scaleY: torn.interpolate({inputRange: [0, 1], outputRange: [1, 2.2]})},
                          ],
                        },
                  ]}
                />
              ) : null}
            </View>
          );
        })}
      </View>
      <View style={[styles.notch, styles.notchLeft]} />
      <View style={[styles.notch, styles.notchRight]} />
    </View>
  );
};

/** The route across the top of the pass: origin, plane, destination, and the flight date. */
export const PassRoute = ({originCodes, flightDate}) => (
  <>
    <View style={styles.route}>
      <Text style={styles.routeCode}>{originCodes.join(' ')}</Text>
      <Dashes count={7} color={PASS_COLORS.route} style={styles.routeLine} />
      <PlaneGrayIcon width={20} height={20} style={styles.plane} />
      <Dashes count={7} color={PASS_COLORS.route} style={styles.routeLine} />
      <Text style={styles.routeCode}>{DESTINATION}</Text>
    </View>
    <View style={styles.routeCaptions}>
      <Text style={styles.caption}>
        {originCodes.map(code => COUNTRY_NAMES[code] || code).join(', ')}
      </Text>
      <Text style={styles.caption}>{flightDate ? `Flight ${flightDate}` : 'Flight date TBD'}</Text>
    </View>
  </>
);

/** One plant on the order: photo, name, variegation and size, joiner, and its price. */
export const PlantRow = ({plant}) => (
  <View style={styles.plantRow}>
    <Image source={plant.image} style={styles.plantImage} />
    <View style={styles.plantText}>
      <Text style={styles.plantName} numberOfLines={1}>
        {plant.name}
      </Text>
      <Text style={styles.caption} numberOfLines={1}>
        {plant.detail}
      </Text>
      {plant.joinerUsername ? (
        <Text style={styles.joiner} numberOfLines={1}>
          Joiner @{plant.joinerUsername}
        </Text>
      ) : null}
    </View>
    <Text style={styles.plantPrice}>{plant.price}</Text>
  </View>
);

/** Pay with the saved Venmo account, or Pay now (the payment page). */
export const PayButton = ({totalText, vaulted, venmoUsername, paying, onPress}) => (
  <TouchableOpacity
    style={[styles.payButton, vaulted && styles.venmoButton]}
    onPress={onPress}
    disabled={paying}
    activeOpacity={0.8}
    accessibilityRole="button"
    accessibilityLabel={vaulted ? `Pay ${totalText} with Venmo` : `Pay ${totalText}`}>
    {paying ? (
      <Loading size={28} />
    ) : vaulted ? (
      <>
        <View style={styles.venmoLine}>
          <Text style={styles.payText}>Pay with </Text>
          <VenmoLogoIcon width={51} height={13} color="#FFFFFF" />
        </View>
        {venmoUsername ? <Text style={styles.venmoUsername}>{venmoUsername}</Text> : null}
      </>
    ) : (
      <Text style={styles.payText}>Pay now</Text>
    )}
  </TouchableOpacity>
);

/** Paid in the browser, waiting for the backend to confirm it. */
export const ConfirmingNote = ({totalText}) => (
  <View style={styles.confirming}>
    <Loading size={32} />
    <View style={styles.confirmingText}>
      <Text style={styles.confirmingTitle}>Confirming your {totalText} payment</Text>
      <Text style={styles.confirmingBody}>We'll notify you when it's done.</Text>
    </View>
  </View>
);

/**
 * One Pay to Board order drawn as a boarding pass: the route and flight on top, the plants
 * on board in the middle, and a torn-off stub with the total and the pay action.
 *
 * `status` is 'idle', 'paying' (the request is being made), 'confirming' (paid in the
 * browser, waiting for the backend to confirm), 'cancelling' (the cancel request is in
 * flight) or 'cancelled' (the pass folds away, then `onRemoved` takes it off the list).
 * With more than three plants, the
 * expanded pass lists three and `onSeeAll` opens the order detail screen for the rest.
 */
const BoardingPass = ({
  originCodes,
  flightDate,
  plants,
  total,
  transactionNumber,
  expanded,
  onToggle,
  status,
  vaulted,
  venmoUsername,
  onPay,
  onCancel,
  onRemoved,
  onSeeAll,
}) => {
  const totalText = `$${total.toFixed(2)}`;
  const plantCountText = `${plants.length} ${plants.length === 1 ? 'plant' : 'plants'}`;
  const cancelling = status === 'cancelling';

  // The cancelled pass slides and fades out before it leaves the list. onRemoved is read
  // from a ref so a parent re-render mid-animation doesn't restart it.
  const presence = useRef(new Animated.Value(1)).current;
  const onRemovedRef = useRef(onRemoved);
  onRemovedRef.current = onRemoved;
  useEffect(() => {
    if (status !== 'cancelled') {
      return;
    }
    Animated.timing(presence, {
      toValue: 0,
      duration: FOLD_AWAY_MS,
      easing: Easing.in(Easing.cubic),
      useNativeDriver: true,
    }).start(({finished}) => finished && onRemovedRef.current?.());
  }, [status, presence]);

  return (
    <Animated.View
      style={[
        styles.pass,
        {
          opacity: presence,
          transform: [
            {translateX: presence.interpolate({inputRange: [0, 1], outputRange: [-24, 0]})},
            {rotate: presence.interpolate({inputRange: [0, 1], outputRange: ['-2deg', '0deg']})},
          ],
        },
      ]}>
      <TouchableOpacity
        style={[styles.top, cancelling && styles.dimmed]}
        disabled={cancelling}
        onPress={onToggle}
        activeOpacity={0.8}
        accessibilityRole="button"
        accessibilityLabel={`${plantCountText}, ${expanded ? 'hide' : 'show'} plants`}>
        <PassRoute originCodes={originCodes} flightDate={flightDate} />

        {expanded ? (
          <View style={styles.plantList}>
            {plants.slice(0, MAX_INLINE_PLANTS).map(plant => (
              <PlantRow key={plant.key} plant={plant} />
            ))}
            {plants.length > MAX_INLINE_PLANTS ? (
              <View style={styles.seeAllRow}>
                <Text style={styles.caption}>
                  +{plants.length - MAX_INLINE_PLANTS} more
                </Text>
                <TouchableOpacity onPress={onSeeAll} hitSlop={10} accessibilityRole="button">
                  <Text style={styles.toggleText}>See all {plantCountText}</Text>
                </TouchableOpacity>
              </View>
            ) : (
              <View style={styles.toggleRow}>
                <Text style={styles.toggleText}>Hide</Text>
                <CaretDownIcon width={18} height={18} style={styles.caretUp} />
              </View>
            )}
          </View>
        ) : (
          <View style={styles.collapsedRow}>
            <View style={styles.thumbs}>
              {plants.slice(0, MAX_THUMBS).map((plant, i) => (
                <Image
                  key={plant.key}
                  source={plant.image}
                  style={[styles.thumb, i > 0 && styles.thumbOverlap]}
                />
              ))}
            </View>
            <Text style={styles.plantCount}>{plantCountText}</Text>
            <Text style={styles.toggleText}>Show</Text>
            <CaretDownIcon width={18} height={18} />
          </View>
        )}
      </TouchableOpacity>

      <Perforation tearing={cancelling} />

      <View style={styles.stub}>
        {cancelling ? (
          <View style={[styles.stubRow, styles.cancellingRow]} accessibilityLiveRegion="polite">
            <View style={styles.totalBlock}>
              <Text style={styles.cancellingTitle}>Cancelling order…</Text>
              <Text style={styles.caption}>Taking your plants off the flight</Text>
            </View>
            <Text style={[styles.total, styles.struckTotal]}>{totalText}</Text>
          </View>
        ) : status === 'confirming' ? (
          <ConfirmingNote totalText={totalText} />
        ) : (
          <View style={styles.stubRow}>
            <View style={styles.totalBlock}>
              <Text style={styles.caption}>Total</Text>
              <Text style={styles.total}>{totalText}</Text>
            </View>
            <PayButton
              totalText={totalText}
              vaulted={vaulted}
              venmoUsername={venmoUsername}
              paying={status === 'paying'}
              onPress={onPay}
            />
          </View>
        )}

        <View style={[styles.stubFooter, cancelling && styles.dimmed]}>
          <Text style={styles.caption} numberOfLines={1}>
            Order {transactionNumber}
          </Text>
          {status === 'idle' ? (
            <TouchableOpacity onPress={onCancel} hitSlop={10} accessibilityRole="button">
              <Text style={styles.cancelText}>Cancel order</Text>
            </TouchableOpacity>
          ) : null}
        </View>
      </View>
    </Animated.View>
  );
};

/**
 * The bottom sheet that confirms a pass action (pay or cancel). It says exactly what will
 * happen, so the confirm button can name the action instead of a bare "Yes".
 */
export const PassConfirmSheet = ({
  visible,
  title,
  body,
  confirmLabel,
  confirmColor,
  dismissLabel,
  onConfirm,
  onClose,
}) => (
  <ActionSheet visible={visible} onClose={onClose} heightPercent={350}>
    <View style={styles.sheet}>
      <View style={styles.sheetHandle} />
      <Text style={styles.sheetTitle}>{title}</Text>
      <Text style={styles.sheetBody}>{body}</Text>
      <TouchableOpacity
        style={[styles.sheetConfirm, {backgroundColor: confirmColor}]}
        onPress={onConfirm}
        activeOpacity={0.8}
        accessibilityRole="button">
        <Text style={styles.payText}>{confirmLabel}</Text>
      </TouchableOpacity>
      <TouchableOpacity
        style={styles.sheetDismiss}
        onPress={onClose}
        accessibilityRole="button">
        <Text style={styles.sheetDismissText}>{dismissLabel}</Text>
      </TouchableOpacity>
    </View>
  </ActionSheet>
);

const NOTCH = 18;

const styles = StyleSheet.create({
  pass: {
    backgroundColor: PASS_COLORS.card,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: PASS_COLORS.edge,
    marginHorizontal: 12,
    marginBottom: 12,
    overflow: 'hidden',
  },
  top: {
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 4,
  },
  route: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  routeCode: {
    fontSize: 26,
    fontWeight: '700',
    letterSpacing: -0.5,
    color: PASS_COLORS.ink,
    fontFamily: 'Inter',
  },
  routeLine: {
    flex: 1,
    marginHorizontal: 8,
  },
  plane: {
    transform: [{rotate: '45deg'}],
  },
  routeCaptions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  caption: {
    fontSize: 12,
    color: PASS_COLORS.slate,
    fontFamily: 'Inter',
    fontVariant: ['tabular-nums'],
  },
  dashes: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    overflow: 'hidden',
  },
  dash: {
    width: 5,
    height: 1.5,
    borderRadius: 1,
  },
  tornDash: {
    ...StyleSheet.absoluteFill,
    borderRadius: 1,
    backgroundColor: PASS_COLORS.danger,
  },
  dimmed: {
    opacity: 0.35,
  },
  cancellingTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: PASS_COLORS.danger,
    fontFamily: 'Inter',
  },
  struckTotal: {
    color: '#CDD3D4',
    textDecorationLine: 'line-through',
  },
  collapsedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 12,
    marginBottom: 4,
  },
  thumbs: {
    flexDirection: 'row',
  },
  thumb: {
    width: 38,
    height: 38,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: PASS_COLORS.card,
    backgroundColor: PASS_COLORS.mist,
  },
  thumbOverlap: {
    marginLeft: -10,
  },
  plantCount: {
    flex: 1,
    marginLeft: 10,
    fontSize: 14,
    color: PASS_COLORS.ink,
    fontFamily: 'Inter',
  },
  seeAllRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F0',
  },
  toggleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    paddingTop: 6,
  },
  toggleText: {
    fontSize: 13,
    fontWeight: '600',
    color: PASS_COLORS.leaf,
    fontFamily: 'Inter',
    marginRight: 2,
  },
  caretUp: {
    transform: [{rotate: '180deg'}],
  },
  plantList: {
    marginTop: 10,
  },
  plantRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 9,
    borderTopWidth: 1,
    borderTopColor: '#EEF1F0',
  },
  plantImage: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: PASS_COLORS.mist,
  },
  plantText: {
    flex: 1,
    marginHorizontal: 10,
  },
  plantName: {
    fontSize: 14,
    fontWeight: '600',
    color: PASS_COLORS.ink,
    fontFamily: 'Inter',
  },
  joiner: {
    fontSize: 12,
    color: PASS_COLORS.leaf,
    fontFamily: 'Inter',
    marginTop: 1,
  },
  plantPrice: {
    fontSize: 14,
    fontWeight: '600',
    color: PASS_COLORS.ink,
    fontFamily: 'Inter',
    fontVariant: ['tabular-nums'],
  },
  perforation: {
    height: NOTCH,
    justifyContent: 'center',
  },
  perforationLine: {
    marginHorizontal: 16,
  },
  notch: {
    position: 'absolute',
    top: 0,
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    backgroundColor: PASS_COLORS.screen,
    borderWidth: 1,
    borderColor: PASS_COLORS.edge,
  },
  notchLeft: {
    left: -NOTCH / 2 - 1,
  },
  notchRight: {
    right: -NOTCH / 2 - 1,
  },
  stub: {
    paddingHorizontal: 16,
    paddingTop: 2,
    paddingBottom: 12,
  },
  stubRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  // The same height as the row with the Pay button, so the stub doesn't jump.
  cancellingRow: {
    minHeight: 48,
  },
  totalBlock: {
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
  payButton: {
    minWidth: 128,
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: PASS_COLORS.leaf,
    alignItems: 'center',
    justifyContent: 'center',
  },
  venmoButton: {
    backgroundColor: PASS_COLORS.venmo,
  },
  venmoLine: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  payText: {
    fontSize: 15,
    fontWeight: '700',
    color: '#FFFFFF',
    fontFamily: 'Inter',
  },
  venmoUsername: {
    fontSize: 12,
    color: '#FFFFFF',
    fontFamily: 'Inter',
    marginTop: 2,
  },
  confirming: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: PASS_COLORS.mist,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 10,
  },
  confirmingText: {
    flex: 1,
    marginLeft: 8,
  },
  confirmingTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2F5E3A',
    fontFamily: 'Inter',
  },
  confirmingBody: {
    fontSize: 12,
    color: '#4A6B51',
    fontFamily: 'Inter',
    marginTop: 1,
  },
  stubFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 10,
  },
  sheet: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 10,
  },
  sheetHandle: {
    alignSelf: 'center',
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CDD3D4',
    marginBottom: 18,
  },
  sheetTitle: {
    fontSize: 19,
    fontWeight: '700',
    color: PASS_COLORS.ink,
    fontFamily: 'Inter',
  },
  sheetBody: {
    fontSize: 14,
    lineHeight: 21,
    color: PASS_COLORS.slate,
    fontFamily: 'Inter',
    marginTop: 6,
    marginBottom: 20,
  },
  sheetConfirm: {
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  sheetDismiss: {
    alignItems: 'center',
    paddingVertical: 14,
  },
  sheetDismissText: {
    fontSize: 15,
    fontWeight: '600',
    color: PASS_COLORS.slate,
    fontFamily: 'Inter',
  },
  cancelText: {
    fontSize: 13,
    fontWeight: '600',
    color: PASS_COLORS.danger,
    fontFamily: 'Inter',
  },
});

export default BoardingPass;
