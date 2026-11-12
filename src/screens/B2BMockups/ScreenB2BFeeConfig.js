import React, {useEffect, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {getAllUsersApi} from '../../components/Api/getAllUsersApi';
import {InputDropdownSearch} from '../../components/Input';
import {getB2BFeeConfigApi, updateB2BFeeConfigApi} from '../../components/Api/b2bFeeApi';
import {BUSINESS_COUNTRIES, BUSINESS_COUNTRY_NAMES} from '../../utils/b2bCountries';
import MockupHeader from './MockupHeader';

const emptyBusiness = {
  name: '',
  sellerCode: '',
  country: 'Philippines',
  commissionPercent: 10,
  applyLogistics: true,
  applyPlantCare: true,
};

const EMPTY_DEFAULTS = {
  commissionPercent: 10,
  logisticsSmall: 15,
  logisticsLarge: 20,
  plantCare: 5,
  cancellationFeePercent: 3.5,
  applyLogistics: true,
  applyPlantCare: true,
  backstageExpiryDays: 2,
};

const BACKSTAGE_DAY_OPTIONS = [2, 3, 4, 5];

const C = {
  ink: '#101828',
  body: '#344054',
  muted: '#667085',
  subtle: '#98A2B3',
  border: '#EAECF0',
  borderStrong: '#D0D5DD',
  canvas: '#F9FAFB',
  brand: '#2E6B3F',
  brandSoft: '#ECF5EE',
  brandMid: '#7FAF8A',
  brandLight: '#B4D2BB',
  brandPale: '#DCE9DF',
  warn: '#DC6803',
  danger: '#B42318',
  dangerSoft: '#FEF3F2',
};

const resolveSupplierCountry = supplier => {
  const raw = String(
    supplier?.country ||
      supplier?.countryName ||
      supplier?.businessCountry ||
      supplier?.accountCountry ||
      '',
  ).trim();
  if (!raw) {
    return '';
  }
  const upper = raw.toUpperCase();
  const byCode = BUSINESS_COUNTRIES.find(item => item.code === upper);
  if (byCode) {
    return byCode.name;
  }
  const byName = BUSINESS_COUNTRIES.find(
    item => item.name.toLowerCase() === raw.toLowerCase(),
  );
  return byName ? byName.name : '';
};

const ScreenB2BFeeConfig = ({navigation}) => {
  const [defaults, setDefaults] = useState(EMPTY_DEFAULTS);
  const [countries, setCountries] = useState([]);
  const [businesses, setBusinesses] = useState([]);
  const [newBusiness, setNewBusiness] = useState(emptyBusiness);
  const [live, setLive] = useState(false);
  const [loadError, setLoadError] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [gardenOptions, setGardenOptions] = useState([]);
  const [gardenByName, setGardenByName] = useState({});
  const [gardenLoading, setGardenLoading] = useState(true);
  const [savedSnapshot, setSavedSnapshot] = useState(null);

  const snapshot = JSON.stringify({defaults, countries, businesses});
  const dirty = live && savedSnapshot !== null && snapshot !== savedSnapshot;

  useEffect(() => {
    let active = true;
    const load = async () => {
      const result = await getB2BFeeConfigApi();
      if (!active) {
        return;
      }
      if (result.success && result.data?.defaults) {
        const loadedCountries = result.data.byCountry || [];
        const loadedBusinesses = result.data.byBusiness || [];
        setDefaults(result.data.defaults);
        setCountries(loadedCountries);
        setBusinesses(loadedBusinesses);
        setSavedSnapshot(
          JSON.stringify({
            defaults: result.data.defaults,
            countries: loadedCountries,
            businesses: loadedBusinesses,
          }),
        );
        setLive(true);
        setLoadError(null);
      } else {
        setLive(false);
        setCountries([]);
        setBusinesses([]);
        setLoadError(result.error || 'Could not load fee config.');
      }
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const loadGardens = async () => {
      try {
        setGardenLoading(true);
        const gardenMap = new Map();
        let currentPage = 1;
        let hasMore = true;

        while (hasMore) {
          const suppliersResp = await getAllUsersApi({
            role: 'supplier',
            limit: 100,
            page: currentPage,
          });
          const suppliers = suppliersResp?.data?.users || suppliersResp?.users || [];
          suppliers.forEach(supplier => {
            const gardenName = String(
              supplier?.gardenOrCompanyName ||
                supplier?.gardenName ||
                supplier?.companyName ||
                '',
            ).trim();
            if (!gardenName) {
              return;
            }
            const key = gardenName.toLowerCase();
            if (gardenMap.has(key)) {
              return;
            }
            gardenMap.set(key, {
              name: gardenName,
              sellerCode: supplier.uid || supplier.id || supplier.userId || '',
              country: resolveSupplierCountry(supplier),
            });
          });

          const pagination = suppliersResp?.data?.pagination;
          hasMore = pagination && currentPage < pagination.totalPages;
          if (hasMore) {
            currentPage += 1;
          }
        }

        if (!active) {
          return;
        }
        const list = Array.from(gardenMap.values()).sort((a, b) =>
          a.name.localeCompare(b.name),
        );
        const byName = {};
        list.forEach(item => {
          byName[item.name] = item;
        });
        setGardenOptions(list.map(item => item.name));
        setGardenByName(byName);
      } catch (error) {
        console.warn('B2B fee garden lookup failed:', error?.message);
        if (active) {
          setGardenOptions([]);
          setGardenByName({});
        }
      } finally {
        if (active) {
          setGardenLoading(false);
        }
      }
    };
    loadGardens();
    return () => {
      active = false;
    };
  }, []);

  const onSave = async () => {
    if (!live) {
      Alert.alert(
        'Not connected',
        'Couldn’t load fee settings. Try again in a moment.',
      );
      return;
    }
    setSaving(true);
    const result = await updateB2BFeeConfigApi({
      defaults,
      byCountry: countries,
      byBusiness: businesses,
    });
    setSaving(false);
    if (!result.success) {
      Alert.alert('Could not save', result.error);
      return;
    }
    setSavedSnapshot(snapshot);
    Alert.alert(
      'Saved',
      'Future B2B orders will use these rates. Existing payout snapshots are not recalculated.',
    );
  };

  const onSelectGarden = gardenName => {
    if (!gardenName) {
      setNewBusiness(emptyBusiness);
      return;
    }
    const selected = gardenByName[gardenName];
    setNewBusiness(prev => ({
      ...prev,
      name: gardenName,
      sellerCode: selected?.sellerCode || '',
      country: selected?.country || prev.country,
    }));
  };

  const addBusiness = () => {
    if (!newBusiness.name.trim()) {
      Alert.alert('Garden required', 'Look up and select a garden / business.');
      return;
    }
    setBusinesses(prev => [
      ...prev,
      {
        ...newBusiness,
        name: newBusiness.name.trim(),
        sellerCode: newBusiness.sellerCode || '',
      },
    ]);
    setNewBusiness(emptyBusiness);
  };

  const updateCountry = (index, patch) => {
    const next = [...countries];
    next[index] = {...next[index], ...patch};
    setCountries(next);
  };

  const updateBusiness = (index, patch) => {
    const next = [...businesses];
    next[index] = {...next[index], ...patch};
    setBusinesses(next);
  };

  const example = payoutExample(defaults);
  const share = n => `${Math.round((n / example.listed) * 100)}%`;

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader navigation={navigation} title="B2B fees" />
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <ScrollView
        contentContainerStyle={styles.content}
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets
        keyboardDismissMode="interactive">
        <View style={styles.pageHead}>
          <Text style={styles.pageTitle}>Fee configuration</Text>
          <Text style={styles.pageSub}>
            Commission and deductions for B2B seller payouts. Changes apply to new orders only.
          </Text>
        </View>

        {loadError ? (
          <View style={styles.errorBanner}>
            <Text style={styles.errorTitle}>Couldn’t load fee settings</Text>
            <Text style={styles.errorText}>Try again in a moment. Saving is disabled.</Text>
          </View>
        ) : null}

        {loading ? (
          <View style={styles.loadingBox}>
            <ActivityIndicator color={C.brand} />
            <Text style={styles.loadingText}>Loading fee settings…</Text>
          </View>
        ) : (
          <>
            <View style={styles.card}>
              <View style={styles.previewHead}>
                <Text style={styles.cardTitle}>Payout preview</Text>
                <Text style={styles.previewTag}>{'$100 listing · 4" pot'}</Text>
              </View>

              <View style={styles.bar}>
                <BarPart value={example.net} total={example.listed} color={C.brand} />
                <BarPart value={example.commission} total={example.listed} color={C.brandMid} />
                <BarPart value={example.logistics} total={example.listed} color={C.brandLight} />
                <BarPart value={example.plantCare} total={example.listed} color={C.brandPale} />
              </View>

              <LegendRow
                color={C.brandMid}
                label={`Commission (${trimNumber(defaults.commissionPercent)}%)`}
                value={`−${money(example.commission)}`}
                share={share(example.commission)}
              />
              <LegendRow
                color={C.brandLight}
                label="Logistics"
                value={example.logistics ? `−${money(example.logistics)}` : 'Not deducted'}
                share={example.logistics ? share(example.logistics) : ''}
              />
              <LegendRow
                color={C.brandPale}
                label="Plant care"
                value={example.plantCare ? `−${money(example.plantCare)}` : 'Not deducted'}
                share={example.plantCare ? share(example.plantCare) : ''}
              />
              <View style={styles.netRow}>
                <View style={styles.legendLeft}>
                  <View style={[styles.legendDot, {backgroundColor: C.brand}]} />
                  <Text style={styles.netLabel}>Net payout to seller</Text>
                </View>
                <Text style={styles.netValue}>{money(example.net)}</Text>
              </View>
              <Text style={styles.previewFoot}>
                Missing or damaged plant: {trimNumber(defaults.cancellationFeePercent)}% of (listed −
                logistics − plant care) = {money(example.cancellation)}
              </Text>
            </View>

            <SectionHead
              title="Default rates"
              subtitle="Applied to every business unless a country or business rate overrides it."
            />
            <View style={styles.card}>
              <FieldRow
                first
                label="Commission"
                help="Percent of listed price"
                unit="%"
                value={defaults.commissionPercent}
                onChange={commissionPercent => setDefaults({...defaults, commissionPercent})}
              />
              <FieldRow
                label={'Logistics, 2"–4" pot'}
                help="Per plant"
                unit="$"
                value={defaults.logisticsSmall}
                onChange={logisticsSmall => setDefaults({...defaults, logisticsSmall})}
              />
              <FieldRow
                label={'Logistics, 6" pot'}
                help="Per plant"
                unit="$"
                value={defaults.logisticsLarge}
                onChange={logisticsLarge => setDefaults({...defaults, logisticsLarge})}
              />
              <FieldRow
                label="Plant care"
                help="Per plant"
                unit="$"
                value={defaults.plantCare}
                onChange={plantCare => setDefaults({...defaults, plantCare})}
              />
              <FieldRow
                label="Missing / damaged fee"
                help="Of listed − logistics − plant care"
                unit="%"
                value={defaults.cancellationFeePercent}
                onChange={cancellationFeePercent =>
                  setDefaults({...defaults, cancellationFeePercent})
                }
              />
              <ToggleRow
                label="Deduct logistics"
                help="Subtract logistics from the seller payout"
                value={defaults.applyLogistics}
                onChange={applyLogistics => setDefaults({...defaults, applyLogistics})}
              />
              <ToggleRow
                label="Deduct plant care"
                help="Subtract plant care from the seller payout"
                value={defaults.applyPlantCare}
                onChange={applyPlantCare => setDefaults({...defaults, applyPlantCare})}
              />
            </View>

            <SectionHead
              title="After Live Backstage"
              subtitle="How long unpaid live plants stay in Backstage. Applies to live sales that have not started."
            />
            <View style={[styles.card, styles.cardPadded]}>
              <View style={styles.segment}>
                {BACKSTAGE_DAY_OPTIONS.map(days => {
                  const on = Number(defaults.backstageExpiryDays || 2) === days;
                  return (
                    <TouchableOpacity
                      key={days}
                      style={[styles.segmentItem, on && styles.segmentItemOn]}
                      onPress={() => setDefaults({...defaults, backstageExpiryDays: days})}>
                      <Text style={[styles.segmentText, on && styles.segmentTextOn]}>
                        {days} days
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>
            </View>

            <SectionHead
              title="Country rates"
              subtitle="Override the default commission and deductions per seller country."
            />
            <View style={styles.card}>
              <TableHead first="Country" />
              {countries.length === 0 ? (
                <Text style={styles.empty}>No country rates configured.</Text>
              ) : (
                countries.map((row, index) => (
                  <RateRow
                    key={row.country}
                    flag={flagFor(row.country)}
                    title={row.country}
                    row={row}
                    onChange={patch => updateCountry(index, patch)}
                  />
                ))
              )}
            </View>

            <SectionHead
              title="Business rates"
              subtitle="Override country and default rates for a single garden."
            />
            <View style={styles.card}>
              <TableHead first="Business" />
              {businesses.length === 0 ? (
                <Text style={styles.empty}>No business rates configured.</Text>
              ) : (
                businesses.map((row, index) => (
                  <RateRow
                    key={`${row.name}-${index}`}
                    flag={flagFor(row.country)}
                    title={row.name}
                    subtitle={row.country}
                    row={row}
                    onChange={patch => updateBusiness(index, patch)}
                  />
                ))
              )}

              <View style={styles.addSection}>
                <Text style={styles.addTitle}>Add business rate</Text>
                <Text style={styles.label}>Garden</Text>
                <InputDropdownSearch
                  options={gardenOptions}
                  selectedOption={newBusiness.name}
                  onSelect={onSelectGarden}
                  clearable
                  placeholder={
                    gardenLoading ? 'Loading gardens…' : 'Search garden'
                  }
                  disabled={gardenLoading}
                />
                <Text style={[styles.label, styles.labelGap]}>Country</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.chipScroll}>
                  {BUSINESS_COUNTRY_NAMES.map(country => {
                    const on = newBusiness.country === country;
                    return (
                      <TouchableOpacity
                        key={country}
                        style={[styles.chip, on && styles.chipOn]}
                        onPress={() => setNewBusiness({...newBusiness, country})}>
                        <Text style={[styles.chipText, on && styles.chipTextOn]}>
                          {flagFor(country)}  {country}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </ScrollView>
                <View style={styles.addCommission}>
                  <Text style={styles.fieldLabel}>Commission</Text>
                  <ValueInput
                    unit="%"
                    value={newBusiness.commissionPercent}
                    onChange={commissionPercent =>
                      setNewBusiness({...newBusiness, commissionPercent})
                    }
                  />
                </View>
                <TouchableOpacity style={styles.addButton} onPress={addBusiness}>
                  <Text style={styles.addButtonText}>Add rate</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}
      </ScrollView>
      {!loading ? (
        <View style={styles.footer}>
          <View style={styles.footerStatus}>
            <View
              style={[
                styles.statusDot,
                {backgroundColor: !live ? C.subtle : dirty ? C.warn : C.brand},
              ]}
            />
            <Text style={styles.statusText}>
              {!live ? 'Not connected' : dirty ? 'Unsaved changes' : 'All changes saved'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.saveButton, (!dirty || saving) && styles.saveButtonOff]}
            disabled={!dirty || saving}
            onPress={onSave}>
            {saving ? <ActivityIndicator color="#fff" size="small" style={styles.saveSpinner} /> : null}
            <Text style={styles.saveText}>{saving ? 'Saving…' : 'Save changes'}</Text>
          </TouchableOpacity>
        </View>
      ) : null}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const round2 = n => Math.round(n * 100) / 100;

const money = n => `$${round2(n).toFixed(2)}`;

const trimNumber = n => String(Number(n) || 0);

const flagFor = country =>
  BUSINESS_COUNTRIES.find(item => item.name === country)?.flag || '🌐';

const payoutExample = d => {
  const listed = 100;
  const commission = listed * ((Number(d.commissionPercent) || 0) / 100);
  const logistics = d.applyLogistics ? Number(d.logisticsSmall) || 0 : 0;
  const plantCare = d.applyPlantCare ? Number(d.plantCare) || 0 : 0;
  const cancellation =
    (listed - (Number(d.logisticsSmall) || 0) - (Number(d.plantCare) || 0)) *
    ((Number(d.cancellationFeePercent) || 0) / 100);
  return {
    listed,
    commission,
    logistics,
    plantCare,
    net: Math.max(0, listed - commission - logistics - plantCare),
    cancellation: Math.max(0, cancellation),
  };
};

const SectionHead = ({title, subtitle}) => (
  <View style={styles.sectionHead}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle ? <Text style={styles.sectionSub}>{subtitle}</Text> : null}
  </View>
);

const BarPart = ({value, total, color}) =>
  value > 0 ? <View style={{flex: value / total, backgroundColor: color}} /> : null;

const LegendRow = ({color, label, value, share}) => (
  <View style={styles.legendRow}>
    <View style={styles.legendLeft}>
      <View style={[styles.legendDot, {backgroundColor: color}]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
    <Text style={styles.legendShare}>{share}</Text>
    <Text style={styles.legendValue}>{value}</Text>
  </View>
);

const ValueInput = ({unit, value, onChange, compact}) => (
  <View style={[styles.valueBox, compact && styles.valueBoxCompact]}>
    {unit === '$' ? <Text style={styles.valueUnit}>$</Text> : null}
    <TextInput
      style={styles.valueInput}
      keyboardType="decimal-pad"
      value={String(value)}
      onChangeText={v => onChange(Number(v) || 0)}
      selectTextOnFocus
    />
    {unit === '%' ? <Text style={styles.valueUnit}>%</Text> : null}
  </View>
);

const FieldRow = ({first, label, help, unit, value, onChange}) => (
  <View style={[styles.row, !first && styles.rowBorder]}>
    <View style={styles.rowText}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {help ? <Text style={styles.fieldHelp}>{help}</Text> : null}
    </View>
    <ValueInput unit={unit} value={value} onChange={onChange} />
  </View>
);

const ToggleRow = ({label, help, value, onChange}) => (
  <View style={[styles.row, styles.rowBorder]}>
    <View style={styles.rowText}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {help ? <Text style={styles.fieldHelp}>{help}</Text> : null}
    </View>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{false: C.borderStrong, true: C.brandMid}}
      thumbColor={value ? C.brand : '#fff'}
    />
  </View>
);

const TableHead = ({first}) => (
  <View style={styles.tableHead}>
    <Text style={[styles.th, styles.colName]}>{first.toUpperCase()}</Text>
    <Text style={[styles.th, styles.colRate]}>RATE</Text>
    <Text style={[styles.th, styles.colCheck]} numberOfLines={1}>LOGISTICS</Text>
    <Text style={[styles.th, styles.colCheck]} numberOfLines={1}>CARE</Text>
  </View>
);

const Checkbox = ({on, onPress}) => (
  <TouchableOpacity
    style={styles.colCheck}
    onPress={onPress}
    hitSlop={8}
    accessibilityRole="checkbox"
    accessibilityState={{checked: on}}>
    <View style={[styles.checkbox, on && styles.checkboxOn]}>
      {on ? <Text style={styles.checkmark}>✓</Text> : null}
    </View>
  </TouchableOpacity>
);

const RateRow = ({flag, title, subtitle, row, onChange}) => {
  const logistics = row.applyLogistics !== false;
  const plantCare = row.applyPlantCare !== false;
  return (
    <View style={styles.tableRow}>
      <View style={[styles.colName, styles.nameCell]}>
        <Text style={styles.flag}>{flag}</Text>
        <View style={styles.nameText}>
          <Text style={styles.cellTitle} numberOfLines={1}>{title}</Text>
          {subtitle ? <Text style={styles.cellSub} numberOfLines={1}>{subtitle}</Text> : null}
        </View>
      </View>
      <View style={styles.colRate}>
        <ValueInput
          compact
          unit="%"
          value={row.commissionPercent}
          onChange={commissionPercent => onChange({commissionPercent})}
        />
      </View>
      <Checkbox on={logistics} onPress={() => onChange({applyLogistics: !logistics})} />
      <Checkbox on={plantCare} onPress={() => onChange({applyPlantCare: !plantCare})} />
    </View>
  );
};

const tabular = {fontVariant: ['tabular-nums']};

const styles = StyleSheet.create({
  safe: {flex: 1, backgroundColor: C.canvas},
  flex: {flex: 1},
  content: {padding: 16, paddingBottom: 32},
  pageHead: {marginBottom: 16},
  pageTitle: {fontSize: 22, fontWeight: '700', color: C.ink, letterSpacing: -0.3},
  pageSub: {fontSize: 13, lineHeight: 19, color: C.muted, marginTop: 4},
  errorBanner: {
    backgroundColor: C.dangerSoft,
    borderWidth: 1,
    borderColor: '#FECDCA',
    borderRadius: 10,
    padding: 12,
    marginBottom: 16,
  },
  errorTitle: {color: C.danger, fontSize: 13, fontWeight: '700'},
  errorText: {color: C.danger, fontSize: 12, marginTop: 2},
  loadingBox: {alignItems: 'center', paddingVertical: 48},
  loadingText: {color: C.muted, fontSize: 13, marginTop: 10},
  card: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    marginBottom: 24,
    overflow: 'hidden',
    shadowColor: C.ink,
    shadowOpacity: 0.04,
    shadowRadius: 3,
    shadowOffset: {width: 0, height: 1},
    elevation: 1,
  },
  cardPadded: {padding: 12},
  cardTitle: {fontSize: 15, fontWeight: '700', color: C.ink},
  previewHead: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16,
  },
  previewTag: {
    fontSize: 11,
    fontWeight: '600',
    color: C.body,
    backgroundColor: C.canvas,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
    overflow: 'hidden',
  },
  bar: {
    flexDirection: 'row',
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
    backgroundColor: C.canvas,
    marginHorizontal: 16,
    marginTop: 16,
    marginBottom: 8,
  },
  legendRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 7,
  },
  legendLeft: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  legendDot: {width: 8, height: 8, borderRadius: 2, marginRight: 10},
  legendLabel: {fontSize: 13, color: C.body},
  legendShare: {fontSize: 12, color: C.subtle, width: 44, textAlign: 'right', ...tabular},
  legendValue: {
    fontSize: 13,
    fontWeight: '600',
    color: C.ink,
    width: 96,
    textAlign: 'right',
    ...tabular,
  },
  netRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 6,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  netLabel: {fontSize: 14, fontWeight: '700', color: C.ink},
  netValue: {fontSize: 22, fontWeight: '700', color: C.brand, letterSpacing: -0.3, ...tabular},
  previewFoot: {
    fontSize: 12,
    lineHeight: 17,
    color: C.muted,
    backgroundColor: C.canvas,
    borderTopWidth: 1,
    borderTopColor: C.border,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  sectionHead: {marginBottom: 8, paddingHorizontal: 2},
  sectionTitle: {fontSize: 12, fontWeight: '700', color: C.muted, letterSpacing: 0.6, textTransform: 'uppercase'},
  sectionSub: {fontSize: 12, lineHeight: 17, color: C.subtle, marginTop: 2},
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    minHeight: 60,
  },
  rowBorder: {borderTopWidth: 1, borderTopColor: C.border},
  rowText: {flex: 1, paddingRight: 12},
  fieldLabel: {fontSize: 14, fontWeight: '600', color: C.ink},
  fieldHelp: {fontSize: 12, color: C.muted, marginTop: 2},
  valueBox: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 108,
    height: 40,
    borderWidth: 1,
    borderColor: C.borderStrong,
    borderRadius: 8,
    paddingHorizontal: 10,
    backgroundColor: '#fff',
  },
  valueBoxCompact: {width: 60, height: 34, paddingHorizontal: 6},
  valueUnit: {fontSize: 14, color: C.muted, fontWeight: '500'},
  valueInput: {
    flex: 1,
    textAlign: 'right',
    fontSize: 15,
    fontWeight: '600',
    color: C.ink,
    paddingVertical: 0,
    paddingHorizontal: 4,
    ...tabular,
  },
  segment: {
    flexDirection: 'row',
    backgroundColor: '#F2F4F7',
    borderRadius: 8,
    padding: 3,
  },
  segmentItem: {flex: 1, alignItems: 'center', paddingVertical: 8, borderRadius: 6},
  segmentItemOn: {
    backgroundColor: '#fff',
    shadowColor: C.ink,
    shadowOpacity: 0.1,
    shadowRadius: 2,
    shadowOffset: {width: 0, height: 1},
    elevation: 2,
  },
  segmentText: {fontSize: 13, fontWeight: '600', color: C.muted},
  segmentTextOn: {color: C.ink},
  tableHead: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: C.canvas,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  th: {fontSize: 9, fontWeight: '700', color: C.muted, letterSpacing: 0.2},
  colName: {flex: 1},
  colRate: {width: 68, alignItems: 'center', textAlign: 'center'},
  colCheck: {width: 58, alignItems: 'center', textAlign: 'center'},
  tableRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  nameCell: {flexDirection: 'row', alignItems: 'center', paddingRight: 6},
  flag: {fontSize: 18, marginRight: 8},
  nameText: {flex: 1},
  cellTitle: {fontSize: 14, fontWeight: '600', color: C.ink},
  cellSub: {fontSize: 11, color: C.muted, marginTop: 1},
  checkbox: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: C.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  checkboxOn: {backgroundColor: C.brand, borderColor: C.brand},
  checkmark: {color: '#fff', fontSize: 12, fontWeight: '800', lineHeight: 14},
  empty: {
    color: C.subtle,
    fontSize: 13,
    textAlign: 'center',
    paddingVertical: 18,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  addSection: {padding: 16, backgroundColor: '#fff'},
  addTitle: {fontSize: 14, fontWeight: '700', color: C.ink, marginBottom: 12},
  label: {fontSize: 12, fontWeight: '600', color: C.body, marginBottom: 6},
  labelGap: {marginTop: 14},
  chipScroll: {flexGrow: 0},
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 7,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.borderStrong,
    backgroundColor: '#fff',
    marginRight: 8,
  },
  chipOn: {backgroundColor: C.brandSoft, borderColor: C.brand},
  chipText: {fontSize: 12, fontWeight: '600', color: C.body},
  chipTextOn: {color: C.brand},
  addCommission: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 16,
    marginBottom: 16,
  },
  addButton: {
    height: 42,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: C.borderStrong,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  addButtonText: {fontSize: 14, fontWeight: '600', color: C.body},
  footer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 24,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: C.border,
  },
  footerStatus: {flex: 1, flexDirection: 'row', alignItems: 'center'},
  statusDot: {width: 8, height: 8, borderRadius: 4, marginRight: 8},
  statusText: {fontSize: 13, color: C.body, fontWeight: '500'},
  saveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 44,
    paddingHorizontal: 20,
    borderRadius: 8,
    backgroundColor: C.brand,
  },
  saveButtonOff: {opacity: 0.45},
  saveSpinner: {marginRight: 8},
  saveText: {color: '#fff', fontSize: 14, fontWeight: '700'},
});

export default ScreenB2BFeeConfig;
