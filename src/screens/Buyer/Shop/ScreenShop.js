/* eslint-disable react-native/no-inline-styles */
import React, {useState, useRef} from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Image,
} from 'react-native';
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
} from '../../../assets/buyer-icons/png';

import {InfoCard} from '../../../components/InfoCards';
import ScreenWishlist from './ScreenWishlist';
import {PlantItemCard} from '../../../components/PlantItemCard';

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
      src: require('../../../assets/buyer-icons/png/image-1.png'),
      label: 'Deals, Rewards & News',
    },
    {
      src: require('../../../assets/buyer-icons/png/image-2.png'),
      label: 'Deals, Rewards & News',
    },
    {
      src: require('../../../assets/buyer-icons/png/image-3.png'),
      label: 'Deals, Rewards & News',
    },
  ];

  const genusData = [
    {
      src: genus1,
      label: 'Alocasia',
    },
    {
      src: genus2,
      label: 'Anthurium',
    },
    {
      src: genus3,
      label: 'Begonia',
    },
    {
      src: genus4,
      label: 'Hoya',
    },
    {
      src: genus5,
      label: 'Monstera',
    },
    {
      src: genus6,
      label: 'Scindapsus',
    },
    {
      src: genus7,
      label: 'Syngonium',
    },
    {
      src: genus8,
      label: 'Philodendron',
    },
    {
      src: genus1,
      label: 'Others',
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
              placeholder={'Search I Leaf U'}
            />
          </View>

          <View style={styles.headerIcons}>
            <TouchableOpacity
              style={styles.iconButton}
              onPress={() => navigation.navigate(ScreenWishlist)}>
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
            <View
              key={option.label}
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
              <Text>{option.label}</Text>
              {option.rightIcon && (
                <option.rightIcon
                  width={20}
                  height={20}
                  style={{marginLeft: 4}}
                />
              )}
            </View>
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
          {genusData.map((item, idx) => (
            <View
              key={idx}
              style={{
                width: '30%',
                marginBottom: 18,
                alignItems: 'center',
              }}>
              <Image
                source={item.src}
                style={{
                  width: 110,
                  height: 110,
                  borderRadius: 12,
                  marginBottom: 6,
                }}
                resizeMode="cover"
              />
              <Text
                style={{
                  fontSize: 14,
                  fontWeight: '500',
                  color: '#393D40',
                  textAlign: 'center',
                }}>
                {item.label}
              </Text>
            </View>
          ))}
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
