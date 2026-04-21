import React, {useState} from 'react';
import { View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Modal,
  ActivityIndicator,
  Alert,
  Platform,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import DocumentPicker from 'react-native-document-picker';
import RNFS from 'react-native-fs';
import Share from 'react-native-share';
import {fromByteArray} from 'base64-js';
import {globalStyles} from '../../../assets/styles/styles';
import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import {API_ENDPOINTS} from '../../../config/apiConfig';
import Toast from '../../../components/Toast/Toast';
import { uploadLiveListingRows,
  validateLiveListingRow,
} from '../../../utils/liveListingBulkUpload';
import {parseLiveListingExcelFromBase64} from '../../../utils/parseLiveListingExcel';

const ScreenLiveSaleExcelUpload = ({navigation}) => {
  const insets = useSafeAreaInsets();
  const [selectedFile, setSelectedFile] = useState(null);
  const [isDownloading, setIsDownloading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({current: 0, total: 0});
  const [toastVisible, setToastVisible] = useState(false);
  const [toastMessage, setToastMessage] = useState('');
  const [toastType, setToastType] = useState('success');

  const showToast = (message, type = 'success') => {
    setToastMessage(message);
    setToastType(type);
    setToastVisible(true);
  };

  const handleDownloadTemplate = async () => {
    try {
      setIsDownloading(true);
      const templateUrl = API_ENDPOINTS.DOWNLOAD_LIVE_LISTING_BATCH_TEMPLATE;
      const timestamp = new Date().getTime();
      const fileName = `live_listing_batch_template_${timestamp}.xlsx`;
      const localPath = `${RNFS.CachesDirectoryPath}/${fileName}`;

      const response = await fetch(templateUrl, {method: 'GET'});
      if (!response.ok) {
        if (response.status === 404) {
          throw new Error(
            'Template is not available yet (server function may need to be deployed).',
          );
        }
        throw new Error(`Server returned HTTP ${response.status}`);
      }

      const contentType = (response.headers.get('content-type') || '').toLowerCase();
      const buffer = await response.arrayBuffer();
      if (!buffer || buffer.byteLength < 64) {
        throw new Error('Downloaded file is empty or too small to be a valid spreadsheet.');
      }
      if (
        contentType.includes('text/html') ||
        (contentType.includes('application/json') && !contentType.includes('spreadsheet'))
      ) {
        throw new Error(
          'The server did not return an Excel file. Check your connection or API configuration.',
        );
      }

      const base64 = fromByteArray(new Uint8Array(buffer));
      await RNFS.writeFile(localPath, base64, 'base64');

      const fileUrl = localPath.startsWith('file://') ? localPath : `file://${localPath}`;
      try {
        await Share.open({
          url: fileUrl,
          type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          filename: fileName,
          title: 'Save live listing template',
          failOnCancel: false,
          showAppsToView: true,
          // iOS: opens the Files “save” picker so the .xlsx is a real saved document
          ...(Platform.OS === 'ios' ? {saveToFiles: true} : {}),
        });
      } catch (shareErr) {
        const msg = String(shareErr?.message || shareErr || '');
        if (
          !msg.includes('did not share') &&
          !msg.includes('User did not share') &&
          !msg.toLowerCase().includes('cancel')
        ) {
          console.warn('Share template sheet:', shareErr);
          Alert.alert(
            'Could not open save / share',
            `The template was downloaded inside the app. Try Download again.\n\n${msg}`,
          );
        }
      }
    } catch (e) {
      console.warn('Template download failed:', e?.message);
      Alert.alert(
        'Download failed',
        e?.message || 'Could not download the template. Check your connection.',
      );
    } finally {
      setIsDownloading(false);
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.pick({
        type: [
          DocumentPicker.types.xlsx,
          DocumentPicker.types.xls,
          'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
          'application/vnd.ms-excel',
        ],
        allowMultiSelection: false,
        copyTo: 'cachesDirectory',
      });
      if (!result?.length) {
        return;
      }
      const file = result[0];
      const fileToUse = {
        ...file,
        uri: file.fileCopyUri || file.uri,
      };
      const maxSize = 10 * 1024 * 1024;
      if (fileToUse.size > maxSize) {
        Alert.alert('File too large', 'Please use a file under 10 MB.');
        return;
      }
      setSelectedFile(fileToUse);
    } catch (error) {
      if (DocumentPicker.isCancel(error)) {
        return;
      }
      Alert.alert('File selection failed', error?.message || 'Try again.');
    }
  };

  const handleUploadListings = async () => {
    if (!selectedFile?.uri) {
      Alert.alert('No file', 'Select an Excel file first.');
      return;
    }
    let base64;
    try {
      base64 = await RNFS.readFile(selectedFile.uri, 'base64');
    } catch (e) {
      Alert.alert('Read failed', 'Could not read the selected file.');
      return;
    }

    const {rows, error} = parseLiveListingExcelFromBase64(base64);
    if (error) {
      Alert.alert('Spreadsheet', error);
      return;
    }

    for (let i = 0; i < rows.length; i++) {
      const err = validateLiveListingRow(rows[i]);
      if (err) {
        Alert.alert('Validation', `Sheet row ${i + 2}: ${err}`);
        return;
      }
    }

    setUploading(true);
    try {
      const {successCount, failCount, total} = await uploadLiveListingRows(rows, {
        onProgress: ({current, total: t}) => setUploadProgress({current, total: t}),
      });
      if (failCount === 0) {
        showToast(`${successCount} listing(s) uploaded successfully.`);
        setSelectedFile(null);
      } else {
        showToast(
          `${successCount} succeeded, ${failCount} failed.`,
          failCount === total ? 'error' : 'success',
        );
      }
    } finally {
      setUploading(false);
      setUploadProgress({current: 0, total: 0});
    }
  };

  return (
    <View style={[styles.root, {paddingTop: insets.top}]}>
      <View style={styles.header}>
        <TouchableOpacity
          hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}
          onPress={() => navigation.goBack()}
          style={styles.backButton}>
          <LeftIcon width={30} height={30} />
        </TouchableOpacity>
        <Text style={[globalStyles.textMDGreyDark, globalStyles.textBold]}>
          Live sale — Excel
        </Text>
        <View style={styles.headerRight} />
      </View>

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={[
          styles.scrollContent,
          {paddingBottom: insets.bottom + 32},
        ]}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}>
        <Text style={styles.instructionsTitle}>How it works</Text>
        <Text style={styles.instructionsBody}>
          1. Download the template (header row only).{'\n'}
          2. Add one row per listing. Columns: genus, species, variegation (optional),
          pot_size (2&quot;, 4&quot;, or 6&quot;), local_price (number),
          approximate_height (below or above).{'\n'}
          3. Images are not supported in this Excel flow; add photos later from your
          listing list if needed.{'\n'}
          4. Upload the filled file here.
        </Text>

        <TouchableOpacity
          style={[styles.actionBtn, isDownloading && styles.actionBtnDisabled]}
          onPress={handleDownloadTemplate}
          disabled={isDownloading || uploading}>
          <Text style={styles.actionBtnText}>
            {isDownloading ? 'Downloading…' : 'Download Excel template'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.actionBtn, styles.actionBtnOutline, uploading && styles.actionBtnDisabled]}
          onPress={handlePickFile}
          disabled={uploading}>
          <Text style={[styles.actionBtnText, styles.actionBtnTextOutline]}>
            Upload Excel file
          </Text>
        </TouchableOpacity>

        {selectedFile ? (
          <Text style={styles.fileName} numberOfLines={2}>
            Selected: {selectedFile.name}
          </Text>
        ) : null}

        <TouchableOpacity
          style={[
            globalStyles.primaryButton,
            styles.submitBtn,
            (!selectedFile || uploading) && styles.actionBtnDisabled,
          ]}
          onPress={handleUploadListings}
          disabled={!selectedFile || uploading}>
          <Text style={globalStyles.primaryButtonText}>
            {uploading
              ? `Uploading ${uploadProgress.current}/${uploadProgress.total}…`
              : 'Create listings from file'}
          </Text>
        </TouchableOpacity>
      </ScrollView>

      {(isDownloading || uploading) && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
            {uploading && uploadProgress.total > 0 ? (
              <Text style={styles.loadingText}>
                {uploadProgress.current} / {uploadProgress.total}
              </Text>
            ) : null}
          </View>
        </Modal>
      )}

      <Toast
        visible={toastVisible}
        message={toastMessage}
        type={toastType}
        duration={3000}
        position="bottom"
        onHide={() => setToastVisible(false)}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
    backgroundColor: '#fff',
  },
  backButton: {padding: 5},
  headerRight: {minWidth: 60},
  scroll: {flex: 1},
  scrollContent: {padding: 20},
  instructionsTitle: {
    ...globalStyles.textMDGreyDark,
    fontWeight: '700',
    marginBottom: 8,
  },
  instructionsBody: {
    ...globalStyles.textSMGreyDark,
    lineHeight: 22,
    marginBottom: 24,
  },
  actionBtn: {
    backgroundColor: '#23C16B',
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: 'center',
    marginBottom: 12,
  },
  actionBtnOutline: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#23C16B',
  },
  actionBtnDisabled: {opacity: 0.55},
  actionBtnText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  actionBtnTextOutline: {
    color: '#23C16B',
  },
  fileName: {
    ...globalStyles.textSMGreyDark,
    marginBottom: 16,
  },
  submitBtn: {marginTop: 8},
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.35)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 12,
    color: '#fff',
    fontSize: 16,
  },
});

export default ScreenLiveSaleExcelUpload;
