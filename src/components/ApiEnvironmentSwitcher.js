import React from 'react';
import { View, Text, Switch, StyleSheet, Alert } from 'react-native';
import { setApiEnvironment, getCurrentApiEnvironment } from '../config/apiConfig';

/**
 * Development-only component to switch between local and production APIs
 * This should be removed or hidden in production builds
 */
export const ApiEnvironmentSwitcher = () => {
  const [apiEnv, setApiEnv] = React.useState(getCurrentApiEnvironment());

  const handleToggle = (value) => {
    Alert.alert(
      'Switch API Environment',
      `Are you sure you want to switch to ${value ? 'LOCAL DEVELOPMENT' : 'PRODUCTION'} APIs?`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Confirm',
          onPress: () => {
            setApiEnvironment(value);
            setApiEnv(getCurrentApiEnvironment());
          },
        },
      ]
    );
  };

  // Hide in production builds
  if (__DEV__ === false) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>🔧 API Environment</Text>
      <View style={styles.row}>
        <Text style={styles.label}>
          {apiEnv.environment}
        </Text>
        <Switch
          value={apiEnv.isLocal}
          onValueChange={handleToggle}
          trackColor={{ false: '#767577', true: '#81b0ff' }}
          thumbColor={apiEnv.isLocal ? '#f5dd4b' : '#f4f3f4'}
        />
      </View>
      <Text style={styles.url}>{apiEnv.baseUrl}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f0f0',
    padding: 12,
    margin: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  title: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  label: {
    fontSize: 12,
    fontWeight: '600',
    color: '#333',
  },
  url: {
    fontSize: 10,
    color: '#666',
    fontFamily: 'monospace',
  },
});

export default ApiEnvironmentSwitcher;
