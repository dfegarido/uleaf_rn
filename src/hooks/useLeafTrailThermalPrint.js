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
  const [printStatusMessage, setPrintStatusMessage] = useState('');
  const [labelsLoading, setLabelsLoading] = useState(false);
  const [labelsExpectedTotal, setLabelsExpectedTotal] = useState(0);

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
        setLabelsExpectedTotal(ids.length);
        setPrintStatusMessage(`Generating ${ids.length} label(s)…`);
        await printThermalLabelsForIds(ids, {
          setLabels: setGeneratedLabels,
          setViewerVisible: setShowLabelViewer,
          onProgress: ({ batch, totalBatches, totalLabels }) => {
            if (totalBatches > 1) {
              setLabelsLoading(true);
              setPrintStatusMessage(
                `Generating labels (batch ${batch} of ${totalBatches})…`,
              );
            } else {
              setPrintStatusMessage(`Generating ${totalLabels} label(s)…`);
            }
          },
        });
      } catch (e) {
        Alert.alert('Print', e?.message || 'Failed to generate barcodes.');
      } finally {
        setActionLoading(false);
        setLabelsLoading(false);
        setPrintStatusMessage('');
        setLabelsExpectedTotal(0);
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
        loadingMore={labelsLoading}
        expectedTotal={labelsExpectedTotal}
      />
    ),
    [showLabelViewer, generatedLabels, labelTitle, labelsLoading, labelsExpectedTotal],
  );

  return {
    actionLoading,
    showLabelViewer,
    printStatusMessage,
    printOrderIds,
    LabelViewer,
  };
}
