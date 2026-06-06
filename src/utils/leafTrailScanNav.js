/** Receiving screen route — used when returning from an intake scan. */
export const LEAF_TRAIL_RECEIVING_SCREEN = 'LeafTrailReceivingScreenAdminScreen';

/** Navigation params for LeafTrailScanQRAdminScreen per stage. */
export const LEAF_TRAIL_SCAN_PARAMS = {
  receivingIntake: { intakeMode: true },
  receiving: {},
  sorting: { leafTrailStatus: 'sorted' },
  /** Trail #3: scan inside a receiver box — validates expectedBoxKey on the server. */
  sortingBox: (box) => ({
    leafTrailStatus: 'sorted',
    sortingBoxMode: true,
    expectedBoxKey: box?.boxKey || '',
    boxReceiverName: box?.receiverName || '',
  }),
  packing: { leafTrailStatus: 'packed' },
  /** Trail #4: scan inside an open tray — validates expectedSortingTrayNumber on the server. */
  packingTray: (tray) => ({
    leafTrailStatus: 'packed',
    packingTrayMode: true,
    expectedSortingTrayNumber: tray?.sortingTrayNumber || '',
    trayLabel: tray?.sortingTrayNumber || '',
  }),
  shipping: { leafTrailStatus: 'shipping' },
  shipped: { leafTrailStatus: 'shipped' },
};

/** Tray # and box # — always uppercase as the user types. */
export function forceUppercaseHubLabel(value) {
  return String(value ?? '').toUpperCase();
}

/** Params when opening scan from a Receiving tab (tracks where the user came from). */
export function buildReceivingScanParams(activeTabKey, baseParams = {}) {
  return {
    ...baseParams,
    ...(activeTabKey === 'forReceiving' ? { sourceTabKey: 'forReceiving' } : {}),
  };
}

/** Return to Receiving and switch tab after a successful For Receiving intake scan. */
export function navigateBackToReceivingAfterScan(
  navigation,
  { advanceToTab = 'received' } = {},
) {
  navigation.navigate({
    name: LEAF_TRAIL_RECEIVING_SCREEN,
    params: { advanceToTab },
    merge: true,
  });
  navigation.goBack();
}
