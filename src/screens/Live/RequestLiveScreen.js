import React, { useContext, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import { createLiveRequestApi } from '../../components/Api/liveRequestApi';
import { AuthContext } from '../../auth/AuthProvider';

const RequestLiveScreen = ({navigation}) => {
  const {userInfo} = useContext(AuthContext);
  const [title, setTitle] = useState('');
  const [liveType, setLiveType] = useState('live');
  const [requestedDate, setRequestedDate] = useState(new Date());
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisibility] = useState(false);

  const showDatePicker = () => setDatePickerVisibility(true);
  const hideDatePicker = () => setDatePickerVisibility(false);

  const handleConfirmDate = (date) => {
    setRequestedDate(date);
    hideDatePicker();
  };

  const handleSubmit = async () => {
    if (!title.trim()) {
      Alert.alert('Missing Title', 'Please enter a title for your live stream request.');
      return;
    }

    if (requestedDate <= new Date()) {
      Alert.alert('Invalid Date', 'Please select a future date and time for your request.');
      return;
    }

    setIsLoading(true);
    try {
      const data = {
        title: title.trim(),
        liveType,
        requestedDate: requestedDate.toISOString(),
        description: description.trim(),
      };

      const response = await createLiveRequestApi(data);

      if (response.success) {
        Alert.alert(
          'Request Submitted',
          'Your live stream request has been submitted for admin approval. You will be notified once it is reviewed.',
          [{text: 'OK', onPress: () => navigation.goBack()}]
        );
      } else {
        throw new Error(response.error || response.message || 'Failed to submit request.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <SafeAreaView style={styles.screen}>
      {isLoading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackSolidIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request to Go Live</Text>
        <View style={{width: 24}} />
      </View>

      <ScrollView style={styles.scrollView} contentContainerStyle={styles.container}>
        <Text style={styles.label}>Live Title</Text>
        <TextInput
          style={styles.input}
          placeholder="Enter a catchy title"
          placeholderTextColor="#888"
          value={title}
          onChangeText={setTitle}
        />

        <Text style={styles.label}>Live Type</Text>
        <View style={styles.typeSelector}>
          <TouchableOpacity
            style={[styles.typeButton, liveType === 'live' && styles.typeButtonActive]}
            onPress={() => setLiveType('live')}>
            <Text style={[styles.typeButtonText, liveType === 'live' && styles.typeButtonTextActive]}>
              Live Sale
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.typeButton, liveType === 'purge' && styles.typeButtonActive]}
            onPress={() => setLiveType('purge')}>
            <Text style={[styles.typeButtonText, liveType === 'purge' && styles.typeButtonTextActive]}>
              Purge
            </Text>
          </TouchableOpacity>
        </View>

        <Text style={styles.label}>Requested Date & Time</Text>
        <TouchableOpacity onPress={showDatePicker} style={styles.input}>
          <Text style={{color: '#000'}}>{requestedDate.toLocaleString()}</Text>
        </TouchableOpacity>

        <DateTimePickerModal
          isVisible={isDatePickerVisible}
          mode="datetime"
          onConfirm={handleConfirmDate}
          onCancel={hideDatePicker}
          date={requestedDate}
          minimumDate={new Date()}
        />

        <Text style={styles.label}>Description / Reason (Optional)</Text>
        <TextInput
          style={[styles.input, styles.textArea]}
          placeholder="Tell us why you want to go live..."
          placeholderTextColor="#888"
          value={description}
          onChangeText={setDescription}
          multiline
          numberOfLines={4}
          textAlignVertical="top"
        />
      </ScrollView>

      <View style={styles.footer}>
        <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
          <Text style={styles.submitButtonText}>Submit Request</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#fff'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {fontSize: 20, fontWeight: 'bold'},
  scrollView: {flex: 1},
  container: {padding: 20, paddingBottom: 40},
  label: {fontSize: 16, fontWeight: '600', color: '#333', marginBottom: 8},
  input: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
    marginBottom: 24,
    color: '#000',
  },
  textArea: {
    height: 100,
    paddingTop: 12,
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 24,
    gap: 12,
  },
  typeButton: {
    flex: 1,
    padding: 14,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ccc',
    alignItems: 'center',
    backgroundColor: '#F8F8F8',
  },
  typeButtonActive: {
    borderColor: '#539461',
    backgroundColor: '#E8F5E9',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#555',
  },
  typeButtonTextActive: {
    color: '#539461',
  },
  footer: {padding: 20, borderTopWidth: 1, borderTopColor: '#E0E0E0'},
  submitButton: {
    backgroundColor: '#539461',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  submitButtonText: {color: '#fff', fontSize: 18, fontWeight: 'bold'},
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default RequestLiveScreen;
