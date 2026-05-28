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
  shipping: { leafTrailStatus: 'shipping' },
  shipped: { leafTrailStatus: 'shipped' },
};
