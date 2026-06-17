import {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  onNotificationOpenedApp,
  getInitialNotification,
  requestPermission,
  registerDeviceForRemoteMessages,
  __setToken,
  __setPermission,
  __setRegistered,
  __setTokenErrors,
  __triggerTokenRefresh,
  __triggerMessage,
  __reset,
} from '@react-native-firebase/messaging';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { navigationRef } from '../../../navigation/navigationRef';
import NotificationService from '../NotificationService';

// Mocks
jest.mock('@react-native-async-storage/async-storage', () => ({
  getItem: jest.fn(),
  setItem: jest.fn(),
  removeItem: jest.fn(),
}));
jest.mock('../../../navigation/navigationRef', () => ({
  navigationRef: { isReady: jest.fn(() => true), navigate: jest.fn() },
}));

const flush = () => new Promise((r) => setImmediate(r));

const apnsError = Object.assign(
  new Error('[messaging/unknown] The operation could not be completed. No APNS token specified before fetching FCM Token'),
  { code: 'messaging/unknown' },
);

describe('NotificationService', () => {
  beforeEach(() => {
    AsyncStorage.getItem.mockReset().mockResolvedValue(null);
    AsyncStorage.setItem.mockReset().mockResolvedValue();
    AsyncStorage.removeItem.mockReset().mockResolvedValue();
    navigationRef.isReady.mockClear().mockReturnValue(true);
    navigationRef.navigate.mockClear();
    __reset();
    NotificationService._reset();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it('init() wires onMessage, onTokenRefresh, onNotificationOpenedApp', async () => {
    NotificationService.init(navigationRef);
    expect(onMessage).toHaveBeenCalledTimes(1);
    expect(onTokenRefresh).toHaveBeenCalledTimes(1);
    expect(onNotificationOpenedApp).toHaveBeenCalledTimes(1);
  });

  it('requestPermissionAndRegister() does nothing if denied flag is set', async () => {
    AsyncStorage.getItem.mockResolvedValue('true');
    await NotificationService.init(navigationRef);
    await NotificationService.requestPermissionAndRegister('buyerUid');
    expect(getToken).not.toHaveBeenCalled();
  });

  it('requestPermissionAndRegister() does nothing if disabled flag is set', async () => {
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === 'notifications.disabled') return 'true';
      return null;
    });
    const writeToken = jest.fn();
    await NotificationService.init(navigationRef);
    const result = await NotificationService.requestPermissionAndRegister('buyerUid', { writeToken });
    expect(result).toEqual({ status: 'disabled' });
    expect(requestPermission).not.toHaveBeenCalled();
    expect(writeToken).not.toHaveBeenCalled();
  });

  it('registerWithoutPrompting() writes token without firing the OS prompt', async () => {
    __setToken('tok-silent');
    const writeToken = jest.fn().mockResolvedValue();
    await NotificationService.init(navigationRef);
    const result = await NotificationService.registerWithoutPrompting('buyerUid', { writeToken });
    expect(requestPermission).not.toHaveBeenCalled();
    expect(getToken).toHaveBeenCalledWith(getMessaging());
    expect(writeToken).toHaveBeenCalledWith('buyerUid', 'tok-silent');
    expect(result).toEqual({ status: 'registered', token: 'tok-silent' });
  });

  it('registerWithoutPrompting() is a no-op when disabled flag is set', async () => {
    AsyncStorage.getItem.mockImplementation(async (key) => {
      if (key === 'notifications.disabled') return 'true';
      return null;
    });
    const writeToken = jest.fn();
    await NotificationService.init(navigationRef);
    const result = await NotificationService.registerWithoutPrompting('buyerUid', { writeToken });
    expect(result).toEqual({ status: 'disabled' });
    expect(getToken).not.toHaveBeenCalled();
    expect(writeToken).not.toHaveBeenCalled();
  });

  it('registerWithoutPrompting() returns error status if getToken throws a non-APNS error', async () => {
    __setTokenErrors([new Error('network')]);
    await NotificationService.init(navigationRef);
    const result = await NotificationService.registerWithoutPrompting('buyerUid');
    expect(result).toEqual({ status: 'error' });
    expect(getToken).toHaveBeenCalledTimes(1);
  });

  it('registerWithoutPrompting() retries on transient APNS token errors then succeeds', async () => {
    jest.useFakeTimers();
    __setToken('tok-after-apns');
    __setTokenErrors([apnsError, apnsError]);
    const writeToken = jest.fn().mockResolvedValue();

    await NotificationService.init(navigationRef);
    const promise = NotificationService.registerWithoutPrompting('buyerUid', { writeToken });

    // Two retry delays: 400ms and 600ms.
    await jest.advanceTimersByTimeAsync(400);
    await jest.advanceTimersByTimeAsync(600);

    const result = await promise;
    expect(getToken).toHaveBeenCalledTimes(3);
    expect(writeToken).toHaveBeenCalledWith('buyerUid', 'tok-after-apns');
    expect(result).toEqual({ status: 'registered', token: 'tok-after-apns' });
  });

  it('registerWithoutPrompting() gives up after repeated APNS errors', async () => {
    jest.useFakeTimers();
    __setTokenErrors([apnsError, apnsError, apnsError, apnsError, apnsError]);

    await NotificationService.init(navigationRef);
    const promise = NotificationService.registerWithoutPrompting('buyerUid');

    // Advance through all retry delays.
    await jest.advanceTimersByTimeAsync(5000);

    const result = await promise;
    expect(getToken).toHaveBeenCalledTimes(5);
    expect(result).toEqual({ status: 'error' });
  });

  it('registerWithoutPrompting() registers for remote messages on iOS when not already registered', async () => {
    jest.useFakeTimers();
    __setRegistered(false);
    __setToken('tok-after-register');
    const writeToken = jest.fn().mockResolvedValue();
    await NotificationService.init(navigationRef);

    const promise = NotificationService.registerWithoutPrompting('buyerUid', { writeToken });
    await jest.advanceTimersByTimeAsync(400);

    const result = await promise;
    expect(registerDeviceForRemoteMessages).toHaveBeenCalledWith(getMessaging());
    expect(getToken).toHaveBeenCalledWith(getMessaging());
    expect(writeToken).toHaveBeenCalledWith('buyerUid', 'tok-after-register');
    expect(result).toEqual({ status: 'registered', token: 'tok-after-register' });
  });

  it('removeToken() calls the injected removeToken with the current FCM token', async () => {
    __setToken('tok-cleanup');
    const removeToken = jest.fn().mockResolvedValue();
    await NotificationService.init(navigationRef);
    await NotificationService.removeToken('buyerUid', removeToken);
    expect(removeToken).toHaveBeenCalledWith('buyerUid', 'tok-cleanup');
  });

  it('removeToken() is a no-op when no uid or removeTokenFn is given', async () => {
    await NotificationService.init(navigationRef);
    await NotificationService.removeToken(null, null);
    expect(getToken).not.toHaveBeenCalled();
  });

  it('requestPermissionAndRegister() writes token to firestore on grant', async () => {
    __setToken('tok-1');
    __setPermission(1);
    const writeToken = jest.fn().mockResolvedValue();
    await NotificationService.init(navigationRef);
    await NotificationService.requestPermissionAndRegister('buyerUid', { writeToken });
    expect(writeToken).toHaveBeenCalledWith('buyerUid', 'tok-1');
  });

  it('on permission denied, sets denied flag and skips getToken', async () => {
    __setPermission(0);
    const writeToken = jest.fn();
    await NotificationService.init(navigationRef);
    await NotificationService.requestPermissionAndRegister('buyerUid', { writeToken });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('notifications.denied', 'true');
    expect(writeToken).not.toHaveBeenCalled();
  });

  it('on token refresh, calls writeToken with new token', async () => {
    __setPermission(1);
    const writeToken = jest.fn().mockResolvedValue();
    await NotificationService.init(navigationRef, { writeToken });
    __triggerTokenRefresh('tok-rotated');
    await flush();
    expect(writeToken).toHaveBeenCalledWith(undefined, 'tok-rotated');
  });

  it('on foreground message of type live_started, navigates to live screen', async () => {
    await NotificationService.init(navigationRef);
    __triggerMessage({
      data: { type: 'live_started', sessionId: 'sess1', broadcasterId: 'seller1' },
    });
    expect(navigationRef.navigate).toHaveBeenCalledWith('BuyerLiveStreamScreen', {
      sessionId: 'sess1',
      broadcasterId: 'seller1',
    });
  });

  it('on tap from killed app (initial notification), navigates', async () => {
    getInitialNotification.mockResolvedValue({
      data: { type: 'live_started', sessionId: 'sess2', broadcasterId: 'seller2' },
    });
    await NotificationService.init(navigationRef);
    await flush();
    expect(navigationRef.navigate).toHaveBeenCalledWith('BuyerLiveStreamScreen', {
      sessionId: 'sess2',
      broadcasterId: 'seller2',
    });
  });

  it('tap with missing broadcasterId defaults to empty string', async () => {
    await NotificationService.init(navigationRef);
    __triggerMessage({
      data: { type: 'live_started', sessionId: 'sess3' },
    });
    expect(navigationRef.navigate).toHaveBeenCalledWith('BuyerLiveStreamScreen', {
      sessionId: 'sess3',
      broadcasterId: '',
    });
  });

  it('dispose() unsubscribes and clears the user ref', async () => {
    await NotificationService.init(navigationRef);
    NotificationService.dispose();
    // No public unsubscribe count, but we can at least re-init and not get double listeners.
    await NotificationService.init(navigationRef);
    expect(onMessage).toHaveBeenCalledTimes(2);
  });
});
