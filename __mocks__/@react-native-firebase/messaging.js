// Manual mock for @react-native-firebase/messaging used by jest tests.
// Mirrors the modular (Web SDK-style) API that NotificationService now uses.

const listeners = { message: [], tokenRefresh: [], opened: [] };

let currentToken = 'mock-token-initial';
let permissionStatus = 0; // 0 = NOT_DETERMINED, 1 = AUTHORIZED, 2 = PROVISIONAL
let isRegistered = true;
let tokenErrors = []; // queue of errors to throw on successive getToken() calls
let tokenCallIndex = 0;

const messagingInstance = {};

const getMessaging = jest.fn(() => messagingInstance);

const getToken = jest.fn(async () => {
  const queued = tokenErrors[tokenCallIndex];
  tokenCallIndex += 1;
  if (queued) throw queued;
  return currentToken;
});

const requestPermission = jest.fn(async () => permissionStatus);

const hasPermission = jest.fn(async () => permissionStatus === 1 || permissionStatus === 2);

const onMessage = jest.fn((messaging, cb) => {
  listeners.message.push(cb);
  return () => {
    listeners.message = listeners.message.filter((c) => c !== cb);
  };
});

const onTokenRefresh = jest.fn((messaging, cb) => {
  listeners.tokenRefresh.push(cb);
  return () => {
    listeners.tokenRefresh = listeners.tokenRefresh.filter((c) => c !== cb);
  };
});

const onNotificationOpenedApp = jest.fn((messaging, cb) => {
  listeners.opened.push(cb);
  return () => {
    listeners.opened = listeners.opened.filter((c) => c !== cb);
  };
});

const getInitialNotification = jest.fn(async () => null);

const setBackgroundMessageHandler = jest.fn();

const registerDeviceForRemoteMessages = jest.fn(async () => {});

const isDeviceRegisteredForRemoteMessages = jest.fn(() => isRegistered);

// Test helpers — NOT part of the real module. Import these from inside tests.
const __setToken = (t) => {
  currentToken = t;
};

const __setPermission = (s) => {
  permissionStatus = s;
};

const __setRegistered = (r) => {
  isRegistered = r;
};

const __setTokenErrors = (errors) => {
  tokenErrors = errors;
  tokenCallIndex = 0;
};

const __triggerTokenRefresh = (t) => {
  currentToken = t;
  listeners.tokenRefresh.forEach((cb) => cb(t));
};

const __triggerMessage = (msg) => {
  listeners.message.forEach((cb) => cb(msg));
};

const __triggerOpened = (msg) => {
  listeners.opened.forEach((cb) => cb(msg));
};

const __reset = () => {
  currentToken = 'mock-token-initial';
  permissionStatus = 0;
  isRegistered = true;
  tokenErrors = [];
  tokenCallIndex = 0;
  listeners.message = [];
  listeners.tokenRefresh = [];
  listeners.opened = [];
  // Clear call counts on shared jest.fn instances so per-test assertions
  // (e.g. `expect(onMessage).toHaveBeenCalledTimes(1)`) see a fresh slate.
  [
    getMessaging,
    getToken,
    requestPermission,
    hasPermission,
    onMessage,
    onTokenRefresh,
    onNotificationOpenedApp,
    getInitialNotification,
    setBackgroundMessageHandler,
    registerDeviceForRemoteMessages,
    isDeviceRegisteredForRemoteMessages,
  ].forEach((fn) => fn.mockClear());
};

module.exports = {
  getMessaging,
  getToken,
  onMessage,
  onTokenRefresh,
  onNotificationOpenedApp,
  getInitialNotification,
  requestPermission,
  hasPermission,
  setBackgroundMessageHandler,
  registerDeviceForRemoteMessages,
  isDeviceRegisteredForRemoteMessages,
  __setToken,
  __setPermission,
  __setRegistered,
  __setTokenErrors,
  __triggerTokenRefresh,
  __triggerMessage,
  __triggerOpened,
  __reset,
};
