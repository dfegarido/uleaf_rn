/**
 * Tests for the payment-in-progress tracking.
 *
 * WHY THIS EXISTS
 * ---------------
 * The payment completes in the browser, so when the app comes back the outcome is unknown until
 * the backend confirms the order and pushes a notification. In that window the buyer must not be
 * able to start a second payment for the same order - a second payment is how a buyer ends up
 * charged twice.
 *
 * The screen keeps the state in a Set, so these tests pin the rules that keep it correct.
 */
import {it, expect, describe} from '@jest/globals';

const {
  createPaymentProgressState,
  markPaymentInProgress,
  clearPaymentInProgress,
  isPaymentInProgress,
  paymentProgressBannerText,
  loadPaymentProgress,
  savePaymentProgress,
} = require('../src/utils/paymentProgress');

// The jest mock exposes the API directly (no default export).
const AsyncStorage = require('@react-native-async-storage/async-storage');

describe('payment progress', () => {
  it('starts with nothing awaiting confirmation', () => {
    const state = createPaymentProgressState();
    expect(state.size).toBe(0);
    expect(isPaymentInProgress(state, 'TXN1')).toBe(false);
  });

  it('marks a transaction as awaiting confirmation', () => {
    const state = markPaymentInProgress(createPaymentProgressState(), 'TXN1');
    expect(isPaymentInProgress(state, 'TXN1')).toBe(true);
  });

  it('does not create a new state object when nothing changed', () => {
    const state = markPaymentInProgress(createPaymentProgressState(), 'TXN1');
    // React bails out of a re-render when the state identity is unchanged.
    expect(markPaymentInProgress(state, 'TXN1')).toBe(state);
  });

  it('clears the flag once the payment is confirmed', () => {
    let state = markPaymentInProgress(createPaymentProgressState(), 'TXN1');
    state = clearPaymentInProgress(state, 'TXN1');
    expect(isPaymentInProgress(state, 'TXN1')).toBe(false);
  });

  it('keeps the other transactions waiting when one is confirmed', () => {
    let state = markPaymentInProgress(createPaymentProgressState(), 'TXN1');
    state = markPaymentInProgress(state, 'TXN2');
    state = clearPaymentInProgress(state, 'TXN1');
    expect(isPaymentInProgress(state, 'TXN1')).toBe(false);
    expect(isPaymentInProgress(state, 'TXN2')).toBe(true);
  });

  it('ignores an empty transaction number', () => {
    const state = createPaymentProgressState();
    expect(markPaymentInProgress(state, '')).toBe(state);
    expect(markPaymentInProgress(state, undefined)).toBe(state);
    expect(clearPaymentInProgress(state, '')).toBe(state);
  });

  it('has no banner when nothing is waiting', () => {
    const {title, body} = paymentProgressBannerText(0);
    expect(title).toBe('');
    expect(body).toBe('');
  });

  it('has a singular banner for one waiting payment', () => {
    const {title, body} = paymentProgressBannerText(1);
    expect(title).toBe('Payment in progress');
    expect(body).toContain('your payment');
    expect(body).toContain('notification');
  });

  it('has a plural banner for several waiting payments', () => {
    const {title, body} = paymentProgressBannerText(3);
    expect(title).toBe('Payments in progress');
    expect(body).toContain('3 payments');
  });

  it('survives a screen change: the waiting payments are persisted', async () => {
    await AsyncStorage.clear();
    const state = markPaymentInProgress(createPaymentProgressState(), 'TXN1');
    await savePaymentProgress(state);

    const restored = await loadPaymentProgress();
    expect(isPaymentInProgress(restored, 'TXN1')).toBe(true);
  });

  it('restores nothing when nothing was stored', async () => {
    await AsyncStorage.clear();
    const restored = await loadPaymentProgress();
    expect(restored.size).toBe(0);
  });

  it('ignores a corrupt stored value', async () => {
    await AsyncStorage.clear();
    await AsyncStorage.setItem('paymentInProgress', 'not json');
    const restored = await loadPaymentProgress();
    expect(restored.size).toBe(0);
  });
});
