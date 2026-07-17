import React from 'react';
import { ActivityIndicator, Platform, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import ScanQrIcon from '../../assets/admin-icons/qr.svg';
import DownloadIcon from '../../assets/icons/accent/download.svg';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import PrintIcon from '../../assets/icons/greylight/printer.svg';
import { useLeafTrailHubActions } from '../../hooks/useLeafTrailHubActions';

/**
 * Detail screen header: back, title, optional print + export + QR scan (hub spec).
 */
const LeafTrailDetailHeader = ({
  title,
  navigation,
  scanQrParams,
  exportLines = [],
  exportStageLabel = 'leaf-trail',
  onPrintPress,
  printDisabled = false,
  exportDisabled = false,
}) => {
  const insets = useSafeAreaInsets();
  const headerTopPadding = Platform.OS === 'ios' ? Math.max(insets.top, 12) : 10;
  const { onPrint, onExport, exportLoading } = useLeafTrailHubActions({
    exportLines,
    exportStageLabel,
    onPrintPress,
    printDisabled,
    exportDisabled,
    emptyExportMessage: 'No plants to export on this screen.',
  });

  return (
    <View style={[styles.headerContainer, { paddingTop: headerTopPadding }]}>
      <TouchableOpacity onPress={() => navigation.goBack()}>
        <BackSolidIcon />
      </TouchableOpacity>
      <Text style={styles.headerTitle} numberOfLines={1}>
        {title}
      </Text>
      <View style={styles.rightActions}>
        <TouchableOpacity
          style={styles.headerAction}
          onPress={onPrint}
          accessibilityLabel="Print barcode">
          <PrintIcon width={22} height={22} />
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.headerAction, exportLoading && styles.headerActionDisabled]}
          onPress={onExport}
          disabled={exportLoading}
          accessibilityLabel="Export data">
          {exportLoading ? (
            <ActivityIndicator size="small" color="#539461" />
          ) : (
            <DownloadIcon width={22} height={22} />
          )}
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.headerActionScan}
          onPress={() =>
            navigation.navigate('LeafTrailScanQRAdminScreen', scanQrParams || {})
          }
          accessibilityLabel="Scan QR code">
          <ScanQrIcon width={40} height={40} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  headerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 10,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E3E7E8',
  },
  headerTitle: {
    flex: 1,
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
    marginHorizontal: 8,
  },
  rightActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  headerAction: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
  },
  headerActionScan: {
    width: 40,
    height: 40,
    justifyContent: 'center',
    alignItems: 'center',
  },
  headerActionDisabled: {
    opacity: 0.5,
  },
});

export default LeafTrailDetailHeader;
