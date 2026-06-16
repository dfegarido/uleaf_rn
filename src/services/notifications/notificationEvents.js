// Tiny in-process pub-sub. Used so the background message handler (registered in
// index.js before React mounts) can hand off a tap to the NotificationService
// once the service has been initialized.
const listeners = new Map(); // eventName -> Set<fn>

export function on(event, fn) {
  if (!listeners.has(event)) listeners.set(event, new Set());
  listeners.get(event).add(fn);
  return () => off(event, fn);
}

export function off(event, fn) {
  const set = listeners.get(event);
  if (set) set.delete(fn);
}

export function emit(event, payload) {
  const set = listeners.get(event);
  if (!set) return;
  for (const fn of set) {
    try {
      fn(payload);
    } catch (e) {
      // Never let a listener throw into the emitter.
      // eslint-disable-next-line no-console
      console.warn('[notificationEvents] listener threw', e);
    }
  }
}
