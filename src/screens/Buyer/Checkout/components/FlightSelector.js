import React from 'react';
import { View, Text, TouchableOpacity, Alert, Animated } from 'react-native';
import styles from './styles/FlightSelectorStyles';

/**
 * Flight selector component with locking UX for checkout screen
 */
const FlightSelector = ({
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
  const handleFlightSelection = (option) => {
    console.log('🛫 [FlightSelector] handleFlightSelection called with option:', option);
    
    const optionKey = normalizeFlightKey(option.value) || normalizeFlightKey(option.label);
    console.log('🔍 [FlightSelector] optionKey calculated:', optionKey);
    
    // Determine if this option is locked
    // If disablePlantFlightSelection is true, ALL options are disabled (existing order date <= earliest option)
    // If disablePlantFlightSelection is false but lockedFlightDate exists, allow selection
    let isLocked = false;
    
    // If disablePlantFlightSelection is true, all options are locked
    if (disablePlantFlightSelection) {
      isLocked = true;
      console.log('🔍 [FlightSelector] Option locked - all selections disabled (existing order <= earliest option)');
    } else if (lockedFlightDate) {
      // If disablePlantFlightSelection is false, existing order date > earliest option
      // In this case, all options should be enabled (no locking)
      isLocked = false;
      console.log('🔍 [FlightSelector] Option enabled - all selections enabled (existing order > earliest option)');
    }
    
    const isEffectivelyLocked = isLocked || disablePlantFlightSelection;
    console.log('🔍 [FlightSelector] isEffectivelyLocked:', isEffectivelyLocked, {
      isLocked,
      disablePlantFlightSelection,
    });
    
    if (isEffectivelyLocked) {
      console.log('⚠️ [FlightSelector] Option is locked, returning early');
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
        {lockedFlightDate ? (
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
                  <Animated.View key={i} style={[styles.optionCard, styles.skeletonCard, {backgroundColor: bg}]} />
                );
              })
            ) : (
              flightDateOptions.length === 0 ? (
                <View style={styles.optionCard}>
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
                const isLocked = disablePlantFlightSelection;
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
                      styles.optionCard,
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
