import React from 'react';
import { View, Text, TouchableOpacity, Animated, TextInput } from 'react-native';
import Svg, { Path } from 'react-native-svg';
import { formatCurrencyFull } from '../../../../utils/formatCurrency';
import styles from './styles/OrderSummaryStyles';
import LeafGreenIcon from '../../../../assets/buyer-icons/leaf-green.svg';
import PlantVioletIcon from '../../../../assets/buyer-icons/plant-violet.svg';
import TruckBlueIcon from '../../../../assets/buyer-icons/truck-blue.svg';
import VenmoLogoIcon from '../../../../assets/buyer-icons/venmo-logo.svg';

/**
 * Order Summary component showing plant quantities, costs, shipping details, and credits
 */
const OrderSummary = ({
  quantityBreakdown = {},
  orderSummary = {},
  shippingCalculation = { loading: false },
  shimmerAnim = new Animated.Value(0),
  upsNextDayEnabled = false,
  onToggleUpsNextDay = () => {},
  leafPointsEnabled = false,
  plantCreditsEnabled = false,
  shippingCreditsEnabled = false,
  leafPoints = 0,
  plantCredits = 0,
  onToggleLeafPoints = () => {},
  onTogglePlantCredits = () => {},
  onToggleShippingCredits = () => {},
  discountCode = '',
  onDiscountCodeChange = () => {},
  onApplyDiscount = () => {},
}) => {
  return (
    <>
      {/* Payment Method */}
      <View style={styles.paymentMethod}>
        <View style={styles.paymentMethodRow}>
          <Text style={styles.paymentMethodTitle}>Payment Method</Text>
          <VenmoLogoIcon width={71} height={13} />
        </View>
      </View>

      {/* Payment Method Divider */}
      <View style={styles.paymentDivider}>
        <View style={styles.paymentDividerLine} />
      </View>

      {/* Summary */}
      <View style={styles.summary}>
        {/* Quantity */}
        <View style={styles.quantity}>
          {/* Title */}
          <View style={styles.quantityTitle}>
            <Text style={styles.quantityTitleText}>Your Plant Haul</Text>
          </View>

          {/* Content */}
          <View style={styles.quantityContent}>
            {/* Single / Growers */}
            <View style={styles.singleGrowerRow}>
              <Text style={styles.summaryRowLabel}>
                Single Plant Quantity
              </Text>
              <Text style={styles.summaryRowNumber}>
                {quantityBreakdown.singlePlant}
              </Text>
            </View>

            {/* Wholesale */}
            <View style={styles.wholesaleRow}>
              <Text style={styles.summaryRowLabel}>Wholesale Quantity</Text>
              <Text style={styles.summaryRowNumber}>
                {quantityBreakdown.wholesale}
              </Text>
            </View>

            {/* Growers Choice */}
            <View style={styles.growersChoiceRow}>
              <Text style={styles.summaryRowLabel}>Growers Choice Quantity</Text>
              <Text style={styles.summaryRowNumber}>
                {quantityBreakdown.growersChoice}
              </Text>
            </View>

            {/* Total */}
            <View style={styles.quantityTotalRow}>
              <Text style={styles.quantityTotalLabel}>Total quantity</Text>
              <Text style={styles.quantityTotalNumber}>
                {orderSummary.totalItems}
              </Text>
            </View>
          </View>
        </View>

        {/* Divider */}
        <View style={styles.summaryDivider}>
          <View style={styles.dividerLine} />
        </View>

        {/* Subtotal */}
        <View style={styles.subtotal}>
          {/* Total Plant Cost Row - Conditional display based on discount */}
          <View style={styles.plantCostRow}>
            <Text style={styles.subtotalLabel}>Total Plant Cost</Text>
            {orderSummary.discount > 0 ? (
              <View style={styles.priceComparisonContainer}>
                <Text style={styles.originalPriceStrikethrough}>
                  {formatCurrencyFull(orderSummary.totalOriginalCost)}
                </Text>
                <Text style={styles.discountedPriceFinal}>
                  {formatCurrencyFull(orderSummary.subtotal)}
                </Text>
              </View>
            ) : (
              <Text style={styles.subtotalNumber}>
                {formatCurrencyFull(orderSummary.subtotal)}
              </Text>
            )}
          </View>

          {/* Discount - Only show if there is a discount */}
          {orderSummary.discount > 0 && (
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Total Discount</Text>
              <Text style={styles.subtotalNumber}>
                -{formatCurrencyFull(orderSummary.discount)}
              </Text>
            </View>
          )}

          {/* Credits Applied */}
          {orderSummary.creditsApplied > 0 && (
            <View style={styles.subtotalRow}>
              <Text style={styles.subtotalLabel}>Credits Applied</Text>
              <Text style={styles.subtotalNumber}>
                -{formatCurrencyFull(orderSummary.creditsApplied)}
              </Text>
            </View>
          )}
        </View>

        {/* Divider */}
        <View style={styles.summaryDivider}>
          <View style={styles.dividerLine} />
        </View>

        {/* Shipping Credits Notification */}
        {(orderSummary.shippingCreditsDiscount || 0) > 0 && (
          <View style={styles.shippingCreditsNotification}>
            <Text style={styles.shippingCreditsNotificationText}>
              🎉 Congratulations! You qualify for $150 shipping credits for spending $500+ and buying 15+ plants.
            </Text>
          </View>
        )}

        {/* Shipping Summary */}
        <View style={styles.shippingSummary}>
          {/* Title */}
          <View style={styles.shippingSummaryTitle}>
            <Text style={styles.shippingSummaryTitleText}>
              Where your shipping bucks go
            </Text>
          </View>

          {/* Content */}
          <View style={styles.shippingSummaryContent}>
            {/* Loading skeleton for shipping calculation */}
            {shippingCalculation.loading ? (
              <>
                {/* UPS 2nd day shipping skeleton */}
                <View style={styles.shippingFeeRow}>
                  <View style={styles.skeletonText} />
                  <Animated.View style={[styles.skeletonAmount, { opacity: shimmerAnim }]} />
                </View>
                
                {/* Next Day upgrade skeleton */}
                <View style={styles.labeledToggle}>
                  <View style={styles.skeletonTextShort} />
                  <Animated.View style={[styles.skeletonToggle, { opacity: shimmerAnim }]} />
                </View>
                
                {/* Base Air Cargo skeleton */}
                <View style={styles.baseAirCargoRow}>
                  <View style={styles.skeletonText} />
                  <Animated.View style={[styles.skeletonAmount, { opacity: shimmerAnim }]} />
                </View>
                
                {/* Wholesale Air Cargo skeleton */}
                <View style={styles.wholesaleAirCargoRow}>
                  <View style={styles.skeletonText} />
                  <Animated.View style={[styles.skeletonAmount, { opacity: shimmerAnim }]} />
                </View>
                
                {/* Total skeleton */}
                <View style={styles.shippingTotalRow}>
                  <View style={styles.skeletonTextTotal} />
                  <Animated.View style={[styles.skeletonAmountLarge, { opacity: shimmerAnim }]} />
                </View>
              </>
            ) : (
              <>
                {/* Shipping Fee */}
                <View style={styles.shippingFeeRow}>
                  <Text style={styles.summaryRowLabel}>
                    UPS 2nd day shipping
                  </Text>
                  <Text style={styles.summaryRowNumber}>
                    {formatCurrencyFull(orderSummary.baseUpsShipping)}
                  </Text>
                </View>

                {/* Form / Labeled Toggle */}
                <View style={styles.labeledToggle}>
                  <View style={styles.toggleLabel}>
                    <Text style={styles.toggleLabelText}>
                      Upgrading to UPS Next Day
                    </Text>
                  </View>
                  <TouchableOpacity
                    style={styles.formToggle}
                    onPress={onToggleUpsNextDay}>
                    <View style={styles.upsToggleText}>
                      <Text
                        style={
                          upsNextDayEnabled
                            ? styles.upsToggleLabel
                            : styles.upsToggleLabelOff
                        }>
                        {upsNextDayEnabled ? '+' : '-'}
                      </Text>
                      <Text
                        style={
                          upsNextDayEnabled
                            ? styles.upsToggleNumber
                            : styles.upsToggleNumberOff
                        }>
                        {upsNextDayEnabled
                          ? formatCurrencyFull(
                              orderSummary.upsNextDayUpgradeCost || 0,
                            )
                          : formatCurrencyFull(0)}
                      </Text>
                    </View>
                    <View
                      style={[
                        styles.switchContainer,
                        upsNextDayEnabled && styles.switchContainerActive,
                      ]}>
                      <View
                        style={[
                          styles.switchKnob,
                          upsNextDayEnabled && styles.switchKnobActive,
                        ]}
                      />
                    </View>
                  </TouchableOpacity>
                </View>

                {/* Base Air Cargo - always show (for Single Plant/Grower's Choice items) */}
                <View style={styles.baseAirCargoRow}>
                  <View style={styles.baseAirCargoLabelContainer}>
                    <Text style={styles.baseAirCargoLabel}>Base Air Cargo</Text>
                    <View style={styles.baseAirCargoTooltip}>
                      <View style={styles.baseAirCargoTooltipIcon}>
                        <Svg width={20} height={20} viewBox="0 0 24 24" fill="none">
                          <Path
                            d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 7H13V13H11V7ZM11 15H13V17H11V15Z"
                            fill="#7F8D91"
                          />
                        </Svg>
                      </View>
                    </View>
                  </View>
                  <Text style={styles.baseAirCargoAmount}>
                    {formatCurrencyFull(orderSummary.airBaseCargo || 0)}
                  </Text>
                </View>

                {/* Wholesale Air Cargo - only show if there are wholesale items */}
                {orderSummary.wholesaleAirCargo > 0 && (
                  <View style={styles.wholesaleAirCargoRow}>
                    <Text style={styles.wholesaleAirCargoLabel}>Wholesale Air Cargo</Text>
                    <Text style={styles.wholesaleAirCargoNumber}>
                      {formatCurrencyFull(orderSummary.wholesaleAirCargo)}
                    </Text>
                  </View>
                )}

                {/* Air Cargo Credit - HIDDEN per user request (only show Shipping Credits) */}
                {/* Hidden: Air Cargo Shipping Credit - user only wants Shipping Credits to show */}

                {/* Shipping Credits (shown when applied) */}
                {(orderSummary.shippingCreditsDiscount || 0) > 0 && (
                  <View style={styles.shippingCreditsRow}>
                    <Text style={styles.shippingCreditsLabel}>
                      Shipping Credits
                    </Text>
                    <Text style={styles.shippingCreditsAmount}>
                      -{formatCurrencyFull(orderSummary.shippingCreditsDiscount)}
                    </Text>
                  </View>
                )}

                {/* Total */}
                <View style={styles.shippingTotalRow}>
                  <Text style={styles.shippingTotalLabel}>
                    Total Shipping Cost
                  </Text>
                  <Text style={styles.shippingTotalNumber}>
                    {formatCurrencyFull(orderSummary.finalShippingCost || orderSummary.totalShippingCost)}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Divider */}
        <View style={styles.summaryDivider}>
          <View style={styles.dividerLine} />
        </View>

        {/* Points */}
        <View style={styles.points}>
          {/* Title */}
          <View style={styles.pointsTitle}>
            <Text style={styles.pointsTitleText}>
              Use available ileafU points, rewards and discounts
            </Text>
          </View>

          {/* Discount Code Input */}
          <View style={styles.discountInputSection}>
            {/* Text Field */}
            <View style={styles.discountTextField}>
              <View style={styles.textFieldContainer}>
                <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" style={styles.textFieldIcon}>
                  <Path
                    d="M12 2C6.48 2 2 6.48 2 12C2 17.52 6.48 22 12 22C17.52 22 22 17.52 22 12C22 6.48 17.52 2 12 2ZM12 20C7.59 20 4 16.41 4 12C4 7.59 7.59 4 12 4C16.41 4 20 7.59 20 12C20 16.41 16.41 20 12 20ZM11 7H13V13H11V7ZM11 15H13V17H11V15Z"
                    fill="#7F8D91"
                  />
                </Svg>
                <TextInput
                  style={styles.textFieldInput}
                  placeholder="Enter discount code"
                  placeholderTextColor="#647276"
                  value={discountCode}
                  onChangeText={onDiscountCodeChange}
                />
              </View>
            </View>

            {/* Apply Button */}
            <TouchableOpacity
              style={styles.discountApplyButton}
              onPress={onApplyDiscount}>
              <Text style={styles.discountApplyButtonText}>Apply</Text>
            </TouchableOpacity>
          </View>

          {/* Point Options */}
          <View style={styles.pointOptions}>
            {/* Leaf Points */}
            <View style={styles.discountOption}>
              {/* Icon + Label */}
              <View style={[styles.iconLabelContainer, styles.leafIconLabelContainer]}>
                <View style={[styles.iconContainer, styles.leafIconContainer]}>
                  <LeafGreenIcon width={32} height={32} />
                </View>
                <Text style={[styles.iconLabel, styles.leafIconLabel]}>Leaf Points</Text>
              </View>

              {/* Toggle */}
              <TouchableOpacity
                style={styles.toggle}
                onPress={onToggleLeafPoints}>
                <View style={styles.toggleText}>
                  <Text
                    style={
                      leafPointsEnabled
                        ? styles.toggleOnLabel
                        : styles.toggleOffLabel
                    }>
                    {leafPointsEnabled ? '+' : '-'}
                  </Text>
                  <Text
                    style={
                      leafPointsEnabled
                        ? styles.toggleOnNumber
                        : styles.toggleOffNumber
                    }>
                    {leafPointsEnabled
                      ? formatCurrencyFull(leafPoints)
                      : formatCurrencyFull(0)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.switchContainer,
                    leafPointsEnabled && styles.switchContainerActive,
                  ]}>
                  <View
                    style={[
                      styles.switchKnob,
                      leafPointsEnabled && styles.switchKnobActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* Plant Credits */}
            <View style={styles.plantCreditsOption}>
              {/* Icon + Label */}
              <View style={[styles.iconLabelContainer, styles.plantIconLabelContainer]}>
                <View style={[styles.iconContainer, styles.plantIconContainer]}>
                  <PlantVioletIcon width={32} height={32} />
                </View>
                <Text style={[styles.iconLabel, styles.plantIconLabel]}>Plant Credits</Text>
              </View>

              {/* Toggle */}
              <TouchableOpacity
                style={styles.toggle}
                onPress={onTogglePlantCredits}>
                <View style={styles.toggleText}>
                  <Text
                    style={
                      plantCreditsEnabled
                        ? styles.toggleOnLabel
                        : styles.toggleOffLabel
                    }>
                    {plantCreditsEnabled ? '+' : '-'}
                  </Text>
                  <Text
                    style={
                      plantCreditsEnabled
                        ? styles.toggleOnNumber
                        : styles.toggleOffNumber
                    }>
                    {plantCreditsEnabled
                      ? formatCurrencyFull(plantCredits)
                      : formatCurrencyFull(0)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.switchContainer,
                    plantCreditsEnabled && styles.switchContainerActive,
                  ]}>
                  <View
                    style={[
                      styles.switchKnob,
                      plantCreditsEnabled && styles.switchKnobActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </View>

            {/* Shipping Credits */}
            <View style={styles.shippingCreditsOption}>
              {/* Icon + Label */}
              <View style={[styles.iconLabelContainer, styles.shippingIconLabelContainer]}>
                <View style={[styles.iconContainer, styles.shippingIconContainer]}>
                  <TruckBlueIcon width={32} height={32} />
                </View>
                <Text style={[styles.iconLabel, styles.shippingIconLabel]}>Shipping Credits</Text>
              </View>

              {/* Toggle */}
              <TouchableOpacity
                style={styles.toggle}
                onPress={onToggleShippingCredits}>
                <View style={styles.toggleText}>
                  <Text
                    style={
                      shippingCreditsEnabled
                        ? styles.toggleOnLabel
                        : styles.toggleOffLabel
                    }>
                    {shippingCreditsEnabled ? '+' : '-'}
                  </Text>
                  <Text
                    style={
                      shippingCreditsEnabled
                        ? styles.toggleOnNumber
                        : styles.toggleOffNumber
                    }>
                    {shippingCreditsEnabled
                      ? formatCurrencyFull(orderSummary.shippingCreditsDiscount)
                      : formatCurrencyFull(0)}
                  </Text>
                </View>
                <View
                  style={[
                    styles.switchContainer,
                    shippingCreditsEnabled && styles.switchContainerActive,
                  ]}>
                  <View
                    style={[
                      styles.switchKnob,
                      shippingCreditsEnabled && styles.switchKnobActive,
                    ]}
                  />
                </View>
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Final Total */}
        <View style={styles.finalTotal}>
          <View style={styles.finalTotalRow}>
            <Text style={styles.finalTotalLabel}>Total</Text>
            <Text style={styles.finalTotalNumber}>
              {formatCurrencyFull(orderSummary.finalTotal)}
            </Text>
          </View>
        </View>
      </View>
    </>
  );
};

export default OrderSummary;
