/**
 * The Pay to Board order detail screen shows what the buyer pays line by line. These pin the
 * rules that keep it honest: per-plant prices come from the unit price (not the order total
 * repeated on every row), and the lines always add up to the total the buyer is charged.
 */
import {
  priceBreakdown,
  plantsByGrower,
  toPassPlant,
} from '../src/screens/Buyer/Orders/payToBoardOrder';

const plant = (supplierName, unitPrice, quantity = 1) => ({
  plantCode: `${supplierName}-${unitPrice}`,
  supplierName,
  unitPrice,
  quantity,
  // The grouped API puts the ORDER total here, on every row.
  productTotal: 999,
});

const sum = lines => lines.reduce((total, line) => total + line.amount, 0);

describe('per-plant price', () => {
  it('is the unit price times quantity, not the order total', () => {
    expect(toPassPlant(plant('A', 45, 2), 0).price).toBe('$90.00');
  });
});

describe('plantsByGrower', () => {
  it('groups plants by grower in first-seen order with each grower total', () => {
    const growers = plantsByGrower({
      plants: [plant('Green Leaf', 85), plant('Bangkok Aroids', 60), plant('Green Leaf', 45, 2)],
    });
    expect(growers.map(g => [g.name, g.plants.length, g.total])).toEqual([
      ['Green Leaf', 2, 175],
      ['Bangkok Aroids', 1, 60],
    ]);
  });
});

describe('priceBreakdown', () => {
  const base = {
    plants: [plant('A', 100), plant('A', 50)],
    totalPlantCost: 150,
    totalShippingCost: 40,
  };

  it('lists plants, shipping, discount and credits that add up to the total', () => {
    const {lines, total} = priceBreakdown({
      ...base,
      totalDiscount: 15,
      discountCode: 'SPRING10',
      leafPoints: 5,
      finalTotal: 170,
    });
    expect(lines.map(line => line.label)).toEqual([
      'Plants (2)',
      'Shipping',
      'Discount (SPRING10)',
      'Leaf points',
    ]);
    expect(sum(lines)).toBeCloseTo(total);
  });

  it('shows anything else in the stored total as its own line', () => {
    const {lines, total} = priceBreakdown({...base, finalTotal: 193});
    expect(lines[lines.length - 1]).toEqual({label: 'Other charges', amount: 3});
    expect(sum(lines)).toBeCloseTo(total);
  });

  it('prefers the pricing total and leaves out empty lines', () => {
    const {lines, total} = priceBreakdown({
      plants: [plant('A', 100)],
      totalPlantCost: 100,
      totalShippingCost: 0,
      pricing: {finalTotal: 100},
      finalTotal: 1,
    });
    expect(total).toBe(100);
    expect(lines).toEqual([{label: 'Plants (1)', amount: 100}]);
  });
});
