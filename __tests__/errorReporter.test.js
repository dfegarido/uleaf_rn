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
  await expect(reportClientError({location: 'a', userMessage: 'u', errorCode: 'NETWORK', context: {status: 1}})).resolves.toBeUndefined();
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

it('fetch rejects → no throw, promise resolves', async () => {
  global.fetch.mockRejectedValue(new Error('down'));
  let p;
  expect(() => (p = reportClientError({location: 'a'}))).not.toThrow();
  await expect(p).resolves.toBeUndefined();
  getStoredAuthToken.mockRejectedValue(new Error('no token'));
  expect(() => (p = reportClientError({location: 'a'}))).not.toThrow();
  await expect(p).resolves.toBeUndefined();
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

const installWith = prev => {
  let installed;
  global.ErrorUtils = {getGlobalHandler: () => prev, setGlobalHandler: h => (installed = h)};
  installGlobalErrorHandler();
  return installed;
};

it('fatal: waits for the report to finish before calling previous', async () => {
  let finishFetch;
  global.fetch = jest.fn(() => new Promise(r => (finishFetch = () => r({ok: true}))));
  const prev = jest.fn();
  const handler = installWith(prev);
  const err = new Error('boom');
  handler(err, true);
  await flush();
  expect(global.fetch).toHaveBeenCalledTimes(1);
  expect(prev).not.toHaveBeenCalled();
  finishFetch();
  await flush();
  expect(prev).toHaveBeenCalledTimes(1);
  expect(prev).toHaveBeenCalledWith(err, true);
});

it('fatal: a hanging report still calls previous once after 1.5 s', async () => {
  jest.useFakeTimers();
  try {
    global.fetch = jest.fn(() => new Promise(() => {}));
    const prev = jest.fn();
    const handler = installWith(prev);
    const err = new Error('hang');
    handler(err, true);
    await jest.advanceTimersByTimeAsync(1499);
    expect(prev).not.toHaveBeenCalled();
    await jest.advanceTimersByTimeAsync(1);
    expect(prev).toHaveBeenCalledTimes(1);
    expect(prev).toHaveBeenCalledWith(err, true);
    await jest.advanceTimersByTimeAsync(5000);
    expect(prev).toHaveBeenCalledTimes(1);
  } finally {
    jest.useRealTimers();
  }
});

it('fatal: a throwing token read still calls previous once', async () => {
  getStoredAuthToken.mockImplementation(() => {
    throw new Error('keychain');
  });
  const prev = jest.fn();
  const err = new Error('boom');
  installWith(prev)(err, true);
  await flush();
  expect(prev).toHaveBeenCalledTimes(1);
  expect(prev).toHaveBeenCalledWith(err, true);
});

it('non-fatal: calls previous synchronously', () => {
  global.fetch = jest.fn(() => new Promise(() => {}));
  const prev = jest.fn();
  const err = new Error('soft');
  installWith(prev)(err, false);
  expect(prev).toHaveBeenCalledTimes(1);
  expect(prev).toHaveBeenCalledWith(err, false);
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
