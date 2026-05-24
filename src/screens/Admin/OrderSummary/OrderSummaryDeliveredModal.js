import moment from 'moment';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';

import CloseIcon from '../../../assets/admin-icons/x.svg';
import CheckBox from '../../../components/CheckBox/CheckBox';

const UPS_TRACKING_MAX_LENGTH = 20;

const OrderSummaryDeliveredModal = ({
  visible,
  onClose,
  onSave,
  saving,
  initialTracking = '',
  initialDeliveryDate = '',
  initialDeliveryTime = '',
  initialIsDelayed = false,
}) => {
  const [trackingNumber, setTrackingNumber] = useState('');
  const [deliveryDate, setDeliveryDate] = useState('');
  const [deliveryTime, setDeliveryTime] = useState('');
  const [isDelayed, setIsDelayed] = useState(false);
  const [datePickerVisible, setDatePickerVisible] = useState(false);
  const [timePickerVisible, setTimePickerVisible] = useState(false);

  useEffect(() => {
    if (!visible) return;
    setTrackingNumber(String(initialTracking || '').slice(0, UPS_TRACKING_MAX_LENGTH));
    setDeliveryDate(initialDeliveryDate || '');
    setDeliveryTime(initialDeliveryTime || '');
    setIsDelayed(Boolean(initialIsDelayed));
  }, [visible, initialTracking, initialDeliveryDate, initialDeliveryTime, initialIsDelayed]);

  const handleSave = () => {
    const track = trackingNumber.trim();
    const date = deliveryDate.trim();
    const time = deliveryTime.trim();
    if (!track || !date || !time) {
      return;
    }
    onSave({
      trackingNumber: track,
      deliveryDate: date,
      deliveryTime: time,
      isDelayedUPSDelivery: isDelayed,
    });
  };

  const canSave = Boolean(
    trackingNumber.trim() && deliveryDate.trim() && deliveryTime.trim(),
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <Pressable style={styles.overlay} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={() => {}}>
          <View style={styles.header}>
            <Text style={styles.title}>Delivery details</Text>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <CloseIcon width={24} height={24} fill="#647276" />
            </TouchableOpacity>
          </View>
          <Text style={styles.subtitle}>
            Required for Plants are Home: UPS tracking number, delivery date, and delivery time.
          </Text>

          <Text style={styles.fieldLabel}>UPS tracking number</Text>
          <TextInput
            style={styles.textInput}
            placeholder="e.g. 1Z999AA10123456784"
            placeholderTextColor="#7F8D91"
            value={trackingNumber}
            onChangeText={(text) =>
              setTrackingNumber(text.slice(0, UPS_TRACKING_MAX_LENGTH))
            }
            maxLength={UPS_TRACKING_MAX_LENGTH}
            autoCapitalize="characters"
            editable={!saving}
          />

          <Text style={styles.fieldLabel}>UPS delivery date</Text>
          <TouchableOpacity
            style={styles.pickerRow}
            onPress={() => setDatePickerVisible(true)}
            disabled={saving}
          >
            <Text style={deliveryDate ? styles.pickerValue : styles.pickerPlaceholder}>
              {deliveryDate ? moment(deliveryDate, 'YYYY-MM-DD').format('MMMM D, YYYY') : 'Select date'}
            </Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={datePickerVisible}
            mode="date"
            onConfirm={(date) => {
              setDeliveryDate(moment(date).format('YYYY-MM-DD'));
              setDatePickerVisible(false);
            }}
            onCancel={() => setDatePickerVisible(false)}
          />

          <Text style={styles.fieldLabel}>UPS delivery time</Text>
          <TouchableOpacity
            style={styles.pickerRow}
            onPress={() => setTimePickerVisible(true)}
            disabled={saving}
          >
            <Text style={deliveryTime ? styles.pickerValue : styles.pickerPlaceholder}>
              {deliveryTime ? moment(deliveryTime, 'HH:mm').format('h:mm A') : 'Select time'}
            </Text>
          </TouchableOpacity>
          <DateTimePickerModal
            isVisible={timePickerVisible}
            mode="time"
            onConfirm={(time) => {
              setDeliveryTime(moment(time).format('HH:mm'));
              setTimePickerVisible(false);
            }}
            onCancel={() => setTimePickerVisible(false)}
          />

          <View style={styles.checkboxRow}>
            <CheckBox
              isChecked={isDelayed}
              onToggle={() => setIsDelayed(!isDelayed)}
            />
            <Text style={styles.checkboxLabel}>Delayed UPS delivery</Text>
          </View>

          <TouchableOpacity
            style={[styles.saveButton, (!canSave || saving) && styles.saveButtonDisabled]}
            onPress={handleSave}
            disabled={!canSave || saving}
          >
            {saving ? (
              <ActivityIndicator color="#FFFFFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save as delivered</Text>
            )}
          </TouchableOpacity>
          {!canSave ? (
            <Text style={styles.hint}>Fill in tracking, date, and time to continue.</Text>
          ) : null}
        </Pressable>
      </Pressable>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  sheet: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  title: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#647276',
    marginBottom: 16,
    lineHeight: 20,
  },
  fieldLabel: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 13,
    color: '#647276',
    marginBottom: 6,
    marginTop: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#202325',
    backgroundColor: '#FAFBFB',
  },
  pickerRow: {
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 14,
    backgroundColor: '#FAFBFB',
  },
  pickerValue: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#202325',
  },
  pickerPlaceholder: {
    fontFamily: 'Inter',
    fontSize: 16,
    color: '#7F8D91',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 20,
    gap: 8,
  },
  checkboxLabel: {
    fontFamily: 'Inter',
    fontSize: 15,
    color: '#393D40',
  },
  saveButton: {
    backgroundColor: '#539461',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
  hint: {
    fontFamily: 'Inter',
    fontSize: 12,
    color: '#7F8D91',
    textAlign: 'center',
    marginTop: 8,
  },
});

export default OrderSummaryDeliveredModal;
