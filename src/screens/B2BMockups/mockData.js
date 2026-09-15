export const MOCKUP_NOTE = '';

export const CANCELLATION_FEE_PERCENT = 3.5;
export const PARTIAL_PERCENT_OPTIONS = [70, 75, 80];
export const DEFAULT_PARTIAL_PERCENT = 75;

export const getExceptionBase = ({listedPrice, logistics = 0, plantCare = 0} = {}) =>
  Number(
    Math.max(0, Number(listedPrice || 0) - Number(logistics || 0) - Number(plantCare || 0)).toFixed(2),
  );

export const getCancellationFee = ({
  listedPrice,
  logistics = 0,
  plantCare = 0,
  percent = CANCELLATION_FEE_PERCENT,
} = {}) => {
  const base = getExceptionBase({listedPrice, logistics, plantCare});
  return Number((base * ((Number(percent) || CANCELLATION_FEE_PERCENT) / 100)).toFixed(2));
};

export const isExceptionCondition = item =>
  item?.condition === 'missing' || item?.condition === 'damaged';

export const isPayoutEligible = item => {
  if (isExceptionCondition(item)) {
    return true;
  }
  return Boolean(item?.scanned) &&
    (item.leafTrailStatus === 'Inventory for Hub' ||
      item.leafTrailStatus === 'Received');
};

export const getGrossNetPayout = item => {
  if (item?.netPayout != null && item.netPayout !== '') {
    return Number(item.netPayout);
  }
  if (isExceptionCondition(item)) {
    return -getCancellationFee(item);
  }
  if (!isPayoutEligible(item)) {
    return null;
  }
  return Number(
    (item.listedPrice - item.commission - item.logistics - item.plantCare).toFixed(2),
  );
};

export const getPartialAmount = (net, percent = DEFAULT_PARTIAL_PERCENT) => {
  if (net == null || net <= 0) {
    return 0;
  }
  return Number((net * (percent / 100)).toFixed(2));
};

export const formatUsd = value => {
  if (value == null || value === '') {
    return '—';
  }
  const n = Number(value);
  if (Number.isNaN(n)) {
    return '$0.00';
  }
  const abs = Math.abs(n).toFixed(2);
  return n < 0 ? `-$${abs}` : `$${abs}`;
};

export const payoutStatusTone = status => {
  switch (status) {
    case 'Fully paid':
      return 'paid';
    case 'Partially paid':
      return 'partial';
    case 'Ready for partial':
    case 'Ready for full':
      return 'ready';
    case 'Missing / Damaged':
      return 'alert';
    default:
      return 'wait';
  }
};
