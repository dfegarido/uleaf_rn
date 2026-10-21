/**
 * Tests for the hosted payment page URL.
 *
 * WHY THIS EXISTS
 * ---------------
 * The page talks to the Supabase payment endpoint, which verifies the buyer's Firebase token -
 * so the token has to travel with the URL. Without it the endpoint answers 401 and the buyer
 * cannot pay.
 *
 * The token must also be URL-encoded: a JWT contains dots, dashes and underscores, and the
 * '&' or '=' characters would break the query string if they were not escaped.
 */
import {it, expect, describe, jest, beforeEach} from '@jest/globals';

// The module imports react-native and the browser package, so both are mocked.
jest.mock('@swan-io/react-native-browser', () => ({
  openBrowser: jest.fn(async () => {}),
  closeBrowser: jest.fn(),
}));
jest.mock('../firebase', () => ({auth: {currentUser: null}}));
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(async () => null),
  setItem: jest.fn(async () => {}),
}));

const {getPaymentPageUrl} = require('../src/utils/openPaymentSheet');

describe('getPaymentPageUrl', () => {
  it('carries the amount and the order id', () => {
    const url = getPaymentPageUrl('TXN123', 40);
    expect(url).toContain('amount=40');
    expect(url).toContain('ileafuOrderId=TXN123');
  });

  it('carries the auth token when there is one', () => {
    const url = getPaymentPageUrl('TXN123', 40, 'header.payload.signature');
    expect(url).toContain('token=header.payload.signature');
  });

  it('omits the token when there is none', () => {
    const url = getPaymentPageUrl('TXN123', 40);
    expect(url).not.toContain('token=');
  });

  it('url-encodes the token so it cannot break the query string', () => {
    // A token with characters that would otherwise be interpreted as query separators.
    const url = getPaymentPageUrl('TXN123', 40, 'a&b=c d');
    const query = url.split('?')[1];
    const params = new URLSearchParams(query);
    expect(params.get('token')).toBe('a&b=c d');
    expect(params.get('ileafuOrderId')).toBe('TXN123');
    expect(params.get('amount')).toBe('40');
  });

  it('keeps the order id readable when it contains a slash', () => {
    const url = getPaymentPageUrl('TXN/123', 1);
    const params = new URLSearchParams(url.split('?')[1]);
    expect(params.get('ileafuOrderId')).toBe('TXN/123');
  });
});
