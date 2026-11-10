/**
 * What the cleanup removes, and what it must never remove.
 * The safety-net test (__tests__/cleanupSafetyNet.test.js) checks this list
 * against the live import graph before and after every deletion.
 * Delete this folder and that test once the cleanup has shipped.
 */
module.exports = {
  // Source files no reachable module imports. Each must stay unreachable or be gone.
  deleteFiles: [
    // backups / temp / copies
    'src/screens/Admin/Discounts/BuyXGetY_temp.js',
    'src/screens/Admin/Discounts/BuyXGetY_backup.js',
    'src/components/Api/orderManagementApi.js.bak',
    'src/screens/Buyer/Orders/OrderDetailsScreen.js.bak',
    'src/components/Api/importTaxonomyDataApi_old.js',
    'src/components/Api/importTaxonomyDataApi_storage.js',
    'src/components/Api/importTaxonomyDataApi_base64.js',
    'src/components/Charts/CustomSalesChart copy.js',
    'src/components/ImagePicker/ImagePickerModal copy.js',
    'src/components/InputOtp/OtpInput copy.js',
    'src/screens/Seller/Home/components/PayoutCard copy.js',
    'src/screens/Seller/Listing/components/ListingTable copy.js',
    'src/assets/icontabs/sell_backup.svg',
    // screens and helpers nothing imports
    'src/screens/Buyer/Shop/ScreenPlantDetailLive.js',
    'src/screens/Admin/PlantCredits/PlantCreditWalletScreen.js',
    'src/screens/Buyer/Profile/BuyerPlantCreditsScreen.js',
    'src/utils/fetchPlantCreditHistory.js',
    'src/utils/fetchBuyerListingsFromFirestore.js',
    'src/auth/migratePlantCatalogToTaxonomyApi.js',
    'src/auth/importCatalogSpeciesApi.js',
    'src/components/LocationSelector/EnhancedLocationSelector.js',
    'src/screens/Buyer/Checkout/PaymentSuccessScreen.js',
    'src/screens/Maintenance/MaintenanceScreen.js',
    'src/utils/locationApi.js',
    'src/screens/Admin/Home/paymentManagement.js',
    'src/screens/Admin/LeafTrail/Receiving/ReceivingSelectionFooter.js',
    'src/components/ApiEnvironmentSwitcher.js',
    'src/screens/Singup/ScreenSignupActivationNext.js',
    'src/utils/uploadImageToFirebaseProfile.js',
    'src/utils/ensureFirebaseApp.js',
    'src/utils/leafTrailModalProps.js',
    'src/config/shippingRules.js',
    'src/utils/formatDateMonthDay.js',
  ],

  // JS-only packages to drop from package.json -> files that import them but never
  // use the binding (dead imports, removed in the same step). No other importer allowed.
  deleteDeps: {
    'js-base64': [],
    dayjs: ['src/screens/Seller/Order/components/OrderActionSheet.js'],
  },

  // Packages no file imports but the build needs (native peers / Metro / Babel).
  // Removing any of these breaks the native build or bundling: the test keeps them.
  keepDeps: {
    '@react-native-community/datetimepicker': 'peer of react-native-modal-datetime-picker',
    '@react-native-firebase/app': 'native core required by @react-native-firebase/messaging',
    'react-native-pager-view': 'peer of react-native-tab-view',
    'react-native-screens': 'peer of @react-navigation/native-stack',
    'react-native-svg-transformer': 'Metro babelTransformerPath (metro.config.js)',
    'react-native-worklets': 'peer of react-native-reanimated 4',
  },

  // Imports that were already broken / undeclared before the cleanup started.
  // The count may shrink, never grow.
  knownBrokenImports: [
    'src/components/GroupChatModal/GroupChatModal.js -> ../../assets/icons/check-circle-solid.svg',
    'src/screens/Live/CreateLiveListingScreen.js -> ../../components/Api/listingApi',
  ],
  knownUndeclaredPackages: ['base64-js'],
};
