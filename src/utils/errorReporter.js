import {Platform} from 'react-native';
import {API_ENDPOINTS} from '../config/apiConfig';
import {getStoredAuthToken} from './getStoredAuthToken';
import {version as appVersion} from '../../package.json';

const MAX_DETAIL = 4000;
/** How long a fatal crash waits for its report before the app is allowed to die. */
const FATAL_REPORT_WAIT_MS = 1500;

/**
 * Fire-and-forget: report a client error to the backend `error_log`.
 * Never throws; the returned promise never rejects and need not be awaited.
 * Silently does nothing without a stored token.
 */
export const reportClientError = ({location, userMessage, detail, errorCode, context} = {}) => {
  try {
    return (async () => {
      const token = await getStoredAuthToken();
      if (!token) return;
      await fetch(API_ENDPOINTS.LOG_CLIENT_ERROR, {
        method: 'POST',
        headers: {'Content-Type': 'application/json', Authorization: `Bearer ${token}`},
        body: JSON.stringify({
          location,
          userMessage,
          detail: detail == null ? detail : String(detail).slice(0, MAX_DETAIL),
          errorCode,
          context: {...context, platform: Platform.OS, appVersion},
        }),
      });
    })().catch(() => {});
  } catch (e) {
    // never let reporting break the app
    return Promise.resolve();
  }
};

export const installGlobalErrorHandler = () => {
  if (!global.ErrorUtils) return;
  const previous = global.ErrorUtils.getGlobalHandler();
  global.ErrorUtils.setGlobalHandler((error, isFatal) => {
    let report;
    try {
      report = reportClientError({
        location: 'global',
        userMessage: error?.message,
        detail: error?.stack || String(error),
        errorCode: isFatal ? 'JS_FATAL' : 'JS_ERROR',
      });
    } catch (e) {
      // ignore
    }
    if (!isFatal) {
      previous(error, isFatal);
      return;
    }
    // A fatal error kills the process inside previous(), before the report's request leaves.
    // Give it a bounded head start; previous still runs exactly once, whatever the report does.
    let timer;
    const timeout = new Promise(resolve => {
      timer = setTimeout(resolve, FATAL_REPORT_WAIT_MS);
    });
    Promise.race([report, timeout])
      .catch(() => {})
      .then(() => {
        clearTimeout(timer);
        previous(error, isFatal);
      });
  });
};
