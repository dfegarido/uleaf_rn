import React, { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { getLiveSellersApi, getLiveStreamsApi } from '../../components/Api/liveApi';
import { getLiveSaleScheduleApi, getMyLiveSessionsApi } from '../../components/Api/liveRequestApi';
import { bookingsOnLocalDay, dateKey, formatBookingRange, isLiveSaleHours } from '../../utils/liveSaleSchedule';

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];
const HOUR_OPTIONS = [2, 3, 4, 5];

function startFrom(value) {
  if (value == null || value === '') return null;
  if (typeof value.toDate === 'function') {
    const date = value.toDate();
    return Number.isNaN(date.getTime()) ? null : date;
  }
  if (typeof value === 'object' && value.seconds != null) {
    return new Date(Number(value.seconds) * 1000);
  }
  if (typeof value === 'string' && value.trim().startsWith('{')) {
    try {
      const parsed = JSON.parse(value);
      if (parsed && parsed.seconds != null) return new Date(Number(parsed.seconds) * 1000);
    } catch (_error) {
      return null;
    }
  }
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? null : date;
}

function saleHours(value) {
  return isLiveSaleHours(value) ? Number(value) : null;
}

function toBooking({ id, liveSessionId, start, hours, gardenName, sellerUid }) {
  if (!start) return null;
  const durationHours = hours || 2;
  return {
    id: String(id),
    liveSessionId: liveSessionId ? String(liveSessionId) : null,
    gardenName: gardenName || 'Garden',
    sellerUid: sellerUid || '',
    startsAt: start.toISOString(),
    endsAt: new Date(start.getTime() + durationHours * 60 * 60 * 1000).toISOString(),
    durationHours,
    durationKnown: Boolean(hours),
  };
}

function remember(map, booking) {
  if (!booking) return;
  const key = String(booking.liveSessionId || booking.id);
  const existing = map.get(key);
  if (!existing) {
    map.set(key, booking);
    return;
  }
  const durationHours = booking.durationKnown ? booking.durationHours : existing.durationHours;
  const start = new Date(existing.startsAt);
  map.set(key, {
    ...existing,
    gardenName: existing.gardenName && existing.gardenName !== 'Your live sale'
      ? existing.gardenName
      : booking.gardenName,
    durationHours,
    endsAt: new Date(start.getTime() + durationHours * 60 * 60 * 1000).toISOString(),
    durationKnown: existing.durationKnown || booking.durationKnown,
  });
}

async function loadScheduleBookings() {
  const [scheduleRes, streamsRes, mineRes] = await Promise.all([
    getLiveSaleScheduleApi(),
    getLiveStreamsApi(),
    getMyLiveSessionsApi('live'),
  ]);

  const map = new Map();
  if (scheduleRes && scheduleRes.success) {
    (scheduleRes.bookings || []).forEach((booking) => remember(map, { ...booking, durationKnown: true }));
  }

  const streams = streamsRes && streamsRes.success ? streamsRes.streams || [] : [];
  const mine = mineRes && mineRes.success ? mineRes.sessions || [] : [];
  const hoursById = new Map();
  mine.forEach((session) => {
    const hours = saleHours(session.duration)
      || saleHours(session.sessionData && session.sessionData.durationHours)
      || saleHours(session.sessionData && session.sessionData.duration);
    if (hours) hoursById.set(String(session.id), hours);
  });

  const sellerIds = streams.map((stream) => stream.createdBy).filter(Boolean);
  const sellersRes = sellerIds.length ? await getLiveSellersApi(sellerIds) : { sellers: {} };
  const sellers = (sellersRes && sellersRes.sellers) || {};

  streams.forEach((stream) => {
    if (String(stream.liveType || 'live').toLowerCase() === 'purge') return;
    const status = String(stream.status || '').toLowerCase();
    if (status === 'ended' || status === 'cancelled') return;
    const seller = sellers[stream.createdBy] || {};
    const hours = saleHours(stream.duration) || hoursById.get(String(stream.id)) || null;
    remember(map, toBooking({
      id: stream.id,
      liveSessionId: stream.id,
      start: startFrom(stream.scheduledAt),
      hours,
      gardenName: seller.gardenOrCompanyName || seller.fullName || seller.alias || 'Garden',
      sellerUid: stream.createdBy,
    }));
  });

  mine.forEach((session) => {
    const status = String(session.status || '').toLowerCase();
    if (status !== 'waiting' && status !== 'live' && status !== 'approved') return;
    remember(map, toBooking({
      id: session.id,
      liveSessionId: session.id,
      start: startFrom(session.scheduledAt),
      hours: hoursById.get(String(session.id)) || null,
      gardenName: 'Your live sale',
      sellerUid: '',
    }));
  });

  const loaded = (scheduleRes && scheduleRes.success)
    || (streamsRes && streamsRes.success)
    || (mineRes && mineRes.success);
  return {
    bookings: [...map.values()],
    error: loaded ? '' : ((scheduleRes && scheduleRes.error) || 'Could not load the schedule.'),
  };
}

export function useLiveSaleBookings() {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const load = useCallback(async () => {
    const result = await loadScheduleBookings();
    setBookings(result.bookings);
    setError(result.error);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      loadScheduleBookings().then((result) => {
        if (!active) return;
        setBookings(result.bookings);
        setError(result.error);
        setLoading(false);
      });
      return () => {
        active = false;
      };
    }, []),
  );

  return { bookings, loading, error, reload: load };
}

export function LiveSaleDurationPicker({ value, onChange }) {
  return (
    <View style={styles.durationRow}>
      {HOUR_OPTIONS.map((hours) => {
        const selected = value === hours;
        return (
          <TouchableOpacity
            key={hours}
            style={[styles.durationChip, selected && styles.durationChipOn]}
            onPress={() => onChange(hours)}
            activeOpacity={0.8}
          >
            <Text style={[styles.durationText, selected && styles.durationTextOn]}>{hours} hr</Text>
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}

function buildMonth(cursor) {
  const year = cursor.getFullYear();
  const month = cursor.getMonth();
  const firstWeekday = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const prevLast = new Date(year, month, 0).getDate();
  const cells = [];

  for (let i = 0; i < firstWeekday; i++) {
    const day = prevLast - firstWeekday + i + 1;
    cells.push({ day, date: new Date(year, month - 1, day), inMonth: false });
  }
  for (let day = 1; day <= daysInMonth; day++) {
    cells.push({ day, date: new Date(year, month, day), inMonth: true });
  }
  while (cells.length % 7 !== 0) {
    const day = cells.length - (firstWeekday + daysInMonth) + 1;
    cells.push({ day, date: new Date(year, month + 1, day), inMonth: false });
  }
  return cells;
}

/**
 * Month calendar for scheduling a live sale.
 * A date that already has an approved booking shows that garden or business name.
 * The day stays selectable. Start time is chosen separately and is not limited to slots.
 */
const LiveSaleScheduleCalendar = ({ selectedDate, onSelectDate, bookings = [], loading = false, error = '' }) => {
  const [cursor, setCursor] = useState(() => new Date(selectedDate || Date.now()));
  const [gridWidth, setGridWidth] = useState(0);
  const cells = buildMonth(cursor);
  const today = startOfDay(new Date());
  const selectedKey = dateKey(selectedDate || new Date());
  const selectedBookings = bookingsOnLocalDay(bookings, selectedDate || new Date());
  const cellWidth = gridWidth > 0 ? Math.floor((gridWidth - 6 * 4) / 7) : 0;

  const namesFor = (date) => {
    const seen = new Set();
    const names = [];
    bookingsOnLocalDay(bookings, date).forEach((booking) => {
      const name = (booking.gardenName || '').trim();
      if (!name || seen.has(name)) return;
      seen.add(name);
      names.push(name);
    });
    return names;
  };

  return (
    <View style={styles.wrap}>
      <View style={styles.monthRow}>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() - 1, 1))}
        >
          <Text style={styles.navText}>‹</Text>
        </TouchableOpacity>
        <Text style={styles.monthLabel}>{MONTHS[cursor.getMonth()]} {cursor.getFullYear()}</Text>
        <TouchableOpacity
          style={styles.navButton}
          onPress={() => setCursor(new Date(cursor.getFullYear(), cursor.getMonth() + 1, 1))}
        >
          <Text style={styles.navText}>›</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.weekRow}>
        {WEEKDAYS.map((day) => (
          <Text key={day} style={styles.weekDay}>{day}</Text>
        ))}
      </View>

      <View style={styles.grid} onLayout={(event) => setGridWidth(event.nativeEvent.layout.width)}>
        {cells.map((cell) => {
          const key = dateKey(cell.date);
          const past = startOfDay(cell.date).getTime() < today.getTime();
          const selected = key === selectedKey;
          const names = namesFor(cell.date);
          return (
            <TouchableOpacity
              key={key + (cell.inMonth ? '' : '-pad')}
              style={[
                styles.cell,
                cellWidth ? { width: cellWidth } : null,
                selected && styles.cellSelected,
                names.length > 0 && !selected && styles.cellBooked,
              ]}
              disabled={past}
              onPress={() => onSelectDate(cell.date)}
              activeOpacity={0.8}
            >
              <Text style={[
                styles.dayNum,
                !cell.inMonth && styles.dayMuted,
                past && styles.dayMuted,
                selected && styles.daySelected,
              ]}>
                {cell.day}
              </Text>
              {names.length > 0 ? (
                <Text style={[styles.cellName, selected && styles.cellNameOn]} numberOfLines={1}>{names[0]}</Text>
              ) : null}
              {names.length > 1 && !selected ? (
                <Text style={styles.cellMore}>+{names.length - 1}</Text>
              ) : null}
            </TouchableOpacity>
          );
        })}
      </View>

      {loading ? <ActivityIndicator color="#539461" style={styles.status} /> : null}
      {error ? <Text style={styles.errorText}>{error} The schedule is checked again when you submit.</Text> : null}

      <View style={styles.dayBookings}>
        <Text style={styles.dayBookingsTitle}>
          {(selectedDate || new Date()).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
        </Text>
        {selectedBookings.length === 0 ? (
          <Text style={styles.openText}>No live sale booked. Any start time is open.</Text>
        ) : (
          selectedBookings.map((booking) => (
            <View key={booking.id} style={styles.bookingBlock}>
              <Text style={styles.bookingLine}>{booking.gardenName}</Text>
              <Text style={styles.bookingRange}>
                {formatBookingRange(booking)} · {booking.durationHours} hours
              </Text>
            </View>
          ))
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  wrap: { marginBottom: 16 },
  monthRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    alignItems: 'center',
    justifyContent: 'center',
  },
  navText: { fontSize: 22, color: '#202325', lineHeight: 24 },
  monthLabel: { fontSize: 16, fontWeight: '700', color: '#202325' },
  weekRow: { flexDirection: 'row', marginBottom: 6 },
  weekDay: { flex: 1, textAlign: 'center', fontSize: 12, fontWeight: '600', color: '#539461' },
  grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 4 },
  cell: {
    minHeight: 58,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 2,
    paddingVertical: 4,
    backgroundColor: '#FFFFFF',
  },
  cellBooked: { backgroundColor: '#F2F7F3' },
  cellSelected: { backgroundColor: '#539461' },
  dayNum: { fontSize: 15, fontWeight: '600', color: '#393D40' },
  dayMuted: { color: '#C5CDD0' },
  daySelected: { color: '#FFFFFF' },
  cellName: { fontSize: 9, fontWeight: '700', color: '#539461', marginTop: 2, textAlign: 'center' },
  cellNameOn: { color: '#FFFFFF' },
  cellMore: { fontSize: 9, color: '#6B777B' },
  status: { marginTop: 8 },
  errorText: { marginTop: 8, fontSize: 12, color: '#A15C07' },
  dayBookings: {
    marginTop: 12,
    padding: 12,
    borderRadius: 12,
    backgroundColor: '#F7F8F8',
  },
  dayBookingsTitle: { fontSize: 13, fontWeight: '700', color: '#202325', marginBottom: 4 },
  openText: { fontSize: 13, color: '#6B777B' },
  bookingBlock: { marginTop: 8 },
  bookingLine: { fontSize: 15, fontWeight: '700', color: '#202325' },
  bookingRange: { fontSize: 14, color: '#393D40', marginTop: 2 },
  durationRow: { flexDirection: 'row', gap: 8, marginBottom: 8 },
  durationChip: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#CDD3D4',
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
  },
  durationChipOn: { backgroundColor: '#539461', borderColor: '#539461' },
  durationText: { fontSize: 14, fontWeight: '700', color: '#393D40' },
  durationTextOn: { color: '#FFFFFF' },
});

export default LiveSaleScheduleCalendar;
