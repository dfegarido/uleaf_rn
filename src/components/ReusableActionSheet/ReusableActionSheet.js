import React, {useState, useEffect, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  Animated,
} from 'react-native';
import ActionSheet from '../ActionSheet/ActionSheet';
import {RadioButton} from '../RadioButton';
import IconEx from '../../assets/icons/greylight/x-regular.svg';
import {globalStyles} from '../../assets/styles/styles';
import {CheckBoxGroup} from '../CheckBox';
import SelectableItemList from '../SelectableItems/SelectableItems';

const ReusableActionSheet = ({
  code,
  visible,
  onClose,
  genusLoading,
  variegationLoading,
  sortOptions,
  genusOptions,
  variegationOptions,
  listingTypeOptions,
  listingTypeLoading,
  countryOptions,
  countryLoading,
  shippingIndexOptions,
  shippingIndexLoading,
  acclimationIndexOptions,
  acclimationIndexLoading,
  priceOptions,
  sortValue,
  sortChange,
  genusValue,
  genusChange,
  variegationValue,
  variegationChange,
  listingTypeValue,
  listingTypeChange,
  countryValue,
  countryChange,
  shippingIndexValue,
  shippingIndexChange,
  acclimationIndexValue,
  acclimationIndexChange,
  priceValue,
  priceChange,
  statusOptions,
  statusValue,
  statusChange,
  handleSearchSubmit,
  clearFilters,
}) => {
  // Ensure array defaults so UI can evaluate selected state reliably
  const safeVariegationValue = Array.isArray(variegationValue) ? variegationValue : [];
  const resetSelection = () => variegationChange([]);
  const resetGenusSelection = () => genusChange([]);
  const resetListingTypeSelection = () => listingTypeChange([]);
  const resetCountrySelection = () => countryChange([]);
  const resetShippingIndexSelection = () => shippingIndexChange([]);
  const resetAcclimationIndexSelection = () => acclimationIndexChange([]);
  const resetPriceSelection = () => priceChange('');

  // Simple pulsing skeleton used for variegation placeholders
  const VariegationSkeleton = ({style}) => {
    const anim = useRef(new Animated.Value(1)).current;
    useEffect(() => {
      const loop = Animated.loop(
        Animated.sequence([
          Animated.timing(anim, { toValue: 0.6, duration: 700, useNativeDriver: true }),
          Animated.timing(anim, { toValue: 1, duration: 700, useNativeDriver: true }),
        ])
      );
      loop.start();
      return () => loop.stop();
    }, [anim]);

    return <Animated.View style={[style, { opacity: anim, backgroundColor: '#e0e0e0' }]} />;
  };

  const renderSheetContent = () => {
    switch (code) {
      case 'STATUS':
        // Use incoming statusOptions but explicitly filter out 'sold' and 'archived'
        const incoming = Array.isArray(statusOptions) ? statusOptions.slice() : [];
        const filtered = incoming.filter(i => {
          const v = String(i.value || '').toLowerCase();
          return v !== 'sold' && v !== 'archived';
        });
        const finalStatusOptions = filtered;

          return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'40%'}>
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>Status</Text>
              <TouchableOpacity onPress={() => onClose(true)}>
                <IconEx width={20} height={20} />
              </TouchableOpacity>
            </View>
            <View style={{marginBottom: 60, maxHeight: 340}}>
              <CheckBoxGroup
                options={finalStatusOptions}
                selectedValues={statusValue}
                onChange={statusChange}
                checkboxPosition="right"
                optionStyle={{
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingBottom: 10,
                }}
                labelStyle={{textAlign: 'left'}}
              />
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
              <TouchableOpacity onPress={clearFilters} style={{width: '45%'}}>
                <View style={[globalStyles.lightGreenButton]}>
                  <Text style={[globalStyles.textMDAccent, {textAlign: 'center'}]}>
                    Clear
                  </Text>
                </View>
              </TouchableOpacity>
              <TouchableOpacity style={{width: '45%'}} onPress={handleSearchSubmit}>
                <View style={globalStyles.primaryButton}>
                  <Text style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>
                    View
                  </Text>
                </View>
              </TouchableOpacity>
            </View>
          </ActionSheet>
        );
      case 'SORT':
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'40%'}>
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>Sort</Text>
              <TouchableOpacity onPress={() => onClose(true)}>
                <IconEx width={20} height={20} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{marginBottom: 60}} nestedScrollEnabled={true}>
              <RadioButton
                options={sortOptions}
                selected={sortValue}
                onSelect={sortChange}
                containerStyle={{marginTop: 20}}
                optionStyle={{
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingBottom: 15,
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
      case 'PRICE':
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'55%'}>
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>Price Range</Text>
              <TouchableOpacity onPress={() => onClose(true)}>
                <IconEx width={20} height={20} />
              </TouchableOpacity>
            </View>
            <ScrollView style={{marginBottom: 60}} nestedScrollEnabled={true}>
              <RadioButton
                options={priceOptions}
                selected={priceValue}
                onSelect={priceChange}
                containerStyle={{marginTop: 20}}
                optionStyle={{
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingBottom: 15,
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
                paddingHorizontal: 20,
              }}>
              <TouchableOpacity onPress={clearFilters} style={{width: '45%'}}>
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
      case 'GENUS':
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'60%'}>
            <View style={styles.sheetTitleContainerFigma}>
              <Text style={styles.sheetTitleFigma}>Genus</Text>
              <TouchableOpacity onPress={() => onClose(true)} style={styles.closeButton}>
                <IconEx width={24} height={24} />
              </TouchableOpacity>
            </View>

            <ScrollView style={styles.genusScroll} contentContainerStyle={{paddingBottom: 90}} nestedScrollEnabled={true}>
              {genusLoading ? (
                // simple skeleton placeholders while genus list loads
                Array.from({ length: 8 }).map((_, i) => (
                  <View key={`sk-${i}`} style={[styles.genusRow, {opacity: 0.4}]}> 
                    <View style={{width:24, height:24, backgroundColor: '#EEE', borderRadius: 4}} />
                    <View style={{marginLeft: 12, height: 18, width: 220, backgroundColor: '#EEE', borderRadius: 4}} />
                  </View>
                ))
              ) : (
                (!genusOptions || genusOptions.length === 0) ? (
                  <Text style={{padding: 20, color: '#7F8D91'}}>No options available</Text>
                ) : (
                  genusOptions.map((opt, idx) => {
                    const selected = Array.isArray(genusValue) && genusValue.includes(opt.value);
                    return (
                      <TouchableOpacity
                        key={idx}
                        style={styles.genusRow}
                        activeOpacity={0.7}
                        onPress={() => genusChange(Array.isArray(genusValue) ? (selected ? genusValue.filter(v => v !== opt.value) : [...genusValue, opt.value]) : [opt.value])}
                      >
                        <View style={styles.genusLeft}>
                          {/* optional icon placeholder */}
                          <View style={{width:24, height:24}} />
                          <Text style={styles.genusLabel}>{opt.label}</Text>
                        </View>

                        <View style={styles.genusRight}>
                          <Text style={styles.genusRightText}>{opt.meta || ''}</Text>
                          <View style={[styles.genusCheckbox, selected ? styles.genusCheckboxChecked : styles.genusCheckboxUnchecked]}>
                            {selected && <View style={styles.genusCheckboxInner} />}
                          </View>
                        </View>
                      </TouchableOpacity>
                    );
                  })
                )
              )}
            </ScrollView>

            <View style={styles.genusActionBar}>
              <TouchableOpacity onPress={resetGenusSelection} style={styles.genusActionButton}>
                <View style={[globalStyles.lightGreenButton, styles.genusResetButton]}>
                  <Text style={[globalStyles.textMDAccent, {textAlign: 'center'}]}>Reset</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.genusActionButton} onPress={handleSearchSubmit}>
                <View style={[globalStyles.primaryButton, styles.genusViewButton]}>
                  <Text style={[globalStyles.textMDWhite, {textAlign: 'center'}]}>View</Text>
                </View>
              </TouchableOpacity>
            </View>
          </ActionSheet>
        );
      case 'VARIEGATION': {
        // Render variegation with explicit conditional blocks to avoid nested ternaries
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'70%'}>
            <View style={styles.sheetTitleContainerFigma}>
              <Text style={styles.sheetTitleFigma}>Variegation</Text>
              <TouchableOpacity onPress={() => onClose(true)} style={styles.closeButton}>
                <IconEx width={24} height={24} />
              </TouchableOpacity>
            </View>

            <View style={styles.variegationContent}>
              {variegationLoading && (
                Array.from({ length: 8 }).map((_, i) => (
                  <VariegationSkeleton
                    key={`var-sk-${i}`}
                    style={[styles.filterPill, { height: 40, marginBottom: 8, borderRadius: 20, paddingHorizontal: 12, minHeight: 40 }]}
                  />
                ))
              )}

              {!variegationLoading && (!variegationOptions || variegationOptions.length === 0) && (
                <Text style={{padding: 20, color: '#7F8D91'}}>No options available</Text>
              )}

              {!variegationLoading && variegationOptions && variegationOptions.length > 0 && (
                <View style={styles.variegationPillsContainer}>
                  {variegationOptions
                    .filter(opt => opt.value !== 'Choose the most suitable variegation.')
                    .map((opt) => {
                      const selected = safeVariegationValue.includes(opt.value);
                      // Outer tap only adds selection when currently unselected. Inner 'x' handles removal.
                      const onOuterPress = () => {
                        if (selected) return; // let the inner close button handle unselect
                        variegationChange([...safeVariegationValue, opt.value]);
                      };
                      const onClosePress = () => {
                        variegationChange(safeVariegationValue.filter(v => v !== opt.value));
                      };

                      return (
                        <TouchableOpacity
                          key={opt.value}
                          style={[styles.filterPill, selected ? styles.filterPillActive : styles.filterPillInactive]}
                          activeOpacity={0.8}
                          onPress={onOuterPress}
                        >
                          <View style={styles.filterPillContent}>
                            <Text
                              numberOfLines={1}
                              ellipsizeMode="tail"
                              style={[styles.filterPillText, selected ? styles.filterPillTextActive : styles.filterPillTextInactive]}
                            >
                              {opt.label}
                            </Text>

                            {selected && (
                              <TouchableOpacity
                                onPress={onClosePress}
                                style={styles.pillClose}
                                activeOpacity={0.7}
                              >
                                <Text style={styles.pillCloseText}>×</Text>
                              </TouchableOpacity>
                            )}
                          </View>
                        </TouchableOpacity>
                      );
                    })}
                </View>
              )}
            </View>

            <View style={styles.variegationActionRow}>
              <TouchableOpacity onPress={resetSelection} style={styles.variegationActionButton}>
                <View style={styles.clearButton}>
                  <Text style={styles.clearButtonText}>Clear</Text>
                </View>
              </TouchableOpacity>

              <TouchableOpacity style={styles.variegationActionButton} onPress={handleSearchSubmit}>
                <View style={styles.viewButton}>
                  <Text style={styles.viewButtonText}>View</Text>
                </View>
              </TouchableOpacity>
            </View>
          </ActionSheet>
        );
      }
      case 'LISTINGTYPE':
        // console.debug('ReusableActionSheet LISTINGTYPE props:', { visible, listingTypeLoading });
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

            {((!listingTypeOptions || listingTypeOptions.length === 0) && visible) ? (
                <View style={{paddingHorizontal: 0}}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <View key={`lt-row-${i}`} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0'}}>
                      <VariegationSkeleton style={{width: '70%', height: 16, borderRadius: 6}} />
                      <VariegationSkeleton style={{width: 20, height: 20, borderRadius: 6, marginLeft: 12}} />
                    </View>
                  ))}
                </View>
              ) : ((!listingTypeOptions || listingTypeOptions.length === 0) ? (
                <Text style={{padding: 20, color: '#7F8D91'}}>
                  No options available
                </Text>
              ) : (
                <View style={{maxHeight: 300, marginBottom: 20}}>
                  <CheckBoxGroup
                    options={listingTypeOptions}
                    selectedValues={listingTypeValue}
                    onChange={listingTypeChange}
                    checkboxPosition="right"
                    optionStyle={{
                      justifyContent: 'space-between',
                      paddingHorizontal: 20,
                      paddingBottom: 10,
                    }}
                    labelStyle={{textAlign: 'left'}}
                  />
                </View>
              ))}

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
      case 'LISTING_TYPE':
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

            {listingTypeLoading ? (
              <View style={{flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 20, paddingTop: 12}}>
                {Array.from({ length: 6 }).map((_, i) => (
                  <VariegationSkeleton key={`lt-sk-${i}`} style={[styles.filterPill, { height: 40, marginBottom: 8, borderRadius: 20 }]} />
                ))}
              </View>
            ) : ((!listingTypeOptions || listingTypeOptions.length === 0) ? (
              <Text style={{padding: 20, color: '#7F8D91'}}>
                No options available
              </Text>
            ) : (
              <CheckBoxGroup
                options={listingTypeOptions}
                selectedValues={listingTypeValue}
                onChange={listingTypeChange}
                checkboxPosition="right"
                optionStyle={{
                  justifyContent: 'space-between',
                  paddingHorizontal: 20,
                  paddingBottom: 10,
                }}
                labelStyle={{textAlign: 'left'}}
              />
            ))}

            <View
              style={{
                flexDirection: 'row',
                gap: 10,
                justifyContent: 'center',
                position: 'absolute',
                bottom: 10,
                width: '100%',
              }}>
              <TouchableOpacity onPress={clearFilters} style={{width: '45%'}}>
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
      case 'COUNTRY':
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'50%'}>
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>Country</Text>
              <TouchableOpacity onPress={() => onClose(true)}>
                <IconEx width={20} height={20} />
              </TouchableOpacity>
            </View>
            <View style={{marginBottom: 60, maxHeight: 360}}>
              {((!countryOptions || countryOptions.length === 0) && visible) ? (
                <View>
                  {Array.from({ length: 8 }).map((_, i) => (
                    <View key={`country-sk-${i}`} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0'}}>
                      <VariegationSkeleton style={{width: '70%', height: 16, borderRadius: 6}} />
                      <VariegationSkeleton style={{width: 20, height: 20, borderRadius: 6, marginLeft: 12}} />
                    </View>
                  ))}
                </View>
              ) : ((!countryOptions || countryOptions.length === 0) ? (
                <Text style={{padding: 20, color: '#7F8D91'}}>
                  No options available
                </Text>
              ) : (
                <CheckBoxGroup
                  options={countryOptions}
                  selectedValues={countryValue}
                  onChange={countryChange}
                  checkboxPosition="right"
                  optionStyle={{
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingBottom: 10,
                  }}
                  labelStyle={{textAlign: 'left'}}
                />
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
              <TouchableOpacity onPress={resetCountrySelection} style={{width: '45%'}}>
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
      case 'SHIPPING_INDEX':
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'50%'}>
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>Shipping Index</Text>
              <TouchableOpacity onPress={() => onClose(true)}>
                <IconEx width={20} height={20} />
              </TouchableOpacity>
            </View>
            <View style={{marginBottom: 60, maxHeight: 320}}>
              {(shippingIndexLoading && visible) ? (
                <View style={{paddingHorizontal: 0}}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <View key={`si-row-${i}`} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0'}}>
                      <VariegationSkeleton style={{width: '70%', height: 16, borderRadius: 6}} />
                      <VariegationSkeleton style={{width: 20, height: 20, borderRadius: 6, marginLeft: 12}} />
                    </View>
                  ))}
                </View>
              ) : ((!shippingIndexOptions || shippingIndexOptions.length === 0) ? (
                <Text style={{padding: 20, color: '#7F8D91'}}>
                  No options available
                </Text>
              ) : (
                <CheckBoxGroup
                  options={shippingIndexOptions}
                  selectedValues={shippingIndexValue}
                  onChange={shippingIndexChange}
                  checkboxPosition="right"
                  optionStyle={{
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingBottom: 10,
                  }}
                  labelStyle={{textAlign: 'left'}}
                />
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
              <TouchableOpacity onPress={resetShippingIndexSelection} style={{width: '45%'}}>
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
      case 'ACCLIMATION_INDEX':
        return (
          <ActionSheet
            visible={visible}
            onClose={onClose}
            heightPercent={'50%'}>
            <View style={styles.sheetTitleContainer}>
              <Text style={styles.sheetTitle}>Acclimation Index</Text>
              <TouchableOpacity onPress={() => onClose(true)}>
                <IconEx width={20} height={20} />
              </TouchableOpacity>
            </View>
            <View style={{marginBottom: 60, maxHeight: 320}}>
              {(acclimationIndexLoading && visible) ? (
                <View style={{paddingHorizontal: 0}}>
                  {Array.from({ length: 6 }).map((_, i) => (
                    <View key={`ai-row-${i}`} style={{flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F0F0F0'}}>
                      <VariegationSkeleton style={{width: '70%', height: 16, borderRadius: 6}} />
                      <VariegationSkeleton style={{width: 20, height: 20, borderRadius: 6, marginLeft: 12}} />
                    </View>
                  ))}
                </View>
              ) : ((!acclimationIndexOptions || acclimationIndexOptions.length === 0) ? (
                <Text style={{padding: 20, color: '#7F8D91'}}>
                  No options available
                </Text>
              ) : (
                <CheckBoxGroup
                  options={acclimationIndexOptions}
                  selectedValues={acclimationIndexValue}
                  onChange={acclimationIndexChange}
                  checkboxPosition="right"
                  optionStyle={{
                    justifyContent: 'space-between',
                    paddingHorizontal: 20,
                    paddingBottom: 10,
                  }}
                  labelStyle={{textAlign: 'left'}}
                />
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
              <TouchableOpacity onPress={resetAcclimationIndexSelection} style={{width: '45%'}}>
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
  /* Figma Genus styles */
  sheetTitleContainerFigma: {
    paddingHorizontal: 24,
    paddingTop: 20,
    paddingBottom: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#F0F0F0',
  },
  sheetTitleFigma: {
    fontSize: 18,
    fontWeight: '700',
    color: '#222',
  },
  closeButton: {
    padding: 6,
    marginRight: -6,
  },
  genusScroll: {
    paddingHorizontal: 16,
    paddingTop: 12,
  },
  genusRow: {
    height: 48,
    width: 360,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 12,
    marginBottom: 8,
    backgroundColor: '#fff',
  },
  genusLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  genusLabel: {
    fontSize: 16,
    fontWeight: '500',
    color: '#162E2C',
    marginLeft: 8,
  },
  genusRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  genusRightText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#7F8D91',
    marginRight: 8,
  },
  genusCheckbox: {
    width: 20,
    height: 20,
    borderRadius: 6,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  genusCheckboxUnchecked: {
    borderColor: '#D8D8D8',
    backgroundColor: '#FFF',
  },
  genusCheckboxChecked: {
    borderColor: '#0DB06B',
    backgroundColor: '#0DB06B',
  },
  genusCheckboxInner: {
    width: 10,
    height: 10,
    borderRadius: 2,
    backgroundColor: '#FFF',
  },
  genusActionBar: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 12,
    justifyContent: 'space-between',
  },
  genusActionButton: {
    width: '48%',
  },
  genusResetButton: {
    paddingVertical: 12,
    borderRadius: 12,
  },
  genusViewButton: {
    paddingVertical: 12,
    borderRadius: 12,
  },
  /* Variegation styles */
  variegationContent: {
    paddingTop: 8,
    paddingHorizontal: 24,
  },
  variegationPillsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    alignItems: 'flex-start',
    alignContent: 'flex-start',
    paddingBottom: 12,
  },
  filterPill: {
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 20,
    minHeight: 40,
    justifyContent: 'center',
  },
  filterPillContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  pillClose: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 8,
  },
  pillCloseText: {
    color: '#FFFFFF',
    fontSize: 12,
    lineHeight: 12,
    fontWeight: '700',
  },
  filterPillActive: {
    backgroundColor: '#16A34A',
    borderWidth: 0,
    // Make active pill pop with subtle shadow/elevation
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.12,
    shadowRadius: 2,
    elevation: 2,
  },
  filterPillInactive: {
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
  },
  filterPillText: {
    fontSize: 16,
    fontWeight: '600',
  },
  filterPillTextActive: {
    color: '#FFFFFF',
  },
  filterPillTextInactive: {
    color: '#393D40',
  },
  variegationActionRow: {
    position: 'absolute',
    bottom: 12,
    left: 16,
    right: 16,
    flexDirection: 'row',
    gap: 8,
    justifyContent: 'space-between',
  },
  variegationActionButton: {
    width: '48%'
  },
  clearButton: {
    backgroundColor: '#F2F7F3',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  clearButtonText: {
    color: '#539461',
    fontWeight: '600',
    fontSize: 16,
  },
  viewButton: {
    backgroundColor: '#539461',
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: 'center',
  },
  viewButtonText: {
    color: '#FFFFFF',
    fontWeight: '600',
    fontSize: 16,
  },
});

export default ReusableActionSheet;
