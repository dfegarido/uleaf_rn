import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AirplaneIcon from '../../../../assets/admin-icons/airplane.svg';
import BarcodeIcon from '../../../../assets/admin-icons/barcode.svg';
import DimensionIcon from '../../../../assets/admin-icons/dimension.svg';
import ScaleIcon from '../../../../assets/admin-icons/scale.svg';

const formatDimensions = (packingData) => {
  const dims = packingData?.dimensions || {};
  return `${dims.length || 0}x${dims.width || 0}x${dims.height || 0} in`;
};

const formatWeight = (packingData) => {
  const weight = packingData?.weight || {};
  return `${weight.value || 0} ${weight.unit || ''}`.trim();
};

const DeliveredShipmentCard = ({ shipment, onPress }) => {
  const plantCount = shipment?.shippedPlantsCount ?? 0;
  const receiverInitial = String(shipment?.name || '?').trim().charAt(0).toUpperCase();
  const hasUpsTracking = shipment?.hasUpsTracking !== false && Boolean(String(shipment?.trackingNumber || '').trim());
  const boxNumber = String(shipment?.packingData?.boxNumber || '').trim();
  const tint = hasUpsTracking ? '#EDE8FF' : '#F4F0FF';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: tint }]}
      activeOpacity={0.85}
      onPress={onPress}>
      <View style={styles.topRow}>
        {shipment?.avatar ? (
          <Image source={{ uri: shipment.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{receiverInitial}</Text>
          </View>
        )}
        <View style={styles.heading}>
          <Text style={styles.title} numberOfLines={2}>
            {shipment.name || 'Receiver'}
          </Text>
          {shipment.username ? (
            <Text style={styles.handle} numberOfLines={1}>
              @{shipment.username}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.trackingBadgeRow}>
        <View style={styles.trackingIconWrap}>
          <BarcodeIcon width={16} height={16} />
        </View>
        <View style={styles.trackingTextWrap}>
          <Text style={styles.subtitle} numberOfLines={1}>
            {hasUpsTracking ? shipment.trackingNumber : 'No UPS tracking'}
          </Text>
          {!hasUpsTracking && boxNumber ? (
            <Text style={styles.trackingHint} numberOfLines={1}>
              Box {boxNumber}
            </Text>
          ) : null}
        </View>
      </View>

      <Text style={styles.plantLine}>
        {plantCount} plant{plantCount === 1 ? '' : 's'} delivered
      </Text>

      <View style={styles.specsRow}>
        <View style={styles.specItem}>
          <DimensionIcon width={14} height={14} />
          <Text style={styles.specText} numberOfLines={1}>
            {formatDimensions(shipment.packingData)}
          </Text>
        </View>
        <View style={styles.specItem}>
          <ScaleIcon width={14} height={14} />
          <Text style={styles.specText} numberOfLines={1}>
            {formatWeight(shipment.packingData)}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      {shipment.deliveryDate ? (
        <Text style={styles.cardLine}>
          <Text style={styles.cardLabel}>Delivered </Text>
          <Text style={styles.cardValue}>
            {shipment.deliveryDate}
            {shipment.deliveryTime ? ` · ${shipment.deliveryTime}` : ''}
          </Text>
        </Text>
      ) : null}

      <View style={styles.flightRow}>
        <AirplaneIcon width={14} height={14} color="#556065" />
        <Text style={styles.flightText} numberOfLines={1}>
          {shipment.flightDateFormatted || 'Date TBD'}
        </Text>
      </View>

      <Text style={styles.hint}>Tap to open shipment</Text>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flex: 1,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#DFEAE2',
    padding: 12,
    minHeight: 230,
    overflow: 'hidden',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginBottom: 8,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#539461',
  },
  avatarFallback: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#E8F3EB',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitial: {
    fontSize: 18,
    fontWeight: '700',
    color: '#2F8C4F',
  },
  heading: {
    flex: 1,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1F2A23',
  },
  handle: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7F8D91',
  },
  trackingBadgeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    marginBottom: 6,
  },
  trackingIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#6B4EFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 2,
  },
  trackingTextWrap: {
    flex: 1,
    gap: 2,
  },
  subtitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202325',
  },
  trackingHint: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7F8D91',
  },
  plantLine: {
    fontSize: 13,
    fontWeight: '600',
    color: '#647276',
    marginBottom: 8,
  },
  specsRow: {
    gap: 4,
    marginBottom: 4,
  },
  specItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  specText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#647276',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 8,
  },
  cardLine: {
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 6,
  },
  cardLabel: {
    fontWeight: '500',
    color: '#647276',
  },
  cardValue: {
    fontWeight: '700',
    color: '#202325',
  },
  flightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 2,
  },
  flightText: {
    flex: 1,
    fontSize: 12,
    fontWeight: '500',
    color: '#556065',
  },
  hint: {
    marginTop: 10,
    fontSize: 11,
    fontWeight: '600',
    color: '#2F8C4F',
  },
});

export default DeliveredShipmentCard;
