import React, {useMemo, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {globalStyles} from '../../assets/styles/styles';
import MockupHeader from './MockupHeader';
import {SAMPLE_LISTINGS} from './mockData';

const POTS = ['2"', '4"', '6"'];
const HEIGHTS = ['Below', 'Above'];
const STATUSES = ['Live', 'Inactive'];
const TYPES = ['Live', 'Group Chat'];

const ScreenB2BListingEdit = ({navigation}) => {
  const [rows, setRows] = useState(SAMPLE_LISTINGS);
  const [manageMode, setManageMode] = useState(false);
  const [selected, setSelected] = useState([]);
  const [bulkField, setBulkField] = useState('price');
  const [bulkValue, setBulkValue] = useState('50.00');

  const selectedCount = selected.length;

  const updateRow = (id, patch) => {
    setRows(prev => prev.map(row => (row.id === id ? {...row, ...patch} : row)));
  };

  const toggleSelect = id => {
    setSelected(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  const selectAll = () => {
    if (selected.length === rows.length) {
      setSelected([]);
    } else {
      setSelected(rows.map(r => r.id));
    }
  };

  const onUpdate = () => {
    Alert.alert('Update', 'Listing changes would save to the database. This mockup does not write data.');
  };

  const applyBulk = () => {
    if (!selectedCount) {
      Alert.alert('Select listings', 'Choose one or more listings first.');
      return;
    }
    Alert.alert(
      'Confirm bulk update',
      `Update ${selectedCount} listing${selectedCount === 1 ? '' : 's'} — ${bulkField} → ${bulkValue}?`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Save',
          onPress: () => {
            setRows(prev =>
              prev.map(row => {
                if (!selected.includes(row.id)) {
                  return row;
                }
                if (bulkField === 'price') {
                  return {...row, price: Number(bulkValue).toFixed(2)};
                }
                if (bulkField === 'potSize') {
                  return {...row, potSize: bulkValue};
                }
                if (bulkField === 'height') {
                  return {...row, height: bulkValue};
                }
                if (bulkField === 'status') {
                  return {...row, status: bulkValue};
                }
                if (bulkField === 'listingType') {
                  return {...row, listingType: bulkValue};
                }
                if (bulkField === 'pin') {
                  return {...row, pin: bulkValue === 'Pin'};
                }
                return row;
              }),
            );
            setSelected([]);
            setManageMode(false);
          },
        },
      ],
    );
  };

  const bulkOptions = useMemo(() => {
    if (bulkField === 'potSize') {
      return POTS;
    }
    if (bulkField === 'height') {
      return HEIGHTS;
    }
    if (bulkField === 'status') {
      return STATUSES;
    }
    if (bulkField === 'listingType') {
      return TYPES;
    }
    if (bulkField === 'pin') {
      return ['Pin', 'Unpin'];
    }
    return null;
  }, [bulkField]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader navigation={navigation} title="Live listings" />
      <View style={styles.toolbar}>
        <TouchableOpacity
          style={[styles.toolBtn, manageMode && styles.toolBtnOn]}
          onPress={() => {
            setManageMode(!manageMode);
            setSelected([]);
          }}>
          <Text style={[styles.toolText, manageMode && styles.toolTextOn]}>
            {manageMode ? 'Done' : 'Manage'}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolBtn} onPress={onUpdate}>
          <Text style={styles.toolText}>Update</Text>
        </TouchableOpacity>
      </View>

      {manageMode && (
        <View style={styles.bulkBar}>
          <Text style={styles.bulkCount}>
            {selectedCount} selected
          </Text>
          <TouchableOpacity onPress={selectAll}>
            <Text style={styles.link}>
              {selected.length === rows.length ? 'Clear' : 'Select all'}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      <ScrollView horizontal>
        <View>
          <View style={[styles.row, styles.head]}>
            {manageMode && <Text style={[styles.cell, styles.chk]} />}
            <Text style={[styles.cell, styles.plantCol, styles.headText]}>Plant</Text>
            <Text style={[styles.cell, styles.headText]}>Status</Text>
            <Text style={[styles.cell, styles.small, styles.headText]}>Pin</Text>
            <Text style={[styles.cell, styles.headText]}>Type</Text>
            <Text style={[styles.cell, styles.headText]}>USD Price</Text>
            <Text style={[styles.cell, styles.small, styles.headText]}>Pot</Text>
            <Text style={[styles.cell, styles.headText]}>Height</Text>
          </View>
          {rows.map(row => (
            <View key={row.id} style={styles.row}>
              {manageMode && (
                <TouchableOpacity style={[styles.cell, styles.chk]} onPress={() => toggleSelect(row.id)}>
                  <View style={[styles.box, selected.includes(row.id) && styles.boxOn]} />
                </TouchableOpacity>
              )}
              <View style={[styles.cell, styles.plantCol]}>
                <TextInput
                  style={styles.input}
                  value={`${row.genus} ${row.species}`}
                  onChangeText={text => {
                    const [genus, ...rest] = text.split(' ');
                    updateRow(row.id, {genus, species: rest.join(' ')});
                  }}
                />
                <Text style={styles.variegation}>{row.variegation || '—'}</Text>
              </View>
              <ChipCell
                value={row.status}
                options={STATUSES}
                onChange={status => updateRow(row.id, {status})}
              />
              <TouchableOpacity
                style={[styles.cell, styles.small]}
                onPress={() => updateRow(row.id, {pin: !row.pin})}>
                <Text style={styles.pin}>{row.pin ? 'Pinned' : '—'}</Text>
              </TouchableOpacity>
              <ChipCell
                value={row.listingType}
                options={TYPES}
                onChange={listingType => updateRow(row.id, {listingType})}
              />
              <View style={styles.cell}>
                <TextInput
                  style={styles.priceInput}
                  keyboardType="decimal-pad"
                  value={row.price}
                  onChangeText={price => updateRow(row.id, {price})}
                />
              </View>
              <ChipCell
                value={row.potSize}
                options={POTS}
                small
                onChange={potSize => updateRow(row.id, {potSize})}
              />
              <ChipCell
                value={row.height}
                options={HEIGHTS}
                onChange={height => updateRow(row.id, {height})}
              />
            </View>
          ))}
        </View>
      </ScrollView>

      {manageMode && (
        <View style={styles.bulkPanel}>
          <Text style={styles.bulkTitle}>Bulk update selected</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {['price', 'potSize', 'height', 'status', 'pin', 'listingType'].map(field => (
              <TouchableOpacity
                key={field}
                style={[styles.fieldChip, bulkField === field && styles.fieldChipOn]}
                onPress={() => {
                  setBulkField(field);
                  if (field === 'price') {
                    setBulkValue('50.00');
                  } else if (field === 'potSize') {
                    setBulkValue('6"');
                  } else if (field === 'height') {
                    setBulkValue('Above');
                  } else if (field === 'status') {
                    setBulkValue('Live');
                  } else if (field === 'pin') {
                    setBulkValue('Pin');
                  } else {
                    setBulkValue('Live');
                  }
                }}>
                <Text style={[styles.fieldChipText, bulkField === field && styles.fieldChipTextOn]}>
                  {field === 'potSize' ? 'Pot size' : field === 'listingType' ? 'Listing type' : field}
                </Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
          {bulkField === 'price' ? (
            <TextInput
              style={styles.bulkInput}
              keyboardType="decimal-pad"
              value={bulkValue}
              onChangeText={setBulkValue}
              placeholder="50.00"
            />
          ) : (
            <View style={styles.optionRow}>
              {bulkOptions.map(opt => (
                <TouchableOpacity
                  key={opt}
                  style={[styles.opt, bulkValue === opt && styles.optOn]}
                  onPress={() => setBulkValue(opt)}>
                  <Text style={[styles.optText, bulkValue === opt && styles.optTextOn]}>{opt}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
          <TouchableOpacity style={globalStyles.primaryButton} onPress={applyBulk}>
            <Text style={globalStyles.primaryButtonText}>Apply to selected</Text>
          </TouchableOpacity>
        </View>
      )}
    </SafeAreaView>
  );
};

const ChipCell = ({value, options, onChange, small}) => (
  <View style={[styles.cell, small && styles.small]}>
    <TouchableOpacity onPress={() => {
      const idx = options.indexOf(value);
      onChange(options[(idx + 1) % options.length]);
    }}>
      <Text style={styles.chipValue}>{value}</Text>
    </TouchableOpacity>
  </View>
);

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},
  toolbar: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    gap: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  toolBtn: {
    borderWidth: 1,
    borderColor: '#539461',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  toolBtnOn: {backgroundColor: '#539461'},
  toolText: {color: '#356641', fontWeight: '700'},
  toolTextOn: {color: '#fff'},
  bulkBar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 8,
  },
  bulkCount: {color: '#556065', fontWeight: '600'},
  link: {color: '#539461', fontWeight: '700'},
  row: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
  },
  head: {backgroundColor: '#E4E7E9'},
  headText: {fontWeight: '700', color: '#393D43'},
  cell: {width: 110, padding: 10},
  plantCol: {width: 180},
  small: {width: 70},
  chk: {width: 44, alignItems: 'center'},
  box: {
    width: 18,
    height: 18,
    borderWidth: 1,
    borderColor: '#539461',
    borderRadius: 4,
  },
  boxOn: {backgroundColor: '#539461'},
  input: {
    borderWidth: 1,
    borderColor: '#E0E5DB',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: '#202325',
    fontSize: 13,
  },
  priceInput: {
    borderWidth: 1,
    borderColor: '#539461',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 6,
    color: '#202325',
    fontWeight: '700',
  },
  variegation: {color: '#7F8D91', fontSize: 11, marginTop: 4},
  pin: {color: '#356641', fontWeight: '600', fontSize: 12},
  chipValue: {color: '#202325', fontSize: 13},
  bulkPanel: {
    borderTopWidth: 1,
    borderColor: '#E4E7E9',
    padding: 16,
    backgroundColor: '#f2f7f3',
  },
  bulkTitle: {fontWeight: '700', marginBottom: 10, color: '#202325'},
  fieldChip: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
    marginBottom: 10,
  },
  fieldChipOn: {backgroundColor: '#539461', borderColor: '#539461'},
  fieldChipText: {color: '#356641', fontWeight: '600', fontSize: 12, textTransform: 'capitalize'},
  fieldChipTextOn: {color: '#fff'},
  bulkInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#539461',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    fontWeight: '700',
  },
  optionRow: {flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 10},
  opt: {
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: '#fff',
  },
  optOn: {backgroundColor: '#539461', borderColor: '#539461'},
  optText: {color: '#356641', fontWeight: '600'},
  optTextOn: {color: '#fff'},
});

export default ScreenB2BListingEdit;
