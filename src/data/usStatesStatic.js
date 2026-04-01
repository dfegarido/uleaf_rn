/**
 * US states + DC for signup when GeoDB (RapidAPI) is unavailable (403 / not subscribed).
 * Same shape as getUSStatesSimple success: { name, code, id } per row.
 */
const ROWS = [
  ['Alabama', 'AL'],
  ['Alaska', 'AK'],
  ['Arizona', 'AZ'],
  ['Arkansas', 'AR'],
  ['California', 'CA'],
  ['Colorado', 'CO'],
  ['Connecticut', 'CT'],
  ['Delaware', 'DE'],
  ['District of Columbia', 'DC'],
  ['Florida', 'FL'],
  ['Georgia', 'GA'],
  ['Hawaii', 'HI'],
  ['Idaho', 'ID'],
  ['Illinois', 'IL'],
  ['Indiana', 'IN'],
  ['Iowa', 'IA'],
  ['Kansas', 'KS'],
  ['Kentucky', 'KY'],
  ['Louisiana', 'LA'],
  ['Maine', 'ME'],
  ['Maryland', 'MD'],
  ['Massachusetts', 'MA'],
  ['Michigan', 'MI'],
  ['Minnesota', 'MN'],
  ['Mississippi', 'MS'],
  ['Missouri', 'MO'],
  ['Montana', 'MT'],
  ['Nebraska', 'NE'],
  ['Nevada', 'NV'],
  ['New Hampshire', 'NH'],
  ['New Jersey', 'NJ'],
  ['New Mexico', 'NM'],
  ['New York', 'NY'],
  ['North Carolina', 'NC'],
  ['North Dakota', 'ND'],
  ['Ohio', 'OH'],
  ['Oklahoma', 'OK'],
  ['Oregon', 'OR'],
  ['Pennsylvania', 'PA'],
  ['Rhode Island', 'RI'],
  ['South Carolina', 'SC'],
  ['South Dakota', 'SD'],
  ['Tennessee', 'TN'],
  ['Texas', 'TX'],
  ['Utah', 'UT'],
  ['Vermont', 'VT'],
  ['Virginia', 'VA'],
  ['Washington', 'WA'],
  ['West Virginia', 'WV'],
  ['Wisconsin', 'WI'],
  ['Wyoming', 'WY'],
];

export const US_STATES_STATIC_SORTED = ROWS.map(([name, code]) => ({
  name,
  code,
  id: code,
})).sort((a, b) => a.name.localeCompare(b.name));

/**
 * @param {number} limit
 * @param {number} offset
 */
export function getStaticUSStatesPage(limit, offset) {
  const all = US_STATES_STATIC_SORTED;
  const slice = all.slice(offset, offset + limit);
  return {
    success: true,
    states: slice.map(s => ({ name: s.name, code: s.code, id: s.id })),
    hasMore: offset + slice.length < all.length,
    totalCount: all.length,
    _source: 'static',
  };
}
