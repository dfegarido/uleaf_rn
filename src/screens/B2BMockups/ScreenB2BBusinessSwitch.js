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
  getB2BAccountApi,
  updateB2BBusinessRequestApi,
} from '../../components/Api/b2bAccountApi';
import MockupHeader from './MockupHeader';

const PATHS = [
  {
    key: 'us',
    label: 'US Customer',
    to: 'US Business',
    keeps: 'You keep buying plants as a customer.',
    selling: 'Live Selling only. Mainstream selling is not in this phase.',
  },
  {
    key: 'asia',
    label: 'Asia Seller',
    to: 'Asia Business',
    keeps: 'Asia Seller and Asia Business stay available in parallel.',
    selling: 'New listings are priced in USD. Commission payout applies.',
    liveRule: 'Live Selling must be enabled on your seller account before you can upgrade.',
  },
];

const STATUS_COPY = {
  idle: {title: 'Not submitted', color: '#556065', bg: '#F5F6F6'},
  pending: {title: 'Pending admin review', color: '#1B6BB5', bg: '#E6F2FC'},
  approved: {title: 'Approved', color: '#1B7A45', bg: '#DFECDF'},
  rejected: {title: 'Rejected', color: '#B42318', bg: '#FDECEC'},
};

const statusFromRequest = request => {
  if (!request?.status) {
    return 'idle';
  }
  if (request.status === 'Pending') {
    return 'pending';
  }
  if (request.status === 'Approved') {
    return 'approved';
  }
  if (request.status === 'Rejected') {
    return 'rejected';
  }
  return 'idle';
};

const pathFromAccountClass = accountClass => {
  if (String(accountClass || '').startsWith('Asia')) {
    return 'asia';
  }
  return 'us';
};

const ScreenB2BBusinessSwitch = ({navigation, route}) => {
  const initialPath = route?.params?.path === 'asia' ? 'asia' : 'us';
  const [pathKey, setPathKey] = useState(initialPath);
  const [status, setStatus] = useState('idle');
  const [account, setAccount] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const path = useMemo(() => PATHS.find(p => p.key === pathKey), [pathKey]);
  const statusMeta = STATUS_COPY[status];
  const isSupplierAccount = account?.collectionName === 'supplier';
  const pathLocked = Boolean(account?.accountClass);
  const asiaUpgradeBlocked =
    pathKey === 'asia' &&
    account?.canUpgradeToAsiaBusiness === false;
  const canSubmit = status === 'idle' && !asiaUpgradeBlocked;

  const applyAccount = nextAccount => {
    setAccount(nextAccount);
    setPathKey(pathFromAccountClass(nextAccount?.accountClass));
    setStatus(statusFromRequest(nextAccount?.request));
  };

  useEffect(() => {
    let active = true;
    const load = async () => {
      setLoading(true);
      const result = await getB2BAccountApi();
      if (!active) {
        return;
      }
      if (result.success && result.data?.account) {
        setLoadError(null);
        applyAccount(result.data.account);
      } else {
        setLoadError(result.error || 'Could not load this account from Firestore.');
        setAccount(null);
        setStatus('idle');
        setPathKey(initialPath);
      }
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, [initialPath]);

  const onSubmit = async () => {
    if (loadError || !account) {
      Alert.alert(
        'Not connected',
        loadError || 'Couldn’t load this account. Try again in a moment.',
      );
      return;
    }
    if (asiaUpgradeBlocked) {
      Alert.alert(
        'Upgrade not available',
        'Live Selling must be enabled before upgrading to Asia Business. Your account stays Asia Seller.',
      );
      return;
    }
    setSaving(true);
    const result = await updateB2BBusinessRequestApi({
      action: 'submit',
      toType: path.to,
    });
    setSaving(false);
    if (!result.success) {
      Alert.alert('Could not submit', result.error);
      return;
    }
    if (result.data?.account) {
      applyAccount(result.data.account);
    } else {
      setStatus('pending');
    }
    Alert.alert(
      'Request submitted',
      'Admin will approve or reject. Your current account type does not change until approval.',
    );
  };

  const title =
    pathKey === 'asia' || isSupplierAccount
      ? 'Upgrade to Asia Business'
      : 'Become a Business';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader navigation={navigation} title={title} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sourceNote}>
          {loadError
            ? 'Couldn’t load this account. Try again in a moment.'
            : `Current account type: ${account?.accountClass || '—'}`}
        </Text>

        {isSupplierAccount ? (
          <View style={styles.infoCard}>
            <Text style={styles.infoTitle}>Asia Seller account</Text>
            <Text style={styles.infoBody}>
              Live Selling flag: {account?.liveFlag || 'No'}
              {account?.liveFlag === 'Yes'
                ? ' — eligible to request Asia Business.'
                : ' — upgrade stays blocked until Live Selling is enabled.'}
            </Text>
          </View>
        ) : null}

        {!isSupplierAccount ? (
          <View style={styles.segment}>
            {PATHS.map(item => (
              <TouchableOpacity
                key={item.key}
                style={[styles.segBtn, pathKey === item.key && styles.segBtnOn]}
                disabled={pathLocked}
                onPress={() => {
                  if (pathLocked) {
                    return;
                  }
                  setPathKey(item.key);
                  setStatus('idle');
                }}>
                <Text style={[styles.segText, pathKey === item.key && styles.segTextOn]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        ) : null}

        {loading ? (
          <ActivityIndicator color="#539461" style={{marginVertical: 24}} />
        ) : (
          <>
            <View style={[styles.statusCard, {backgroundColor: statusMeta.bg}]}>
              <Text style={[styles.statusLabel, {color: statusMeta.color}]}>
                {statusMeta.title}
              </Text>
              <Text style={styles.statusBody}>
                {path.label} → {path.to}
              </Text>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>What changes after approval</Text>
              <Bullet text={path.keeps} />
              <Bullet text={path.selling} />
              {path.liveRule ? <Bullet text={path.liveRule} /> : null}
              <Bullet text="Listings are entered and shown in exact USD. No $5 rounding." />
              <Bullet text="Payout = Listed USD − Commission − Logistics − Plant Care." />
            </View>

            {asiaUpgradeBlocked ? (
              <View style={styles.blockedBox}>
                <Text style={styles.blockedTitle}>Upgrade not available yet</Text>
                <Text style={styles.blockedBody}>
                  Sellers without Live Selling stay on Asia Seller. Ask admin to enable
                  Live Selling before submitting this request.
                </Text>
              </View>
            ) : null}

            {canSubmit ? (
              <TouchableOpacity
                style={globalStyles.primaryButton}
                disabled={saving}
                onPress={onSubmit}>
                <Text style={globalStyles.primaryButtonText}>
                  {saving ? 'Submitting…' : 'Submit for admin approval'}
                </Text>
              </TouchableOpacity>
            ) : null}
            {status === 'pending' && (
              <View style={styles.pendingBox}>
                <Text style={styles.pendingText}>
                  Waiting on admin. You can still use your current account as usual.
                </Text>
              </View>
            )}
            {status === 'approved' && (
              <View style={styles.resultBox}>
                <Text style={styles.resultTitle}>
                  Account is now {account?.accountClass || path.to}
                </Text>
                <Text style={styles.resultBody}>
                  {path.key === 'us'
                    ? 'Shop as a customer is still available. Live Selling is unlocked. Mainstream selling stays off.'
                    : 'USD listings and commission payouts are now on. Existing Asia Seller accounts are unchanged.'}
                </Text>
              </View>
            )}
            {status === 'rejected' && (
              <View style={styles.resultBox}>
                <Text style={styles.resultTitle}>Request was not approved</Text>
                <Text style={styles.resultBody}>
                  Account type stays {account?.accountClass || path.label}. You can
                  submit again later.
                </Text>
                <TouchableOpacity
                  style={globalStyles.secondaryButtonAccent}
                  onPress={() => setStatus('idle')}>
                  <Text style={globalStyles.secondaryButtonButtonTextAccent}>
                    Submit again
                  </Text>
                </TouchableOpacity>
              </View>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const Bullet = ({text}) => (
  <View style={styles.bulletRow}>
    <View style={styles.dot} />
    <Text style={styles.bulletText}>{text}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 20, paddingBottom: 40},
  sourceNote: {
    color: '#7F8D91',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 12,
  },
  infoCard: {
    backgroundColor: '#f2f7f3',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: '#C0DAC2',
  },
  infoTitle: {fontWeight: '700', color: '#202325', marginBottom: 6},
  infoBody: {color: '#556065', fontSize: 14, lineHeight: 20},
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F5F6F6',
    borderRadius: 10,
    padding: 4,
    marginBottom: 16,
  },
  segBtn: {flex: 1, paddingVertical: 10, borderRadius: 8, alignItems: 'center'},
  segBtnOn: {backgroundColor: '#fff'},
  segText: {color: '#7F8D91', fontWeight: '600'},
  segTextOn: {color: '#202325'},
  statusCard: {borderRadius: 12, padding: 16, marginBottom: 16},
  statusLabel: {fontWeight: '700', fontSize: 16, marginBottom: 4},
  statusBody: {color: '#393D43', fontSize: 14},
  card: {
    borderWidth: 1,
    borderColor: '#E4E7E9',
    borderRadius: 12,
    padding: 16,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 12,
  },
  bulletRow: {flexDirection: 'row', marginBottom: 10, alignItems: 'flex-start'},
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#539461',
    marginTop: 7,
    marginRight: 10,
  },
  bulletText: {flex: 1, color: '#556065', fontSize: 14, lineHeight: 20},
  blockedBox: {
    backgroundColor: '#FDECEC',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  blockedTitle: {fontWeight: '700', color: '#B42318', marginBottom: 6},
  blockedBody: {color: '#7A271A', fontSize: 14, lineHeight: 20},
  pendingBox: {
    backgroundColor: '#E6F2FC',
    borderRadius: 12,
    padding: 16,
  },
  pendingText: {color: '#1B6BB5', fontSize: 14, lineHeight: 20, marginBottom: 12},
  demoRow: {flexDirection: 'row', gap: 8},
  demoBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#539461',
    borderRadius: 8,
    paddingVertical: 10,
    alignItems: 'center',
  },
  demoBtnReject: {borderColor: '#B42318'},
  demoBtnText: {color: '#356641', fontWeight: '700', fontSize: 13},
  resultBox: {
    backgroundColor: '#f2f7f3',
    borderRadius: 12,
    padding: 16,
  },
  resultTitle: {fontWeight: '700', fontSize: 16, color: '#202325', marginBottom: 8},
  resultBody: {color: '#556065', fontSize: 14, lineHeight: 20, marginBottom: 8},
});

export default ScreenB2BBusinessSwitch;
