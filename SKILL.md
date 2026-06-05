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
  animated bottom sheet RN.
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

1. **Detect the version & setup.** Check `package.json` for `react-native-reanimated` (v2/v3/v4) and whether `react-native-worklets` is present (→ v4). Verify the Babel/worklets plugin and (v4) New Architecture. → `references/installation-and-setup.md` + `references/version-guide.md`. Write code for the version the project actually uses.
2. **Ground in the core concepts** if doing anything non-trivial → `references/core-concepts.md` (worklets, threads, runOnJS/runOnUI, the rules that cause 90% of bugs).
3. **Pull the right reference for the task** (map below) — shared values, animated styles, animation functions, interpolation, scroll, gestures, layout animations, CSS animations.
4. **For a full UI effect**, use `references/patterns-recipes.md` (swipe-to-delete, drag-to-reorder, parallax header, animated tab bar, bottom sheet, skeleton, carousel…).
5. **Verify** against `references/performance.md` (keep work off the JS thread) and `references/troubleshooting.md` (the exact-error → fix tables). Mock with `references/testing.md` if tests exist.

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
- `references/css-animations-v4.md` — **Reanimated 4** CSS-style `animationName`/transitions on `Animated` components; when to prefer over shared values.
- `references/keyboard-and-input-motion.md` — `useAnimatedKeyboard`; chat composer lift, sticky CTA above keyboard, list-follow; `react-native-keyboard-controller`. Where real apps break.
- `references/navigation-animations.md` — React Navigation / Expo Router: stack/modal transitions, animated tab bars, scroll-driven headers, shared elements, focus-aware animations, swipe-back.
- `references/frame-loops-and-realtime.md` — `useFrameCallback`: per-frame worklets for game loops, physics, scrubbers, Skia/audio visualizers; delta-time integration.
- `references/advanced-runtimes.md` — Expert: `createWorkletRuntime`, `runOnRuntime`/`scheduleOnRuntime`, off-UI-thread background worklet computation; when (not) to use.
- `references/patterns-recipes.md` — Production recipes: press scale, swipe-to-delete, drag-to-reorder, parallax/collapsing header, animated tab indicator, bottom sheet, skeleton shimmer, numeric roll, FlatList item entrances, accordion, pull-to-refresh.
- `references/performance.md` — Keep work on the UI thread, dependency hygiene, `Animated.createAnimatedComponent`, frame budget, 120Hz, common jank causes.
- `references/troubleshooting.md` — Exact-error → fix tables (worklet creation, plugin, `.value` in render, stale state, gesture not animating, layout-animation crashes).
- `references/testing.md` — Jest setup/mock, `jest.useFakeTimers`, advancing animations, RNTL patterns.
- `references/api-reference.md` — Compact index of every hook/function/animation/util with one-line purpose + version note.
