import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
  ScrollView,
} from 'react-native';
import { useNavigation, useRoute } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import FileViewer from 'react-native-file-viewer';
import RNFS from 'react-native-fs';
import { getInvoicePdfApi, generateInvoiceApi } from '../../../components/Api/orderManagementApi';

// Import icons
import BackIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import EmailIcon from '../../../assets/icons/greydark/envelope-simple-regular.svg';

const InvoiceViewScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const insets = useSafeAreaInsets();
  
  const { transactionNumber, plantCode } = route.params || {};
  
  const [loading, setLoading] = useState(true);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [error, setError] = useState(null);
  const [pdfPath, setPdfPath] = useState(null);

  useEffect(() => {
    if (!transactionNumber) {
      setError('Missing transaction number');
      setLoading(false);
      return;
    }

    loadInvoice();
  }, [transactionNumber, plantCode]);

  const loadInvoice = async () => {
    try {
      setLoading(true);
      setError(null);

      console.log('📄 Loading invoice PDF:', { transactionNumber, plantCode: plantCode || 'all products' });

      // Invoice now shows ALL products from the transaction (grouped by transaction number)
      // plantCode is no longer needed - backend will show all products
      const response = await getInvoicePdfApi({
        transactionNumber
        // plantCode is intentionally omitted - invoice shows all products
      });

      if (!response.success || !response.pdfBase64) {
        throw new Error(response.error || 'Failed to load invoice');
      }

      // Convert base64 to file
      const fileName = response.filename || `Invoice_${transactionNumber}_${Date.now()}.pdf`;
      const filePath = `${RNFS.DocumentDirectoryPath}/${fileName}`;
      
      // Write base64 to file
      await RNFS.writeFile(filePath, response.pdfBase64, 'base64');
      
      console.log('✅ Invoice PDF saved to:', filePath);
      setPdfPath(filePath);
      
      // Open PDF viewer
      try {
        await FileViewer.open(filePath);
      } catch (viewerError) {
        console.error('Error opening PDF viewer:', viewerError);
        // If viewer fails, still show success (file is saved)
        Alert.alert(
          'Invoice Loaded',
          'Invoice has been loaded. You can find it in your device files.',
          [{ text: 'OK' }]
        );
      }
      
      setLoading(false);
    } catch (err) {
      console.error('Error loading invoice:', err);
      setError(err.message || 'Failed to load invoice');
      setLoading(false);
    }
  };

  const handleSendToEmail = async () => {
    try {
      setSendingEmail(true);

      // Invoice now shows ALL products from the transaction (grouped by transaction number)
      // plantCode is no longer needed - backend will show all products
      const response = await generateInvoiceApi({
        transactionNumber
        // plantCode is intentionally omitted - invoice shows all products
      });

      if (!response.success) {
        throw new Error(response.error || 'Failed to send invoice');
      }

      const emailAddress = response.sentTo || response.details?.sentTo || 'your email';
      Alert.alert(
        'Invoice Sent',
        `Invoice has been sent successfully to:\n\n${emailAddress}\n\nPlease check your email inbox.`,
        [{ text: 'OK' }]
      );
    } catch (err) {
      console.error('Error sending invoice:', err);
      Alert.alert('Error', err.message || 'Failed to send invoice to email');
    } finally {
      setSendingEmail(false);
    }
  };

  return (
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => navigation.goBack()}
        >
          <BackIcon width={24} height={24} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Invoice</Text>
        <View style={styles.headerSpacer} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        {loading ? (
          <View style={styles.centerContainer}>
            <ActivityIndicator size="large" color="#539461" />
            <Text style={styles.loadingText}>Loading invoice...</Text>
          </View>
        ) : error ? (
          <View style={styles.centerContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity
              style={styles.retryButton}
              onPress={loadInvoice}
            >
              <Text style={styles.retryButtonText}>Retry</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.centerContainer}>
            <Text style={styles.successText}>Invoice loaded successfully</Text>
            <Text style={styles.infoText}>
              The invoice PDF has been opened in your default PDF viewer.
            </Text>
            {pdfPath && (
              <TouchableOpacity
                style={styles.openButton}
                onPress={async () => {
                  try {
                    await FileViewer.open(pdfPath);
                  } catch (err) {
                    Alert.alert('Error', 'Failed to open PDF viewer');
                  }
                }}
              >
                <Text style={styles.openButtonText}>Open Invoice Again</Text>
              </TouchableOpacity>
            )}
          </View>
        )}
      </View>

      {/* Send to Email Button */}
      {!loading && !error && (
        <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom, 20) }]}>
          <TouchableOpacity
            style={[styles.sendButton, sendingEmail && styles.sendButtonDisabled]}
            onPress={handleSendToEmail}
            disabled={sendingEmail}
          >
            {sendingEmail ? (
              <ActivityIndicator size="small" color="#FFFFFF" />
            ) : (
              <>
                <EmailIcon width={20} height={20} />
                <Text style={styles.sendButtonText}>Send to Email</Text>
              </>
            )}
          </TouchableOpacity>
        </View>
      )}
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
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E5E7EB',
  },
  backButton: {
    paddingVertical: 8,
    paddingLeft: 0,
  },
  headerTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
  },
  headerSpacer: {
    width: 40,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  centerContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
  },
  loadingText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#647276',
    marginTop: 12,
  },
  errorText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#F44336',
    textAlign: 'center',
  },
  successText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#539461',
    textAlign: 'center',
  },
  infoText: {
    fontFamily: 'Inter',
    fontWeight: '400',
    fontSize: 14,
    color: '#647276',
    textAlign: 'center',
    maxWidth: 300,
  },
  retryButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#539461',
    borderRadius: 8,
  },
  retryButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
  openButton: {
    marginTop: 8,
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#539461',
    borderRadius: 8,
  },
  openButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#539461',
  },
  footer: {
    paddingHorizontal: 15,
    paddingTop: 20,
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  sendButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 14,
    height: 48,
    backgroundColor: '#539461',
    borderRadius: 12,
    gap: 8,
    minHeight: 48,
  },
  sendButtonDisabled: {
    backgroundColor: '#CDD3D4',
  },
  sendButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },
});

export default InvoiceViewScreen;

