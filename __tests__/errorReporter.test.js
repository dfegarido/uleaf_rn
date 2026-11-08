jest.mock('../src/utils/getStoredAuthToken', () => ({getStoredAuthToken: jest.fn()}));
jest.mock('../src/config/apiConfig', () => ({API_ENDPOINTS: {LOG_CLIENT_ERROR: 'https://x.test/log-client-error'}}));
jest.mock('react-native', () => ({Platform: {OS: 'ios'}}));

import {getStoredAuthToken} from '../src/utils/getStoredAuthToken';
import {reportClientError, installGlobalErrorHandler} from '../src/utils/errorReporter';

const flush = () => new Promise(r => setImmediate(r));

beforeEach(() => {
  global.fetch = jest.fn(() => Promise.resolve({ok: true}));
  getStoredAuthToken.mockResolvedValue('tok');
});

it('posts to LOG_CLIENT_ERROR with bearer token', async () => {
  expect(reportClientError({location: 'a', userMessage: 'u', errorCode: 'NETWORK', context: {status: 1}})).toBeUndefined();
  await flush();
  const [url, opts] = global.fetch.mock.calls[0];
  expect(url).toBe('https://x.test/log-client-error');
  expect(opts.headers.Authorization).toBe('Bearer tok');
  const body = JSON.parse(opts.body);
  expect(body).toMatchObject({location: 'a', userMessage: 'u', errorCode: 'NETWORK'});
  expect(body.context).toMatchObject({status: 1, platform: 'ios', appVersion: expect.any(String)});
});

it('no token → no fetch', async () => {
  getStoredAuthToken.mockResolvedValue(null);
  reportClientError({location: 'a'});
  await flush();
  expect(global.fetch).not.toHaveBeenCalled();
});

it('fetch rejects → no throw', async () => {
  global.fetch.mockRejectedValue(new Error('down'));
  expect(() => reportClientError({location: 'a'})).not.toThrow();
  getStoredAuthToken.mockRejectedValue(new Error('no token'));
  expect(() => reportClientError({location: 'a'})).not.toThrow();
  await flush();
});

it('global handler reports then calls the previous handler with the same args', async () => {
  const prev = jest.fn();
  let installed;
  global.ErrorUtils = {getGlobalHandler: () => prev, setGlobalHandler: h => (installed = h)};
  installGlobalErrorHandler();
  const err = new Error('boom');
  installed(err, true);
  await flush();
  expect(prev).toHaveBeenCalledWith(err, true);
  const body = JSON.parse(global.fetch.mock.calls[0][1].body);
  expect(body).toMatchObject({location: 'global', errorCode: 'JS_FATAL'});
});

it('detail is truncated to 4000 chars', async () => {
  reportClientError({location: 'a', detail: 'x'.repeat(5000)});
  await flush();
  expect(JSON.parse(global.fetch.mock.calls[0][1].body).detail).toHaveLength(4000);
});

it('installGlobalErrorHandler is a no-op without ErrorUtils', () => {
  delete global.ErrorUtils;
  expect(() => installGlobalErrorHandler()).not.toThrow();
});

it('non-string detail is capped at 4000 too', async () => {
  reportClientError({location: 'a', detail: {toString: () => 'y'.repeat(5000)}});
  await flush();
  expect(JSON.parse(global.fetch.mock.calls[0][1].body).detail).toHaveLength(4000);
});
