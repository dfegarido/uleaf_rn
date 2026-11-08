// Builds the alert content for a failed payment-completion response. Old backends send only `error`.
const RETRYABLE_ERROR = 'Failed to create/capturing order';
const FALLBACK_MESSAGE = 'Payment failed. Please try again or contact support.';

export const paymentErrorAlert = (response = {}) => ({
  title: response.title || "Payment didn't go through",
  message:
    response.message ||
    (response.error === RETRYABLE_ERROR ? FALLBACK_MESSAGE : response.error) ||
    FALLBACK_MESSAGE,
  retry: response.error === RETRYABLE_ERROR,
});
