/** Lowercase leafTrailStatus for comparisons. */
export function normalizeLeafTrailStatus(status) {
  return String(status || '').trim().toLowerCase();
}

function hasBoxNumber(plant) {
  return Boolean(String(plant?.packingData?.boxNumber || '').trim());
}

/**
 * Trail #4 — tray detail metrics.
 * Greenhouse scan: sorted → packed.
 * Admin: assign box # on packed plants (packingData.boxNumber) → ready for Shipping.
 */
export function computePackingTrayMetrics(plants = []) {
  const totalCount = plants.length;

  const sortedCount = plants.filter(
    (p) => normalizeLeafTrailStatus(p.leafTrailStatus) === 'sorted',
  ).length;

  const packedCount = plants.filter(
    (p) => normalizeLeafTrailStatus(p.leafTrailStatus) === 'packed',
  ).length;

  const boxAssignedCount = plants.filter((p) => hasBoxNumber(p)).length;

  const needsBoxCount = plants.filter(
    (p) =>
      normalizeLeafTrailStatus(p.leafTrailStatus) === 'packed' && !hasBoxNumber(p),
  ).length;

  const isScanComplete = totalCount === 0 ? true : sortedCount === 0;
  const isReadyForShipping = totalCount === 0 ? true : boxAssignedCount >= totalCount;

  return {
    totalCount,
    sortedCount,
    packedCount,
    boxAssignedCount,
    needsBoxCount,
    toScanCount: sortedCount,
    isScanComplete,
    isReadyForShipping,
  };
}
