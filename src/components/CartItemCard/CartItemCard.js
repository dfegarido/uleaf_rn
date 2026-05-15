import React from 'react';
import {
  View,
  Image,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import MinusIcon from '../../assets/buyer-icons/minus.svg';
import PlusIcon from '../../assets/buyer-icons/plus.svg';
import CloseIcon from '../../assets/buyer-icons/close.svg';

const screenWidth = Dimensions.get('window').width;
const checkboxSize = Math.max(20, Math.min(28, screenWidth * 0.065));

const CartItemCard = ({
  image,
  name,
  subtitle,
  price,
  originalPrice,
  quantity,
  flightInfo,
  shippingInfo,
  flagIcon,
  checked,
  onRemove,
  onPress,
  onQuantityChange,
  availableQuantity,
  isUnavailable,
  listingType,
}) => {
  return (
    <View style={styles.cartCard}>
      <View style={[styles.cartTopCard, isUnavailable && styles.unavailableCard]}>
        <TouchableOpacity
          style={{flex: 1, flexDirection: 'row', position: 'relative'}}
          onPress={() => {
            if (isUnavailable) {
              if (checked) {
                setTimeout(() => {
                  onPress();
                }, 0);
              }
              return;
            }
            onPress();
          }}
          disabled={isUnavailable}
          activeOpacity={isUnavailable ? 1 : 0.7}
          accessibilityState={{ disabled: isUnavailable }}
          pointerEvents={isUnavailable ? 'none' : 'auto'}
        >
          {isUnavailable && (
            <View
              style={styles.blockingOverlay}
              pointerEvents="auto"
              onStartShouldSetResponder={() => true}
              onTouchStart={(e) => {
                e.stopPropagation();
              }}
            />
          )}
          <View style={{flexDirection: 'row', alignItems: 'flex-start'}}>
            <View
              style={[
                styles.cartImageContainer,
                {borderColor: (checked && !isUnavailable) ? '#539461' : 'transparent'},
              ]}>
              <Image
                source={image}
                style={[
                  styles.cartImage,
                  isUnavailable && styles.unavailableImage
                ]}
              />
              <View
                style={styles.cartCheckOverlay}
                pointerEvents={isUnavailable ? 'none' : 'auto'}
              >
                {isUnavailable ? (
                  <View style={[styles.uncheckedBox, styles.disabledCheckbox]}>
                    <View style={styles.disabledCheckboxInner} />
                  </View>
                ) : checked ? (
                  <View style={styles.checkedBox}>
                    <Text style={styles.checkmark}>✓</Text>
                  </View>
                ) : (
                  <View style={styles.uncheckedBox} />
                )}
              </View>
              {isUnavailable && (
                <View style={styles.soldOverlay}>
                  <View style={styles.soldBadge}>
                    <Text style={styles.soldText}>SOLD</Text>
                  </View>
                </View>
              )}
              {originalPrice && originalPrice > price && (
                <View style={styles.discountBadge}>
                  <Text style={styles.discountText}>
                    {Math.round(((originalPrice - price) / originalPrice) * 100)}% OFF
                  </Text>
                </View>
              )}
            </View>
            <View style={{flex: 1, marginLeft: 12}}>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'flex-start',
                }}>
                <Text style={[styles.cartName, isUnavailable && styles.unavailableText]}>{name}</Text>
              </View>
              <Text style={styles.cartSubtitle}>{subtitle}</Text>

              <View style={[styles.listingTypeBadge, isUnavailable && styles.unavailableBadge]}>
                <Text style={styles.listingTypeText}>{isUnavailable ? 'Unavailable' : (listingType || 'Single Plant')}</Text>
              </View>

              <View style={styles.priceQuantityRow}>
                <View style={styles.priceContainer}>
                  {originalPrice && originalPrice > price && (
                    <Text style={styles.originalPriceText}>
                      $ {(parseFloat(originalPrice) * quantity).toLocaleString('en-US', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}
                    </Text>
                  )}
                  <Text style={styles.totalItemPrice}>$ {(parseFloat(price) * quantity).toLocaleString('en-US', {
                    minimumFractionDigits: 2,
                    maximumFractionDigits: 2
                  })}</Text>
                </View>

                <View style={[styles.quantityStepper, isUnavailable && styles.disabledStepper]}>
                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => onQuantityChange(quantity - 1)}
                    disabled={quantity <= 1 || isUnavailable}>
                    <MinusIcon width={16} height={16} color={(quantity <= 1 || isUnavailable) ? '#CDD3D4' : '#556065'} />
                  </TouchableOpacity>

                  <View style={styles.quantityContainer}>
                    <Text style={styles.quantityText}>{quantity}</Text>
                  </View>

                  <TouchableOpacity
                    style={styles.stepperButton}
                    onPress={() => onQuantityChange(quantity + 1)}
                    disabled={quantity >= availableQuantity || isUnavailable}>
                    <PlusIcon width={16} height={16} color={(quantity >= availableQuantity || isUnavailable) ? '#CDD3D4' : '#556065'} />
                  </TouchableOpacity>
                </View>
              </View>
            </View>
          </View>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={onRemove}
          style={{paddingLeft: 8, justifyContent: 'flex-start', paddingTop: 5}}
        >
          <CloseIcon width={16} height={16} />
        </TouchableOpacity>
      </View>

      {isUnavailable && (
        <View style={styles.warningContainer}>
          <View style={styles.warningContent}>
            <View style={styles.infoIcon}>
              <View style={styles.infoIconInner}>
                <Text style={styles.infoIconText}>i</Text>
              </View>
            </View>
            <Text style={styles.warningText}>
              {availableQuantity === 0
                ? 'Snap, This plant has been sold.'
                : 'This item is no longer available and cannot be selected for checkout.'}
            </Text>
          </View>
        </View>
      )}

      <View style={styles.cartDetailsSection}>
        <View style={styles.cartFooterRow}>
          <Text style={styles.cartFooterText}>✈️ {flightInfo}</Text>
          <Text style={{fontSize: 18}}>{flagIcon}</Text>
        </View>
        <View style={styles.cartFooterRow}>
          <Text style={styles.cartFooterText}>🚚 {shippingInfo}</Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  cartCard: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingTop: 12,
    paddingHorizontal: 12,
    paddingBottom: 16,
    gap: 12,
    backgroundColor: '#F5F6F6',
    width: '100%',
  },
  cartTopCard: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: 12,
    gap: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignSelf: 'stretch',
    width: '100%',
  },
  unavailableCard: {
    opacity: 0.6,
    backgroundColor: '#F0F0F0',
  },
  cartImageContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'flex-start',
    padding: 0,
    gap: 8,
    width: 96,
    position: 'relative',
  },
  cartImage: {
    width: 96,
    height: 128,
    borderWidth: 3,
    borderColor: '#539461',
    borderRadius: 8,
  },
  unavailableImage: {
    opacity: 0.5,
  },
  blockingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
    zIndex: 10,
  },
  soldOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: 8,
  },
  soldBadge: {
    backgroundColor: '#E7522F',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 6,
  },
  soldText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: '700',
    fontFamily: 'Inter',
    letterSpacing: 1,
  },
  cartCheckOverlay: {
    position: 'absolute',
    top: 8,
    left: 8,
    width: checkboxSize,
    height: checkboxSize,
    justifyContent: 'center',
    alignItems: 'center',
  },
  uncheckedBox: {
    width: checkboxSize,
    height: checkboxSize,
    borderWidth: 2,
    borderColor: '#CDD3D4',
    borderRadius: 4,
    backgroundColor: '#FFFFFF',
  },
  checkedBox: {
    width: checkboxSize,
    height: checkboxSize,
    borderWidth: 2,
    borderColor: '#539461',
    borderRadius: 4,
    backgroundColor: '#539461',
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledCheckbox: {
    borderColor: '#E0E0E0',
    backgroundColor: '#F5F5F5',
    opacity: 0.5,
  },
  disabledCheckboxInner: {
    width: checkboxSize - 8,
    height: checkboxSize - 8,
    borderRadius: 2,
    backgroundColor: '#CCCCCC',
  },
  checkmark: {
    color: '#FFFFFF',
    fontSize: checkboxSize * 0.7,
    fontWeight: 'bold',
    lineHeight: checkboxSize,
  },
  discountBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 2,
    width: 96,
    height: 24,
    backgroundColor: '#FFE7E2',
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  discountText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#E7522F',
  },
  cartName: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    flex: 1,
  },
  cartSubtitle: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
    marginTop: 4,
  },
  listingTypeBadge: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 1,
    height: 24,
    backgroundColor: '#202325',
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginTop: 8,
  },
  listingTypeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 17,
    color: '#FFFFFF',
  },
  unavailableText: {
    color: '#999999',
    textDecorationLine: 'line-through',
  },
  unavailableBadge: {
    backgroundColor: '#999999',
  },
  disabledStepper: {
    opacity: 0.5,
    borderColor: '#CDD3D4',
  },
  priceQuantityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 0,
    gap: 12,
    alignSelf: 'stretch',
    height: 50,
    marginTop: 8,
  },
  priceContainer: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    padding: 0,
    gap: 4,
    flex: 1,
  },
  originalPriceText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    textDecorationLine: 'line-through',
    color: '#7F8D91',
  },
  totalItemPrice: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    color: '#539461',
  },
  quantityStepper: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 4,
    width: 96,
    height: 30,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#539461',
    borderRadius: 8,
  },
  stepperButton: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 0,
    width: 24,
    height: 24,
    borderRadius: 8,
  },
  quantityContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 4,
    width: 40,
    height: 30,
    flex: 1,
  },
  quantityText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    textAlign: 'center',
    color: '#393D40',
  },
  cartDetailsSection: {
    flexDirection: 'column',
    alignItems: 'flex-start',
    paddingHorizontal: 24,
    paddingVertical: 12,
    gap: 8,
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  cartFooterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 0,
    gap: 6,
    alignSelf: 'stretch',
    height: 24,
  },
  cartFooterText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#556065',
    flex: 1,
  },
  warningContainer: {
    flexDirection: 'column',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 8,
    gap: 8,
    width: '100%',
    height: 40,
    backgroundColor: '#FFE7E2',
    borderWidth: 1,
    borderColor: '#FBC4B7',
    borderRadius: 12,
    alignSelf: 'stretch',
  },
  warningContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 0,
    gap: 4,
    width: '100%',
    minHeight: 24,
  },
  infoIcon: {
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
    flexShrink: 0,
  },
  infoIconInner: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#E7522F',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoIconText: {
    color: '#FFFFFF',
    fontSize: 14,
    fontWeight: 'bold',
    fontFamily: 'Inter',
    lineHeight: 24,
    textAlign: 'center',
    width: '100%',
    height: '100%',
    textAlignVertical: 'center',
  },
  warningText: {
    flex: 1,
    minHeight: 22,
    fontSize: 16,
    lineHeight: 22,
    fontFamily: 'Inter',
    fontStyle: 'normal',
    fontWeight: '600',
    color: '#E7522F',
  },
});

export default CartItemCard;
