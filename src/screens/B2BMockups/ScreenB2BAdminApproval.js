import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {globalStyles} from '../../assets/styles/styles';
import {
  listB2BBusinessRequestApi,
  updateB2BBusinessRequestApi,
} from '../../components/Api/b2bAccountApi';
import MockupHeader from './MockupHeader';
import {SAMPLE_REQUESTS} from './mockData';

const FILTERS = ['Pending', 'Approved', 'Rejected', 'All'];

const ScreenB2BAdminApproval = ({navigation}) => {
  const [requests, setRequests] = useState(SAMPLE_REQUESTS);
  const [filter, setFilter] = useState('Pending');
  const [selectedId, setSelectedId] = useState(null);
  const [usingSample, setUsingSample] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const visible = useMemo(
    () => (filter === 'All' ? requests : requests.filter(r => r.status === filter)),
    [filter, requests],
  );
  const selected = requests.find(r => r.id === selectedId) || visible[0];

  const loadRequests = async () => {
    setLoading(true);
    const result = await listB2BBusinessRequestApi({status: 'All'});
    if (result.success && Array.isArray(result.data?.items)) {
      setRequests(result.data.items);
      setUsingSample(false);
    } else {
      setRequests(SAMPLE_REQUESTS);
      setUsingSample(true);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const setStatus = async status => {
    if (!selected) {
      return;
    }
    if (usingSample) {
      setRequests(prev =>
        prev.map(r => (r.id === selected.id ? {...r, status} : r)),
      );
      Alert.alert(
        status === 'Approved' ? 'Approved (sample)' : 'Rejected (sample)',
        status === 'Approved'
          ? `${selected.name} would become ${selected.toType}. Start the emulator to persist this.`
          : `${selected.name} stays ${selected.fromType}. Start the emulator to persist this.`,
      );
      return;
    }

    setSaving(true);
    const result = await updateB2BBusinessRequestApi({
      action: status === 'Approved' ? 'approve' : 'reject',
      requestId: selected.id,
    });
    setSaving(false);
    if (!result.success) {
      Alert.alert('Could not update', result.error);
      return;
    }
    const next = result.data?.request;
    if (next) {
      setRequests(prev => prev.map(r => (r.id === next.id ? next : r)));
    } else {
      await loadRequests();
    }
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
        <Text style={styles.sourceNote}>
          {usingSample
            ? 'Sample data — start the functions emulator on this branch to load real requests. Nothing is deployed.'
            : 'Live conversion requests. Approve changes account type; reject leaves it unchanged.'}
        </Text>

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

        {loading ? (
          <ActivityIndicator color="#539461" style={{marginVertical: 24}} />
        ) : (
          <>
            {visible.length === 0 ? (
              <View style={styles.empty}>
                <Text style={styles.emptyTitle}>No {filter.toLowerCase()} requests</Text>
                <Text style={styles.emptyBody}>
                  {usingSample
                    ? 'Sample list is empty for this filter.'
                    : 'Submitted requests from US Customer and Asia Seller accounts will show here.'}
                </Text>
              </View>
            ) : null}

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
                  <Text style={styles.meta}>
                    {item.gardenName} · {item.country}
                  </Text>
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
                      disabled={saving}
                      onPress={() => setStatus('Rejected')}>
                      <Text style={globalStyles.secondaryButtonButtonTextAccent}>
                        {saving ? 'Saving…' : 'Reject'}
                      </Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[globalStyles.primaryButton, styles.actionBtn]}
                      disabled={saving}
                      onPress={() => setStatus('Approved')}>
                      <Text style={globalStyles.primaryButtonText}>
                        {saving ? 'Saving…' : 'Approve'}
                      </Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const Line = ({label, value}) => (
  <View style={styles.line}>
    <Text style={styles.lineLabel}>{label}</Text>
    <Text style={styles.lineValue}>{value || '—'}</Text>
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
  sourceNote: {
    color: '#7F8D91',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
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
  empty: {
    backgroundColor: '#f2f7f3',
    borderRadius: 12,
    padding: 16,
    marginBottom: 12,
  },
  emptyTitle: {fontWeight: '700', color: '#202325', marginBottom: 4},
  emptyBody: {color: '#7F8D91', fontSize: 13, lineHeight: 18},
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
