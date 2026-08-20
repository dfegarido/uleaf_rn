import React, {useMemo, useState} from 'react';
import {Alert, ScrollView, StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {globalStyles} from '../../assets/styles/styles';
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
  },
];

const STATUS_COPY = {
  idle: {title: 'Not submitted', color: '#556065', bg: '#F5F6F6'},
  pending: {title: 'Pending admin review', color: '#1B6BB5', bg: '#E6F2FC'},
  approved: {title: 'Approved', color: '#1B7A45', bg: '#DFECDF'},
  rejected: {title: 'Rejected', color: '#B42318', bg: '#FDECEC'},
};

const ScreenB2BBusinessSwitch = ({navigation}) => {
  const [pathKey, setPathKey] = useState('us');
  const [status, setStatus] = useState('idle');
  const path = useMemo(() => PATHS.find(p => p.key === pathKey), [pathKey]);
  const statusMeta = STATUS_COPY[status];

  const onSubmit = () => {
    setStatus('pending');
    Alert.alert(
      'Request submitted',
      'Admin will approve or reject. Your current account type does not change until approval.',
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader navigation={navigation} title="Become a Business" />
      <ScrollView contentContainerStyle={styles.content}>
        <View style={styles.segment}>
          {PATHS.map(item => (
            <TouchableOpacity
              key={item.key}
              style={[styles.segBtn, pathKey === item.key && styles.segBtnOn]}
              onPress={() => {
                setPathKey(item.key);
                setStatus('idle');
              }}>
              <Text style={[styles.segText, pathKey === item.key && styles.segTextOn]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

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
          <Bullet text="Listings are entered and shown in exact USD. No $5 rounding." />
          <Bullet text="Payout = Listed USD − Commission − Logistics − Plant Care." />
        </View>

        {status === 'idle' && (
          <TouchableOpacity style={globalStyles.primaryButton} onPress={onSubmit}>
            <Text style={globalStyles.primaryButtonText}>Submit for admin approval</Text>
          </TouchableOpacity>
        )}
        {status === 'pending' && (
          <View style={styles.pendingBox}>
            <Text style={styles.pendingText}>
              Waiting on admin. You can still use your current account as usual.
            </Text>
            <View style={styles.demoRow}>
              <TouchableOpacity
                style={styles.demoBtn}
                onPress={() => setStatus('approved')}>
                <Text style={styles.demoBtnText}>Demo: Approved</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.demoBtn, styles.demoBtnReject]}
                onPress={() => setStatus('rejected')}>
                <Text style={[styles.demoBtnText, {color: '#B42318'}]}>Demo: Rejected</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
        {status === 'approved' && (
          <View style={styles.resultBox}>
            <Text style={styles.resultTitle}>Account is now {path.to}</Text>
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
              Account type stays {path.label}. You can submit again later.
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
