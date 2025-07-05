import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
} from 'react-native';
import {globalStyles} from '../../../assets/styles/styles';

const ScreenShop = ({navigation}) => {
  return (
    <View style={styles.container}>
      <Text style={[globalStyles.title, styles.title]}>Shop</Text>
      <ScrollView style={styles.content}>
        <Text style={styles.subtitle}>Welcome to the Plant Shop!</Text>
        <Text style={styles.description}>
          Browse and discover amazing plants from local sellers.
        </Text>
        
        <View style={styles.featuredSection}>
          <Text style={styles.sectionTitle}>Featured Plants</Text>
          <View style={styles.productGrid}>
            {[1, 2, 3, 4].map((item) => (
              <TouchableOpacity key={item} style={styles.productCard}>
                <View style={styles.productImage} />
                <Text style={styles.productName}>Plant {item}</Text>
                <Text style={styles.productPrice}>$29.99</Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  title: {
    padding: 20,
    paddingBottom: 10,
  },
  content: {
    flex: 1,
    paddingHorizontal: 20,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    marginBottom: 30,
  },
  featuredSection: {
    marginBottom: 30,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 15,
  },
  productGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  productCard: {
    width: '48%',
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    padding: 15,
    marginBottom: 15,
    alignItems: 'center',
  },
  productImage: {
    width: 80,
    height: 80,
    backgroundColor: '#ddd',
    borderRadius: 40,
    marginBottom: 10,
  },
  productName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 5,
  },
  productPrice: {
    fontSize: 16,
    color: '#699E73',
    fontWeight: 'bold',
  },
});

export default ScreenShop;