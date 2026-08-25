export const MOCKUP_NOTE = '';

export const CANCELLATION_FEE_PERCENT = 3.5;
export const PARTIAL_PERCENT_OPTIONS = [70, 75, 80];
export const DEFAULT_PARTIAL_PERCENT = 75;

export const getCancellationFee = listedPrice =>
  Number((Number(listedPrice) * (CANCELLATION_FEE_PERCENT / 100)).toFixed(2));

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
  if (isExceptionCondition(item)) {
    return -getCancellationFee(item.listedPrice);
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

export const SAMPLE_PAYOUTS = [
  {
    id: 'po-12345',
    orderId: '12345',
    plant: 'Philodendron Jennifer',
    variegation: 'Variegated',
    potSize: '6"',
    liveSaleDate: 'Aug 10, 2026',
    orderDate: 'Aug 10, 2026',
    scanDate: 'Aug 12, 2026',
    listedPrice: 200,
    commissionRate: 10,
    commission: 20,
    logistics: 20,
    plantCare: 5,
    netPayout: 155,
    scanned: true,
    leafTrailStatus: 'Inventory for Hub',
    hubReceived: false,
    condition: 'ok',
    payoutStatus: 'Ready for partial',
    partialPercent: 75,
    amountPaid: 0,
    paymentStatus: 'Paid',
    businessName: 'Greenleaf Garden',
    country: 'Philippines',
    proofs: [],
    buyerCreditIssued: false,
  },
  {
    id: 'po-12346',
    orderId: '12346',
    plant: 'Monstera Thai Constellation',
    variegation: 'Thai Constellation',
    potSize: '4"',
    liveSaleDate: 'Aug 10, 2026',
    orderDate: 'Aug 10, 2026',
    scanDate: 'Aug 12, 2026',
    listedPrice: 175,
    commissionRate: 10,
    commission: 17.5,
    logistics: 15,
    plantCare: 5,
    netPayout: 137.5,
    scanned: true,
    leafTrailStatus: 'Received',
    hubReceived: true,
    condition: 'ok',
    payoutStatus: 'Partially paid',
    partialPercent: 75,
    amountPaid: 103.13,
    paymentStatus: 'Paid',
    businessName: 'Greenleaf Garden',
    country: 'Philippines',
    proofs: [
      {
        kind: 'partial',
        label: 'Remitly screenshot',
        method: 'Remitly',
        attachedAt: 'Aug 13, 2026',
      },
    ],
    buyerCreditIssued: false,
  },
  {
    id: 'po-12347',
    orderId: '12347',
    plant: 'Alocasia Dragon Scale',
    variegation: '',
    potSize: '4"',
    liveSaleDate: 'Aug 10, 2026',
    orderDate: 'Aug 11, 2026',
    scanDate: 'Aug 12, 2026',
    listedPrice: 65,
    commissionRate: 10,
    commission: 6.5,
    logistics: 15,
    plantCare: 5,
    netPayout: 38.5,
    scanned: true,
    leafTrailStatus: 'Received',
    hubReceived: true,
    condition: 'ok',
    payoutStatus: 'Fully paid',
    partialPercent: 80,
    amountPaid: 38.5,
    paymentStatus: 'Paid',
    businessName: 'Greenleaf Garden',
    country: 'Philippines',
    proofs: [
      {
        kind: 'partial',
        label: 'Bank transfer screenshot',
        method: 'Bank',
        attachedAt: 'Aug 13, 2026',
      },
      {
        kind: 'full',
        label: 'Remitly screenshot',
        method: 'Remitly',
        attachedAt: 'Aug 18, 2026',
      },
    ],
    buyerCreditIssued: false,
  },
  {
    id: 'po-12350',
    orderId: '12350',
    plant: 'Anthurium Crystallinum',
    variegation: '',
    potSize: '2"',
    liveSaleDate: 'Aug 17, 2026',
    orderDate: 'Aug 17, 2026',
    scanDate: '—',
    listedPrice: 90,
    commissionRate: 8,
    commission: 7.2,
    logistics: 15,
    plantCare: 5,
    netPayout: null,
    scanned: false,
    leafTrailStatus: '—',
    hubReceived: false,
    condition: 'ok',
    payoutStatus: 'Awaiting scan',
    partialPercent: 75,
    amountPaid: 0,
    paymentStatus: 'Paid',
    businessName: 'Greenleaf Garden',
    country: 'Philippines',
    proofs: [],
    buyerCreditIssued: false,
  },
  {
    id: 'po-12352',
    orderId: '12352',
    plant: 'Hoya Kerrii',
    variegation: '',
    potSize: '4"',
    liveSaleDate: 'Aug 17, 2026',
    orderDate: 'Aug 17, 2026',
    scanDate: 'Aug 18, 2026',
    listedPrice: 120,
    commissionRate: 10,
    commission: 12,
    logistics: 15,
    plantCare: 5,
    netPayout: -4.2,
    scanned: true,
    leafTrailStatus: 'Missing',
    hubReceived: false,
    condition: 'missing',
    payoutStatus: 'Missing / Damaged',
    partialPercent: 75,
    amountPaid: 0,
    paymentStatus: 'Paid',
    businessName: 'Greenleaf Garden',
    country: 'Philippines',
    proofs: [],
    buyerCreditIssued: true,
  },
  {
    id: 'po-12353',
    orderId: '12353',
    plant: 'Philodendron Pink Princess',
    variegation: 'Pink Princess',
    potSize: '6"',
    liveSaleDate: 'Aug 17, 2026',
    orderDate: 'Aug 17, 2026',
    scanDate: 'Aug 18, 2026',
    listedPrice: 150,
    commissionRate: 10,
    commission: 15,
    logistics: 20,
    plantCare: 5,
    netPayout: -5.25,
    scanned: true,
    leafTrailStatus: 'Damaged',
    hubReceived: false,
    condition: 'damaged',
    payoutStatus: 'Missing / Damaged',
    partialPercent: 70,
    amountPaid: 77,
    paymentStatus: 'Paid',
    businessName: 'Greenleaf Garden',
    country: 'Philippines',
    proofs: [
      {
        kind: 'partial',
        label: 'Remitly screenshot',
        method: 'Remitly',
        attachedAt: 'Aug 19, 2026',
      },
    ],
    buyerCreditIssued: true,
  },
];

export const SAMPLE_LISTINGS = [
  {
    id: 'l1',
    genus: 'Philodendron',
    species: 'Jennifer',
    variegation: 'Variegated',
    status: 'Live',
    pin: false,
    listingType: 'Live',
    price: '200.00',
    potSize: '6"',
    height: 'Above',
  },
  {
    id: 'l2',
    genus: 'Monstera',
    species: 'Thai Constellation',
    variegation: 'Thai Constellation',
    status: 'Live',
    pin: true,
    listingType: 'Live',
    price: '175.00',
    potSize: '4"',
    height: 'Below',
  },
  {
    id: 'l3',
    genus: 'Anthurium',
    species: 'Crystallinum',
    variegation: '',
    status: 'Inactive',
    pin: false,
    listingType: 'Group Chat',
    price: '90.00',
    potSize: '2"',
    height: 'Below',
  },
  {
    id: 'l4',
    genus: 'Alocasia',
    species: 'Dragon Scale',
    variegation: '',
    status: 'Live',
    pin: false,
    listingType: 'Live',
    price: '65.00',
    potSize: '4"',
    height: 'Above',
  },
];

export const SAMPLE_REQUESTS = [
  {
    id: 'req-1',
    name: 'Maya Chen',
    email: 'maya.chen@email.com',
    fromType: 'US Customer',
    toType: 'US Business',
    country: 'United States',
    gardenName: 'Maya Live Plants',
    submittedAt: 'Aug 14, 2026',
    status: 'Pending',
    notes: 'Wants Live Selling only. Will keep buying as a customer.',
  },
  {
    id: 'req-2',
    name: 'Luis Santos',
    email: 'luis@greenleaf.ph',
    fromType: 'Asia Seller',
    toType: 'Asia Business',
    country: 'Philippines',
    gardenName: 'Greenleaf Garden',
    submittedAt: 'Aug 13, 2026',
    status: 'Pending',
    notes: 'Existing live seller switching to USD + commission model.',
    liveFlag: 'Yes',
  },
  {
    id: 'req-3',
    name: 'Siti Rahman',
    email: 'siti@tropica.id',
    fromType: 'Asia Seller',
    toType: 'Asia Business',
    country: 'Indonesia',
    gardenName: 'Tropica ID',
    submittedAt: 'Aug 8, 2026',
    status: 'Approved',
    notes: 'Approved. New listings use exact USD.',
    liveFlag: 'Yes',
    reviewedAt: 'Aug 9, 2026',
    reviewedBy: 'admin@ileafu.com',
    reviewNotes: 'Live Selling verified. Approved for USD commission model.',
  },
];

export const SAMPLE_FEE_CONFIG = {
  defaults: {
    commissionPercent: 10,
    logisticsSmall: 15,
    logisticsLarge: 20,
    plantCare: 5,
    cancellationFeePercent: 3.5,
    applyLogistics: true,
    applyPlantCare: true,
  },
  byCountry: [
    {country: 'Philippines', commissionPercent: 10},
    {country: 'Thailand', commissionPercent: 10},
    {country: 'Indonesia', commissionPercent: 10},
    {country: 'Singapore', commissionPercent: 8},
    {country: 'Vietnam', commissionPercent: 10},
    {country: 'Taiwan', commissionPercent: 10},
    {country: 'United States', commissionPercent: 10},
  ],
  byBusiness: [
    {name: 'Greenleaf Garden', country: 'Philippines', commissionPercent: 10},
    {name: 'Tropica ID', country: 'Indonesia', commissionPercent: 8},
  ],
};

export const SAMPLE_US_BUYER = {
  firstName: 'Maya',
  lastName: 'Chen',
  email: 'maya.chen@email.com',
  username: 'mayachen',
  phone: '+1 (415) 555-0188',
  accountClass: 'US Customer',
  status: 'Active',
  address: '1842 Oak Street',
  city: 'San Francisco',
  state: 'California',
  zipCode: '94117',
  country: 'United States',
  leafPoints: 240,
  plantCredits: 15,
  shippingCredits: 2,
  canBuy: true,
  canLiveSell: false,
  canMainstreamSell: false,
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
