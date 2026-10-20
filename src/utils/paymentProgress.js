import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * Tracks which orders are awaiting a payment confirmation.
 *
 * WHY THIS EXISTS
 * ---------------
 * The payment completes in the browser (PayPal/Venmo on the hosted page), so when the app comes
 * back it cannot know the outcome: the backend confirms the order and pushes a "payment
 * confirmed" notification. Until that arrives the buyer must not start a second payment for the
 * same order - that is how a buyer ends up charged twice.
 *
 * The state lives here (rather than inline in the screen) so the rules can be tested without
 * rendering the screen, which pulls in native modules.
 */

/** A transaction that is waiting for the backend to confirm its payment. */
export function createPaymentProgressState() {
  return new Set();
}

/** Mark a transaction as awaiting confirmation. Returns a new state. */
export function markPaymentInProgress(state, transactionNumber) {
  if (!transactionNumber) return state;
  if (state.has(transactionNumber)) return state;
  const next = new Set(state);
  next.add(transactionNumber);
  return next;
}

/** Clear the awaiting-confirmation flag for a transaction. Returns a new state. */
export function clearPaymentInProgress(state, transactionNumber) {
  if (!transactionNumber || !state.has(transactionNumber)) return state;
  const next = new Set(state);
  next.delete(transactionNumber);
  return next;
}

/** Is this transaction awaiting a payment confirmation? */
export function isPaymentInProgress(state, transactionNumber) {
  return Boolean(transactionNumber) && state.has(transactionNumber);
}

/**
 * Where the awaiting-confirmation transactions are kept between screens.
 *
 * The checkout flow opens the payment sheet and then navigates to the Orders screen, so the
 * flag has to survive the screen change. It is also cleared when the app is reopened.
 */
const STORAGE_KEY = 'paymentInProgress';

/** Read the transactions awaiting confirmation. */
export async function loadPaymentProgress() {
  try {
    const raw = await AsyncStorage.getItem(STORAGE_KEY);
    if (!raw) return createPaymentProgressState();
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return createPaymentProgressState();
    return new Set(parsed.filter((t) => typeof t === 'string' && t.length > 0));
  } catch (error) {
    console.warn('[paymentProgress] could not read the pending payments', error);
    return createPaymentProgressState();
  }
}

/** Persist the transactions awaiting confirmation. */
export async function savePaymentProgress(state) {
  try {
    await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(Array.from(state)));
  } catch (error) {
    console.warn('[paymentProgress] could not save the pending payments', error);
  }
}

/**
 * The banner text for the current state.
 *
 * @param {number} count how many transactions are awaiting confirmation
 * @returns {{title: string, body: string}}
 */
export function paymentProgressBannerText(count) {
  if (!count || count <= 0) {
    return {title: '', body: ''};
  }
  if (count === 1) {
    return {
      title: 'Payment in progress',
      body: 'We are confirming your payment. You will get a notification as soon as it is confirmed.',
    };
  }
  return {
    title: 'Payments in progress',
    body: `We are confirming ${count} payments. You will get a notification as soon as they are confirmed.`,
  };
}
