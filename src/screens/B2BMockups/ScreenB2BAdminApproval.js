import React, {useMemo, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {globalStyles} from '../../assets/styles/styles';
import MockupHeader from './MockupHeader';
import {SAMPLE_REQUESTS} from './mockData';

const FILTERS = ['Pending', 'Approved', 'Rejected', 'All'];

const ScreenB2BAdminApproval = ({navigation}) => {
  const [requests, setRequests] = useState(SAMPLE_REQUESTS);
  const [filter, setFilter] = useState('Pending');
  const [selectedId, setSelectedId] = useState(null);

  const visible = useMemo(
    () => (filter === 'All' ? requests : requests.filter(r => r.status === filter)),
    [filter, requests],
  );
  const selected = requests.find(r => r.id === selectedId) || visible[0];

  const setStatus = status => {
    if (!selected) {
      return;
    }
    setRequests(prev =>
      prev.map(r => (r.id === selected.id ? {...r, status} : r)),
    );
    Alert.alert(
      status === 'Approved' ? 'Approved' : 'Rejected',
      status === 'Approved'
        ? `${selected.name} is now ${selected.toType}.`
        : `${selected.name} stays ${selected.fromType}.`,
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader navigation={navigation} title="Business Approvals" />
      <ScrollView contentContainerStyle={styles.content}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filters}>
          {FILTERS.map(item => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, filter === item && styles.chipOn]}
              onPress={() => {
                setFilter(item);
                setSelectedId(null);
              }}>
              <Text style={[styles.chipText, filter === item && styles.chipTextOn]}>{item}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {visible.map(item => (
          <TouchableOpacity
            key={item.id}
            style={[styles.row, selected?.id === item.id && styles.rowOn]}
            onPress={() => setSelectedId(item.id)}>
            <View style={{flex: 1}}>
              <Text style={styles.name}>{item.name}</Text>
              <Text style={styles.meta}>
                {item.fromType} → {item.toType}
              </Text>
              <Text style={styles.meta}>{item.gardenName} · {item.country}</Text>
            </View>
            <View style={[styles.badge, badgeStyle(item.status)]}>
              <Text style={styles.badgeText}>{item.status}</Text>
            </View>
          </TouchableOpacity>
        ))}

        {selected && (
          <View style={styles.detail}>
            <Text style={styles.detailTitle}>Applicant</Text>
            <Line label="Name" value={selected.name} />
            <Line label="Email" value={selected.email} />
            <Line label="Garden" value={selected.gardenName} />
            <Line label="Country" value={selected.country} />
            <Line label="Current type" value={selected.fromType} />
            <Line label="Requested type" value={selected.toType} />
            <Line label="Submitted" value={selected.submittedAt} />
            <Line label="Notes" value={selected.notes} />

            {selected.status === 'Pending' && (
              <View style={styles.actions}>
                <TouchableOpacity
                  style={[globalStyles.secondaryButtonAccent, styles.actionBtn]}
                  onPress={() => setStatus('Rejected')}>
                  <Text style={globalStyles.secondaryButtonButtonTextAccent}>Reject</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[globalStyles.primaryButton, styles.actionBtn]}
                  onPress={() => setStatus('Approved')}>
                  <Text style={globalStyles.primaryButtonText}>Approve</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const Line = ({label, value}) => (
  <View style={styles.line}>
    <Text style={styles.lineLabel}>{label}</Text>
    <Text style={styles.lineValue}>{value}</Text>
  </View>
);

const badgeStyle = status => {
  if (status === 'Approved') {
    return {backgroundColor: '#23C16B'};
  }
  if (status === 'Rejected') {
    return {backgroundColor: '#FF5247'};
  }
  return {backgroundColor: '#48A7F8'};
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 20, paddingBottom: 40},
  filters: {marginBottom: 12, flexGrow: 0},
  chip: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F6F6',
    marginRight: 8,
  },
  chipOn: {backgroundColor: '#539461'},
  chipText: {color: '#556065', fontWeight: '600'},
  chipTextOn: {color: '#fff'},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#E4E7E9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 8,
  },
  rowOn: {borderColor: '#539461', backgroundColor: '#f2f7f3'},
  name: {fontWeight: '700', color: '#202325', fontSize: 15},
  meta: {color: '#7F8D91', fontSize: 12, marginTop: 2},
  badge: {paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6},
  badgeText: {color: '#fff', fontWeight: '700', fontSize: 11},
  detail: {
    marginTop: 12,
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#f2f7f3',
  },
  detailTitle: {fontWeight: '700', fontSize: 16, color: '#202325', marginBottom: 12},
  line: {marginBottom: 10},
  lineLabel: {color: '#7F8D91', fontSize: 12, marginBottom: 2},
  lineValue: {color: '#202325', fontSize: 14},
  actions: {flexDirection: 'row', gap: 10, marginTop: 8},
  actionBtn: {flex: 1},
});

export default ScreenB2BAdminApproval;
