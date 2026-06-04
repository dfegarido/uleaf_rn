import React, { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import ThermalLabelViewerModal from '../components/Admin/ThermalLabelViewerModal';
import { printThermalLabelsForIds } from '../utils/leafTrailPrintExport';

/**
 * Shared thermal print + label preview modal for Leaf Trail admin screens.
 */
export function useLeafTrailThermalPrint(labelTitle = 'Generated Labels') {
  const [actionLoading, setActionLoading] = useState(false);
  const [generatedLabels, setGeneratedLabels] = useState([]);
  const [showLabelViewer, setShowLabelViewer] = useState(false);

  const printOrderIds = useCallback(
    async (orderIds, { isListLoading = false, emptyMessage } = {}) => {
      if (actionLoading) return;
      if (isListLoading) {
        Alert.alert('Please wait', 'Still loading list…');
        return;
      }
      const ids = (orderIds || []).filter(Boolean);
      if (!ids.length) {
        Alert.alert('Print', emptyMessage || 'No plants to print.');
        return;
      }
      try {
        setActionLoading(true);
        await printThermalLabelsForIds(ids, {
          setLabels: setGeneratedLabels,
          setViewerVisible: setShowLabelViewer,
        });
      } catch (e) {
        Alert.alert('Print', e?.message || 'Failed to generate barcodes.');
      } finally {
        setActionLoading(false);
      }
    },
    [actionLoading],
  );

  const LabelViewer = useCallback(
    () => (
      <ThermalLabelViewerModal
        visible={showLabelViewer}
        labels={generatedLabels}
        onClose={() => setShowLabelViewer(false)}
        title={labelTitle}
      />
    ),
    [showLabelViewer, generatedLabels, labelTitle],
  );

  return {
    actionLoading,
    showLabelViewer,
    printOrderIds,
    LabelViewer,
  };
}
