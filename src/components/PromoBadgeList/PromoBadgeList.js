import React from 'react';
import { View, ScrollView } from 'react-native';
import { PromoBadge } from '../PromoBadge';

// Import all the required icons
import UnicornIcon from '../../assets/buyer-icons/unicorn.svg';
import Top5Icon from '../../assets/buyer-icons/hand-heart.svg';
import LeavesIcon from '../../assets/buyer-icons/leaves.svg';
import PriceTagIcon from '../../assets/buyer-icons/tag-bold.svg';
import NewArrivalsIcon from '../../assets/buyer-icons/megaphone.svg';
import PriceDropIcon from '../../assets/buyer-icons/price-drop-icons.svg';

// Default promo badges configuration
const DEFAULT_PROMO_BADGES = [
  {label: 'Price Drop', icon: PriceDropIcon},
  {label: 'New Arrivals', icon: NewArrivalsIcon},
  {label: 'Latest Nursery Drop', icon: LeavesIcon},
  {label: 'Below $20', icon: PriceTagIcon},
  {label: 'Unicorn', icon: UnicornIcon},
  {label: 'Top 5 Buyer Wish List', icon: Top5Icon},
];

// Mapping from badge labels to genus/filter types
const BADGE_TO_GENUS_MAP = {
  'Price Drop': 'Price Drop',
  'New Arrivals': 'New Arrivals',
  'Latest Nursery Drop': 'Latest Nursery Drop',
  'Below $20': 'Below $20',
  'Unicorn': 'Unicorn',
  'Top 5 Buyer Wish List': 'Top 5 Buyer Wish List',
};

// Special badges that should not be treated as genus filters
const SPECIAL_BADGES = [
  'Price Drop',
  'New Arrivals',
  'Latest Nursery Drop',
  'Below $20',
  'Unicorn',
  'Top 5 Buyer Wish List',
];

const PromoBadgeList = ({
  badges = DEFAULT_PROMO_BADGES,
  onBadgePress = null,
  navigation = null,
  containerStyle = {},
  scrollViewStyle = {},
  contentContainerStyle = {},
  badgeStyle = {},
  showScrollIndicator = false,
  activeBadge = null,
}) => {
  // Default badge press handler that navigates to ScreenGenusPlants
  const handleDefaultBadgePress = (badgeLabel) => {
    if (navigation) {
      // Check if this is a special badge that shouldn't use genus parameter
      const isSpecialBadge = SPECIAL_BADGES.includes(badgeLabel);
      
      if (isSpecialBadge) {
        // For special badges, only pass the filter parameter
        navigation.navigate('ScreenGenusPlants', {
          filter: badgeLabel, // Pass the badge label as a filter parameter
          fromBadge: true, // Indicate this came from a badge click
        });
      } else {
        // For regular genus badges, pass both genus and filter
        const genus = BADGE_TO_GENUS_MAP[badgeLabel] || badgeLabel;
        navigation.navigate('ScreenGenusPlants', {
          genus: genus,
          filter: badgeLabel,
        });
      }
    }
  };

  const defaultContentContainerStyle = {
    flexDirection: 'row',
    gap: 6,
    alignItems: 'flex-start',
    paddingHorizontal: 9,
  };

  const defaultScrollViewStyle = {
    flexGrow: 0,
    paddingVertical: 1,
  };

  return (
    <View style={containerStyle}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={showScrollIndicator}
        style={[defaultScrollViewStyle, scrollViewStyle]}
        contentContainerStyle={[defaultContentContainerStyle, contentContainerStyle]}
      >
        {badges.map((badge, index) => (
          <PromoBadge
            key={badge.label || index}
            icon={badge.icon}
            label={badge.label}
            style={[{marginRight: 5}, badgeStyle]}
            onPress={onBadgePress ? () => onBadgePress(badge) : () => handleDefaultBadgePress(badge.label)}
            isActive={activeBadge === badge.label}
            {...(badge.props || {})}
          />
        ))}
      </ScrollView>
    </View>
  );
};

export default PromoBadgeList;
