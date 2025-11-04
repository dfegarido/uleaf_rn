import React, {useEffect, useState, useRef} from 'react';
import { ScrollView, View, Text, TextInput, TouchableOpacity, StyleSheet, Image, Animated } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useNavigation, useRoute } from '@react-navigation/native';
import Svg, { Path } from 'react-native-svg';
import NetInfo from '@react-native-community/netinfo';
import { getAdminListingsApi } from '../../../components/Api/getAdminListingsApi';
import FlagTH from '../../../assets/country-flags/TH.svg';
import FlagID from '../../../assets/country-flags/ID.svg';
import FlagPH from '../../../assets/country-flags/PH.svg';

const SelectListingScreen = () => {
  const navigation = useNavigation();
  const route = useRoute();
  const { selectedListings: initialSelected = [] } = route.params || {};
  const [listingOptions, setListingOptions] = useState([]);
  const [listingSearch, setListingSearch] = useState('');
  const [listingLoading, setListingLoading] = useState(false);
  const [selectedListings, setSelectedListings] = useState(initialSelected);
  const [tooltipVisible, setTooltipVisible] = useState(null);

  const countryNameToCode = {
    Thailand: 'TH',
    Indonesia: 'ID',
    Philippines: 'PH',
  };

  const getCountryCode = (label) => {
    const text = (label || '').trim();
    if (/^[A-Z]{2}$/.test(text)) return text;
    return countryNameToCode[text] || null;
  };

  const renderFlag = (code) => {
    switch (code) {
      case 'TH':
        return <FlagTH width={24} height={16} />;
      case 'ID':
        return <FlagID width={24} height={16} />;
      case 'PH':
        return <FlagPH width={24} height={16} />;
      default:
        return <View style={{width: 24, height: 16, borderRadius: 2, backgroundColor: '#F0F0F0'}} />;
    }
  };

  useEffect(() => {
    const loadListings = async () => {
      try {
        setListingLoading(true);
        const net = await NetInfo.fetch();
        if (!net.isConnected || !net.isInternetReachable) {
          setListingLoading(false);
          return;
        }
        const res = await getAdminListingsApi({ limit: 100, page: 1 });
        const listings = res?.data?.listings || [];
        setListingOptions(listings);
      } catch (e) {
        setListingOptions([]);
      } finally {
        setListingLoading(false);
      }
    };
    loadListings();
  }, []);

  const handleApply = () => {
    // Get return screen name from route params, or fallback to default
    const { returnScreenName } = route.params || {};
    
    if (returnScreenName) {
      // Navigate to the specified return screen with selected listings
      navigation.navigate(returnScreenName, {
        selectedListingsResult: selectedListings,
      });
    } else {
      // Fallback: navigate to AdminDiscountAmountOffPlantsPercentage (original behavior)
      navigation.navigate('AdminDiscountAmountOffPlantsPercentage', {
        selectedListingsResult: selectedListings,
      });
    }
  };

  const filteredListings = listingOptions.filter(listing => {
    const search = listingSearch.toLowerCase();
    return !search || 
      (listing.plantCode || '').toLowerCase().includes(search) ||
      (listing.plantName || '').toLowerCase().includes(search) ||
      ((listing.genus || '') + ' ' + (listing.species || '')).toLowerCase().includes(search);
  });

  // Skeleton Loading Component
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
          backgroundColor: '#E4E7E9',
          borderRadius: 4,
          opacity: pulseAnim,
        }, style]} 
      />
    );
  };

  const ListingSkeleton = () => (
    <View style={styles.listingCard}>
      <View style={styles.plantCard}>
        <View style={styles.imageContainer}>
          <SkeletonItem width={96} height={128} style={{ borderRadius: 8 }} />
        </View>
        <View style={styles.detailsContainer}>
          <View style={styles.nameSection}>
            <View style={styles.codeRow}>
              <SkeletonItem width={110} height={28} />
              <SkeletonItem width={53} height={28} style={{ marginLeft: 8 }} />
            </View>
            <SkeletonItem width={203} height={48} style={{ marginTop: 4 }} />
            <SkeletonItem width={150} height={22} style={{ marginTop: 4 }} />
          </View>
          <View style={styles.badgeRow}>
            <SkeletonItem width={112} height={24} />
          </View>
          <SkeletonItem width={70} height={32} style={{ marginTop: 4 }} />
        </View>
      </View>
      <View style={styles.detailsSection}>
        <View style={styles.userContainer}>
          <SkeletonItem width={40} height={40} style={{ borderRadius: 20 }} />
          <View style={{ flex: 1, marginLeft: 8 }}>
            <SkeletonItem width={150} height={24} />
            <SkeletonItem width={100} height={20} style={{ marginTop: 4 }} />
          </View>
        </View>
      </View>
    </View>
  );

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Svg width={24} height={24} viewBox="0 0 24 24" fill="none">
            <Path fillRule="evenodd" clipRule="evenodd" d="M15.5303 3.96967C15.8232 4.26256 15.8232 4.73744 15.5303 5.03033L8.56066 12L15.5303 18.9697C15.8232 19.2626 15.8232 19.7374 15.5303 20.0303C15.2374 20.3232 14.7626 20.3232 14.4697 20.0303L6.96967 12.5303C6.67678 12.2374 6.67678 11.7626 6.96967 11.4697L14.4697 3.96967C14.7626 3.67678 15.2374 3.67678 15.5303 3.96967Z" fill="#393D40"/>
          </Svg>
        </TouchableOpacity>
        <View style={styles.searchContainer}>
          <View style={styles.searchField}>
            <Svg width={24} height={24} viewBox="0 0 24 24" fill="none" style={{marginRight: 8}}>
              <Path fillRule="evenodd" clipRule="evenodd" d="M11 4C7.13401 4 4 7.13401 4 11C4 14.866 7.13401 18 11 18C12.8859 18 14.5977 17.2542 15.8647 16.0414L19.7071 19.8838C20.0976 20.2744 20.7308 20.2744 21.1213 19.8838C21.5118 19.4933 21.5118 18.8601 21.1213 18.4696L17.2789 14.6272C18.4897 13.3602 19.2355 11.6484 19.2355 9.76246C19.2355 5.89647 16.1015 2.76246 12.2355 2.76246H11V4ZM12.2355 4.76246C15.2731 4.76246 17.7355 7.22484 17.7355 10.2625C17.7355 13.3001 15.2731 15.7625 12.2355 15.7625C9.19782 15.7625 6.73544 13.3001 6.73544 10.2625C6.73544 7.22484 9.19782 4.76246 12.2355 4.76246Z" fill="#7F8D91"/>
            </Svg>
            <TextInput
              style={styles.searchInput}
              placeholder="Search listing"
              placeholderTextColor="#647276"
              autoCapitalize="none"
              autoCorrect={false}
              value={listingSearch}
              onChangeText={setListingSearch}
            />
          </View>
        </View>
      </View>

      {/* Content */}
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={true}
        keyboardShouldPersistTaps="handled"
      >
        {listingLoading ? (
          <>
            <ListingSkeleton />
            <ListingSkeleton />
            <ListingSkeleton />
            <ListingSkeleton />
            <ListingSkeleton />
          </>
        ) : filteredListings.length === 0 ? (
          <View style={styles.emptyContainer}>
            <Text style={styles.emptyText}>No listings found</Text>
          </View>
        ) : (
          filteredListings.map((listing) => {
            const isSelected = selectedListings.some(l => l.id === listing.id);
            const v0 = listing.variations && listing.variations.length ? listing.variations[0] : {};
            const imageUri = listing.imagePrimary || listing.image || v0.imagePrimary || v0.image;
            const plantCode = listing.plantCode || '';
            const countryCode = listing.country || v0.country || '';
            const genus = listing.genus || '';
            const species = listing.species || '';
            const variegation = listing.variegation || v0.variegation || '';
            const size = listing.potSize || v0.potSize || '';
            const listingType = listing.listingType || v0.listingType || '';
            const discountPercent = listing.discountPercent || v0.discountPercent;
            const price = listing.usdPrice ?? v0.usdPrice ?? 0;
            const originalPrice = listing.originalPrice || v0.originalPrice;
            // Handle seller data - can be string or object
            const sellerData = listing.seller || listing.sellerInfo || listing.user || {};
            let sellerName = '';
            let sellerUsername = '';
            let sellerAvatar = '';
            
            if (typeof sellerData === 'string') {
              // Seller is just a string (full name)
              sellerName = sellerData;
              sellerUsername = listing.sellerUsername || listing.sellerEmail || listing.username || '';
            } else if (sellerData && typeof sellerData === 'object' && !Array.isArray(sellerData)) {
              // Seller is an object
              sellerName = sellerData.name || 
                          sellerData.firstName || 
                          sellerData.fullName || 
                          (sellerData.firstName && sellerData.lastName ? `${sellerData.firstName} ${sellerData.lastName}` : '') ||
                          listing.sellerName || 
                          listing.gardenOrCompanyName ||
                          '';
              sellerUsername = sellerData.username || 
                              sellerData.email || 
                              listing.sellerUsername || 
                              listing.sellerEmail ||
                              listing.username ||
                              '';
              sellerAvatar = sellerData.avatar || 
                            sellerData.profileImage || 
                            sellerData.profilePicture ||
                            listing.sellerAvatar ||
                            '';
            } else {
              // Fallback to listing-level seller fields
              sellerName = listing.sellerName || listing.gardenOrCompanyName || listing.garden || '';
              sellerUsername = listing.sellerUsername || listing.sellerEmail || listing.username || '';
              sellerAvatar = listing.sellerAvatar || '';
            }
            
            // If still no name, try to split seller string if it exists
            if (!sellerName && listing.seller && typeof listing.seller === 'string') {
              sellerName = listing.seller;
            }
            
            // Final fallback: use garden name if no seller name found
            if (!sellerName) {
              sellerName = listing.gardenOrCompanyName || listing.garden || 'Unknown Seller';
            }
            
            // Debug logging (can be removed later) - only log if both are missing after all fallbacks
            if (!sellerUsername) {
              console.log('No seller username found for listing:', listing.id, {
                seller: listing.seller,
                sellerInfo: listing.sellerInfo,
                sellerName: listing.sellerName,
                sellerUsername: listing.sellerUsername,
                gardenOrCompanyName: listing.gardenOrCompanyName,
                user: listing.user,
                extractedName: sellerName,
                extractedUsername: sellerUsername
              });
            }
            
            return (
              <View key={listing.id} style={styles.listingCard}>
                {/* Plant Card */}
                <View style={styles.plantCard}>
                  {/* Image with checkbox */}
                  <View style={styles.imageContainer}>
                    {imageUri ? (
                      <Image source={{uri: imageUri}} style={styles.image} resizeMode="cover" />
                    ) : (
                      <View style={[styles.image, {backgroundColor: '#E4E7E9'}]} />
                    )}
                    <View style={styles.checkboxContainer}>
                      <TouchableOpacity
                        activeOpacity={1}
                        onPress={() => {
                          if (isSelected) {
                            setSelectedListings(prev => prev.filter(l => l.id !== listing.id));
                          } else {
                            setSelectedListings(prev => [...prev, listing]);
                          }
                        }}
                      >
                        <View style={[styles.checkbox, isSelected && styles.checkboxSelected]}>
                          {isSelected && (
                            <Svg width={16} height={16} viewBox="0 0 24 24" fill="none">
                              <Path d="M5 13L9 17L19 7" stroke="#FFFFFF" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </Svg>
                          )}
                        </View>
                      </TouchableOpacity>
                    </View>
                  </View>
                  
                  {/* Details */}
                  <View style={styles.detailsContainer}>
                    {/* Name Section */}
                    <View style={styles.nameSection}>
                      {/* Code + Country */}
                      <View style={styles.codeRow}>
                        <View style={styles.codeContainer}>
                          <Text style={styles.plantCode}>{plantCode}</Text>
                          <View style={styles.tooltipContainer}>
                            <TouchableOpacity 
                              style={styles.helpIconContainer}
                              onPress={() => setTooltipVisible(tooltipVisible === listing.id ? null : listing.id)}
                            >
                              <Svg width={20} height={20} viewBox="0 0 20 20" fill="none">
                                <Path d="M10 15.3125C10.6904 15.3125 11.25 14.7529 11.25 14.0625C11.25 13.3721 10.6904 12.8125 10 12.8125C9.30964 12.8125 8.75 13.3721 8.75 14.0625C8.75 14.7529 9.30964 15.3125 10 15.3125Z" fill="#7F8D91"/>
                                <Path fillRule="evenodd" clipRule="evenodd" d="M10 3.4375C6.37563 3.4375 3.4375 6.37563 3.4375 10C3.4375 13.6244 6.37563 16.5625 10 16.5625C13.6244 16.5625 16.5625 13.6244 16.5625 10C16.5625 6.37563 13.6244 3.4375 10 3.4375ZM1.5625 10C1.5625 5.3401 5.3401 1.5625 10 1.5625C14.6599 1.5625 18.4375 5.3401 18.4375 10C18.4375 14.6599 14.6599 18.4375 10 18.4375C5.3401 18.4375 1.5625 14.6599 1.5625 10ZM6.5625 8.125C6.5625 6.28577 8.22324 5 10 5C11.7768 5 13.4375 6.28577 13.4375 8.125C13.4375 9.64136 12.3087 10.7815 10.9166 11.1351C10.8259 11.558 10.45 11.875 10 11.875C9.48223 11.875 9.0625 11.4553 9.0625 10.9375V10.3125C9.0625 9.79473 9.48223 9.375 10 9.375C10.9842 9.375 11.5625 8.7014 11.5625 8.125C11.5625 7.5486 10.9842 6.875 10 6.875C9.01582 6.875 8.4375 7.5486 8.4375 8.125V8.4375C8.4375 8.95527 8.01777 9.375 7.5 9.375C6.98223 9.375 6.5625 8.95527 6.5625 8.4375V8.125Z" fill="#7F8D91"/>
                              </Svg>
                            </TouchableOpacity>
                            {tooltipVisible === listing.id && (
                              <View style={styles.tooltip}>
                                <Text style={styles.tooltipText}>Plant code</Text>
                              </View>
                            )}
                          </View>
                        </View>
                        <View style={styles.countryContainer}>
                          <Text style={styles.countryText}>{countryCode}</Text>
                          {renderFlag(getCountryCode(countryCode))}
                        </View>
                      </View>
                      
                      {/* Genus + Species */}
                      <Text style={styles.genusSpecies}>
                        {genus} {species}
                      </Text>
                      
                      {/* Variegation + Size */}
                      <View style={styles.variegationRow}>
                        <Text style={styles.variegationText}>{variegation}</Text>
                        <View style={styles.dividerDot} />
                        <Text style={styles.sizeText}>{size}</Text>
                      </View>
                    </View>
                    
                    {/* Type + Discount */}
                    <View style={styles.badgeRow}>
                      {listingType && (
                        <View style={styles.listingTypeBadge}>
                          <Text style={styles.listingTypeText}>{listingType}</Text>
                        </View>
                      )}
                      {discountPercent && (
                        <View style={styles.discountBadge}>
                          <Text style={styles.discountPercentText}>{discountPercent}%</Text>
                          <Text style={styles.discountOffText}>OFF</Text>
                        </View>
                      )}
                    </View>
                    
                    {/* Price */}
                    <View style={styles.priceRow}>
                      <Text style={styles.priceText}>${price}</Text>
                      {originalPrice && originalPrice > price && (
                        <Text style={styles.originalPriceText}>${originalPrice}</Text>
                      )}
                    </View>
                  </View>
                </View>
                
                {/* Details Section (Seller Info) */}
                <View style={styles.detailsSection}>
                  <View style={styles.userContainer}>
                    {sellerAvatar ? (
                      <Image source={{uri: sellerAvatar}} style={styles.avatar} />
                    ) : (
                      <View style={[styles.avatar, styles.avatarPlaceholder]}>
                        <Text style={styles.avatarText}>
                          {sellerName.charAt(0).toUpperCase() || 'U'}
                        </Text>
                      </View>
                    )}
                    <View style={styles.userContent}>
                      <View style={styles.sellerNameRow}>
                        {sellerName ? (
                          <Text style={styles.sellerName} numberOfLines={1}>{sellerName}</Text>
                        ) : null}
                        {sellerUsername ? (
                          <Text style={styles.sellerUsername} numberOfLines={1}>@{sellerUsername}</Text>
                        ) : null}
                      </View>
                      <View style={styles.roleRow}>
                        <Text style={styles.sellerRole}>Seller</Text>
                      </View>
                    </View>
                  </View>
                </View>
              </View>
            );
          })
        )}
      </ScrollView>

      {/* Action Bar */}
      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.applyButton} onPress={handleApply}>
          <Text style={styles.applyButtonText}>Apply</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

export default SelectListingScreen;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#FFFFFF',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    gap: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#E4E7E9',
  },
  backButton: {
    padding: 4,
  },
  searchContainer: {
    flex: 1,
  },
  searchField: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#CDD3D4',
    borderRadius: 12,
    minHeight: 40,
  },
  searchInput: {
    flex: 1,
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#202325',
    padding: 0,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: 0,
    paddingBottom: 16,
  },
  listingCard: {
    paddingVertical: 12,
    paddingHorizontal: 12,
    paddingBottom: 16,
    backgroundColor: '#F5F6F6',
    borderRadius: 0,
    width: '100%',
    alignSelf: 'stretch',
  },
  plantCard: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    alignSelf: 'stretch',
    minHeight: 170,
    marginBottom: 12,
  },
  imageContainer: {
    width: 96,
    height: 128,
    marginRight: 12,
    position: 'relative',
  },
  image: {
    width: 96,
    height: 128,
    borderRadius: 8,
  },
  checkboxContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    width: 32,
    height: 32,
    padding: 4,
    alignItems: 'flex-start',
    justifyContent: 'flex-start',
  },
  checkbox: {
    width: 24,
    height: 24,
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: '#647276',
    borderRadius: 6,
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSelected: {
    backgroundColor: '#539461',
    borderColor: '#539461',
    borderWidth: 1,
  },
  detailsContainer: {
    flex: 1,
    marginLeft: 12,
  },
  nameSection: {
    marginBottom: 4,
    alignSelf: 'stretch',
  },
  codeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 28,
    marginBottom: 4,
    alignSelf: 'stretch',
  },
  codeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    marginRight: 8,
  },
  plantCode: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  helpIconContainer: {
    width: 28,
    height: 28,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 4,
    marginLeft: 8,
  },
  tooltipContainer: {
    position: 'relative',
  },
  tooltip: {
    position: 'absolute',
    bottom: 32,
    left: 0,
    backgroundColor: '#539461',
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    zIndex: 1000,
    minWidth: 80,
  },
  tooltipText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 12,
    lineHeight: 16,
    color: '#FFFFFF',
  },
  countryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginLeft: 8,
  },
  countryText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#556065',
  },
  genusSpecies: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 16,
    lineHeight: 24,
    color: '#202325',
    minHeight: 24,
    marginBottom: 4,
    alignSelf: 'stretch',
  },
  variegationRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 22,
    marginBottom: 4,
    alignSelf: 'stretch',
  },
  variegationText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  dividerDot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#7F8D91',
    marginHorizontal: 6,
  },
  sizeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 22,
    color: '#647276',
  },
  badgeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 24,
    marginBottom: 4,
    flexWrap: 'wrap',
    alignSelf: 'stretch',
  },
  listingTypeBadge: {
    paddingHorizontal: 8,
    paddingTop: 1,
    paddingBottom: 1,
    backgroundColor: '#202325',
    borderRadius: 6,
    minHeight: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 6,
  },
  listingTypeText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 12,
    lineHeight: 17,
    color: '#FFFFFF',
  },
  discountBadge: {
    flexDirection: 'row',
    paddingHorizontal: 8,
    paddingVertical: 2,
    backgroundColor: '#FFE7E2',
    borderRadius: 8,
    alignItems: 'center',
  },
  discountPercentText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#E7522F',
  },
  discountOffText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 14,
    lineHeight: 20,
    color: '#E7522F',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    minHeight: 32,
    marginTop: 4,
    alignSelf: 'stretch',
  },
  priceText: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 20,
    lineHeight: 24,
    color: '#539461',
    marginRight: 4,
  },
  originalPriceText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#7F8D91',
    textDecorationLine: 'line-through',
  },
  detailsSection: {
    paddingHorizontal: 6,
    paddingVertical: 8,
    alignSelf: 'stretch',
    minHeight: 44,
  },
  userContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    alignSelf: 'stretch',
    width: 345,
    height: 44,
    gap: 8,
  },
  avatar: {
    width: 40,
    minWidth: 40,
    height: 40,
    minHeight: 40,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#539461',
  },
  avatarPlaceholder: {
    backgroundColor: '#48A7F8',
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: '#539461',
  },
  avatarText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    color: '#FFFFFF',
  },
  userContent: {
    width: 297,
    height: 44,
    flex: 1,
    gap: 0,
  },
  sellerNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 24,
    gap: 4,
    width: 297,
    alignSelf: 'stretch',
  },
  sellerName: {
    fontFamily: 'Inter',
    fontWeight: '700',
    fontSize: 18,
    lineHeight: 24,
    color: '#202325',
    width: 150,
    height: 24,
  },
  sellerUsername: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    lineHeight: 22,
    color: '#7F8D91',
    width: 143,
    height: 22,
    flex: 1,
  },
  roleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 20,
    gap: 4,
    width: 297,
    alignSelf: 'stretch',
  },
  sellerRole: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 14,
    lineHeight: 20,
    color: '#647276',
    minWidth: 38,
    height: 20,
  },
  emptyContainer: {
    padding: 24,
    alignItems: 'center',
  },
  emptyText: {
    fontFamily: 'Inter',
    fontWeight: '500',
    fontSize: 16,
    color: '#647276',
  },
  actionBar: {
    paddingHorizontal: 24,
    paddingTop: 12,
    paddingBottom: 12,
    backgroundColor: '#FFFFFF',
  },
  applyButton: {
    height: 48,
    borderRadius: 12,
    backgroundColor: '#539461',
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyButtonText: {
    fontFamily: 'Inter',
    fontWeight: '600',
    fontSize: 16,
    lineHeight: 16,
    color: '#FFFFFF',
  },
});

