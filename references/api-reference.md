# API Reference — compact index

One-line purpose + version note for every common export. Import from `react-native-reanimated` unless noted. v4 thread helpers canonically come from `react-native-worklets` (re-exported from reanimated).

---

## Hooks

| Hook | Purpose |
| --- | --- |
| `useSharedValue(initial)` | Reactive UI-thread value; read/write `.value`. |
| `useAnimatedStyle(worklet, deps?)` | Compute a style object per frame from shared values. |
| `useAnimatedProps(worklet, deps?)` | Animate non-style props (SVG, TextInput text, etc.). |
| `useDerivedValue(worklet, deps?)` | Read-only shared value derived from others. |
| `useAnimatedReaction(prepare, react, deps?)` | Run a worklet side effect when a computed value changes. |
| `useAnimatedRef()` | Ref usable in worklets for `measure`/`scrollTo`. |
| `useAnimatedScrollHandler(handlers)` | Worklet scroll event handler (x/y/velocity/begin/end). |
| `useScrollOffset(ref)` | Scroll offset as a shared value. **v4** (v2/3: `useScrollViewOffset`). |
| `useAnimatedKeyboard()` | Keyboard height/state as shared values. |
| `useFrameCallback(cb)` | Run a worklet every frame (game loops, custom physics). |
| `useReducedMotion()` | Whether OS Reduce Motion is on. |

---

## Animation functions

| Function | Purpose |
| --- | --- |
| `withTiming(to, config?, cb?)` | Duration + easing animation. |
| `withSpring(to, config?, cb?)` | Physics/duration spring. (v4: `energyThreshold`.) |
| `withDecay(config, cb?)` | Momentum/fling from a velocity. |
| `withSequence(...anims)` | Run animations in order. |
| `withDelay(ms, anim)` | Delay before an animation. |
| `withRepeat(anim, count?, reverse?, cb?)` | Repeat (−1 = infinite), optional ping-pong. |
| `withClamp({min,max}, anim)` | Constrain an animation to a range. |
| `cancelAnimation(sharedValue)` | Stop an in-flight animation. |

---

## Math / interpolation

| Util | Purpose |
| --- | --- |
| `interpolate(v, inRange, outRange, extrap?)` | Map a numeric range to another. |
| `interpolateColor(v, inRange, colors, space?)` | Map a value to colors (`'RGB'`/`'HSV'`). |
| `Extrapolation` | `CLAMP` / `EXTEND` / `IDENTITY`. |
| `clamp(v, min, max)` | Bound a value (worklet). |
| `Easing` | Easing curves: `linear/quad/cubic/sin/exp/circle/poly/bezier/elastic/bounce/back` + `in/out/inOut`. |

---

## Thread helpers

| v2/v3 | v4 (preferred) | Purpose |
| --- | --- | --- |
| `runOnJS(fn)(args)` | `scheduleOnRN(fn)(args)` | Call a JS-thread fn from a worklet. |
| `runOnUI(worklet)()` | `scheduleOnUI(worklet)()` | Run a worklet on the UI thread from JS. |
| `runOnRuntime(rt, w)` | `scheduleOnRuntime(rt, w)` | Run on a specific worklet runtime. |
| `executeOnUIRuntimeSync` | `runOnUISync` | Synchronous UI-thread execution. |
| `makeShareableCloneRecursive` | `createSerializable` | Serialize data for the UI thread (advanced). |
| `measure(animatedRef)` | (same) | Synchronously measure a node (worklet). |
| `scrollTo(animatedRef, x, y, animated)` | (same) | Imperative scroll (worklet). |

---

## Components

| Export | Purpose |
| --- | --- |
| `Animated.View / Text / ScrollView / FlatList / Image` | Animatable built-ins. |
| `Animated.createAnimatedComponent(C)` | Make a third-party component animatable. |

---

## Layout animations

| Export | Purpose |
| --- | --- |
| Entering/Exiting presets | `FadeIn/Out(+Up/Down/Left/Right)`, `SlideIn/Out*`, `ZoomIn/Out*`, `BounceIn/Out`, `FlipIn/Out*`, `StretchIn/Out`, `Lightspeed*`, `Pinwheel`, `Roll*`. |
| `LinearTransition` | Animate layout/position changes (older: `Layout`). |
| `FadingTransition` / `SequencedTransition` / `JumpingTransition` | Alternate layout transition styles. |
| `Keyframe` | Custom multi-stop entering/exiting animation. |
| `ReduceMotion` | `System`/`Always`/`Never` for `.reduceMotion(...)`. |
| `SharedTransition` | Custom shared element transition (experimental). |

Modifiers on presets: `.duration() .delay() .springify() .damping() .stiffness() .mass() .easing() .randomDelay() .withInitialValues() .withCallback() .reduceMotion()`.

---

## Removed in v4 (don't use)
`useAnimatedGestureHandler`, `useWorkletCallback`, `addWhitelistedNativeProps`, `addWhitelistedUIProps`, `combineTransition`.

---

## v4 setup deltas
- Babel plugin: `react-native-worklets/plugin` (not `react-native-reanimated/plugin`).
- Requires `react-native-worklets` package + New Architecture.
- `withSpring` rest config → `energyThreshold`.
- Prefer new thread-helper names + `useScrollOffset`.

> When unsure an export exists in the installed version, check `version-guide.md` or the official docs for that version.
