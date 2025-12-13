import React, { useCallback, useEffect, useState } from 'react';
import {
  Image,
  SafeAreaView,
  ScrollView,
  StatusBar,
  StyleSheet,
  ActivityIndicator,
  Text,
  TouchableOpacity,
  Vibration,
  View
} from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import {
  Camera,
  useCameraDevice,
  useCameraPermission,
  useCodeScanner
} from 'react-native-vision-camera';
import CopyIcon from '../../../../assets/admin-icons/Copy.svg';
import QuestionMarkTooltip from '../../../../assets/admin-icons/question-mark.svg';
import BackSolidIcon from '../../../../assets/iconnav/caret-left-bold.svg';
import { getAdminScanQr } from '../../../../components/Api/getAdminLeafTrail';
import CountryFlagIcon from '../../../../components/CountryFlagIcon/CountryFlagIcon';

const DetailRow = ({ label, value, valueBold = false }) => (
  <View style={styles.detailRow}>
    <Text style={styles.detailLabel}>{label}</Text>
    <Text style={[styles.detailValue, valueBold && styles.detailValueBold]}>{value}</Text>
  </View>
);

const UserCard = ({ user }) => (
  <View style={styles.userListContainer}>
    <View style={styles.userCard}>
      <Image source={{uri:user.avatar}} style={styles.userAvatar} />
      <View style={styles.userContent}>
        <View style={styles.userNameRow}>
          <Text style={styles.userName}>{user.name}</Text>
          <Text style={styles.userUsername}>{user.username}</Text>
        </View>
        <Text style={styles.userDetailsLabel}>{user.role}</Text>
      </View>
    </View>
  </View>
);

const ScanQRScreen = ({ navigation, route }) => {
  
  const {hasPermission, requestPermission} = useCameraPermission();
  const device = useCameraDevice('back');
  const [latestScannedData, setLatestScannedData] = useState(null);
  const [buttomData, setButtomData] = useState("scan");
  const [isScanning, setIsScanning] = useState(false);
  const [plantData, setPlantData] = useState();
  const { leafTrailStatus=null } = route.params || {};

  // --- Side Effect: Request Camera Permission ---
  useEffect(() => {
    requestPermission();
  }, []); // Empty dependency array ensures this runs once on mount

  const codeScanner = useCodeScanner({
    codeTypes: ['qr', 'ean-13'],
    onCodeScanned: useCallback(async (codes) => {
      let filters = codes[0].value;
      if ((typeof filters) === 'string') {      
        filters = JSON.parse(filters)
      }
      if (isScanning && latestScannedData === (filters.orderId + filters.plantCode)) {
        return;
      }

      setIsScanning(true);
      setButtomData('loading');

      try {
        if (codes.length > 0 && codes[0]?.value) {
          console.log('codes[0].valuecodes[0].value', typeof codes[0].value);

          if (!(filters?.orderId) || !(filters?.plantCode)) {
            throw new Error('Invalid QR Code Data');
          }
          
          setLatestScannedData(filters.orderId + filters.plantCode);
          const response = await getAdminScanQr(filters, leafTrailStatus, isScanning);

          setPlantData(response);
          setButtomData('success');
          Vibration.vibrate();
          setTimeout(() => {
            setIsScanning(false);
          }, 5000);
        }
      } catch (error) {
        setButtomData('invalid');
      } finally {
        setTimeout(() => {
          setIsScanning(false);
        }, 5000);
      }
    }),
  });

  if (device == null) {
    return (
      <View>
        <Text>Device Not Found</Text>
      </View>
    );
  }
  
  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.screenContainer} edges={['top']}>
        {/* The overlay is dark, so a light-content status bar is appropriate */}
        <StatusBar barStyle="light-content" />
        

        {/* This view creates the dark overlay effect */}
          <View style={styles.overlay} />
        <Camera
          style={StyleSheet.absoluteFill}
          codeScanner={codeScanner}
          device={device}
          isActive={true}
        />
      
          {/* Top Navigation Header */}
          <View style={styles.header}>
            <TouchableOpacity
              style={styles.backButton}
              onPress={() => navigation.goBack()}
            >
              <BackSolidIcon />
            </TouchableOpacity>
          </View>

          {/* This is the white square guide for the scanner */}
          <View style={styles.scannerFrame} />

          {/* Bottom Sheet with information */}
        {buttomData === 'scan' && (
          <View style={styles.bottomSheet}>
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>Scan QR Code</Text>
            </View>
            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>
                Align the QR Code with the camera.
              </Text>
            </View>
          </View>
        )}

        {buttomData === 'loading' && (
          <View style={styles.bottomSheet}>
            <View style={styles.titleContainer}>
              <Text style={styles.titleText}>Scanning...</Text>
            </View>
            <View style={styles.noteContainer}>
              <ActivityIndicator size="small" color="#647276" style={{ marginBottom: 8 }} />
              <Text style={styles.noteText}>
                This won’t take long.
              </Text>
            </View>
          </View>
        )}

        {buttomData === 'invalid' && (
          <View style={styles.bottomSheet}>
            <View style={styles.titleContainer}>
              <Text style={styles.titleTextInvalid}>Invalid QR Code!</Text>
            </View>
            <View style={styles.noteContainer}>
              <Text style={styles.noteText}>
                This plant code and transaction number is not found, Please contract the supplier.
              </Text>
            </View>
          </View>
        )}

           {/* Content Bottom Sheet */}
          <ScrollView style={buttomData !== 'success' ? styles.displayNone : styles.contentContainer} showsVerticalScrollIndicator={false}>
            
            <View style={styles.contentInnerContainer}>
              {/* Title */}
              <View style={styles.titleSection}>
                <Text style={styles.titleText}>Scan Success!</Text>
              </View>

              {/* Details Section */}
              <View style={styles.detailsSection}>
                <View style={styles.mutationRow}>
                    <Text style={styles.mutationLabel}>Status:</Text>
                    <Text style={styles.mutationText}>{plantData?.leafTrailStatus || ''}</Text>
                </View>
                <View style={styles.invoiceRow}>
                    <Text style={styles.invoiceLabel}>Transaction Number:</Text>
                    <View style={styles.invoiceCode}>
                        <Text style={styles.invoiceNumber}>{plantData?.transactionNumber || ''}</Text>
                        <TouchableOpacity>
                            <CopyIcon />
                        </TouchableOpacity>
                    </View>
                </View>
              </View>

              {/* Plant Card Section */}
              <View style={styles.plantListSection}>
                <View style={styles.plantCard}>
                    <Image source={{uri: plantData?.plantImage || ''}} style={styles.plantImage} />
                    <View style={styles.plantDetails}>
                        <View style={styles.plantNameSection}>
                            <View style={styles.plantCodeCountry}>
                                <View style={styles.plantCodeContainer}>
                                    <Text style={styles.plantCodeNumber}>{plantData?.plantCode || ''}</Text>
                                    <TouchableOpacity>
                                        <QuestionMarkTooltip />
                                    </TouchableOpacity>
                                </View>
                                <View style={styles.plantCountryContainer}>
                                    <Text style={styles.plantCountryText}>{plantData?.countryCode || ''}</Text>
                                    <CountryFlagIcon code={plantData?.countryCode || ''} width={24} height={16} />
                                </View>
                            </View>
                            <Text style={styles.plantGenus}>{plantData?.genus || ''}</Text>
                            <View style={styles.plantVariegationSize}>
                                <Text style={styles.plantLabel}>{plantData?.variegation || ''}</Text>
                                <View style={styles.dividerDot} />
                                <Text style={styles.plantSizeText}>{plantData?.size || ''}</Text>
                            </View>
                        </View>
                        <View style={styles.plantTypeQuantity}>
                            <View style={styles.listingTypeChip}>
                                <Text style={styles.listingTypeLabel}>{plantData?.type || ''}</Text>
                            </View>
                            <Text style={styles.quantityText}>x{plantData?.quantity || ''}</Text>
                        </View>
                    </View>
                </View>
              </View>

              {/* Transaction Details */}
              <View style={styles.transactionSection}>
                <Text style={styles.sectionTitle}>Transaction Details</Text>
                <View style={styles.transactionDetailsContainer}>
                  <DetailRow label="Plant Flight" value={plantData?.transactionDetails?.plantFlight || ''} valueBold />
                  <DetailRow label="Order Date" value={plantData?.transactionDetails?.orderDate || ''} valueBold />
                </View>
              </View>

              {/* Purchase Details */}
              <View style={styles.purchaseSection}>
                <Text style={styles.sectionTitle}>Purchase Details</Text>
                {(plantData?.purchaseDetails || []).map((user, index) => (
                  <UserCard key={index} user={user} />
                ))}
              </View>
            </View>
          </ScrollView>
      </SafeAreaView>
    </SafeAreaProvider>
  );
};

const styles = StyleSheet.create({
  displayNone: {
    display: 'none'
  },
  screenContainer: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  backgroundImage: {
    flex: 1,
    // The Figma design uses absolute positioning, but flexbox achieves
    // the same full-screen effect more robustly in React Native.
  },
  // --- Overlays & Scanner ---
  overlay: {
    ...StyleSheet.absoluteFillObject, // This makes the view cover the entire parent
    backgroundColor: 'rgba(0, 0, 0, 0.6)', // Semi-transparent black overlay
  },
  scannerFrame: {
    position: 'absolute',
    width: 208,
    height: 208,
    top: 196,
    alignSelf: 'center',
    borderWidth: 2, // Using border instead of a background for a clean frame
    borderColor: '#FFFFFF',
    borderRadius: 16, // Added for a softer look
  },
  // --- Header Navigation ---
  header: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    paddingTop: 10, // Adjust for status bar height if not using SafeAreaView
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    height: 50,
  },
  backButton: {
    width: 32,
    height: 32,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F5F6F6',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  backButtonIcon: {
    color: '#393D40',
    fontSize: 24,
    fontWeight: 'bold',
    lineHeight: 26, // Fine-tuning for vertical alignment
  },
  // --- Bottom Content Sheet ---
  bottomSheet: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingBottom: 74, // Safe area for home indicator
  },
  titleContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    paddingTop: 24,
    paddingBottom: 8,
    paddingHorizontal: 24,
  },
  titleText: {
    // Note: You must have the 'Inter' font linked in your project
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
    color: '#202325',
  },
  titleTextInvalid: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    textAlign: 'center',
    color: '#E7522F',
  },
  noteContainer: {
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  noteText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22, // 140% of 16px
    textAlign: 'center',
    color: '#647276',
  },
  contentContainer: {
    position: 'absolute',
    top: 500,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  contentInnerContainer: {
    paddingBottom: 34, // For home indicator space
  },
  titleSection: {
    paddingHorizontal: 24,
    paddingTop: 24,
    marginBottom: 8,
  },
  titleText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    color: '#539461',
  },
  detailsSection: {
    paddingHorizontal: 24,
    paddingBottom: 16,
    gap: 8,
  },
  mutationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  mutationLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#7F8D91',
  },
  mutationText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#202325',
    flex: 1,
  },
  invoiceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    // justifyContent: 'space-between',
  },
  invoiceLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#647276',
  },
  invoiceCode: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  invoiceNumber: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#202325',
  },
  // Plant Card
  plantListSection: {
    padding: 12,
    backgroundColor: '#F5F6F6',
  },
  plantCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  plantImage: {
    width: 96,
    height: 128,
    borderRadius: 8,
  },
  plantDetails: {
    flex: 1,
    flexDirection: 'column',
    justifyContent: 'space-between',
    gap: 8,
  },
  plantNameSection: {
    gap: 4,
  },
  plantCodeCountry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  plantCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  plantCodeNumber: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#647276',
  },
  plantCountryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  plantCountryText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#556065',
  },
  flagPlaceholder: {
    width: 24,
    height: 16,
    backgroundColor: '#F0F0F0', // Placeholder color for flag
    borderRadius: 2,
  },
  plantGenus: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    color: '#202325',
  },
  plantVariegationSize: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  plantLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#647276',
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7F8D91',
  },
  plantSizeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#647276',
  },
  plantTypeQuantity: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  listingTypeChip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: '#202325',
    borderRadius: 6,
  },
  listingTypeLabel: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    color: '#FFFFFF',
  },
  quantityText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#393D40',
  },
  // Details Rows
  sectionTitle: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    paddingHorizontal: 15,
  },
  transactionSection: {
    paddingVertical: 16,
    gap: 8,
  },
  transactionDetailsContainer: {
      paddingHorizontal: 15,
  },
  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 4,
    minHeight: 32,
  },
  detailLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#556065',
  },
  detailValue: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#202325',
  },
  detailValueBold: {
    fontWeight: '700',
  },
  // User Cards
  purchaseSection: {
    backgroundColor: '#F5F6F6',
    paddingVertical: 16,
  },
  userListContainer: {
      paddingHorizontal: 12,
      paddingVertical: 6,
  },
  userCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 12,
    gap: 12,
  },
  userAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#539461',
  },
  userContent: {
    flex: 1,
    gap: 4,
  },
  userNameRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 4,
  },
  userName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    color: '#202325',
  },
  userUsername: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#7F8D91',
    flex: 1,
  },
  userDetailsLabel: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#647276',
  },
});

export default ScanQRScreen;