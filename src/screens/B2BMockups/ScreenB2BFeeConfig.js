import React, {useEffect, useMemo, useState} from 'react';
import {
  ActivityIndicator,
  Alert,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {globalStyles} from '../../assets/styles/styles';
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

  useEffect(() => {
    let active = true;
    const load = async () => {
      const result = await getB2BFeeConfigApi();
      if (!active) {
        return;
      }
      if (result.success && result.data?.defaults) {
        setDefaults(result.data.defaults);
        setCountries(result.data.byCountry || []);
        setBusinesses(result.data.byBusiness || []);
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

  const selectedGardenHint = useMemo(() => {
    if (!newBusiness.name) {
      return null;
    }
    if (newBusiness.sellerCode) {
      return `Selected garden · seller ${newBusiness.sellerCode.slice(0, 8)}…`;
    }
    return 'Selected garden';
  }, [newBusiness.name, newBusiness.sellerCode]);

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader navigation={navigation} title="B2B fees" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sourceNote}>
          {loadError
            ? 'Couldn’t load fee settings. Try again in a moment.'
            : 'These rates apply to new orders. Existing payouts are not recalculated.'}
        </Text>
        <Text style={styles.formula}>
          Listed USD − Commission − Logistics − Plant Care = Net Payout{'\n'}
          Missing/damaged: − {defaults.cancellationFeePercent}% of (Listed − Logistics − Plant Care)
        </Text>

        {loading ? (
          <ActivityIndicator color="#539461" style={{marginVertical: 24}} />
        ) : (
          <>
            <Text style={styles.section}>All businesses (default)</Text>
            <View style={styles.card}>
              <Field
                label="Commission %"
                value={String(defaults.commissionPercent)}
                onChange={v => setDefaults({...defaults, commissionPercent: Number(v) || 0})}
              />
              <Field
                label={'Logistics 2"–4" ($)'}
                value={String(defaults.logisticsSmall)}
                onChange={v => setDefaults({...defaults, logisticsSmall: Number(v) || 0})}
              />
              <Field
                label={'Logistics 6" ($)'}
                value={String(defaults.logisticsLarge)}
                onChange={v => setDefaults({...defaults, logisticsLarge: Number(v) || 0})}
              />
              <Field
                label="Plant Care ($)"
                value={String(defaults.plantCare)}
                onChange={v => setDefaults({...defaults, plantCare: Number(v) || 0})}
              />
              <Field
                label="Missing/damaged % of (listed − logistics − plant care)"
                value={String(defaults.cancellationFeePercent)}
                onChange={v =>
                  setDefaults({...defaults, cancellationFeePercent: Number(v) || 0})
                }
              />
              <Toggle
                label="Deduct logistics from payout"
                value={defaults.applyLogistics}
                onChange={applyLogistics => setDefaults({...defaults, applyLogistics})}
              />
              <Toggle
                label="Deduct plant care from payout"
                value={defaults.applyPlantCare}
                onChange={applyPlantCare => setDefaults({...defaults, applyPlantCare})}
              />
            </View>

            <Text style={styles.section}>By country</Text>
            <View style={styles.card}>
              {countries.map((row, index) => (
                <View key={row.country} style={styles.countryBlock}>
                  <View style={styles.inlineRow}>
                    <Text style={styles.inlineLabel}>{row.country}</Text>
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="decimal-pad"
                      value={String(row.commissionPercent)}
                      onChangeText={v => {
                        const next = [...countries];
                        next[index] = {...row, commissionPercent: Number(v) || 0};
                        setCountries(next);
                      }}
                    />
                    <Text style={styles.suffix}>%</Text>
                  </View>
                  <Toggle
                    label="Apply logistics"
                    value={row.applyLogistics !== false}
                    onChange={applyLogistics => {
                      const next = [...countries];
                      next[index] = {...row, applyLogistics};
                      setCountries(next);
                    }}
                  />
                  <Toggle
                    label="Apply plant care"
                    value={row.applyPlantCare !== false}
                    onChange={applyPlantCare => {
                      const next = [...countries];
                      next[index] = {...row, applyPlantCare};
                      setCountries(next);
                    }}
                  />
                </View>
              ))}
            </View>

            <Text style={styles.section}>By business</Text>
            <View style={styles.card}>
              {businesses.map((row, index) => (
                <View key={`${row.name}-${index}`} style={styles.bizBlock}>
                  <View style={styles.bizRow}>
                    <View style={{flex: 1}}>
                      <Text style={styles.bizName}>{row.name}</Text>
                      <Text style={styles.bizCountry}>
                        {row.country}
                        {row.sellerCode ? ` · ${row.sellerCode.slice(0, 8)}…` : ''}
                      </Text>
                    </View>
                    <TextInput
                      style={styles.smallInput}
                      keyboardType="decimal-pad"
                      value={String(row.commissionPercent)}
                      onChangeText={v => {
                        const next = [...businesses];
                        next[index] = {...row, commissionPercent: Number(v) || 0};
                        setBusinesses(next);
                      }}
                    />
                    <Text style={styles.suffix}>%</Text>
                  </View>
                  <Toggle
                    label="Apply logistics"
                    value={row.applyLogistics !== false}
                    onChange={applyLogistics => {
                      const next = [...businesses];
                      next[index] = {...row, applyLogistics};
                      setBusinesses(next);
                    }}
                  />
                  <Toggle
                    label="Apply plant care"
                    value={row.applyPlantCare !== false}
                    onChange={applyPlantCare => {
                      const next = [...businesses];
                      next[index] = {...row, applyPlantCare};
                      setBusinesses(next);
                    }}
                  />
                </View>
              ))}

              <Text style={styles.addTitle}>Add business override</Text>
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Business / garden name</Text>
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
                {selectedGardenHint ? (
                  <Text style={styles.gardenHint}>{selectedGardenHint}</Text>
                ) : null}
              </View>
              <Text style={styles.fieldLabel}>Country</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.countryChips}>
                {BUSINESS_COUNTRY_NAMES.map(country => (
                  <TouchableOpacity
                    key={country}
                    style={[
                      styles.chip,
                      newBusiness.country === country && styles.chipOn,
                    ]}
                    onPress={() => setNewBusiness({...newBusiness, country})}>
                    <Text
                      style={[
                        styles.chipText,
                        newBusiness.country === country && styles.chipTextOn,
                      ]}>
                      {country}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
              <Field
                label="Commission %"
                value={String(newBusiness.commissionPercent)}
                onChange={v =>
                  setNewBusiness({...newBusiness, commissionPercent: Number(v) || 0})
                }
              />
              <TouchableOpacity style={globalStyles.secondaryButtonAccent} onPress={addBusiness}>
                <Text style={globalStyles.secondaryButtonButtonTextAccent}>
                  Add business rate
                </Text>
              </TouchableOpacity>
            </View>

            <TouchableOpacity
              style={globalStyles.primaryButton}
              disabled={saving}
              onPress={onSave}>
              <Text style={globalStyles.primaryButtonText}>
                {saving ? 'Saving…' : 'Save configuration'}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>
    </SafeAreaView>
  );
};

const Field = ({label, value, onChange, keyboardType = 'decimal-pad'}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput
      style={styles.input}
      keyboardType={keyboardType}
      value={value}
      onChangeText={onChange}
    />
  </View>
);

const Toggle = ({label, value, onChange}) => (
  <View style={styles.toggleRow}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <Switch
      value={value}
      onValueChange={onChange}
      trackColor={{false: '#CDD3D4', true: '#C0DAC2'}}
      thumbColor={value ? '#539461' : '#f4f3f4'}
    />
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
  formula: {
    backgroundColor: '#202325',
    color: '#fff',
    borderRadius: 10,
    padding: 14,
    fontSize: 13,
    lineHeight: 20,
    marginBottom: 20,
    overflow: 'hidden',
  },
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
    marginBottom: 20,
  },
  field: {marginBottom: 12},
  fieldLabel: {color: '#556065', fontSize: 13, marginBottom: 6},
  input: {
    borderWidth: 1,
    borderColor: '#E0E5DB',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 16,
    color: '#202325',
  },
  toggleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
    marginBottom: 8,
  },
  countryBlock: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F2',
    marginBottom: 10,
    paddingBottom: 6,
  },
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inlineLabel: {flex: 1, color: '#202325', fontWeight: '600'},
  smallInput: {
    width: 64,
    borderWidth: 1,
    borderColor: '#E0E5DB',
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 8,
    textAlign: 'center',
    color: '#202325',
    fontWeight: '700',
  },
  suffix: {marginLeft: 6, color: '#7F8D91', fontWeight: '600'},
  bizBlock: {
    borderBottomWidth: 1,
    borderBottomColor: '#F0F2F2',
    marginBottom: 12,
    paddingBottom: 8,
  },
  bizRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 8},
  bizName: {fontWeight: '700', color: '#202325'},
  bizCountry: {color: '#7F8D91', fontSize: 12},
  addTitle: {fontWeight: '700', color: '#202325', marginTop: 8, marginBottom: 10},
  gardenHint: {marginTop: 6, color: '#7F8D91', fontSize: 12},
  countryChips: {marginBottom: 12, flexGrow: 0},
  chip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 16,
    backgroundColor: '#F5F6F6',
    marginRight: 8,
  },
  chipOn: {backgroundColor: '#539461'},
  chipText: {color: '#556065', fontSize: 12, fontWeight: '600'},
  chipTextOn: {color: '#fff'},
});

export default ScreenB2BFeeConfig;
