import { StyleSheet } from 'react-native';
import { LIVE } from '../../styles/liveCheckoutTheme';

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
  flightTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: 8,
    flex: 1,
  },
  flightLoadingHint: {
    fontSize: 13,
    fontWeight: '500',
    color: '#6B7280',
  },
  cutoffDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#FEF3C7',
    borderRadius: 8,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  cutoffDateLabel: {
    fontSize: 14,
    fontWeight: '600',
    color: '#92400E',
  },
  cutoffDateValue: {
    fontSize: 14,
    fontWeight: '700',
    color: '#B45309',
  },
  skeletonCutoffText: {
    height: 18,
    width: 200,
    backgroundColor: '#E5E7EB',
    borderRadius: 4,
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
    position: 'relative',
  },
  optionCardAndroidLive: {
    flex: 1,
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

  /* ---------------------------------------------------------------------
   * LIVE modal variant. These are layered on top of the base styles by
   * FlightSelector when `variant === 'liveModal'`, so the full checkout page
   * (which never passes the prop) renders exactly as before.
   * ------------------------------------------------------------------- */

  // The modal supplies the cream surface and the card padding, so the section
  // becomes transparent rather than painting a second white card inside it.
  livePlantFlight: {
    backgroundColor: 'transparent',
    borderRadius: 0,
    paddingHorizontal: 0,
    paddingTop: 0,
    paddingBottom: 16,
  },

  liveCutoffDateContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
    paddingVertical: 10,
    paddingHorizontal: 12,
    backgroundColor: LIVE.amberBg,
    borderRadius: 12,
    borderLeftWidth: 0,
  },

  liveCutoffDateLabel: {
    flex: 1,
    fontSize: 14,
    fontWeight: '600',
    color: LIVE.amberText,
  },

  liveCutoffDateValue: {
    fontWeight: '700',
    color: LIVE.amberText,
  },

  // Selected: strong green outline on white. Unselected: filled sage.
  liveSelectedOptionCard: {
    backgroundColor: LIVE.card,
    borderColor: LIVE.greenBorder,
  },

  liveUnselectedOptionCard: {
    backgroundColor: LIVE.sageBg,
    borderColor: LIVE.sageBorder,
  },

  liveOptionText: {
    fontSize: 15,
    fontWeight: '700',
    color: LIVE.nearBlack,
    textAlign: 'center',
    marginBottom: 2,
  },

  liveUnselectedOptionText: {
    fontSize: 15,
    fontWeight: '600',
    color: LIVE.sageText,
    textAlign: 'center',
    marginBottom: 2,
  },

  liveOptionSubtextSelected: {
    color: LIVE.nearBlack,
  },

  liveOptionSubtextUnselected: {
    color: LIVE.sageText,
  },

  // Circular check badge pinned to the card's top-right corner.
  checkBadge: {
    position: 'absolute',
    top: -9,
    right: -9,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: LIVE.greenBorder,
    justifyContent: 'center',
    alignItems: 'center',
    zIndex: 2,
  },
});

export default styles;
