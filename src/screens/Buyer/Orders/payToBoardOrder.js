import {getCountryCode} from '../../../utils/buyerOrderCardTransform';

// How a Pay to Board order (a transaction group from the grouped orders API) reads on screen.
// Shared by the list (ScreenPayToBoard) and the order detail screen.

// The order detail screen sends the buyer's confirmed pay or cancel back to the list, where the
// payment state and the pass animations live: {type: 'pay' | 'cancel', transactionNumber}.
export const PAY_TO_BOARD_ACTION = 'pay_to_board_action';

export const plantCountText = count => `${count} ${count === 1 ? 'plant' : 'plants'}`;

export const formatUsd = amount => `$${(amount || 0).toFixed(2)}`;

// What the buyer pays for the whole order.
export const orderTotalOf = group => group.pricing?.finalTotal || group.finalTotal || 0;

// The checkout's unit price times quantity. productTotal is the ORDER total, repeated on every
// line, so it can't be used per plant.
const lineTotalOf = plant => (plant.unitPrice || 0) * (plant.quantity || 1);

export const flightDateOf = group =>
  group.flightDateFormatted || group.plants?.[0]?.flightDateFormatted || null;

export const originCodesOf = group => {
  const plants = group.plants || [];
  return [...new Set((plants.length ? plants : [group]).map(getCountryCode))];
};

// The plant as the boarding pass lists it.
export const toPassPlant = (plant, index) => {
  const details = plant.plantDetails || {};
  const image =
    details.imageCollectionWebp?.[0] || details.image || details.imageCollection?.[0];
  const quantity = plant.quantity || 1;
  return {
    key: `${plant.plantCode}_${index}`,
    image: image ? {uri: image} : require('../../../assets/images/plant1.png'),
    name: details.title || plant.plantName || 'Unknown plant',
    detail: [
      plant.variegation || details.variegation,
      plant.potSize || details.potSize,
      quantity > 1 && `${quantity}x`,
    ]
      .filter(Boolean)
      .join(', '),
    price: formatUsd(lineTotalOf(plant)),
    joinerUsername: plant.isJoinerOrder ? plant.joinerInfo?.username : null,
  };
};

// The plants grouped by the grower who sells them, in the order each grower first appears.
export const plantsByGrower = group => {
  const growers = new Map();
  (group.plants || []).forEach((plant, index) => {
    const name = plant.supplierName || plant.sellerCode || 'Grower';
    if (!growers.has(name)) {
      growers.set(name, {name, plants: [], total: 0});
    }
    const grower = growers.get(name);
    grower.plants.push(toPassPlant(plant, index));
    grower.total += lineTotalOf(plant);
  });
  return [...growers.values()];
};

const round2 = n => Math.round(n * 100) / 100;

/**
 * What the buyer pays, line by line. Checkout computes the total as plants + shipping - discount
 * - credits; whatever else is in the stored total (a fee, a rounding) shows as its own line,
 * so the lines always add up to the total the buyer is charged.
 */
export const priceBreakdown = group => {
  const total = orderTotalOf(group);
  const plantCount = (group.plants || []).length;
  const plants =
    group.totalPlantCost || (group.plants || []).reduce((sum, plant) => sum + lineTotalOf(plant), 0);

  const lines = [{label: `Plants (${plantCount})`, amount: plants}];
  if (group.totalShippingCost > 0) {
    lines.push({label: 'Shipping', amount: group.totalShippingCost});
  }
  if (group.totalDiscount > 0) {
    lines.push({
      label: group.discountCode ? `Discount (${group.discountCode})` : 'Discount',
      amount: -group.totalDiscount,
    });
  }
  [
    ['Leaf points', group.leafPoints],
    ['Plant credits', group.plantCredits],
    ['Shipping credits', group.shippingCredits],
  ].forEach(([label, amount]) => {
    if (amount > 0) {
      lines.push({label, amount: -amount});
    }
  });

  const rest = round2(total - lines.reduce((sum, line) => sum + line.amount, 0));
  if (Math.abs(rest) >= 0.01) {
    lines.push({label: rest > 0 ? 'Other charges' : 'Other savings', amount: rest});
  }
  return {lines, total};
};

export const maskUsername = username => {
  if (!username || username.length < 3) {
    return ''; // Don't show for very short or empty usernames
  }
  // Show the first two and last two characters, with up to 8 asterisks in between
  const middle = '*'.repeat(Math.min(username.length - 2, 8));
  return `@${username.slice(0, 2)}${middle}${username.slice(-2)}`;
};

/**
 * The words on the pay or cancel confirmation sheet. `venmoUsername` is the masked Venmo
 * username when the buyer pays with a saved Venmo account, null otherwise.
 */
export const passSheetText = ({type, group, vaulted, venmoUsername}) => {
  const plants = plantCountText(group.plants?.length || 0);
  if (type === 'cancel') {
    const flight = flightDateOf(group);
    return {
      title: 'Cancel this order?',
      body: `${plants} will be removed${flight ? ` from the ${flight} flight` : ''}. Any credits or discount code you used go back to your account.`,
      confirmLabel: 'Cancel order',
      dismissLabel: 'Keep order',
    };
  }
  const total = formatUsd(orderTotalOf(group));
  return {
    title: `Pay ${total} for ${plants}?`,
    body: `${
      vaulted
        ? `Charged to Venmo ${venmoUsername || 'on file'}.`
        : "You'll finish paying on the payment page."
    } Once it's confirmed, your plants move to Ready to Fly.`,
    confirmLabel: `Pay ${total}`,
    dismissLabel: 'Not now',
  };
};
