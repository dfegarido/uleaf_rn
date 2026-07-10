import React from 'react';
import { Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import AirplaneIcon from '../../../../assets/admin-icons/airplane.svg';
import TrayIcon from '../../../../assets/admin-icons/tray-icon.svg';
import CheckBox from '../../../../components/CheckBox/CheckBox';
import PackingTraySummary from './PackingTraySummary';

const PackingTrayCard = ({
  tray,
  onPress,
  compact = false,
  useBoxLabel = false,
  selectable = false,
  isSelected = false,
  onToggleSelect,
}) => {
  const metrics = {
    totalCount: tray.totalCount ?? tray.sortedPlantsCount ?? 0,
    packedCount: tray.packedCount ?? 0,
    sortedCount: tray.sortedCount ?? 0,
    boxAssignedCount: tray.boxAssignedCount ?? 0,
    needsBoxCount: tray.needsBoxCount ?? 0,
  };

  const tint = tray.trayColor || (tray.isComplete ? '#DFF5E6' : '#FFF3E0');
  const labelPrefix = useBoxLabel ? 'Box' : 'Tray';
  const openHint = useBoxLabel ? 'Tap to open box' : 'Tap to open tray';

  const handlePress = () => {
    onPress?.();
  };

  if (compact) {
    return (
      <TouchableOpacity
        style={[styles.legacyCard, { borderLeftColor: tint === '#DFF5E6' ? '#2F8C4F' : '#FFB323' }]}
        activeOpacity={0.85}
        onPress={onPress}>
        <View style={styles.legacyTop}>
          <View style={styles.trayBadge}>
            <TrayIcon width={22} height={22} />
          </View>
          <View style={styles.legacyMain}>
            <Text style={styles.trayNumber}>{labelPrefix} {tray.sortingTrayNumber}</Text>
            <Text style={styles.receiverName} numberOfLines={1}>
              {tray.name}
              {tray.username ? (
                <Text style={styles.receiverHandle}> @{tray.username}</Text>
              ) : null}
            </Text>
          </View>
          <Text style={styles.plantTotal}>{metrics.totalCount}</Text>
        </View>
        <PackingTraySummary metrics={metrics} variant="card" />
        <View style={styles.flightRow}>
          <AirplaneIcon width={16} height={16} color="#556065" />
          <Text style={styles.flightText} numberOfLines={1}>
            {tray.flightDate || 'Date TBD'}
          </Text>
        </View>
      </TouchableOpacity>
    );
  }

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { backgroundColor: tint },
        isSelected && styles.cardSelected,
      ]}
      activeOpacity={0.85}
      onPress={handlePress}>
      {selectable ? (
        <TouchableOpacity
          style={styles.checkboxWrap}
          onPress={onToggleSelect}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <CheckBox isChecked={isSelected} onToggle={onToggleSelect} />
        </TouchableOpacity>
      ) : null}
      <View style={styles.trayIconWrap}>
        <TrayIcon width={26} height={26} />
      </View>
      <Text style={styles.trayTitle} numberOfLines={1}>
        {labelPrefix} {tray.sortingTrayNumber}
      </Text>
      <View style={styles.receiverRow}>
        <Image source={{ uri: tray.avatar || '' }} style={styles.avatar} />
        <View style={styles.receiverTextWrap}>
          <Text style={styles.receiverNameGrid} numberOfLines={1}>
            {tray.name}
          </Text>
          {tray.username ? (
            <Text style={styles.receiverHandleGrid} numberOfLines={1}>
              @{tray.username}
            </Text>
          ) : null}
        </View>
      </View>
      <View style={styles.divider} />
      <PackingTraySummary metrics={metrics} variant="card" />
      <View style={styles.flightRow}>
        <AirplaneIcon width={14} height={14} color="#556065" />
        <Text style={styles.flightTextSmall} numberOfLines={1}>
          {tray.flightDate || 'Date TBD'}
        </Text>
      </View>
      <Text style={styles.hint}>
        {tray.isComplete ? 'Ready for shipping' : openHint}
      </Text>
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
    minHeight: 210,
    overflow: 'hidden',
  },
  cardSelected: {
    borderColor: '#539461',
    borderWidth: 2,
  },
  checkboxWrap: {
    position: 'absolute',
    top: 10,
    right: 10,
    zIndex: 2,
  },
  trayIconWrap: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: '#FFB323',
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  trayTitle: {
    fontSize: 17,
    fontWeight: '800',
    color: '#202325',
    marginBottom: 8,
  },
  receiverRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#539461',
    backgroundColor: '#ECEFEF',
  },
  receiverTextWrap: {
    flex: 1,
  },
  receiverNameGrid: {
    fontSize: 14,
    fontWeight: '700',
    color: '#202325',
  },
  receiverHandleGrid: {
    fontSize: 12,
    fontWeight: '500',
    color: '#7F8D91',
  },
  divider: {
    height: 1,
    backgroundColor: 'rgba(0,0,0,0.08)',
    marginVertical: 8,
  },
  flightRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 8,
  },
  flightTextSmall: {
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
  legacyCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 14,
    borderWidth: 1,
    borderColor: '#E8ECEA',
    borderLeftWidth: 4,
    padding: 14,
    marginHorizontal: 12,
    marginBottom: 10,
  },
  legacyTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 10,
  },
  trayBadge: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#FFB323',
    justifyContent: 'center',
    alignItems: 'center',
  },
  legacyMain: {
    flex: 1,
  },
  trayNumber: {
    fontSize: 18,
    fontWeight: '800',
    color: '#202325',
  },
  receiverName: {
    fontSize: 15,
    fontWeight: '600',
    color: '#202325',
    marginTop: 2,
  },
  receiverHandle: {
    fontWeight: '500',
    color: '#7F8D91',
  },
  plantTotal: {
    fontSize: 22,
    fontWeight: '800',
    color: '#202325',
  },
  flightText: {
    flex: 1,
    fontSize: 14,
    fontWeight: '500',
    color: '#556065',
  },
});

export default PackingTrayCard;
