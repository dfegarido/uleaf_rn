import React, {useEffect, useRef} from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  SafeAreaView,
  StatusBar,
  Image,
} from 'react-native';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import DiscountBadge from '../../../components/DiscountBadge/DiscountBadge';

import LeftIcon from '../../../assets/icons/greylight/caret-left-regular.svg';
import HeartIcon from '../../../assets/icons/greylight/heart-regular.svg';
import HeartListIcon from '../../../assets/icons/greylight/list-heart.svg';
import QuestionIcon from '../../../assets/icons/greylight/question-regular.svg';
import PinIcon from '../../../assets/icons/greylight/pin-light.svg';
import InchesIcon from '../../../assets/icons/greylight/inches.svg';

import BackgroundCarousel from '../../../components/BackgroundCarousel';

import {globalStyles} from '../../../assets/styles/styles';

const images = [
  require('../../../assets/images/bigplant.png'),
  require('../../../assets/images/bigplant.png'),
  require('../../../assets/images/bigplant.png'),
];

const screenWidth = Dimensions.get('window').width;
const screenHeight = Dimensions.get('window').height;

const ScreenMyStoreDetail = ({navigation, route}) => {
  const {
    id,
    image,
    plantName,
    subPlantName,
    listingCode,
    listingType,
    potSize,
    price,
    discountPercent,
    discountPrice,
    heartCount,
    isPin,
  } = route.params;
  const insets = useSafeAreaInsets();
  const scrollViewRef = useRef(null);

  const likeCount = '5.3K';

  //   useEffect(() => {
  //     setTimeout(() => {
  //       scrollViewRef.current?.scrollToEnd({animated: false});
  //     }, 300);
  //   }, []);

  return (
    <SafeAreaView style={{flex: 1, backgroundColor: '#fff'}}>
      {/* Fullscreen Background Carousel */}
      <View style={StyleSheet.absoluteFill}>
        <BackgroundCarousel
          images={images}
          width={screenWidth}
          height={screenHeight * 0.5}
        />
      </View>

      {/* Foreground ScrollView Content */}
      <ScrollView
        style={[styles.container, {paddingTop: insets.top}]}
        stickyHeaderIndices={[0]}>
        {/* Sticky Header */}
        <View style={[styles.stickyHeader, {paddingBottom: 10}]}>
          <View style={styles.header}>
            <TouchableOpacity
              onPress={() => navigation.goBack()}
              style={[
                styles.iconButton,
                {
                  borderWidth: 1,
                  borderColor: '#CDD3D4',
                  padding: 10,
                  borderRadius: 10,
                  backgroundColor: '#fff',
                },
              ]}>
              <LeftIcon width={30} height={30} />
            </TouchableOpacity>
          </View>
        </View>
        {/* Top blocker area — allows carousel to be visible */}
        <View style={{height: screenHeight * 0.38}} />

        {/* Foreground Content */}
        <View style={styles.contents}>
          <View
            style={{
              borderBottomColor: '#E4E7E9',
              borderBottomWidth: 1,
              paddingBottom: 20,
            }}>
            <View style={[{flexDirection: 'column'}, {paddingHorizontal: 20}]}>
              <Text style={globalStyles.textXLPrimaryDark}>{plantName}</Text>
              <View
                style={{
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                <Text style={globalStyles.textMDGrayDark}>{subPlantName}</Text>
                {listingCode != 'L1' && (
                  <View
                    style={{
                      backgroundColor: '#202325',
                      padding: 5,
                      borderRadius: 10,
                    }}>
                    <Text style={{color: '#fff'}}>{listingType}</Text>
                  </View>
                )}
              </View>
              <View style={[{flexDirection: 'row'}]}>
                <Text style={[globalStyles.textMDGreyLight]}>Mutation: </Text>
                <Text style={globalStyles.textMDGrayDark}>{subPlantName}</Text>
              </View>
            </View>
          </View>
          <View
            style={{
              borderBottomColor: '#E4E7E9',
              borderBottomWidth: 1,
              paddingVertical: 10,
            }}>
            <View
              style={[
                {
                  paddingHorizontal: 20,
                  flexDirection: 'row',
                  justifyContent: 'space-between',
                },
              ]}>
              <View style={{flexDirection: 'row'}}>
                <HeartIcon widht={20} height={20}></HeartIcon>
                <Text
                  style={[globalStyles.textMDGreyLight, {paddingRight: 10}]}>
                  {heartCount}
                </Text>
                <HeartListIcon widht={20} height={20}></HeartListIcon>
                <Text
                  style={[globalStyles.textMDGreyLight, {paddingRight: 10}]}>
                  {likeCount}
                </Text>
                <QuestionIcon widht={20} height={20}></QuestionIcon>
              </View>
              <View style={{flexDirection: 'row'}}>
                <PinIcon widht={20} height={20}></PinIcon>
                <Text
                  style={[globalStyles.textMDGreyLight, {paddingRight: 10}]}>
                  Pin
                </Text>
              </View>
            </View>
          </View>
          <View
            style={{
              borderBottomColor: '#E4E7E9',
              borderBottomWidth: 1,
              paddingVertical: 20,
            }}>
            <View
              style={[
                {
                  paddingHorizontal: 20,
                  flexDirection: 'column',
                  justifyContent: 'space-between',
                },
              ]}>
              {/* Price */}
              <View
                style={[
                  {
                    flexDirection: 'row',
                  },
                ]}>
                <Text style={[globalStyles.textXXLGAccent, {paddingRight: 10}]}>
                  {price}
                </Text>
                {discountPercent != '' && (
                  <DiscountBadge offPercentage={discountPercent} />
                )}
              </View>
              {/* Price */}
              {/* Discount Price */}
              <View>
                {discountPrice != '' && (
                  <Text
                    style={[globalStyles.textLGGreyLight, styles.strikeText]}>
                    {discountPrice}
                  </Text>
                )}
              </View>
              {/* Discount Price */}
              {/* Pot Size */}
              <View style={{alignItems: 'flex-start', paddingTop: 10}}>
                <View style={{flexDirection: 'row'}}>
                  <Text style={globalStyles.textMDGrayDark}>Pot size </Text>
                  <Text style={globalStyles.textMDGreyLight}>
                    2"-4" (5 to 11 cm)
                  </Text>
                </View>
                <View style={{flexDirection: 'row'}}>
                  {potSize.map((parsePotSize, index) => (
                    <View
                      style={{paddingRight: 10, paddingTop: 10}}
                      key={index}>
                      <Image
                        style={styles.image}
                        source={{
                          uri: 'https://via.placeholder.com/350x150.png?text=Spring+Plant+Fair',
                        }}
                      />
                      <View style={[styles.badgeContainer]}>
                        <Text
                          style={[
                            styles.badge,
                            {
                              color: globalStyles.textMDGrayDark,
                              // backgroundColor: '#E4E7E9',
                            },
                          ]}>
                          {parsePotSize}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              </View>
              {/* Pot Size */}
            </View>
          </View>

          {/* Approximate */}
          <View
            style={{
              paddingVertical: 20,
              paddingHorizontal: 20,
            }}>
            {potSize.map((parsePotSize, index) => (
              <View style={{paddingTop: 10}} key={index}>
                <View style={{flexDirection: 'row'}}>
                  <InchesIcon width={20} height={20} />
                  <Text style={{paddingLeft: 10}}>
                    Below 12 inches {`(< 30cm)`}
                  </Text>
                </View>
                <Text style={{paddingLeft: 30}}>{parsePotSize}</Text>
              </View>
            ))}
          </View>
          {/* Approximate */}
          {/* Button */}
          <TouchableOpacity
            style={{
              position: 'absolute',
              bottom: 0,
              paddingBottom: 10,
              width: '100%',
              paddingHorizontal: 20,
            }}>
            <View style={[globalStyles.primaryButton, {alignItems: 'center'}]}>
              <Text style={{color: '#fff', fontWeight: 'bold'}}>
                Manage Listing
              </Text>
            </View>
          </TouchableOpacity>
          {/* Button */}
        </View>
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingLeft: 10,
    paddingRight: 20,
  },
  iconButton: {
    marginHorizontal: 4,
    alignItems: 'center',
  },
  stickyHeader: {
    backgroundColor: 'transparent',
    zIndex: 10,
    paddingTop: 12,
    // marginBottom: 20,
  },
  contents: {
    paddingTop: 20,
    paddingBottom: 40,
    backgroundColor: '#fff',
    borderTopLeftRadius: 30,
    borderTopRightRadius: 30,
    minHeight: screenHeight * 0.9,
  },
  strikeText: {
    textDecorationLine: 'line-through', // This adds the line in the middle
    // color: 'black',
  },
  badgeContainer: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  badge: {
    padding: 5,
    borderColor: '#fff',
    borderRadius: 10,
    borderWidth: 1,
  },
  image: {
    width: 80,
    height: 126,
    borderRadius: 12,
    backgroundColor: '#ccc',
  },
});

export default ScreenMyStoreDetail;
