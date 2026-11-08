import { paymentErrorAlert } from '../src/screens/Buyer/Orders/paymentErrorAlert';

const OLD = 'Failed to create/capturing order';
const FALLBACK = 'Payment failed. Please try again or contact support.';

describe('paymentErrorAlert', () => {
  it('uses the title and message from a new vault failure and allows retry', () => {
    expect(
      paymentErrorAlert({ error: OLD, title: 'Venmo declined', message: 'Try again (Ref: ABC123)', ref: 'ABC123' }),
    ).toEqual({ title: 'Venmo declined', message: 'Try again (Ref: ABC123)', retry: true });
  });

  it('falls back to the old text for an old-style response', () => {
    expect(paymentErrorAlert({ error: OLD })).toEqual({
      title: "Payment didn't go through",
      message: FALLBACK,
      retry: true,
    });
  });

  it('shows a plain error without retry', () => {
    expect(paymentErrorAlert({ error: 'Card expired' })).toEqual({
      title: "Payment didn't go through",
      message: 'Card expired',
      retry: false,
    });
  });

  it('falls back for an empty response', () => {
    expect(paymentErrorAlert({})).toEqual({ title: "Payment didn't go through", message: FALLBACK, retry: false });
  });

  it('never shows technical text', () => {
    const out = paymentErrorAlert({ error: OLD });
    expect(JSON.stringify(out)).not.toContain('PayPal create order failed');
  });

  it('shows the plain sentence for a network failure, not the technical error', () => {
    const msg = "We couldn't reach our server. Check your internet connection and try again.";
    const out = paymentErrorAlert({ error: 'Network request failed', message: msg });
    expect(out.message).toBe(msg);
    expect(JSON.stringify(out)).not.toContain('Network request failed');
  });
});
