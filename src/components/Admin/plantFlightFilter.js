import React, {useState, useEffect} from 'react';
import {Modal, SafeAreaView, View, Text, TouchableOpacity, StyleSheet, TouchableWithoutFeedback} from 'react-native';
import CloseIcon from '../../assets/admin-icons/x.svg';
import RightArrowIcon from '../../assets/admin-icons/rigth-arrow.svg';

// Lightweight calendar-style Plant Flight picker matching Figma

const DayButton = ({label, onPress, isSelected, isToday, isAvailable, disabled}) => (
  <TouchableOpacity 
    onPress={onPress} 
    disabled={disabled}
    style={[
      styles.dayButton, 
      isSelected && styles.dayButtonSelected,
      isAvailable && !isSelected && styles.dayButtonAvailable,
      disabled && styles.dayButtonDisabled
    ]}
  >
    <Text style={[
      styles.dayText, 
      isSelected && styles.dayTextSelected, 
      isToday && !isSelected && styles.dayTextToday,
      disabled && styles.dayTextDisabled
    ]}>
      {label}
    </Text>
  </TouchableOpacity>
);

const SimpleMonthView = ({year, month, selectedDate, onSelect, availableDates = [], restrictToAvailable = false}) => {
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

  // Helper to check if a date is available
  const isDateAvailable = (year, month, day) => {
    if (availableDates.length === 0) return true; // If no available dates specified, allow all
    return availableDates.some(availDate => 
      availDate.getFullYear() === year && 
      availDate.getMonth() === month && 
      availDate.getDate() === day
    );
  };

  return (
    <View style={styles.calendarGrid}>
      <View style={styles.weekHeader}>
        {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map((d) => (
          <Text key={d} style={styles.weekHeaderText}>{d}</Text>
        ))}
      </View>
      {weeks.map((week, idx) => (
        <View key={idx} style={styles.weekRow}>
          {week.map((d, i) => {
            const isAvailable = d ? isDateAvailable(year, month, d) : false;
            const shouldDisable = restrictToAvailable && d && !isAvailable;
            
            return (
              <View key={i} style={styles.dayCell}>
                {d ? (
                  <DayButton
                    label={String(d)}
                    onPress={() => !shouldDisable && onSelect(new Date(year, month, d))}
                    isSelected={selectedDate && selectedDate.getFullYear() === year && selectedDate.getMonth() === month && selectedDate.getDate() === d}
                    isToday={today.getFullYear() === year && today.getMonth() === month && today.getDate() === d}
                    isAvailable={isAvailable}
                    disabled={shouldDisable}
                  />
                ) : (
                  <View style={styles.emptyDay} />
                )}
              </View>
            );
          })}
        </View>
      ))}
    </View>
  );
};

const PlantFlightFilter = ({isVisible, onClose, onSelectFlight, onReset, flightDates = [], selectedValue = null}) => {
  const now = new Date();
  const [viewYear, setViewYear] = useState(now.getFullYear());
  const [viewMonth, setViewMonth] = useState(now.getMonth());
  const [selectedDate, setSelectedDate] = useState(null);

  // Parse flightDates into Date objects for comparison
  const availableDates = React.useMemo(() => {
    return flightDates.map(dateStr => {
      const d = new Date(dateStr);
      return !isNaN(d) ? d : null;
    }).filter(Boolean);
  }, [flightDates]);

  // Initialize selected date from selectedValue prop
  useEffect(() => {
    if (isVisible) {
      if (selectedValue) {
        const parsed = new Date(selectedValue);
        if (!isNaN(parsed)) {
          setSelectedDate(parsed);
          setViewYear(parsed.getFullYear());
          setViewMonth(parsed.getMonth());
        }
      } else {
        setSelectedDate(null);
      }
    }
  }, [isVisible, selectedValue]);

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
      // Format date without timezone conversion to avoid date shift
      const year = selectedDate.getFullYear();
      const month = String(selectedDate.getMonth() + 1).padStart(2, '0');
      const day = String(selectedDate.getDate()).padStart(2, '0');
      const iso = `${year}-${month}-${day}`;
      onSelectFlight(iso);
    } else {
      onSelectFlight(null);
    }
    onClose();
  };

  const handleReset = () => {
    setSelectedDate(null);
    if (onReset && typeof onReset === 'function') {
      onReset();
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

          <SimpleMonthView 
            year={viewYear} 
            month={viewMonth} 
            selectedDate={selectedDate} 
            onSelect={setSelectedDate}
            availableDates={availableDates}
            restrictToAvailable={false}
          />

          <View style={styles.actionRow}>
            <TouchableOpacity style={styles.resetButton} onPress={handleReset}>
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
  sheetContainer: {position:'absolute', bottom:0, left:0, right:0, backgroundColor:'#FFFFFF', borderTopLeftRadius:24, borderTopRightRadius:24, maxHeight: 582},
  sheetHeader: {flexDirection:'row', paddingHorizontal:24, paddingTop:20, paddingBottom:12, alignItems:'center', justifyContent:'space-between', borderBottomWidth:StyleSheet.hairlineWidth, borderBottomColor:'#E4E7E9'},
  sheetTitle: {fontSize:18, fontWeight:'700', color:'#202325'},
  closeButton: {padding:6},
  content: {paddingHorizontal:24, paddingTop:8, paddingBottom:20, backgroundColor:'#FFFFFF'},
  monthRow: {flexDirection:'row', alignItems:'center', justifyContent:'space-between', paddingVertical:16},
  monthTitle: {fontSize:20, fontWeight:'600', color:'#202325', textAlign:'center', flex:1},
  navButton: {width:48, height:48, borderRadius:12, borderWidth:1, borderColor:'#CDD3D4', alignItems:'center', justifyContent:'center', backgroundColor:'#FFFFFF'},
  calendarGrid: {width:327, alignSelf:'center', backgroundColor:'#FFFFFF'},
  weekHeader: {flexDirection:'row', justifyContent:'space-between', marginBottom:8},
  weekHeaderText: {width:46, textAlign:'center', color:'#647276', fontWeight:'500', fontSize:14},
  weekRow: {flexDirection:'row', justifyContent:'space-between', marginBottom:8},
  dayCell: {width:46, alignItems:'center'},
  dayButton: {width:42, height:42, borderRadius:12, alignItems:'center', justifyContent:'center'},
  dayButtonSelected: {backgroundColor:'#23C16B'},
  dayButtonAvailable: {},
  dayButtonDisabled: {opacity:0.3},
  dayText: {color:'#393D40', fontSize:16, fontWeight:'600'},
  dayTextSelected: {color:'#FFFFFF', fontWeight:'600'},
  dayTextToday: {color:'#23C16B', fontWeight:'600'},
  dayTextDisabled: {color:'#9BA5A8'},
  emptyDay: {width:42, height:42},
  actionRow: {flexDirection:'row', gap:8, justifyContent:'center', marginTop:12},
  resetButton: {flex:1, backgroundColor:'#F2F7F3', borderRadius:12, height:48, alignItems:'center', justifyContent:'center'},
  resetText: {color:'#23C16B', fontWeight:'600', fontSize:16},
  viewButton: {flex:1, backgroundColor:'#23C16B', borderRadius:12, height:48, alignItems:'center', justifyContent:'center'},
  viewText: {color:'#FFFFFF', fontWeight:'600', fontSize:16}
});

export default PlantFlightFilter;