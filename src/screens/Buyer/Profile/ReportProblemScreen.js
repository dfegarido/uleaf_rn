import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView } from 'react-native';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import Svg, { Path } from 'react-native-svg';

// Attachment Icon Component
const AttachmentIcon = ({width = 24, height = 24, fill = "#202325"}) => (
  <Svg width={width} height={height} viewBox="0 0 24 24" fill="none">
    <Path
      d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66L9.64 16.2a2 2 0 01-2.83-2.83l8.49-8.49"
      stroke={fill}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

// Resize Handle Icon Component (for textarea)
const ResizeHandleIcon = ({width = 16, height = 16, fill = "#202325"}) => (
  <Svg width={width} height={height} viewBox="0 0 16 16" fill="none">
    <Path
      d="M14 14L10 10M14 10L10 14"
      stroke={fill}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </Svg>
);

const ReportProblemScreen = ({ navigation }) => {
  const [problemDescription, setProblemDescription] = useState('');
  const [attachmentFile, setAttachmentFile] = useState(null);

  const handleAttachFile = () => {
    // Handle file attachment logic here
    console.log('Attach file pressed');
  };

  const handleSubmitReport = () => {
    // Handle report submission logic here
    console.log('Submit report pressed');
  };

  return (
    <View style={styles.container}>
      {/* Navigation Header */}
      <View style={styles.navigationHeader}>
        <View style={styles.statusBar} />
        <View style={styles.headerContent}>
          <View style={styles.controls}>
            <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
              <LeftIcon width={24} height={24} fill="#393D40" />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Report a Problem</Text>
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        {/* Form */}
        <View style={styles.form}>
          {/* Problem Section */}
          <View style={styles.problemSection}>
            <View style={styles.inputFieldWrap}>
              <Text style={styles.inputLabel}>Tell us about the problem</Text>
              <View style={styles.textAreaField}>
                <TextInput
                  style={styles.textAreaInput}
                  placeholder="Describe the problem you're experiencing..."
                  placeholderTextColor="#647276"
                  value={problemDescription}
                  onChangeText={setProblemDescription}
                  multiline
                  textAlignVertical="top"
                />
                <View style={styles.resizeHandle}>
                  <ResizeHandleIcon width={16} height={16} fill="#202325" />
                </View>
              </View>
            </View>
          </View>

          {/* Attachment Section */}
          <View style={styles.attachmentSection}>
            <Text style={styles.attachmentLabel}>Attachment</Text>
            <TouchableOpacity style={styles.attachmentButton} onPress={handleAttachFile}>
              <AttachmentIcon width={24} height={24} fill="#202325" />
              <View style={styles.attachmentButtonText}>
                <Text style={styles.attachmentButtonLabel}>Add Attachment</Text>
              </View>
            </TouchableOpacity>
          </View>

          {/* Action Section */}
          <View style={styles.actionSection}>
            <TouchableOpacity style={styles.submitButton} onPress={handleSubmitReport}>
              <Text style={styles.submitButtonText}>Submit</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>

      {/* Home Indicator */}
      <View style={styles.homeIndicator}>
        <View style={styles.gestureBar} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  navigationHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    width: 375,
    height: 106,
    minHeight: 106,
    backgroundColor: '#FFFFFF',
    zIndex: 2,
  },
  statusBar: {
    width: 375,
    height: 48,
  },
  headerContent: {
    width: 375,
    height: 58,
    minHeight: 58,
  },
  controls: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingTop: 6,
    paddingBottom: 12,
    paddingHorizontal: 16,
    width: 375,
    height: 58,
    minHeight: 58,
  },
  backButton: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    position: 'absolute',
    width: 240,
    height: 24,
    left: '50%',
    marginLeft: -120,
    top: 14,
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
  },
  content: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 106,
    paddingBottom: 34,
    width: 375,
    minHeight: 812,
    flexGrow: 1,
  },
  form: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    width: 375,
    height: 554,
  },
  problemSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 12,
    width: 375,
    height: 370,
  },
  inputFieldWrap: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: 327,
    height: 346,
  },
  inputLabel: {
    width: 327,
    height: 22,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#393D40',
  },
  textAreaField: {
    position: 'relative',
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 16,
    gap: 12,
    width: 327,
    height: 316,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  textAreaInput: {
    flex: 1,
    height: 292,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    padding: 0,
  },
  resizeHandle: {
    position: 'absolute',
    width: 16,
    height: 16,
    right: 4,
    bottom: 6,
    zIndex: 2,
  },
  attachmentSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingVertical: 12,
    paddingHorizontal: 24,
    gap: 8,
    width: 375,
    height: 100,
  },
  attachmentLabel: {
    width: 327,
    height: 20,
    fontFamily: 'Inter',
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
    width: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  attachmentButtonText: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    gap: 8,
    width: 119,
    height: 16,
  },
  attachmentButtonLabel: {
    width: 103,
    height: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#393D40',
  },
  actionSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 24,
    paddingBottom: 12,
    paddingHorizontal: 24,
    gap: 12,
    width: 375,
    height: 84,
  },
  submitButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 24,
    width: 327,
    height: 48,
    minHeight: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
  },
  submitButtonText: {
    width: 55,
    height: 16,
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  homeIndicator: {
    position: 'absolute',
    width: '100%',
    height: 34,
    left: 0,
    bottom: 0,
    zIndex: 1,
  },
  gestureBar: {
    position: 'absolute',
    width: 148,
    height: 5,
    left: '50%',
    marginLeft: -74,
    bottom: 8,
    backgroundColor: '#202325',
    borderRadius: 100,
  },
});

export default ReportProblemScreen;
