// Manual mock for @react-native-firebase/messaging used by jest tests.
// Surface mirrors the methods NotificationService calls.

const listeners = { message: [], tokenRefresh: [], opened: [] };

let currentToken = 'mock-token-initial';
let permissionStatus = 0; // 0 = NOT_DETERMINED, 1 = AUTHORIZED, 2 = PROVISIONAL

// Cache the API object so tests can track call counts on the same jest.fn instances
// (e.g., `expect(messaging().onMessage).toHaveBeenCalledTimes(1)`).
const messagingApi = {
  requestPermission: jest.fn(async () => permissionStatus),
  getToken: jest.fn(async () => currentToken),
  onMessage: jest.fn((cb) => {
    listeners.message.push(cb);
    return () => {
      listeners.message = listeners.message.filter((c) => c !== cb);
    };
  }),
  onTokenRefresh: jest.fn((cb) => {
    listeners.tokenRefresh.push(cb);
    return () => {
      listeners.tokenRefresh = listeners.tokenRefresh.filter((c) => c !== cb);
    };
  }),
  onNotificationOpenedApp: jest.fn((cb) => {
    listeners.opened.push(cb);
    return () => {
      listeners.opened = listeners.opened.filter((c) => c !== cb);
    };
  }),
  getInitialNotification: jest.fn(async () => null),
  setBackgroundMessageHandler: jest.fn(),
  hasPermission: jest.fn(async () => permissionStatus === 1 || permissionStatus === 2),
};

const messaging = () => messagingApi;

// Test helpers — NOT part of the real module. Import these from inside tests.
messaging.__setToken = (t) => {
  currentToken = t;
};
messaging.__setPermission = (s) => {
  permissionStatus = s;
};
messaging.__triggerTokenRefresh = (t) => {
  currentToken = t;
  listeners.tokenRefresh.forEach((cb) => cb(t));
};
messaging.__triggerMessage = (msg) => {
  listeners.message.forEach((cb) => cb(msg));
};
messaging.__triggerOpened = (msg) => {
  listeners.opened.forEach((cb) => cb(msg));
};
// Mirror per-method assignments on `messaging` (the function) onto `messagingApi`,
// so tests can replace methods via `messaging.getInitialNotification = jest.fn(...)`
// and have `messaging().getInitialNotification()` see the new mock.
const proxiedMethods = [
  'requestPermission',
  'getToken',
  'onMessage',
  'onTokenRefresh',
  'onNotificationOpenedApp',
  'getInitialNotification',
  'setBackgroundMessageHandler',
  'hasPermission',
];
proxiedMethods.forEach((name) => {
  Object.defineProperty(messaging, name, {
    configurable: true,
    enumerable: true,
    get() {
      return messagingApi[name];
    },
    set(fn) {
      messagingApi[name] = fn;
    },
  });
});

messaging.__reset = () => {
  currentToken = 'mock-token-initial';
  permissionStatus = 0;
  listeners.message = [];
  listeners.tokenRefresh = [];
  listeners.opened = [];
  // Clear call counts on shared jest.fn instances so per-test assertions
  // (e.g. `expect(messaging().onMessage).toHaveBeenCalledTimes(1)`) see a
  // fresh slate in beforeEach.
  Object.values(messagingApi).forEach((fn) => {
    if (typeof fn === 'function' && fn.mockClear) fn.mockClear();
  });
};

module.exports = messaging;
module.default = messaging;
