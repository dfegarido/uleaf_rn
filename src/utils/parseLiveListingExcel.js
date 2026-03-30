import * as XLSX from 'xlsx';

const ALLOWED_POT = ['2"', '4"', '6"'];

function normalizeKey(k) {
  return String(k ?? '')
    .trim()
    .toLowerCase()
    .replace(/\s+/g, '_');
}

function normalizeRowKeys(row) {
  const out = {};
  for (const [k, v] of Object.entries(row)) {
    const key = normalizeKey(k);
    out[key] = typeof v === 'string' ? v.trim() : v;
  }
  return out;
}

function normalizePotSize(val) {
  let s = String(val ?? '')
    .trim()
    .replace(/\u201c|\u201d/g, '"');
  if (ALLOWED_POT.includes(s)) {
    return s;
  }
  const m = s.match(/^(\d)\s*["″']?$/);
  if (m) {
    const inch = `${m[1]}"`;
    if (ALLOWED_POT.includes(inch)) {
      return inch;
    }
  }
  return s;
}

function normalizeApproxHeight(val) {
  const s = String(val ?? '').trim().toLowerCase();
  if (!s) {
    return 'below';
  }
  if (s === 'above' || (s.includes('12') && (s.includes('above') || s.includes('&')))) {
    return 'above';
  }
  if (s === 'below' || s.includes('below')) {
    return 'below';
  }
  return '';
}

/**
 * @param {string} base64
 * @returns {{ rows: Array<{genus: string, species: string, variegation: string, potSize: string, localPrice: string, approximateHeight: 'below'|'above'}>, error?: string }}
 */
export function parseLiveListingExcelFromBase64(base64) {
  let wb;
  try {
    wb = XLSX.read(base64, {type: 'base64'});
  } catch (e) {
    return {rows: [], error: 'Could not read the spreadsheet file.'};
  }
  const sheetName = wb.SheetNames[0];
  if (!sheetName) {
    return {rows: [], error: 'The file has no sheets.'};
  }
  const ws = wb.Sheets[sheetName];
  const raw = XLSX.utils.sheet_to_json(ws, {defval: '', raw: false});
  if (!raw.length) {
    return {
      rows: [],
      error: 'No data rows found. Add at least one row under the header row.',
    };
  }

  const rows = [];
  for (let i = 0; i < raw.length; i++) {
    const n = normalizeRowKeys(raw[i]);
    const genus = String(n.genus ?? '').trim();
    const species = String(n.species ?? '').trim();
    const variegation = String(n.variegation ?? '').trim();
    const potSize = normalizePotSize(n.pot_size ?? n.potsize ?? '');
    const localPrice = n.local_price ?? n.localprice ?? '';
    const approxRaw = n.approximate_height ?? n.approximateheight ?? '';
    const approximateHeight = normalizeApproxHeight(approxRaw);

    if (!genus && !species && !potSize && localPrice === '' && !variegation) {
      continue;
    }

    if (!approximateHeight && String(approxRaw).trim()) {
      return {
        rows: [],
        error: `Row ${i + 2}: approximate_height must be "below" or "above" (or use the template hints).`,
      };
    }

    rows.push({
      genus,
      species,
      variegation,
      potSize,
      localPrice:
        localPrice === '' || localPrice === null || localPrice === undefined
          ? ''
          : String(localPrice).trim(),
      approximateHeight: approximateHeight || 'below',
    });
  }

  if (!rows.length) {
    return {
      rows: [],
      error: 'No listing rows found. Use the template columns and add data below the header.',
    };
  }

  return {rows};
}
