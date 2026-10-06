/**
 * Palette for the buyer LIVE Checkout bottom sheet.
 *
 * Only the live modal uses these. The full-screen CheckoutScreen keeps its
 * existing colours, so nothing here is applied globally. Kept in one place so
 * the modal, FlightSelector and CheckoutBar cannot drift apart as the design is
 * tuned.
 */
export const LIVE = {
  // Surface
  cream: '#F8F6EF',
  card: '#FFFFFF',

  // Greens
  greenBorder: '#0E7036',
  greenButton: '#135C36',
  greenName: '#163B2D',

  // Cutoff banner
  amberBg: '#FDE9C3',
  amberText: '#7D5318',

  // Unselected date card
  sageBg: '#E4E9E4',
  sageBorder: '#B9C5BA',
  sageText: '#586B5D',

  // Neutrals
  nearBlack: '#111111',
  muted: '#6B6B6B',
  divider: '#E0E0E0',
  closeCircle: '#EBEBEB',
  skeleton: '#E5E7EB',
};

export default LIVE;
