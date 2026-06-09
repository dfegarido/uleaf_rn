/**
 * Match a locked order flight date to a checkout Saturday option.
 * Snaps off-by-one day mismatches (e.g. Fri hub instant stored as Thu/Fri ISO) before falling back.
 */

function addDaysToIso(iso, days) {
  if (!iso || !/^\d{4}-\d{2}-\d{2}$/.test(iso)) return null;
  const [y, m, d] = iso.split('-').map(Number);
  const date = new Date(y, m - 1, d);
  date.setDate(date.getDate() + days);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * @param {string|null} existingOrderIso - YYYY-MM-DD
 * @param {Array<{ iso?: string, value?: string, label?: string, key?: string }>} flightDateOptions
 * @param {(raw: *, year?: number) => string|null} [formatFlightDateToISO]
 * @returns {object|null}
 */
export function findMatchingFlightOption(existingOrderIso, flightDateOptions = [], formatFlightDateToISO) {
  if (!existingOrderIso || !flightDateOptions.length) return null;

  const options = flightDateOptions
    .map((option) => {
      const iso =
        option.iso ||
        (formatFlightDateToISO
          ? formatFlightDateToISO(option.value || option.label, new Date().getFullYear())
          : null);
      return iso ? { ...option, iso } : null;
    })
    .filter(Boolean);

  const exact = options.find((o) => o.iso === existingOrderIso);
  if (exact) return exact;

  const snapCandidates = [
    addDaysToIso(existingOrderIso, 1),
    addDaysToIso(existingOrderIso, -1),
  ].filter(Boolean);

  for (const candidate of snapCandidates) {
    const snapped = options.find((o) => o.iso === candidate);
    if (snapped) return snapped;
  }

  const sorted = [...options].sort((a, b) => a.iso.localeCompare(b.iso));
  const onOrAfter = sorted.find((o) => o.iso >= existingOrderIso);
  if (onOrAfter) return onOrAfter;

  const before = [...sorted].reverse().find((o) => o.iso < existingOrderIso);
  return before || null;
}
