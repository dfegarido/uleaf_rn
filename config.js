// The hosted payment page.
//
// It is served from the `redesign-payment` preview channel, the build that talks to the
// production Supabase payment endpoints (payment-completion / payment-status). The live
// channel still serves the older build that calls the Firebase functions.
//
// Preview channel (a channel expires 30 days after its last deploy):
// https://i-leaf-u--redesign-payment-soyzi0iu.web.app
// The custom domain payment.ileafu.com points at the live channel.
// A dev build can use a locally served page instead (PAYMENT_PAGE_URL in .env).
import { PAYMENT_PAGE_URL } from '@env';
export const paymentPaypalVenmoUrl =
  (__DEV__ && PAYMENT_PAGE_URL) || 'https://i-leaf-u--redesign-payment-soyzi0iu.web.app/';
