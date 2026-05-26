import moment from 'moment';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const ORDERED_DATE_PARSE_FORMATS = [
  'MMMM D, YYYY',
  'MMMM DD, YYYY',
  'MMM D, YYYY',
  'MMM DD, YYYY',
  moment.ISO_8601,
];

export function resolvePlantFlightDateIso(value) {
  if (value == null || value === '') return null;
  if (typeof value === 'string') {
    const s = value.trim();
    if (/^\d{4}-\d{2}-\d{2}$/.test(s)) return s;
    if (/^\d{4}-\d{2}-\d{2}/.test(s)) return s.slice(0, 10);
    const mmm = s.match(/^([A-Za-z]{3})-(\d{1,2})-(\d{4})$/);
    if (mmm) {
      const monthMap = {
        jan: 1, feb: 2, mar: 3, apr: 4, may: 5, jun: 6,
        jul: 7, aug: 8, sep: 9, oct: 10, nov: 11, dec: 12,
      };
      const mi = monthMap[mmm[1].slice(0, 3).toLowerCase()];
      if (mi) {
        const y = parseInt(mmm[3], 10);
        const d = parseInt(mmm[2], 10);
        return `${y}-${String(mi).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
      }
    }
    return null;
  }
  if (typeof value === 'object') {
    let dateObj = null;
    if (typeof value.toDate === 'function') {
      dateObj = value.toDate();
    } else {
      const sec = value.seconds ?? value._seconds;
      if (typeof sec === 'number') dateObj = new Date(sec * 1000);
    }
    if (dateObj && !Number.isNaN(dateObj.getTime())) {
      const y = dateObj.getUTCFullYear();
      const mo = dateObj.getUTCMonth() + 1;
      const da = dateObj.getUTCDate();
      return `${y}-${String(mo).padStart(2, '0')}-${String(da).padStart(2, '0')}`;
    }
  }
  return null;
}

export function formatPlantFlightDateForDisplay(value) {
  const iso = resolvePlantFlightDateIso(value);
  if (!iso) return typeof value === 'string' ? String(value) : '';
  const [y, mo, da] = iso.split('-').map(Number);
  return `${MONTH_LABELS[mo - 1]} ${da}, ${y}`;
}

/** Eastern date-only label — matches thermal print labels and getAdminLeafTrailReceiving. */
export function formatDateOrderedForDisplay(value) {
  if (value == null || value === '') return '';
  const raw = String(value).trim();
  if (!raw) return '';

  const parsed = moment(raw, ORDERED_DATE_PARSE_FORMATS, true);
  if (parsed.isValid()) {
    return parsed.format('MMMM D, YYYY');
  }

  const loose = moment(raw);
  if (loose.isValid()) {
    return loose.format('MMMM D, YYYY');
  }

  return raw;
}

export function getDateOrderedDatePart(item) {
  if (item?.dateOrdered) return formatDateOrderedForDisplay(item.dateOrdered);
  return '';
}

export function formatUsdPrice(value) {
  if (value == null || value === '') return '';
  const n = Number(value);
  if (Number.isNaN(n)) return '';
  return `$${n.toFixed(2)}`;
}
