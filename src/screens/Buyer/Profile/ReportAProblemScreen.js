import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StatusBar,
  Alert,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import PlusIcon from '../../../assets/icons/greylight/plus-regular.svg';
import Svg, { Path } from 'react-native-svg';

// Custom Image Icon Component (from Figma SVG)
const AttachmentIcon = ({width = 24, height = 24, fill = "#202325"}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      fillRule="evenodd"
      clipRule="evenodd"
      d="M2.25 5.25C2.25 4.42157 2.92157 3.75 3.75 3.75H20.25C21.0784 3.75 21.75 4.42157 21.75 5.25V16.6902V16.6961V18.75C21.75 19.5784 21.0784 20.25 20.25 20.25H17.9367H17.934H3.75C2.92157 20.25 2.25 19.5784 2.25 18.75V5.25ZM3.75 16.1253V18.75H16.1248L13.2955 15.9205C13.2902 15.9154 13.2849 15.9103 13.2797 15.905C13.2746 15.9 13.2697 15.8949 13.2648 15.8897L8.62527 11.2497L3.75 16.1253ZM14.8715 15.3751L18.246 18.75H20.25V17.0036L16.7489 13.4999L14.8715 15.3751ZM20.25 14.8815V5.25H3.75V14.0038L7.56375 10.1893C7.70301 10.05 7.8686 9.93919 8.05059 9.86375C8.23269 9.78827 8.42788 9.74941 8.625 9.74941C8.82212 9.74941 9.01731 9.78827 9.19941 9.86375C9.38139 9.93919 9.54673 10.0497 9.68598 10.1891L13.8109 14.3144L15.6886 12.4389C15.9699 12.1579 16.3513 11.9999 16.7489 11.9999C17.1466 11.9999 17.5279 12.1578 17.8092 12.4389L20.25 14.8815Z"
      fill={fill}
    />
    <Path
      d="M14.625 10.5C15.2463 10.5 15.75 9.99632 15.75 9.375C15.75 8.75368 15.2463 8.25 14.625 8.25C14.0037 8.25 13.5 8.75368 13.5 9.375C13.5 9.99632 14.0037 10.5 14.625 10.5Z"
      fill={fill}
    />
  </Svg>
);

const ReportAProblemScreen = () => {
  const navigation = useNavigation();
  const [problemDescription, setProblemDescription] = useState('');
  const [attachmentName, setAttachmentName] = useState('');

  const handleAttachFile = () => {
    // TODO: Implement file attachment logic
    Alert.alert('File Attachment', 'File attachment functionality will be implemented here');
  };

  const handleSubmit = () => {
    if (!problemDescription.trim()) {
      Alert.alert('Error', 'Please describe the problem');
      return;
    }
    
    // TODO: Implement submission logic
    Alert.alert('Success', 'Your problem report has been submitted successfully');
    navigation.goBack();
  };

  return (
    <View style={styles.container}>
      <StatusBar backgroundColor="#FFFFFF" barStyle="dark-content" />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <LeftIcon width={24} height={24} fill="#393D40" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Report a Problem</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Form */}
        <View style={styles.form}>
          {/* Problem Section */}
          <View style={styles.problemSection}>
            <View style={styles.inputField}>
              <Text style={styles.label}>Describe the problem you encounter</Text>
              <TextInput
                style={styles.textField}
                placeholder="Describe here"
                placeholderTextColor="#647276"
                value={problemDescription}
                onChangeText={setProblemDescription}
                multiline
                textAlignVertical="top"
              />
            </View>
          </View>

          {/* Attachment Section */}
          <View style={styles.attachmentSection}>
            <Text style={styles.attachmentLabel}>Attach screenshot (optional)</Text>
            <TouchableOpacity style={styles.attachmentButton} onPress={handleAttachFile}>
              <AttachmentIcon width={24} height={24} fill="#202325" />
              <View style={styles.attachmentTextContainer}>
                <Text style={styles.attachmentButtonText}>
                  {attachmentName || 'Attach image'}
                </Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Action Section */}
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmit}>
              <View style={styles.submitButtonText}>
                <Text style={styles.submitButtonLabel}>Submit</Text>
              </View>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </View>
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
    paddingVertical: 12,
    paddingHorizontal: 24,
    backgroundColor: '#FFFFFF',
    width: '100%',
    height: 60,
  },
  backButton: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#202325',
    flex: 1,
  },
  headerSpacer: {
    width: 24,
    height: 24,
  },
  content: {
    flex: 1,
    width: '100%',
    paddingBottom: 34,
  },
  form: {
    backgroundColor: '#FFFFFF',
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: '100%',
  },
  problemSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 12,
    width: '100%',
  },
  inputField: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: '100%',
  },
  label: {
    width: '100%',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
  },
  textField: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    paddingHorizontal: 16,
    gap: 12,
    width: '100%',
    height: 316,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
  },
  attachmentSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
    width: '100%',
  },
  attachmentLabel: {
    width: '100%',
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 14,
    lineHeight: 20,
    color: '#393D40',
  },
  attachmentButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 12,
    width: '100%',
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  attachmentTextContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    width: 119,
    height: 16,
  },
  attachmentButtonText: {
    width: 103,
    height: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#393D40',
  },
  actionSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingTop: 24,
    paddingBottom: 12,
    gap: 12,
    width: '100%',
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    width: '100%',
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
  },
  submitButtonText: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    width: 71,
    height: 16,
  },
  submitButtonLabel: {
    width: 55,
    height: 16,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },
});

export default ReportAProblemScreen;
