import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  ActivityIndicator,
  Alert,
  ScrollView,
  Linking,
  Platform,
} from 'react-native';
import DocumentPicker from 'react-native-document-picker';

// Import icons
import CloseIcon from '../../../assets/iconnav/caret-left-bold.svg';
import DownloadIcon from '../../../assets/admin-icons/arrow-down.svg';
import UploadIcon from '../../../assets/buyer-icons/plus.svg';
import FileIcon from '../../../assets/icons/greydark/profile.svg';
import CheckIcon from '../../../assets/admin-icons/check-approve.svg';

// Import API
import { importTaxonomyDataApi } from '../../../components/Api/importTaxonomyDataApi';
import { getStoredAdminId } from '../../../utils/getStoredUserInfo';

const BatchUpdateModal = ({ visible, onClose, onSuccess }) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  // Handle template download
  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      console.log('📥 Opening taxonomy template download...');

      // Get the API base URL
      const API_CONFIG = require('../../../config/apiConfig').API_CONFIG;
      const templateUrl = `${API_CONFIG.BASE_URL}/downloadTaxonomyTemplate`;
      
      console.log('🌐 Template URL:', templateUrl);

      // Open the URL in browser/Safari - this will trigger download
      const supported = await Linking.canOpenURL(templateUrl);
      
      if (supported) {
        await Linking.openURL(templateUrl);
        
        Alert.alert(
          'Template Download',
          Platform.OS === 'ios' 
            ? '📱 iOS Instructions:\n\n1. Safari will open and auto-download\n2. Tap Downloads (↓) in Safari\n3. Tap the .xlsx file to open\n4. Edit in Numbers/Excel\n5. Save/export to Files\n6. When uploading: Browse → iCloud Drive → Downloads folder'
            : 'The template is downloading to your Downloads folder.',
          [{ text: 'Got it!' }]
        );
      } else {
        throw new Error('Cannot open URL');
      }
    } catch (error) {
      console.error('❌ Template download failed:', error);
      Alert.alert(
        'Download Failed',
        error.message || 'Failed to open template download. Please try again.'
      );
    } finally {
      setIsDownloading(false);
    }
  };

  // Handle file selection
  const handleFileSelect = async () => {
    try {
      console.log('📁 Opening file picker...');
      
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.xlsx,
          DocumentPicker.types.xls,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        allowMultiSelection: false,
        copyTo: 'cachesDirectory', // Copy to cache for better access
      });

      if (result && result.length > 0) {
        const file = result[0];
        
        console.log('📄 File selected:', {
          name: file.name,
          type: file.type,
          size: file.size,
          uri: file.uri,
          fileCopyUri: file.fileCopyUri
        });

        // Use fileCopyUri if available (better for iOS)
        const fileToUse = {
          ...file,
          uri: file.fileCopyUri || file.uri,
        };

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024;
        if (fileToUse.size > maxSize) {
          Alert.alert(
            'File Too Large',
            'Please select a file smaller than 10MB.'
          );
          return;
        }

        setSelectedFile(fileToUse);
        console.log('✅ File ready for upload:', fileToUse.name);
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('📄 File selection cancelled');
      } else {
        console.error('❌ Error selecting file:', error);
        Alert.alert('Error', 'Failed to select file. Please try again.');
      }
    }
  };

  // Handle batch update
  const handleBatchUpdate = async () => {
    if (!selectedFile) {
      Alert.alert('No File Selected', 'Please select an Excel file to upload.');
      return;
    }

    Alert.alert(
      'Confirm Batch Update',
      '⚠️ WARNING: This will OVERWRITE all existing taxonomy data with the data from your Excel file. This action cannot be undone.\n\nAre you sure you want to proceed?',
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Yes, Update', 
          style: 'destructive',
          onPress: performBatchUpdate 
        }
      ]
    );
  };

  const performBatchUpdate = async () => {
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return 90;
          }
          return prev + 10;
        });
      }, 200);

      console.log('📤 Starting batch update with file:', selectedFile.name);

      // Get admin ID
      const adminId = await getStoredAdminId();

      // Call the import API with overwrite mode
      const response = await importTaxonomyDataApi({
        file: selectedFile,
        importType: 'taxonomy',
        adminId: adminId || 'admin_temp',
        options: {
          overwriteExisting: true, // KEY: This enables overwrite mode
          skipDuplicates: false,
          source: 'batch_update'
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('✅ Batch update successful:', response);

      Alert.alert(
        'Batch Update Successful',
        'Successfully updated taxonomy data.',
        [
          {
            text: 'OK',
            onPress: () => {
              // Reset and close
              setSelectedFile(null);
              setUploadProgress(0);
              onClose();
              
              // Notify parent to refresh data
              if (onSuccess) {
                onSuccess(response.data);
              }
            }
          }
        ]
      );

    } catch (error) {
      console.error('❌ Batch update failed:', error);
      
      Alert.alert(
        'Batch Update Failed',
        error.message || 'Failed to update taxonomy data. Please check your file format and try again.'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const handleClose = () => {
    if (!isUploading) {
      setSelectedFile(null);
      setUploadProgress(0);
      onClose();
    }
  };

  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={visible}
      onRequestClose={handleClose}
    >
      <View style={styles.overlay}>
        <TouchableOpacity 
          style={styles.overlayTouchable} 
          onPress={handleClose}
          disabled={isUploading}
        />
        
        {/* Modal Content */}
        <View style={styles.modalContainer}>
          {/* Header */}
          <View style={styles.header}>
            <TouchableOpacity 
              onPress={handleClose} 
              style={styles.closeButton}
              disabled={isUploading}
            >
              <CloseIcon width={24} height={24} />
            </TouchableOpacity>
            <Text style={styles.headerTitle}>Batch Update Taxonomy</Text>
            <View style={styles.headerSpacer} />
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Warning */}
            <View style={styles.warningContainer}>
              <Text style={styles.warningTitle}>⚠️ Important Warning</Text>
              <Text style={styles.warningText}>
                Batch update will OVERWRITE all existing taxonomy data. Make sure your Excel file contains ALL the taxonomy data you want to keep.
              </Text>
            </View>

            {/* Step 1: Download Template */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Step 1: Download Template</Text>
              <Text style={styles.sectionDescription}>
                Download the Excel template, edit it with your taxonomy data, and save to your device.
                {Platform.OS === 'ios' && '\n\n📱 iOS: Downloads save to iCloud Drive → Downloads folder by default.'}
              </Text>
              <TouchableOpacity 
                style={styles.downloadButton} 
                onPress={handleDownloadTemplate}
                disabled={isDownloading || isUploading}
              >
                {isDownloading ? (
                  <ActivityIndicator size="small" color="#FFFFFF" />
                ) : (
                  <>
                    <DownloadIcon width={20} height={20} />
                    <Text style={styles.downloadButtonText}>Download Template</Text>
                  </>
                )}
              </TouchableOpacity>
            </View>

            {/* Step 2: Upload File */}
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>Step 2: Upload Excel File</Text>
              <Text style={styles.sectionDescription}>
                Select your populated Excel file to update the taxonomy database.
                {Platform.OS === 'ios' && '\n\n📁 Find it in: Browse → iCloud Drive → Downloads'}
              </Text>

              {!selectedFile ? (
                <TouchableOpacity 
                  style={styles.uploadArea} 
                  onPress={handleFileSelect}
                  disabled={isUploading}
                >
                  <UploadIcon width={48} height={48} style={styles.uploadIcon} />
                  <Text style={styles.uploadTitle}>Choose Excel File</Text>
                  <Text style={styles.uploadSubtitle}>Click to select .xlsx or .xls file</Text>
                </TouchableOpacity>
              ) : (
                <View style={styles.selectedFileContainer}>
                  <View style={styles.fileInfo}>
                    <FileIcon width={32} height={32} style={styles.fileIcon} />
                    <View style={styles.fileDetails}>
                      <Text style={styles.fileName}>{selectedFile.name}</Text>
                      <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
                    </View>
                  </View>
                  {!isUploading && (
                    <TouchableOpacity 
                      style={styles.changeFileButton} 
                      onPress={handleFileSelect}
                    >
                      <Text style={styles.changeFileText}>Change File</Text>
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </View>

            {/* Upload Progress */}
            {isUploading && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Updating Taxonomy...</Text>
                <View style={styles.progressContainer}>
                  <View style={styles.progressBar}>
                    <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
                  </View>
                  <Text style={styles.progressText}>{uploadProgress}%</Text>
                </View>
                <ActivityIndicator size="large" color="#539461" style={{ marginTop: 16 }} />
              </View>
            )}

            {/* Action Buttons */}
            {selectedFile && !isUploading && (
              <View style={styles.actionsContainer}>
                <TouchableOpacity 
                  style={styles.updateButton} 
                  onPress={handleBatchUpdate}
                >
                  <Text style={styles.updateButtonText}>Update Taxonomy</Text>
                </TouchableOpacity>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  overlayTouchable: {
    flex: 1,
  },
  modalContainer: {
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    maxHeight: '90%',
    paddingBottom: 34,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  closeButton: {
    padding: 8,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#202325',
    textAlign: 'center',
    marginRight: 40, // Balance the close button
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  warningContainer: {
    backgroundColor: '#FFF3CD',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
    borderWidth: 1,
    borderColor: '#FFE69C',
  },
  warningTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#856404',
    marginBottom: 8,
  },
  warningText: {
    fontSize: 14,
    color: '#856404',
    lineHeight: 20,
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    marginBottom: 8,
  },
  sectionDescription: {
    fontSize: 14,
    color: '#647276',
    marginBottom: 16,
    lineHeight: 20,
  },
  downloadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 14,
    gap: 8,
  },
  downloadButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  uploadArea: {
    borderWidth: 2,
    borderColor: '#CDD3D4',
    borderStyle: 'dashed',
    borderRadius: 12,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#FAFBFC',
  },
  uploadIcon: {
    marginBottom: 16,
    opacity: 0.6,
  },
  uploadTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    marginBottom: 4,
  },
  uploadSubtitle: {
    fontSize: 14,
    color: '#647276',
  },
  selectedFileContainer: {
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    padding: 16,
    backgroundColor: '#FFFFFF',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  fileIcon: {
    marginRight: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#202325',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 14,
    color: '#647276',
  },
  changeFileButton: {
    alignSelf: 'flex-start',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
    backgroundColor: '#F8F9FA',
    borderWidth: 1,
    borderColor: '#CDD3D4',
  },
  changeFileText: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  progressContainer: {
    alignItems: 'center',
  },
  progressBar: {
    width: '100%',
    height: 8,
    backgroundColor: '#E4E7E9',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    backgroundColor: '#539461',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#539461',
  },
  actionsContainer: {
    marginTop: 8,
    marginBottom: 16,
  },
  updateButton: {
    backgroundColor: '#539461',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  updateButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default BatchUpdateModal;
