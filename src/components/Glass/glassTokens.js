import { Platform, StyleSheet, UIManager } from 'react-native';
import { BlurView } from '@sbaiahmed1/react-native-blur';

/**
 * Single source of truth for every frosted-glass surface on the screen.
 * Tuning the frost (amount/opacity/border) happens here, not per component.
 */
export const GLASS_BLUR_AMOUNT = 26;
export const GLASS_BLUR_ROUNDS = 6;

/**
 * Surface tokens: tint over the blur, hairline border, corner radius, iOS blur type.
 * The tint is a deliberate compromise: dense enough that white text stays readable over a
 * bright video feed, light enough that the surfaces still read as glass instead of grey
 * slabs. The reference product card measured ~52% passage at 0.58 and was judged too dark
 * on device, so the fills below sit near 0.46.
 */
export const GLASS_VARIANTS = {
  // Large dark panels (product card)
  dark: {
    fill: 'rgba(20, 20, 20, 0.46)',
    border: 'rgba(255, 255, 255, 0.30)',
    radius: 28,
    blurType: 'dark',
  },
  // The comment input: a wide flat capsule, so it takes the pill radius.
  pill: {
    fill: 'rgba(20, 20, 20, 0.46)',
    border: 'rgba(255, 255, 255, 0.30)',
    radius: 34,
    blurType: 'dark',
  },
  // Small floating controls (top bar pills, IG badge)
  control: {
    fill: 'rgba(20, 20, 20, 0.42)',
    border: 'rgba(255, 255, 255, 0.30)',
    radius: 20,
    blurType: 'systemUltraThinMaterialDark',
  },
  // The right action rail: one narrow capsule holding all five actions, not five boxes.
  rail: {
    fill: 'rgba(20, 20, 20, 0.40)',
    border: 'rgba(255, 255, 255, 0.30)',
    radius: 36,
    blurType: 'systemUltraThinMaterialDark',
  },
  // Light surface (secondary button)
  light: {
    fill: 'rgba(255, 255, 255, 0.92)',
    border: 'rgba(255, 255, 255, 0.55)',
    radius: 26,
    blurType: 'light',
  },
  // A single chat row (one comment or one join notice) on the live overlays. Small and inline,
  // so it takes a compact radius; the hairline border is what separates one row from the next.
  chatRow: {
    fill: 'rgba(20, 20, 20, 0.46)',
    border: 'rgba(255, 255, 255, 0.30)',
    radius: 14,
    blurType: 'systemUltraThinMaterialDark',
  },
};

/** Drop shadow shared by every glass surface. */
export const GLASS_SHADOW = {
  shadowColor: '#000',
  shadowOffset: { width: 0, height: 6 },
  shadowOpacity: 0.25,
  shadowRadius: 16,
  elevation: 8,
};

// Native component name from the library's codegen (ReactNativeBlurViewSpec).
const BLUR_VIEW_MANAGER = 'ReactNativeBlurView';

/**
 * The blur module only exists after a native rebuild. On a JS-only reload against an
 * already-installed binary it is absent, and rendering it throws
 * "Unimplemented component: ReactNativeBlurView" at mount, which would take the whole
 * live screen down. Resolve the native ViewConfig once at load and degrade to the
 * translucent tint when it is missing.
 */
const blurAvailable = (() => {
  try {
    return (
      typeof UIManager?.hasViewManagerConfig === 'function' &&
      UIManager.hasViewManagerConfig(BLUR_VIEW_MANAGER)
    );
  } catch (e) {
    return false;
  }
})();

export const isGlassBlurAvailable = () => blurAvailable;

/** Android's blur enum has no `system*` values; those degrade to a plain dark blur. */
export const resolveBlurType = blurType =>
  Platform.OS === 'android' && String(blurType).startsWith('system') ? 'dark' : blurType;

export const glassClip = StyleSheet.create({ clip: { overflow: 'hidden' } }).clip;

export { BlurView };
