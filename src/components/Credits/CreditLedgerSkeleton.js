import React, { useRef, useEffect } from 'react';
import { View, StyleSheet, Animated } from 'react-native';
import { CREDIT_COLORS } from '../../utils/creditEnums';

const SkeletonPulse = ({ children }) => {
  const opacity = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 0.45, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, [opacity]);

  return (
    <Animated.View style={{ opacity }}>
      {children}
    </Animated.View>
  );
};

const Line = ({ style }) => (
  <SkeletonPulse>
    <View style={[styles.line, style]} />
  </SkeletonPulse>
);

export default function CreditLedgerSkeleton() {
  return (
    <View style={styles.card}>
      <View style={styles.row}>
        <SkeletonPulse>
          <View style={styles.iconContainer} />
        </SkeletonPulse>

        <View style={styles.content}>
          <View style={styles.topLine}>
            <Line style={styles.skeletonTitle} />
            <Line style={styles.skeletonAmount} />
          </View>

          <View style={styles.subLine}>
            <Line style={styles.skeletonSubtitle} />
            <Line style={styles.skeletonDate} />
          </View>

          <View style={styles.balanceLine}>
            <Line style={styles.skeletonBalanceLabel} />
            <Line style={styles.skeletonBalanceValue} />
          </View>
        </View>
      </View>
    </View>
  );
}

export function CreditLedgerSkeletonList({ count = 6, hasHeader = false }) {
  return (
    <View style={styles.list}>
      {hasHeader && (
        <View style={styles.headerSection}>
          <SkeletonPulse>
            <View style={styles.summaryCard} />
          </SkeletonPulse>
          <SkeletonPulse>
            <View style={styles.filterBar} />
          </SkeletonPulse>
        </View>
      )}
      {Array.from({ length: count }).map((_, i) => (
        <CreditLedgerSkeleton key={i} />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 24,
  },
  headerSection: {
    marginBottom: 8,
  },
  summaryCard: {
    height: 160,
    borderRadius: 12,
    backgroundColor: CREDIT_COLORS.borderLight,
    marginBottom: 12,
  },
  filterBar: {
    height: 40,
    borderRadius: 8,
    backgroundColor: CREDIT_COLORS.borderLight,
  },
  card: {
    backgroundColor: CREDIT_COLORS.surface,
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: CREDIT_COLORS.border,
    marginBottom: 8,
  },
  row: {
    flexDirection: 'row',
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: CREDIT_COLORS.borderLight,
    marginRight: 12,
  },
  content: {
    flex: 1,
  },
  line: {
    height: 12,
    borderRadius: 6,
    backgroundColor: CREDIT_COLORS.borderLight,
  },
  topLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 6,
  },
  subLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  balanceLine: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: CREDIT_COLORS.borderLight,
  },
  skeletonTitle: {
    width: '45%',
  },
  skeletonAmount: {
    width: 60,
  },
  skeletonSubtitle: {
    width: '35%',
  },
  skeletonDate: {
    width: 70,
  },
  skeletonBalanceLabel: {
    width: 70,
  },
  skeletonBalanceValue: {
    width: 50,
  },
});
