import { Platform, StyleSheet, UIManager } from 'react-native';
import { BlurView } from '@sbaiahmed1/react-native-blur';

/**
 * Single source of truth for every frosted-glass surface on the screen.
 * Tuning the frost (amount/opacity/border) happens here, not per component.
 *
 * Android fallback: the native blur library paints a fixed overlay color for each
 * blurType. Over a live video TextureView it cannot blur the underlying frame, so
 * the surface reads as a solid gray box. On Android we therefore skip BlurView and
 * use a translucent tint that still gives contrast without the gray slab.
 */
export const GLASS_BLUR_AMOUNT = 26;
export const GLASS_BLUR_ROUNDS = 6;

/** Pick the right opacity: iOS gets true blur + a light tint; Android needs the tint alone. */
const darkFill = () =>
  Platform.OS === 'android' ? 'rgba(20, 20, 20, 0.42)' : 'rgba(20, 20, 20, 0.12)';
const smallDarkFill = () =>
  Platform.OS === 'android' ? 'rgba(20, 20, 20, 0.48)' : 'rgba(20, 20, 20, 0.18)';

/**
 * Surface tokens: tint over the blur, hairline border, corner radius, iOS blur type.
 *
 * The tint STACKS on the native material (GlassView paints it as a child over the blur),
 * so a surface's black coverage is 1 - (1-material)(1-tint), NOT max(material, tint). On
 * Android the material is a plain alpha overlay fixed by the blurType: `dark` is 47%
 * black, `systemUltraThinMaterialDark` is 25%. So the blurType matters as much as the
 * tint, and `dark` on Android is the single darkest thing available.
 *
 * History, so this does not regress: the fills were 0.46 and `dark`/`pill` used the `dark`
 * blurType. That put the product card and composer at 1-(1-0.47)(1-0.46) = ~71% black while
 * the other surfaces sat near 69%. Dropping to 0.34/0.30 fixed the small surfaces, but the
 * card and composer stayed at ~65% because they were the only two still on `dark` --
 * reported on device as "plant card and comment input still too dark". Every variant now
 * uses the 25% material, which is what makes the fills below comparable across variants.
 *
 * Then dropped again to 0.12/0.18 (from 0.22/0.30, one notch lighter still) on the same
 * complaint repeated across the live surfaces, so the black coverage is now
 * 1-(1-0.25)(1-0.12) = ~34% for the big surfaces and ~38% for the small ones. That is the
 * floor for now: below this the white text starts losing contrast over a bright video,
 * so lighten the BACKDROP or add a scrim before lowering these fills further.
 */
export const GLASS_VARIANTS = {
  // Large dark panels (product card). The two big surfaces run a LIGHTER tint than the
  // small pills on purpose: they were reported as the worst offenders twice ("plant card
  // and comment input still too dark"), their white text is larger so it holds contrast at
  // a lower fill, and a big pane has more area over which the video can show through.
  dark: {
    fill: darkFill(),
    border: 'rgba(255, 255, 255, 0.30)',
    radius: 28,
    blurType: 'systemUltraThinMaterialDark',
  },
  // The comment input: a wide flat capsule, so it takes the pill radius.
  pill: {
    fill: darkFill(),
    border: 'rgba(255, 255, 255, 0.30)',
    radius: 34,
    blurType: 'systemUltraThinMaterialDark',
  },
  // Small floating controls (top bar pills, IG badge)
  control: {
    fill: smallDarkFill(),
    border: 'rgba(255, 255, 255, 0.30)',
    radius: 20,
    blurType: 'systemUltraThinMaterialDark',
  },
  // The right action rail: one narrow capsule holding all five actions, not five boxes.
  rail: {
    fill: smallDarkFill(),
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
    fill: smallDarkFill(),
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
  // No `elevation`: Android draws the elevation shadow under the view and it shows through
  // the translucent fill as a gray inset box. iOS uses the shadow* props above instead.
};

// Native component name from the library's codegen (ReactNativeBlurViewSpec).
const BLUR_VIEW_MANAGER = 'ReactNativeBlurView';

/**
 * The blur module only exists after a native rebuild. On a JS-only reload against an
 * already-installed binary it is absent, and rendering it throws
 * "Unimplemented component: ReactNativeBlurView" at mount, which would take the whole
 * live screen down. Resolve the native ViewConfig once at load and degrade to the
 * translucent tint when it is missing.
 *
 * On Android we also treat the module as unavailable for glass surfaces because the
 * blur's fixed overlay color renders as a gray box over live video.
 */
const blurAvailable = (() => {
  try {
    if (Platform.OS === 'android') return false;
    return (
      typeof UIManager?.hasViewManagerConfig === 'function' &&
      UIManager.hasViewManagerConfig(BLUR_VIEW_MANAGER)
    );
  } catch (e) {
    return false;
  }
})();

export const isGlassBlurAvailable = () => blurAvailable;

/**
 * Android's blur enum spells the system materials `systemUltraThinMaterialDark` (25% black
 * overlay) just as iOS does, so the token's blurType can be passed through unchanged. The
 * earlier rewrite-to-`dark` was the worst available mapping: `dark` overlays 47% black, so
 * on Android every system-material surface got MORE black than iOS, and because GlassView
 * paints its tint ON TOP of the material the two stacked instead of one replacing the
 * other. That is why the same token read as glass on iOS and as a heavy dark slab here.
 * Anything genuinely absent on Android (the non-`Dark` system variants) still falls back to
 * `dark`, and only the first letter is upper-cased because `extraDark` is camelCase.
 *
 * Kept for any direct BlurView usage; GlassView no longer mounts BlurView on Android.
 */
export const resolveBlurType = blurType => {
  const raw = String(blurType || '');
  if (Platform.OS !== 'android') return raw;
  if (!raw.startsWith('system')) return raw;
  return raw.endsWith('Dark') || raw.endsWith('Light')
    ? raw
    : `${raw}Dark`;
};

export const glassClip = StyleSheet.create({ clip: { overflow: 'hidden' } }).clip;

export { BlurView };
