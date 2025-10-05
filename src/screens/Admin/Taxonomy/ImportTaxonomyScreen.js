import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  ScrollView,
  Alert,
  ActivityIndicator,
  Platform,
  Share,
  Linking,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';

// Import fallback file selection
import { selectFileAlternative } from '../../../utils/fileSelectionFallback';

// Import icons
import BackIcon from '../../../assets/iconnav/caret-left-bold.svg';
import UploadIcon from '../../../assets/buyer-icons/plus.svg';
import FileIcon from '../../../assets/icons/greydark/profile.svg';
import CheckIcon from '../../../assets/admin-icons/check-approve.svg';
import DownloadIcon from '../../../assets/admin-icons/import-data.svg';

// Import API
import { importTaxonomyDataApi } from '../../../components/Api/importTaxonomyDataApi';
import { downloadTaxonomyTemplateApi } from '../../../components/Api/downloadTaxonomyTemplateApi';
import { getStoredAdminId } from '../../../utils/getStoredUserInfo';

const ImportTaxonomyScreen = () => {
  const navigation = useNavigation();
  const insets = useSafeAreaInsets();
  
  const [selectedFile, setSelectedFile] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [importResults, setImportResults] = useState(null);

  const handleFileSelect = async () => {
    try {
      console.log('📁 Opening file picker...');
      
      // Try using the real document picker first
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.csv,
          DocumentPicker.types.xlsx,
          DocumentPicker.types.xls,
          'application/json',
        ],
        allowMultiSelection: false,
        copyTo: 'documentDirectory',
      });

      if (result && result.length > 0) {
        const file = result[0];
        console.log('📄 User selected file:', {
          name: file.name,
          type: file.type,
          size: file.size,
          uri: file.uri,
        });

        // Validate file size (10MB limit)
        const maxSize = 10 * 1024 * 1024; // 10MB
        if (file.size > maxSize) {
          Alert.alert(
            'File Too Large',
            'Please select a file smaller than 10MB.'
          );
          return;
        }

        // Validate file type
        const allowedExtensions = ['.csv', '.xlsx', '.xls', '.json'];
        const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
        
        if (!allowedExtensions.includes(fileExtension)) {
          Alert.alert(
            'Invalid File Type',
            'Please select a CSV, Excel (.xlsx, .xls), or JSON file.'
          );
          return;
        }

        setSelectedFile(file);
        setImportResults(null);
        console.log('✅ File validated and selected successfully');
      }
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        console.log('📄 User cancelled file selection');
      } else {
        console.error('📄 Error with document picker:', error);
        
        // Fall back to alternative file selection method
        try {
          console.log('🔄 Trying alternative file selection...');
          const alternativeFile = await selectFileAlternative();
          setSelectedFile(alternativeFile);
          setImportResults(null);
          console.log('✅ Alternative file selection successful:', alternativeFile.name);
        } catch (fallbackError) {
          console.log('📄 Alternative file selection cancelled or failed');
        }
      }
    }
  };

  const handleImport = async () => {
    if (!selectedFile) {
      Alert.alert('No File Selected', 'Please select a file to import.');
      return;
    }

    Alert.alert(
      'Confirm Import',
      `Are you sure you want to import taxonomy data from "${selectedFile.name}"? This may add or update existing taxonomy entries.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Import', style: 'default', onPress: performImport }
      ]
    );
  };

  const performImport = async () => {
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

      console.log('📤 Starting taxonomy import with file:', selectedFile.name);

      // Get admin ID from storage
      const adminId = await getStoredAdminId();
      
      if (!adminId) {
        throw new Error('Admin ID not found. Please log in again.');
      }

      // Call the import API
      const response = await importTaxonomyDataApi({
        file: selectedFile,
        importType: 'taxonomy',
        adminId: adminId,
        options: {
          overwriteExisting: false,
          skipDuplicates: true,
          source: 'manual_import'
        }
      });

      clearInterval(progressInterval);
      setUploadProgress(100);

      console.log('✅ Import successful:', response);
      
      setImportResults({
        success: true,
        imported: response.data?.imported?.total_entries || response.imported || 0,
        genera: response.data?.imported?.genera || 0,
        species: response.data?.imported?.species || response.data?.imported?.total_entries || 0,
        skipped: response.data?.skipped || 0,
        errors: response.data?.errors?.length || 0,
        message: response.message || 'Import completed successfully',
        processing_time: response.data?.processing_time || 'N/A',
        sample_entries: response.data?.sample_entries || []
      });

      // Show success message with detailed stats
      setTimeout(() => {
        const stats = response.data?.imported;
        Alert.alert(
          'Import Successful! 🎉',
          `Successfully imported:\n` +
          `• ${stats?.genera || 0} genera\n` +
          `• ${stats?.species || 0} species\n` +
          `• ${stats?.total_entries || 0} total entries\n\n` +
          `Processing time: ${response.data?.processing_time || 'N/A'}`,
          [
            { text: 'View Taxonomy', onPress: () => navigation.navigate('Taxonomy') },
            { text: 'OK' }
          ]
        );
      }, 1000);

    } catch (error) {
      console.error('❌ Import failed:', error);
      
      setImportResults({
        success: false,
        message: error.message || 'Import failed. Please try again.'
      });

      Alert.alert(
        'Import Failed',
        error.message || 'Failed to import taxonomy data. Please check your file format and try again.'
      );
    } finally {
      setIsUploading(false);
      setUploadProgress(0);
    }
  };

  const resetImport = () => {
    setSelectedFile(null);
    setImportResults(null);
    setUploadProgress(0);
  };

  const handleDownloadTemplate = async () => {
    try {
      console.log('📥 Downloading template...');
      
      Alert.alert(
        'Download Template',
        'The taxonomy import template will be downloaded. You can open it with Excel or Google Sheets.',
        [
          { text: 'Cancel', style: 'cancel' },
          { 
            text: 'Download', 
            style: 'default', 
            onPress: async () => {
              try {
                const response = await downloadTaxonomyTemplateApi();
                
                if (!response.success) {
                  throw new Error(response.error || 'Failed to download template');
                }

                if (Platform.OS === 'web') {
                  // Web browser - create download link
                  const url = window.URL.createObjectURL(response.blob);
                  const link = document.createElement('a');
                  link.href = url;
                  link.download = response.filename;
                  document.body.appendChild(link);
                  link.click();
                  document.body.removeChild(link);
                  window.URL.revokeObjectURL(url);
                  
                  Alert.alert('Success', 'Template downloaded successfully!');
                } else {
                  // Mobile - Save to Downloads folder
                  const downloadPath = Platform.select({
                    android: `${RNFS.DownloadDirectoryPath}/${response.filename}`,
                    ios: `${RNFS.DocumentDirectoryPath}/${response.filename}`,
                  });

                  console.log('📱 Saving file to:', downloadPath);

                  // Convert blob to base64
                  const reader = new FileReader();
                  reader.onloadend = async () => {
                    try {
                      const base64Data = reader.result.split(',')[1];
                      
                      // Write file to device
                      await RNFS.writeFile(downloadPath, base64Data, 'base64');
                      
                      console.log('✅ File saved successfully:', downloadPath);
                      
                      // Show success with option to share/open
                      Alert.alert(
                        'Download Complete!',
                        `Template saved to ${Platform.OS === 'android' ? 'Downloads' : 'Documents'} folder\n\nFile: ${response.filename}`,
                        [
                          { text: 'OK', style: 'cancel' },
                          {
                            text: 'Share/Open',
                            onPress: async () => {
                              try {
                                // Use built-in Share API
                                await Share.share({
                                  title: 'Taxonomy Import Template',
                                  message: 'Open this template with Excel or Google Sheets',
                                  url: Platform.OS === 'ios' ? downloadPath : `file://${downloadPath}`,
                                });
                              } catch (shareError) {
                                console.error('❌ Share error:', shareError);
                                // Try to open file with Linking
                                if (Platform.OS === 'android') {
                                  Linking.openURL(`file://${downloadPath}`).catch(err => {
                                    console.error('❌ Cannot open file:', err);
                                  });
                                }
                              }
                            }
                          }
                        ]
                      );
                    } catch (writeError) {
                      console.error('❌ Error writing file:', writeError);
                      Alert.alert('Error', `Failed to save file: ${writeError.message}`);
                    }
                  };
                  
                  reader.onerror = () => {
                    Alert.alert('Error', 'Failed to process the template file.');
                  };
                  
                  reader.readAsDataURL(response.blob);
                }
              } catch (downloadError) {
                console.error('❌ Download error:', downloadError);
                Alert.alert('Error', downloadError.message || 'Failed to download template.');
              }
            }
          }
        ]
      );
    } catch (error) {
      console.error('❌ Template download error:', error);
      Alert.alert('Error', 'Failed to download template.');
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right']}>
      <View style={[styles.header, { paddingTop: insets.top + 24 }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <BackIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Import Taxonomy Data</Text>
        <View style={styles.headerSpacer} />
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* Instructions */}
        <View style={styles.instructionsContainer}>
          <Text style={styles.instructionsTitle}>File Requirements</Text>
          <View style={styles.instructionsList}>
            <Text style={styles.instructionItem}>• Supported formats: CSV, Excel (.xlsx, .xls)</Text>
            <Text style={styles.instructionItem}>• Maximum file size: 10MB</Text>
            <Text style={styles.instructionItem}>• Required columns: genus_name, species_name</Text>
            <Text style={styles.instructionItem}>• Optional columns: variegation, shipping_index (1-10), acclimation_index (1-10)</Text>
            <Text style={styles.instructionItem}>• Download the template below to get started</Text>
          </View>
          
          {/* Download Template Button */}
          <TouchableOpacity 
            style={styles.downloadTemplateButton} 
            onPress={handleDownloadTemplate}
          >
            <DownloadIcon width={20} height={20} style={styles.downloadIcon} />
            <Text style={styles.downloadTemplateText}>Download Template</Text>
          </TouchableOpacity>
        </View>

        {/* File Selection */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Select File</Text>
          
          {!selectedFile ? (
            <TouchableOpacity style={styles.uploadArea} onPress={handleFileSelect}>
              <UploadIcon width={48} height={48} style={styles.uploadIcon} />
              <Text style={styles.uploadTitle}>Choose File</Text>
              <Text style={styles.uploadSubtitle}>Select a CSV or Excel file</Text>
            </TouchableOpacity>
          ) : (
            <View style={styles.selectedFileContainer}>
              <View style={styles.fileInfo}>
                <FileIcon width={32} height={32} style={styles.fileIcon} />
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName}>{selectedFile.name}</Text>
                  <Text style={styles.fileSize}>{formatFileSize(selectedFile.size)}</Text>
                  <Text style={styles.fileType}>{selectedFile.type || 'Unknown type'}</Text>
                </View>
              </View>
              <TouchableOpacity style={styles.changeFileButton} onPress={handleFileSelect}>
                <Text style={styles.changeFileText}>Change File</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Upload Progress */}
        {isUploading && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Importing...</Text>
            <View style={styles.progressContainer}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: `${uploadProgress}%` }]} />
              </View>
              <Text style={styles.progressText}>{uploadProgress}%</Text>
            </View>
            <ActivityIndicator size="large" color="#007AFF" style={styles.loader} />
          </View>
        )}

        {/* Import Results */}
        {importResults && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Import Results</Text>
            <View style={[
              styles.resultsContainer, 
              importResults.success ? styles.successResults : styles.errorResults
            ]}>
              <View style={styles.resultHeader}>
                <CheckIcon 
                  width={24} 
                  height={24} 
                  style={[
                    styles.resultIcon, 
                    importResults.success ? styles.successIcon : styles.errorIcon
                  ]} 
                />
                <Text style={[
                  styles.resultTitle,
                  importResults.success ? styles.successTitle : styles.errorTitle
                ]}>
                  {importResults.success ? 'Import Successful' : 'Import Failed'}
                </Text>
              </View>
              
              {importResults.success && (
                <View style={styles.resultStats}>
                  <Text style={styles.resultStat}>Genera imported: {importResults.genera || 0}</Text>
                  <Text style={styles.resultStat}>Species imported: {importResults.species || 0}</Text>
                  <Text style={styles.resultStat}>Total entries: {importResults.imported || 0}</Text>
                  {(importResults.skipped > 0) && (
                    <Text style={styles.resultStat}>Skipped duplicates: {importResults.skipped}</Text>
                  )}
                  <Text style={styles.resultStat}>Processing time: {importResults.processing_time || 'N/A'}</Text>
                  <Text style={styles.resultStat}>Errors: {importResults.errors || 0}</Text>
                </View>
              )}
              
              <Text style={styles.resultMessage}>{importResults.message}</Text>
            </View>
          </View>
        )}

        {/* Action Buttons */}
        <View style={styles.actionsContainer}>
          {selectedFile && !isUploading && !importResults && (
            <TouchableOpacity style={styles.importButton} onPress={handleImport}>
              <Text style={styles.importButtonText}>Import Data</Text>
            </TouchableOpacity>
          )}
          
          {/* Success Actions */}
          {importResults && importResults.success && (
            <TouchableOpacity 
              style={[styles.importButton, { backgroundColor: '#34C759' }]} 
              onPress={() => navigation.navigate('Taxonomy')}
            >
              <Text style={styles.importButtonText}>Back to Taxonomy</Text>
            </TouchableOpacity>
          )}
          
          {(selectedFile || importResults) && !isUploading && (
            <TouchableOpacity style={styles.resetButton} onPress={resetImport}>
              <Text style={styles.resetButtonText}>Start Over</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>
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
    paddingHorizontal: 16,
    paddingBottom: 16,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  backButton: {
    width: 24,
    height: 24,
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '600',
    color: '#202325',
    textAlign: 'center',
    marginHorizontal: 16,
  },
  headerSpacer: {
    width: 24,
  },
  content: {
    flex: 1,
    padding: 16,
  },
  instructionsContainer: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    padding: 16,
    marginBottom: 24,
  },
  instructionsTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    marginBottom: 12,
  },
  instructionsList: {
    gap: 8,
  },
  instructionItem: {
    fontSize: 14,
    color: '#647276',
    lineHeight: 20,
  },
  downloadTemplateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#007AFF',
    borderRadius: 8,
    paddingVertical: 12,
    paddingHorizontal: 16,
    marginTop: 16,
    gap: 8,
  },
  downloadIcon: {
    tintColor: '#FFFFFF',
  },
  downloadTemplateText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  section: {
    marginBottom: 24,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#202325',
    marginBottom: 12,
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
    marginBottom: 2,
  },
  fileSize: {
    fontSize: 14,
    color: '#647276',
    marginBottom: 2,
  },
  fileType: {
    fontSize: 12,
    color: '#8E8E93',
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
    marginBottom: 16,
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
    backgroundColor: '#007AFF',
    borderRadius: 4,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#647276',
  },
  loader: {
    marginTop: 16,
  },
  resultsContainer: {
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
  },
  successResults: {
    backgroundColor: '#F0F9F0',
    borderColor: '#34C759',
  },
  errorResults: {
    backgroundColor: '#FFF5F5',
    borderColor: '#FF3B30',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  resultIcon: {
    marginRight: 8,
  },
  successIcon: {
    color: '#34C759',
  },
  errorIcon: {
    color: '#FF3B30',
  },
  resultTitle: {
    fontSize: 16,
    fontWeight: '600',
  },
  successTitle: {
    color: '#34C759',
  },
  errorTitle: {
    color: '#FF3B30',
  },
  resultStats: {
    marginBottom: 12,
    gap: 4,
  },
  resultStat: {
    fontSize: 14,
    color: '#647276',
  },
  resultMessage: {
    fontSize: 14,
    color: '#647276',
    lineHeight: 20,
  },
  actionsContainer: {
    gap: 12,
    paddingBottom: 32,
  },
  importButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
  },
  importButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
  resetButton: {
    backgroundColor: '#F8F9FA',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
  },
  resetButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#647276',
  },
});

export default ImportTaxonomyScreen;
