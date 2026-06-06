import { Alert } from 'react-native';
import {
  generateThermalLabels,
  getOrdersByBoxNumber,
  getOrdersBySortingTray,
  getOrdersByTrackingNumber,
} from '../components/Api/getAdminLeafTrail';
import { exportLeafTrailLinesToCsv } from './leafTrailHubExport';

/** Keep each API response small enough for the mobile client to parse reliably. */
const THERMAL_LABEL_BATCH_SIZE = 40;

async function fetchInParallel(keys, fetcher) {
  const responses = await Promise.all(
    keys.map(async (key) => {
      try {
        return await fetcher(key);
      } catch (e) {
        console.warn('leafTrailPrintExport fetch:', key, e?.message);
        return { data: [] };
      }
    }),
  );
  return responses.flatMap((r) => r?.data || []);
}

export async function fetchPlantsForTrays(trayItems) {
  const trayNumbers = [
    ...new Set(
      (trayItems || [])
        .map((t) => String(t.sortingTrayNumber || '').trim())
        .filter(Boolean),
    ),
  ];
  if (!trayNumbers.length) return [];
  return fetchInParallel(trayNumbers, getOrdersBySortingTray);
}

export async function fetchPlantsForBoxes(boxItems) {
  const boxNumbers = [
    ...new Set(
      (boxItems || [])
        .map((b) => String(b.boxNumber || '').trim())
        .filter(Boolean),
    ),
  ];
  if (!boxNumbers.length) return [];
  return fetchInParallel(boxNumbers, getOrdersByBoxNumber);
}

export async function fetchPlantsForTracking(trackingItems) {
  const trackingNumbers = [
    ...new Set(
      (trackingItems || [])
        .map((t) => String(t.trackingNumber || '').trim())
        .filter(Boolean),
    ),
  ];
  if (!trackingNumbers.length) return [];
  return fetchInParallel(trackingNumbers, getOrdersByTrackingNumber);
}

/**
 * Generate thermal labels in batches and open the viewer after the first batch.
 */
export async function printThermalLabelsForIds(
  orderIds,
  { setLabels, setViewerVisible, onProgress } = {},
) {
  const ids = (orderIds || []).filter(Boolean);
  if (!ids.length) {
    Alert.alert('Print', 'No plants selected to print.');
    return { ok: false };
  }

  const totalBatches = Math.ceil(ids.length / THERMAL_LABEL_BATCH_SIZE);
  const allLabels = [];

  try {
    for (let batchIndex = 0; batchIndex < totalBatches; batchIndex += 1) {
      const batchIds = ids.slice(
        batchIndex * THERMAL_LABEL_BATCH_SIZE,
        (batchIndex + 1) * THERMAL_LABEL_BATCH_SIZE,
      );

      onProgress?.({
        phase: 'generating',
        batch: batchIndex + 1,
        totalBatches,
        labelsDone: allLabels.length,
        totalLabels: ids.length,
      });

      const response = await generateThermalLabels(batchIds);
      if (!response?.success) {
        const msg =
          response?.message || response?.error || 'Failed to generate barcodes.';
        if (allLabels.length) {
          setLabels?.([...allLabels]);
          setViewerVisible?.(true);
          Alert.alert(
            'Print partially complete',
            `Generated ${allLabels.length} of ${ids.length} labels before an error: ${msg}`,
          );
          return { ok: true, labels: allLabels, partial: true };
        }
        Alert.alert('Print', msg);
        return { ok: false };
      }

      const batchLabels = response?.labels || [];
      if (!batchLabels.length) {
        if (allLabels.length === 0 && batchIndex === 0) {
          Alert.alert('Print', 'Labels were generated but no images were returned.');
          return { ok: false };
        }
        continue;
      }

      allLabels.push(...batchLabels);
      setLabels?.([...allLabels]);
      if (batchIndex === 0) {
        setViewerVisible?.(true);
      }
    }

    if (!allLabels.length) {
      Alert.alert('Print', 'No label images were returned.');
      return { ok: false };
    }

    return { ok: true, labels: allLabels };
  } catch (error) {
    if (allLabels.length) {
      setLabels?.([...allLabels]);
      setViewerVisible?.(true);
      Alert.alert(
        'Print partially complete',
        `Showing ${allLabels.length} of ${ids.length} labels. ${
          error?.message || 'Could not load remaining labels.'
        }`,
      );
      return { ok: true, labels: allLabels, partial: true };
    }
    throw error;
  }
}

export function confirmLargeLabelPrint(count, threshold = 80) {
  if (count <= threshold) {
    return Promise.resolve(true);
  }
  return new Promise((resolve) => {
    Alert.alert(
      'Print many labels?',
      `This will generate ${count} barcode labels and may take a minute. Continue?`,
      [
        { text: 'Cancel', style: 'cancel', onPress: () => resolve(false) },
        { text: 'Continue', onPress: () => resolve(true) },
      ],
      { cancelable: true, onDismiss: () => resolve(false) },
    );
  });
}

export async function exportPlantsWithFeedback(plants, stageLabel) {
  if (!plants?.length) {
    Alert.alert('Export', 'No plants found to export.');
    return { ok: false };
  }
  const result = await exportLeafTrailLinesToCsv(plants, { stageLabel });
  if (result?.success) {
    Alert.alert('Export', `Shared CSV for ${result.count} plant line(s).`);
    return { ok: true };
  }
  return { ok: false };
}
