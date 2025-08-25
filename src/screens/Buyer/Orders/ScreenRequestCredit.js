import React, {useState} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import {useNavigation, useRoute} from '@react-navigation/native';
import {requestCreditApi} from '../../../components/Api/orderManagementApi';
import {useAuth} from '../../../auth/AuthProvider';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';
import LiveIcon from '../../../assets/icontabs/buyer-tabs/live-solid.svg';
import ImageIcon from '../../../assets/iconchat/image.svg';
import { SafeAreaView } from 'react-native-safe-area-context';

const ScreenRequestCredit = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { user, isLoggedIn } = useAuth();
  
  // Get order data from navigation params
  const { orderData, plantCode, orderId, transactionNumber } = route.params || {};
  
  // Debug logging
  console.log('ScreenRequestCredit - Received params:', {
    orderData: orderData ? 'Present' : 'Missing',
    plantCode: plantCode ? plantCode : 'Missing',
    orderId: orderId ? orderId : 'Missing',
    transactionNumber: transactionNumber ? transactionNumber : 'Missing',
    orderDataKeys: orderData ? Object.keys(orderData) : [],
    fullParams: route.params
  });
  
  const [selectedIssue, setSelectedIssue] = useState('Missing');
  const [description, setDescription] = useState('');
  const [contentHeight, setContentHeight] = useState(120);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleSubmit = async () => {
    console.log('handleSubmit called with:', { orderData, plantCode, orderId, transactionNumber, isLoggedIn, user });
    
    if (!isLoggedIn || !user) {
      Alert.alert('Error', 'Please log in to submit a credit request');
      return;
    }

    // Try to get order information with multiple fallbacks
    let finalOrderId = null;
    let finalPlantCode = plantCode;

    if (orderData) {
      finalOrderId = orderData.id || 
                     orderData.transactionNumber || 
                     orderData.fullOrderData?.id || 
                     orderData.fullOrderData?.transactionNumber ||
                     orderId ||
                     transactionNumber;
      
      // Also try to get plantCode from orderData if not provided
      if (!finalPlantCode) {
        finalPlantCode = orderData.plantCode || 
                        orderData.fullOrderData?.plantCode ||
                        orderData.plantDetails?.plantCode;
      }
    } else {
      // Use fallback parameters
      finalOrderId = orderId || transactionNumber;
    }

    if (!finalOrderId) {
      console.error('Cannot determine order ID:', { orderData, orderId, transactionNumber, routeParams: route.params });
      Alert.alert('Error', 'Order information is missing. Please go back and try again.');
      return;
    }

    if (!finalPlantCode) {
      console.error('Plant code is missing:', { plantCode, orderData, routeParams: route.params });
      Alert.alert('Error', 'Plant information is missing. Please go back and try again.');
      return;
    }

    try {
      setIsSubmitting(true);

      const requestParams = {
        orderId: finalOrderId,
        plantCode: finalPlantCode,
        issueType: selectedIssue,
        description: description.trim(),
        attachments: [], // TODO: Implement attachment handling
      };

      console.log('Submitting credit request:', requestParams);

      const response = await requestCreditApi(requestParams);

      if (response.success) {
        Alert.alert(
          'Success',
          'Your credit request has been submitted successfully. We will review it within 2-3 business days.',
          [
            {
              text: 'OK',
              onPress: () => {
                // Navigate back and trigger refresh
                navigation.navigate('Orders', { 
                  refreshData: true,
                  timestamp: Date.now() // Force refresh with timestamp
                });
              }
            }
          ]
        );
      } else {
        Alert.alert('Error', response.error || 'Failed to submit credit request');
      }

    } catch (error) {
      console.error('Error submitting credit request:', error);
      Alert.alert('Error', 'An unexpected error occurred. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <BackSolidIcon width={24} height={24} color="#202325" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Request Credit</Text>
        <View style={styles.placeholder} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Plant Delivery Issue Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Plant delivery issue</Text>

          <View style={styles.radioContainer}>
            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setSelectedIssue('Missing')}>
              <View style={styles.radioButton}>
                {selectedIssue === 'Missing' && (
                  <View style={styles.radioSelected} />
                )}
              </View>
              <Text style={styles.radioText}>Missing</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.radioOption}
              onPress={() => setSelectedIssue('Dead on Arrival')}>
              <View style={styles.radioButton}>
                {selectedIssue === 'Dead on Arrival' && (
                  <View style={styles.radioSelected} />
                )}
              </View>
              <Text style={styles.radioText}>Dead on Arrival</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Attach Video/Image Button */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.attachVideoButton}>
            {selectedIssue === 'Dead on Arrival' ? (
              <ImageIcon width={20} height={20} color="#202325" />
            ) : (
              <LiveIcon width={20} height={20} color="#202325" />
            )}
            <Text style={styles.attachVideoText}>
              {selectedIssue === 'Dead on Arrival'
                ? 'Attach Image'
                : 'Attach video'}
            </Text>
          </TouchableOpacity>
        </View>

        {/* Describe Issue Section */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            Please describe the issue (optional)
          </Text>

          <View style={styles.textInputContainer}>
            <TextInput
              style={[styles.textInput, {height: Math.max(120, contentHeight)}]}
              placeholder="Describe here"
              placeholderTextColor="#647276"
              value={description}
              onChangeText={setDescription}
              multiline
              textAlignVertical="top"
              onContentSizeChange={event => {
                setContentHeight(event.nativeEvent.contentSize.height);
              }}
            />
          </View>
        </View>

        {/* Notes and Deadline */}
        <View style={styles.section}>
          <Text style={styles.noteText}>Note: for approval.</Text>
          <Text style={styles.deadlineText}>
            Request by{' '}
            {new Date().toLocaleDateString('en-US', {
              month: 'short',
              day: 'numeric',
            })}{' '}
            {new Date().toLocaleTimeString('en-US', {
              hour: 'numeric',
              minute: '2-digit',
              hour12: true,
            })}
          </Text>
        </View>
      </ScrollView>

      {/* Submit Button */}
      <View style={styles.submitContainer}>
        <TouchableOpacity 
          style={[styles.submitButton, isSubmitting && styles.submitButtonDisabled]} 
          onPress={handleSubmit}
          disabled={isSubmitting}>
          {isSubmitting ? (
            <View style={styles.submitButtonContent}>
              <ActivityIndicator size="small" color="#FFFFFF" />
              <Text style={styles.submitButtonText}>Submitting...</Text>
            </View>
          ) : (
            <Text style={styles.submitButtonText}>Submit Request</Text>
          )}
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 16, // Reduced from 50 to 16
    paddingBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#CDD3D4',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#202325',
  },
  placeholder: {
    width: 40,
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginTop: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    marginBottom: 16,
  },
  radioContainer: {
    gap: 16,
  },
  radioOption: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#CDD3D4',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  radioSelected: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#4CAF50',
  },
  radioText: {
    fontSize: 16,
    color: '#202325',
  },
  attachVideoButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 8,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    gap: 8,
  },
  cameraIcon: {
    fontSize: 20,
  },
  attachVideoText: {
    fontSize: 16,
    color: '#202325',
    fontWeight: '500',
  },
  textInputContainer: {
    position: 'relative',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 8,
    backgroundColor: '#FFFFFF',
  },
  textInput: {
    padding: 16,
    fontSize: 16,
    color: '#202325',
    textAlignVertical: 'top',
  },
  noteText: {
    fontSize: 14,
    color: '#647276',
    marginBottom: 4,
  },
  deadlineText: {
    fontSize: 14,
    color: '#647276',
  },
  submitContainer: {
    paddingHorizontal: 16,
    paddingVertical: 20,
    borderTopWidth: 1,
    borderTopColor: '#CDD3D4',
  },
  submitButton: {
    backgroundColor: '#4CAF50',
    borderRadius: 8,
    paddingVertical: 16,
    alignItems: 'center',
  },
  submitButtonDisabled: {
    backgroundColor: '#A5D6A7',
  },
  submitButtonContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  submitButtonText: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '600',
  },
});

export default ScreenRequestCredit;
