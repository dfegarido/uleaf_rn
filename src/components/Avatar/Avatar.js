import React, {useEffect, useState} from 'react';
import {TouchableOpacity, Image, View, ActivityIndicator, StyleSheet} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {useAuth} from '../../auth/AuthProvider';
import AvatarIcon from '../../assets/images/avatar.svg';
import {useNavigation} from '@react-navigation/native';

/**
 * Reusable Avatar component
 * Props:
 * - size: number (default 40)
 * - imageUri: explicitly provide an image URI to use (overrides cache)
 * - onPress: optional press handler
 * - style: additional style for container
 * - rounded: boolean (default true)
 */
const Avatar = ({size = 40, imageUri, onPress, style, rounded = true}) => {
  const [uri, setUri] = useState(imageUri || '');
  const [loading, setLoading] = useState(false);
  const {user} = useAuth();
  const navigation = useNavigation();

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (imageUri) {
        setUri(imageUri);
        return;
      }

      setLoading(true);
      try {
        // 1) Try explicit cached key
        const cached = await AsyncStorage.getItem('profilePhotoUrl');
        if (mounted && cached) {
          setUri(cached);
          setLoading(false);
          return;
        }

        // 2) Try full buyer profile
        const profileRaw = await AsyncStorage.getItem('buyerProfile');
        if (mounted && profileRaw) {
          try {
            const profile = JSON.parse(profileRaw);
            if (profile?.profilePhotoUrl) {
              setUri(profile.profilePhotoUrl);
              setLoading(false);
              return;
            }
          } catch (e) {
            // ignore parse error
          }
        }

        // 3) Try auth user object (if available)
        if (mounted && user && user.profileImage) {
          setUri(user.profileImage);
        }
      } catch (e) {
        // ignore
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [imageUri, user]);

  const containerStyle = [
    {width: size, height: size, borderRadius: rounded ? size / 2 : 4, overflow: 'hidden'},
    style,
  ];

  const content = uri ? (
    <Image
      source={{uri}}
      style={{width: size, height: size}}
      resizeMode="cover"
      onError={() => setUri('')}
    />
  ) : (
    <View style={styles.placeholder}>
      <AvatarIcon width={size - 8} height={size - 8} />
    </View>
  );

  const handlePress = () => {
    if (typeof onPress === 'function') return onPress();
    // Default behavior: navigate to profile screen if no onPress provided
    try {
      navigation.navigate('ScreenProfile');
    } catch (e) {
      // ignore if navigation not available
    }
  };

  return (
    <TouchableOpacity
      activeOpacity={0.7}
      onPress={handlePress}
      style={containerStyle}
      accessible
      accessibilityLabel="User avatar">
      {content}
      {loading && (
        <View style={[styles.loadingOverlay, {width: size, height: size}]}> 
          <ActivityIndicator size="small" color="#fff" />
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  placeholder: {
    flex: 1,
    backgroundColor: '#F0F0F0',
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(0,0,0,0.25)',
  },
});

export default Avatar;
