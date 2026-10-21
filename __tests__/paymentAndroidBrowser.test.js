/**
 * Android opens the hosted payment page in the browser app, not the in-app Custom Tab.
 *
 * WHY THIS EXISTS
 * ---------------
 * The Custom Tab keeps every link inside itself, so Venmo's app link never reached the installed
 * Venmo app and the buyer was asked to log in to Venmo on the web. The browser app hands the link
 * to Venmo. The callers rely on `onClose` to release the "payment in progress" flag, so it must
 * still fire - once the buyer comes back to the app.
 */
import {it, expect, jest} from '@jest/globals';

const appStateListeners = [];
jest.mock('react-native', () => ({
  Platform: {OS: 'android'},
  Alert: {alert: jest.fn()},
  Linking: {openURL: jest.fn(async () => {})},
  AppState: {
    addEventListener: jest.fn((event, listener) => {
      appStateListeners.push(listener);
      return {remove: jest.fn()};
    }),
  },
}));
jest.mock('@swan-io/react-native-browser', () => ({
  openBrowser: jest.fn(async () => {}),
  closeBrowser: jest.fn(),
}));
jest.mock('../src/utils/getStoredAuthToken', () => ({getStoredAuthToken: async () => 'tok'}));
jest.mock('../config', () => ({paymentPaypalVenmoUrl: 'https://pay.example/'}));

const {Linking} = require('react-native');
const {openBrowser} = require('@swan-io/react-native-browser');
const {openPaymentSheet} = require('../src/utils/openPaymentSheet');

it('opens the page in the browser app and calls onClose when the buyer returns', async () => {
  const onClose = jest.fn();
  await openPaymentSheet('TXN1', 270, {onClose});

  expect(openBrowser).not.toHaveBeenCalled();
  expect(Linking.openURL).toHaveBeenCalledWith('https://pay.example/?amount=270&ileafuOrderId=TXN1&token=tok');

  const onChange = appStateListeners[0];
  onChange('active'); // still in the app - the browser has not opened yet
  expect(onClose).not.toHaveBeenCalled();
  onChange('background'); // the browser (and Venmo) took over
  onChange('active'); // back in iLeafU
  expect(onClose).toHaveBeenCalledTimes(1);
});
