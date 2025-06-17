import React from 'react';
import {View, Dimensions, Image, StyleSheet, Text} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

const {width} = Dimensions.get('window');

// Static wish images
const wishImages = [
  require('../../../../assets/images/wish1.png'),
  require('../../../../assets/images/wish2.png'),
  require('../../../../assets/images/wish3.png'),
  require('../../../../assets/images/wish4.png'),
  require('../../../../assets/images/wish5.png'),
];

const CarouselSell = ({plantItems = []}) => {
  return (
    <View style={styles.screen}>
      <Carousel
        width={width * 0.9}
        height={150}
        data={plantItems}
        scrollAnimationDuration={1000}
        mode="parallax"
        modeConfig={{
          parallaxScrollingScale: 0.9,
          parallaxScrollingOffset: 50,
        }}
        renderItem={({item, index}) => (
          <View style={styles.itemContainer}>
            <Image
              source={{uri: item.uri}}
              style={styles.image}
              resizeMode="cover"
            />
            <View style={styles.textContainer}>
              <Text style={styles.title}>{item.title}</Text>
              <Text style={styles.description}>{item.description}</Text>
            </View>
            <View style={styles.rightSide}>
              {wishImages[index % wishImages.length] && (
                <Image
                  source={wishImages[index % wishImages.length]}
                  style={{width: 50, height: 50}}
                  resizeMode="cover"
                />
              )}
              <View style={styles.badge}>
                <Text style={{color: '#fff'}}>{item.percentage}</Text>
              </View>
            </View>
          </View>
        )}
        autoPlay={true}
        pagingEnabled={true}
        snapEnabled={true}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  screen: {
    justifyContent: 'center',
  },
  itemContainer: {
    flex: 1,
    flexDirection: 'row',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginHorizontal: 5,
    borderColor: '#E4E7E9',
    borderWidth: 1,
  },
  image: {
    width: 120,
    height: 150,
    borderTopLeftRadius: 8,
  },
  textContainer: {
    flex: 1,
    marginLeft: 12,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 4,
    color: '#000',
  },
  description: {
    fontSize: 13,
    color: '#666',
  },
  rightSide: {
    paddingTop: 10,
    paddingHorizontal: 5,
    height: '100%',
    width: '20%',
  },
  badge: {
    position: 'absolute',
    bottom: 10,
    width: '100%',
    right: -1,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 10,
    borderColor: '#fff',
    borderRadius: 20,
    borderWidth: 1,
    marginHorizontal: 10,
    backgroundColor: '#414649',
    padding: 5,
  },
});

export default CarouselSell;
