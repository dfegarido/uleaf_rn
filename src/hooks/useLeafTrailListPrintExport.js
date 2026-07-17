import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import LeafTrailLabelGeneratingOverlay from '../components/Admin/LeafTrailLabelGeneratingOverlay';
import {
  confirmLargeLabelPrint,
  exportPlantsWithFeedback,
  fetchPlantsForBoxes,
  fetchPlantsForTracking,
  fetchPlantsForTrays,
} from '../utils/leafTrailPrintExport';
import { useLeafTrailThermalPrint } from './useLeafTrailThermalPrint';

/**
 * List-screen print/export: resolve plants from trays, boxes, or tracking groups.
 */
export function useLeafTrailListPrintExport({
  labelTitle = 'Generated Labels',
  exportStageLabel = 'leaf-trail',
  listKind = 'trays', // 'trays' | 'boxes' | 'tracking'
  isLoading = false,
  listItems = [],
  emptyListMessage = 'Nothing in the current list.',
  noPlantsMessage = 'No plants found for the current list.',
}) {
  const {
    actionLoading: printLoading,
    showLabelViewer,
    printStatusMessage,
    printOrderIds,
    LabelViewer,
    LabelGeneratingOverlay: ThermalLabelGeneratingOverlay,
  } = useLeafTrailThermalPrint(labelTitle);
  const [exportLoading, setExportLoading] = useState(false);
  const [listPrintBusy, setListPrintBusy] = useState(false);
  const [listPrintMessage, setListPrintMessage] = useState('');

  const resolvePlants = useCallback(async () => {
    if (!listItems?.length) {
      Alert.alert('Print', emptyListMessage);
      return [];
    }
    if (listKind === 'boxes') {
      return fetchPlantsForBoxes(listItems);
    }
    if (listKind === 'tracking') {
      return fetchPlantsForTracking(listItems);
    }
    return fetchPlantsForTrays(listItems);
  }, [listItems, listKind, emptyListMessage]);

  const handlePrint = useCallback(async () => {
    if (printLoading || exportLoading || listPrintBusy) return;
    setListPrintBusy(true);
    try {
      setListPrintMessage('Loading plants from list…');
      const plants = await resolvePlants();
      if (!plants.length) {
        Alert.alert('Print', noPlantsMessage);
        return;
      }
      const orderIds = plants.map((p) => p.id).filter(Boolean);
      const shouldContinue = await confirmLargeLabelPrint(orderIds.length);
      if (!shouldContinue) return;
      setListPrintMessage(`Preparing ${orderIds.length} label(s)…`);
      await printOrderIds(orderIds, { isListLoading: isLoading });
    } finally {
      setListPrintBusy(false);
      setListPrintMessage('');
    }
  }, [
    printLoading,
    exportLoading,
    listPrintBusy,
    resolvePlants,
    printOrderIds,
    isLoading,
    noPlantsMessage,
  ]);

  const handleExport = useCallback(async () => {
    if (printLoading || exportLoading) return;
    if (isLoading) {
      Alert.alert('Please wait', 'Still loading list…');
      return;
    }
    if (!listItems?.length) {
      Alert.alert('Export', emptyListMessage);
      return;
    }
    try {
      setExportLoading(true);
      const plants = await resolvePlants();
      if (!plants.length) {
        Alert.alert('Export', noPlantsMessage);
        return;
      }
      await exportPlantsWithFeedback(plants, exportStageLabel);
    } catch (e) {
      if (e?.message !== 'User did not share') {
        Alert.alert('Export failed', e?.message || 'Could not export data.');
      }
    } finally {
      setExportLoading(false);
    }
  }, [
    printLoading,
    exportLoading,
    isLoading,
    listItems,
    resolvePlants,
    exportStageLabel,
    emptyListMessage,
    noPlantsMessage,
  ]);

  const LabelGeneratingOverlay = useCallback(
    () => (
      <>
        <ThermalLabelGeneratingOverlay />
        <LeafTrailLabelGeneratingOverlay
          visible={listPrintBusy && !showLabelViewer}
          message={listPrintMessage || 'Preparing labels…'}
        />
      </>
    ),
    [ThermalLabelGeneratingOverlay, listPrintBusy, showLabelViewer, listPrintMessage],
  );

  return {
    actionLoading: printLoading || exportLoading || listPrintBusy,
    exportLoading,
    showLabelViewer,
    printStatusMessage: listPrintMessage || printStatusMessage,
    LabelViewer,
    LabelGeneratingOverlay,
    handlePrint,
    handleExport,
  };
}
