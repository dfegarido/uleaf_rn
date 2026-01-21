import React, {useEffect, useState, useImperativeHandle, forwardRef} from 'react';
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
 * 
 * Ref methods:
 * - refresh(): forces refresh of the avatar image from AsyncStorage
 */
const Avatar = forwardRef(({size = 40, imageUri, onPress, style, rounded = true}, ref) => {
  const [uri, setUri] = useState(imageUri || '');
  const [loading, setLoading] = useState(false);
  const {user} = useAuth();
  const navigation = useNavigation();
  const [forceUpdateKey, setForceUpdateKey] = useState(0);

  // Expose refresh method via ref
  useImperativeHandle(ref, () => ({
    refresh: () => {
      setForceUpdateKey(prev => prev + 1);
    }
  }));

  useEffect(() => {
    let mounted = true;

    const load = async () => {
      if (imageUri) {
        setUri(imageUri);
        return;
      }

      setLoading(true);
      try {
        // Priority order for profile image:
        
        // 1) Try profilePhotoUrlWithTimestamp (cache-busted) first - from AccountInformationScreen
        const cacheBustedUrl = await AsyncStorage.getItem('profilePhotoUrlWithTimestamp');
        if (mounted && cacheBustedUrl) {
          setUri(cacheBustedUrl);
          setLoading(false);
          return;
        }
        
        // 2) Try profilePhotoUrl - from AccountInformationScreen
        const photoUrl = await AsyncStorage.getItem('profilePhotoUrl');
        if (mounted && photoUrl) {
          // Add cache-busting to ensure fresh image
          const timestamp = Date.now();
          const bustedUrl = `${photoUrl}${photoUrl.includes('?') ? '&' : '?'}cb=${timestamp}`;
          setUri(bustedUrl);
          setLoading(false);
          return;
        }

        // 3) Try userInfo from AsyncStorage (most reliable source)
        const userInfoStr = await AsyncStorage.getItem('userInfo');
        if (mounted && userInfoStr) {
          try {
            const userInfo = JSON.parse(userInfoStr);
            if (userInfo?.profileImage) {
              // Add cache-busting to ensure fresh image
              const timestamp = userInfo.profileImageTimestamp || Date.now();
              const bustedUrl = `${userInfo.profileImage}${userInfo.profileImage.includes('?') ? '&' : '?'}cb=${timestamp}`;
              setUri(bustedUrl);
              setLoading(false);
              return;
            }
          } catch (e) {
            console.log('Error parsing userInfo from AsyncStorage:', e);
          }
        }

        // 4) Try full buyer profile
        const profileRaw = await AsyncStorage.getItem('buyerProfile');
        if (mounted && profileRaw) {
          try {
            const profile = JSON.parse(profileRaw);
            if (profile?.profilePhotoUrl) {
              const timestamp = Date.now();
              const bustedUrl = `${profile.profilePhotoUrl}${profile.profilePhotoUrl.includes('?') ? '&' : '?'}cb=${timestamp}`;
              setUri(bustedUrl);
              setLoading(false);
              return;
            }
          } catch (e) {
            // ignore parse error
          }
        }

        // 5) Fallback to auth user object (if available)
        if (mounted && user && user.profileImage) {
          setUri(user.profileImage);
        }
      } catch (e) {
        console.log('Error loading avatar image:', e);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    load();

    return () => {
      mounted = false;
    };
  }, [imageUri, user?.profileImage, user?.profileImageTimestamp, forceUpdateKey]);

  const containerStyle = [
    {width: size, height: size, borderRadius: rounded ? size / 2 : 4, overflow: 'hidden'},
    style,
  ];

  const content = uri ? (
    <Image
      key={`avatar-image-${uri}`} 
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
      // onPress={handlePress}
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
});

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
