import moment from 'moment';
import React, { useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import CalendarIcon from '../../../../assets/admin-icons/calendar.svg';
import ClockIcon from '../../../../assets/admin-icons/clock.svg';
import CheckBox from '../../../../components/CheckBox/CheckBox';

const DeliveryDateTimeInput = ({
  setIsDelayed,
  isDelayed,
  deliveryDate,
  setDeliveryDate,
  deliveryTime,
  setDeliveryTime,
  onSave,
  isLoading,
}) => {
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);
  const [isTimePickerVisible, setTimePickerVisibility] = useState(false);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);
  const handleDateConfirm = (date) => {
    setDeliveryDate(moment(date).format('YYYY-MM-DD'));
    hideDatePicker();
  };

  const showTimePicker = () => setTimePickerVisibility(true);
  const hideTimePicker = () => setTimePickerVisibility(false);
  const handleTimeConfirm = (time) => {
    setDeliveryTime(moment(time).format('HH:mm'));
    hideTimePicker();
  };

  return (
    <View style={styles.deliveryActionSection}>
      <TouchableOpacity onPress={showDatePicker} style={styles.textInputWrapper}>
        <CalendarIcon style={styles.inputIcon} />
        <Text style={deliveryDate ? styles.textInput : styles.placeholderText}>
          {deliveryDate ? moment(deliveryDate).format('MMMM DD, YYYY') : 'UPS Delivery Date'}
        </Text>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isDatePickerVisible}
        mode="date"
        onConfirm={handleDateConfirm}
        onCancel={hideDatePicker}
      />

      <TouchableOpacity onPress={showTimePicker} style={styles.textInputWrapper}>
        <ClockIcon style={styles.inputIcon} />
        <Text style={deliveryTime ? styles.textInput : styles.placeholderText}>
          {deliveryTime ? moment(deliveryTime, 'HH:mm').format('hh:mm A') : 'UPS Delivery Time'}
        </Text>
      </TouchableOpacity>
      <DateTimePickerModal
        isVisible={isTimePickerVisible}
        mode="time"
        onConfirm={handleTimeConfirm}
        onCancel={hideTimePicker}
      />

      <View style={styles.checkboxRow}>
        <CheckBox
          isChecked={isDelayed}
          onToggle={() => setIsDelayed(!isDelayed)}
          checkedColor="#539461"
        />
        <Text style={styles.checkboxLabel}>Delayed UPS Delivery</Text>
      </View>
      <TouchableOpacity style={styles.saveButton} onPress={onSave} disabled={isLoading}>
        {isLoading ? (
          <ActivityIndicator color="#FFFFFF" />
        ) : (
          <Text style={styles.saveButtonText}>
            {deliveryDate && deliveryTime ? 'Update' : 'Add'}
          </Text>
        )}
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  deliveryActionSection: { paddingHorizontal: 15, paddingBottom: 20, gap: 12 },
  textInputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    height: 48,
    paddingHorizontal: 16,
  },
  inputIcon: { marginRight: 12 },
  textInput: { flex: 1, fontFamily: 'Inter', fontSize: 16, color: '#202325' },
  placeholderText: { flex: 1, fontFamily: 'Inter', fontSize: 16, color: '#647276' },
  saveButton: {
    backgroundColor: '#539461',
    borderRadius: 12,
    height: 48,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  saveButtonText: { color: '#FFFFFF', fontFamily: 'Inter', fontWeight: '600', fontSize: 16 },
  checkboxRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  checkboxLabel: { fontFamily: 'Inter', fontSize: 16, color: '#647276' },
});

export default DeliveryDateTimeInput;
