import {Platform} from 'react-native';
import {API_ENDPOINTS} from '../config/apiConfig';
import {getStoredAuthToken} from './getStoredAuthToken';
import {version as appVersion} from '../../package.json';

const MAX_DETAIL = 4000;

/**
 * Fire-and-forget: report a client error to the backend `error_log`.
 * Returns synchronously, never throws, silently does nothing without a stored token.
 */
export const reportClientError = ({location, userMessage, detail, errorCode, context} = {}) => {
  try {
    (async () => {
      const token = await getStoredAuthToken();
      if (!token) return;
      await fetch(API_ENDPOINTS.LOG_CLIENT_ERROR, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
        body: JSON.stringify({
          location,
          userMessage,
          detail: typeof detail === 'string' ? detail.slice(0, MAX_DETAIL) : detail,
          errorCode,
          context: {...context, platform: Platform.OS, appVersion},
        }),
      });
    })().catch(() => {});
  } catch (e) {
    // never let reporting break the app
  }
};

export const installGlobalErrorHandler = () => {
  const previous = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    try {
      reportClientError({
        location: 'global',
        userMessage: error?.message,
        detail: error?.stack || String(error),
        errorCode: isFatal ? 'JS_FATAL' : 'JS_ERROR',
      });
    } catch (e) {
      // ignore
    }
    previous(error, isFatal);
  });
};
