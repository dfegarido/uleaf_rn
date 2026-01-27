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

const TabFilter = ({tabFilters, activeTab, setActiveTab, onPressTab}) => {
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
        style={{flexGrow: 0}} // ✅ prevents extra vertical space
        contentContainerStyle={{
          flexDirection: 'row',
          gap: 10,
          alignItems: 'flex-start',
        }}>
        {tabFilters.map((parseTabFilters, index) => (
          <TouchableOpacity
            key={index}
            onPress={() => onPressTab({pressTab: parseTabFilters.filterKey})}
            style={{
              flexDirection: 'row',
              paddingHorizontal: 20,
              paddingVertical: 10,
              borderBottomColor: '#202325',
              borderBottomWidth:
                activeTab === parseTabFilters.filterKey ? 2 : 0,
            }}>
            <Text style={globalStyles.textSMGreyDark}>
              {parseTabFilters.filterKey}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default TabFilter;
