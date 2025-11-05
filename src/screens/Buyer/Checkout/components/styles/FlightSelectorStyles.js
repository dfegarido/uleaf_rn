import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  plantFlight: {
    backgroundColor: '#FFFFFF',
    borderRadius: 12,
    padding: 16,
    marginBottom: 16,
  },
  flightTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  flightTitleText: {
    fontSize: 18,
    fontWeight: '700',
    color: '#111827',
  },
  infoCircle: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#F3F4F6',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoCircleText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#6B7280',
  },
  flightOptions: {
    marginTop: 8,
  },
  optionCards: {
    gap: 12,
  },
  optionLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    marginBottom: 8,
  },
  flightOptionsRow: {
    flexDirection: 'row',
    gap: 12,
    flexWrap: 'wrap',
  },
  optionCard: {
    flex: 1,
    minWidth: 100,
    padding: 16,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: '#E5E7EB',
  },
  selectedOptionCard: {
    backgroundColor: '#F0FDF4',
    borderColor: '#059669',
  },
  unselectedOptionCard: {
    backgroundColor: '#FFFFFF',
    borderColor: '#E5E7EB',
  },
  mutedOption: {
    backgroundColor: '#F9FAFB',
    borderColor: '#D1D5DB',
    opacity: 0.6,
  },
  skeletonCard: {
    height: 80,
    borderWidth: 0,
  },
  optionText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#059669',
    textAlign: 'center',
    marginBottom: 4,
  },
  unselectedOptionText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#374151',
    textAlign: 'center',
    marginBottom: 4,
  },
  optionSubtext: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6B7280',
    textAlign: 'center',
  },
  disabledNote: {
    fontSize: 12,
    color: '#647276',
    fontStyle: 'italic',
    marginLeft: 8,
  },
  disabledNoteBold: {
    fontWeight: '700',
    fontStyle: 'normal',
  },
});

export default styles;
