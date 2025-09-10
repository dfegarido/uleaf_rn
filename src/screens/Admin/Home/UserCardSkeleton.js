import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';

const SkeletonItem = ({ width, height = 20, style }) => {
  const pulseAnim = useRef(new Animated.Value(0.3)).current;
  
  useEffect(() => {
    const pulseTiming = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(pulseAnim, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    );
    
    pulseTiming.start();
    
    return () => {
      pulseTiming.stop();
    };
  }, [pulseAnim]);
  
  return (
    <Animated.View 
      style={[{
        width,
        height,
        backgroundColor: '#E5E7EB',
        borderRadius: 4,
        opacity: pulseAnim,
      }, style]} 
    />
  );
};

const UserCardSkeleton = () => {
  return (
    <View style={styles.userCard}>
      <View style={styles.userInfo}>
        <View style={styles.profilePicture}>
          <SkeletonItem width={48} height={48} style={styles.roundedSkeleton} />
        </View>
        
        <View style={styles.userDetails}>
          <View style={styles.nameRow}>
            <SkeletonItem width={120} height={18} style={{ marginRight: 8 }} />
            <SkeletonItem width={80} height={16} />
          </View>
          
          <SkeletonItem width={180} height={16} style={{ marginTop: 8 }} />
          
          <View style={styles.statusRow}>
            <SkeletonItem width={60} height={14} style={{ marginRight: 12 }} />
            <SkeletonItem width={50} height={14} />
          </View>
          
          <View style={styles.statsRow}>
            <SkeletonItem width={140} height={14} />
          </View>
        </View>
      </View>
      
      <View style={styles.editButton}>
        <SkeletonItem width={24} height={24} style={styles.roundedSkeleton} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  userCard: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
  },
  userInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  profilePicture: {
    width: 48,
    height: 48,
    borderRadius: 24,
    marginRight: 16,
    overflow: 'hidden',
  },
  roundedSkeleton: {
    borderRadius: 24,
  },
  userDetails: {
    flex: 1,
    gap: 8,
  },
  nameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  statusRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  statsRow: {
    marginTop: 4,
  },
  editButton: {
    padding: 8,
    alignSelf: 'flex-start',
    marginLeft: 'auto',
  },
});

export default UserCardSkeleton;
