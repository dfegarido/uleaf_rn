import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AirplaneIcon from '../../../../assets/admin-icons/airplane.svg';
import CubeIcon from '../../../../assets/admin-icons/cube.svg';
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

const ShippingBoxCard = ({ box, onPress }) => {
  const plantCount = box?.packedPlantsCount ?? 0;
  const receiverInitial = String(box?.name || '?').trim().charAt(0).toUpperCase();
  const hasTracking = Boolean(String(box?.trackingNumber || '').trim());
  const tint = hasTracking ? '#DFF5E6' : '#E8F4FD';

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: tint }]}
      activeOpacity={0.85}
      onPress={onPress}>
      <View style={styles.topRow}>
        {box?.avatar ? (
          <Image source={{ uri: box.avatar }} style={styles.avatar} />
        ) : (
          <View style={styles.avatarFallback}>
            <Text style={styles.avatarInitial}>{receiverInitial}</Text>
          </View>
        )}
        <View style={styles.heading}>
          <Text style={styles.title} numberOfLines={2}>
            {box.name || 'Receiver'}
          </Text>
          {box.username ? (
            <Text style={styles.handle} numberOfLines={1}>
              @{box.username}
            </Text>
          ) : null}
        </View>
      </View>

      <View style={styles.boxBadgeRow}>
        <View style={styles.boxIconWrap}>
          <CubeIcon width={18} height={18} />
        </View>
        <Text style={styles.subtitle} numberOfLines={1}>
          Box {box.boxNumber || '—'} · {plantCount} plant{plantCount === 1 ? '' : 's'}
        </Text>
      </View>

      <View style={styles.specsRow}>
        <View style={styles.specItem}>
          <DimensionIcon width={14} height={14} />
          <Text style={styles.specText} numberOfLines={1}>
            {formatDimensions(box.packingData)}
          </Text>
        </View>
        <View style={styles.specItem}>
          <ScaleIcon width={14} height={14} />
          <Text style={styles.specText} numberOfLines={1}>
            {formatWeight(box.packingData)}
          </Text>
        </View>
      </View>

      <View style={styles.divider} />

      <Text style={styles.cardLine}>
        <Text style={styles.cardLabel}>Tracking </Text>
        <Text style={[styles.cardValue, !hasTracking && styles.cardValueMuted]}>
          {hasTracking ? box.trackingNumber : 'Not added'}
        </Text>
      </Text>

      <View style={styles.flightRow}>
        <AirplaneIcon width={14} height={14} color="#556065" />
        <Text style={styles.flightText} numberOfLines={1}>
          {box.flightDateFormatted || 'Date TBD'}
        </Text>
      </View>

      <Text style={styles.hint}>Tap to open box</Text>
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
    minHeight: 220,
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
  boxBadgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  boxIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#48A7F8',
    justifyContent: 'center',
    alignItems: 'center',
  },
  subtitle: {
    flex: 1,
    fontSize: 13,
    fontWeight: '600',
    color: '#647276',
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
  cardValueMuted: {
    color: '#9AA5A8',
    fontWeight: '600',
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

export default ShippingBoxCard;
