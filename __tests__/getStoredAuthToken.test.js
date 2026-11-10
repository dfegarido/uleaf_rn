/**
 * getStoredAuthToken on a cold start: Firebase restores auth.currentUser
 * asynchronously, so an expired stored token must wait for that instead of
 * returning null (which went out as "Bearer null" -> 500 "Invalid JWT format").
 */
import AsyncStorage from '@react-native-async-storage/async-storage';

jest.mock('../firebase', () => ({
  auth: {currentUser: null, authStateReady: jest.fn()},
}));

const {auth} = require('../firebase');
const {getStoredAuthToken} = require('../src/utils/getStoredAuthToken');

const b64 = obj => Buffer.from(JSON.stringify(obj)).toString('base64url');
const jwt = exp => `${b64({alg: 'RS256', typ: 'JWT'})}.${b64({exp})}.sig`;
const nowSec = () => Math.floor(Date.now() / 1000);

const VALID = jwt(nowSec() + 3600);
const EXPIRED = jwt(nowSec() - 60);
const FRESH = jwt(nowSec() + 3600) + 'fresh';
const userWithToken = () => ({getIdToken: jest.fn().mockResolvedValue(FRESH)});

beforeEach(async () => {
  await AsyncStorage.clear();
  auth.currentUser = null;
  auth.authStateReady.mockReset();
  jest.useRealTimers();
});

it('returns null when nothing is stored', async () => {
  expect(await getStoredAuthToken()).toBeNull();
});

it('returns a still-valid stored token without touching Firebase', async () => {
  await AsyncStorage.setItem('authToken', VALID);
  expect(await getStoredAuthToken()).toBe(VALID);
  expect(auth.authStateReady).not.toHaveBeenCalled();
});

it('refreshes an expired token when the user is already restored', async () => {
  auth.currentUser = userWithToken();
  await AsyncStorage.setItem('authToken', EXPIRED);
  expect(await getStoredAuthToken()).toBe(FRESH);
  expect(await AsyncStorage.getItem('authToken')).toBe(FRESH);
  expect(auth.authStateReady).not.toHaveBeenCalled();
});

it('cold start: waits for Firebase to restore the user, then refreshes (the bug)', async () => {
  const user = userWithToken();
  auth.authStateReady.mockImplementation(
    () => new Promise(resolve => setTimeout(() => { auth.currentUser = user; resolve(); }, 50)),
  );
  await AsyncStorage.setItem('authToken', EXPIRED);
  expect(await getStoredAuthToken()).toBe(FRESH);
  expect(user.getIdToken).toHaveBeenCalledTimes(1);
  expect(await AsyncStorage.getItem('authToken')).toBe(FRESH);
});

it('returns null when Firebase restores no user (signed out)', async () => {
  auth.authStateReady.mockResolvedValue();
  await AsyncStorage.setItem('authToken', EXPIRED);
  expect(await getStoredAuthToken()).toBeNull();
});

it('gives up after the timeout if Firebase never settles', async () => {
  jest.useFakeTimers();
  auth.authStateReady.mockReturnValue(new Promise(() => {}));
  await AsyncStorage.setItem('authToken', EXPIRED);
  const pending = getStoredAuthToken();
  await jest.advanceTimersByTimeAsync(5000);
  expect(await pending).toBeNull();
});
