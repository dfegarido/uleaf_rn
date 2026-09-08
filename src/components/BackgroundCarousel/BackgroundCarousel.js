import React, {useRef, useState, useEffect} from 'react';
import { View,
  Text,
  ImageBackground,
  StyleSheet,
  FlatList,
  Dimensions,
} from 'react-native';

const BackgroundCarousel = ({
  images = [],
  autoSlide = true,
  interval = 4000,
  width,
  height,
}) => {
  const screenWidth = Dimensions.get('window').width;
  const screenHeight = Dimensions.get('window').height;

  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef(null);

  // Filter out empty/whitespace URLs — an empty string uri crashes
  // RCTImageLoader with "No suitable image URL loader found for :".
  // `images` may be a string (single URL) or an array; coerce to array.
  const validImages = (Array.isArray(images) ? images : [images])
    .filter(img => typeof img === 'string' && img.trim() !== '');
  const hasValidImages = validImages.length > 0;

  useEffect(() => {
    if (!autoSlide || !hasValidImages) return;

    const slideInterval = setInterval(() => {
      goToNextImage();
    }, interval);

    return () => clearInterval(slideInterval);
  }, [currentIndex, hasValidImages]);

  const goToNextImage = () => {
    if (!hasValidImages || !flatListRef.current) return;

    const nextIndex = (currentIndex + 1) % validImages.length;
    flatListRef.current.scrollToIndex({
      index: nextIndex,
      animated: true,
    });
    setCurrentIndex(nextIndex);
  };

  const onViewableItemsChanged = useRef(({viewableItems}) => {
    if (viewableItems?.length > 0 && viewableItems[0].index != null) {
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
      {hasValidImages ? (
        <>
          <FlatList
            ref={flatListRef}
            data={validImages}
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            keyExtractor={(_, index) => index.toString()}
            onViewableItemsChanged={onViewableItemsChanged}
            viewabilityConfig={{viewAreaCoveragePercentThreshold: 50}}
            renderItem={({item}) => (
              <ImageBackground
                // source={item}
                source={{uri: item}}
                style={{
                  backgroundColor: '#eee',

                  width: width || screenWidth,
                  height: height || screenHeight,
                }}
                resizeMode="cover"
              />
            )}
          />

          {/* Index Display */}
          <View
            style={[styles.indicator, {right: (width || screenWidth) * 0.43}]}>
            <Text style={styles.indicatorText}>
              {currentIndex + 1} / {images.length}
            </Text>
          </View>
        </>
      ) : (
        <View
          style={[
            styles.noImageContainer,
            {
              width: width || screenWidth,
              height: height || screenHeight,
            },
          ]}>
          <Text style={styles.noImageText}>No Images Available</Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    zIndex: -1,
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
  noImageContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#ccc',
  },
  noImageText: {
    color: '#333',
    fontSize: 16,
  },
});

export default BackgroundCarousel;
