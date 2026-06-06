import React from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import TrackIcon from '../../assets/admin-icons/tracking-icon.svg';
import { forceUppercaseHubLabel } from '../../utils/leafTrailScanNav';

const LeafTrailTrackingInput = ({
  trackingNumber,
  setTrackingNumber,
  onSave,
  isLoading,
  hint,
}) => (
  <View style={styles.trackingSection}>
    {hint ? <Text style={styles.hint}>{hint}</Text> : null}
    <View style={styles.trackingInputContainer}>
      <View style={styles.textInputWrapper}>
        <TrackIcon style={styles.truckIcon} />
        <TextInput
          style={styles.textInput}
          placeholder="Tracking Number"
          placeholderTextColor="#647276"
          value={trackingNumber}
          onChangeText={(text) => setTrackingNumber(forceUppercaseHubLabel(text))}
          autoCapitalize="characters"
          autoCorrect={false}
        />
      </View>
      <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>{trackingNumber ? 'Update' : 'Add'}</Text>
        )}
      </TouchableOpacity>
    </View>
  </View>
);

const styles = StyleSheet.create({
  trackingSection: {
    paddingHorizontal: 15,
    paddingBottom: 20,
    gap: 8,
  },
  hint: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7F8D91',
    lineHeight: 20,
  },
  trackingInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  textInputWrapper: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 12,
    height: 48,
    gap: 8,
  },
  truckIcon: {
    width: 24,
    height: 24,
  },
  textInput: {
    flex: 1,
    fontSize: 16,
    fontWeight: '500',
    color: '#202325',
  },
  saveButton: {
    backgroundColor: '#539461',
    borderRadius: 12,
    height: 48,
    minWidth: 72,
    paddingHorizontal: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  saveButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default LeafTrailTrackingInput;
