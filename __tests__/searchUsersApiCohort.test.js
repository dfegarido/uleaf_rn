/**
 * Both /search-user calls must carry the cohort hint.
 *
 * Bug this locks down: the sheet calls /search-user twice — once for the
 * Recommended people (passed `role`) and once to filter chat contacts to the
 * caller's cohort (passed only `uids`). Without the hint the second call falls
 * back to server precedence (admin > supplier > buyer), so an account holding
 * both a buyer and a supplier row got SUPPLIERS from call 2 while call 1
 * returned BUYERS. Both merge into one strip, which is how sellers appeared in
 * a buyer's recommended list.
 *
 * Verified against production: same account, uids-only -> 3 suppliers,
 * uids+role=buyer -> 3 buyers.
 */
import {searchUsersApi} from '../src/components/Api/searchUsersApi';

jest.mock('../src/utils/getStoredAuthToken', () => ({
  getStoredAuthToken: jest.fn(async () => 'test-token'),
}));

const okResponse = (results = []) => ({
  ok: true,
  json: async () => ({success: true, results}),
});

describe('searchUsersApi cohort hint', () => {
  let fetchMock;

  beforeEach(() => {
    fetchMock = jest.fn(async () => okResponse([]));
    global.fetch = fetchMock;
  });

  const calledUrl = () => String(fetchMock.mock.calls[0][0]);

  it('sends role when filtering a known uid set (the chat-contact call)', async () => {
    await searchUsersApi({uids: ['a', 'b'], limit: 200, role: 'buyer'});
    const url = calledUrl();
    expect(url).toContain('role=buyer');
    expect(url).toContain('uids=a%2Cb');
  });

  it('a uids-only call omits role — documenting why the hint is required', async () => {
    await searchUsersApi({uids: ['a'], limit: 200});
    expect(calledUrl()).not.toContain('role=');
  });

  it('sends role on the list/Recommended call', async () => {
    await searchUsersApi({query: '', limit: 24, offset: 0, role: 'supplier'});
    expect(calledUrl()).toContain('role=supplier');
  });

  it('omits role when no cohort is known (server falls back to its own rules)', async () => {
    await searchUsersApi({limit: 20});
    expect(calledUrl()).not.toContain('role=');
  });

  it('caps the uid allowlist at 200 entries', async () => {
    const many = Array.from({length: 350}, (_, i) => `u${i}`);
    await searchUsersApi({uids: many, role: 'buyer'});
    const uids = decodeURIComponent(calledUrl().split('uids=')[1]);
    expect(uids.split(',').length).toBe(200);
  });
});
