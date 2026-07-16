// Frontend mirror of ileafu_backend/functions/firestore/credits/creditEnums.js
// Keep in sync with backend.

export const TRANSACTION_TYPES = {
  EARNED: 'earned',
  USED: 'used',
  MANUAL_ADJUSTMENT: 'manual_adjustment',
  CLEARED: 'cleared',
  EXPIRED: 'expired',
  REFUND: 'refund',
  REVERSAL: 'reversal'
};

export const REASON_TYPES = {
  MISSING_PLANT: 'missing_plant',
  DAMAGED_PLANT: 'damaged_plant',
  WRONG_PLANT: 'wrong_plant',
  SELLER_COMPENSATION: 'seller_compensation',
  SHIPPING_ISSUE: 'shipping_issue',
  MISSING_SHIPPING: 'missing_shipping',
  DAMAGED_SHIPPING: 'damaged_shipping',
  QUALITY_ISSUE: 'quality_issue',
  PARTIAL_REFUND: 'partial_refund',
  PROMOTION: 'promotion',
  CREDIT_CLEARED: 'credit_cleared',
  ADMIN_ADJUSTMENT: 'admin_adjustment'
};

export const CREDIT_TYPES = {
  PLANT: 'plant',
  SHIPPING: 'shipping'
};

export const CREDIT_SOURCES = {
  CHECKOUT: 'checkout',
  ADMIN: 'admin',
  REFUND: 'refund',
  SYSTEM: 'system',
  MIGRATION: 'migration'
};

export const PLANT_CREDIT_STATUSES = {
  ACTIVE: 'active',
  PARTIALLY_USED: 'partially_used',
  FULLY_USED: 'fully_used',
  EXPIRED: 'expired'
};

export const CURRENCY = {
  USD: 'USD',
  SYMBOL: '$'
};

// ─── Design tokens (Credit Management) ───────────────────────────────────────
export const CREDIT_COLORS = {
  bg: '#F2F4F7',
  surface: '#FFFFFF',
  border: '#E4E7EC',
  borderLight: '#F2F4F7',
  textPrimary: '#101828',
  textSecondary: '#475467',
  textMuted: '#98A2B3',
  plant: '#12B76A',
  plantBg: '#ECFDF3',
  plantDark: '#027A48',
  plantBorder: '#A9EFC5',
  shipping: '#2E90FA',
  shippingBg: '#EFF8FF',
  shippingDark: '#175CD3',
  shippingBorder: '#B2DDFF',
  red: '#F04438',
  redBg: '#FEF3F2',
  redBorder: '#FCA5A5',
  orange: '#F79009',
  orangeBg: '#FFFAEB',
  orangeBorder: '#FDE68A',
  blue: '#2E90FA',
  blueBg: '#EFF8FF',
  gray: '#667085',
  grayBg: '#F9FAFB',
  purple: '#7F56D9',
  purpleBg: '#F9F5FF',
  navy: '#1D2939',
  navyActive: '#344054',
};

export const TRANSACTION_TYPE_META = {
  [TRANSACTION_TYPES.EARNED]: { label: 'Credit Added', color: CREDIT_COLORS.plantDark, bgColor: CREDIT_COLORS.plantBg, borderColor: CREDIT_COLORS.plantBorder },
  [TRANSACTION_TYPES.USED]: { label: 'Credit Used', color: CREDIT_COLORS.red, bgColor: CREDIT_COLORS.redBg, borderColor: CREDIT_COLORS.redBorder },
  [TRANSACTION_TYPES.MANUAL_ADJUSTMENT]: { label: 'Manual Adjustment', color: CREDIT_COLORS.shippingDark, bgColor: CREDIT_COLORS.blueBg, borderColor: CREDIT_COLORS.shippingBorder },
  [TRANSACTION_TYPES.CLEARED]: { label: 'Cleared', color: CREDIT_COLORS.orange, bgColor: CREDIT_COLORS.orangeBg, borderColor: CREDIT_COLORS.orangeBorder },
  [TRANSACTION_TYPES.EXPIRED]: { label: 'Expired', color: CREDIT_COLORS.gray, bgColor: '#F0F2F2', borderColor: '#D0D5DD' },
  [TRANSACTION_TYPES.REFUND]: { label: 'Refund', color: CREDIT_COLORS.plantDark, bgColor: CREDIT_COLORS.plantBg, borderColor: CREDIT_COLORS.plantBorder },
  [TRANSACTION_TYPES.REVERSAL]: { label: 'Reversal', color: CREDIT_COLORS.gray, bgColor: '#F0F2F2', borderColor: '#D0D5DD' }
};

export const REASON_TYPE_META = {
  [REASON_TYPES.MISSING_PLANT]: { label: 'Missing Plant', color: '#F39C12', bgColor: '#FEF9E7', borderColor: '#FCE7A3' },
  [REASON_TYPES.DAMAGED_PLANT]: { label: 'Damaged Plant', color: CREDIT_COLORS.purple, bgColor: CREDIT_COLORS.purpleBg, borderColor: '#E9D7FE' },
  [REASON_TYPES.WRONG_PLANT]: { label: 'Wrong Plant', color: CREDIT_COLORS.purple, bgColor: CREDIT_COLORS.purpleBg, borderColor: '#E9D7FE' },
  [REASON_TYPES.SELLER_COMPENSATION]: { label: 'Seller Compensation', color: CREDIT_COLORS.plantDark, bgColor: CREDIT_COLORS.plantBg, borderColor: CREDIT_COLORS.plantBorder },
  [REASON_TYPES.SHIPPING_ISSUE]: { label: 'Shipping Issue', color: CREDIT_COLORS.shippingDark, bgColor: CREDIT_COLORS.shippingBg, borderColor: CREDIT_COLORS.shippingBorder },
  [REASON_TYPES.MISSING_SHIPPING]: { label: 'Missing Shipping', color: CREDIT_COLORS.shippingDark, bgColor: CREDIT_COLORS.shippingBg, borderColor: CREDIT_COLORS.shippingBorder },
  [REASON_TYPES.DAMAGED_SHIPPING]: { label: 'Damaged Shipping', color: CREDIT_COLORS.purple, bgColor: CREDIT_COLORS.purpleBg, borderColor: '#E9D7FE' },
  [REASON_TYPES.QUALITY_ISSUE]: { label: 'Quality Issue', color: CREDIT_COLORS.purple, bgColor: CREDIT_COLORS.purpleBg, borderColor: '#E9D7FE' },
  [REASON_TYPES.PARTIAL_REFUND]: { label: 'Partial Refund', color: CREDIT_COLORS.plantDark, bgColor: CREDIT_COLORS.plantBg, borderColor: CREDIT_COLORS.plantBorder },
  [REASON_TYPES.PROMOTION]: { label: 'Promotion', color: CREDIT_COLORS.shippingDark, bgColor: CREDIT_COLORS.shippingBg, borderColor: CREDIT_COLORS.shippingBorder },
  [REASON_TYPES.CREDIT_CLEARED]: { label: 'Credit Cleared', color: CREDIT_COLORS.orange, bgColor: CREDIT_COLORS.orangeBg, borderColor: CREDIT_COLORS.orangeBorder },
  [REASON_TYPES.ADMIN_ADJUSTMENT]: { label: 'Admin Adjustment', color: CREDIT_COLORS.shippingDark, bgColor: CREDIT_COLORS.shippingBg, borderColor: CREDIT_COLORS.shippingBorder }
};

export const normalizeRefundReasonType = (reason = '') => {
  const lower = String(reason).toLowerCase();
  if (lower.includes('missing')) return REASON_TYPES.MISSING_PLANT;
  if (lower.includes('damage') || lower.includes('damaged') || lower.includes('doa') || lower.includes('dead')) {
    return REASON_TYPES.DAMAGED_PLANT;
  }
  return REASON_TYPES.ADMIN_ADJUSTMENT;
};

export const formatCreditAmount = (amount) => {
  const value = Number(amount) || 0;
  return `${value >= 0 ? '+' : ''}${CURRENCY.SYMBOL}${Math.abs(value).toFixed(2)}`;
};

export const formatCreditBalance = (amount) => {
  const value = Number(amount) || 0;
  return `${value < 0 ? '-' : ''}${CURRENCY.SYMBOL}${Math.abs(value).toFixed(2)}`;
};

// Display balance for "available credit" UI only. Never use for ledger/reconciliation.
export const clampedCreditBalance = (amount) => Math.max(0, Number(amount) || 0);

export const formatAvailableCreditBalance = (amount) => {
  return formatCreditBalance(clampedCreditBalance(amount));
};

export const getTransactionMeta = (transactionType) =>
  TRANSACTION_TYPE_META[transactionType] || TRANSACTION_TYPE_META[TRANSACTION_TYPES.EARNED];

export const getReasonMeta = (reasonType) =>
  REASON_TYPE_META[reasonType] || null;

export const getCreditTypeMeta = (creditType) => {
  const isPlant = creditType === CREDIT_TYPES.PLANT;
  return {
    label: isPlant ? 'Plant' : 'Shipping',
    icon: isPlant ? '🌿' : '📦',
    color: isPlant ? CREDIT_COLORS.plantDark : CREDIT_COLORS.shippingDark,
    bgColor: isPlant ? CREDIT_COLORS.plantBg : CREDIT_COLORS.shippingBg,
    borderColor: isPlant ? CREDIT_COLORS.plantBorder : CREDIT_COLORS.shippingBorder,
  };
};
