import React, { useState } from 'react';
import { Dimensions, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import BackSolidIcon from '../../../assets/iconnav/caret-left-bold.svg';

const dummyMessages = [
  { id: '1', name: 'Chloe Bennett', text: 'Joined 👋', avatar: 'https://i.pravatar.cc/100?img=11' },
  { id: '2', name: 'Ashley Carter', text: 'Leaf it to this plant to steal the show 😁', avatar: 'https://i.pravatar.cc/100?img=12' },
  { id: '3', name: 'Dylan Brooks', text: 'Look at those variegated leaves, absolute stunner!😍', avatar: 'https://i.pravatar.cc/100?img=13' },
];

const BuyerLiveStreamScreen = ({navigation}) => {
  const [comment, setComment] = useState('');

  const renderMessage = ({ item }) => (
    <View style={styles.chatMessage}>
      <Image source={{ uri: item.avatar }} style={styles.avatar} />
      <View style={styles.chatTextContainer}>
        <Text style={styles.chatName}>{item.name}</Text>
        <Text style={styles.chatText}>{item.text}</Text>
      </View>
    </View>
  );

  return (
    <View style={styles.container}>
      {/* Live video stream placeholder */}
      <Image
        source={{ uri: 'https://cdn.pixabay.com/photo/2017/08/20/20/52/golden-rod-2663113_1280.jpg' }}
        style={styles.backgroundVideo}
        resizeMode="cover"
      />

      {/* Overlay Content */}
      <View style={styles.overlay}>
        {/* Top Bar */}
        <View style={styles.topBar}>
          <TouchableOpacity>
            <BackSolidIcon name="chevron-back" size={24} color="#fff" />
          </TouchableOpacity>
          <View style={styles.topRight}>
            <View style={styles.guideButton}>
              <Text style={styles.guideText}>Guide</Text>
            </View>
            <View style={styles.viewersCount}>
              <BackSolidIcon name="eye" size={14} color="#fff" />
              <Text style={styles.viewerText}>232</Text>
            </View>
          </View>
        </View>

        {/* Chat Messages */}
        <FlatList
          data={dummyMessages}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          style={styles.chatList}
        />

        {/* Comment Input */}
        <View style={styles.commentContainer}>
          <TextInput
            value={comment}
            onChangeText={setComment}
            placeholder="Comment"
            placeholderTextColor="#888"
            style={styles.commentInput}
          />
        </View>

        {/* Product Info */}
        <View style={styles.productContainer}>
          <View style={styles.productTopRow}>
            <Text style={styles.productTitle}>Coriandrum Sativum</Text>
            <Text style={styles.productPrice}>$48.95</Text>
          </View>
          <View style={styles.productDetailsRow}>
            <Text style={styles.productSubtitle}>Inner Variegated · 2”-4”</Text>
            <View style={styles.discountBox}>
              <Text style={styles.discountText}>33% OFF</Text>
            </View>
          </View>

          <View style={styles.shippingRow}>
            <View style={styles.badge}>
              <Text style={styles.badgeText}>Grower’s Choice</Text>
            </View>
            <View style={styles.badge}>
              <BackSolidIcon name="bus" size={12} color="#fff" />
              <Text style={styles.badgeText}> UPS 2nd Day $50</Text>
            </View>
          </View>
        </View>

        {/* Buy Now Button */}
        <TouchableOpacity style={styles.buyButton}>
          <Text style={styles.buyButtonText}>Buy Now</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default BuyerLiveStreamScreen;

const { width, height } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  backgroundVideo: {
    width,
    height,
    position: 'absolute',
  },
  overlay: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  topBar: {
    position: 'absolute',
    top: 50,
    left: 20,
    right: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  topRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  guideButton: {
    backgroundColor: '#333',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 8,
  },
  guideText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  viewersCount: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#3FAE2A',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
  },
  viewerText: {
    color: '#fff',
    marginLeft: 5,
    fontWeight: 'bold',
  },
  chatList: {
    maxHeight: height * 0.4,
    paddingHorizontal: 16,
    marginBottom: 120,
  },
  chatMessage: {
    flexDirection: 'row',
    marginBottom: 10,
  },
  avatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 8,
  },
  chatTextContainer: {
    backgroundColor: 'rgba(0,0,0,0.3)',
    borderRadius: 10,
    paddingHorizontal: 10,
    paddingVertical: 6,
  },
  chatName: {
    fontWeight: 'bold',
    color: '#fff',
    fontSize: 12,
  },
  chatText: {
    color: '#fff',
    fontSize: 13,
  },
  commentContainer: {
    paddingHorizontal: 16,
    marginBottom: 10,
  },
  commentInput: {
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingVertical: 10,
    paddingHorizontal: 16,
  },
  productContainer: {
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: 16,
  },
  productTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 4,
  },
  productTitle: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 16,
  },
  productPrice: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  productDetailsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  productSubtitle: {
    color: '#eee',
    fontSize: 13,
  },
  discountBox: {
    backgroundColor: '#FF453A',
    borderRadius: 4,
    paddingHorizontal: 6,
    paddingVertical: 2,
  },
  discountText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
  },
  shippingRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  badge: {
    backgroundColor: '#333',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 6,
    flexDirection: 'row',
    alignItems: 'center',
  },
  badgeText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: '600',
  },
  buyButton: {
    backgroundColor: '#3FAE2A',
    paddingVertical: 14,
    borderRadius: 12,
    margin: 16,
    alignItems: 'center',
  },
  buyButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
});
