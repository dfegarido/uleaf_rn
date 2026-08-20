import React, {useState} from 'react';
import {Alert, ScrollView, StyleSheet, Switch, Text, TextInput, TouchableOpacity, View} from 'react-native';
import {SafeAreaView} from 'react-native-safe-area-context';
import {globalStyles} from '../../assets/styles/styles';
import MockupHeader from './MockupHeader';
import {SAMPLE_FEE_CONFIG} from './mockData';

const ScreenB2BFeeConfig = ({navigation}) => {
  const [defaults, setDefaults] = useState(SAMPLE_FEE_CONFIG.defaults);
  const [countries, setCountries] = useState(SAMPLE_FEE_CONFIG.byCountry);
  const [businesses, setBusinesses] = useState(SAMPLE_FEE_CONFIG.byBusiness);

  const onSave = () => {
    Alert.alert(
      'Saved (mockup)',
      'New orders would use these rates. Existing payout records would not be recalculated.',
    );
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top', 'left', 'right']}>
      <MockupHeader navigation={navigation} title="B2B fees" />
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.formula}>
          Listed USD − Commission − Logistics − Plant Care = Net Payout{'\n'}
          Missing/damaged: − Listed USD × {defaults.cancellationFeePercent}% cancellation
        </Text>

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
            <View key={row.country} style={styles.inlineRow}>
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
          ))}
        </View>

        <Text style={styles.section}>By business</Text>
        <View style={styles.card}>
          {businesses.map((row, index) => (
            <View key={row.name} style={styles.bizRow}>
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
          ))}
        </View>

        <TouchableOpacity style={globalStyles.primaryButton} onPress={onSave}>
          <Text style={globalStyles.primaryButtonText}>Save configuration</Text>
        </TouchableOpacity>
      </ScrollView>
    </SafeAreaView>
  );
};

const Field = ({label, value, onChange}) => (
  <View style={styles.field}>
    <Text style={styles.fieldLabel}>{label}</Text>
    <TextInput style={styles.input} keyboardType="decimal-pad" value={value} onChangeText={onChange} />
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
  inlineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  inlineLabel: {flex: 1, color: '#202325'},
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
  bizRow: {flexDirection: 'row', alignItems: 'center', marginBottom: 12},
  bizName: {fontWeight: '700', color: '#202325'},
  bizCountry: {color: '#7F8D91', fontSize: 12},
});

export default ScreenB2BFeeConfig;
