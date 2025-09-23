// Simple in-memory event bus for cross-screen notifications (no native deps)
const listeners = {};

const on = (event, callback) => {
  if (!listeners[event]) listeners[event] = new Set();
  listeners[event].add(callback);
  return () => off(event, callback);
};

const off = (event, callback) => {
  const set = listeners[event];
  if (set) set.delete(callback);
};

const emit = (event, payload) => {
  const set = listeners[event];
  if (!set) return;
  // Clone to avoid mutation during iteration
  [...set].forEach(cb => {
    try {
      cb(payload);
    } catch (e) {
      console.warn(`eventBus listener error for ${event}:`, e);
    }
  });
};

export default { on, off, emit };
