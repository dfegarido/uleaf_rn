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
import {FilterProvider} from './src/context/FilterContext';

const App = () => {
  return (
    <AuthProvider>
      <FilterProvider>
        <AppNavigation />
      </FilterProvider>
    </AuthProvider>
  );
};

export default App;
