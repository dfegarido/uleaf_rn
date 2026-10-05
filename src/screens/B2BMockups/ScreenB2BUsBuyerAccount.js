import React, {useCallback, useContext, useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {globalStyles} from '../../assets/styles/styles';
import {getB2BAccountApi, setB2BBusinessApi} from '../../components/Api/b2bAccountApi';
import {getAllUsersApi} from '../../components/Api/getAllUsersApi';
import MockupHeader from './MockupHeader';
import {AuthContext} from '../../auth/AuthProvider';
import {mergeB2BAccountIntoUserInfo} from '../../utils/b2bShell';
import AsyncStorage from '@react-native-async-storage/async-storage';

/** Buyer status is stored as "active" or "de-activate". Empty counts as Active. */
const accountStatusLabel = status => {
  const value = String(status || '').trim().toLowerCase();
  if (
    value === 'de-activate' ||
    value === 'deactivate' ||
    value === 'inactive' ||
    value === 'deactivated'
  ) {
    return 'Inactive';
  }
  return 'Active';
};

const ScreenB2BUsBuyerAccount = ({navigation, route}) => {
  const {userInfo, setUserInfo, setAppShell} = useContext(AuthContext);
  const nestedUser = userInfo?.user || userInfo?.data || {};
  const userType =
    nestedUser.userType || userInfo?.userType || nestedUser.role || userInfo?.role;
  const isAdminViewer =
    route?.params?.audience === 'admin' ||
    userType === 'admin' ||
    userType === 'sub_admin';

  const [lookupUid, setLookupUid] = useState(route?.params?.uid || null);
  const [lookupCollection, setLookupCollection] = useState(
    route?.params?.collectionName || null,
  );
  const [search, setSearch] = useState('');
  const [matches, setMatches] = useState([]);
  const [searching, setSearching] = useState(false);
  const [account, setAccount] = useState(null);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(!isAdminViewer || Boolean(route?.params?.uid));
  const [statusBusy, setStatusBusy] = useState(false);

  const loadAccount = useCallback(async (uid, collectionName) => {
    setLoading(true);
    const result = await getB2BAccountApi(
      uid ? {uid, collectionName} : {},
    );
    if (result.success && result.data?.account) {
      setAccount(result.data.account);
      setLoadError(null);
    } else {
      setAccount(null);
      setLoadError(result.error || 'Could not load this account.');
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    if (isAdminViewer && !lookupUid) {
      setLoading(false);
      setAccount(null);
      return;
    }
    loadAccount(isAdminViewer ? lookupUid : undefined, lookupCollection);
  }, [isAdminViewer, lookupUid, lookupCollection, loadAccount]);

  const onSearchBuyers = async () => {
    const query = search.trim();
    if (!query) {
      setMatches([]);
      return;
    }
    setSearching(true);
    try {
      const [buyerResp, sellerResp] = await Promise.all([
        getAllUsersApi({role: 'buyer', search: query, limit: 20, page: 1}),
        getAllUsersApi({role: 'supplier', search: query, limit: 20, page: 1}),
      ]);
      const buyers = buyerResp?.data?.users || buyerResp?.users || [];
      const sellers = sellerResp?.data?.users || sellerResp?.users || [];
      const seen = new Set();
      const users = [];
      for (const user of [...sellers, ...buyers]) {
        const uid = user.id || user.uid;
        const role = String(user.role || 'buyer');
        const key = `${role}:${uid}`;
        if (!uid || seen.has(key)) continue;
        seen.add(key);
        users.push(user);
      }
      setMatches(users);
      if (!users.length) {
        setLookupUid(null);
        setAccount(null);
        setLoadError('No buyers or sellers matched that search.');
      } else {
        setLoadError(null);
      }
    } catch (error) {
      setMatches([]);
      setLookupUid(null);
      setAccount(null);
      setLoadError(error?.message || 'Could not search accounts.');
    }
    setSearching(false);
  };

  const display = useMemo(() => {
    if (!account) {
      return {
        firstName: '',
        lastName: '',
        username: '',
        gardenName: '',
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
      username: account.username || '',
      gardenName: account.gardenName || '',
      email: account.email || '',
      phone: account.phone || '',
      accountClass: account.accountClass || 'US Customer',
      status: accountStatusLabel(account.status),
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
  const isActive = display.status === 'Active';
  const isBusinessAccount =
    display.accountClass === 'US Business' ||
    display.accountClass === 'Asia Business';
  const canActivateAsBusiness =
    display.accountClass === 'IleafU Inhouse' ||
    display.accountClass === 'Asia Seller';

  const activateAsBusiness = async toType => {
    const userId = account?.uid || lookupUid;
    if (!isAdminViewer || !userId || statusBusy) return;
    setStatusBusy(true);
    try {
      const result = await setB2BBusinessApi({
        uid: userId,
        enabled: true,
        toType,
        liveFlag: 'Yes',
      });
      if (!result.success) {
        throw new Error(result.error || 'Could not activate Business.');
      }
      await loadAccount(userId, 'supplier');
      const savedClass = result.data?.accountClass;
      if (savedClass && savedClass !== toType) {
        Alert.alert(
          'Saved as a different type',
          `You chose ${toType}, and the account was saved as ${savedClass}.`,
        );
      }
    } catch (error) {
      Alert.alert(
        'Could not update',
        error?.message || 'This account was not activated as a Business.',
      );
    } finally {
      setStatusBusy(false);
    }
  };

  const onActivateAsBusiness = () => {
    Alert.alert(
      'Activate as Business',
      'Choose Asia Business or US Business for this seller.',
      [
        {text: 'Cancel', style: 'cancel'},
        {text: 'Asia Business', onPress: () => activateAsBusiness('Asia Business')},
        {text: 'US Business', onPress: () => activateAsBusiness('US Business')},
      ],
    );
  };

  const onDeactivateBusiness = () => {
    const userId = account?.uid || lookupUid;
    if (!isAdminViewer || !userId || statusBusy) return;
    Alert.alert(
      'Deactivate business',
      `${display.accountClass} will be turned off for this account.`,
      [
        {text: 'Cancel', style: 'cancel'},
        {
          text: 'Deactivate',
          style: 'destructive',
          onPress: async () => {
            setStatusBusy(true);
            try {
              const result = await setB2BBusinessApi({
                uid: userId,
                enabled: false,
              });
              if (!result.success) {
                throw new Error(result.error || 'Could not deactivate Business.');
              }
              const collection =
                account?.collectionName === 'buyer' ? 'buyer' : 'supplier';
              await loadAccount(userId, collection);
            } catch (error) {
              Alert.alert(
                'Could not update',
                error?.message || 'This account is still a Business.',
              );
            } finally {
              setStatusBusy(false);
            }
          },
        },
      ],
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader
        navigation={navigation}
        title={isAdminViewer ? 'Buyer & seller account' : display.accountClass}
      />
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled">
        {isAdminViewer ? (
          <View style={styles.lookupCard}>
            <Text style={styles.section}>Look up an account</Text>
            <Text style={styles.sourceNote}>
              Search US buyers, US Business, Asia Seller, and Asia Business by
              email, name, username, or garden.
            </Text>
            <TextInput
              style={styles.searchInput}
              value={search}
              onChangeText={setSearch}
              placeholder="Search email, name, username, or garden"
              placeholderTextColor="#A9B3B7"
              autoCapitalize="none"
              autoCorrect={false}
              onSubmitEditing={onSearchBuyers}
              returnKeyType="search"
            />
            <TouchableOpacity
              style={[globalStyles.secondaryButtonAccent, searching && {opacity: 0.6}]}
              disabled={searching}
              onPress={onSearchBuyers}>
              <Text style={globalStyles.secondaryButtonButtonTextAccent}>
                {searching ? 'Searching…' : 'Search'}
              </Text>
            </TouchableOpacity>
            {matches.map(user => {
              const uid = user.id || user.uid;
              const isSeller = String(user.role || '').toLowerCase() === 'supplier';
              const label =
                user.gardenOrCompanyName ||
                user.displayName ||
                [user.firstName || user.firstname, user.lastName || user.lastname]
                  .filter(Boolean)
                  .join(' ') ||
                user.username ||
                user.email ||
                uid;
              const roleLabel = isSeller ? 'Seller' : 'Buyer';
              return (
                <TouchableOpacity
                  key={`${roleLabel}-${uid}`}
                  style={[
                    styles.matchRow,
                    lookupUid === uid && styles.matchRowOn,
                  ]}
                  onPress={() => {
                    setLookupUid(uid);
                    setLookupCollection(isSeller ? 'supplier' : 'buyer');
                    setMatches([]);
                  }}>
                  <View style={{flex: 1}}>
                    <Text style={styles.matchName}>{label}</Text>
                    <Text style={styles.matchMeta}>
                      {roleLabel}
                      {user.email ? ` · ${user.email}` : ''}
                    </Text>
                  </View>
                </TouchableOpacity>
              );
            })}
          </View>
        ) : null}

        <Text style={styles.sourceNote}>
          {loadError
            ? loadError
            : isAdminViewer && !account
              ? 'Pick a buyer or seller to see account type and selling capabilities.'
              : 'What this customer can buy and sell.'}
        </Text>

        {loading ? (
          <ActivityIndicator color="#539461" style={{marginVertical: 24}} />
        ) : !account ? null : (
          <>
            <View style={styles.hero}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>{initials || 'U'}</Text>
              </View>
              <Text style={styles.name}>
                {display.firstName} {display.lastName}
              </Text>
              {display.username ? (
                <Text style={styles.handle}>@{display.username}</Text>
              ) : display.gardenName ? (
                <Text style={styles.handle}>{display.gardenName}</Text>
              ) : null}
              <View style={styles.badgeRow}>
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{display.accountClass}</Text>
                </View>
                {!isActive ? (
                  <View style={[styles.badge, styles.badgeInactive]}>
                    <Text style={styles.badgeText}>Deactivated</Text>
                  </View>
                ) : null}
              </View>
              {isAdminViewer && canActivateAsBusiness ? (
                <TouchableOpacity
                  style={[
                    globalStyles.primaryButton,
                    styles.statusButton,
                    statusBusy && {opacity: 0.6},
                  ]}
                  disabled={statusBusy}
                  onPress={onActivateAsBusiness}>
                  <Text style={globalStyles.primaryButtonText}>
                    {statusBusy ? 'Saving…' : 'Activate'}
                  </Text>
                </TouchableOpacity>
              ) : null}
              {isAdminViewer && isBusinessAccount ? (
                <TouchableOpacity
                  style={[
                    globalStyles.primaryButton,
                    styles.statusButton,
                    statusBusy && {opacity: 0.6},
                  ]}
                  disabled={statusBusy}
                  onPress={onDeactivateBusiness}>
                  <Text style={globalStyles.primaryButtonText}>
                    {statusBusy ? 'Saving…' : 'Deactivate'}
                  </Text>
                </TouchableOpacity>
              ) : null}
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
              <>
                <View style={styles.resultBox}>
                  <Text style={styles.resultTitle}>This account is US Business</Text>
                  <Text style={styles.resultBody}>
                    Consumer purchasing stays on. Live Selling and mainstream shop
                    selling are both allowed. Require followers to create an account
                    with your code before you go live.
                  </Text>
                </View>
                {!isAdminViewer ? (
                  <TouchableOpacity
                    style={globalStyles.primaryButton}
                    onPress={async () => {
                      const merged = mergeB2BAccountIntoUserInfo(userInfo, account);
                      if (merged) {
                        setUserInfo(merged);
                        await AsyncStorage.setItem(
                          'userInfo',
                          JSON.stringify(merged),
                        );
                      }
                      await setAppShell('seller');
                    }}>
                    <Text style={globalStyles.primaryButtonText}>Open live selling</Text>
                  </TouchableOpacity>
                ) : null}
              </>
            ) : !isAdminViewer ? (
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
            ) : null}
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
  lookupCard: {
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
    backgroundColor: '#f2f7f3',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#C0DAC2',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    backgroundColor: '#fff',
    color: '#202325',
    marginBottom: 10,
  },
  matchRow: {
    marginTop: 10,
    padding: 12,
    borderRadius: 10,
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#E4E7E9',
  },
  matchRowOn: {
    borderColor: '#539461',
    backgroundColor: '#DFECDF',
  },
  matchName: {fontWeight: '700', color: '#202325'},
  matchMeta: {color: '#7F8D91', fontSize: 12, marginTop: 2},
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
  badgeInactive: {backgroundColor: '#E7522F'},
  statusButton: {
    alignSelf: 'stretch',
    alignItems: 'center',
    marginTop: 16,
  },
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
