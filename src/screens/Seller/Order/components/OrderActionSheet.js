import React, {useState, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import ActionSheet from '../../../../components/ActionSheet/ActionSheet';
import {RadioButton} from '../../../../components/RadioButton';
import {globalStyles} from '../../../../assets/styles/styles';
import {CheckBoxGroup} from '../../../../components/CheckBox';
import dayjs from 'dayjs';

import IconEx from '../../../../assets/icons/greylight/x-regular.svg';

const OrderActionSheet = ({
  code,
  visible,
  onClose,
  sortOptions,
  dateOptions,
  listingTypeOptions,
  sortValue,
  dateValue,
  sortChange,
  dateChange,
  listingTypeValue,
  listingTypeChange,
  handleSearchSubmit,
  handleSearchSubmitRange,
}) => {
  const resetListingTypeSelection = () => listingTypeChange([]);

  const renderSheetContent = () => {
    switch (code) {
      case 'SORT':
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'35%'}>
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>Sort</Text>
              <TouchableOpacity onPress={() => onClose(true)}>
                <IconEx width={20} height={20} />
              </TouchableOpacity>
            </View>

            <RadioButton
              options={sortOptions}
              selected={sortValue}
              onSelect={sortChange}
              containerStyle={{marginTop: 20}}
              optionStyle={{
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingBottom: 10,
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                justifyContent: 'center',
                position: 'absolute',
                bottom: 10,
                width: '100%',
              }}>
              <TouchableOpacity
                onPress={handleSearchSubmit}
                style={{
                  paddingHorizontal: 20,
                  alignSelf: 'stretch',
                  width: '100%',
                }}>
                <View style={globalStyles.primaryButton}>
                  <Text
                    style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
                    View
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ActionSheet>
        );
      case 'DATE':
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'35%'}>
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>Date</Text>
              <TouchableOpacity onPress={() => onClose(true)}>
                <IconEx width={20} height={20} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{marginBottom: 60}}>
              <RadioButton
                options={dateOptions}
                selected={dateValue}
                onSelect={dateChange}
                containerStyle={{marginTop: 20}}
                optionStyle={{
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingBottom: 10,
                }}
              />
            </ScrollView>
            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                justifyContent: 'center',
                position: 'absolute',
                bottom: 10,
                width: '100%',
              }}>
              <TouchableOpacity
                onPress={handleSearchSubmit}
                style={{
                  paddingHorizontal: 20,
                  alignSelf: 'stretch',
                  width: '100%',
                }}>
                <View style={globalStyles.primaryButton}>
                  <Text
                    style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
                    View
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ActionSheet>
        );

      case 'DATERANGE':
        const today = new Date();
        const [startDate, setStartDate] = useState(null);
        const [endDate, setEndDate] = useState(null);
        const [currentMonth, setCurrentMonth] = useState(today.getMonth());
        const [currentYear, setCurrentYear] = useState(today.getFullYear());

        const getDaysArray = (month, year) => {
          const date = new Date(year, month, 1);
          const result = [];
          const offset = date.getDay(); // 0 = Sunday
          for (let i = 0; i < offset; i++) result.push(null);
          while (date.getMonth() === month) {
            result.push(new Date(date));
            date.setDate(date.getDate() + 1);
          }
          return result;
        };

        const handleSelectDate = date => {
          if (!startDate || (startDate && endDate)) {
            setStartDate(date);
            setEndDate(null);
          } else if (startDate && !endDate) {
            if (date < startDate) {
              setEndDate(startDate);
              setStartDate(date);
            } else {
              setEndDate(date);
            }
          }
        };

        const isSameDay = (d1, d2) =>
          d1.getFullYear() === d2.getFullYear() &&
          d1.getMonth() === d2.getMonth() &&
          d1.getDate() === d2.getDate();

        const isBetween = (date, start, end) => date > start && date < end;

        const isSelected = date => {
          if (!date) return false;
          if (startDate && isSameDay(date, startDate)) return true;
          if (endDate && isSameDay(date, endDate)) return true;
          if (startDate && endDate && isBetween(date, startDate, endDate))
            return true;
          return false;
        };

        const formatDate = date =>
          date
            ? date.toLocaleDateString('en-US', {
                weekday: 'short',
                month: 'short',
                day: 'numeric',
              })
            : '--';

        const handlePrevMonth = () => {
          if (currentMonth === 0) {
            setCurrentMonth(11);
            setCurrentYear(prev => prev - 1);
          } else {
            setCurrentMonth(prev => prev - 1);
          }
        };

        const handleNextMonth = () => {
          if (currentMonth === 11) {
            setCurrentMonth(0);
            setCurrentYear(prev => prev + 1);
          } else {
            setCurrentMonth(prev => prev + 1);
          }
        };

        const renderCalendar = getDaysArray(currentMonth, currentYear);

        return (
          <ActionSheet visible={visible} onClose={onClose} heightPercent="60%">
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>Date Range</Text>
              <TouchableOpacity onPress={() => onClose(true)}>
                <IconEx width={20} height={20} />
              </TouchableOpacity>
            </View>

            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'space-around',
                marginBottom: 10,
              }}>
              <View>
                <Text style={styles.dateLabel}>From</Text>
                <Text style={styles.dateValue}>{formatDate(startDate)}</Text>
              </View>
              <View>
                <Text style={styles.dateLabel}>To</Text>
                <Text style={styles.dateValue}>{formatDate(endDate)}</Text>
              </View>
            </View>

            {/* Month Nav */}
            <View
              style={{
                flexDirection: 'row',
                justifyContent: 'center',
                alignItems: 'center',
                marginBottom: 10,
              }}>
              <TouchableOpacity onPress={handlePrevMonth} style={{padding: 10}}>
                <Text style={{fontSize: 20, color: '#539461'}}>{'◀'}</Text>
              </TouchableOpacity>
              <Text style={[styles.dateValue, {marginHorizontal: 10}]}>
                {new Date(currentYear, currentMonth).toLocaleDateString(
                  'en-US',
                  {
                    month: 'long',
                    year: 'numeric',
                  },
                )}
              </Text>
              <TouchableOpacity onPress={handleNextMonth} style={{padding: 10}}>
                <Text style={{fontSize: 20, color: '#539461'}}>{'▶'}</Text>
              </TouchableOpacity>
            </View>

            <View style={styles.calendarHeader}>
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <Text key={d} style={styles.dayHeader}>
                  {d}
                </Text>
              ))}
            </View>

            <View
              style={{
                flexDirection: 'row',
                flexWrap: 'wrap',
                marginHorizontal: 20,
              }}>
              {renderCalendar.map((item, index) => (
                <TouchableOpacity
                  key={index}
                  onPress={() => item && handleSelectDate(item)}
                  style={[
                    styles.dayCell,
                    item && isSelected(item) && styles.selectedDay,
                  ]}
                  disabled={!item}>
                  <Text
                    style={[styles.dayText, !item && {color: 'transparent'}]}>
                    {item ? item.getDate() : ''}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                justifyContent: 'center',
                position: 'absolute',
                bottom: 10,
                width: '100%',
              }}>
              <TouchableOpacity
                onPress={() => {
                  setStartDate(null);
                  setEndDate(null);
                }}
                style={{width: '45%'}}>
                <View style={[globalStyles.lightGreenButton]}>
                  <Text
                    style={[globalStyles.textMDAccent, {textAlign: 'center'}]}>
                    Reset
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={{width: '45%'}}
                onPress={() => {
                  handleSearchSubmitRange(startDate, endDate);
                  onClose();
                }}>
                <View style={globalStyles.primaryButton}>
                  <Text
                    style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
                    View
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ActionSheet>
        );

      case 'LISTINGTYPE':
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'35%'}>
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>Listing Type</Text>
              <TouchableOpacity onPress={() => onClose(true)}>
                <IconEx width={20} height={20} />
              </TouchableOpacity>
            </View>

            <CheckBoxGroup
              options={listingTypeOptions}
              selectedValues={listingTypeValue}
              onChange={listingTypeChange}
              optionStyle={{
                justifyContent: 'space-between',
                paddingHorizontal: 20,
                paddingBottom: 10,
              }}
            />

            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                justifyContent: 'center',
                position: 'absolute',
                bottom: 10,
                width: '100%',
              }}>
              <TouchableOpacity
                onPress={resetListingTypeSelection}
                style={{width: '45%'}}>
                <View style={[globalStyles.lightGreenButton]}>
                  <Text
                    style={[globalStyles.textMDAccent, {textAlign: 'center'}]}>
                    Reset
                  </Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity
                style={{width: '45%'}}
                onPress={handleSearchSubmit}>
                <View style={globalStyles.primaryButton}>
                  <Text
                    style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
                    View
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ActionSheet>
        );
      default:
        return null;
    }
  };

  return <View>{renderSheetContent()}</View>;
};

const styles = StyleSheet.create({
  sheetTitleContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 20,
  },
  sheetTitle: {
    color: '#202325',
    fontSize: 18,
  },

  // Date range
  calendarHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 10,
    marginTop: 10,
  },
  dayHeader: {
    width: '14.28%',
    textAlign: 'center',
    fontSize: 12,
    fontWeight: '500',
    color: '#539461',
  },
  dayCell: {
    width: '14.28%',
    aspectRatio: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginVertical: 4,
    borderRadius: 20,
  },
  selectedDay: {
    backgroundColor: '#539461',
  },
  dayText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#000',
  },
  dateLabel: {
    fontSize: 13,
    color: '#999',
    textAlign: 'center',
  },
  dateValue: {
    fontSize: 15,
    fontWeight: '500',
    color: '#000',
    textAlign: 'center',
  },
  buttonRow: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    marginTop: 20,
    marginBottom: 10,
  },
  resetButton: {
    width: '45%',
    borderWidth: 1,
    borderColor: '#99CEA1',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
});

export default OrderActionSheet;
