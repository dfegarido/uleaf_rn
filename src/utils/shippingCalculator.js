import shippingRules from '../config/shippingRules';
import { roundToCents } from './money';

// Normalize listingType into keys used by shippingRules
const normalizeListingType = listingType => {
  if (!listingType) return 'single';
  const v = listingType.toString().toLowerCase();
  if (v.includes('whole')) return 'wholesale';
  if (v.includes('grower') || v.includes('choice')) return 'growers';
  return 'single';
};

// Choose bucket for pot size or height
const chooseBucket = (type, value) => {
  const num = parseFloat(String(value).replace('"', '')) || 0;
  if (type === 'single') {
    return num > 12 ? '>12' : '<=12';
  }
  if (type === 'growers' || type === 'wholesale') {
    return num > 4 ? '>4' : '<=4';
  }
  return 'default';
};

// Compute grouped shipping given plant items and options
export const computeGroupedShipping = (items = [], options = {}) => {
  // items: [{ listingType, potSize/size, height, quantity, price, hasAirCargo }]
  const groups = new Map();

  // Normalize items into groups
  items.forEach(item => {
    const listingKey = normalizeListingType(item.listingType);
    // Prefer potSize/size for growers/wholesale, otherwise use height
    const sizeVal = listingKey === 'single' ? (item.height || item.approximateHeight || 0) : (item.potSize || item.size || '2"');
    const bucket = chooseBucket(listingKey, sizeVal);
    const groupKey = `${listingKey}::${bucket}`;
    const qty = Number(item.quantity || 1) || 1;

    if (!groups.has(groupKey)) {
      groups.set(groupKey, { listingKey, bucket, qty: 0, items: [] });
    }
    const g = groups.get(groupKey);
    g.qty += qty;
    g.items.push(item);
  });

  let shippingTotal = 0;
  let airCargoTotal = 0;
  let details = [];

  groups.forEach(g => {
    const ruleSet = shippingRules[g.listingKey] || {};
    const rule = ruleSet[g.bucket] || ruleSet.default || { base: 50, addOn: 5, airBase: 150, airAddOn: 0 };

    // base applies once per group, addOn applies for each additional item beyond 1
    const base = Number(rule.base || 0);
    const addOn = Number(rule.addOn || 0);
    const groupShipping = base + Math.max(0, g.qty - 1) * addOn;

    shippingTotal += groupShipping;

    // Air cargo: wholesale groups use airBase + (qty-1)*airAddOn, other groups use airBase once
    const airBase = Number(rule.airBase || 0);
    const airAddOn = Number(rule.airAddOn || 0);
    let groupAir = 0;
    if (g.listingKey === 'wholesale') {
      groupAir = airBase + Math.max(0, g.qty - 1) * airAddOn;
    } else {
      // For non-wholesale, air base is applied once unless multiple groups exist; we apply per group
      groupAir = airBase; // addOn usually 0 for single/growers
    }
    airCargoTotal += groupAir;

    details.push({ groupKey: g.listingKey + ' ' + g.bucket, qty: g.qty, groupShipping, groupAir });
  });

  // Promotional free base cargo rule: if total items >= 15 and subtotal >= 500, reduce non-wholesale air base cargo to 0
  const totalItems = items.reduce((s, it) => s + (Number(it.quantity) || 1), 0);
  const subtotal = items.reduce((s, it) => s + (Number(it.price) || 0) * (Number(it.quantity) || 1), 0);
  let appliedAirBaseCredit = 0;
  if (totalItems >= 15 && subtotal >= 500) {
    // subtract air base for non-wholesale groups only
    const nonWholesaleBase = details.reduce((sum, d) => {
      if (!d.groupKey.startsWith('wholesale')) return sum +  (d.groupAir || 0);
      return sum;
    }, 0);
    appliedAirBaseCredit = nonWholesaleBase;
    airCargoTotal = Math.max(0, airCargoTotal - appliedAirBaseCredit);
  }

  const total = roundToCents(shippingTotal + airCargoTotal);

  return {
    shippingTotal: roundToCents(shippingTotal),
    airCargoTotal: roundToCents(airCargoTotal),
    total,
    details,
    appliedAirBaseCredit: roundToCents(appliedAirBaseCredit),
  };
};

export default { computeGroupedShipping };
