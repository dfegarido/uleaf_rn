import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  checkoutBar: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 28,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: -4 },
    elevation: 6,
  },
  warningContainer: {
    backgroundColor: '#FEF3C7',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginBottom: 12,
    borderLeftWidth: 3,
    borderLeftColor: '#F59E0B',
  },
  warningText: {
    fontSize: 13,
    color: '#92400E',
    fontWeight: '600',
    textAlign: 'center',
  },
  checkoutContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  checkoutSummary: {
    flex: 1,
  },
  amountRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  amountLabel: {
    fontSize: 14,
    color: '#6B7280',
    marginRight: 8,
  },
  amountValue: {
    fontSize: 20,
    fontWeight: '700',
    color: '#111827',
  },
  infoIcon: {
    marginLeft: 8,
  },
  discountRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
  },
  discountSavings: {
    fontSize: 12,
    color: '#059669',
    marginRight: 6,
  },
  discountAmount: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
  },
  placeOrderButton: {
    backgroundColor: '#2E7D32',
    paddingHorizontal: 18,
    paddingVertical: 14,
    borderRadius: 12,
    marginLeft: 12,
  },
  placeOrderButtonDisabled: {
    backgroundColor: '#E5E7EB', // Light gray background when disabled
  },
  buttonText: {
    minWidth: 120,
    alignItems: 'center',
  },
  buttonLabel: {
    color: '#FFFFFF',
    fontSize: 16,
    fontWeight: '700',
  },
  buttonLabelDisabled: {
    color: '#6B7280', // Dark gray text when disabled for better visibility
    fontSize: 16,
    fontWeight: '700',
  },
  buttonSkeleton: {
    height: 20,
    width: 100,
    borderRadius: 6,
    backgroundColor: '#E5E7EB',
  },
  venmoButton: {
      flexDirection: 'row',
      justifyContent: 'center',
      alignItems: 'center',
      padding: 12,
      backgroundColor: '#0074DE', // Venmo Blue
      borderRadius: 12,
      flex: 1,
  },
  venmoButtonDisabled: {
      backgroundColor: '#A9B3B7', // A muted gray for the disabled state
  },
  venmoButtonContent: {
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
  },
  venmoFirstLine: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  venmoButtonText: {
      color: '#FFFFFF',
      fontSize: 14,
      fontWeight: 'bold',
      marginRight: 8,
      fontStyle: 'italic',
  },
  venmoUsernameText: {
      color: '#FFFFFF',
      fontSize: 12,
      fontWeight: '500',
      marginLeft: 0,
      marginTop: 4,
  },
});

export default styles;
