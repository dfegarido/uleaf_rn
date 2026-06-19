const normalizeStatus = (value) => String(value || '').trim().toLowerCase();

const getBuyerUid = (order) =>
  order?.buyerUid || order?.buyerInfo?.uid || order?.buyerInfo?.id || '';

const getCreatedAtMs = (order) => {
  const createdAt = order?.createdAt;
  if (!createdAt) return 0;
  if (typeof createdAt === 'number') return createdAt;
  if (typeof createdAt === 'string') {
    const parsed = Date.parse(createdAt);
    return Number.isNaN(parsed) ? 0 : parsed;
  }
  if (createdAt._seconds != null) return createdAt._seconds * 1000;
  if (typeof createdAt.toDate === 'function') return createdAt.toDate().getTime();
  return 0;
};

const isPendingPaymentOrder = (order) =>
  normalizeStatus(order?.status) === 'pending_payment';

const isSupersedingActiveOrder = (order) => {
  const orderStatus = normalizeStatus(order?.status);
  if (['cancelled', 'canceled', 'failed', 'refunded'].includes(orderStatus)) return false;
  if (isPendingPaymentOrder(order)) return false;

  const paymentStatus = normalizeStatus(
    order?.paymentStatus || order?.payment?.status || order?.paypalPaymentStatus || '',
  );
  if (
    orderStatus === 'ready to fly' ||
    orderStatus === 'readytofly' ||
    orderStatus === 'completed' ||
    orderStatus === 'complete' ||
    orderStatus === 'delivered' ||
    paymentStatus === 'paid' ||
    paymentStatus === 'completed' ||
    paymentStatus === 'complete'
  ) {
    return true;
  }
  if (order?.paidAt) return true;

  const leaf = normalizeStatus(order?.leafTrailStatus).replace(/[\s_-]+/g, '');
  return [
    'active',
    'forreceiving',
    'received',
    'sorted',
    'packed',
    'shipping',
    'shipped',
    'delivered',
  ].includes(leaf);
};

const buildSupersessionKey = (order) => {
  const buyerUid = String(getBuyerUid(order)).trim();
  const plantCode = String(order?.plantCode || '').trim();
  if (!buyerUid || !plantCode) return '';
  return `${buyerUid}|plant:${plantCode}`;
};

/**
 * Hide duplicate pending_payment rows when the same buyer+plantCode already has
 * a paid order, or when multiple unpaid attempts exist (keep newest only).
 */
export function filterSupersededPendingOrders(orders = []) {
  if (!Array.isArray(orders) || orders.length === 0) return orders;

  const supersedingKeys = new Set();
  const pendingByKey = new Map();

  orders.forEach((order) => {
    const key = buildSupersessionKey(order);
    if (!key) return;
    if (isSupersedingActiveOrder(order)) {
      supersedingKeys.add(key);
    }
    if (isPendingPaymentOrder(order)) {
      if (!pendingByKey.has(key)) pendingByKey.set(key, []);
      pendingByKey.get(key).push({ order, createdAtMs: getCreatedAtMs(order) });
    }
  });

  const hiddenIds = new Set();
  pendingByKey.forEach((pendingRows, key) => {
    if (supersedingKeys.has(key)) {
      pendingRows.forEach(({ order }) => hiddenIds.add(order.id));
      return;
    }
    if (pendingRows.length <= 1) return;
    pendingRows.sort((a, b) => b.createdAtMs - a.createdAtMs);
    pendingRows.slice(1).forEach(({ order }) => hiddenIds.add(order.id));
  });

  if (!hiddenIds.size) return orders;
  return orders.filter((order) => !hiddenIds.has(order.id));
}

/** Order Summary All tab — hide unpaid checkout drafts (see Payment Management). */
export function excludePendingPaymentFromAllTab(orders = [], { allTab = false } = {}) {
  if (!allTab || !Array.isArray(orders)) return orders;
  return orders.filter((order) => normalizeStatus(order?.status) !== 'pending_payment');
}
