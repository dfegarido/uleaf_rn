// The hosted payment page. It follows the Supabase environment (src/config/apiConfig.js):
//
// - PRODUCTION (release builds / APK, or USE_LOCAL_SUPABASE=false): the `redesign-payment`
//   preview channel - production Supabase payment endpoints, LIVE PayPal (real money).
//   https://i-leaf-u--redesign-payment-soyzi0iu.web.app
// - STAGING (dev build with USE_LOCAL_SUPABASE=true): the `staging-payment` preview channel -
//   the staging branch's payment endpoints, PayPal SANDBOX (fake money).
//   https://i-leaf-u--staging-payment-c9t3vl4y.web.app
//
// A preview channel expires 30 days after its last deploy. The custom domain
// payment.ileafu.com points at the live channel, which still serves the older build that
// calls the Firebase functions. A dev build can override the page with PAYMENT_PAGE_URL.
import { PAYMENT_PAGE_URL } from '@env';
import { USE_STAGING } from './src/config/apiConfig';

const PRODUCTION_PAYMENT_PAGE = 'https://i-leaf-u--redesign-payment-soyzi0iu.web.app/';
const STAGING_PAYMENT_PAGE = 'https://i-leaf-u--staging-payment-c9t3vl4y.web.app/';

export const paymentPaypalVenmoUrl =
  (__DEV__ && PAYMENT_PAGE_URL) || (USE_STAGING ? STAGING_PAYMENT_PAGE : PRODUCTION_PAYMENT_PAGE);
