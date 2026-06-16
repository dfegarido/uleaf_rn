import messaging from '@react-native-firebase/messaging';
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

describe('NotificationService', () => {
  beforeEach(() => {
    AsyncStorage.getItem.mockReset().mockResolvedValue(null);
    AsyncStorage.setItem.mockReset().mockResolvedValue();
    AsyncStorage.removeItem.mockReset().mockResolvedValue();
    navigationRef.isReady.mockClear().mockReturnValue(true);
    navigationRef.navigate.mockClear();
    messaging.__reset();
    NotificationService._reset();
  });

  it('init() wires onMessage, onTokenRefresh, onNotificationOpenedApp', async () => {
    NotificationService.init(navigationRef);
    expect(messaging().onMessage).toHaveBeenCalledTimes(1);
    expect(messaging().onTokenRefresh).toHaveBeenCalledTimes(1);
    expect(messaging().onNotificationOpenedApp).toHaveBeenCalledTimes(1);
  });

  it('requestPermissionAndRegister() does nothing if denied flag is set', async () => {
    AsyncStorage.getItem.mockResolvedValue('true');
    await NotificationService.init(navigationRef);
    await NotificationService.requestPermissionAndRegister('buyerUid');
    expect(messaging().getToken).not.toHaveBeenCalled();
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
    expect(messaging().requestPermission).not.toHaveBeenCalled();
    expect(writeToken).not.toHaveBeenCalled();
  });

  it('registerWithoutPrompting() writes token without firing the OS prompt', async () => {
    messaging.__setToken('tok-silent');
    const writeToken = jest.fn().mockResolvedValue();
    await NotificationService.init(navigationRef);
    const result = await NotificationService.registerWithoutPrompting('buyerUid', { writeToken });
    expect(messaging().requestPermission).not.toHaveBeenCalled();
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
    expect(messaging().getToken).not.toHaveBeenCalled();
    expect(writeToken).not.toHaveBeenCalled();
  });

  it('registerWithoutPrompting() returns error status if getToken throws', async () => {
    const origGetToken = messaging.getToken;
    messaging.getToken = jest.fn().mockRejectedValue(new Error('network'));
    await NotificationService.init(navigationRef);
    const result = await NotificationService.registerWithoutPrompting('buyerUid');
    expect(result).toEqual({ status: 'error' });
    messaging.getToken = origGetToken;
  });

  it('removeToken() calls the injected removeToken with the current FCM token', async () => {
    messaging.__setToken('tok-cleanup');
    const removeToken = jest.fn().mockResolvedValue();
    await NotificationService.init(navigationRef);
    await NotificationService.removeToken('buyerUid', removeToken);
    expect(removeToken).toHaveBeenCalledWith('buyerUid', 'tok-cleanup');
  });

  it('removeToken() is a no-op when no uid or removeTokenFn is given', async () => {
    await NotificationService.init(navigationRef);
    await NotificationService.removeToken(null, null);
    expect(messaging().getToken).not.toHaveBeenCalled();
  });

  it('requestPermissionAndRegister() writes token to firestore on grant', async () => {
    messaging.__setToken('tok-1');
    messaging.__setPermission(1);
    const writeToken = jest.fn().mockResolvedValue();
    await NotificationService.init(navigationRef);
    await NotificationService.requestPermissionAndRegister('buyerUid', { writeToken });
    expect(writeToken).toHaveBeenCalledWith('buyerUid', 'tok-1');
  });

  it('on permission denied, sets denied flag and skips getToken', async () => {
    messaging.__setPermission(0);
    const writeToken = jest.fn();
    await NotificationService.init(navigationRef);
    await NotificationService.requestPermissionAndRegister('buyerUid', { writeToken });
    expect(AsyncStorage.setItem).toHaveBeenCalledWith('notifications.denied', 'true');
    expect(writeToken).not.toHaveBeenCalled();
  });

  it('on token refresh, calls writeToken with new token', async () => {
    messaging.__setPermission(1);
    const writeToken = jest.fn().mockResolvedValue();
    await NotificationService.init(navigationRef, { writeToken });
    messaging.__triggerTokenRefresh('tok-rotated');
    await flush();
    expect(writeToken).toHaveBeenCalledWith(undefined, 'tok-rotated');
  });

  it('on foreground message of type live_started, navigates to live screen', async () => {
    await NotificationService.init(navigationRef);
    messaging.__triggerMessage({
      data: { type: 'live_started', sessionId: 'sess1', broadcasterId: 'seller1' },
    });
    expect(navigationRef.navigate).toHaveBeenCalledWith('BuyerLiveStreamScreen', {
      sessionId: 'sess1',
      broadcasterId: 'seller1',
    });
  });

  it('on tap from killed app (initial notification), navigates', async () => {
    messaging.getInitialNotification = jest.fn().mockResolvedValue({
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
    messaging.__triggerMessage({
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
    expect(messaging().onMessage).toHaveBeenCalledTimes(2);
  });
});
