/**
 * Canonical receiver box # — assigned at Receiving, same through Delivered.
 * Sorting tray # and packing fulfillment box # must match this value.
 */

export function resolveCanonicalReceiverBoxNumber(source) {
  const fromReceiving = Number(source?.receivingBoxData?.boxNumber);
  if (Number.isFinite(fromReceiving) && fromReceiving > 0) {
    return String(Math.floor(fromReceiving));
  }
  const fromTray = String(source?.sortingData?.sortingTrayNumber || source?.sortingTrayNumber || '').trim();
  if (fromTray) return fromTray;
  const fromPacking = String(source?.packingData?.boxNumber || '').trim();
  if (fromPacking) return fromPacking;
  return '';
}

export function formatReceiverBoxNumberLabel(source) {
  const n = resolveCanonicalReceiverBoxNumber(source);
  return n || '—';
}
