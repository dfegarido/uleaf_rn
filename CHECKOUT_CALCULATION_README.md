# Checkout Calculation Logic - README

## Overview

This document describes the checkout calculation logic for the iLeafU application, including plant pricing, shipping costs (UPS and Air Cargo), and promotional discounts.

---

## Table of Contents

1. [Shipping Methods](#shipping-methods)
2. [Plant Types](#plant-types)
3. [Shipping Rules](#shipping-rules)
4. [Calculation Formula](#calculation-formula)
5. [Promotional Discounts](#promotional-discounts)
6. [Examples](#examples)
7. [Implementation Files](#implementation-files)

---

## Shipping Methods

### 1. UPS 2nd Day Shipping
- Standard ground shipping via UPS
- Applies to **Single Plants** and **Grower's Choice** listings
- Cost varies based on plant characteristics (height/pot size)

### 2. Base Air Cargo
- Air freight shipping
- Base cost applies once per order
- **Note:** When wholesale items are present, base air cargo becomes $0 and is replaced by Wholesale Air Cargo

### 3. Wholesale Air Cargo
- Special air freight pricing for wholesale orders
- Only applies when cart contains wholesale items
- Replaces Base Air Cargo when wholesale items are in the cart

### 4. UPS Next Day Upgrade
- Optional 30% upgrade fee for faster delivery
- Applies on top of UPS 2nd Day shipping costs

---

## Plant Types

The system handles three main plant types:

### 1. Single Plant
- **Definition:** Individual plants sold as single units
- **Categorization:** Based on plant **height**
  - `<=12"` height → Lower tier pricing
  - `>12"` height → Higher tier pricing

### 2. Grower's Choice
- **Definition:** Plants sold with flexible specifications
- **Categorization:** Based on **pot size**
  - `<=4"` pot size → Lower tier pricing
  - `>4"` pot size → Higher tier pricing

### 3. Wholesale
- **Definition:** Bulk plant orders
- **Categorization:** Based on **pot size**
  - `<=4"` pot size → Standard wholesale pricing
  - `>4"` pot size → Enhanced wholesale pricing

---

## Shipping Rules

### UPS 2nd Day Shipping Rates

| Plant Type | Size/Height Bucket | 1st Item | Add-on Item |
|------------|-------------------|----------|-------------|
| Single Plant | <=12" height | $50.00 | $5.00 |
| Single Plant | >12" height | $70.00 | $7.00 |
| Grower's Choice | <=4" pot size | $50.00 | $5.00 |
| Grower's Choice | >4" pot size | $70.00 | $8.00 |
| Wholesale | <=4" pot size | $50.00 | $25.00 |
| Wholesale | >4" pot size | $50.00 | $25.00 |

### Air Cargo Rates

| Plant Type | Size/Height Bucket | Base Air Cargo | Add-on Air Cargo |
|------------|-------------------|----------------|------------------|
| Single Plant | Any | $150.00 | $0.00 |
| Grower's Choice | Any | $150.00 | $0.00 |
| Wholesale | <=4" pot size | $100.00 | $50.00 |
| Wholesale | >4" pot size | $100.00 | $50.00 |

**Important Rules:**
1. Base Air Cargo applies **once per order** for non-wholesale items
2. When wholesale items are present, Base Air Cargo becomes $0 and is replaced by Wholesale Air Cargo
3. Wholesale Air Cargo has a base cost + add-on cost for additional items

---

## Calculation Formula

### Step-by-Step Calculation

#### 1. Group Plants by Type and Size
```
Groups:
- single::<=12 (quantity: X)
- single::>12 (quantity: Y)
- growers::<=4 (quantity: Z)
- growers::>4 (quantity: W)
- wholesale::<=4 (quantity: A)
- wholesale::>4 (quantity: B)
```

#### 2. Calculate UPS Shipping Cost per Group
```
For each group:
  Group UPS Cost = baseCost + ((quantity - 1) × addOnCost)

Total UPS Shipping = Sum of all Group UPS Costs
```

#### 3. Calculate Air Cargo Cost
```
Check if wholesale items exist:
  - If YES: Base Air Cargo = $0, use Wholesale Air Cargo
  - If NO: Use Base Air Cargo for each group

For each group:
  - If wholesale:
    Group Air Cargo = airBase + ((quantity - 1) × airAddOn)
  - Else:
    Group Air Cargo = airBase (applied once)

Total Air Cargo = Sum of all Group Air Cargo costs
```

#### 4. Apply Promotional Discounts
```
Condition: totalItems >= 15 AND subtotal >= $500

If condition met:
  appliedAirBaseCredit = Non-wholesale Air Cargo Base Total
  airCargoTotal = airCargoTotal - appliedAirBaseCredit
```

#### 5. Calculate Final Total
```
Total Plant Cost = Sum of (price × quantity) for all items

Total Shipping = Total UPS Shipping + Total Air Cargo

Apply Discounts:
  - Original price discounts (if any)
  - Air Cargo credit (if promotional conditions met)

Final Amount = Total Plant Cost + Total Shipping - Discounts
```

---

## Promotional Discounts

### Rule: Free Base Air Cargo Credit

**Conditions:**
- Total number of plants ≥ 15
- Subtotal (before shipping) ≥ $500.00

**Discount:**
- Credit = Non-wholesale Base Air Cargo amount
- Only applies to non-wholesale items
- Wholesale Air Cargo is NOT affected by this discount

**Example:**
```
Order has:
- 20 total plants
- $600 subtotal
- Includes both single/growers ($150 base air cargo) and wholesale ($100 wholesale air cargo)

Result:
- Credit applied: $150 (removes base air cargo for single/growers)
- Wholesale Air Cargo: $100 (unchanged)
- Final Air Cargo: $100
```

---

## Examples

### Example 1: Simple Single Plant Order

**Order:**
- 3x Single Plants (6" pots, $30 each)
- Height: <=12"

**Calculation:**
```
Plant Cost = 3 × $30 = $90.00
UPS Shipping = $50 (1st) + (2 × $5) = $60.00
Base Air Cargo = $150.00
Total Shipping = $60.00 + $150.00 = $210.00

Total = $90.00 + $210.00 = $300.00
```

### Example 2: Mixed Single and Grower's Choice

**Order:**
- 1x Single Plant (6", height >12") = $30
- 2x Grower's Choice (4" pot) = $90 each
- 3x Grower's Choice (6" pot) = $100 each

**Calculation:**
```
Plants:
- 1 Single >12": $30
- 2 Growers <=4": $90 × 2 = $180
- 3 Growers >4": $100 × 3 = $300

Plant Cost = $30 + $180 + $300 = $510.00

UPS Shipping:
- Single >12" group: $70 (base) + (0 add-ons) = $70
- Growers <=4" group: $50 (base) + (1 × $5) = $55
- Growers >4" group: $70 (base) + (2 × $8) = $86
Total UPS = $70 + $55 + $86 = $211.00

Base Air Cargo:
- Applied per group: $150 × 3 groups = $450.00

Total Shipping = $211.00 + $450.00 = $661.00

Promotional Check:
- Total items = 6 (not ≥ 15)
- No discount applied

Total = $510.00 + $661.00 = $1,171.00
```

### Example 3: Wholesale Order

**Order:**
- 2x Wholesale (2"-4" pots) = $75 each
- 2x Wholesale (2"-4" pots, larger) = $150 each

**Calculation:**
```
Plant Cost = (2 × $75) + (2 × $150) = $450.00

UPS Shipping:
- Wholesale <=4" group: $50 (base) + (3 × $25) = $125.00

Air Cargo:
- Base Air Cargo: $0 (replaced by Wholesale Air Cargo)
- Wholesale Air Cargo: $100 (base) + (3 × $50) = $250.00

Total Shipping = $125.00 + $250.00 = $375.00

Total = $450.00 + $375.00 = $825.00
```

### Example 4: Large Order with Promotional Discount

**Order:**
- 8x Grower's Choice (4" pots) = $80 each
- 7x Single Plant (height <=12") = $50 each
- Subtotal = (8 × $80) + (7 × $50) = $640 + $350 = $990.00

**Calculation:**
```
Plant Cost = $990.00

UPS Shipping:
- Growers <=4" group: $50 + (7 × $5) = $85.00
- Single <=12" group: $50 + (6 × $5) = $80.00
Total UPS = $165.00

Base Air Cargo:
- Growers: $150.00
- Single: $150.00
Total Air Cargo = $300.00

Promotional Check:
- Total items = 15 (≥ 15) ✓
- Subtotal = $990 (≥ $500) ✓
- Applied Air Base Credit = $300.00 (both groups are non-wholesale)
- Air Cargo After Credit = $0.00

Total Shipping = $165.00 + $0.00 = $165.00

Total = $990.00 + $165.00 = $1,155.00
```

---

## Implementation Files

### Core Calculation Logic
- **File:** `src/utils/shippingCalculator.js`
- **Function:** `computeGroupedShipping(items, options)`
- **Purpose:** Main calculation engine for shipping costs

### Shipping Rules Configuration
- **File:** `src/config/shippingRules.js`
- **Purpose:** Defines base rates and add-on costs for each plant type/size bucket

### Checkout Screen Integration
- **File:** `src/screens/Buyer/Checkout/CheckoutScreen.js`
- **Function:** `calculateUpsShippingCost()`
- **Function:** `orderSummary()`
- **Purpose:** Integrates calculation logic into checkout UI

### Cart Screen Display
- **File:** `src/screens/Buyer/Cart/ScreenCart.js`
- **Purpose:** Shows shipping cost preview in cart

### Plant Detail Display
- **File:** `src/screens/Buyer/Shop/ScreenPlantDetail.js`
- **Function:** `getShippingCost()`
- **Purpose:** Shows shipping estimate on individual plant detail pages

---

## Key Code Locations

### Shipping Calculator Logic
```javascript
// Location: src/utils/shippingCalculator.js

// Groups plants by type and size bucket
const groups = new Map();

// Calculates shipping for each group
groups.forEach(g => {
  const groupShipping = base + Math.max(0, g.qty - 1) * addOn;
  // ... air cargo calculation
});

// Applies promotional discount
if (totalItems >= 15 && subtotal >= 500) {
  // Remove non-wholesale air cargo base
  airCargoTotal -= nonWholesaleBase;
}
```

### Checkout Integration
```javascript
// Location: src/screens/Buyer/Checkout/CheckoutScreen.js

const calculateUpsShippingCost = () => {
  const grouped = computeGroupedShipping(plants);
  return { baseCost, addOnCost: 0, baseCargo: grouped.airCargoTotal, _grouped: grouped };
};
```

---

## Important Notes

1. **Grouping Logic:** Plants are grouped by both `listingType` and `size bucket` for accurate per-group calculations
2. **Air Cargo Replacement:** When wholesale items are present, base air cargo is replaced entirely by wholesale air cargo
3. **Promotional Conditions:** Both conditions (15+ plants AND $500+ subtotal) must be met for the air cargo credit
4. **Wholesale Priority:** Wholesale Air Cargo takes precedence over Base Air Cargo when both could apply
5. **Per-Group Base Cost:** Each group pays its own base cost (UPS and air cargo), not just the first plant in the entire order

---

## Changes History

This calculation logic was implemented to replace a simpler per-item calculation approach with a more accurate group-based calculation that matches the business requirements table.

**Previous Behavior:**
- Simple per-item calculation
- Applied base cost only to first item overall
- Less accurate for mixed orders

**Current Behavior:**
- Group-based calculation
- Base cost applies per group (type + size)
- Accurate for all order combinations
- Promotional discounts properly applied

---

## Testing Examples

See the table data provided in the user's request for additional calculation examples and validation scenarios.

