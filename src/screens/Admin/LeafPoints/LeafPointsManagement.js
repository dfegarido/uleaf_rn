import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  TextInput,
  Platform,
  StatusBar,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { collection, getDocs, query, where, orderBy } from 'firebase/firestore';
import { db } from '../../../../firebase';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';

const LeafPointsManagement = ({ navigation }) => {
  const insets = useSafeAreaInsets();
  const [buyers, setBuyers] = useState([]);
  const [filteredBuyers, setFilteredBuyers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState('');

  const fetchBuyersWithLeafPoints = useCallback(async () => {
    try {
      setLoading(true);
      
      // Fetch all buyers from buyer collection
      const buyersSnap = await getDocs(collection(db, 'buyer'));
      
      // Filter buyers who have leafPoints > 0
      const buyersWithPoints = [];
      buyersSnap.forEach(doc => {
        const data = doc.data();
        const leafPoints = data.leafPoints || 0;
        
        if (leafPoints > 0) {
          buyersWithPoints.push({
            uid: doc.id,
            firstName: data.firstName || '',
            lastName: data.lastName || '',
            email: data.email || '',
            username: data.username || '',
            leafPoints: leafPoints,
            country: data.country || data.region || '',
            createdAt: data.createdAt,
          });
        }
      });
      
      // Sort by leafPoints descending (highest first)
      buyersWithPoints.sort((a, b) => b.leafPoints - a.leafPoints);
      
      console.log(`📊 Found ${buyersWithPoints.length} buyers with leaf points`);
      setBuyers(buyersWithPoints);
      setFilteredBuyers(buyersWithPoints);
    } catch (error) {
      console.error('Error fetching buyers with leaf points:', error);
      setBuyers([]);
      setFilteredBuyers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      if (Platform.OS === 'android') {
        StatusBar.setBarStyle('dark-content');
        StatusBar.setBackgroundColor('#FFFFFF');
      }
      fetchBuyersWithLeafPoints();
    }, [fetchBuyersWithLeafPoints])
  );

  // Filter buyers based on search text
  const handleSearch = (text) => {
    setSearchText(text);
    
    if (!text.trim()) {
      setFilteredBuyers(buyers);
      return;
    }
    
    const searchLower = text.toLowerCase();
    const filtered = buyers.filter(buyer => {
      const fullName = `${buyer.firstName} ${buyer.lastName}`.toLowerCase();
      const email = (buyer.email || '').toLowerCase();
      const username = (buyer.username || '').toLowerCase();
      
      return fullName.includes(searchLower) || 
             email.includes(searchLower) || 
             username.includes(searchLower);
    });
    
    setFilteredBuyers(filtered);
  };

  const renderBuyerItem = ({ item }) => {
    const fullName = `${item.firstName} ${item.lastName}`.trim() || 'Unknown';
    
    return (
      <TouchableOpacity
        style={styles.buyerCard}
        onPress={() => {
          // TODO: Navigate to buyer detail or leaf points history
          console.log('Tapped buyer:', item.uid);
        }}
        activeOpacity={0.7}
      >
        <View style={styles.buyerInfo}>
          <Text style={styles.buyerName}>{fullName}</Text>
          <Text style={styles.buyerEmail}>{item.email || item.username || '—'}</Text>
          {item.country && (
            <Text style={styles.buyerCountry}>{item.country}</Text>
          )}
        </View>
        <View style={styles.pointsContainer}>
          <Text style={styles.pointsValue}>{item.leafPoints}</Text>
          <Text style={styles.pointsLabel}>points</Text>
        </View>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {Platform.OS === 'android' && (
        <StatusBar barStyle="dark-content" backgroundColor="#FFFFFF" />
      )}
      
      {/* Header */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top, 8) }]}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          style={styles.backButton}
          activeOpacity={0.7}
        >
          <BackSolidIcon width={24} height={24} color="#202325" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Leaf Points Management</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search buyers by name or email..."
          placeholderTextColor="#9AA4A8"
          value={searchText}
          onChangeText={handleSearch}
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      {/* Summary */}
      <View style={styles.summaryContainer}>
        <Text style={styles.summaryText}>
          {filteredBuyers.length} {filteredBuyers.length === 1 ? 'buyer' : 'buyers'} with leaf points
        </Text>
        {filteredBuyers.length > 0 && (
          <Text style={styles.summarySubtext}>
            Total: {filteredBuyers.reduce((sum, b) => sum + b.leafPoints, 0)} points
          </Text>
        )}
      </View>

      {/* Buyers List */}
      {loading ? (
        <View style={styles.loadingWrap}>
          <ActivityIndicator size="large" color="#539461" />
          <Text style={styles.loadingText}>Loading buyers...</Text>
        </View>
      ) : filteredBuyers.length > 0 ? (
        <FlatList
          data={filteredBuyers}
          keyExtractor={(item) => item.uid}
          renderItem={renderBuyerItem}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
        />
      ) : (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>
            {searchText ? 'No buyers found' : 'No buyers with leaf points'}
          </Text>
          <Text style={styles.emptySubtitle}>
            {searchText ? 'Try a different search term' : 'Buyers will appear here when they earn leaf points'}
          </Text>
        </View>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEEA',
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#202325',
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#FFFFFF',
  },
  searchInput: {
    borderWidth: 1,
    borderColor: '#D7E6D9',
    backgroundColor: '#F9FAFB',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
    fontSize: 15,
    color: '#202325',
  },
  summaryContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#F9FAFB',
    borderBottomWidth: 1,
    borderBottomColor: '#E8EEEA',
  },
  summaryText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#202325',
  },
  summarySubtext: {
    fontSize: 13,
    color: '#6B777B',
    marginTop: 4,
  },
  listContent: {
    padding: 16,
  },
  buyerCard: {
    flexDirection: 'row',
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: '#E8EEEA',
    padding: 16,
    marginBottom: 12,
    alignItems: 'center',
  },
  buyerInfo: {
    flex: 1,
    marginRight: 12,
  },
  buyerName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 4,
  },
  buyerEmail: {
    fontSize: 13,
    color: '#6B777B',
    marginBottom: 2,
  },
  buyerCountry: {
    fontSize: 12,
    color: '#9AA4A8',
  },
  pointsContainer: {
    alignItems: 'center',
    backgroundColor: '#F0F7F1',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 10,
    minWidth: 80,
  },
  pointsValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#539461',
  },
  pointsLabel: {
    fontSize: 11,
    color: '#6B777B',
    marginTop: 2,
  },
  loadingWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 12,
    fontSize: 14,
    color: '#6B777B',
  },
  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#202325',
    marginBottom: 8,
    textAlign: 'center',
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#6B777B',
    textAlign: 'center',
  },
});

export default LeafPointsManagement;
