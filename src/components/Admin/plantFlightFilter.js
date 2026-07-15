import React, { useState, useEffect, useMemo } from 'react';
import {
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
  Platform,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import CloseIcon from '../../assets/admin-icons/x.svg';
import CheckIcon from '../../assets/admin-icons/check.svg';

// Format date from ISO (YYYY-MM-DD) to readable format (Month DD, YYYY)
const formatFlightDate = (isoDate) => {
  if (!isoDate) return '';
  try {
    const date = new Date(isoDate + 'T00:00:00'); // Add time to avoid timezone issues
    if (isNaN(date.getTime())) return isoDate;
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric',
    });
  } catch (e) {
    return isoDate;
  }
};

// Convert date to ISO format (YYYY-MM-DD)
const toISODateString = (date) => {
  if (!date) return '';
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

/**
 * getAdminFilters returns flightDates as MMM-DD-YYYY (moment); calendar uses YYYY-MM-DD.
 * Without normalization every day stays disabled and looks "unclickable".
 */
export const parseAdminFlightDateTokenToIso = (token) => {
  if (token == null || token === '') return null;

  if (typeof token === 'object') {
    let dateObj = null;
    if (typeof token.toDate === 'function') {
      dateObj = token.toDate();
    } else {
      const sec = token.seconds ?? token._seconds;
      if (typeof sec === 'number') {
        dateObj = new Date(sec * 1000);
      }
    }
    if (dateObj && !Number.isNaN(dateObj.getTime())) {
      const y = dateObj.getUTCFullYear();
      const mo = dateObj.getUTCMonth() + 1;
      const da = dateObj.getUTCDate();
      return `${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`;
    }
    return null;
  }

  const s = typeof token === 'string' ? token.trim() : String(token).trim();
  if (!s) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
  if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);

  const monthMap = {
    jan: 1, january: 1, feb: 2, february: 2, mar: 3, march: 3, apr: 4, april: 4,
    may: 5, jun: 6, june: 6, jul: 7, july: 7, aug: 8, august: 8,
    sep: 9, sept: 9, september: 9, oct: 10, october: 10, nov: 11, november: 11,
    dec: 12, december: 12,
  };
  const resolveMonthNum = (monthToken) => {
    const key = String(monthToken || '').trim().toLowerCase();
    return monthMap[key] ?? monthMap[key.slice(0, 3)] ?? monthMap[key.slice(0, 4)];
  };

  const mdyComma = s.match(/^([A-Za-z]{3,9})\s+(\d{1,2}),?\s*(\d{4})$/);
  if (mdyComma) {
    const monthNum = resolveMonthNum(mdyComma[1]);
    if (monthNum) {
      const day = parseInt(mdyComma[2], 10);
      const year = parseInt(mdyComma[3], 10);
      if (year && day) {
        return `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
      }
    }
  }

  const mmm = s.match(/^([A-Za-z]{3,9})-(\d{1,2})-(\d{4})$/);
  if (mmm) {
    const monthNum = resolveMonthNum(mmm[1]);
    if (!monthNum) return null;
    const day = parseInt(mmm[2], 10);
    const year = parseInt(mmm[3], 10);
    if (!year || !day) return null;
    return `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }

  const mmmShortYear = s.match(/^([A-Za-z]{3,9})-(\d{1,2})$/);
  if (mmmShortYear) {
    const monthNum = resolveMonthNum(mmmShortYear[1]);
    if (!monthNum) return null;
    const day = parseInt(mmmShortYear[2], 10);
    const year = new Date().getFullYear();
    if (!day) return null;
    return `${year}-${String(monthNum).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
  }
  const d = new Date(s);
  if (!isNaN(d.getTime())) return toISODateString(d);
  return null;
};

/** YYYY-MM-DD → MMM-dd-yyyy (matches getAdminFilters flightDates tokens). */
export const formatIsoToAdminFlightDateToken = (iso) => {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  if (!m || m < 1 || m > 12) return null;
  return `${monthNames[m - 1]}-${d}-${y}`;
};

/**
 * Merge flight dates from loaded list items into admin filter options.
 * Packing/Sorting trays often have flightDate while getAdminFilters may return none for narrow statuses.
 */
export const mergeFlightDatesIntoAdminFilters = (
  adminFilters,
  items = [],
  pickFlightTokens = (item) => [
    item?.flightDateIso,
    ...(Array.isArray(item?.flightDateIsos) ? item.flightDateIsos : []),
    item?.flightDate,
    item?.flightDateFormatted,
  ],
) => {
  const baseFilters = adminFilters || {};

  const isoSet = new Set();
  const addToken = (token) => {
    const iso = parseAdminFlightDateTokenToIso(token);
    if (iso) isoSet.add(iso);
  };

  (baseFilters.flightDates || []).forEach(addToken);
  (baseFilters.flightDateIsos || []).forEach((iso) => {
    if (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
      isoSet.add(iso);
    }
  });

  (items || []).forEach((item) => {
    const tokens = pickFlightTokens(item);
    (Array.isArray(tokens) ? tokens : [tokens]).forEach(addToken);
  });

  const mergedFlightDateIsos = [...isoSet].sort((a, b) => b.localeCompare(a));
  const mergedFlightDates = mergedFlightDateIsos
    .map((iso) => formatIsoToAdminFlightDateToken(iso))
    .filter(Boolean);

  return {
    ...baseFilters,
    flightDateIsos: mergedFlightDateIsos,
    flightDates: mergedFlightDates.length
      ? mergedFlightDates
      : (baseFilters.flightDates || []),
  };
};

/** Merge seller filter options (e.g. packing API sellers + getAdminFilters). */
export const mergeSellerFilterLists = (base = [], extra = []) => {
  const map = new Map();
  [...(base || []), ...(extra || [])].forEach((seller) => {
    if (seller?.id) map.set(seller.id, seller);
  });
  return [...map.values()].sort((a, b) => (a.name || '').localeCompare(b.name || ''));
};

/** Merge garden name filter options from list API + getAdminFilters. */
export const mergeGardenFilterLists = (base = [], extra = []) => {
  const names = new Set();
  [...(base || []), ...(extra || [])].forEach((garden) => {
    const name =
      typeof garden === 'string'
        ? garden.trim()
        : String(garden?.name || garden?.garden || '').trim();
    if (name && name !== 'N/A') names.add(name);
  });
  return [...names].sort((a, b) => a.localeCompare(b));
};

const CheckboxRow = ({ label, selected, onPress }) => (
  <TouchableOpacity
    style={[styles.optionRow, selected && styles.optionRowSelected]}
    onPress={onPress}
    activeOpacity={0.7}
    accessibilityRole="checkbox"
    accessibilityState={{ checked: !!selected }}>
    <Text style={[styles.optionLabel, selected && styles.optionLabelSelected]} numberOfLines={1}>
      {label}
    </Text>
    <View style={selected ? styles.checkboxSelected : styles.checkbox}>
      {selected ? <CheckIcon width={16} height={16} fill="#FFFFFF" /> : null}
    </View>
  </TouchableOpacity>
);

const PlantFlightFilter = ({
  isVisible,
  onClose,
  onSelectFlight,
  onReset,
  flightDates = [],
  availableFlightDateIsos = [],
  selectedValues = [],
}) => {
  const insets = useSafeAreaInsets();
  const [draftSelection, setDraftSelection] = useState([]);

  const memoizedSelectedValues = useMemo(() => {
    return Array.isArray(selectedValues)
      ? selectedValues.filter((v) => typeof v === 'string' && v.trim().length > 0)
      : [];
  }, [Array.isArray(selectedValues) ? selectedValues.join(',') : '']);

  const availableIsoList = useMemo(() => {
    const set = new Set();
    const isoList = Array.isArray(availableFlightDateIsos) ? availableFlightDateIsos : [];
    isoList.forEach((iso) => {
      if (typeof iso === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(iso)) {
        set.add(iso);
      }
    });
    if (set.size === 0) {
      const list = Array.isArray(flightDates) ? flightDates : [];
      list.forEach((entry) => {
        const iso = parseAdminFlightDateTokenToIso(entry);
        if (iso) set.add(iso);
      });
    }
    // Ascending chronological order for the checklist
    return [...set].sort((a, b) => a.localeCompare(b));
  }, [
    Array.isArray(availableFlightDateIsos) ? availableFlightDateIsos.join('|') : '',
    Array.isArray(flightDates) ? flightDates.join('|') : '',
  ]);

  useEffect(() => {
    if (isVisible) {
      const normalizedSelection = memoizedSelectedValues
        .map((v) => parseAdminFlightDateTokenToIso(v))
        .filter(Boolean)
        .filter((iso) => availableIsoList.includes(iso));
      setDraftSelection(normalizedSelection);
    }
  }, [isVisible, memoizedSelectedValues, availableIsoList.join('|')]);

  const allSelected =
    availableIsoList.length > 0 &&
    availableIsoList.every((iso) => draftSelection.includes(iso));

  const toggleDate = (iso) => {
    setDraftSelection((prev) => {
      if (prev.includes(iso)) return prev.filter((d) => d !== iso);
      return [...prev, iso];
    });
  };

  const toggleSelectAll = () => {
    if (allSelected) {
      setDraftSelection([]);
    } else {
      setDraftSelection([...availableIsoList]);
    }
  };

  const handleView = () => {
    if (onSelectFlight && typeof onSelectFlight === 'function') {
      const safeValues = draftSelection.filter(
        (v) => typeof v === 'string' && v.trim().length > 0,
      );
      onSelectFlight(safeValues);
    }
    onClose();
  };

  const handleReset = () => {
    setDraftSelection([]);
    if (typeof onReset === 'function') {
      onReset();
    } else if (typeof onSelectFlight === 'function') {
      onSelectFlight([]);
    }
    onClose();
  };

  return (
    <Modal
      animationType={Platform.OS === 'ios' ? 'fade' : 'slide'}
      transparent={true}
      visible={isVisible}
      onRequestClose={onClose}
      presentationStyle={Platform.OS === 'ios' ? 'overFullScreen' : undefined}
      statusBarTranslucent={Platform.OS === 'android'}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.modalOverlay}>
          <TouchableWithoutFeedback>
            <View style={[styles.actionSheetContainer, { paddingBottom: Math.max(insets.bottom, 12) }]}>
              <View style={styles.titleContainer}>
                <Text style={styles.titleText}>Plant Flight</Text>
                <TouchableOpacity
                  style={styles.closeButton}
                  onPress={onClose}
                  activeOpacity={0.7}>
                  <CloseIcon width={24} height={24} style={styles.closeIcon} />
                </TouchableOpacity>
              </View>

              <ScrollView
                style={styles.contentContainer}
                contentContainerStyle={styles.contentInner}
                showsVerticalScrollIndicator={false}>
                {availableIsoList.length === 0 ? (
                  <Text style={styles.noDatesHint}>
                    No plant flight dates are available for the current list.
                    Clear other filters and try again.
                  </Text>
                ) : (
                  <>
                    {availableIsoList.map((iso) => (
                      <CheckboxRow
                        key={iso}
                        label={formatFlightDate(iso)}
                        selected={draftSelection.includes(iso)}
                        onPress={() => toggleDate(iso)}
                      />
                    ))}
                    <View style={styles.divider} />
                    <CheckboxRow
                      label="Select All"
                      selected={allSelected}
                      onPress={toggleSelectAll}
                    />
                  </>
                )}
              </ScrollView>

              <View style={styles.actionContainer}>
                <TouchableOpacity
                  style={styles.resetButton}
                  onPress={handleReset}
                  activeOpacity={0.7}>
                  <Text style={styles.resetButtonText}>Reset</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.buttonView}
                  onPress={handleView}
                  activeOpacity={0.7}>
                  <Text style={styles.buttonText}>View</Text>
                </TouchableOpacity>
              </View>
            </View>
          </TouchableWithoutFeedback>
        </View>
      </TouchableWithoutFeedback>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalOverlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  actionSheetContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '70%',
    width: '100%',
  },
  titleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 24,
  },
  titleText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
    flex: 1,
  },
  closeButton: {
    padding: 6,
    width: 24,
    height: 24,
  },
  closeIcon: {
    width: 24,
    height: 24,
  },
  contentContainer: {
    width: '100%',
    maxHeight: 360,
    paddingHorizontal: 24,
  },
  contentInner: {
    paddingBottom: 16,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 4,
    minHeight: 48,
    borderRadius: 8,
  },
  optionRowSelected: {
    backgroundColor: '#EFF9F0',
  },
  checkbox: {
    width: 24,
    height: 24,
    borderRadius: 6,
    borderWidth: 1,
    borderColor: '#647276',
    flexShrink: 0,
  },
  checkboxSelected: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: '#539461',
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  optionLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#393D40',
    flex: 1,
    marginRight: 12,
  },
  optionLabelSelected: {
    color: '#14632A',
    fontWeight: '600',
  },
  divider: {
    width: '100%',
    height: 1,
    backgroundColor: '#E4E7E9',
    marginVertical: 4,
  },
  noDatesHint: {
    fontFamily: 'Inter',
    fontSize: 14,
    lineHeight: 20,
    color: '#E65100',
    textAlign: 'center',
    paddingHorizontal: 16,
    paddingVertical: 24,
  },
  actionContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 12,
    paddingBottom: 12,
    paddingHorizontal: 24,
    gap: 8,
    width: '100%',
  },
  resetButton: {
    flex: 1,
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resetButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#23C16B',
  },
  buttonView: {
    flex: 1,
    backgroundColor: '#23C16B',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
});

export default PlantFlightFilter;
