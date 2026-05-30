import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import TrayIcon from '../../../../assets/admin-icons/tray-icon.svg';
import { addSortingTrayNumber } from '../../../../components/Api/getAdminLeafTrail';
import { forceUppercaseHubLabel } from '../../../../utils/leafTrailScanNav';
import { isSortedPlant } from '../../../../utils/sortingBoxMetrics';

/**
 * Assign one tray # to all sorted plants in the open receiver box (Packing uses tray next).
 */
const SortingTrayAssign = ({ plants = [], onAssigned, variant = 'inline' }) => {
  const sortedPlants = useMemo(
    () => (plants || []).filter(isSortedPlant),
    [plants],
  );

  const existingTray = useMemo(() => {
    const fromSorted = sortedPlants
      .map((p) => String(p.sortingTrayNumber || '').trim())
      .filter(Boolean);
    if (!fromSorted.length) return '';
    const first = fromSorted[0];
    const allSame = fromSorted.every((t) => t === first);
    return allSame ? first : '';
  }, [sortedPlants]);

  const [trayNumber, setTrayNumber] = useState(forceUppercaseHubLabel(existingTray));
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    setTrayNumber(forceUppercaseHubLabel(existingTray));
  }, [existingTray]);

  const saveTray = async () => {
    const trimmed = forceUppercaseHubLabel(String(trayNumber || '').trim());
    if (!trimmed) {
      Alert.alert('Tray number', 'Enter a tray number to assign.');
      return;
    }
    if (!sortedPlants.length) {
      Alert.alert(
        'Tray number',
        'Scan and sort plants first. Tray # applies to sorted plants only.',
      );
      return;
    }

    try {
      setSaving(true);
      const response = await addSortingTrayNumber({
        orderIds: sortedPlants.map((p) => p.id),
        sortingTrayNumber: trimmed,
      });
      if (response?.success) {
        Alert.alert('Success', `Tray ${trimmed} assigned to ${sortedPlants.length} plant(s).`);
        onAssigned?.();
      } else {
        Alert.alert('Error', response?.message || 'Could not assign tray number.');
      }
    } catch (e) {
      Alert.alert('Error', e?.message || 'Could not assign tray number.');
    } finally {
      setSaving(false);
    }
  };

  const isFooter = variant === 'footer';

  return (
    <View style={[styles.wrap, isFooter && styles.wrapFooter]}>
      <Text style={styles.title}>Tray number</Text>
      <Text style={styles.subtitle}>
        {sortedPlants.length > 0
          ? `Assign to ${sortedPlants.length} sorted plant(s) in this box.`
          : 'Sort plants first (scan QR), then enter tray # here.'}
      </Text>
      <View style={styles.row}>
        <View style={styles.inputWrap}>
          <TrayIcon />
          <TextInput
            placeholder="Tray number"
            placeholderTextColor="#647276"
            style={styles.input}
            value={trayNumber}
            onChangeText={(text) => setTrayNumber(forceUppercaseHubLabel(text))}
            autoCapitalize="characters"
            autoCorrect={false}
            editable={!saving}
          />
        </View>
        <TouchableOpacity
          style={[styles.button, saving && styles.buttonDisabled]}
          onPress={saveTray}
          disabled={saving}>
          {saving ? (
            <ActivityIndicator size="small" color="#FFFFFF" />
          ) : (
            <Text style={styles.buttonText}>{existingTray ? 'Update' : 'Assign'}</Text>
          )}
        </TouchableOpacity>
      </View>
      {existingTray && !sortedPlants.every((p) => p.sortingTrayNumber === existingTray) ? (
        <Text style={styles.hint}>Sorted plants have mixed tray numbers — saving sets one tray for all.</Text>
      ) : null}
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ECEFEF',
  },
  wrapFooter: {
    marginTop: 0,
    paddingTop: 0,
    borderTopWidth: 0,
    marginBottom: 12,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#E3E7E8',
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 13,
    color: '#647276',
    lineHeight: 18,
    marginBottom: 12,
  },
  row: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    backgroundColor: '#FAFBFB',
    gap: 10,
  },
  input: {
    flex: 1,
    fontSize: 16,
    color: '#202325',
  },
  button: {
    backgroundColor: '#539461',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 20,
    justifyContent: 'center',
    alignItems: 'center',
    minWidth: 88,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  hint: {
    marginTop: 8,
    fontSize: 12,
    color: '#E65100',
    fontStyle: 'italic',
  },
});

export default SortingTrayAssign;
