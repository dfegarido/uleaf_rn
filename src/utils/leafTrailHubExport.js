import { Alert, Platform } from 'react-native';
import RNFS from 'react-native-fs';
import { formatPlantFlightDateForDisplay } from '../screens/Admin/LeafTrail/Receiving/receivingPlantFormatters';

let Share;
try {
  const ShareModule = require('react-native-share');
  Share = ShareModule.default || ShareModule;
} catch {
  Share = null;
}

const CSV_HEADERS = [
  'Transaction #',
  'Order Date',
  'Plant Flight',
  "Buyer's Name",
  'Qty',
  'Genus',
  'Species',
  'Garden Name',
  'US$ Price',
];

function escapeCsvCell(value) {
  const s = value == null ? '' : String(value);
  if (s.includes(',') || s.includes('"') || s.includes('\n')) {
    return `"${s.replace(/"/g, '""')}"`;
  }
  return s;
}

/** Normalize a leaf-trail list line to export columns (client spec). */
export function mapLeafTrailLineToExportRow(line = {}) {
  const buyerName =
    line.buyerName ||
    [line.buyerFirstName, line.buyerLastName].filter(Boolean).join(' ').trim() ||
    line.user?.name ||
    '';

  const qty = line.quantity ?? line.orderQty ?? line.qty ?? 1;
  const usd =
    line.usdPrice ??
    line.price ??
    line.totalUsdPrice ??
    (Array.isArray(line.usdPrices) ? line.usdPrices[0] : '') ??
    '';

  return {
    transactionNumber: line.transactionNumber || line.trxNumber || '',
    orderDate:
      line.orderDateFormatted ||
      line.orderDate ||
      line.dateOrdered ||
      line.createdAtFormatted ||
      '',
    plantFlight:
      line.flightDateFormatted ||
      formatPlantFlightDateForDisplay(line.flightDate) ||
      line.flightDate ||
      '',
    buyerName,
    qty,
    genus: line.genus || '',
    species: line.species || '',
    gardenName: line.gardenOrCompanyName || line.gardenName || line.garden || '',
    usdPrice: usd,
  };
}

export function buildLeafTrailCsvContent(lines = []) {
  const rows = lines.map(mapLeafTrailLineToExportRow);
  const headerLine = CSV_HEADERS.map(escapeCsvCell).join(',');
  const dataLines = rows.map((r) =>
    [
      r.transactionNumber,
      r.orderDate,
      r.plantFlight,
      r.buyerName,
      r.qty,
      r.genus,
      r.species,
      r.gardenName,
      r.usdPrice,
    ]
      .map(escapeCsvCell)
      .join(','),
  );
  return [headerLine, ...dataLines].join('\n');
}

/**
 * Share a CSV file built from visible leaf-trail lines (no production API deploy required).
 */
export async function exportLeafTrailLinesToCsv(lines = [], { stageLabel = 'leaf-trail' } = {}) {
  if (!lines.length) {
    Alert.alert('Nothing to export', 'No plants in the current list match your filters.');
    return { success: false };
  }
  if (!Share) {
    Alert.alert('Export unavailable', 'Sharing is not available on this build.');
    return { success: false };
  }

  const csv = buildLeafTrailCsvContent(lines);
  const safeLabel = String(stageLabel).replace(/[^a-z0-9-_]+/gi, '-').toLowerCase();
  const filename = `${safeLabel}-${Date.now()}.csv`;
  const path = `${RNFS.CachesDirectoryPath}/${filename}`;

  await RNFS.writeFile(path, csv, 'utf8');

  const fileUrl = Platform.OS === 'android' ? `file://${path}` : path;
  await Share.open({
    url: fileUrl,
    type: 'text/csv',
    filename,
    title: 'Export Leaf Trail data',
  });

  return { success: true, count: lines.length };
}
