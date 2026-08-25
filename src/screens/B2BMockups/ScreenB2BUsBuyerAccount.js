import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {globalStyles} from '../../assets/styles/styles';
import {getB2BAccountApi} from '../../components/Api/b2bAccountApi';
import MockupHeader from './MockupHeader';

const ScreenB2BUsBuyerAccount = ({navigation}) => {
  const [account, setAccount] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    const load = async () => {
      const result = await getB2BAccountApi();
      if (!active) {
        return;
      }
      if (result.success && result.data?.account) {
        setAccount(result.data.account);
        setLoadError(null);
      } else {
        setAccount(null);
        setLoadError(result.error || 'Could not load this account from Firestore.');
      }
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const display = useMemo(() => {
    if (!account) {
      return {
        firstName: '',
        lastName: '',
        username: '',
        email: '',
        phone: '',
        accountClass: 'Account',
        status: '',
        country: '',
        address: '',
        city: '',
        state: '',
        zipCode: '',
        leafPoints: 0,
        plantCredits: 0,
        shippingCredits: 0,
        canPurchase: false,
        canLiveSell: false,
        canMainstreamSell: false,
      };
    }
    const firstName = account.firstName || account.name?.split(' ')[0] || 'Buyer';
    const lastName =
      account.lastName || account.name?.split(' ').slice(1).join(' ') || '';
    return {
      firstName,
      lastName,
      username: account.username || 'buyer',
      email: account.email || '',
      phone: account.phone || '',
      accountClass: account.accountClass || 'US Customer',
      status: account.status || 'Active',
      country: account.country || '',
      address: account.address || '',
      city: account.city || '',
      state: account.state || '',
      zipCode: account.zipCode || '',
      leafPoints: account.leafPoints || 0,
      plantCredits: account.plantCredits || 0,
      shippingCredits: account.shippingCredits || 0,
      canPurchase: account.canPurchase !== false,
      canLiveSell: Boolean(account.canLiveSell),
      canMainstreamSell: Boolean(account.canMainstreamSell),
    };
  }, [account]);

  const initials = `${display.firstName[0] || ''}${display.lastName[0] || ''}`.toUpperCase();
  const isBusiness = display.accountClass === 'US Business';

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader navigation={navigation} title={display.accountClass} />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sourceNote}>
          {loadError
            ? 'Couldn’t load this account. Try again in a moment.'
            : 'What this customer can buy and sell.'}
        </Text>

        {loading ? (
          <ActivityIndicator color="#539461" style={{marginVertical: 24}} />
        ) : loadError ? (
          <Text style={styles.sourceNote}>
            Start the app again after the local server is running.
          </Text>
        ) : (
          <>
            <View style={styles.hero}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials || 'U'}</Text>
              </View>
              <Text style={styles.name}>
                {display.firstName} {display.lastName}
              </Text>
              <Text style={styles.handle}>@{display.username}</Text>
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{display.accountClass}</Text>
                </View>
                <View style={[styles.badge, styles.badgeActive]}>
                  <Text style={styles.badgeText}>{display.status}</Text>
                </View>
              </View>
            </View>

            <View style={styles.creditRow}>
              <Credit label="Leaf Points" value={String(display.leafPoints)} />
              <Credit label="Plant Credits" value={String(display.plantCredits)} />
              <Credit label="Shipping Credits" value={String(display.shippingCredits)} />
            </View>

            <Text style={styles.section}>Account</Text>
            <View style={styles.card}>
              <Line label="Email" value={display.email} />
              <Line label="Phone" value={display.phone} />
              <Line label="Account type" value={display.accountClass} />
              <Line label="Country" value={display.country} />
            </View>

            <Text style={styles.section}>Shipping address</Text>
            <View style={styles.card}>
              <Text style={styles.address}>{display.address || '—'}</Text>
              <Text style={styles.address}>
                {[display.city, display.state, display.zipCode].filter(Boolean).join(', ') || '—'}
              </Text>
              <Text style={styles.addressMuted}>
                Continental US only. Alaska, Hawaii, and territories are not supported.
              </Text>
            </View>

            <Text style={styles.section}>What this account can do</Text>
            <View style={styles.card}>
              <Can row="Browse and buy plants in USD" on={display.canPurchase} />
              <Can row="Checkout, orders, credits, shipping buddies" on={display.canPurchase} />
              <Can row="Live selling (US Business)" on={display.canLiveSell} />
              <Can row="Mainstream shop selling" on={display.canMainstreamSell} />
            </View>

            {isBusiness ? (
              <View style={styles.resultBox}>
                <Text style={styles.resultTitle}>This account is US Business</Text>
                <Text style={styles.resultBody}>
                  Consumer purchasing stays on. Live Selling is allowed. Mainstream
                  selling is off for Phase 1.
                </Text>
              </View>
            ) : (
              <>
                <TouchableOpacity
                  style={globalStyles.primaryButton}
                  onPress={() => navigation.navigate('ScreenB2BBusinessSwitch')}>
                  <Text style={globalStyles.primaryButtonText}>Sell as a Business</Text>
                </TouchableOpacity>
                <Text style={styles.footnote}>
                  After admin approval this account stays a buyer and also becomes US
                  Business for Live Selling only.
                </Text>
              </>
            )}
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const Credit = ({label, value}) => (
  <View style={styles.credit}>
    <Text style={styles.creditValue}>{value}</Text>
    <Text style={styles.creditLabel}>{label}</Text>
  </View>
);

const Line = ({label, value}) => (
  <View style={styles.line}>
    <Text style={styles.lineLabel}>{label}</Text>
    <Text style={styles.lineValue}>{value || '—'}</Text>
  </View>
);

const Can = ({row, on}) => (
  <View style={styles.canRow}>
    <View style={[styles.dot, on ? styles.dotOn : styles.dotOff]} />
    <Text style={[styles.canText, !on && styles.canOff]}>{row}</Text>
  </View>
);

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: '#fff'},
  content: {padding: 20, paddingBottom: 40},
  sourceNote: {
    color: '#7F8D91',
    fontSize: 12,
    lineHeight: 18,
    marginBottom: 16,
  },
  hero: {alignItems: 'center', marginBottom: 20},
  avatar: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: '#DFECDF',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 12,
  },
  avatarText: {color: '#356641', fontSize: 24, fontWeight: '700'},
  name: {fontSize: 22, fontWeight: '700', color: '#202325'},
  handle: {color: '#7F8D91', marginTop: 4, marginBottom: 10},
  badgeRow: {flexDirection: 'row', gap: 8},
  badge: {
    backgroundColor: '#202325',
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  badgeActive: {backgroundColor: '#23C16B'},
  badgeText: {color: '#fff', fontWeight: '700', fontSize: 11},
  creditRow: {flexDirection: 'row', gap: 8, marginBottom: 20},
  credit: {
    flex: 1,
    backgroundColor: '#f2f7f3',
    borderRadius: 10,
    paddingVertical: 12,
    alignItems: 'center',
  },
  creditValue: {fontWeight: '700', fontSize: 18, color: '#202325'},
  creditLabel: {color: '#7F8D91', fontSize: 11, marginTop: 4, textAlign: 'center'},
  section: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 8,
  },
  card: {
    borderWidth: 1,
    borderColor: '#E4E7E9',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  line: {marginBottom: 10},
  lineLabel: {color: '#7F8D91', fontSize: 12, marginBottom: 2},
  lineValue: {color: '#202325', fontSize: 14, fontWeight: '600'},
  address: {color: '#202325', fontSize: 14, lineHeight: 20},
  addressMuted: {color: '#7F8D91', fontSize: 12, marginTop: 8, lineHeight: 18},
  canRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 10},
  dot: {width: 8, height: 8, borderRadius: 4, marginRight: 10},
  dotOn: {backgroundColor: '#23C16B'},
  dotOff: {backgroundColor: '#CDD3D4'},
  canText: {color: '#202325', fontSize: 14, flex: 1},
  canOff: {color: '#7F8D91'},
  footnote: {color: '#7F8D91', fontSize: 12, textAlign: 'center', marginTop: 8, lineHeight: 18},
  resultBox: {
    backgroundColor: '#f2f7f3',
    borderRadius: 12,
    padding: 16,
  },
  resultTitle: {fontWeight: '700', fontSize: 16, color: '#202325', marginBottom: 8},
  resultBody: {color: '#556065', fontSize: 14, lineHeight: 20},
});

export default ScreenB2BUsBuyerAccount;
