/** Client-side mirror of the live sale window rules. The server is the authority. */

export function isLiveSaleHours(value) {
  const n = typeof value === 'number' ? value : Number(value);
  return Number.isInteger(n) && n >= 2 && n <= 5;
}

/** End of a live sale. A missing duration uses the 2-hour minimum. */
function toMs(value) {
  if (value == null) return NaN;
  if (value instanceof Date) return value.getTime();
  if (typeof value.toDate === 'function') return value.toDate().getTime();
  if (typeof value === 'object' && value.seconds != null) return Number(value.seconds) * 1000;
  return new Date(value).getTime();
}

export function liveSaleEndsAt(start, durationHours) {
  const startMs = toMs(start);
  if (!Number.isFinite(startMs)) return null;
  const hours = isLiveSaleHours(durationHours) ? Number(durationHours) : 2;
  return new Date(startMs + hours * 60 * 60 * 1000);
}

export function isLiveSaleWindowOver(start, durationHours, now = new Date()) {
  const end = liveSaleEndsAt(start, durationHours);
  return !!end && now.getTime() >= end.getTime();
}

export function findOverlappingBooking(start, durationHours, bookings, excludeId) {
  const startMs = new Date(start).getTime();
  if (!isLiveSaleHours(durationHours) || !Number.isFinite(startMs)) return null;
  const endMs = startMs + durationHours * 60 * 60 * 1000;
  const exclude = excludeId ? String(excludeId) : '';
  const list = Array.isArray(bookings) ? bookings : [];
  return list.find((booking) => {
    if (!booking) return false;
    if (exclude && (String(booking.id) === exclude || String(booking.liveSessionId || '') === exclude)) {
      return false;
    }
    const bStart = new Date(booking.startsAt).getTime();
    const bEnd = new Date(booking.endsAt).getTime();
    return Number.isFinite(bStart) && Number.isFinite(bEnd) && startMs < bEnd && bStart < endMs;
  }) || null;
}

export function overlapAlert(booking) {
  const start = new Date(booking.startsAt);
  const end = new Date(booking.endsAt);
  const fmt = (date) => date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  });
  const name = booking.gardenName || 'Another garden';
  return `${name} is already approved ${fmt(start)} to ${fmt(end)}. Live sales cannot overlap.`;
}

export function dateKey(date) {
  const d = new Date(date);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/** Bookings whose window touches this local calendar day. */
export function bookingsOnLocalDay(bookings, day) {
  const start = new Date(day);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  const startMs = start.getTime();
  const endMs = end.getTime();
  return (bookings || []).filter((booking) => {
    const bStart = new Date(booking.startsAt).getTime();
    const bEnd = new Date(booking.endsAt).getTime();
    return bStart < endMs && bEnd > startMs;
  });
}

export function formatBookingRange(booking) {
  const start = new Date(booking.startsAt);
  const end = new Date(booking.endsAt);
  const time = (date) => date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' });
  const endForDay = new Date(end.getTime() - 1);
  if (dateKey(start) === dateKey(endForDay)) {
    return `${time(start)} to ${time(end)}`;
  }
  const day = (date) => date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  return `${day(start)} ${time(start)} to ${day(end)} ${time(end)}`;
}

export function combineDateAndTime(day, time) {
  const next = new Date(day);
  const clock = new Date(time);
  next.setHours(clock.getHours(), clock.getMinutes(), 0, 0);
  return next;
}
