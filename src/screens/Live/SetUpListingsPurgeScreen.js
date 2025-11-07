import { useIsFocused } from '@react-navigation/native';
import React, { useEffect, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Modal,
  StyleSheet,
  Text,
  TouchableOpacity,
  View
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import BackSolidIcon from '../../assets/iconnav/caret-left-bold.svg';
import { getLiveListingsBySessionApi } from '../../components/Api/agoraLiveApi';

const SetUpListingsPurgeScreen = ({navigation, route}) => {
  const {sessionId} = route.params;
  const [listings, setListings] = useState([]);
  const [loading, setLoading] = useState(false);
  const isFocused = useIsFocused();

  const fetchListings = async () => {
    if (!sessionId) return;
    setLoading(true);
    try {
      const response = await getLiveListingsBySessionApi(sessionId, 'Purge');
      if (response.success) {
        setListings(response.data);
      } else {
        Alert.alert('Error', response.error || 'Failed to fetch listings.');
      }
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isFocused) {
      fetchListings();
    }
  }, [isFocused, sessionId]);

  const renderItem = ({item}) => (
    <View style={styles.card}>
      <Image source={{uri: item.imagePrimary}} style={styles.cardImage} />
      <View style={styles.cardInfo}>
        <Text style={styles.cardTitle} numberOfLines={1}>
          {item.genus} {item.species}
        </Text>
        <Text style={styles.cardDetails}>
          {item.variegation} · {item.potSize}
        </Text>
      </View>
      <View style={styles.cardFooter}>
        <Text style={styles.cardPrice}>${item.usdPrice}</Text>
        <Text style={styles.cardStock}>{item.availableQty} pcs</Text>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.screen}>
      {loading && (
        <Modal transparent animationType="fade">
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color="#699E73" />
          </View>
        </Modal>
      )}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <BackSolidIcon />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Setup Purge</Text>
        <View style={{width: 24}} />
      </View>

      <View style={styles.container}>
        <TouchableOpacity
          style={styles.createButton}
          onPress={() =>
            navigation.navigate('ScreenSingleSellLive', {isPurge:true, sessionId})
          }>
          <Text style={styles.createButtonText}>Create Listing</Text>
        </TouchableOpacity>

        <FlatList
          data={listings}
          renderItem={renderItem}
          keyExtractor={item => item.plantCode}
          numColumns={2}
          contentContainerStyle={styles.listContainer}
          ListEmptyComponent={
            <Text style={styles.emptyText}>
              No listings created for this purge session yet.
            </Text>
          }
          onRefresh={fetchListings}
          refreshing={loading}
        />
      </View>

      <View style={styles.footer}>
        <TouchableOpacity
          style={styles.goLiveButton}
          onPress={() => navigation.replace('LivePurgeScreen', {sessionId})}>
          <Text style={styles.goLiveButtonText}>Go Live</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  screen: {flex: 1, backgroundColor: '#fff'},
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#E0E0E0',
  },
  headerTitle: {fontSize: 20, fontWeight: 'bold', color: '#000'},
  container: {flex: 1, padding: 20},
  createButton: {
    backgroundColor: '#414649',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    marginBottom: 20,
  },
  createButtonText: {color: '#fff', fontSize: 18, fontWeight: 'bold'},
  listContainer: {paddingBottom: 20},
  card: {
    flex: 1,
    margin: 8,
    borderWidth: 1,
    borderColor: '#eee',
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f9f9f9',
  },
  cardImage: {width: '100%', height: 120},
  cardInfo: {padding: 8},
  cardTitle: {fontWeight: '600', fontSize: 14, color: '#333'},
  cardDetails: {color: '#555', fontSize: 12, marginTop: 2},
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 8,
    paddingBottom: 8,
    alignItems: 'center',
  },
  cardPrice: {fontWeight: 'bold', fontSize: 16, color: '#539461'},
  cardStock: {fontSize: 12, color: '#888'},
  emptyText: {
    textAlign: 'center',
    marginTop: 50,
    fontSize: 16,
    color: '#888',
  },
  footer: {padding: 20, borderTopWidth: 1, borderTopColor: '#E0E0E0'},
  goLiveButton: {
    backgroundColor: '#539461',
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
  },
  goLiveButtonText: {color: '#fff', fontSize: 18, fontWeight: 'bold'},
  loadingOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.25)',
    justifyContent: 'center',
    alignItems: 'center',
  },
});

export default SetUpListingsPurgeScreen;
