import React from 'react';
import { View, Image, StyleSheet } from 'react-native';
import AvatarIcon from '../../assets/images/avatar.svg';

/**
 * Display-only profile avatar. No touch handling - image only.
 * Use this on the profile screen where the avatar should not be clickable.
 */
const ProfileAvatar = ({ imageUri, size = 50, style }) => {
  const hasImage = imageUri && typeof imageUri === 'string' && imageUri.trim() !== '';

  return (
    <View style={[styles.wrapper, { width: size, height: size }, style]}>
      {hasImage ? (
        <Image
          source={{ uri: imageUri }}
          style={[styles.image, { width: size, height: size, borderRadius: size / 2 }]}
          resizeMode="cover"
        />
      ) : (
        <AvatarIcon width={size * 0.8} height={size * 0.8} />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  wrapper: {
    justifyContent: 'center',
    alignItems: 'center',
    overflow: 'hidden',
  },
  image: {
    backgroundColor: '#C0DAC2',
    borderWidth: 1,
    borderColor: '#539461',
  },
});

export default ProfileAvatar;
