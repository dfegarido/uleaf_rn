// The hosted payment page.
//
// It is served from the preview channel, which is the build that talks to the Supabase
// payment endpoints (payment-completion / payment-status). The live channel still serves
// the older build that calls the Firebase functions.
//
// Preview channel (expires 2026-11-20):
// https://i-leaf-u--supabase-payment-e4rvymck.web.app
// The custom domain payment.ileafu.com points at the live channel.
export const paymentPaypalVenmoUrl = 'https://i-leaf-u--supabase-payment-e4rvymck.web.app/';
