# Troubleshooting — exact error → fix

Read the **exact** message, find it here, fix the root cause. Most issues are setup, thread-crossing, or the `.value`-in-render mistake.

---

## Setup / worklet creation

| Symptom | Cause | Fix |
| --- | --- | --- |
| `Reanimated failed to create a worklet, maybe you forgot to add Reanimated's Babel plugin?` | Babel plugin missing or **not last** | Add `react-native-reanimated/plugin` (v2/3) or `react-native-worklets/plugin` (v4) as the **last** plugin; restart `expo start -c`; rebuild native |
| Animations just don't run / values jump instantly | Plugin not applied (cache) or animating a non-Animated component | Clear Metro cache; ensure target is `Animated.View` etc. |
| `[Reanimated] Couldn't find the worklets module` / native crash on launch (v4) | `react-native-worklets` not installed or New Arch off | `npx expo install react-native-worklets`; enable New Architecture; rebuild |
| Works in dev, crashes in release | Plugin only in a dev-only Babel env, or Hermes/proguard | Ensure plugin in the base config; test release build |
| `babel-preset-expo` warning about duplicate Reanimated plugin | Plugin added twice | Remove the explicit plugin line if the preset already adds it |

---

## Thread crossing

| Symptom | Cause | Fix |
| --- | --- | --- |
| Crash: `Tried to synchronously call a non-worklet function on the UI thread` / calling JS from worklet | Calling a JS-thread fn (setState/nav/fetch) inside a worklet | Wrap: `runOnJS(fn)(args)` (v4 `scheduleOnRN(fn)(args)`) |
| `runOnJS` does nothing / wrong args | Called as `runOnJS(fn(arg))` | Use `runOnJS(fn)(arg)` — it returns a function you then call |
| State updates lag/batch oddly during gesture | `setState` per frame via `runOnJS` | Keep value in a shared value; setState only on discrete events |
| `ReferenceError`/undefined inside a worklet | Referenced a non-serializable JS object/closure | Pass primitives/shared values; mark helper functions `'worklet'` |

---

## `.value` / reactivity

| Symptom | Cause | Fix |
| --- | --- | --- |
| Warning: reading/writing `.value` during render | Read `sv.value` in component body/JSX | Read inside `useAnimatedStyle`/`useDerivedValue`; display via `useAnimatedProps`+TextInput |
| Object/array shared value not updating UI | In-place mutation (`sv.value.x = 1`) | Reassign whole value `sv.value = {...sv.value, x:1}` or use `sv.modify()` |
| Style not updating when a normal variable changes | Worklet captured a stale plain variable | Use a shared value, or add it to the deps array of `useDerivedValue` |
| Two animations fighting / value snaps back | Same property driven by two sources, or not cancelled | One source of truth; `cancelAnimation(sv)` before re-driving |

---

## Gestures

| Symptom | Cause | Fix |
| --- | --- | --- |
| Gesture does nothing | No `GestureHandlerRootView` at root, or not using `GestureDetector` | Wrap app root; use `Gesture.*` + `<GestureDetector>` |
| `useAnimatedGestureHandler` errors (v4) | Removed in v4 | Migrate to `Gesture` API |
| Horizontal pan blocks vertical scroll (or vice-versa) | No activation thresholds | `.activeOffsetX([-10,10])` / `.failOffsetY([-5,5])`; compose with `Gesture.Native()` |
| Tap fires during scroll | Tap not failing on movement | Use `.maxDistance()`, or compose `Race`/`Simultaneous` appropriately |

---

## Layout animations

| Symptom | Cause | Fix |
| --- | --- | --- |
| Exiting animation doesn't play | Parent unmounted with child | Conditionally render the child, keep parent mounted |
| Layout animation janky/crashes on Android | Nested in a clipping/complex container | Test on device; simplify nesting; ensure stable keys |
| List reorder jumps | No `itemLayoutAnimation` / unstable keys | `Animated.FlatList itemLayoutAnimation={LinearTransition}`; stable `keyExtractor` |
| `combineTransition` undefined (v4) | Removed in v4 | Use a single transition / Keyframe |

---

## Misc

| Symptom | Cause | Fix |
| --- | --- | --- |
| `measure()` returns null | Node not laid out yet | Null-check; call after layout; use `useAnimatedRef` |
| Web build errors with Reanimated | Web needs the plugin + sometimes `@babel` interop | Ensure plugin for web target; some APIs are native-only |
| Jest: `Reanimated` undefined / tests crash | Missing mock | Add the official mock in jest setup (see `testing.md`) |
| TypeScript: `.value` type errors | Untyped shared value | `useSharedValue<number>(0)`, type generics on hooks |

When stuck: confirm version (`version-guide.md`), confirm plugin/setup (`installation-and-setup.md`), then check whether the bug is a thread-crossing or `.value`-in-render issue — those two cover most reports.
