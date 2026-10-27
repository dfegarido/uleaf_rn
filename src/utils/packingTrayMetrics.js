/** Lowercase leafTrailStatus for comparisons. */
export function normalizeLeafTrailStatus(status) {
  const key = String(status || '').trim().toLowerCase().replace(/[\s_-]+/g, '');
  if (key === 'active' || key === 'forreceiving') return 'forreceiving';
  return key;
}

function hasBoxNumber(plant) {
  return Boolean(String(plant?.packingData?.boxNumber || '').trim());
}

/**
 * Held at the hub. It stays on the tray so the admin can see why it was not
 * packed, and it does not have to be boxed with the rest.
 */
export function isPackingNeedsToStay(plant) {
  const status = normalizeLeafTrailStatus(plant?.leafTrailStatus);
  if (status === 'packed' || status === 'shipping' || status === 'shipped') return false;
  if (status === 'needstostay') return true;
  const hub = plant?.hubNeedsToStay;
  if (!hub || typeof hub !== 'object') return false;
  return Boolean(String(hub.dateScanned || hub.name || hub.id || '').trim());
}

/**
 * Trail #4 — tray detail metrics.
 * Greenhouse scan: sorted → packed.
 * Admin: assign box # on packed plants (packingData.boxNumber) → ready for Shipping.
 */
export function computePackingTrayMetrics(plants = []) {
  const needsToStayCount = plants.filter(isPackingNeedsToStay).length;
  const shippable = plants.filter((p) => !isPackingNeedsToStay(p));
  const totalCount = shippable.length;

  const sortedCount = shippable.filter(
    (p) => normalizeLeafTrailStatus(p.leafTrailStatus) === 'sorted',
  ).length;

  const packedCount = shippable.filter(
    (p) => normalizeLeafTrailStatus(p.leafTrailStatus) === 'packed',
  ).length;

  const boxAssignedCount = shippable.filter((p) => hasBoxNumber(p)).length;

  const needsBoxCount = shippable.filter(
    (p) =>
      normalizeLeafTrailStatus(p.leafTrailStatus) === 'packed' && !hasBoxNumber(p),
  ).length;

  const isScanComplete = sortedCount === 0;
  const isReadyForShipping =
    totalCount > 0 && sortedCount === 0 && boxAssignedCount >= totalCount;

  return {
    totalCount,
    sortedCount,
    packedCount,
    boxAssignedCount,
    needsBoxCount,
    needsToStayCount,
    toScanCount: sortedCount,
    isScanComplete,
    isReadyForShipping,
  };
}
