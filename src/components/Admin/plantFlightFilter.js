import React, {useState, useEffect} from 'react';
import {Modal, SafeAreaView, View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback} from 'react-native';
import CloseIcon from '../../assets/admin-icons/x.svg';
import RightArrowIcon from '../../assets/admin-icons/rigth-arrow.svg';

// Lightweight calendar-style Plant Flight picker matching Figma

const DayButton = ({label, onPress, isSelected, isToday}) => (
  <TouchableOpacity onPress={onPress} style={[styles.dayButton, isSelected ? styles.dayButtonSelected : null]}>
    <Text style={[styles.dayText, isSelected ? styles.dayTextSelected : null, isToday ? styles.dayTextToday : null]}>{label}</Text>
  </TouchableOpacity>
);

const SimpleMonthView = ({year, month, selectedDate, onSelect}) => {
  const firstDay = new Date(year, month, 1);
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const startWeekday = firstDay.getDay();

  const weeks = [];
  let dayCounter = 1 - startWeekday;
  while (dayCounter <= daysInMonth) {
    const week = [];
    for (let i = 0; i < 7; i++) {
      if (dayCounter >= 1 && dayCounter <= daysInMonth) {
        week.push(dayCounter);
      } else {
        week.push(null);
      }
      dayCounter++;
    }
    weeks.push(week);
  }

  const today = new Date();

  return (
    <View style={styles.calendarGrid}>
      <View style={styles.weekHeader}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <Text key={d} style={styles.weekHeaderText}>{d}</Text>
        ))}
      </View>
      {weeks.map((week, idx) => (
        <View key={idx} style={styles.weekRow}>
          {week.map((d, i) => (
            <View key={i} style={styles.dayCell}>
              {d ? (
                <DayButton
                  label={String(d)}
                  onPress={() => onSelect(new Date(year, month, d))}
                  isSelected={selectedDate && selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === d}
                  isToday={today.getFullYear() === year && today.getMonth() === month && today.getDate() === d}
                />
              ) : (
                <View style={styles.emptyDay} />
              )}
            </View>
          ))}
        </View>
      ))}
    </View>
  );
};

const PlantFlightFilter = ({isVisible, onClose, onSelectFlight, flightDates = []}) => {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  useEffect(() => {
    if (flightDates && flightDates.length > 0 && !selectedDate) {
      const fd = flightDates[0];
      const parsed = new Date(fd);
      if (!isNaN(parsed)) setSelectedDate(parsed);
    }
  }, [flightDates]);

  const prevMonth = () => {
    if (viewMonth === 0) {
      setViewYear(viewYear - 1);
      setViewMonth(11);
    } else {
      setViewMonth(viewMonth - 1);
    }
  };
  const nextMonth = () => {
    if (viewMonth === 11) {
      setViewYear(viewYear + 1);
      setViewMonth(0);
    } else {
      setViewMonth(viewMonth + 1);
    }
  };

  const handleApply = () => {
    if (selectedDate) {
      const iso = selectedDate.toISOString().split('T')[0];
      onSelectFlight(iso);
    } else {
      onSelectFlight(null);
    }
    onClose();
  };

  const monthNames = ["January","February","March","April","May","June","July","August","September","October","November","December"];

  return (
    <Modal animationType="slide" transparent visible={isVisible} onRequestClose={onClose}>
      <TouchableWithoutFeedback onPress={onClose}>
        <View style={styles.overlay} />
      </TouchableWithoutFeedback>
      <SafeAreaView style={styles.sheetContainer}>
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Select Date</Text>
          <TouchableOpacity onPress={onClose} style={styles.closeButton}>
            <CloseIcon width={20} height={20} />
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          <View style={styles.monthRow}>
            <TouchableOpacity onPress={prevMonth} style={styles.navButton}>
              <RightArrowIcon width={18} height={18} style={{ transform: [{ rotate: '180deg' }] }} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{monthNames[viewMonth]}, {viewYear}</Text>
            <TouchableOpacity onPress={nextMonth} style={styles.navButton}>
              <RightArrowIcon width={18} height={18} />
            </TouchableOpacity>
          </View>

          <SimpleMonthView year={viewYear} month={viewMonth} selectedDate={selectedDate} onSelect={setSelectedDate} />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.resetButton} onPress={() => setSelectedDate(null)}>
              <Text style={styles.resetText}>Reset</Text>
            </TouchableOpacity>
            <TouchableOpacity style={styles.viewButton} onPress={handleApply}>
              <Text style={styles.viewText}>View</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {flex:1, backgroundColor:'rgba(0,0,0,0.5)'},
  sheetContainer: {position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#fff', borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight: 582},
  sheetHeader: {flexDirection:'row', paddingHorizontal:24, paddingTop:20, paddingBottom:12, alignItems:'center', justifyContent:'space-between', borderBottomWidth:StyleSheet.hairlineWidth, borderBottomColor:'#F0F0F0'},
  sheetTitle: {fontSize:18, fontWeight:'700', color:'#202325'},
  closeButton: {padding:6},
  content: {paddingHorizontal:24, paddingTop:8, paddingBottom:20},
  monthRow: {flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:16},
  monthTitle: {fontSize:20, fontWeight:'600', color:'#393D40', textAlign:'center', flex:1},
  navButton: {width:48, height:48, borderRadius:12, borderWidth:1, borderColor:'#CDD3D4', alignItems:'center', justifyContent:'center', backgroundColor:'#fff'},
  calendarGrid: {width:327, alignSelf:'center'},
  weekHeader: {flexDirection:'row', justifyContent:'space-between', marginBottom:8},
  weekHeaderText: {width:46, textAlign:'center', color:'#539461', fontWeight:'500'},
  weekRow: {flexDirection:'row', justifyContent:'space-between', marginBottom:8},
  dayCell: {width:46, alignItems:'center'},
  dayButton: {width:42, height:42, borderRadius:12, alignItems:'center', justifyContent:'center'},
  dayButtonSelected: {backgroundColor:'#539461'},
  dayText: {color:'#393D40'},
  dayTextSelected: {color:'#fff', fontWeight:'700'},
  dayTextToday: {color:'#A9B3B7'},
  emptyDay: {width:42, height:42},
  actionRow: {flexDirection:'row', gap:8, justifyContent:'center', marginTop:12},
  resetButton: {flex:1, backgroundColor:'#F2F7F3', borderRadius:12, height:48, alignItems:'center', justifyContent:'center'},
  resetText: {color:'#539461', fontWeight:'600', fontSize:16},
  viewButton: {flex:1, backgroundColor:'#539461', borderRadius:12, height:48, alignItems:'center', justifyContent:'center'},
  viewText: {color:'#fff', fontWeight:'600', fontSize:16}
});

export default PlantFlightFilter;