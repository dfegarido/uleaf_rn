import React from 'react';
import {StyleSheet, Text, TouchableOpacity, View} from 'react-native';
import {globalStyles} from '../../assets/styles/styles';
import LeftIcon from '../../assets/icons/greylight/caret-left-regular.svg';
import {MOCKUP_NOTE} from './mockData';

const MockupHeader = ({navigation, title, onBack}) => {
  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onBack || (() => navigation.goBack())}
          style={styles.backBtn}
          accessibilityRole="button">
          <LeftIcon width={28} height={28} />
        </TouchableOpacity>
        <Text style={[globalStyles.textLGGreyDark, styles.title]}>{title}</Text>
        <View style={styles.chip}>
          <Text style={styles.chipText}>MOCKUP</Text>
        </View>
      </View>
      <Text style={styles.note}>{MOCKUP_NOTE}</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: '#fff',
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backBtn: {
    paddingRight: 8,
    paddingVertical: 4,
  },
  title: {
    flex: 1,
    fontWeight: '700',
    textAlign: 'center',
  },
  chip: {
    backgroundColor: '#DFECDF',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
  },
  chipText: {
    color: '#356641',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.4,
  },
  note: {
    marginTop: 8,
    color: '#7F8D91',
    fontSize: 12,
    textAlign: 'center',
  },
});

export default MockupHeader;
