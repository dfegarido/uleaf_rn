import React from 'react';
import { View, Text } from 'react-native';
import FlightIcon from '../../../../assets/buyer-icons/plane-gray.svg';
import ShippingMethodLabel from '../../../../components/ShippingMethodLabel/ShippingMethodLabel';
import styles from './styles/PlantListStyles';

/**
 * Plant list component for checkout screen
 */
const PlantList = ({ plantItems = [], renderCountryFlag, PlantItemComponent, onPlantPress }) => {
  console.log('🌿 [PlantList] Rendering with plantItems:', {
    count: plantItems.length,
    items: plantItems.map(item => ({
      plantCode: item.plantCode,
      name: item.name,
      hasImage: !!item.image,
      hasPrice: !!item.price,
      quantity: item.quantity,
    })),
  });

  if (!plantItems || plantItems.length === 0) {
    console.log('⚠️ [PlantList] No plantItems to render');
    return (
      <View style={styles.plantList}>
        <Text>No plants in this order</Text>
      </View>
    );
  }

  return (
    <View style={styles.plantList}>
      {/* Dynamic Plant Items */}
      {plantItems.map((item, index) => {
        console.log(`🌿 [PlantList] Rendering item ${index}:`, {
          plantCode: item.plantCode,
          name: item.name,
          image: item.image,
          price: item.price,
          quantity: item.quantity,
        });
        
        return (
        <View key={item.id || item.plantCode || index} style={styles.plantItemWrapper}>
          <PlantItemComponent
            image={item.image}
            name={item.name}
            variation={item.variation}
            size={item.size}
            price={item.price}
            quantity={item.quantity}
            title={item.title}
            country={item.country}
            shippingMethod={item.shippingMethod}
            listingType={item.listingType}
            discount={item.discount}
            originalPrice={item.originalPrice}
            hasAirCargo={item.hasAirCargo}
            onPress={() => onPlantPress(item)}
          />

          {/* Details for each item */}
          <View style={styles.plantItemDetails}>
            {/* Title + Country */}
            <View style={styles.titleCountry}>
              <Text style={styles.titleText}>
                {item.title || 'Rare Tropical Plants from Thailand'}
              </Text>

              {/* Country */}
              <View style={styles.countryContainer}>
                <Text style={styles.countryText}></Text>
                {renderCountryFlag(item.country)}
              </View>
            </View>

            {/* Shipping Method */}
            <View style={styles.plantShipping}>
              <ShippingMethodLabel shippingMethod={item.shippingMethod} />
            </View>

            {/* Flight Info (if available from cart) */}
            {item.flightInfo && (
              <View style={styles.plantShipping}>
                <View style={styles.shippingContent}>
                  <FlightIcon
                    width={24}
                    height={24}
                    style={styles.airCargoIcon}
                  />
                  <Text style={styles.shippingText}>{item.flightInfo}</Text>
                </View>
              </View>
            )}

            {/* Air Cargo Option (if available) */}
            {item.hasAirCargo && !item.flightInfo && (
              <View style={styles.plantShipping}>
                <View style={styles.shippingContent}>
                  <FlightIcon
                    width={24}
                    height={24}
                    style={styles.airCargoIcon}
                  />
                  <Text style={styles.shippingText}>
                    Plant / Wholesale Air Cargo
                  </Text>
                </View>
              </View>
            )}
          </View>
        </View>
        );
      })}
    </View>
  );
};

export default PlantList;
