// Data-driven shipping rules mapping following the spec table provided by the product team
// Values are in USD
const shippingRules = {
  // Single plant uses height buckets (<=12in or >12in)
  single: {
    "<=12": { base: 50, addOn: 5, airBase: 150, airAddOn: 0 },
    ">12": { base: 70, addOn: 5, airBase: 150, airAddOn: 0 },
    default: { base: 50, addOn: 5, airBase: 150, airAddOn: 0 },
  },

  // Grower's Choice uses pot size buckets; addOn depends on additional item size in the table.
  // We implement per-group rules: base determined by the group's first-item size bucket, addOn by that bucket too.
  growers: {
    "<=4": { base: 50, addOn: 5, airBase: 150, airAddOn: 0 },
    ">4": { base: 70, addOn: 8, airBase: 150, airAddOn: 0 },
    default: { base: 50, addOn: 5, airBase: 150, airAddOn: 0 },
  },

  // Wholesale rules (from table): UPS 2nd Day: base 50, addOn 25; Air Cargo: base 100, addOn 50
  wholesale: {
    "<=4": { base: 50, addOn: 25, airBase: 100, airAddOn: 50 },
    ">4": { base: 50, addOn: 25, airBase: 100, airAddOn: 50 },
    default: { base: 50, addOn: 25, airBase: 100, airAddOn: 50 },
  },
};

export default shippingRules;
