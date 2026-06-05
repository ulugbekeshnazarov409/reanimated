# Version Decision Tree — which Reanimated API to write

Pick the version target **before** writing code, so you use the right API names, Babel plugin, and setup. As Expo SDKs advance, v4 is becoming the default — but most live apps are still v3. Decide from the repo, not habit.

> Detailed differences: `version-guide.md`. This file is the fast "which one am I on?" router.

---

## Decision tree

```
1. Does package.json have `react-native-worklets` as a dependency?
   └─ YES → Reanimated 4.  Use v4 API.
   └─ NO  → continue

2. What is `react-native-reanimated` version in package.json?
   ├─ ^4.x        → Reanimated 4 (worklets pkg may be transitive — still v4 API)
   ├─ ^3.x        → Reanimated 3.  Use v3 API.
   └─ ^2.x        → Reanimated 2.  Use v2 API (≈ v3 for most hooks)

3. Cross-check the environment:
   ├─ Expo SDK 54+        → v4 by default
   ├─ Expo SDK 52–53      → v3
   ├─ Expo SDK ≤51        → v3 (or v2 on old projects)
   └─ Bare RN, New Arch?  → v4 only if New Architecture is enabled; else v3
```

If signals conflict (e.g. SDK says v4 but `react-native-reanimated` is pinned to 3.x), **trust `package.json`** — that's what's installed.

---

## Greenfield (new project) default

- New Expo app on **SDK 54+** → start on **Reanimated 4** (New Arch is default): `react-native-worklets/plugin`, `scheduleOnRN`/`scheduleOnUI`, `useScrollOffset`, CSS animations available.
- Targeting older SDKs or a Legacy-Arch app → **Reanimated 3**: `react-native-reanimated/plugin`, `runOnJS`/`runOnUI`, `useScrollViewOffset`.
- Don't write `useAnimatedGestureHandler` ever (deprecated v3 / removed v4) — always the RNGH `Gesture` API.

---

## What changes by target (quick)

| | v3 | v4 |
| --- | --- | --- |
| Babel plugin | `react-native-reanimated/plugin` | `react-native-worklets/plugin` |
| JS-from-worklet | `runOnJS` | `scheduleOnRN` (or `runOnJS`, deprecated) |
| Worklet on UI | `runOnUI` | `scheduleOnUI` |
| Scroll offset hook | `useScrollViewOffset` | `useScrollOffset` |
| Architecture | Legacy or New | New only |
| Worklets package | built-in | separate `react-native-worklets` |
| CSS animations | — | available |
| `withSpring` rest | rest*Threshold | `energyThreshold` |
| Gestures | `Gesture` API | `Gesture` API (only) |

---

## Migration note (v3 → v4)

If asked to upgrade: switch the Babel plugin, add `react-native-worklets`, enable New Architecture, update renamed APIs (or keep the deprecated re-exports temporarily), replace any `useAnimatedGestureHandler`/`combineTransition`/`useWorkletCallback`, and rebuild native. See `version-guide.md`.

## Rule
Write **one** version's API consistently per file. When unsure, grep `react-native-worklets` (v4 tell) and read `package.json`. Never mix v4 names into a v3 project or vice-versa.
