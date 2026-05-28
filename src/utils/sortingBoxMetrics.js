/** Incomplete box — pink; complete box — light green (UI mockup). */
export const SORTING_BOX_COLOR_INCOMPLETE = '#FDE8F0';
export const SORTING_BOX_COLOR_COMPLETE = '#DFF5E6';

/** Lowercase leafTrailStatus for comparisons. */
export function normalizeLeafTrailStatus(status) {
  return String(status || '').trim().toLowerCase();
}

/**
 * Trail #3 metrics — aligned with UI mockup + handwritten note.
 *
 * Card (mockup): For Receiving N · Received X of N · Sorted Y of N
 * Detail (note): Total Plants to Fulfill = Received − Missing − Damaged − Need to Stay
 *
 * Box complete (pink → light green) when every plant is received and sorted vs For Receiving total.
 */
export function computeSortingBoxMetrics(plants = []) {
  const forReceivingCount = plants.length;

  const needsToStayCount = plants.filter(
    (p) => normalizeLeafTrailStatus(p.leafTrailStatus) === 'needstostay',
  ).length;
  const missingCount = plants.filter(
    (p) => normalizeLeafTrailStatus(p.leafTrailStatus) === 'missing',
  ).length;
  const damagedCount = plants.filter(
    (p) => normalizeLeafTrailStatus(p.leafTrailStatus) === 'damaged',
  ).length;
  const missingDamagedCount = missingCount + damagedCount;

  /** Hub-received (no longer forReceiving). */
  const receivedCount = plants.filter(
    (p) => normalizeLeafTrailStatus(p.leafTrailStatus) !== 'forreceiving',
  ).length;

  const sortedCount = plants.filter(
    (p) => normalizeLeafTrailStatus(p.leafTrailStatus) === 'sorted',
  ).length;

  /** Handwritten: "Total Plants to Fulfill" */
  const totalPlantsToFulfill = Math.max(
    0,
    receivedCount - missingCount - damagedCount - needsToStayCount,
  );

  const isComplete =
    forReceivingCount === 0
      ? true
      : receivedCount >= forReceivingCount && sortedCount >= forReceivingCount;

  return {
    forReceivingCount,
    receivedCount,
    sortedCount,
    needsToStayCount,
    missingCount,
    damagedCount,
    missingDamagedCount,
    totalPlantsToFulfill,
    /** @deprecated use totalPlantsToFulfill — kept for API compatibility */
    toBeSortedCount: totalPlantsToFulfill,
    isComplete,
    boxColor: isComplete ? SORTING_BOX_COLOR_COMPLETE : SORTING_BOX_COLOR_INCOMPLETE,
  };
}

/** Unsorted (received, not yet sorted) plants appear first. */
export function sortPlantsForSortingBoxList(plants = []) {
  return [...plants].sort((a, b) => {
    const aUnsorted =
      normalizeLeafTrailStatus(a.leafTrailStatus) === 'received' ? 0 : 1;
    const bUnsorted =
      normalizeLeafTrailStatus(b.leafTrailStatus) === 'received' ? 0 : 1;
    if (aUnsorted !== bUnsorted) return aUnsorted - bUnsorted;
    return String(a.plantCode || '').localeCompare(String(b.plantCode || ''));
  });
}
