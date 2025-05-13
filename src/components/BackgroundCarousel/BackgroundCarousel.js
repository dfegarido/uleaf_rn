import React, {useRef, useState, useEffect} from 'react';
import {
  View,
  Text,
  ImageBackground,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';

const BackgroundCarousel = ({
  images,
  autoSlide = true,
  interval = 4000,
  width,
  height,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  useEffect(() => {
    if (!autoSlide) return;
    const slideInterval = setInterval(() => {
      goToNextImage();
    }, interval);

    return () => clearInterval(slideInterval);
  }, [currentIndex]);

  const goToNextImage = () => {
    const nextIndex = (currentIndex + 1) % images.length;
    flatListRef.current.scrollToIndex({index: nextIndex, animated: true});
    setCurrentIndex(nextIndex);
  };

  const onViewableItemsChanged = useRef(({viewableItems}) => {
    if (viewableItems.length > 0) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  return (
    <View
      style={[
        styles.container,
        {
          width: width || screenWidth,
          height: height || screenHeight,
        },
      ]}>
      <FlatList
        ref={flatListRef}
        data={images}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, index) => index.toString()}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{viewAreaCoveragePercentThreshold: 50}}
        renderItem={({item}) => (
          <ImageBackground
            source={item}
            style={[
              styles.image,
              {
                width: width || screenWidth,
                height: height || screenHeight,
              },
            ]}
            resizeMode="cover"
          />
        )}
      />

      {/* Index Display */}
      <View style={[styles.indicator, {right: width * 0.45}]}>
        <Text style={styles.indicatorText}>
          {currentIndex + 1} / {images.length}
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    // ...StyleSheet.absoluteFillObject,
    zIndex: -1, // send to background
  },
  image: {
    flex: 1,
  },
  indicator: {
    position: 'absolute',
    bottom: 40,
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 10,
  },
  indicatorText: {
    color: '#fff',
    fontSize: 16,
  },
});

export default BackgroundCarousel;
