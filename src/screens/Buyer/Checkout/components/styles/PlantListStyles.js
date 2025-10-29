import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  plantList: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  plantItemWrapper: {
    marginBottom: 16,
  },
  plantItemDetails: {
    marginTop: 12,
    gap: 8,
  },
  titleCountry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  titleText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#111827',
    flex: 1,
  },
  countryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  countryText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
  plantShipping: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  shippingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  shippingIcon: {
    color: '#6B7280',
  },
  airCargoIcon: {
    color: '#6B7280',
  },
  shippingText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6B7280',
  },
});

export default styles;
