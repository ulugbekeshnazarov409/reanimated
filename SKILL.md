---
name: reanimated
description: >-
  Expert system for React Native Reanimated — the high-performance, UI-thread
  animation + gesture library for React Native and Expo (v2 / v3 / v4). Use for
  ANY task involving Reanimated: worklets, shared values (useSharedValue), animated
  styles/props (useAnimatedStyle, useAnimatedProps, useDerivedValue), animation
  functions (withTiming, withSpring, withDecay) and modifiers (withSequence,
  withDelay, withRepeat, withClamp, cancelAnimation), easing & spring configs,
  interpolation (interpolate, Extrapolation, interpolateColor), scroll-driven
  animation (useScrollOffset / useAnimatedScrollHandler) and useAnimatedReaction,
  gestures with react-native-gesture-handler (Gesture API), layout animations
  (entering/exiting/layout, Keyframe, LinearTransition), shared element transitions,
  Reanimated 4 CSS animations/transitions, the react-native-worklets package +
  scheduleOnRN/scheduleOnUI, runOnJS/runOnUI, the Babel/worklets plugin setup,
  New Architecture, performance (60/120fps, keeping work off the JS thread),
  testing (jest mock), and fixing common errors. Triggers — reanimated,
  react-native-reanimated, useSharedValue, useAnimatedStyle, withTiming, withSpring,
  withDecay, interpolate, interpolateColor, useAnimatedScrollHandler, useScrollOffset,
  runOnJS, runOnUI, worklet, "Reanimated failed to create a worklet", entering/exiting
  animation, Keyframe, layout animation, shared element transition, gesture handler
  animation, react-native-worklets, Reanimated 4 CSS animation, animate a React Native
  component, 60fps RN animation, swipe to delete, drag to reorder, parallax header,
  animated bottom sheet RN, animated button, loading button, success checkmark animation,
  animated toggle/switch, like/heart burst, card press animation, swipeable cards,
  expand card to detail, card flip, screen entrance animation, staggered reveal,
  micro-interactions, screen choreography, interruptible animation, reduce motion,
  animated modal, animated dialog, alert animation, action sheet, bottom sheet,
  side drawer / left/right sheet, animated dropdown, select menu, popover, tooltip,
  toast / snackbar animation, animated slider, carousel / pager, pagination dots,
  stepper, animated badge, notification dot, progress bar, progress ring,
  useAnimatedSensor, gyroscope animation, accelerometer, device tilt parallax,
  shake to undo, Reanimated web support, supported style properties,
  LayoutAnimationConfig, ReducedMotionConfig, CurvedTransition, EntryExitTransition,
  blur, BlurView, frosted glass, glassmorphism, iOS 26 Liquid Glass, GlassView,
  expo-blur, expo-glass-effect, liquid-glass, Skia BackdropBlur, animated blur,
  animated liquid glass, liquid glass merge/morph, cross-platform glass Android,
  blurred nav bar, glass card, blurred modal backdrop. Cross-framework companions —
  SwiftUI animation, glassEffect, GlassEffectContainer, matchedGeometryEffect,
  PhaseAnimator, KeyframeAnimator, UIKit UIViewPropertyAnimator, UIGlassEffect,
  Jetpack Compose animation, animateFloatAsState, AnimatedVisibility, Haze blur,
  Compose glassmorphism, Flutter animation, AnimationController, BackdropFilter,
  Hero, flutter_animate, liquid_glass_widgets, Flutter Liquid Glass.
---

# React Native Reanimated

Build smooth, 60/120fps animations and gestures in React Native / Expo that run on the **UI thread** (not the JS thread), so they don't stutter under load. This skill covers Reanimated **v2/v3** (the API most repos use today) and **v4** (New Architecture only, `react-native-worklets` package, CSS animations) — and always flags which version a feature belongs to.

Official docs: https://docs.swmansion.com/react-native-reanimated/

## The mental model (read first)

Reanimated's whole design follows from one idea: **animations run on the UI thread via "worklets".**

- **Two threads.** The **JS thread** runs your React code. The **UI thread** renders frames. If animation logic runs on the JS thread, a busy JS thread = dropped frames. Reanimated moves animation work to the UI thread.
- **Worklets** are small JS functions that run on the UI thread. They're marked `'worklet';` or auto-marked by the Babel/worklets plugin (callbacks of `useAnimatedStyle`, `useDerivedValue`, gesture handlers, etc. are workletized automatically).
- **Shared values** (`useSharedValue`) are the reactive state shared between threads. You read/write `.value`. Changing `.value` re-runs dependent worklets on the UI thread.
- **Crossing threads:** call JS-thread code from a worklet with `runOnJS` (v2/v3) / `scheduleOnRN` (v4); push a function onto the UI thread with `runOnUI` (v3) / `scheduleOnUI` (v4).

Everything else — animation functions, interpolation, gestures, layout animations — is built on shared values + worklets. Internalize this and the API stops being magic.

## How to use this skill

**Token economy (progressive disclosure).** This file is the always-loaded map; the references are loaded **on demand**. Load only the file(s) the task needs — use the routing table below to jump straight to one, not all. A typical task reads 1–3 references (version/setup if unsure, the task file, maybe performance). Don't bulk-open the folder.

1. **Detect the version & setup.** Check `package.json` for `react-native-reanimated` (v2/v3/v4) and whether `react-native-worklets` is present (→ v4). Verify the Babel/worklets plugin and (v4) New Architecture. → `references/installation-and-setup.md` + `references/version-guide.md`. Write code for the version the project actually uses.
2. **Ground in the core concepts** if doing anything non-trivial → `references/core-concepts.md` (worklets, threads, runOnJS/runOnUI, the rules that cause 90% of bugs).
3. **Pull the right reference for the task** (map below) — shared values, animated styles, animation functions, interpolation, scroll, gestures, layout animations, CSS animations.
4. **For a full UI effect**, use `references/patterns-recipes.md` (press scale, swipe-to-delete, drag-to-reorder, parallax/collapsing header, animated tab indicator, bottom sheet, skeleton shimmer, numeric roll, accordion, pull-to-refresh). For component-specific senior polish go deeper: `references/buttons-and-microinteractions.md` (loading/success morphs, toggles, like burst, FAB, ripple), `references/cards.md` (press/lift, swipe stack, expand-to-detail, flip, tilt), `references/overlays-and-modals.md` (modal, alert, action sheet, left/right drawer, dropdown/menu, tooltip, toast), `references/inputs-and-indicators.md` (slider, carousel/pager, dropdown, stepper, badge, progress).
5. **Choreograph the whole screen**, not just one element → `references/screen-choreography.md` (entrance sequencing/staggering, loading→content continuity, interruptibility, Reduce Motion). This is what makes a screen feel senior-built rather than a pile of animations.
6. **When nothing fits, build it.** If no preset/recipe matches the requested design, compose a custom animation from primitives → `references/custom-animations.md` (one progress + `interpolate`, custom `Keyframe`/builders/easing, frame-loop physics). If the value can only be reached natively, climb the interop ladder → `references/native-interop.md` (write native only when measured/required, keep the surface tiny).
7. **Verify** against `references/performance.md` (keep work off the JS thread) and `references/troubleshooting.md` (the exact-error → fix tables). Mock with `references/testing.md` if tests exist.

## Output contract (write it like a team developer)

Every code answer should be: **minimal** (no dead code, no unused shared values), **typed** (correct TS — `SharedValue<T>`, animated props typed; no `any` except the one contained `TextInput.text` helper), **version-correct** (v2/v3/v4 — never mix API names), **on the UI thread**, **one source of truth per property**, and **Reduce-Motion-safe**. Extract repeated interactions into reusable typed hooks; centralize springs/durations. Full rules + patterns → `references/typescript-and-clean-code.md`. Prefer the smallest correct solution over a clever large one.

## Fast routing (task → the one file to open)

| Task / symptom | Open |
| --- | --- |
| Which version / setup / plugin / New Arch | `installation-and-setup.md`, `version-decision-tree.md` |
| "Reanimated failed to create a worklet" / value won't animate | `troubleshooting.md` |
| Worklets, threads, `runOnJS`/`scheduleOnRN` basics | `core-concepts.md` |
| `useSharedValue` / `.value` / `modify()` | `shared-values.md` |
| `useAnimatedStyle`/`Props`/`DerivedValue`, `measure` | `animated-styles.md` |
| `withTiming/Spring/Decay` + modifiers | `animation-functions.md` |
| Easing / spring feel / presets | `easing-and-springs.md` |
| `interpolate` / `interpolateColor` | `interpolation.md` |
| Scroll-driven / `useAnimatedReaction` | `scroll-and-reactions.md` |
| Gestures (Pan/Tap/Pinch…), composition | `gestures.md` |
| Enter/exit/layout, `Keyframe`, lists | `layout-animations.md` |
| Reanimated 4 CSS animations | `css-animations-v4.md` |
| Button / toggle / loading / success / FAB / ripple | `buttons-and-microinteractions.md` |
| Card press / swipe stack / expand / flip / tilt | `cards.md` |
| Modal / dialog / alert / action sheet / drawer / menu / tooltip / toast | `overlays-and-modals.md` |
| Slider / carousel / pager / dropdown / stepper / badge / progress | `inputs-and-indicators.md` |
| Whole-screen orchestration / entrance / state continuity | `screen-choreography.md` |
| Keyboard-following UI | `keyboard-and-input-motion.md` |
| Blur / frosted glass / glassmorphism / iOS 26 Liquid Glass | `blur-and-liquid-glass.md` |
| Device tilt / gyroscope / accelerometer / shake | `device-motion-sensors.md` |
| Web support / which props animate / 120fps / platform diffs | `web-and-platform-support.md` |
| Native iOS — SwiftUI/UIKit animation + Liquid Glass | `swiftui-and-swift.md` |
| Native Android — Jetpack Compose (Kotlin) animation + glass | `jetpack-compose-and-kotlin.md` |
| Flutter (Dart) animation + blur/Liquid Glass | `flutter-and-dart.md` |
| Reanimated 4 CSS animations & transitions | `css-animations-v4.md` |
| Navigation / screen transitions | `navigation-animations.md`, `react-navigation-transitions.md`, `expo-router-transitions.md` |
| Per-frame physics / game loop | `frame-loops-and-realtime.md` |
| Bespoke effect, no preset fits | `custom-animations.md` |
| Animate a native/third-party prop; native code | `native-interop.md`, `advanced-runtimes.md` |
| TS types / clean code / reusable hooks | `typescript-and-clean-code.md` |
| Any export's name/purpose/version | `api-reference.md` |

> Companion: for *design* decisions (what to animate, timing/spring feel, choreography), use the `mobile-design` skill's `motion-recipes.md` / `gestures-and-haptics.md`. This skill is the *implementation* depth for Reanimated specifically.

## Non-negotiable rules (memorize — these cause most bugs)

1. **Babel/worklets plugin must be LAST** in `babel.config.js` plugins. Missing/misordered → "Reanimated failed to create a worklet" or values never animate.
2. **Never read `.value` during React render.** It's UI-thread state; reading it in the component body is wrong and warns. Read it inside worklets (`useAnimatedStyle`, etc.) or via `useDerivedValue`.
3. **Never call React/JS-thread APIs directly from a worklet** (setState, navigation, fetch). Wrap with `runOnJS(fn)(args)` (v2/v3) / `scheduleOnRN(fn)(args)` (v4).
4. **Mutate, then assign — don't mutate `.value` in place.** For objects/arrays reassign `sv.value = {...}` or use `modify()`; in-place mutation won't trigger updates.
5. **One source of truth per animation.** Don't drive the same property from both `useAnimatedStyle` and an inline style / state.
6. **Cancel animations on unmount / before re-driving** with `cancelAnimation(sv)` to avoid leaks and fighting animations.
7. **Stable closures:** worklets capture values at creation; list `useDerivedValue`/handler dependencies and avoid stale captures.

## Reference map

- `references/installation-and-setup.md` — Install per version (Expo + bare), Babel/worklets plugin, New Architecture, gesture-handler + `GestureHandlerRootView`, `Animated` components.
- `references/version-guide.md` — **v2 → v3 → v4 differences.** What changed, renamed (`runOnJS`→`scheduleOnRN`, `useScrollViewOffset`→`useScrollOffset`…), removed (`useAnimatedGestureHandler`…), and how to write version-correct code.
- `references/version-decision-tree.md` — **Which version am I on?** Fast router from `package.json`/Expo SDK → v2/v3/v4 + the right API to write; greenfield defaults; migration note.
- `references/core-concepts.md` — Worklets, UI vs JS thread, `runOnJS`/`runOnUI` (& v4 `scheduleOnRN`/`scheduleOnUI`/`runOnUISync`), serialization, the gotchas.
- `references/shared-values.md` — `useSharedValue`, `.value`, `modify()`, sharing/deriving, reading rules.
- `references/animated-styles.md` — `useAnimatedStyle`, `useAnimatedProps`, `useDerivedValue`, `useAnimatedRef`, `measure`, `scrollTo`.
- `references/animation-functions.md` — `withTiming`, `withSpring`, `withDecay`; modifiers `withSequence`, `withDelay`, `withRepeat`, `withClamp`; callbacks; `cancelAnimation`.
- `references/easing-and-springs.md` — `Easing.*`, duration vs physics springs, spring configs (damping/stiffness/mass, v4 `energyThreshold`).
- `references/interpolation.md` — `interpolate`, `Extrapolation`, `interpolateColor`, `clamp`; ranges & patterns.
- `references/scroll-and-reactions.md` — `useScrollOffset` / `useAnimatedScrollHandler`, `useAnimatedReaction`, event handlers.
- `references/gestures.md` — `react-native-gesture-handler` Gesture API (`Pan/Tap/Pinch/LongPress…`) + Reanimated; the modern replacement for `useAnimatedGestureHandler`.
- `references/layout-animations.md` — Entering/Exiting (`FadeIn`, `SlideInDown`…), `Layout`/`LinearTransition`, `Keyframe`, modifiers, custom, `itemLayoutAnimation`.
- `references/shared-element-transitions.md` — Shared element transitions (tag-based) + caveats / status.
- `references/css-animations-v4.md` — **Reanimated 4** CSS-style `animationName`/`transition*` on `Animated` components (full property set + play-state + transition-behavior); when to prefer over shared values.
- `references/blur-and-liquid-glass.md` — **Blur & (animated) glass, grounded in Apple's Liquid Glass model** (Regular/Clear, floating-plane separation, scroll edge effect, interactive scale/bounce/shimmer, flex-to-thicker, container morphing, concentricity, selective tint, accessibility). Install/configure `expo-blur` (Android `experimentalBlurMethod`), iOS 26 Liquid Glass (`expo-glass-effect` / `@callstack/liquid-glass` + gating/fallback), Skia `BackdropBlur`; a **cross-platform smart `<AnimatedGlass>`** (real glass on iOS 26, Skia emulation on Android, one shared-value driver); recipes: scroll-driven frosted header/edge, interactive press, toolbar→menu flex morph, liquid-merge, glass tab bar, blurred sheet backdrop. Animate the *context* (move/scale/morph/shimmer), not a raw blur value. Build only when the prompt asks for blur/glass.
- `references/device-motion-sensors.md` — **`useAnimatedSensor`:** `SensorType` (accelerometer/gyroscope/gravity/magnetic/rotation), config, tilt parallax, gravity-follow, shake detection; smoothing + Reduce Motion.
- `references/web-and-platform-support.md` — **Web caveats** (worklets→plain JS, dependency arrays, no `measure`/layout-animations), which style props are cheap vs costly to animate, 120fps flag, shadows/`transformOrigin`/New-Arch platform specifics.
- `references/keyboard-and-input-motion.md` — `useAnimatedKeyboard`; chat composer lift, sticky CTA above keyboard, list-follow; `react-native-keyboard-controller`. Where real apps break.
- `references/navigation-animations.md` — Navigation overview: how Reanimated meets React Navigation / Expo Router (transitions, animated tab bars, scroll headers, shared elements, focus-aware, swipe-back).
- `references/react-navigation-transitions.md` — **Deep router/screen transitions.** native-stack presets + sheets vs JS-stack `cardStyleInterpolator`/`transitionSpec`/`TransitionPresets`, gesture dismiss, shared elements, modal/tab transitions.
- `references/expo-router-transitions.md` — **Expo Router** route animations: `<Stack>`/`<Tabs>` options, `presentation` modals + native form sheets, custom in-screen transitions, animated tab bar, shared elements, focus.
- `references/frame-loops-and-realtime.md` — `useFrameCallback`: per-frame worklets for game loops, physics, scrubbers, Skia/audio visualizers; delta-time integration.
- `references/advanced-runtimes.md` — Expert: `createWorkletRuntime`, `runOnRuntime`/`scheduleOnRuntime`, off-UI-thread background worklet computation; when (not) to use.
- `references/patterns-recipes.md` — Production recipes: press scale, swipe-to-delete, drag-to-reorder, parallax/collapsing header, animated tab indicator, bottom sheet, skeleton shimmer, numeric roll, FlatList item entrances, accordion, pull-to-refresh.
- `references/buttons-and-microinteractions.md` — **Senior button/control polish:** press feedback, loading→spinner→success morph, SVG checkmark draw, toggle/switch, checkbox/radio, like burst, segmented control, FAB/speed-dial, ripple, icon morphs.
- `references/cards.md` — **Senior card motion:** press & lift (scale + shadow), swipeable card stack (Tinder), expand card → detail (hero/shared element), 3D flip, parallax tilt, staggered grid entrances.
- `references/overlays-and-modals.md` — **Overlays/transients:** the mount→animate-in→dismiss→unmount lifecycle (reusable `useOverlay`), modal/dialog, alert (shake), action sheet, left/right drawer, anchored dropdown/menu/popover, tooltip, toast/snackbar (auto-dismiss, swipe, stacking).
- `references/inputs-and-indicators.md` — **Controls & status:** slider (drag thumb + fill + step haptic), carousel/pager (`scrollX`-driven depth + pagination dots + autoplay), dropdown/select, stepper, badge/notification dot (pop + pulse), progress bar/ring.
- `references/screen-choreography.md` — **Orchestrate a whole screen:** entrance sequencing/staggering by hierarchy, loading→content continuity, empty/error/success states, scroll reveals, cross-screen continuity, interruptibility, Reduce Motion. The junior-vs-senior tells.
- `references/custom-animations.md` — **When no preset fits, build it:** decompose to one progress + `interpolate`, custom `Keyframe`/entering-exiting builders, custom easing, frame-loop physics, time orchestration. How to approach a "make me X" request.
- `references/native-interop.md` — **Native side:** the interop ladder (`createAnimatedComponent` → `useAnimatedProps` → whitelist/Fabric prop → imperative `dispatchCommand`/`setNativeProps`), animating third-party/custom-native props, when (not) to write native code.
- `references/typescript-and-clean-code.md` — **Team-grade code:** typing shared values/styles/props/gestures, the one sanctioned `as any`, reusable typed animation hooks, centralizing motion vocabulary, Reanimated-specific clean-code rules.
- `references/performance.md` — Keep work on the UI thread, dependency hygiene, `Animated.createAnimatedComponent`, frame budget, 120Hz, common jank causes.
- `references/troubleshooting.md` — Exact-error → fix tables (worklet creation, plugin, `.value` in render, stale state, gesture not animating, layout-animation crashes).
- `references/testing.md` — Jest setup/mock, `jest.useFakeTimers`, advancing animations, RNTL patterns.
- `references/api-reference.md` — Compact index of every hook/function/animation/util with one-line purpose + version note.

**Cross-framework companions** (same senior motion bar + Apple Liquid Glass model, when the project isn't React Native):
- `references/swiftui-and-swift.md` — **Native iOS:** SwiftUI animation (springs, `matchedGeometryEffect`, `Phase`/`KeyframeAnimator`, transitions) + **native Liquid Glass** (`.glassEffect`, `GlassEffectContainer`, `glassEffectID`, concentricity); UIKit (`UIViewPropertyAnimator`, `UIVisualEffectView` + `UIGlassEffect`).
- `references/jetpack-compose-and-kotlin.md` — **Native Android:** Compose animation (`animate*AsState`, `AnimatedVisibility/Content`, `updateTransition`, `Animatable`, springs, `graphicsLayer`, shared transitions) + glassmorphism (**Haze** backdrop blur, `Modifier.blur` caveats; Liquid Glass emulated).
- `references/flutter-and-dart.md` — **Flutter:** animation (implicit widgets, `AnimationController`+`Tween`, `SpringSimulation`, `Hero`, `flutter_animate`) + blur (`BackdropFilter`/`ImageFilter.blur`) and iOS 26 Liquid Glass packages (`liquid_glass_widgets`, `cupertino_liquid_glass`).
