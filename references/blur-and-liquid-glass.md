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

## Apple's Liquid Glass model (ground truth)

Liquid Glass is Apple's adaptive **material for controls & navigation** (iOS/iPadOS/macOS 26) — *not* for content. It bends, shapes, and concentrates light in real time: it blurs what's behind, reflects the color/light of surrounding content, and reacts to touch like a lightweight liquid. Animating it correctly means honoring these behaviors, not just "blurry box." (Sources: Apple's *Liquid Glass* / *Adopting Liquid Glass* technology overviews, HIG *Materials*, WWDC25 "Meet Liquid Glass".)

| Apple concept | What it means | RN mapping |
| --- | --- | --- |
| **Regular vs Clear** | *Regular* = full adaptive effects, legible over anything (default). *Clear* = permanently more transparent, no adaptation — for rich media underneath; **needs a dimming layer** for legibility. | `effect="regular" \| "clear"` (callstack) / `glassEffectStyle` (expo). For Clear, add a scrim. |
| **Lives on a floating plane above content** | Glass sits on a layer above content, **never directly on it**. In steady states avoid glass⇄content intersection — reposition/scale content for separation. | Render glass in an absolute layer; keep content padded clear of it. |
| **Scroll edge effect** | A subtle blur at the scroll boundary replaces hard dividers, keeping controls legible over moving content. | Frost the top/bottom edge as content scrolls under it (recipe below). |
| **Interactivity** | On touch the control **scales, bounces, shimmers**; on deeper engagement glass **recedes, grows slightly, and becomes more opaque**. | `interactive` prop; or replicate with Reanimated (scale/bounce + shimmer sweep). |
| **Flex / morph at larger sizes** | When glass expands (toolbar button → menu) it simulates a **thicker** material: deeper shadows, stronger lensing/refraction, softer light scatter. | On expand: grow + deepen shadow (+ Android Skia: raise blur + shadow). |
| **Morphing / single shape** | `GlassEffectContainer` merges nearby glass into one shape that morphs apart/together as the layout changes — controls feel like one fluid plane across contexts. | `LiquidGlassContainerView spacing` / `GlassContainer`; animate children's positions. |
| **Concentricity** | Nested shapes keep **concentric corner radii** (child radius derived from container). | child `borderRadius = containerRadius − padding`. |
| **Tinting** | Tint generates tones from the brightness underneath (like real colored glass). **Use selectively** for primary actions — don't tint everything. | `tintColor` on the primary control only. |
| **Accessibility** | *Reduce Transparency* → frostier/more opaque; *Increase Contrast*; *Reduce Motion* → drop morph/bounce. Adapt without losing the look. | Gate on the OS settings (see Accessibility section). |
| **Performance** | Too many glass effects/containers onscreen degrades performance — **limit concurrent glass**. | Few glass surfaces per screen; bound their size. |

**Animating Liquid Glass = animating its context, not a blur value.** Move/scale/reshape the glass (it refracts live), morph shapes via the container, toggle Regular↔Clear, deepen on expand, shimmer on touch. On Android these native behaviors don't exist — emulate the *intent* with Skia (blur + tint + shadow + the same transforms) so it reads the same.

---

## Animated Liquid Glass (the smart cross-platform way)

> Only build this when the prompt explicitly asks for liquid/glass. It's iOS-26-specific + GPU-heavy; don't add it to everything.

**Mental model — what actually animates.** The glass *material* is native and has no "intensity" knob. You animate liquid glass by animating the things *around* it, and the OS refracts live:

1. **Move / scale / reshape the container** (translate, scale, `borderRadius`) → the glass refracts the moving content underneath in real time. This is the bulk of "animated glass."
2. **Toggle `effect` `'regular'`↔`'clear'`** on press/scroll/selection — it transitions natively.
3. **Liquid merge** — wrap elements in `LiquidGlassContainerView spacing={n}`; when you animate two glass views within `n` points of each other, they **morph into one connected blob** (the signature effect). Animate their positions with Reanimated to drive the merge.
4. **Tint** — change `tintColor` for color shifts.

On **Android / iOS < 26** none of this exists, so emulate with Skia: animate `BackdropBlur`'s blur amount + tint + the container's shape. Drive both platforms from the **same shared value** so behavior matches.

### The smart component — one API, both platforms, both animated

```tsx
import { LiquidGlassView, isLiquidGlassSupported } from '@callstack/liquid-glass';
import { Canvas, BackdropBlur, Fill, rrect, rect } from '@shopify/react-native-skia';
import Animated, { useAnimatedStyle, useAnimatedProps, useDerivedValue, SharedValue, interpolate, Extrapolation } from 'react-native-reanimated';

const AGlass = Animated.createAnimatedComponent(LiquidGlassView);

type GlassProps = {
  progress: SharedValue<number>;  // 0..1 — your driver (scroll, press, sheet)
  width: number; height: number; radius?: number;
  children?: React.ReactNode; style?: StyleProp<ViewStyle>;
};

export function AnimatedGlass({ progress, width, height, radius = 24, children, style }: GlassProps) {
  // shared animated shape for both platforms
  const containerStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(progress.value, [0, 1], [0.96, 1], Extrapolation.CLAMP) }],
  }));

  if (isLiquidGlassSupported) {                  // iOS 26+ → real Liquid Glass
    const glassProps = useAnimatedProps(() => ({
      effect: progress.value > 0.5 ? 'regular' : 'clear',  // morph the material on the driver
    }));
    return (
      <AGlass animatedProps={glassProps} tintColor="#ffffff22"
        style={[{ width, height, borderRadius: radius }, containerStyle, style]}>
        {children}
      </AGlass>
    );
  }

  // Android / iOS<26 → Skia frosted-glass emulation, same driver
  const blur = useDerivedValue(() => interpolate(progress.value, [0, 1], [6, 22], Extrapolation.CLAMP));
  return (
    <Animated.View style={[{ width, height, borderRadius: radius, overflow: 'hidden' }, containerStyle, style]}>
      <Canvas style={StyleSheet.absoluteFill}>
        <BackdropBlur blur={blur} clip={rrect(rect(0, 0, width, height), radius, radius)}>
          <Fill color="rgba(255,255,255,0.14)" />
        </BackdropBlur>
      </Canvas>
      {children}
    </Animated.View>
  );
}
```
One `progress` shared value drives the iOS material morph **and** the Android blur — drive it from scroll, a press, or a sheet's open state and both platforms animate in lockstep. (Keep the `isLiquidGlassSupported` branch stable per mount so hook order doesn't change.)

### Scroll-driven glass header (beautiful + cross-platform)

```tsx
const aref = useAnimatedRef<Animated.ScrollView>();
const scroll = useScrollOffset(aref);
const glass = useDerivedValue(() => interpolate(scroll.value, [0, 90], [0, 1], Extrapolation.CLAMP));

// header frosts in, title fades up as you scroll:
<AnimatedGlass progress={glass} width={SCREEN_W} height={100} radius={0} style={styles.header}>
  <Animated.Text style={[styles.title, useAnimatedStyle(() => ({ opacity: glass.value }))]}>Title</Animated.Text>
</AnimatedGlass>
```

### Liquid merge — FAB → menu (iOS 26)

```tsx
import { LiquidGlassContainerView } from '@callstack/liquid-glass';
const open = useSharedValue(0);
// each action's translateY animates from 0 (merged into the FAB) to its slot;
// within `spacing` they read as one liquid blob, then separate as they move apart.
<LiquidGlassContainerView spacing={24}>
  <AnimatedGlass progress={open} width={56} height={56} radius={28}>{/* FAB icon */}</AnimatedGlass>
  {actions.map((a, i) => (
    <Animated.View key={a.id} style={useAnimatedStyle(() => ({ transform: [{ translateY: -open.value * (i + 1) * 64 }], opacity: open.value }))}>
      <AnimatedGlass progress={open} width={48} height={48} radius={24}>{a.icon}</AnimatedGlass>
    </Animated.View>
  ))}
</LiquidGlassContainerView>
```
Animating the children's positions through the container's `spacing` zone is what produces the gooey merge/split. (Android falls back to separate Skia-glass buttons — still animated, just no liquid merge.)

---

### Interactive press — scale, bounce, shimmer (Apple's interactive behavior)

Apple's `interactive` glass scales/bounces and shimmers on touch. The lib's `interactive` prop is mount-only, so for a *driven* version replicate it with Reanimated: a quick scale-bounce + a shimmer sweep across the glass.

```tsx
const press = useSharedValue(0);
const shimmer = useSharedValue(-1);
const onPressIn = () => {
  press.value = withSequence(withTiming(1, { duration: 90 }), withSpring(0, { damping: 12, stiffness: 280 }));
  shimmer.value = withTiming(1, { duration: 500 }); // sweep highlight L→R
};
const glassStyle = useAnimatedStyle(() => ({ transform: [{ scale: interpolate(press.value, [0, 1], [1, 1.06]) }] }));
const sweepStyle = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(shimmer.value, [-1, 1], [-W, W]) }], opacity: interpolate(shimmer.value, [-1, 0, 1], [0, 0.5, 0]) }));
// shimmer = a thin diagonal white gradient stripe clipped to the glass shape
```

### Toolbar button → menu (flex to a "thicker" material)

Apple deepens shadow + lensing as glass grows. On expand, grow the glass and deepen its shadow (iOS), or raise Skia blur + shadow (Android) — it should feel more substantial, not just bigger.

```ts
const open = useSharedValue(0);
const menuStyle = useAnimatedStyle(() => ({
  transform: [{ scale: interpolate(open.value, [0, 1], [0.9, 1]) }],
  shadowOpacity: interpolate(open.value, [0, 1], [0.12, 0.28]),   // iOS: deeper shadow when "thicker"
  shadowRadius:  interpolate(open.value, [0, 1], [8, 24]),
}));
// Android (Skia): blur 12→24, plus a stronger drop shadow layer.
```

### Scroll edge effect (legibility over moving content)

Instead of a hard divider under a glass bar, frost just the edge as content scrolls under it — Apple's scroll edge effect.

```ts
const edge = useDerivedValue(() => interpolate(scroll.value, [0, 40], [0, 1], Extrapolation.CLAMP));
// drive an AnimatedGlass (or BlurView intensity / Skia blur) on the top strip from `edge`;
// at rest (edge≈0) the bar is clear, on scroll it frosts to keep controls legible.
```

### More
- **Frosted nav bar / header:** scroll-driven `AnimatedGlass`/`BlurView`; title cross-fades as content reaches the bar (`patterns-recipes.md` §4). Keep content padded so it never sits *under* the glass at rest (Apple's separation rule).
- **Glass tab bar:** glass background; active indicator slides over it (`buttons-and-microinteractions.md` §7). Tint **only** the active item.
- **Blurred modal/sheet backdrop:** pair the overlay `progress` (`overlays-and-modals.md`) with blur so the background frosts as the sheet rises.
- **Concentric corners:** a glass control inset in a container should use `containerRadius − inset` for its own radius, so the curves stay concentric (Apple concentricity).

---

## Accessibility & performance (Apple's rules)
- **Reduce Transparency** → make glass **frostier / more opaque** (don't just drop blur): `AccessibilityInfo.isReduceTransparencyEnabled()`; raise the fallback fill opacity / Skia tint.
- **Reduce Motion** → drop the morph/bounce/shimmer; snap or cross-fade between states (`useReducedMotion()`).
- **Increase Contrast** → strengthen borders/text and reduce transparency so controls stay legible.
- **Use tint selectively** — only primary actions; tinting everything is confusing and hurts legibility (HIG).
- **Limit concurrent glass** — Apple warns too many glass effects/containers degrade performance; keep a few bounded glass surfaces per screen, prefer one `GlassEffectContainer`/`LiquidGlassContainerView` over many separate effects.
- Always ship a **non-glass fallback** (translucent fill) for Android / iOS < 26; design it to still read as a distinct control layer.

## Checklist
- [ ] Detected existing deps; installed only what's missing; `pod-install` (iOS) + dev-client rebuild done.
- [ ] Liquid Glass gated on `isLiquidGlassAvailable()` / `isLiquidGlassSupported`; translucent fallback provided.
- [ ] Android blur opted in via `experimentalBlurMethod` (or Skia); Modal-backdrop caveat handled.
- [ ] Animated blur via `useAnimatedProps(intensity)` (recent New-Arch) or Skia `BackdropBlur` with a reanimated value.
- [ ] `createAnimatedComponent(BlurView)` at module scope; blurred areas bounded.
- [ ] **Apple model honored:** Regular vs Clear chosen right (Clear gets a scrim); glass on a layer above content with separation; tint only primary actions; concentric corners.
- [ ] **Animate the context** (move/scale/morph/flex/shimmer), not a raw blur value; glass deepens (shadow/lensing) as it grows.
- [ ] Reduce Transparency → frostier; Reduce Motion → no morph/bounce; Increase Contrast handled; concurrent glass limited.
