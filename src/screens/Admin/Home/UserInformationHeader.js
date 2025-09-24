import React from 'react';
import { View, Text, TouchableOpacity, ActivityIndicator } from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import TrashIcon from '../../../assets/admin-icons/trash-can.svg';

export const UserInformationHeader = ({ user, onDeleteUser, isDeleting }) => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();

  return (
    <SafeAreaView style={styles.safeArea} edges={['left','right']}>
      <View style={[styles.headerContainer, { paddingTop: insets.top + 24 }]}>
        <View style={styles.topRow}>
          <TouchableOpacity
            accessibilityRole="button"
            onPress={() => navigation.goBack()}
            style={styles.backButton}
            activeOpacity={0.8}
          >
            <BackIcon width={24} height={24} />
          </TouchableOpacity>

          <View style={styles.titleContainer}>
            <Text style={styles.headerTitle}>{user.role.charAt(0).toUpperCase() + user.role.slice(1)} Information</Text>
          </View>

          <TouchableOpacity
            accessibilityRole="button"
            style={styles.deleteButton}
            activeOpacity={0.8}
            onPress={onDeleteUser}
            disabled={isDeleting}
          >
            <View style={styles.deleteButtonContainer}>
              {isDeleting ? (
                <ActivityIndicator size="small" color="#E7522F" />
              ) : (
                <TrashIcon width={40} height={40} />
              )}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
};


const styles = {
  safeArea: {
    backgroundColor: '#ffffff',
  },
  headerContainer: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingBottom: 8,
    borderBottomWidth: 0,
    borderBottomColor: 'transparent',
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  backButton: {
    padding: 8,
  },
  titleContainer: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#000000',
  },
  deleteButton: {
    padding: 8,
  },
  deleteButtonContainer: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
};
