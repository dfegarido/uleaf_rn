/* eslint-disable react-native/no-inline-styles */
import React, {useState, useRef, useEffect} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useFocusEffect} from '@react-navigation/native';
import {useAuth} from '../../../auth/AuthProvider';
import SearchIcon from '../../../assets/icons/greylight/magnifying-glass-regular';
import Wishicon from '../../../assets/buyer-icons/wish-list.svg';
import AvatarIcon from '../../../assets/images/avatar.svg';
import SortIcon from '../../../assets/icons/greylight/sort-arrow-regular.svg';
import DownIcon from '../../../assets/icons/greylight/caret-down-regular.svg';
import {InputGroupLeftIcon} from '../../../components/InputGroup/Left';
import PriceDropIcon from '../../../assets/buyer-icons/price-drop-icons.svg';
import NewArrivalsIcon from '../../../assets/buyer-icons/megaphone.svg';
import PromoBadge from '../../../components/PromoBadge/PromoBadge';
import PriceTagIcon from '../../../assets/buyer-icons/tag-bold.svg';
import UnicornIcon from '../../../assets/buyer-icons/unicorn.svg';
import Top5Icon from '../../../assets/buyer-icons/hand-heart.svg';
import LeavesIcon from '../../../assets/buyer-icons/leaves.svg';
import GrowersIcon from '../../../assets/buyer-icons/growers-choice-icon.svg';
import WholesaleIcon from '../../../assets/buyer-icons/wholesale-plants-icon.svg';
import PhilippinesIcon from '../../../assets/buyer-icons/philippines-flag.svg';
import ThailandIcon from '../../../assets/buyer-icons/thailand-flag.svg';
import IndonesiaIcon from '../../../assets/buyer-icons/indonesia-flag.svg';
import DropDownIcon from '../../../assets/buyer-icons/drop-down.svg';
import {
  genus1,
  genus2,
  genus3,
  genus4,
  genus5,
  genus6,
  genus7,
  genus8,
  event1,
  event2,
} from '../../../assets/buyer-icons/png';

import {InfoCard} from '../../../components/InfoCards';
import ScreenWishlist from './ScreenWishlist';
import {PlantItemCard} from '../../../components/PlantItemCard';
import {ReusableActionSheet} from '../../../components/ReusableActionSheet';
import {
  getSortApi,
  getGenusApi,
  getVariegationApi,
  getBrowsePlantByGenusApi,
} from '../../../components/Api';
import NetInfo from '@react-native-community/netinfo';
import {retryAsync} from '../../../utils/utils';

const countryData = [
  {
    src: ThailandIcon,
    label: 'Thailand',
  },
  {
    src: IndonesiaIcon,
    label: 'Indonesia',
  },
  {
    src: PhilippinesIcon,
    label: 'Philippines',
  },
];

const browseMorePlantsData = [
  {
    id: 1,
    flag: ThailandIcon,
    title: 'Ficus lyrata',
    subtitle: 'Inner Variegated',
    price: '$65.27',
    likes: '5K',
    isWishlisted: false,
  },
  {
    id: 2,
    flag: ThailandIcon,
    title: 'Ficus lyrata',
    subtitle: 'Inner Variegated',
    price: '$65.27',
    likes: '5K',
    isWishlisted: false,
  },
  {
    id: 3,
    flag: ThailandIcon,
    title: 'Ficus lyrata',
    subtitle: 'Inner Variegated',
    price: '$65.27',
    likes: '5K',
    isWishlisted: false,
  },
  {
    id: 4,
    flag: ThailandIcon,
    title: 'Ficus lyrata',
    subtitle: 'Inner Variegated',
    price: '$65.27',
    likes: '5K',
    isWishlisted: false,
  },
  {
    id: 5,
    flag: ThailandIcon,
    title: 'Ficus lyrata',
    subtitle: 'Inner Variegated',
    price: '$65.27',
    likes: '5K',
    isWishlisted: false,
  },
  {
    id: 6,
    flag: ThailandIcon,
    title: 'Ficus lyrata',
    subtitle: 'Inner Variegated',
    price: '$65.27',
    likes: '5K',
    isWishlisted: false,
  },
];

const ScreenShop = ({navigation}) => {
  const {user} = useAuth();

  // Log auth token and user info when Shop tab is accessed
  useFocusEffect(
    React.useCallback(() => {
      const logAuthInfo = async () => {
        try {
          const token = await AsyncStorage.getItem('authToken');
          console.log('=== SHOP TAB ACCESS ===');
          console.log('Auth Token:', token);
          console.log('Firebase User:', user);
          console.log('========================');
        } catch (error) {
          console.error('Error getting auth token:', error);
        }
      };

      logAuthInfo();
    }, [user]),
  );

  // Filter modal state
  const [sortOptions, setSortOptions] = useState([]);
  const [genusOptions, setGenusOptions] = useState([]);
  const [variegationOptions, setVariegationOptions] = useState([]);
  const [reusableSort, setReusableSort] = useState('Newest to Oldest');
  const [reusableGenus, setReusableGenus] = useState([]);
  const [reusableVariegation, setReusableVariegation] = useState([]);
  const [code, setCode] = useState(null);
  const [showSheet, setShowSheet] = useState(false);

  // Price filter state
  const [priceOptions, setPriceOptions] = useState([
    {label: '$0 - $20', value: '$0 - $20'},
    {label: '$21 - $50', value: '$21 - $50'},
    {label: '$51 - $100', value: '$51 - $100'},
    {label: '$101 - $200', value: '$101 - $200'},
    {label: '$201 - $500', value: '$201 - $500'},
    {label: '$501 +', value: '$501 +'},
  ]);
  const [reusablePrice, setReusablePrice] = useState('');

  // Dynamic genus data state
  const [dynamicGenusData, setDynamicGenusData] = useState([]);
  const [loadingGenusData, setLoadingGenusData] = useState(true);

  // Load sort, genus, and variegation options on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        await Promise.all([
          loadSortByData(),
          loadGenusData(),
          loadVariegationData(),
          loadBrowseGenusData(),
        ]);
      } catch (error) {
        console.log('Error loading filter data:', error);
      }
    };

    fetchData();
  }, []);

  // Reload genus data when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      const reloadGenusData = async () => {
        try {
          await loadBrowseGenusData();
        } catch (error) {
          console.log('Error reloading genus data on focus:', error);
        }
      };

      reloadGenusData();
    }, []),
  );

  const loadSortByData = async () => {
    // For buyer shop, use hardcoded sort options that match the UI requirements
    const buyerSortOptions = [
      {label: 'Newest to Oldest', value: 'Newest to Oldest'},
      {label: 'Price Low to High', value: 'Price Low to High'},
      {label: 'Price High to Low', value: 'Price High to Low'},
      {label: 'Most Loved', value: 'Most Loved'},
    ];

    setSortOptions(buyerSortOptions);
  };

  const loadGenusData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getGenusApi(), 10, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load genus api');
    }

    let localGenusData = res.data.map(item => ({
      label: item.name,
      value: item.name,
      genusName: item.name,
      src: genus2,
      id: item.id,
      isWishlisted: false,
      isLiked: false,
      isViewed: false,
      isAddedToCart: false,
      isAddedToWishlist: false,
    }));

    setGenusOptions(localGenusData);
  };

  const loadVariegationData = async () => {
    let netState = await NetInfo.fetch();
    if (!netState.isConnected || !netState.isInternetReachable) {
      throw new Error('No internet connection.');
    }

    const res = await retryAsync(() => getVariegationApi(), 3, 1000);

    if (!res?.success) {
      throw new Error(res?.message || 'Failed to load variegation api');
    }

    let localVariegationData = res.data.map(item => ({
      label: item.name,
      value: item.name,
    }));

    setVariegationOptions(localVariegationData);
  };

  const loadBrowseGenusData = async () => {
    try {
      setLoadingGenusData(true);
      console.log('Starting to load browse genus data...');

      let netState = await NetInfo.fetch();
      if (!netState.isConnected || !netState.isInternetReachable) {
        throw new Error('No internet connection.');
      }
      console.log('Network connection verified');

      // Call the browse plants by genus API to get all genera with representative images
      const browseRes = await retryAsync(
        () => getBrowsePlantByGenusApi(),
        3,
        1000,
      );
      console.log('Browse plants API response received:', browseRes);

      if (!browseRes?.success) {
        throw new Error(
          browseRes?.message || 'Failed to load browse genus data',
        );
      }

      // Ensure we have genus groups data from the API
      if (
        !browseRes.genusGroups ||
        !Array.isArray(browseRes.genusGroups) ||
        browseRes.genusGroups.length === 0
      ) {
        throw new Error('No genus groups data received from API');
      }

      console.log('Raw genus groups data:', browseRes.genusGroups);

      // Map the API response to the expected format with representative images
      const genusImages = [
        genus1,
        genus2,
        genus3,
        genus4,
        genus5,
        genus6,
        genus7,
        genus8,
      ];

      const mappedGenusData = browseRes.genusGroups.map((genusGroup, index) => {
        let imageSource = genusImages[index % genusImages.length]; // Fallback to static image

        // Use the representative image from the API if available
        if (genusGroup.representativeImage) {
          imageSource = {uri: genusGroup.representativeImage};
        }

        return {
          src: imageSource,
          label: genusGroup.genus,
          genusName: genusGroup.genus,
          plantCount: genusGroup.plantCount,
          speciesCount: genusGroup.speciesCount,
          priceRange: genusGroup.priceRange,
        };
      });

      console.log(
        'Successfully loaded dynamic genus data:',
        mappedGenusData.length,
        'items',
      );
      console.log('Mapped genus data:', mappedGenusData);
      setDynamicGenusData(mappedGenusData);
    } catch (error) {
      console.error('Error loading browse genus data:', error);
      console.error('Error details:', {
        message: error.message,
        stack: error.stack,
      });
      // Don't fallback to static data - keep loading state or show error
      setDynamicGenusData([]);
      // You could show a user-friendly error message here
    } finally {
      setLoadingGenusData(false);
    }
  };

  const handleFilterView = () => {
    // Handle filter application here
    if (code === 'SORT') {
      console.log('Applied sort filter:', reusableSort);
    } else if (code === 'PRICE') {
      console.log('Applied price filter:', reusablePrice);
    } else if (code === 'GENUS') {
      console.log('Applied genus filter:', reusableGenus);
    } else if (code === 'VARIEGATION') {
      console.log('Applied variegation filter:', reusableVariegation);
    }
    setShowSheet(false);
  };

  const onPressFilter = pressCode => {
    setCode(pressCode);
    setShowSheet(true);
  };

  const onGenusPress = async genusName => {
    console.log('Genus pressed:', genusName);
    try {
      // Fetch plants for this specific genus using the browse API
      const browseRes = await getBrowsePlantByGenusApi(genusName);
      console.log(`Plants for ${genusName}:`, browseRes);

      if (browseRes?.success && browseRes.genusGroups) {
        // Find the specific genus group
        const genusGroup = browseRes.genusGroups.find(
          group => group.genus.toLowerCase() === genusName.toLowerCase(),
        );

        if (genusGroup) {
          console.log(`Found genus group for ${genusName}:`, genusGroup);
          // Navigate to a filtered view with the genus data
          // For example: navigation.navigate('FilteredPlants', {
          //   genus: genusName,
          //   genusGroup: genusGroup
          // });
        } else {
          console.log(`No genus group found for ${genusName}`);
        }
      } else {
        console.log(`No data found for ${genusName}`);
      }
    } catch (error) {
      console.error(`Error fetching plants for ${genusName}:`, error);
    }
  };

  const retryLoadGenusData = () => {
    console.log('Retrying to load genus data...');
    loadBrowseGenusData();
  };

  const filterOptions = [
    {label: 'Sort', leftIcon: SortIcon},
    {label: 'Price', rightIcon: DownIcon},
    {label: 'Genus', rightIcon: DownIcon},
    {label: 'Variegation', rightIcon: DownIcon},
    {label: 'Country', rightIcon: DownIcon},
    {label: 'Shipping Index', rightIcon: DownIcon},
    {label: 'Acclimation Index', rightIcon: DownIcon},
    {label: 'Listing Type', rightIcon: DownIcon},
  ];

  const promoBadges = [
    {label: 'Price Drop', icon: PriceDropIcon},
    {label: 'New Arrivals', icon: NewArrivalsIcon},
    {label: 'Latest Nursery Drop', icon: LeavesIcon},
    {label: 'Below $20', icon: PriceTagIcon},
    {label: 'Unicorn', icon: UnicornIcon},
    {label: 'Top 5 Buyer Wish List', icon: Top5Icon},
  ];

  const onGrowersPress = () => {
    console.log('Growers Pressed');
  };
  const onWholesalePress = () => {
    console.log('Wholesale Pressed');
  };

  const imageData = [
    {
      src: event1,
      label: 'Deals, Rewards & News',
    },
    {
      src: event2,
      label: 'Deals, Rewards & News',
    },
  ];

  const HEADER_HEIGHT = 110;

  const scrollViewRef = useRef(null);

  const [browseMorePlants, setBrowseMorePlants] =
    useState(browseMorePlantsData);

  return (
    <>
      <View style={styles.stickyHeader}>
        <View style={styles.header}>
          <View style={{flex: 1}}>
            <InputGroupLeftIcon
              IconLeftComponent={SearchIcon}
              placeholder={'Search ileafU'}
            />
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('ScreenWishlist')}>
              <Wishicon width={40} height={40} />
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate('ScreenProfile')}>
              <AvatarIcon width={40} height={40} />
            </TouchableOpacity>
          </View>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          ref={scrollViewRef}
          style={{flexGrow: 0, paddingVertical: 4}}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 10,
            alignItems: 'flex-start',
            paddingHorizontal: 10,
          }}>
          {filterOptions.map((option, idx) => (
            <TouchableOpacity
              key={option.label}
              onPress={() => {
                if (option.label === 'Sort') {
                  onPressFilter('SORT');
                } else if (option.label === 'Price') {
                  onPressFilter('PRICE');
                } else if (option.label === 'Genus') {
                  onPressFilter('GENUS');
                } else if (option.label === 'Variegation') {
                  onPressFilter('VARIEGATION');
                }
              }}
              style={{
                borderRadius: 12,
                borderWidth: 1,
                borderColor: '#CDD3D4',
                padding: 8,
                marginTop: 5,
                flexDirection: 'row',
                alignItems: 'center',
              }}>
              {option.leftIcon && (
                <option.leftIcon
                  width={20}
                  height={20}
                  style={{marginRight: 4}}
                />
              )}
              <Text style={{fontSize: 14, fontWeight: '500', color: '#393D40'}}>
                {option.label}
              </Text>
              {option.rightIcon && (
                <option.rightIcon
                  width={20}
                  height={20}
                  style={{marginLeft: 4}}
                />
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>
      <ScrollView
        ref={scrollViewRef}
        style={[styles.body, {paddingTop: HEADER_HEIGHT}]}
        contentContainerStyle={{paddingBottom: 170}}>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          style={{flexGrow: 0, paddingVertical: 1}}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 6,
            alignItems: 'flex-start',
            paddingHorizontal: 9,
          }}>
          {promoBadges.map(badge => (
            <PromoBadge
              key={badge.label}
              icon={badge.icon}
              label={badge.label}
              style={{marginRight: 5}}
            />
          ))}
        </ScrollView>
        <View
          style={{
            flexDirection: 'row',
            gap: 10,
            paddingHorizontal: 8,
            paddingVertical: 10,
          }}>
          <InfoCard
            title={"Grower's\nChoice"}
            subtitle="Explore"
            IconComponent={GrowersIcon}
            backgroundColor="#C9F0FF"
            onPress={onGrowersPress}
          />
          <InfoCard
            title={'Wholesale\nPlants'}
            subtitle="Browse"
            IconComponent={WholesaleIcon}
            backgroundColor="#ECFCE5"
            onPress={onWholesalePress}
          />
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: '#393D40',
          }}>
          Deals, Rewards & Latest News
        </Text>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={{
            flexDirection: 'row',
            gap: 10,
            alignItems: 'flex-start',
            paddingHorizontal: 10,
          }}
          style={{flexGrow: 0}}>
          {imageData.map((item, idx) => (
            <View key={idx} style={{width: 275}}>
              <Image
                source={item.src}
                style={{width: 260, height: 120, borderRadius: 16}}
              />
              <Text
                style={{
                  fontSize: 13,
                  fontWeight: '900',
                  color: '#393D40',
                  marginTop: 4,
                  textAlign: 'left',
                  paddingHorizontal: 5,
                }}>
                {item.label}
              </Text>
            </View>
          ))}
        </ScrollView>
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: '#393D40',
            marginTop: 10,
          }}>
          Browse Plants by Genus
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            justifyContent: 'space-between',
            paddingHorizontal: 12,
            marginTop: 10,
          }}>
          {loadingGenusData ? (
            // Loading state
            Array.from({length: 9}).map((_, idx) => (
              <View
                key={idx}
                style={{
                  width: '30%',
                  marginBottom: 18,
                  alignItems: 'center',
                }}>
                <View
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 12,
                    marginBottom: 6,
                    backgroundColor: '#f0f0f0',
                  }}
                />
                <View
                  style={{
                    width: 60,
                    height: 14,
                    backgroundColor: '#f0f0f0',
                    borderRadius: 4,
                  }}
                />
              </View>
            ))
          ) : dynamicGenusData.length > 0 ? (
            // Show dynamic data from API
            dynamicGenusData.map((item, idx) => (
              <TouchableOpacity
                key={idx}
                style={{
                  width: '30%',
                  marginBottom: 18,
                  alignItems: 'center',
                }}
                onPress={() => onGenusPress(item.genusName)}>
                <Image
                  source={item.src}
                  style={{
                    width: 110,
                    height: 110,
                    borderRadius: 12,
                    marginBottom: 6,
                  }}
                  resizeMode="cover"
                  onError={() => {
                    console.log(`Failed to load image for ${item.label}`);
                  }}
                />
                <Text
                  style={{
                    fontSize: 14,
                    fontWeight: '800',
                    color: '#393D40',
                    textAlign: 'center',
                    textTransform: 'capitalize',
                  }}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            ))
          ) : (
            // Show error state when no data is available
            <View
              style={{
                width: '100%',
                padding: 20,
                alignItems: 'center',
              }}>
              <Text
                style={{
                  fontSize: 16,
                  color: '#666',
                  textAlign: 'center',
                  marginBottom: 15,
                }}>
                Unable to load genus data. Please check your connection and try
                again.
              </Text>
              <TouchableOpacity
                onPress={retryLoadGenusData}
                style={{
                  backgroundColor: '#539461',
                  paddingHorizontal: 20,
                  paddingVertical: 10,
                  borderRadius: 8,
                }}>
                <Text
                  style={{
                    color: '#fff',
                    fontSize: 14,
                    fontWeight: '600',
                  }}>
                  Retry
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: 'bold',
            paddingHorizontal: 12,
            paddingVertical: 10,
            color: '#393D40',
            marginTop: 10,
          }}>
          Explore Plants by Country
        </Text>
        <View
          style={{
            flexDirection: 'row',
            justifyContent: 'flex-start',
            gap: 5,
            paddingHorizontal: 12,
            marginTop: 8,
          }}>
          {countryData.map((item, idx) => (
            <TouchableOpacity
              key={idx}
              onPress={() => console.log(item.label)}
              style={{
                width: 110,
                height: 79,
                borderWidth: 1,
                borderColor: '#E3E6E8',
                borderRadius: 12,
                paddingHorizontal: 14,
                paddingVertical: 10,
                marginRight: 10,
                backgroundColor: '#fff',
              }}>
              <item.src width={40} height={40} resizeMode="cover" />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '900',
                  color: '#393D40',
                }}>
                {item.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
        <Text
          style={{
            fontSize: 20,
            fontWeight: '900',
            color: '#393D40',
            marginTop: 15,
            marginLeft: 12,
          }}>
          Browse More Plants
        </Text>
        <View
          style={{
            flexDirection: 'row',
            flexWrap: 'wrap',
            gap: 1,
            justifyContent: 'center',
          }}>
          {browseMorePlants.map((plant, idx) => (
            <PlantItemCard
              key={plant.id}
              flag={plant.flag}
              title={plant.title}
              subtitle={plant.subtitle}
              price={plant.price}
              likes={plant.likes}
              isWishlisted={plant.isWishlisted}
              onWishlistPress={() => {
                setBrowseMorePlants(prev =>
                  prev.map((p, i) =>
                    i === idx ? {...p, isWishlisted: !p.isWishlisted} : p,
                  ),
                );
              }}
            />
          ))}
        </View>
        <View style={{width: '100%', alignItems: 'center', marginTop: 15}}>
          <View style={{flexDirection: 'row', alignItems: 'center'}}>
            <Text style={styles.loadMoreText}>Load More</Text>
            <DropDownIcon width={16.5} height={9} />
          </View>
        </View>
      </ScrollView>

      {/* Sort Filter Modal */}
      <ReusableActionSheet
        code={code}
        visible={showSheet}
        onClose={() => setShowSheet(false)}
        sortOptions={sortOptions}
        genusOptions={genusOptions}
        variegationOptions={variegationOptions}
        priceOptions={priceOptions}
        sortValue={reusableSort}
        sortChange={setReusableSort}
        genusValue={reusableGenus}
        genusChange={setReusableGenus}
        variegationValue={reusableVariegation}
        variegationChange={setReusableVariegation}
        priceValue={reusablePrice}
        priceChange={setReusablePrice}
        handleSearchSubmit={handleFilterView}
      />
    </>
  );
};

const styles = StyleSheet.create({
  body: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    flex: 1,
    // padding: 16,
    backgroundColor: '#DFECDF',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-evenly',
    alignItems: 'center',
    paddingHorizontal: 13,
  },
  search: {
    flex: 1,
    backgroundColor: '#f1f1f1',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 8,
    marginRight: 10,
  },
  headerIcons: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginHorizontal: 4,
    alignItems: 'center',
  },
  liveTag: {
    color: 'red',
    fontSize: 10,
    marginTop: -4,
  },
  topNav: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: 10,
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  topNavItem: {
    backgroundColor: '#fff',
    borderColor: '#C0DAC2',
    borderWidth: 1,
    borderRadius: 10,
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
    height: 80,
  },
  topNavText: {
    fontSize: 12,
    marginTop: 4,
  },
  msgIcon: {
    position: 'relative',
  },
  msgBadge: {
    position: 'absolute',
    top: -4,
    right: -8,
    backgroundColor: 'red',
    borderRadius: 10,
    paddingHorizontal: 4,
  },
  msgBadgeText: {
    fontSize: 10,
    color: '#fff',
  },
  cardBlack: {
    height: 135,
    width: 224,
    backgroundColor: '#000',
    borderRadius: 10,
    padding: 16,
    flex: 1,
    marginRight: 8,
  },
  cardWhite: {
    backgroundColor: '#f7f7f7',
    borderColor: '#CDD3D4',
    borderWidth: 1,
    height: 135,
    width: 224,
    borderRadius: 10,
    padding: 16,
    flex: 1,
  },
  greenTag: {
    backgroundColor: '#23C16B',
    position: 'absolute',
    color: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 5,
    fontSize: 14,
    marginTop: 8,
    right: 10,
  },
  redPercentTag: {
    backgroundColor: '#FF5247',
    position: 'absolute',
    color: '#FFF',
    borderRadius: 10,
    paddingHorizontal: 5,
    fontSize: 14,
    marginTop: 8,
    right: 10,
  },
  redTag: {
    color: '#FF5252',
    fontSize: 12,
    marginTop: 4,
  },
  section: {
    marginTop: 24,
  },
  banner: {
    width: '100%',
    height: 150,
    borderRadius: 12,
    backgroundColor: '#ccc',
  },
  stickyHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    paddingTop: 12,
    backgroundColor: '#fff',
  },
  filterButton: {
    backgroundColor: '#fff',
    borderColor: '#C0DAC2',
    borderWidth: 1,
    borderRadius: 20,
    paddingHorizontal: 16,
    paddingVertical: 8,
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 4,
  },
  filterButtonText: {
    color: '#393D40',
    fontSize: 15,
  },
  loadMoreText: {
    fontSize: 16,
    fontWeight: '900',
    color: '#539461',
    marginRight: 8,
  },
});
export default ScreenShop;
