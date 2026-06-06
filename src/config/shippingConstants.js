/** Refundable Import Handling Fee (single plant / grower's choice). */
export const REFUNDABLE_AIR_CARGO_DOCUMENTATION_FEE = 10;

export const AIR_CARGO_DOCUMENTATION_FEE_LABEL = 'Refundable Import Handling Fee';

export const HANDLING_FEE_CREDIT_LABEL = 'Handling Fee Credit';

export const PROMO_FREE_AIR_CARGO_MIN_ITEMS = 15;
export const PROMO_FREE_AIR_CARGO_MIN_SUBTOTAL = 500;

export const AIR_CARGO_PROMO_EARN_BACK_TEXT =
  'Pay the Refundable Import Handling Fee upfront; earn it back when you and your shipping buddies reach $500 on 15 plants.';

export function getAirCargoPromoQualifiedText({
  totalEligiblePlants = 0,
} = {}) {
  return `Thanks for your large order! We've waived your import handling fee (${totalEligiblePlants} eligible plants, $${PROMO_FREE_AIR_CARGO_MIN_SUBTOTAL}+ on this flight).`;
}
