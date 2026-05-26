/** Navigation params for LeafTrailScanQRAdminScreen per stage. */
export const LEAF_TRAIL_SCAN_PARAMS = {
  receivingIntake: { intakeMode: true },
  receiving: {},
  sorting: { leafTrailStatus: 'sorted' },
  packing: { leafTrailStatus: 'packed' },
  shipping: { leafTrailStatus: 'shipping' },
  shipped: { leafTrailStatus: 'shipped' },
};
