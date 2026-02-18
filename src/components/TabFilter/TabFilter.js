import React, {useEffect, useState} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';

const TabFilter = ({tabFilters, activeTab, setActiveTab, onPressTab, disabled}) => {
  return (
    <View
      style={{
        borderBottomColor: '#CDD3D4',
        borderBottomWidth: 1,
        paddingHorizontal: 10,
      }}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{flexGrow: 0}}
        contentContainerStyle={{
          flexDirection: 'row',
          gap: 10,
          alignItems: 'flex-start',
        }}>
        {tabFilters.map((parseTabFilters, index) => {
          const isActive = activeTab === parseTabFilters.filterKey;
          const isDisabled = disabled && !isActive;
          return (
            <TouchableOpacity
              key={index}
              disabled={isDisabled}
              onPress={() => onPressTab({pressTab: parseTabFilters.filterKey})}
              style={{
                flexDirection: 'row',
                paddingHorizontal: 20,
                paddingVertical: 10,
                borderBottomColor: '#202325',
                borderBottomWidth: isActive ? 2 : 0,
                opacity: isDisabled ? 0.4 : 1,
              }}>
              <Text style={globalStyles.textSMGreyDark}>
                {parseTabFilters.filterKey}
              </Text>
            </TouchableOpacity>
          );
        })}
      </ScrollView>
    </View>
  );
};

export default TabFilter;
