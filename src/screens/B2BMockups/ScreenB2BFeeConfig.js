import React, {useEffect, useState} from 'react';
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
import {getB2BFeeConfigApi, updateB2BFeeConfigApi} from '../../components/Api/b2bFeeApi';
import {BUSINESS_COUNTRY_NAMES} from '../../utils/b2bCountries';
import MockupHeader from './MockupHeader';
import {SAMPLE_FEE_CONFIG} from './mockData';

const emptyBusiness = {
  name: '',
  country: 'Philippines',
  commissionPercent: 10,
  applyLogistics: true,
  applyPlantCare: true,
};

const ScreenB2BFeeConfig = ({navigation}) => {
  const [defaults, setDefaults] = useState(SAMPLE_FEE_CONFIG.defaults);
  const [countries, setCountries] = useState(SAMPLE_FEE_CONFIG.byCountry);
  const [businesses, setBusinesses] = useState(SAMPLE_FEE_CONFIG.byBusiness);
  const [newBusiness, setNewBusiness] = useState(emptyBusiness);
  const [usingSample, setUsingSample] = useState(true);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

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
        setUsingSample(false);
      } else {
        setUsingSample(true);
      }
      setLoading(false);
    };
    load();
    return () => {
      active = false;
    };
  }, []);

  const onSave = async () => {
    if (usingSample) {
      Alert.alert(
        'Saved (sample)',
        'Start the functions emulator on this branch to persist commission and fees. Existing payout snapshots would not be recalculated.',
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

  const addBusiness = () => {
    if (!newBusiness.name.trim()) {
      Alert.alert('Business name required', 'Enter a garden / business name.');
      return;
    }
    setBusinesses(prev => [...prev, {...newBusiness, name: newBusiness.name.trim()}]);
    setNewBusiness(emptyBusiness);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader navigation={navigation} title="B2B fees" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.sourceNote}>
          {usingSample
            ? 'Sample configuration — start the functions emulator on this branch to save live rates. Nothing is deployed.'
            : 'Live `b2bFeeConfig`. Changes apply to future orders only.'}
        </Text>
        <Text style={styles.formula}>
          Listed USD − Commission − Logistics − Plant Care = Net Payout{'\n'}
          Missing/damaged: − Listed USD × {defaults.cancellationFeePercent}% cancellation
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
                label="Missing/damaged cancellation % of listed USD"
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
                      <Text style={styles.bizCountry}>{row.country}</Text>
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
              <Field
                label="Business / garden name"
                value={newBusiness.name}
                onChange={name => setNewBusiness({...newBusiness, name})}
                keyboardType="default"
              />
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
