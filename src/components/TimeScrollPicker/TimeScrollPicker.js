import React, { useEffect, useRef, useState } from 'react';
import { FlatList, StyleSheet, Text, View } from 'react-native';

const ITEM_HEIGHT = 44;
const VISIBLE_ROWS = 3;

const HOURS = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, '0'));
const MINUTES = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, '0'));
const PERIODS = ['AM', 'PM'];

function normalizeHour(value) {
  const n = parseInt(value, 10);
  if (!n || n < 1 || n > 12) return '12';
  return String(n).padStart(2, '0');
}

function normalizeMinute(value) {
  const n = parseInt(value, 10);
  if (Number.isNaN(n) || n < 0 || n > 59) return '00';
  return String(n).padStart(2, '0');
}

function normalizePeriod(value) {
  return String(value || '').toUpperCase() === 'PM' ? 'PM' : 'AM';
}

function Wheel({ items, value, onChange }) {
  const index = Math.max(0, items.indexOf(value));
  const [selected, setSelected] = useState(value);
  const dragging = useRef(false);

  const commit = (offsetY, notifyParent) => {
    const next = Math.max(0, Math.min(items.length - 1, Math.round(offsetY / ITEM_HEIGHT)));
    const item = items[next];
    setSelected(item);
    if (notifyParent && item !== value) onChange(item);
  };

  return (
    <View style={styles.wheel}>
      <View pointerEvents="none" style={styles.highlight} />
      <FlatList
        data={items}
        keyExtractor={(item) => item}
        extraData={selected}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT}
        decelerationRate="fast"
        bounces={false}
        overScrollMode="never"
        nestedScrollEnabled
        initialScrollIndex={index}
        onScrollToIndexFailed={() => {}}
        removeClippedSubviews={false}
        getItemLayout={(_, i) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * i, index: i })}
        contentContainerStyle={styles.wheelContent}
        scrollEventThrottle={16}
        onScrollBeginDrag={() => { dragging.current = true; }}
        onScroll={(e) => {
          if (dragging.current) commit(e.nativeEvent.contentOffset.y, false);
        }}
        onScrollEndDrag={(e) => {
          dragging.current = false;
          commit(e.nativeEvent.contentOffset.y, true);
        }}
        onMomentumScrollEnd={(e) => {
          dragging.current = false;
          commit(e.nativeEvent.contentOffset.y, true);
        }}
        renderItem={({ item }) => (
          <View style={styles.item}>
            <Text style={[styles.itemText, item === selected && styles.itemTextSelected]}>{item}</Text>
          </View>
        )}
      />
    </View>
  );
}

export default function TimeScrollPicker({
  hour,
  minute,
  period,
  onHourChange,
  onMinuteChange,
  onPeriodChange,
}) {
  const hourValue = normalizeHour(hour);
  const minuteValue = normalizeMinute(minute);
  const periodValue = normalizePeriod(period);

  useEffect(() => {
    if (hour !== hourValue) onHourChange(hourValue);
    if (minute !== minuteValue) onMinuteChange(minuteValue);
    if (period !== periodValue) onPeriodChange(periodValue);
  }, []);

  return (
    <View style={styles.row}>
      <View style={styles.column}>
        <Wheel items={HOURS} value={hourValue} onChange={onHourChange} />
        <Text style={styles.label}>Hour</Text>
      </View>
      <View style={styles.colonWrap}>
        <Text style={styles.colon}>:</Text>
      </View>
      <View style={styles.column}>
        <Wheel items={MINUTES} value={minuteValue} onChange={onMinuteChange} />
        <Text style={styles.label}>Minutes</Text>
      </View>
      <View style={[styles.column, styles.periodColumn]}>
        <Wheel items={PERIODS} value={periodValue} onChange={onPeriodChange} />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'center',
  },
  column: {
    width: 88,
    alignItems: 'center',
  },
  periodColumn: {
    width: 72,
    marginLeft: 8,
  },
  wheel: {
    height: ITEM_HEIGHT * VISIBLE_ROWS,
    width: '100%',
    overflow: 'hidden',
  },
  wheelContent: {
    paddingVertical: ITEM_HEIGHT,
  },
  highlight: {
    position: 'absolute',
    top: ITEM_HEIGHT,
    left: 4,
    right: 4,
    height: ITEM_HEIGHT,
    borderRadius: 12,
    backgroundColor: '#F2F7F3',
  },
  item: {
    height: ITEM_HEIGHT,
    alignItems: 'center',
    justifyContent: 'center',
  },
  itemText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 18,
    color: '#A9B3B7',
  },
  itemTextSelected: {
    fontWeight: '600',
    fontSize: 22,
    color: '#202325',
  },
  label: {
    marginTop: 6,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    color: '#7F8D91',
  },
  colonWrap: {
    height: ITEM_HEIGHT * VISIBLE_ROWS,
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  colon: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 24,
    color: '#202325',
  },
});
