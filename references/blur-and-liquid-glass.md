# Blur & Liquid Glass — frosted UI on iOS & Android, animated with Reanimated

Blur/"glass" surfaces (frosted nav bars, glass cards, blurred modal backdrops, iOS 26 **Liquid Glass**) need a **native blur view** — you can't blur with style props alone. Reanimated's job is to **animate** the blur (intensity on scroll, fade a glass backdrop in with a sheet). This file covers picking the library, installing/configuring it on **both platforms**, detecting availability, and animating it. Always degrade gracefully when blur/glass isn't supported, and honor the OS **Reduce Transparency** setting.

---

## Decision: which approach?

| Want | Use | Platforms |
| --- | --- | --- |
| True iOS 26 **Liquid Glass** (refracting, interactive) | `expo-glass-effect` (Expo) or `@callstack/liquid-glass` | iOS 26+ (auto-fallback to plain View elsewhere) |
| Standard frosted blur (nav bar, card, backdrop) | `expo-blur` `BlurView` | iOS (native), Android (experimental) |
| **Animated** blur driven by shared values, identical on both | `@shopify/react-native-skia` `BackdropBlur` | iOS + Android (GPU, consistent) |

Liquid Glass is iOS-only and newest; **Skia is the most reliable cross-platform animated blur.** `expo-blur` is the simplest for static/lightly-animated frosting.

---

## Install & configure

**First detect what's already there** — check `package.json` before installing; write for what the project has, install only what's missing.

```bash
# Standard blur (Expo-managed or bare with Expo modules)
npx expo install expo-blur

# iOS 26 Liquid Glass (Expo)
npx expo install expo-glass-effect            # then: npx pod-install (bare)
# or the community lib:
npm i @callstack/liquid-glass && npx pod-install

# Cross-platform animated blur via Skia
npx expo install @shopify/react-native-skia
```
- **iOS:** run `npx pod-install` after adding any native module (bare projects). Liquid Glass needs **iOS 26+** SDK/runtime.
- **Android:** `expo-blur` blur is **experimental** — you must opt in per-view with `experimentalBlurMethod` (below). Skia blur works natively on Android with no flag.
- **New Architecture:** animating `BlurView.intensity` via Reanimated is reliable on the New Arch + recent `expo-blur`/Reanimated; on older setups it can render the initial intensity but not update (known issue) — prefer Skia for animated blur if you hit that.
- No extra config plugin is needed for these (autolinked); just rebuild the dev client after install (`npx expo run:ios` / `run:android`, or EAS build).

---

## iOS 26 Liquid Glass

Always gate on the availability check — the API only exists on iOS 26+, and some betas lack it (using it blindly can crash).

```tsx
// Expo
import { GlassView, GlassContainer, isLiquidGlassAvailable } from 'expo-glass-effect';

function GlassCard({ children }) {
  if (!isLiquidGlassAvailable()) {
    return <View style={styles.fallback}>{children}</View>; // translucent bg fallback
  }
  return <GlassView glassEffectStyle="regular" tintColor="#ffffff22" style={styles.card}>{children}</GlassView>;
}
// GlassContainer groups multiple glass elements so they blend/merge correctly.
```
```tsx
// @callstack/liquid-glass
import { LiquidGlassView, LiquidGlassContainerView, isLiquidGlassSupported } from '@callstack/liquid-glass';

<LiquidGlassView
  effect="regular"            // 'regular' | 'clear' | 'none' — animates when changed
  interactive                 // grow + shimmer on touch (applied on mount only)
  tintColor="#ffffff22"
  style={[styles.card, !isLiquidGlassSupported && styles.fallback]}  // opaque fallback on Android / iOS<26
  renderToHardwareTextureAndroid
>{children}</LiquidGlassView>
```
- **`effect` is animatable on change** — toggle `'regular'`↔`'clear'` (e.g. on press/selected) and it transitions natively; drive the toggle from React state or a gesture's `onEnd`.
- **`interactive` is mount-only** — can't be flipped at runtime.
- **Fallback:** on Android / iOS < 26 these render an opaque `View`; give the fallback a **translucent background color** so the layout still reads as "glass."

---

## Animate `expo-blur` intensity with Reanimated

`intensity` (0–100) is a native prop → animate it with `useAnimatedProps`.

```tsx
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedProps, useScrollOffset, useAnimatedRef, interpolate, Extrapolation } from 'react-native-reanimated';

const AnimatedBlur = Animated.createAnimatedComponent(BlurView);  // module scope, once

// frosted nav bar that blurs in as you scroll:
const aref = useAnimatedRef<Animated.ScrollView>();
const scroll = useScrollOffset(aref);                 // v2/3: useScrollViewOffset
const blurProps = useAnimatedProps(() => ({
  intensity: interpolate(scroll.value, [0, 80], [0, 100], Extrapolation.CLAMP),
}));

<AnimatedBlur
  animatedProps={blurProps}
  tint="systemChromeMaterial"                         // iOS material; 'light'|'dark'|'default'|…
  experimentalBlurMethod="dimezisBlurView"            // ANDROID: opt into real blur (SDK31+: 'dimezisBlurViewSdk31Plus')
  style={[StyleSheet.absoluteFill]}
/>
```
- **Android opt-in:** without `experimentalBlurMethod`, Android shows only a semi-transparent tint. `'dimezisBlurView'` enables real blur (may cost perf on SDK ≤30; use `'dimezisBlurViewSdk31Plus'` to blur on 31+ and degrade below).
- **Modal caveat (Android, expo-blur v55+):** `dimezisBlurView` can't blur content **outside** a React Native `Modal` (separate native window). For blurred modal/sheet backdrops on Android, use Skia or a dark scrim.
- If animated `intensity` won't update on your version, fall back to Skia (next) or animate a dark overlay's opacity over a fixed-intensity blur.

---

## Cross-platform animated glass with Skia (most reliable)

Skia's `BackdropBlur` blurs whatever is rendered behind it, and the blur amount accepts a Reanimated value — identical on iOS and Android.

```tsx
import { Canvas, BackdropBlur, Fill } from '@shopify/react-native-skia';
import { useSharedValue, useDerivedValue, withTiming } from 'react-native-reanimated';

const open = useSharedValue(0);                        // 0..1, drive from a sheet/gesture
const blur = useDerivedValue(() => open.value * 20);   // 0→20px blur

<Canvas style={StyleSheet.absoluteFill}>
  <BackdropBlur blur={blur} clip={cardRect}>           {/* blur is a reanimated value */}
    <Fill color="rgba(255,255,255,0.15)" />            {/* tint = the "glass" */}
  </BackdropBlur>
</Canvas>
```
Use this for animated frosted cards, **progressive blur** (gradient mask over the blur), and blurred sheet/modal backdrops where `expo-blur` falls short on Android.

---

## Recipes
- **Frosted nav bar / header:** absolute `BlurView` behind the bar; animate `intensity` from scroll (above). Title cross-fades as content reaches the bar (`patterns-recipes.md` §4).
- **Glass tab bar:** `BlurView`/`GlassView` as the tab bar background; active tab indicator slides over it (`buttons-and-microinteractions.md` §7).
- **Blurred modal/sheet backdrop:** pair the overlay `progress` (`overlays-and-modals.md`) with blur — animate `intensity`/Skia `blur` from `progress`, so the background frosts as the sheet rises.
- **Glass card press:** `LiquidGlassView effect` toggles `'regular'`↔`'clear'` on press, or scale + the card's blur deepens.

---

## Accessibility & performance
- **Reduce Transparency:** honor it — `AccessibilityInfo.isReduceTransparencyEnabled()` (iOS); when on, render a solid/translucent color instead of blur.
- Blur is **GPU-expensive** — don't stack many large blurred layers or animate blur on huge areas every frame; keep blurred regions bounded.
- Always ship a **non-blur fallback** (translucent background) for Android-without-experimental-blur and unsupported iOS.

## Checklist
- [ ] Detected existing deps; installed only what's missing; `pod-install` (iOS) + dev-client rebuild done.
- [ ] Liquid Glass gated on `isLiquidGlassAvailable()` / `isLiquidGlassSupported`; translucent fallback provided.
- [ ] Android blur opted in via `experimentalBlurMethod` (or Skia); Modal-backdrop caveat handled.
- [ ] Animated blur via `useAnimatedProps(intensity)` (recent New-Arch) or Skia `BackdropBlur` with a reanimated value.
- [ ] `createAnimatedComponent(BlurView)` at module scope; blurred areas bounded.
- [ ] Reduce Transparency honored; solid fallback when blur unsupported.
