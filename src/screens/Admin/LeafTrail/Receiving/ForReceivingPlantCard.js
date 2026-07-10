import React, { memo, useRef, useState } from 'react';
import {
  Dimensions,
  Image,
  Modal,
  Platform,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import ImageZoom from 'react-native-image-pan-zoom';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import AirplaneIcon from '../../../../assets/admin-icons/airplane.svg';
import Options from '../../../../assets/admin-icons/options.svg';
import CheckedBoxIcon from '../../../../assets/admin-icons/checked-box.svg';
import CloseIcon from '../../../../assets/icons/white/x-regular.svg';
import CountryFlagIcon from '../../../../components/CountryFlagIcon/CountryFlagIcon';
import {
  formatPlantFlightDateForDisplay,
  formatUsdPrice,
  getDateOrderedDatePart,
} from './receivingPlantFormatters';

const PlantImagePeek = ({ uri }) => {
  const [visible, setVisible] = useState(false);
  const pressInTimeout = useRef(null);
  const isLongPress = useRef(false);
  const insets = useSafeAreaInsets();

  const handlePressIn = () => {
    pressInTimeout.current = setTimeout(() => {
      setVisible(true);
      isLongPress.current = true;
    }, 200);
  };

  const handlePressOut = () => {
    clearTimeout(pressInTimeout.current);
    if (isLongPress.current) {
      setVisible(false);
      isLongPress.current = false;
    }
  };

  return (
    <>
      <TouchableOpacity
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={() => setVisible(true)}
        activeOpacity={0.85}>
        <Image source={{ uri: uri || '' }} style={styles.plantImage} />
      </TouchableOpacity>
      <Modal
        visible={visible}
        transparent
        animationType="fade"
        onRequestClose={() => setVisible(false)}
        presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
        statusBarTranslucent={Platform.OS === 'android'}>
        <View style={styles.modalBackdrop}>
          <TouchableOpacity
            style={[styles.modalClose, { top: Math.max(insets.top, 12) + 8 }]}
            onPress={() => setVisible(false)}>
            <CloseIcon width={24} height={24} fill="#fff" />
          </TouchableOpacity>
          <ImageZoom
            cropWidth={Dimensions.get('window').width}
            cropHeight={Dimensions.get('window').height}
            imageWidth={Dimensions.get('window').width}
            imageHeight={Dimensions.get('window').height}
            minScale={0.5}
            maxScale={3}
            enableSwipeDown
            onSwipeDown={() => setVisible(false)}
            onClick={() => setVisible(false)}>
            <Image
              source={{ uri: uri || '' }}
              style={{
                width: Dimensions.get('window').width,
                height: Dimensions.get('window').height,
              }}
              resizeMode="contain"
            />
          </ImageZoom>
        </View>
      </Modal>
    </>
  );
};

const MetaChip = ({ label, value }) => {
  if (!value) return null;
  return (
    <View style={styles.metaChip}>
      <Text style={styles.metaChipLabel}>{label}</Text>
      <Text style={styles.metaChipValue} numberOfLines={1}>
        {value}
      </Text>
    </View>
  );
};

const ForReceivingPlantCard = ({
  item,
  openTagAs,
  showCheckbox = false,
  isSelected,
  selectionStore,
  compact = false,
  statusPillLabel = 'For Receiving',
  statusPillVariant = 'forReceiving',
}) => {
  const flightLabel = formatPlantFlightDateForDisplay(item.flightDate) || item.flightDate || '—';
  const dateOrdered = getDateOrderedDatePart(item);
  const garden = item.gardenOrCompanyName || item.gardenName || '';
  const buyer = item.buyerName || '';
  const txn = item.transactionNumber || item.trxNumber || '';
  const usd = formatUsdPrice(item.usdPrice);
  const qty = item.quantity ?? item.orderQty ?? 1;
  const traits = [item.variegation, item.size].filter(Boolean).join(' · ');

  const openTagMenu = () => {
    openTagAs(null, item.id);
  };

  return (
    <View style={styles.card}>
      <View style={styles.topRow}>
        <View
          style={[
            styles.statusPill,
            statusPillVariant === 'scanned' && styles.statusPillScanned,
            statusPillVariant === 'unscanned' && styles.statusPillUnscanned,
            statusPillVariant === 'missing' && styles.statusPillMissing,
            statusPillVariant === 'damaged' && styles.statusPillDamaged,
            statusPillVariant === 'needsToStay' && styles.statusPillNeedsToStay,
            statusPillVariant === 'sorted' && styles.statusPillSorted,
            statusPillVariant === 'inventoryReceived' && styles.statusPillInventoryReceived,
          ]}>
          <Text
            style={[
              styles.statusPillText,
              statusPillVariant === 'scanned' && styles.statusPillTextScanned,
              statusPillVariant === 'unscanned' && styles.statusPillTextUnscanned,
              statusPillVariant === 'missing' && styles.statusPillTextMissing,
              statusPillVariant === 'damaged' && styles.statusPillTextDamaged,
              statusPillVariant === 'needsToStay' && styles.statusPillTextNeedsToStay,
              statusPillVariant === 'sorted' && styles.statusPillTextSorted,
              statusPillVariant === 'inventoryReceived' && styles.statusPillTextInventoryReceived,
            ]}>
            {statusPillLabel}
          </Text>
        </View>
        <Text style={styles.qtyBadge}>{qty}x</Text>
      </View>

      <View style={styles.scheduleRow}>
        <AirplaneIcon width={16} height={16} color="#539461" />
        <Text style={styles.scheduleText} numberOfLines={1}>
          Flight <Text style={styles.scheduleStrong}>{flightLabel}</Text>
        </Text>
        {dateOrdered ? (
          <>
            <Text style={styles.scheduleDot}>·</Text>
            <Text style={styles.scheduleText} numberOfLines={1}>
              Ordered <Text style={styles.scheduleStrong}>{dateOrdered}</Text>
            </Text>
          </>
        ) : null}
      </View>

      {!compact && (txn || garden || buyer || usd) ? (
        <View style={styles.metaRow}>
          <MetaChip label="Txn" value={txn} />
          <MetaChip label="Garden" value={garden} />
          <MetaChip label="Buyer" value={buyer} />
          {usd ? (
            <View style={styles.priceChip}>
              <Text style={styles.priceText}>{usd}</Text>
            </View>
          ) : null}
        </View>
      ) : null}

      <View style={styles.bodyRow}>
        <View style={styles.imageWrap}>
          <PlantImagePeek uri={item.plantImage} />
          {showCheckbox ? (
            <TouchableOpacity
              style={styles.imageCheckbox}
              onPress={() => selectionStore?.toggle(item.id)}
              hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}
              activeOpacity={0.85}>
              {isSelected ? (
                <CheckedBoxIcon width={24} height={24} />
              ) : (
                <View style={styles.uncheckedBox} />
              )}
            </TouchableOpacity>
          ) : null}
        </View>
        <View style={styles.bodyContent}>
          <Text style={styles.plantTitle} numberOfLines={2}>
            {item.genus} {item.species}
          </Text>
          {traits ? (
            <Text style={styles.plantTraits} numberOfLines={1}>
              {traits}
            </Text>
          ) : null}
          {compact ? (
            <View style={styles.compactMeta}>
              {txn ? <Text style={styles.compactMetaText}>#{txn}</Text> : null}
              {garden ? <Text style={styles.compactMetaText}>{garden}</Text> : null}
            </View>
          ) : null}
          <View style={styles.footerRow}>
            <Text style={styles.plantCode} numberOfLines={1}>
              {item.plantCode}
            </Text>
            <View style={styles.footerRight}>
              {item.country ? (
                <View style={styles.countryWrap}>
                  <Text style={styles.countryCode}>{item.country}</Text>
                  <CountryFlagIcon code={item.country} width={22} height={14} />
                </View>
              ) : null}
              <TouchableOpacity onPress={openTagMenu} hitSlop={8}>
                <Options width={22} height={22} />
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </View>
    </View>
  );
};

function plantCardPropsAreEqual(prev, next) {
  return (
    prev.item?.id === next.item?.id &&
    prev.isSelected === next.isSelected &&
    prev.showCheckbox === next.showCheckbox &&
    prev.compact === next.compact &&
    prev.statusPillLabel === next.statusPillLabel &&
    prev.statusPillVariant === next.statusPillVariant
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E3E7E8',
    padding: 12,
    gap: 10,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  statusPill: {
    backgroundColor: '#FFF4E5',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  statusPillText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#B86A00',
    letterSpacing: 0.2,
  },
  statusPillScanned: {
    backgroundColor: '#EAF8EE',
  },
  statusPillUnscanned: {
    backgroundColor: '#FDECEA',
  },
  statusPillTextScanned: {
    color: '#1F7A45',
  },
  statusPillTextUnscanned: {
    color: '#B2422E',
  },
  statusPillMissing: {
    backgroundColor: '#FDECEA',
  },
  statusPillDamaged: {
    backgroundColor: '#FDECEA',
  },
  statusPillNeedsToStay: {
    backgroundColor: '#FFF4E5',
  },
  statusPillSorted: {
    backgroundColor: '#E8F0FE',
  },
  statusPillInventoryReceived: {
    backgroundColor: '#EAF8EE',
  },
  statusPillTextMissing: {
    color: '#B2422E',
  },
  statusPillTextDamaged: {
    color: '#B2422E',
  },
  statusPillTextNeedsToStay: {
    color: '#B7791F',
  },
  statusPillTextSorted: {
    color: '#2B5DBF',
  },
  statusPillTextInventoryReceived: {
    color: '#1F7A45',
  },
  qtyBadge: {
    fontSize: 15,
    fontWeight: '700',
    color: '#202325',
  },
  scheduleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 4,
  },
  scheduleText: {
    fontSize: 13,
    color: '#647276',
    flexShrink: 1,
  },
  scheduleStrong: {
    fontWeight: '700',
    color: '#393D40',
  },
  scheduleDot: {
    color: '#CDD3D4',
    fontSize: 13,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    alignItems: 'center',
  },
  metaChip: {
    maxWidth: '48%',
    backgroundColor: '#F5F6F6',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 5,
  },
  metaChipLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: '#7F8D91',
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  metaChipValue: {
    fontSize: 13,
    fontWeight: '600',
    color: '#202325',
    marginTop: 1,
  },
  priceChip: {
    marginLeft: 'auto',
    backgroundColor: '#EFF9F0',
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  priceText: {
    fontSize: 14,
    fontWeight: '700',
    color: '#1B7A43',
  },
  bodyRow: {
    flexDirection: 'row',
    gap: 12,
  },
  imageWrap: {
    position: 'relative',
    width: 80,
    height: 104,
  },
  imageCheckbox: {
    position: 'absolute',
    top: 4,
    left: 4,
    zIndex: 2,
  },
  plantImage: {
    width: 80,
    height: 104,
    borderRadius: 8,
    backgroundColor: '#EEF0F0',
  },
  bodyContent: {
    flex: 1,
    minWidth: 0,
    justifyContent: 'space-between',
    minHeight: 104,
  },
  plantTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#202325',
    lineHeight: 22,
  },
  plantTraits: {
    fontSize: 14,
    color: '#647276',
    marginTop: 2,
  },
  compactMeta: {
    marginTop: 4,
    gap: 2,
  },
  compactMetaText: {
    fontSize: 12,
    color: '#556065',
  },
  footerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 8,
  },
  plantCode: {
    flex: 1,
    fontSize: 13,
    fontWeight: '500',
    color: '#647276',
    fontVariant: ['tabular-nums'],
  },
  footerRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  countryWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countryCode: {
    fontSize: 13,
    fontWeight: '600',
    color: '#556065',
  },
  uncheckedBox: {
    width: 24,
    height: 24,
    borderWidth: 2,
    borderColor: '#CDD3D4',
    borderRadius: 6,
    backgroundColor: '#FFFFFF',
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.9)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalClose: {
    position: 'absolute',
    right: 20,
    zIndex: 10,
    padding: 10,
    backgroundColor: 'rgba(0,0,0,0.5)',
    borderRadius: 20,
  },
});

export default memo(ForReceivingPlantCard, plantCardPropsAreEqual);
