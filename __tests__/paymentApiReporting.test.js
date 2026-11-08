jest.mock('../src/utils/errorReporter', () => ({reportClientError: jest.fn()}));
jest.mock('../src/utils/getStoredAuthToken', () => ({getStoredAuthToken: jest.fn(() => Promise.resolve('t'))}));
jest.mock('../src/config/apiConfig', () => ({API_ENDPOINTS: {PAYMENT_COMPLETION: 'https://x.test/pc'}}));

import {reportClientError} from '../src/utils/errorReporter';
import {
  createPaymentIntentApi,
  capturePaymentApi,
  createAndCapturePaypalOrder,
} from '../src/components/Api/paymentApi';

beforeEach(() => {
  reportClientError.mockClear();
  jest.spyOn(console, 'error').mockImplementation(() => {});
});

describe.each([
  ['createPaymentIntentApi', createPaymentIntentApi],
  ['capturePaymentApi', capturePaymentApi],
  ['createAndCapturePaypalOrder', createAndCapturePaypalOrder],
])('%s', (name, fn) => {
  it('does not report a non-OK HTTP response', async () => {
    global.fetch = jest.fn(() =>
      Promise.resolve({ok: false, status: 500, json: () => Promise.resolve({message: 'bad'})}),
    );
    const res = await fn({});
    expect(res.success).toBe(false);
    expect(reportClientError).not.toHaveBeenCalled();
  });

  it('reports a rejected fetch as NETWORK and keeps the return value', async () => {
    global.fetch = jest.fn(() => Promise.reject(new Error('offline')));
    const res = await fn({});
    expect(res).toMatchObject({success: false, error: 'offline'});
    expect(reportClientError).toHaveBeenCalledWith(
      expect.objectContaining({location: `paymentApi.${name}`, errorCode: 'NETWORK', detail: 'offline'}),
    );
  });
});
