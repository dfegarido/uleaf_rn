import React from 'react';
import { View, Text, TouchableOpacity, Alert, Animated, Platform } from 'react-native';
import styles from './styles/FlightSelectorStyles';

/**
 * Flight selector component with locking UX for checkout screen
 */
const FlightSelector = ({
  isLive=false,
  lockedFlightDate,
  flightDateOptions = [],
  selectedFlightDate,
  checkingOrders = false,
  shimmerAnim = new Animated.Value(0),
  disablePlantFlightSelection = false,
  flightLockInfo = {},
  lockedFlightKey,
  cargoDate,
  onSelectFlightDate,
  normalizeFlightKey,
  formatFlightDateToISO,
  disableFlightSelection = false, // For joiner logic
  receiverFlightDate = null, // Receiver's flight date for joiner
}) => {
  // Debug logging
  console.log('🛫 [FlightSelector] Render:', {
    flightDateOptionsLength: flightDateOptions.length,
    flightDateOptions: flightDateOptions.map(o => ({ iso: o.iso, label: o.label })),
    selectedFlightDate,
    checkingOrders,
    disablePlantFlightSelection,
    lockedFlightDate,
    lockedFlightKey,
    cargoDate,
    willDisableAll: disablePlantFlightSelection,
  });
  // Format receiver flight date for display
  const formatReceiverFlightDate = (dateString) => {
    if (!dateString) return '';
    try {
      // Handle Firestore Timestamp
      let date;
      if (dateString.toDate && typeof dateString.toDate === 'function') {
        date = dateString.toDate();
      } else if (dateString.seconds || dateString._seconds) {
        date = new Date((dateString.seconds || dateString._seconds) * 1000);
      } else {
        date = new Date(dateString);
      }

      if (isNaN(date.getTime())) return '';

      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const month = monthNames[date.getMonth()];
      const day = date.getDate();
      const year = date.getFullYear();
      return `${month} ${day}, ${year}`;
    } catch (error) {
      console.error('Error formatting receiver flight date:', error);
      return '';
    }
  };

  const isAndroid = () => {
    return Platform.OS === 'android';
  };

  const handleFlightSelection = (option) => {
    console.log('🛫 [FlightSelector] handleFlightSelection called with option:', option);
    
    // PRIORITY CHECK 1: If disabled for existing order (disablePlantFlightSelection), don't allow selection
    if (disablePlantFlightSelection) {
      console.log('⚠️ [FlightSelector] Flight selection disabled - existing order requires same flight date');
      return;
    }
    
    // PRIORITY CHECK 2: If disabled for joiner, don't allow selection
    if (disableFlightSelection) {
      console.log('⚠️ [FlightSelector] Flight selection disabled for joiner');
      return;
    }
    
    console.log('✅ [FlightSelector] Processing selection...');
    // Use option.iso directly since it's already calculated in controller
    const iso = option.iso || formatFlightDateToISO(option.value);
    const obj = { label: option.label, iso: iso || option.value };
    console.log('📅 [FlightSelector] Calling onSelectFlightDate with:', obj);
    onSelectFlightDate(obj);
  };

  return (
    <View style={styles.plantFlight}>
      {/* Title */}
      <View style={styles.flightTitle}>
        <Text style={styles.flightTitleText}>Plant Flight</Text>
        {disableFlightSelection ? (
          <Text style={styles.disabledNote}>
            {receiverFlightDate ? (
              <>
                Locked to receiver flight date:{' '}
                <Text style={styles.disabledNoteBold}>{formatReceiverFlightDate(receiverFlightDate)}</Text>
              </>
            ) : (
              'Locked to receiver flight date'
            )}
          </Text>
        ) : lockedFlightDate ? (
          <TouchableOpacity
            style={styles.infoCircle}
            onPress={() => {
              Alert.alert(
                'Flight date locked',
                `Disabled because you have an active Ready-to-Fly order on ${lockedFlightDate}`,
              );
            }}
            accessibilityLabel={`Flight locked info ${lockedFlightDate}`}>
            <Text style={styles.infoCircleText}>i</Text>
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Cutoff Date Info */}
      {flightDateOptions.length > 0 && flightDateOptions[0]?.cutoffDateLabel && (
        <View style={styles.cutoffDateContainer}>
          <Text style={styles.cutoffDateLabel}>
            Order cutoff: <Text style={styles.cutoffDateValue}>{flightDateOptions[0].cutoffDateLabel}</Text>
          </Text>
        </View>
      )}

      {/* Options */}
      <View style={styles.flightOptions}>
        <View style={styles.optionCards}>
          <Text style={styles.optionLabel}>Select One:</Text>

          {/* Flight Options */}
          <View style={styles.flightOptionsRow}>
            {checkingOrders ? (
              // show 3 animated skeleton placeholders while we wait for buyer orders response
              [0,1,2].map(i => {
                const bg = shimmerAnim.interpolate({
                  inputRange: [0, 0.5, 1],
                  outputRange: ['#EDEFF0', '#F6F7F8', '#EDEFF0'],
                });
                return (
                  <Animated.View key={i} style={[isAndroid() && isLive ? styles.optionCardAndroidLive : styles.optionCard, styles.skeletonCard, {backgroundColor: bg}]} />
                );
              })
            ) : (
              flightDateOptions.length === 0 ? (
                <View style={isAndroid() && isLive ? styles.optionCardAndroidLive : styles.optionCard}>
                  <Text style={styles.optionText}>No flight dates available</Text>
                </View>
              ) : (
              flightDateOptions.map((option, index) => {
                console.log(`🔍 [FlightSelector] Rendering option ${index}:`, {
                  iso: option.iso,
                  label: option.label,
                  disablePlantFlightSelection,
                });
                const optionKey = normalizeFlightKey(option.value) || normalizeFlightKey(option.label);
                
                // If disablePlantFlightSelection is true, ALL options are disabled
                // Also disable if joiner logic requires it
                const isLocked = disablePlantFlightSelection || disableFlightSelection;
                const isEffectivelyLocked = isLocked;
                
                console.log(`🔍 [FlightSelector] Option ${index} (${option.label}):`, {
                  disablePlantFlightSelection,
                  isLocked,
                  isEffectivelyLocked,
                  willBeDisabled: isEffectivelyLocked,
                });
                
                return (
                  <TouchableOpacity
                    key={index}
                    style={[
                      isAndroid() && isLive ? styles.optionCardAndroidLive : styles.optionCard,
                      selectedFlightDate?.iso === option.iso
                        ? styles.selectedOptionCard
                        : styles.unselectedOptionCard,
                      isEffectivelyLocked && styles.mutedOption,
                    ]}
                    onPress={() => handleFlightSelection(option)}
                    activeOpacity={isEffectivelyLocked ? 1 : 0.7}
                    disabled={isEffectivelyLocked}
                    pointerEvents={isEffectivelyLocked ? 'none' : 'auto'}>
                    <Text
                      style={
                        selectedFlightDate?.iso === option.iso
                          ? styles.optionText
                          : styles.unselectedOptionText
                      }>
                      {option.displayLabel || option.label}
                    </Text>
                    <Text style={styles.optionSubtext}>Sat</Text>
                  </TouchableOpacity>
                );
              }))
            )}
          </View>
        </View>
      </View>
    </View>
  );
};

export default FlightSelector;
