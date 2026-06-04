import { Alert } from 'react-native';
import {
  generateThermalLabels,
  getOrdersByBoxNumber,
  getOrdersBySortingTray,
  getOrdersByTrackingNumber,
} from '../components/Api/getAdminLeafTrail';
import { exportLeafTrailLinesToCsv } from './leafTrailHubExport';

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
 * Generate thermal labels and open viewer when labels are returned.
 */
export async function printThermalLabelsForIds(orderIds, { setLabels, setViewerVisible } = {}) {
  const ids = (orderIds || []).filter(Boolean);
  if (!ids.length) {
    Alert.alert('Print', 'No plants selected to print.');
    return { ok: false };
  }

  const response = await generateThermalLabels(ids);
  if (response?.success && response?.labels?.length) {
    setLabels?.(response.labels);
    setViewerVisible?.(true);
    return { ok: true, labels: response.labels };
  }
  if (response?.success) {
    Alert.alert('Print', 'Labels were generated but no images were returned.');
    return { ok: false };
  }
  Alert.alert('Print', response?.message || 'Failed to generate barcodes.');
  return { ok: false };
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
