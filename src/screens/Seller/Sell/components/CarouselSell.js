import React from 'react';
import {View, Dimensions, Image, StyleSheet, Text} from 'react-native';
import Carousel from 'react-native-reanimated-carousel';

const {width} = Dimensions.get('window');

const wishImages = [
  require('../../../../assets/images/wish1.png'),
  require('../../../../assets/images/wish2.png'),
  require('../../../../assets/images/wish3.png'),
  require('../../../../assets/images/wish4.png'),
  require('../../../../assets/images/wish5.png'),
  // Add more if you have more images
];

const plantItems = [
  {
    id: '1',
    uri: 'https://picsum.photos/id/1003/600/400',
    title: 'Cactus',
    description: 'A beautiful cactus plant perfect for sunny spots.',
    percentage: '25.2%',
  },
  {
    id: '2',
    uri: 'https://picsum.photos/id/1025/600/400',
    title: 'Fern',
    description: 'A lush fern that thrives in the shade.',
    percentage: '25.2%',
  },
  {
    id: '3',
    uri: 'https://picsum.photos/id/103/600/400',
    title: 'Succulent',
    description: 'Easy to care for, perfect for beginners.',
    percentage: '25.2%',
  },
  {
    id: '4',
    uri: 'https://picsum.photos/id/1025/600/400',
    title: 'Fern',
    description: 'A lush fern that thrives in the shade.',
    percentage: '25.2%',
  },
  {
    id: '5',
    uri: 'https://picsum.photos/id/103/600/400',
    title: 'Succulent',
    description: 'Easy to care for, perfect for beginners.',
    percentage: '25.2%',
  },
];

const CarouselSell = () => {
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
            <View
              style={{
                paddingTop: 10,
                paddingHorizontal: 5,
                height: '100%',
                width: '20%',
              }}>
              <Image
                source={wishImages[index]}
                style={{width: 50, height: 50}}
                resizeMode="cover"
              />
              <View
                style={[
                  styles.badge,
                  {
                    backgroundColor: '#414649',
                    padding: 5,
                  },
                ]}>
                <Text style={{color: '#fff'}}>{item.percentage}</Text>
              </View>
            </View>
          </View>
        )}
        autoPlay={false}
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
    flexDirection: 'row', // 🔥 Put image left, text right
    // alignItems: 'center',
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: '#fff',
    marginHorizontal: 5,
    // padding: 10,
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
    // justifyContent: 'center',
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 4,
  },
  description: {
    fontSize: 13,
    color: '#666',
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
  },
});

export default CarouselSell;
