# Version Guide — v2 / v3 / v4

Reanimated's API has been stable in spirit since v2, but v4 made significant changes (New Architecture only, a separate worklets package, CSS animations, several renames/removals). **Write code for the version the repo actually has.** Most production apps today are on **v3**; new Expo SDK 54+ apps are on **v4**.

Detect: `package.json` → `react-native-reanimated` version. If `react-native-worklets` is also a dependency → **v4**.

---

## At a glance

| Area | v2 | v3 | v4 |
| --- | --- | --- | --- |
| Architecture | Legacy | Legacy or New | **New only** |
| Worklets package | built-in | built-in | **separate `react-native-worklets`** |
| Babel plugin | `react-native-reanimated/plugin` | `react-native-reanimated/plugin` | **`react-native-worklets/plugin`** |
| Shared values / animated styles | ✅ | ✅ | ✅ (unchanged) |
| Layout animations | ✅ | ✅ | ✅ |
| Shared element transitions | — | experimental | experimental/evolving |
| CSS animations & transitions | — | — | **✅ new** |
| Gesture handling | `useAnimatedGestureHandler` (RNGH v1) | RNGH v2 `Gesture` API (preferred) | **`Gesture` API only** (`useAnimatedGestureHandler` removed) |

---

## Core API (same across v2/v3/v4)

These work the same everywhere — the bulk of what you write:
`useSharedValue`, `useAnimatedStyle`, `useDerivedValue`, `useAnimatedProps`, `useAnimatedRef`, `useAnimatedReaction`, `withTiming`, `withSpring`, `withDecay`, `withSequence`, `withDelay`, `withRepeat`, `cancelAnimation`, `interpolate`, `interpolateColor`, `Extrapolation`, `Easing`, `measure`, `scrollTo`, layout animations (`FadeIn`, `SlideInDown`, `Layout`/`LinearTransition`, `Keyframe`), `Animated.*` components, `createAnimatedComponent`.

---

## v4 changes — specifics

### Renamed (old names re-exported from `react-native-reanimated` but **deprecated**)
| v3 (old) | v4 (new, in `react-native-worklets`) |
| --- | --- |
| `runOnJS` | `scheduleOnRN` |
| `runOnUI` | `scheduleOnUI` |
| `runOnRuntime` | `scheduleOnRuntime` |
| `executeOnUIRuntimeSync` | `runOnUISync` |
| `makeShareableCloneRecursive` | `createSerializable` |
| `useScrollViewOffset` | `useScrollOffset` |

> Practical rule: in a **v4** project prefer the new names (`scheduleOnRN`, `scheduleOnUI`, `useScrollOffset`). In **v2/v3** use `runOnJS`/`runOnUI`/`useScrollViewOffset`. The deprecated re-exports still run in v4, so existing v3 code mostly keeps working — but don't write *new* deprecated calls in a v4 repo.

### Removed in v4
- `useAnimatedGestureHandler` → use the **RNGH `Gesture` API** (`gestures.md`).
- `useWorkletCallback`.
- `addWhitelistedNativeProps`, `addWhitelistedUIProps`.
- `combineTransition` (layout animations).
- `react-native-v8` support, Legacy Architecture.

### Behavior changes
- **`withSpring`** uses a single **`energyThreshold`** parameter instead of `restDisplacementThreshold` / `restSpeedThreshold`. (Most code uses `damping`/`stiffness`/`mass` and is unaffected.)
- **CSS animations/transitions** are new in v4 — `animationName`, `animationDuration`, CSS-style `transition*` props on `Animated` components, usable alongside shared-value animations. See `css-animations-v4.md`.

---

## Writing version-correct code

- **Imports:** core hooks come from `react-native-reanimated` in every version. In v4, thread-crossing helpers technically live in `react-native-worklets` but are re-exported — importing `scheduleOnRN` from `react-native-reanimated` works; importing from `react-native-worklets` is the canonical v4 source.
- **Cross-thread call:** v2/v3 → `runOnJS(setX)(value)`. v4 → `scheduleOnRN(setX)(value)` (or `runOnJS`, deprecated).
- **Scroll offset hook:** v2/v3 → `useScrollViewOffset(ref)`. v4 → `useScrollOffset(ref)`.
- **Gestures:** any version with RNGH v2 → `Gesture` API. Never write `useAnimatedGestureHandler` for new code (removed in v4).
- **Babel:** match the plugin to the version (table above); plugin must be last.

When unsure which a repo is on, grep for `react-native-worklets` (v4 tell) and for `useAnimatedGestureHandler` (legacy gesture code to modernize).
