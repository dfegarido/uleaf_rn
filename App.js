/**
 * Sample React Native App
 * https://github.com/facebook/react-native
 *
 * @format
 * @flow
 */

import React from 'react';
import {SafeAreaView, StyleSheet, Text} from 'react-native';
import AppNavigation from './src/components/AppNavigation';
import {AuthProvider} from './src/auth/AuthProvider';

const App = () => {
  return (
    <AuthProvider>
      <AppNavigation />
    </AuthProvider>
  );
};

export default App;
