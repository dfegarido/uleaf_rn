import React, { useState, useCallback, useEffect, useContext } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  StatusBar,
  Image,
  RefreshControl,
} from 'react-native';
import { useSafeAreaInsets, SafeAreaView } from 'react-native-safe-area-context';
import { useIsFocused } from '@react-navigation/native';
import { AuthContext } from '../../../auth/AuthProvider';
import { collection, getDocs, query, where, limit, doc, getDoc } from 'firebase/firestore';
import { db } from '../../../../firebase';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';

const BuyerPlantCreditsScreen = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const { userInfo } = useContext(AuthContext);
  const isFocused = useIsFocused();
  const buyerUid = userInfo?.uid;
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [plantCredits, setPlantCredits] = useState(0);

  const fetchCreditHistory = useCallback(async (uid) => {
    const allTransactions = [];
    try {
      const creditsSnap = await getDocs(
        query(collection(db, 'credit_transactions'), where('buyerUid', '==', uid))
      );

      for (const docSnapshot of creditsSnap.docs) {
        const data = docSnapshot.data();
        const isShippingCredit = data.creditType?.toLowerCase().includes('shipping') || data.type?.toLowerCase().includes('shipping');

        if (!isShippingCredit) {
          const transaction = {
            id: docSnapshot.id,
            ...data,
            createdAt: data.createdAt?.toDate ? data.createdAt.toDate() : data.createdAt ? new Date(data.createdAt) : new Date(),
          };
          transaction.plantCode = data.plantCode || data.plantDetails?.plantCode;
          transaction.plantName = data.plantName || data.plantDetails?.plantName;
          transaction.plantImage = data.plantImage || data.plantDetails?.plantImage || data.plantDetails?.image;

          let fetchedOrderData = null;

          if (data.orderId) {
            try {
              let orderData = null;
              if (data.orderId.startsWith('TXN')) {
                const orderQuery = await getDocs(
                  query(collection(db, 'order'), where('trxNumber', '==', data.orderId), limit(1))
                );
                if (!orderQuery.empty) orderData = orderQuery.docs[0].data();
              } else {
                const orderDoc = await getDoc(doc(db, 'order', data.orderId));
                if (orderDoc.exists()) orderData = orderDoc.data();
              }

              if (orderData) {
                fetchedOrderData = orderData;
                transaction.orderDate = orderData.createdAt?.toDate ? orderData.createdAt.toDate() : null;
                let plants = orderData.products || orderData.items || [];

                if (plants?.length > 0) {
                  let plant = plants.find(p => p.plantCode === transaction.plantCode) || (plants.length === 1 ? plants[0] : null);
                  if (plant) {
                    if (!transaction.plantName) transaction.plantName = plant.plantName || plant.scientificName || plant.name;
                    if (!transaction.plantImage) transaction.plantImage = plant.plantImage || plant.image || plant.photoUrl;
                    if (!transaction.plantCode) transaction.plantCode = plant.plantCode || plant.code;
                  }
                } else if (orderData.plantCode) {
                  transaction.plantCode = orderData.plantCode;
                  transaction.plantName = orderData.plantName;
                  transaction.plantImage = orderData.plantImage || orderData.imagePrimary;
                  transaction.genus = orderData.genus;
                  transaction.species = orderData.species;
                  transaction.unitPrice = orderData.unitPrice || orderData.usdPrice;
                }
              }
            } catch (_) {}
          }

          if (data.processedBy?.length > 20) {
            try {
              const adminDoc = await getDoc(doc(db, 'admin', data.processedBy));
              transaction.processedByName = adminDoc.exists()
                ? `${adminDoc.data().firstName || ''} ${adminDoc.data().lastName || ''}`.trim() || adminDoc.data().email
                : data.processedBy;
            } catch (_) {
              transaction.processedByName = data.processedBy;
            }
          } else {
            transaction.processedByName = data.processedBy;
          }

          if (transaction.plantCode && (!transaction.plantName || !transaction.plantImage)) {
            try {
              const listingsSnap = await getDocs(
                query(collection(db, 'listings'), where('plantCode', '==', transaction.plantCode), limit(1))
              );
              if (!listingsSnap.empty) {
                const ld = listingsSnap.docs[0].data();
                if (!transaction.plantName) transaction.plantName = ld.plantName || ld.scientificName || ld.name;
                if (!transaction.plantImage) transaction.plantImage = ld.plantImage || ld.image || ld.photoUrl || ld.images?.[0];
                transaction.genus = ld.genus;
                transaction.species = ld.species;
              } else if (fetchedOrderData) {
                if (!transaction.plantName) transaction.plantName = fetchedOrderData.plantName || (fetchedOrderData.genus && fetchedOrderData.species ? `${fetchedOrderData.genus} ${fetchedOrderData.species}` : fetchedOrderData.scientificName);
                if (!transaction.plantImage) transaction.plantImage = fetchedOrderData.plantImage || fetchedOrderData.imagePrimary;
                if (!transaction.genus) transaction.genus = fetchedOrderData.genus;
                if (!transaction.species) transaction.species = fetchedOrderData.species;
                if (!transaction.unitPrice) transaction.unitPrice = fetchedOrderData.unitPrice || fetchedOrderData.usdPrice;
              }
            } catch (_) {}
          }

          // Fallback: extract plant name from description if still missing
          if (!transaction.plantName && data.description) {
            // Pattern: "Credit for Missing - PLANT NAME" or similar
            const descPatterns = [
              /Credit for \w+ - (.+)$/i,
              /credit.* - (.+)$/i,
            ];
            for (const pattern of descPatterns) {
              const match = data.description.match(pattern);
              if (match && match[1]) {
                transaction.plantName = match[1].trim();
                break;
              }
            }
          }

          allTransactions.push(transaction);
        }
      }

      allTransactions.sort((a, b) => b.createdAt - a.createdAt);
    } catch (err) {
      console.error('Error fetching plant credit history:', err);
    }

    return allTransactions;
  }, []);

  const loadHistory = useCallback(async () => {
    if (!buyerUid) {
      setTransactions([]);
      setLoading(false);
      return;
    }
    try {
      const [list, buyerDoc] = await Promise.all([
        fetchCreditHistory(buyerUid),
        getDoc(doc(db, 'buyer', buyerUid)),
      ]);
      setTransactions(list);
      const balance = buyerDoc.exists() ? (buyerDoc.data().plantCredits ?? 0) : (list[0]?.balanceAfter ?? 0);
      setPlantCredits(balance);
    } catch (err) {
      console.error('Error loading plant credits:', err);
      setTransactions([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [buyerUid, fetchCreditHistory]);

  useEffect(() => {
    if (isFocused) {
      if (Platform.OS === 'android') {
        StatusBar.setBarStyle('dark-content');
        StatusBar.setBackgroundColor('#FFFFFF');
      }
      loadHistory();
    }
  }, [isFocused, loadHistory]);

  const formatDate = (date) => {
    if (!date) return '—';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderTransaction = ({ item }) => {
    const amount = item.amount || 0;
    const isPositive = amount > 0;
    const desc = item.description || item.reason || '';
    const displayTitle = item.genus || item.plantName || item.plantCode || 'Unknown Plant';
    const displaySubtitle = item.species || '';
    const plantPrice = item.unitPrice ?? item.usdPrice ?? amount;

    const getBadge = () => {
      if (desc.toLowerCase().includes('reversed') || amount < 0) return { text: 'Reversed', bgColor: '#FDEDEC' };
      if (desc.toLowerCase().includes('dead on arrival') || desc.toLowerCase().includes('doa')) return { text: 'DOA', bgColor: '#FEF5E7' };
      if (desc.toLowerCase().includes('damaged')) return { text: 'Damaged', bgColor: '#F5EEF8' };
      if (desc.toLowerCase().includes('missing')) return { text: 'Missing', bgColor: '#FEF9E7' };
      if (desc.toLowerCase().includes('mishap') || desc.toLowerCase().includes('journey')) return { text: 'Journey Mishap', bgColor: '#EBF5FB' };
      if (desc.toLowerCase().includes('refund')) return { text: 'Refund', bgColor: '#E9F7EF' };
      return { text: 'Credit', bgColor: '#F0F7F1' };
    };
    const badge = getBadge();

    return (
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <View style={[styles.badge, { backgroundColor: badge.bgColor }]}>
            <Text style={styles.badgeText}>{badge.text}</Text>
          </View>
          <Text style={[styles.amount, isPositive ? styles.amountPositive : styles.amountNegative]}>
            {isPositive ? '+' : ''}${Math.abs(amount).toFixed(0)}
          </Text>
        </View>
        <TouchableOpacity
          style={styles.plantSection}
          onPress={() => item.plantCode && navigation.navigate('ScreenPlantDetail', { plantCode: item.plantCode })}
          activeOpacity={item.plantCode ? 0.7 : 1}
          disabled={!item.plantCode}
        >
          {item.plantImage ? (
            <Image source={{ uri: item.plantImage }} style={styles.plantImg} resizeMode="cover" />
          ) : (
            <View style={[styles.plantImg, styles.plantPlaceholder]}>
              <Text style={styles.plantPlaceholderText}>🌿</Text>
            </View>
          )}
          <View style={styles.plantInfo}>
            <Text style={styles.plantName} numberOfLines={2}>{displayTitle}</Text>
            {displaySubtitle ? <Text style={styles.plantSubtitle} numberOfLines={1}>{displaySubtitle}</Text> : null}
            {item.plantCode && <Text style={styles.plantCode}>{item.plantCode}</Text>}
          </View>
        </TouchableOpacity>
        <View style={styles.dates}>
          {item.orderDate && (
            <View style={styles.dateItem}>
              <Text style={styles.dateLabel}>Order Date</Text>
              <Text style={styles.dateValue}>{formatDate(item.orderDate)}</Text>
            </View>
          )}
          <View style={styles.dateItem}>
            <Text style={styles.dateLabel}>Credit Given</Text>
            <Text style={styles.dateValue}>{formatDate(item.createdAt)}</Text>
          </View>
        </View>
        <View style={styles.details}>
          <View style={styles.detailRow}>
            <Text style={styles.detailLabel}>Plant Price</Text>
            <Text style={styles.detailValue}>${Number(plantPrice).toFixed(0)}</Text>
          </View>
          {item.balanceBefore !== undefined && item.balanceAfter !== undefined && (
            <View style={styles.detailRow}>
              <Text style={styles.detailLabel}>Balance</Text>
              <Text style={styles.detailValue}>${item.balanceBefore} → ${item.balanceAfter}</Text>
            </View>
          )}
        </View>
      </View>
    );
  };

  if (!buyerUid) {
    return (
      <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
        <View style={[styles.header, { paddingTop: insets.top }]}>
          <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
            <BackSolidIcon width={24} height={24} color="#202325" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>My Plant Credits</Text>
          <View style={{ width: 24 }} />
        </View>
        <View style={styles.empty}>
          <Text style={styles.emptyText}>Please sign in to view your plant credits.</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['left', 'right', 'bottom']}>
      <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      <View style={[styles.header, { paddingTop: insets.top }]}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <BackSolidIcon width={24} height={24} color="#202325" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>My Plant Credits</Text>
        <View style={{ width: 24 }} />
      </View>
      <View style={styles.balanceCard}>
        <Text style={styles.balanceLabel}>Current Balance</Text>
        <Text style={styles.balanceValue}>${plantCredits}</Text>
      </View>
      {loading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color="#539461" />
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : transactions.length > 0 ? (
        <FlatList
          data={transactions}
          keyExtractor={(item) => item.id}
          renderItem={renderTransaction}
          contentContainerStyle={styles.list}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); loadHistory(); }} colors={['#539461']} />}
        />
      ) : (
        <View style={styles.empty}>
          <Text style={styles.emptyTitle}>No plant credits yet</Text>
          <Text style={styles.emptySub}>Plant credits will appear here when you receive them.</Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#FFFFFF' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEEA',
  },
  backBtn: { width: 40, height: 40, alignItems: 'center', justifyContent: 'center' },
  headerTitle: { fontSize: 18, fontWeight: '700', color: '#202325' },
  balanceCard: {
    backgroundColor: '#F5EEF8',
    marginHorizontal: 16,
    marginTop: 16,
    padding: 20,
    borderRadius: 12,
    alignItems: 'center',
  },
  balanceLabel: { fontSize: 14, color: '#6B777B', marginBottom: 4 },
  balanceValue: { fontSize: 28, fontWeight: '700', color: '#6B4EFF' },
  list: { padding: 16 },
  card: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EEEA',
    padding: 16,
    marginBottom: 12,
  },
  cardHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  badge: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 12 },
  badgeText: { fontSize: 11, fontWeight: '700', color: '#202325' },
  amount: { fontSize: 20, fontWeight: '700' },
  amountPositive: { color: '#27AE60' },
  amountNegative: { color: '#E74C3C' },
  plantSection: { flexDirection: 'row', alignItems: 'center', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E8EEEA' },
  plantImg: { width: 60, height: 60, borderRadius: 8, backgroundColor: '#F9FAFB' },
  plantPlaceholder: { justifyContent: 'center', alignItems: 'center', borderWidth: 1, borderColor: '#E8EEEA', borderStyle: 'dashed' },
  plantPlaceholderText: { fontSize: 24 },
  plantInfo: { flex: 1, marginLeft: 12 },
  plantName: { fontSize: 16, fontWeight: '700', color: '#202325', marginBottom: 2 },
  plantSubtitle: { fontSize: 13, color: '#6B777B' },
  plantCode: { fontSize: 11, color: '#9AA4A8', marginTop: 4 },
  dates: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 12, paddingBottom: 12, borderBottomWidth: 1, borderBottomColor: '#E8EEEA' },
  dateItem: {},
  dateLabel: { fontSize: 11, color: '#9AA4A8', marginBottom: 2 },
  dateValue: { fontSize: 13, fontWeight: '600', color: '#202325' },
  details: { backgroundColor: '#F9FAFB', borderRadius: 8, padding: 12 },
  detailRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 4 },
  detailLabel: { fontSize: 12, color: '#6B777B' },
  detailValue: { fontSize: 12, fontWeight: '500', color: '#202325' },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  loadingText: { marginTop: 12, fontSize: 14, color: '#6B777B' },
  empty: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32 },
  emptyText: { fontSize: 14, color: '#6B777B', textAlign: 'center' },
  emptyTitle: { fontSize: 16, fontWeight: '700', color: '#202325', marginBottom: 8 },
  emptySub: { fontSize: 14, color: '#6B777B', textAlign: 'center' },
});

export default BuyerPlantCreditsScreen;
