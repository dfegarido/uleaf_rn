import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { exportLeafTrailLinesToCsv } from '../utils/leafTrailHubExport';

/**
 * Print + export handlers for Leaf Trail hub spec (header actions).
 */
export function useLeafTrailHubActions({
  exportLines = [],
  exportStageLabel = 'leaf-trail',
  onPrintPress,
  printDisabled = false,
  exportDisabled = false,
  emptyPrintMessage,
  emptyExportMessage,
} = {}) {
  const [exporting, setExporting] = useState(false);

  const handleExport = useCallback(async () => {
    if (exporting) return;
    if (exportDisabled) {
      Alert.alert(
        'Export',
        emptyExportMessage || 'Export is not available on this screen.',
      );
      return;
    }
    if (!exportLines.length) {
      Alert.alert(
        'Nothing to export',
        emptyExportMessage ||
          'No plants in the current list. Open a receiver, tray, or box to export plant lines.',
      );
      return;
    }
    try {
      setExporting(true);
      const result = await exportLeafTrailLinesToCsv(exportLines, {
        stageLabel: exportStageLabel,
      });
      if (result?.success) {
        Alert.alert('Export', `Shared CSV for ${result.count} plant line(s).`);
      }
    } catch (e) {
      if (e?.message !== 'User did not share') {
        Alert.alert('Export failed', e?.message || 'Could not export data.');
      }
    } finally {
      setExporting(false);
    }
  }, [
    exportDisabled,
    exporting,
    exportLines,
    exportStageLabel,
    emptyExportMessage,
  ]);

  const handlePrint = useCallback(() => {
    if (typeof onPrintPress !== 'function') {
      Alert.alert(
        'Print',
        emptyPrintMessage || 'Print is not available on this screen.',
      );
      return;
    }
    if (printDisabled) {
      Alert.alert(
        'Print',
        emptyPrintMessage ||
          'Open a plant list or detail view to print barcodes.',
      );
      return;
    }
    onPrintPress();
  }, [onPrintPress, printDisabled, emptyPrintMessage]);

  return {
    onPrint: handlePrint,
    onExport: handleExport,
    exportLoading: exporting,
  };
}
