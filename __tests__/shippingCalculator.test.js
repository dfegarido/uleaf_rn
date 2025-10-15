import { computeGroupedShipping } from '../src/utils/shippingCalculator';

describe('computeGroupedShipping', () => {
  test('single small plant', () => {
    const items = [{ listingType: 'Single Plant', height: 10, quantity: 1, price: 25 }];
    const res = computeGroupedShipping(items);
    expect(res.shippingTotal).toBe(50);
    expect(res.airCargoTotal).toBe(150);
    expect(res.total).toBe(200);
  });

  test('single tall plant (>12")', () => {
    const items = [{ listingType: 'Single Plant', height: 13, quantity: 1, price: 40 }];
    const res = computeGroupedShipping(items);
    expect(res.shippingTotal).toBe(70);
    expect(res.airCargoTotal).toBe(150);
    expect(res.total).toBe(220);
  });

  

  test('Thailand multi-order: buyer scenarios (independent check per checkout)', () => {
    // Buyer 1 - 1st order: 5 plants at $40 => subtotal 200 (below promo)
    const buyer1_first = Array.from({ length: 5 }).map(() => ({ listingType: 'Single Plant', height: 10, quantity: 1, price: 40 }));
    const r1 = computeGroupedShipping(buyer1_first);
    // Base air cargo applies (150)
    expect(r1.airCargoTotal).toBe(150);

    // Buyer 2 - 1st order: 15 plants at $33.333 => subtotal >=500 and qty>=15 => air cargo free for single/growers
  // Use 33.334 to ensure subtotal >= 500 (33.334 * 15 = 500.01)
  const buyer2_first = Array.from({ length: 15 }).map(() => ({ listingType: 'Single Plant', height: 10, quantity: 1, price: 33.334 }));
    const r2 = computeGroupedShipping(buyer2_first);
    expect(r2.airCargoTotal).toBe(0);

    // Buyer1 - 2nd order: 10 plants more (test that promo still not applied if subtotal <500 across that single checkout)
    const buyer1_second = Array.from({ length: 10 }).map(() => ({ listingType: 'Single Plant', height: 10, quantity: 1, price: 25 }));
    const r3 = computeGroupedShipping(buyer1_second);
    expect(r3.airCargoTotal).toBe(150);
  });

  test('promo free base cargo when subtotal >=500 and qty>=15', () => {
    // 15 small single plants priced to reach subtotal 500
    const items = Array.from({ length: 15 }).map(() => ({ listingType: 'Single Plant', height: 10, quantity: 1, price: 40 }));
    const res = computeGroupedShipping(items);
    // shippingTotal: single group base 50 + (15-1)*5 = 50 + 70 = 120
    expect(res.shippingTotal).toBe(120);
    // airCargoTotal should be 0 due to promo
    expect(res.airCargoTotal).toBe(0);
  });

  test('rounding stability', () => {
    const items = [{ listingType: 'Single Plant', height: 10, quantity: 3, price: 33.333 }];
    const res = computeGroupedShipping(items);
    // shipping: 50 + (3-1)*5 = 60, air 150 => total 210
    expect(res.total).toBe(210);
  });
});
