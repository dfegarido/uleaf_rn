/**
 * shortenShareUrl must never get in the way of sharing: whatever goes wrong
 * (no login, server error, network error, a hung request) the long link is shared.
 */
jest.mock('../src/utils/getStoredAuthToken', () => ({getStoredAuthToken: jest.fn()}));
jest.mock('../src/config/apiConfig', () => ({
  API_ENDPOINTS: {SHORT_LINK: 'https://api.test/short-link'},
}));

const {getStoredAuthToken} = require('../src/utils/getStoredAuthToken');
const {shortenShareUrl} = require('../src/utils/shortenShareUrl');

const LONG = 'https://ileafu.com/live/?session=4b368c2a-29eb-42d5-b127-60726cff1888&seller=abc';
const SHORT = 'https://ileafu.com/l/Lv3xT9qA';
const reply = (body, ok = true) => Promise.resolve({ok, json: () => Promise.resolve(body)});

beforeEach(() => {
  getStoredAuthToken.mockResolvedValue('token');
  global.fetch = jest.fn();
});

it('returns the short link and sends the long one with the login token', async () => {
  global.fetch.mockReturnValue(reply({success: true, shortUrl: SHORT}));
  await expect(shortenShareUrl(LONG)).resolves.toBe(SHORT);
  const [url, init] = global.fetch.mock.calls[0];
  expect(url).toBe('https://api.test/short-link');
  expect(init.method).toBe('POST');
  expect(init.headers.Authorization).toBe('Bearer token');
  expect(JSON.parse(init.body)).toEqual({url: LONG});
});

it('asks only once for the same link', async () => {
  const other = 'https://ileafu.com/plant/?code=ONCE';
  global.fetch.mockReturnValue(reply({success: true, shortUrl: SHORT}));
  await shortenShareUrl(other);
  await shortenShareUrl(other);
  expect(global.fetch).toHaveBeenCalledTimes(1);
});

it('falls back to the long link on a server error', async () => {
  global.fetch.mockReturnValue(reply({success: false, error: 'boom'}, false));
  await expect(shortenShareUrl(LONG + '&a=1')).resolves.toBe(LONG + '&a=1');
});

it('falls back when the network throws', async () => {
  global.fetch.mockRejectedValue(new Error('offline'));
  await expect(shortenShareUrl(LONG + '&a=2')).resolves.toBe(LONG + '&a=2');
});

it('falls back, without calling the server, when not logged in', async () => {
  getStoredAuthToken.mockResolvedValue(null);
  await expect(shortenShareUrl(LONG + '&a=3')).resolves.toBe(LONG + '&a=3');
  expect(global.fetch).not.toHaveBeenCalled();
});

it('ignores a reply that is not an ileafu.com/l/ link', async () => {
  global.fetch.mockReturnValue(reply({success: true, shortUrl: 'https://evil.com/l/x'}));
  await expect(shortenShareUrl(LONG + '&a=4')).resolves.toBe(LONG + '&a=4');
});

it('falls back after 2.5 s when the request never finishes', async () => {
  jest.useFakeTimers();
  global.fetch.mockReturnValue(new Promise(() => {}));
  const pending = shortenShareUrl(LONG + '&a=5');
  await jest.advanceTimersByTimeAsync(2500);
  await expect(pending).resolves.toBe(LONG + '&a=5');
  jest.useRealTimers();
});

it('passes an empty link straight through', async () => {
  await expect(shortenShareUrl('')).resolves.toBe('');
  expect(global.fetch).not.toHaveBeenCalled();
});
