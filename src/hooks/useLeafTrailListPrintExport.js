import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import {
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
  const { actionLoading: printLoading, showLabelViewer, printOrderIds, LabelViewer } =
    useLeafTrailThermalPrint(labelTitle);
  const [exportLoading, setExportLoading] = useState(false);

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
    if (printLoading || exportLoading) return;
    const plants = await resolvePlants();
    if (!plants.length) {
      Alert.alert('Print', noPlantsMessage);
      return;
    }
    await printOrderIds(
      plants.map((p) => p.id),
      { isListLoading: isLoading },
    );
  }, [printLoading, exportLoading, resolvePlants, printOrderIds, isLoading, noPlantsMessage]);

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

  return {
    actionLoading: printLoading || exportLoading,
    exportLoading,
    showLabelViewer,
    LabelViewer,
    handlePrint,
    handleExport,
  };
}
