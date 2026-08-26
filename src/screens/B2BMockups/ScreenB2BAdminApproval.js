import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
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

const FILTERS = ['Pending', 'Approved', 'Rejected', 'All'];

const ScreenB2BAdminApproval = ({navigation}) => {
  const [requests, setRequests] = useState([]);
  const [filter, setFilter] = useState('Pending');
  const [selectedId, setSelectedId] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [reviewNotes, setReviewNotes] = useState('');

  const counts = useMemo(
    () => ({
      Pending: requests.filter(r => r.status === 'Pending').length,
      Approved: requests.filter(r => r.status === 'Approved').length,
      Rejected: requests.filter(r => r.status === 'Rejected').length,
      All: requests.length,
    }),
    [requests],
  );

  const visible = useMemo(
    () => (filter === 'All' ? requests : requests.filter(r => r.status === filter)),
    [filter, requests],
  );
  const selected = requests.find(r => r.id === selectedId) || visible[0];

  useEffect(() => {
    setReviewNotes(selected?.reviewNotes || '');
  }, [selected?.id, selected?.reviewNotes]);

  const loadRequests = async ({silent} = {}) => {
    if (!silent) {
      setLoading(true);
    }
    const result = await listB2BBusinessRequestApi({status: 'All'});
    if (result.success && Array.isArray(result.data?.items)) {
      setRequests(result.data.items);
      setLoadError(null);
    } else {
      setRequests([]);
      setLoadError(result.error || 'Could not load business requests.');
    }
    setLoading(false);
    setRefreshing(false);
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const setStatus = async status => {
    if (!selected) {
      return;
    }
    setSaving(true);
    const result = await updateB2BBusinessRequestApi({
      action: status === 'Approved' ? 'approve' : 'reject',
      requestId: selected.id,
      reviewNotes,
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
      await loadRequests({silent: true});
    }
    Alert.alert(
      status === 'Approved' ? 'Approved' : 'Rejected',
      status === 'Approved'
        ? `${selected.name} is now ${selected.toType}.`
        : `${selected.name} stays ${selected.fromType}.`,
    );
  };

  const isAsiaRequest = selected?.fromType === 'Asia Seller';
  const liveBlocked =
    isAsiaRequest &&
    selected?.status === 'Pending' &&
    selected?.liveFlag &&
    selected.liveFlag !== 'Yes';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader navigation={navigation} title="Business Approvals" />
      <ScrollView
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            tintColor="#539461"
            onRefresh={() => {
              setRefreshing(true);
              loadRequests({silent: true});
            }}
          />
        }>
        <View style={styles.hero}>
          <Text style={styles.heroKicker}>B2B ASIA</Text>
          <Text style={styles.heroTitle}>Review business requests</Text>
          <Text style={styles.heroBody}>
            {loadError
              ? 'Couldn’t load requests. Pull to refresh.'
              : 'Approve upgrades account type; reject leaves it unchanged.'}
          </Text>
          <View style={styles.statRow}>
            <StatPill label="Pending" value={counts.Pending} tone="pending" />
            <StatPill label="Approved" value={counts.Approved} tone="approved" />
            <StatPill label="Rejected" value={counts.Rejected} tone="rejected" />
          </View>
        </View>

        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterRow}>
          {FILTERS.map(item => (
            <TouchableOpacity
              key={item}
              style={[styles.chip, filter === item && styles.chipOn]}
              onPress={() => {
                setFilter(item);
                setSelectedId(null);
              }}>
              <Text style={[styles.chipText, filter === item && styles.chipTextOn]}>
                {item}
              </Text>
              <View style={[styles.chipCount, filter === item && styles.chipCountOn]}>
                <Text
                  style={[
                    styles.chipCountText,
                    filter === item && styles.chipCountTextOn,
                  ]}>
                  {counts[item]}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
        </ScrollView>

        {loading ? (
          <ActivityIndicator color="#539461" style={{marginVertical: 32}} />
        ) : (
          <>
            <View style={styles.listCard}>
              {visible.length === 0 ? (
                <View style={styles.empty}>
                  <Text style={styles.emptyTitle}>No {filter.toLowerCase()} requests</Text>
                  <Text style={styles.emptyBody}>
                    US Customer and Asia Seller applications will appear here.
                  </Text>
                </View>
              ) : (
                visible.map((item, index) => (
                  <React.Fragment key={item.id}>
                    {index > 0 ? <View style={styles.divider} /> : null}
                    <TouchableOpacity
                      style={[
                        styles.row,
                        selected?.id === item.id && styles.rowOn,
                      ]}
                      activeOpacity={0.7}
                      onPress={() => setSelectedId(item.id)}>
                      <View style={styles.rowMain}>
                        <Text style={styles.name}>{item.name}</Text>
                        <Text style={styles.meta}>
                          {item.fromType} → {item.toType}
                        </Text>
                        <Text style={styles.metaMuted}>
                          {item.gardenName}
                          {item.country ? ` · ${item.country}` : ''}
                        </Text>
                      </View>
                      <StatusBadge status={item.status} />
                    </TouchableOpacity>
                  </React.Fragment>
                ))
              )}
            </View>

            {selected ? (
              <View style={styles.detail}>
                <View style={styles.detailHead}>
                  <View style={{flex: 1}}>
                    <Text style={styles.detailKicker}>Applicant</Text>
                    <Text style={styles.detailName}>{selected.name}</Text>
                  </View>
                  <StatusBadge status={selected.status} />
                </View>

                <View style={styles.detailGrid}>
                  <Field label="Email" value={selected.email} />
                  <Field label="Garden" value={selected.gardenName} />
                  <Field label="Country" value={selected.country} />
                  <Field label="Submitted" value={selected.submittedAt} />
                  <Field label="Current type" value={selected.fromType} />
                  <Field label="Requested type" value={selected.toType} />
                  {isAsiaRequest ? (
                    <Field
                      label="Live Selling"
                      value={selected.liveFlag || 'No'}
                      alert={selected.liveFlag !== 'Yes'}
                    />
                  ) : null}
                  <Field label="Applicant notes" value={selected.notes} full />
                </View>

                {selected.status !== 'Pending' ? (
                  <View style={styles.historyBlock}>
                    <Text style={styles.historyTitle}>Decision</Text>
                    <View style={styles.detailGrid}>
                      <Field label="Status" value={selected.status} />
                      <Field label="Reviewed" value={selected.reviewedAt} />
                      <Field label="Reviewed by" value={selected.reviewedBy} />
                      <Field label="Review notes" value={selected.reviewNotes} full />
                    </View>
                  </View>
                ) : null}

                {selected.status === 'Pending' ? (
                  <>
                    {liveBlocked ? (
                      <View style={styles.warnBox}>
                        <Text style={styles.warnTitle}>Cannot approve yet</Text>
                        <Text style={styles.warnBody}>
                          Live Selling is not enabled. They stay Asia Seller until it
                          is turned on.
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.notesField}>
                      <Text style={styles.fieldLabel}>Review notes (optional)</Text>
                      <TextInput
                        style={styles.notesInput}
                        value={reviewNotes}
                        onChangeText={setReviewNotes}
                        placeholder="Reason or notes for the decision"
                        placeholderTextColor="#A9B3B7"
                        multiline
                      />
                    </View>

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
                        style={[
                          globalStyles.primaryButton,
                          styles.actionBtn,
                          liveBlocked && styles.actionDisabled,
                        ]}
                        disabled={saving || liveBlocked}
                        onPress={() => setStatus('Approved')}>
                        <Text style={globalStyles.primaryButtonText}>
                          {saving ? 'Saving…' : 'Approve'}
                        </Text>
                      </TouchableOpacity>
                    </View>
                  </>
                ) : null}
              </View>
            ) : null}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const StatPill = ({label, value, tone}) => (
  <View style={[styles.statPill, toneStyles[tone]?.pill]}>
    <Text style={[styles.statValue, toneStyles[tone]?.value]}>{value}</Text>
    <Text style={[styles.statLabel, toneStyles[tone]?.label]}>{label}</Text>
  </View>
);

const StatusBadge = ({status}) => {
  const tone =
    status === 'Approved'
      ? 'approved'
      : status === 'Rejected'
        ? 'rejected'
        : 'pending';
  return (
    <View style={[styles.badge, toneStyles[tone]?.badge]}>
      <Text style={[styles.badgeText, toneStyles[tone]?.badgeText]}>{status}</Text>
    </View>
  );
};

const Field = ({label, value, full, alert}) => (
  <View style={[styles.field, full && styles.fieldFull]}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Text style={[styles.fieldValue, alert && styles.fieldAlert]}>
      {value || '—'}
    </Text>
  </View>
);

const toneStyles = {
  pending: {
    pill: {backgroundColor: '#EAF4FE'},
    value: {color: '#1769AA'},
    label: {color: '#4A8BC2'},
    badge: {backgroundColor: '#EAF4FE'},
    badgeText: {color: '#1769AA'},
  },
  approved: {
    pill: {backgroundColor: '#E8F8EF'},
    value: {color: '#1B7A45'},
    label: {color: '#3D9B66'},
    badge: {backgroundColor: '#E8F8EF'},
    badgeText: {color: '#1B7A45'},
  },
  rejected: {
    pill: {backgroundColor: '#FDECEC'},
    value: {color: '#B42318'},
    label: {color: '#D4544A'},
    badge: {backgroundColor: '#FDECEC'},
    badgeText: {color: '#B42318'},
  },
};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 20, paddingBottom: 48},
  hero: {
    backgroundColor: '#f2f7f3',
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 14,
    padding: 16,
    marginBottom: 16,
  },
  heroKicker: {
    color: '#356641',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: 6,
  },
  heroTitle: {
    color: '#202325',
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 4,
  },
  heroBody: {
    color: '#556065',
    fontSize: 13,
    lineHeight: 18,
    marginBottom: 14,
  },
  statRow: {
    flexDirection: 'row',
    gap: 8,
  },
  statPill: {
    flex: 1,
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 8,
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
    fontWeight: '600',
  },
  filterRow: {
    paddingBottom: 14,
    gap: 8,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: 14,
    paddingRight: 8,
    paddingVertical: 8,
    borderRadius: 20,
    backgroundColor: '#F5F6F6',
    gap: 8,
  },
  chipOn: {backgroundColor: '#539461'},
  chipText: {color: '#556065', fontWeight: '600', fontSize: 13},
  chipTextOn: {color: '#fff'},
  chipCount: {
    minWidth: 22,
    height: 22,
    borderRadius: 11,
    paddingHorizontal: 6,
    backgroundColor: '#E4E7E9',
    alignItems: 'center',
    justifyContent: 'center',
  },
  chipCountOn: {backgroundColor: 'rgba(255,255,255,0.25)'},
  chipCountText: {color: '#556065', fontSize: 11, fontWeight: '700'},
  chipCountTextOn: {color: '#fff'},
  listCard: {
    borderWidth: 1,
    borderColor: '#E4E7E9',
    borderRadius: 14,
    overflow: 'hidden',
    marginBottom: 16,
    backgroundColor: '#fff',
  },
  empty: {padding: 20},
  emptyTitle: {fontWeight: '700', color: '#202325', marginBottom: 4, fontSize: 15},
  emptyBody: {color: '#7F8D91', fontSize: 13, lineHeight: 18},
  divider: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: '#E4E7E9',
    marginLeft: 16,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    gap: 12,
  },
  rowOn: {backgroundColor: '#f2f7f3'},
  rowMain: {flex: 1},
  name: {fontWeight: '700', color: '#202325', fontSize: 15, marginBottom: 2},
  meta: {color: '#556065', fontSize: 13, marginTop: 1},
  metaMuted: {color: '#7F8D91', fontSize: 12, marginTop: 2},
  badge: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  badgeText: {fontWeight: '700', fontSize: 11},
  detail: {
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 14,
    padding: 16,
    backgroundColor: '#f2f7f3',
  },
  detailHead: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginBottom: 16,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#C0DAC2',
  },
  detailKicker: {
    color: '#356641',
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.3,
    marginBottom: 4,
  },
  detailName: {
    color: '#202325',
    fontSize: 18,
    fontWeight: '700',
  },
  detailGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginHorizontal: -6,
  },
  field: {
    width: '50%',
    paddingHorizontal: 6,
    marginBottom: 12,
  },
  fieldFull: {
    width: '100%',
  },
  fieldLabel: {
    color: '#7F8D91',
    fontSize: 12,
    marginBottom: 3,
  },
  fieldValue: {
    color: '#202325',
    fontSize: 14,
    lineHeight: 20,
  },
  fieldAlert: {
    color: '#B42318',
    fontWeight: '600',
  },
  historyBlock: {
    marginTop: 4,
    marginBottom: 4,
    paddingTop: 14,
    borderTopWidth: 1,
    borderTopColor: '#C0DAC2',
  },
  historyTitle: {
    fontWeight: '700',
    color: '#202325',
    fontSize: 14,
    marginBottom: 12,
  },
  warnBox: {
    backgroundColor: '#FDECEC',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
  },
  warnTitle: {fontWeight: '700', color: '#B42318', marginBottom: 4},
  warnBody: {color: '#7A271A', fontSize: 13, lineHeight: 18},
  notesField: {marginBottom: 14},
  notesInput: {
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 10,
    padding: 12,
    minHeight: 80,
    textAlignVertical: 'top',
    backgroundColor: '#fff',
    color: '#202325',
    fontSize: 14,
  },
  actions: {flexDirection: 'row', gap: 10},
  actionBtn: {flex: 1},
  actionDisabled: {opacity: 0.5},
});

export default ScreenB2BAdminApproval;
