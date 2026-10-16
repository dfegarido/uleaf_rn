import {Alert, Linking, Platform} from 'react-native';
import {openBrowser, closeBrowser} from '@swan-io/react-native-browser';
import {paymentPaypalVenmoUrl} from '../../config';

/**
 * Opens the hosted PayPal/Venmo page in an in-app browser sheet
 * (SFSafariViewController on iOS, Chrome Custom Tabs on Android) instead of
 * handing the whole app over to a separate browser.
 *
 * The return contract is unchanged: the page redirects to
 * `ileafu://payment-success|payment-cancel`, which the existing Linking
 * listeners already consume (CheckoutScreenLive, AppNavigation).
 *
 * Measured behaviour this file relies on (docs/plans/2026-10-16-payment-inapp-browser-sheet.md):
 * - `openBrowser`'s promise resolves on **presentation**, not dismissal, on both platforms
 *   (RNSwanBrowserModuleImpl.kt:88, RNSwanBrowser.mm:119), so awaiting it never blocks the caller.
 * - On Android we cannot tell whether the user got a sheet or a full browser (the library falls
 *   fallback to `Intent.ACTION_VIEW` and still resolves), and "no Chrome" is not an error — only a
 *   failed launch is. So the fallback below is catch-based, never a browser/version check, and
 *   Chrome is never forced.
 * - Android is the exception that needed patching (patches/@swan-io+react-native-browser+1.1.2.patch):
 *   when nothing on the device implements Custom Tabs, the library silently falls back to a plain
 *   `ACTION_VIEW`, which can land in an OEM WebView shell where PayPal/Venmo cannot finish — and it
 *   still resolves, so JS cannot tell. The patch makes that case reject with
 *   `swan_browser_unavailable`, which is what the stopper below is wired to.
 */

const CHROME_PACKAGE = 'com.android.chrome';
const MARKET_URL = `market://details?id=${CHROME_PACKAGE}`;
const PLAY_STORE_URL = `https://play.google.com/store/apps/details?id=${CHROME_PACKAGE}`;
const SUPPORT_URL = 'mailto:ileafuasiausa@gmail.com?subject=Support%20Request';

/**
 * How long to wait before presenting the sheet.
 *
 * The library presents from `RCTPresentedViewController()` — whatever view controller is on top
 * at that instant. A controller that is still animating away in the same tick (an RN `<Modal>`
 * that was just set invisible, a UIAlertController action such as "Retry Payment", the
 * "Processing your order…" modal) would be picked as the presenter: when it finishes dismissing it
 * takes the sheet down with it and strands the presentation container as an invisible full-screen
 * overlay that swallows every touch — the app looks frozen until relaunch. Waiting past the
 * ~350 ms dismissal animation means we never present from a controller that is on its way out.
 */
const SHEET_OPEN_DELAY_MS = 450;
const delayFor = ms => new Promise(resolve => setTimeout(resolve, ms));

/**
 * Hosted payment page for an order.
 * @param {string} transactionNumber - order transaction number (ileafuOrderId)
 * @param {number|string} amount - amount to pay
 * @returns {string}
 */
export function getPaymentPageUrl(transactionNumber, amount) {
  return `${paymentPaypalVenmoUrl}?amount=${amount}&ileafuOrderId=${transactionNumber}`;
}

/**
 * Dismisses the sheet if one is presented. Safe when nothing is open
 * (native `close()` is null-guarded on iOS, a no-op on Android).
 */
export function closePaymentSheet() {
  try {
    closeBrowser();
  } catch (error) {
    // Nothing was presented — nothing to dismiss.
  }
}

/**
 * Play Store try-chain for the no-browser remedy: market:// → https:// → give up quietly.
 * Only ever reached from a user tap, never automatically.
 */
function openChromeInstallPage() {
  Linking.openURL(MARKET_URL).catch(() =>
    Linking.openURL(PLAY_STORE_URL).catch(error => {
      console.error('❌ [payment] could not reach the Play Store:', error);
    }),
  );
}

const BROWSER_HELP_TITLE = 'Install Chrome to continue';
const BROWSER_HELP_BODY =
  'This step opens the Venmo payment in a full browser, and the browser on this device cannot ' +
  'complete it. Install Chrome to carry on — your order stays on hold, and you can also pay ' +
  'from another device.';

/** Play Store action. Android only — iOS always has the Safari sheet. */
function installChromeButton() {
  return {text: 'Install Chrome', onPress: openChromeInstallPage};
}

/**
 * Android: no installed browser implements Custom Tabs, so the native module refused to open the
 * page (see the patch in patches/@swan-io+react-native-browser+1.1.2.patch).
 *
 * Left as-is, that case is the one that bites: the library's own fallback is a plain
 * `ACTION_VIEW`, which lands in whatever the device calls its browser — on many OEM phones a
 * WebView shell, where PayPal/Venmo cannot finish a payment. Because that launch never throws,
 * the failure is invisible from JS, so the buyer just sees a broken payment page.
 *
 * The trigger is a *capability* check (Custom Tabs), never a Chrome check: Edge, Samsung
 * Internet, Brave, Firefox and Opera all pass, so a phone that can pay today keeps paying. "Try
 * my browser" is the escape hatch for a browser the check cannot see.
 */
function alertNoProperBrowser(url, onGaveUp) {
  const buttons = [];

  if (Platform.OS === 'android') {
    buttons.push(installChromeButton());
  }

  buttons.push({
    text: 'Try my browser',
    onPress: () => {
      Linking.openURL(url).catch(error => {
        console.error('❌ [payment] no browser could open the payment page:', error);
        alertNothingOpens(onGaveUp);
      });
    },
  });
  buttons.push({
    text: 'Close',
    style: 'cancel',
    onPress: () => onGaveUp && onGaveUp(),
  });

  Alert.alert(BROWSER_HELP_TITLE, BROWSER_HELP_BODY, buttons);
}

/**
 * Nothing on this device could open the page at all — no browser installed, or it refused. The
 * order stays on hold.
 */
function alertNothingOpens(onGaveUp) {
  const buttons = [];

  if (Platform.OS === 'android') {
    buttons.push(installChromeButton());
  }

  buttons.push({
    text: 'Contact support',
    onPress: () => Linking.openURL(SUPPORT_URL).catch(() => {}),
  });
  buttons.push({
    text: 'Close',
    style: 'cancel',
    onPress: () => onGaveUp && onGaveUp(),
  });

  Alert.alert(
    BROWSER_HELP_TITLE,
    'We could not open any browser for the Venmo payment on this device. Your order is still ' +
      'waiting — you can pay from another device or contact support.',
    buttons,
  );
}

/**
 * The hosted page reported that it cannot run itself (it bounces back
 * `ileafu://payment-needs-browser`, e.g. after seeing a WebView user agent). Called from the
 * deep-link listener, so the sheet has already been dismissed. This is the backstop for a WebView
 * container that slipped past the capability check; it needs no native code.
 */
export function showInstallChromeHelp(onDismiss) {
  Alert.alert(
    BROWSER_HELP_TITLE,
    'This payment page opened in a browser that cannot complete Venmo payments. Install Chrome ' +
      'and try again — your order stays on hold.',
    [
      installChromeButton(),
      {
        text: 'Close',
        style: 'cancel',
        onPress: () => onDismiss && onDismiss(),
      },
    ],
  );
}

/**
 * The sheet could not be used, so ask before handing the app over to the browser.
 */
function openInExternalBrowser(url, onGaveUp) {
  Alert.alert(
    'Continue in your browser',
    'To finish this payment we need to open your browser. iLeafU will pick it up automatically ' +
      'when you come back — keep this screen open.',
    [
      {
        text: 'Open browser',
        onPress: () => {
          Linking.openURL(url).catch(error => {
            console.error('❌ [payment] no browser could open the payment page:', error);
            alertNothingOpens(onGaveUp);
          });
        },
      },
      {
        text: 'Cancel',
        style: 'cancel',
        onPress: () => onGaveUp && onGaveUp(),
      },
    ],
  );
}

/**
 * Opens the payment page in the in-app sheet, falling back to the external browser and then to
 * the "no browser" dialog — never to a bare error.
 *
 * @param {string} transactionNumber - order transaction number (ileafuOrderId)
 * @param {number|string} amount - amount to pay
 * @param {Object} [options]
 * @param {Function} [options.onClose] - the sheet was dismissed (not necessarily unpaid)
 * @param {Function} [options.onGaveUp] - the user declined the fallbacks; order stays on hold
 * @param {number} [options.delay] - ms to wait before presenting (default SHEET_OPEN_DELAY_MS)
 * @returns {Promise<void>} resolves once the sheet is presented (or the fallback is decided)
 */
export function openPaymentSheet(transactionNumber, amount, options = {}) {
  const url = getPaymentPageUrl(transactionNumber, amount);
  const delay = options.delay === undefined ? SHEET_OPEN_DELAY_MS : options.delay;

  const present = () => {
    console.log(`💳 [payment-sheet] presenting after ${delay}ms`);
    return openBrowser(url, {
      animationType: 'slide',
      dismissButtonStyle: 'close',
      onClose: () => {
        // Reached both when the user closes the sheet and when closePaymentSheet() dismisses it —
        // a dismissal with no matching "return from page" log means the sheet was torn down.
        console.log('💳 [payment-sheet] dismissed');
        if (options.onClose) {
          options.onClose();
        }
      },
    })
      .then(() => console.log('💳 [payment-sheet] presented'))
      .catch(error => {
        if (error && error.code === 'swan_browser_visible') {
          // A sheet is already presented — not a failure, and no reason to hand the app away.
          return;
        }
        if (error && error.code === 'swan_browser_unavailable') {
          // The native module refused: no installed browser can complete this payment. Falling
          // back to `ACTION_VIEW` here would land in a WebView shell and fail silently, so stop
          // and tell the buyer what to install instead.
          console.warn('⚠️ [payment] no Custom Tabs browser on this device:', error.message);
          alertNoProperBrowser(url, options.onGaveUp);
          return;
        }
        console.error('❌ [payment] in-app sheet unavailable, falling back:', error);
        openInExternalBrowser(url, options.onGaveUp);
      });
  };

  // Let any controller that was just dismissed finish animating before presenting.
  return delayFor(delay).then(present);
}
