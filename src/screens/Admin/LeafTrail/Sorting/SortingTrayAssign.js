import React, { useEffect, useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Keyboard,
  Modal,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import TrayIcon from '../../../../assets/admin-icons/tray-icon.svg';
import { addSortingTrayNumber } from '../../../../components/Api/getAdminLeafTrail';
import { forceUppercaseHubLabel } from '../../../../utils/leafTrailScanNav';
import { isSortedPlant } from '../../../../utils/sortingBoxMetrics';

/** Shared tray label when all sorted plants use the same tray #. */
export function getSharedSortingTrayNumber(plants = []) {
  const sortedPlants = (plants || []).filter(isSortedPlant);
  const fromSorted = sortedPlants
    .map((p) => String(p.sortingTrayNumber || '').trim())
    .filter(Boolean);
  if (!fromSorted.length) return '';
  const first = fromSorted[0];
  return fromSorted.every((t) => t === first) ? first : '';
}

/**
 * Assign one tray # to all sorted plants in the open receiver box (Packing uses tray next).
 */
const SortingTrayAssign = ({
  plants = [],
  defaultTrayNumber,
  onAssigned,
  onClose,
  variant = 'inline',
  readOnly = false,
}) => {
  const sortedPlants = useMemo(
    () => (plants || []).filter(isSortedPlant),
    [plants],
  );

  const existingTray = useMemo(
    () => getSharedSortingTrayNumber(plants) || (defaultTrayNumber ? String(defaultTrayNumber).trim() : ''),
    [plants, defaultTrayNumber],
  );

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

  const isSheet = variant === 'sheet';

  const displayTray = trayNumber || '—';

  return (
    <View style={[styles.wrap, isSheet && styles.wrapSheet]}>
      <Text style={styles.title}>Tray number</Text>
      <Text style={styles.subtitle}>
        {readOnly
          ? 'Tray number for this receiver box.'
          : sortedPlants.length > 0
            ? `Assign to ${sortedPlants.length} sorted plant(s) in this box.`
            : 'Sort plants first (scan QR), then enter tray # here.'}
      </Text>
      {readOnly ? (
        <View style={styles.readOnlyField}>
          <TrayIcon width={24} height={24} />
          <Text style={styles.readOnlyValue} numberOfLines={1}>
            {displayTray}
          </Text>
        </View>
      ) : (
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
              returnKeyType="done"
              blurOnSubmit
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
      )}
      {!readOnly && existingTray && !sortedPlants.every((p) => p.sortingTrayNumber === existingTray) ? (
        <Text style={styles.hint}>Sorted plants have mixed tray numbers — saving sets one tray for all.</Text>
      ) : null}
      {readOnly ? (
        <TouchableOpacity
          style={styles.closeButton}
          onPress={onClose}
          accessibilityRole="button"
          accessibilityLabel="Close tray number">
          <Text style={styles.closeButtonText}>Close</Text>
        </TouchableOpacity>
      ) : null}
    </View>
  );
};

/** Bottom sheet — opened from the tray icon so the plant list stays visible. */
export const SortingTrayAssignSheet = ({
  visible,
  onClose,
  plants = [],
  defaultTrayNumber,
  onAssigned,
  readOnly = false,
  /** When true, render as absolute overlay (no nested Modal — required on Android). */
  embedded = false,
}) => {
  const insets = useSafeAreaInsets();
  const [keyboardOffset, setKeyboardOffset] = useState(0);

  useEffect(() => {
    if (!visible) {
      setKeyboardOffset(0);
      return undefined;
    }

    const showEvent = Platform.OS === 'ios' ? 'keyboardWillShow' : 'keyboardDidShow';
    const hideEvent = Platform.OS === 'ios' ? 'keyboardWillHide' : 'keyboardDidHide';

    const onShow = (event) => {
      setKeyboardOffset(event?.endCoordinates?.height || 0);
    };
    const onHide = () => setKeyboardOffset(0);

    const showSub = Keyboard.addListener(showEvent, onShow);
    const hideSub = Keyboard.addListener(hideEvent, onHide);

    return () => {
      showSub.remove();
      hideSub.remove();
    };
  }, [visible]);

  const dismissSheet = () => {
    Keyboard.dismiss();
    onClose?.();
  };

  if (!visible) {
    return null;
  }

  const panelBottomPadding = Math.max(insets.bottom, 20);
  const panelStyle = [
    sheetStyles.panel,
    {
      paddingBottom: panelBottomPadding,
      marginBottom: readOnly ? 0 : keyboardOffset,
    },
  ];

  const trayContent = (
    <SortingTrayAssign
      plants={plants}
      defaultTrayNumber={defaultTrayNumber}
      variant="sheet"
      readOnly={readOnly}
      onClose={dismissSheet}
      onAssigned={() => {
        onAssigned?.();
        dismissSheet();
      }}
    />
  );

  // Android: embedded overlay avoids nested Modal bugs inside parent Modal.
  if (embedded) {
    return (
      <View style={sheetStyles.embeddedRoot}>
        <Pressable
          style={sheetStyles.backdrop}
          onPress={dismissSheet}
          accessibilityRole="button"
          accessibilityLabel="Close tray assignment"
        />
        <View style={panelStyle}>
          <View style={sheetStyles.handle} />
          {trayContent}
        </View>
      </View>
    );
  }

  return (
    <Modal
      transparent
      visible={visible}
      animationType={Platform.OS === 'ios' ? 'slide' : 'fade'}
      onRequestClose={dismissSheet}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      statusBarTranslucent={Platform.OS === 'android'}>
      <View style={sheetStyles.modalRoot}>
        <Pressable
          style={sheetStyles.backdrop}
          onPress={dismissSheet}
          accessibilityRole="button"
          accessibilityLabel="Close tray assignment"
        />
        <View style={panelStyle}>
          <View style={sheetStyles.handle} />
          {trayContent}
        </View>
      </View>
    </Modal>
  );
};

const sheetStyles = StyleSheet.create({
  embeddedRoot: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'flex-end',
    zIndex: 110,
    elevation: 110,
  },
  modalRoot: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  backdrop: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  panel: {
    width: '100%',
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    paddingHorizontal: 20,
    paddingTop: 12,
    ...Platform.select({
      ios: {
        shadowColor: '#000',
        shadowOffset: { width: 0, height: -4 },
        shadowOpacity: 0.12,
        shadowRadius: 12,
      },
      android: { elevation: 16 },
    }),
  },
  handle: {
    alignSelf: 'center',
    width: 40,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#CDD3D4',
    marginBottom: 12,
  },
});

const styles = StyleSheet.create({
  wrap: {
    marginTop: 4,
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#ECEFEF',
  },
  wrapSheet: {
    marginTop: 0,
    paddingTop: 0,
    paddingBottom: 8,
    borderTopWidth: 0,
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
  readOnlyField: {
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 12,
    minHeight: 48,
    backgroundColor: '#F4F6F7',
    gap: 10,
  },
  readOnlyValue: {
    flex: 1,
    flexShrink: 1,
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
  },
  closeButton: {
    marginTop: 16,
    backgroundColor: '#539461',
    borderRadius: 12,
    minHeight: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
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
