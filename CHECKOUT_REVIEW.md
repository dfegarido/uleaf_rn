# Checkout Screen - Comprehensive Review

## Overview
This document reviews all dependencies, controllers, components, and styles for the Checkout Screen before making updates.

## File Structure
```
Checkout/
├── CheckoutScreen.js (Main component)
├── controllers/
│   └── CheckoutController.js (Business logic hook)
├── components/
│   ├── AddressSection.js
│   ├── CheckoutBar.js
│   ├── FlightSelector.js
│   ├── OrderSummary.js
│   ├── PlantList.js
│   └── styles/
│       ├── AddressSectionStyles.js
│       ├── CheckoutBarStyles.js
│       ├── CheckoutScreenStyles.js
│       ├── FlightSelectorStyles.js
│       ├── OrderSummaryStyles.js
│       └── PlantListStyles.js
└── PaymentSuccessScreen.js
```

## 1. Main Component: CheckoutScreen.js

### Imports & Dependencies
- React Native components: `ScrollView`, `Text`, `TouchableOpacity`, `View`, `Modal`, `ActivityIndicator`, `Image`
- Safe area: `SafeAreaView` from `react-native-safe-area-context`
- URL polyfill: `setupURLPolyfill` from `react-native-url-polyfill`
- Assets: BackIcon, country flags (Indonesia, Philippines, Thailand)
- Components: `BrowseMorePlants`, `CheckoutBar`, `OrderSummary`, `AddressSection`, `FlightSelector`, `PlantList`
- Controller: `useCheckoutController` hook
- Utils: `formatCurrencyFull` from `../../../utils/formatCurrency`
- Styles: `./components/styles/CheckoutScreenStyles`

### Key Features
- Header with back button (navigates back via `navigateBack`)
- ScrollView containing:
  - AddressSection
  - FlightSelector
  - PlantList
  - OrderSummary
  - BrowseMorePlants
- Fixed CheckoutBar at bottom
- Loading modal during checkout

### Props Passed to Components

#### AddressSection
- `deliveryDetails` - address info
- `onUpdateDeliveryDetails` - handler for address updates

#### FlightSelector
- `lockedFlightDate` - locked flight date from existing orders
- `flightDateOptions` - array of available flight dates
- `selectedFlightDate` - currently selected flight date
- `checkingOrders` - loading state
- `shimmerAnim` - animation ref
- `disablePlantFlightSelection` - lock flag
- `flightLockInfo` - lock information object
- `lockedFlightKey` - normalized lock key
- `cargoDate` - cargo date state
- `onSelectFlightDate` - handler for selection
- `normalizeFlightKey` - helper function
- `formatFlightDateToISO` - helper function

#### PlantList
- `plantItems` - array of plant items
- `renderCountryFlag` - flag rendering function
- `PlantItemComponent` - custom component
- `onPlantPress` - handler (currently not implemented)

#### OrderSummary
- `quantityBreakdown` - quantity stats
- `orderSummary` - order totals
- `shippingCalculation` - shipping costs
- `shimmerAnim` - animation ref
- Toggle flags and handlers for credits/points
- Credit amounts

#### CheckoutBar
- `total` - final total
- `discount` - discount amount
- `loading` - loading state
- `selectedFlightDateIso` - selected date ISO
- `onCheckoutPress` - checkout handler

## 2. Controller: CheckoutController.js

### Dependencies
- React hooks: `useEffect`, `useMemo`, `useState`, `useRef`, `useCallback`
- React Native: `Alert`, `Animated`, `Easing`
- Navigation: `useFocusEffect`, `useNavigation`, `useRoute` from `@react-navigation/native`
- Firebase: `collection`, `onSnapshot`, `query`, `where` from `firebase/firestore`
- Firebase instance: `db` from `../../../../firebase`
- APIs:
  - `getAddressBookEntriesApi` from `../../../../components/Api`
  - `getBuyerProfileApi` from `../../../../components/Api/getBuyerProfileApi`
  - `checkoutApi` from `../../../../components/Api/checkoutApi`
  - `getBuyerOrdersApi` from `../../../../components/Api/orderManagementApi`
  - `calculateCheckoutShippingApi` from `../../../../components/Api/checkoutShippingApi`
- Utils:
  - `formatCurrencyFull` from `../../../../utils/formatCurrency`
  - `roundToCents` from `../../../../utils/money`

### Route Parameters Expected
```javascript
{
  cartItems: [],           // Array of cart items
  productData: [],         // Array of product data (may be empty!)
  useCart: true,          // Flag to use cart
  fromBuyNow: false,      // Flag for buy now flow
  plantData: null,        // Single plant data for buy now
  selectedPotSize: null,  // Pot size selection
  quantity: 1,            // Quantity
  plantCode: null,        // Plant code
  totalAmount: 0          // Total amount
}
```

### Key State
- `loading` - checkout loading state
- `deliveryDetails` - shipping address
- `cargoDate` - selected cargo date
- `lockedFlightDate` - locked date from existing orders
- `checkingOrders` - loading existing orders
- `selectedFlightDate` - selected flight date
- `shippingCalculation` - shipping costs breakdown
- `leafPoints`, `plantCredits`, `shippingCredits` - user credits
- Toggle states for various options

### Computed Values (useMemo)

#### plantItems
**ISSUE IDENTIFIED:**
- Line 128: `if (!cartItems.length || !productData.length) return [];`
- This returns empty array when `productData` is empty
- Cart screen only passes `cartItems`, NOT `productData`
- **Flight dates are in `cartItem.listingDetails.plantFlightDate`**

#### flightDateOptions
**ISSUE IDENTIFIED:**
- Currently extracts dates from `plantItems`
- If `plantItems` is empty (due to missing `productData`), returns empty array
- Needs to handle case when `productData` is missing
- Should generate Saturday options starting from earliest plant flight date

### Effects

#### useFocusEffect - Check Existing Orders
- Runs when screen comes into focus
- Empty dependency array (prevents infinite loop)
- Uses ref to access latest `flightDateOptions`

#### useEffect - Load Delivery Details
- Runs once on mount
- Fetches address book entries
- Sets default address

#### useEffect - Load User Profile
- Runs once on mount
- Fetches buyer profile
- Sets credits/points with null safety

#### useFocusEffect - Reload Address
- Reloads address when screen comes back into focus
- Helps refresh after address updates

#### useEffect - Fetch Shipping Calculation
- Runs when dependencies change
- Calculates shipping based on selected flight date
- Includes credits in calculation

## 3. Components Review

### AddressSection.js
**Status:** ✅ Fixed (has null safety)
- Safely handles undefined address
- Shows "No address selected" fallback
- Navigates to AddressBookScreen on press

### FlightSelector.js
**Status:** ⚠️ Needs Saturday generation
- Expects `flightDateOptions` array
- Each option needs: `date`, `iso`, `key`, `label`, `displayLabel`, `value`
- Displays "Sat" subtext for each option
- **ISSUE:** Shows empty when `flightDateOptions` is empty

### PlantList.js
**Status:** ✅ Working
- Maps through `plantItems`
- Uses `PlantItemComponent` from parent
- Shows flight info if available

### OrderSummary.js
**Status:** ⚠️ Depends on correct data structure
- Expects `quantityBreakdown.singlePlant` (fixed)
- Expects various `orderSummary` properties
- Shows shipping breakdown with toggles

### CheckoutBar.js
**Status:** ✅ Working
- Disables if no flight date selected
- Shows total and discount
- Handles loading state

## 4. Data Flow Issues

### Issue #1: Missing productData
**Location:** `CheckoutController.js:128`
```javascript
if (!cartItems.length || !productData.length) return [];
```
**Problem:** Cart screen doesn't pass `productData`, only `cartItems`

### Issue #2: Flight dates in cartItems
**Location:** Cart items have structure:
```javascript
{
  listingDetails: {
    plantFlightDate: "Aug 23" // or similar format
  }
}
```
**Problem:** Controller looks in `product.flightDates` but cart items have `listingDetails.plantFlightDate`

### Issue #3: Saturday generation
**Location:** `flightDateOptions` useMemo
**Problem:** Should generate Saturday options starting from earliest plant flight date, not just show exact dates

## 5. Style Files

All style files exist and are properly structured:
- CheckoutScreenStyles.js (main styles)
- FlightSelectorStyles.js (flight selector styles)
- AddressSectionStyles.js (address styles)
- OrderSummaryStyles.js (summary styles)
- CheckoutBarStyles.js (bar styles)
- PlantListStyles.js (plant list styles)

## 6. Recommendations

1. **Fix plantItems processing:**
   - Handle case when `productData` is empty
   - Use `cartItems` directly if `productData` missing
   - Extract flight dates from `cartItem.listingDetails.plantFlightDate`

2. **Fix flightDateOptions:**
   - Extract earliest flight date from plant items
   - Calculate next Saturday from that date
   - Generate 6 consecutive Saturday options
   - Format as "Aug 23" style labels

3. **Ensure data consistency:**
   - All plant items should preserve `listingDetails`
   - Flight dates should be normalized consistently

## 7. Current Known Issues

1. ✅ Fixed: Duplicate header (removed)
2. ✅ Fixed: Missing back button navigation (added)
3. ✅ Fixed: Quantity breakdown prop mismatch (fixed)
4. ✅ Fixed: React import issue (added React)
5. ✅ Fixed: API import paths (fixed relative paths)
6. ✅ Fixed: Infinite loop in getBuyerOrders (empty dependency array)
7. ✅ Fixed: Address null safety (added checks)
8. ⚠️ **OPEN:** Flight dates not appearing (needs Saturday generation)
9. ⚠️ **OPEN:** plantItems empty when productData missing (needs fix)

## Next Steps

Before making changes:
1. Fix `plantItems` to work without `productData`
2. Fix `flightDateOptions` to generate Saturdays from plant flight dates
3. Test data flow from cart → checkout
4. Verify Saturday date generation logic
5. Ensure proper formatting for display

