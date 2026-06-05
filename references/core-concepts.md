# Core Concepts — worklets, threads, crossing over

Everything in Reanimated is built on three things: **worklets**, the **two-thread model**, and **shared values**. Understanding these prevents ~90% of bugs.

---

## The two threads

- **JS thread** — runs your React components, business logic, network, most libraries.
- **UI thread** (a.k.a. main/native thread) — renders every frame at 60/120Hz.

If animation math runs on the JS thread (e.g. classic `Animated` without native driver, or `setState` per frame), a busy JS thread drops frames. Reanimated runs animations on the **UI thread**, so they stay smooth even while JS is busy.

---

## Worklets

A **worklet** is a JS function that can run on the UI thread. The Babel/worklets plugin compiles them so they can be serialized and executed on the UI runtime.

- Auto-workletized: the callbacks of `useAnimatedStyle`, `useDerivedValue`, `useAnimatedProps`, `useAnimatedReaction`, `useAnimatedScrollHandler`, and gesture callbacks. You usually don't write `'worklet'` yourself.
- Manual: add the directive as the **first statement** of a function you want on the UI thread:
  ```ts
  function compute(x: number) {
    'worklet';
    return x * 2;
  }
  ```
- Worklets **capture** variables by value at creation (a closure snapshot). Captured values must be serializable (numbers, strings, booleans, shared values, other worklets, plain objects/arrays of those). You **cannot** capture/call arbitrary JS-thread objects (a React state setter is fine *only* via `runOnJS`).

---

## Shared values

The reactive bridge between threads. `useSharedValue(initial)` returns `{ value }`.

```ts
const x = useSharedValue(0);
x.value = 100;                 // write (triggers dependent worklets on UI thread)
x.value = withTiming(100);     // write an animation
```

- Read/write `.value`. Writing it updates the UI thread and re-runs worklets that read it.
- **Reading `.value` during render is wrong** — see `shared-values.md`. Read inside worklets or derive with `useDerivedValue`.
- Shared values persist across renders (like a ref) and don't cause re-renders.

Full detail: `shared-values.md`.

---

## Crossing threads

### From UI worklet → JS thread: `runOnJS` (v4: `scheduleOnRN`)
React state, navigation, fetch, analytics, any JS-thread function must be called via `runOnJS`:
```ts
import { runOnJS } from 'react-native-reanimated'; // v4: scheduleOnRN
const onDone = (finished?: boolean) => setOpen(finished ?? false); // JS-thread fn

const style = useAnimatedStyle(() => {
  // ❌ setOpen(true)            — crash: JS function from a worklet
  // ✅ runOnJS(setOpen)(true)   — schedules it on the JS thread
  return { opacity: x.value };
});

// Most common: animation completion callback runs on the UI thread
x.value = withTiming(1, {}, (finished) => {
  'worklet';
  if (finished) runOnJS(onDone)(true);
});
```
`runOnJS(fn)` returns a function — call it with args: `runOnJS(fn)(a, b)`. Don't do `runOnJS(fn(a))`.

### From JS thread → UI thread: `runOnUI` (v4: `scheduleOnUI`)
Run a worklet immediately on the UI thread (rare; e.g. imperative `measure`/`scrollTo` batches):
```ts
import { runOnUI } from 'react-native-reanimated'; // v4: scheduleOnUI
runOnUI(() => {
  'worklet';
  sv.value = withTiming(1);
})();
```

### v4 names
`runOnJS → scheduleOnRN`, `runOnUI → scheduleOnUI`, `runOnRuntime → scheduleOnRuntime`, `executeOnUIRuntimeSync → runOnUISync`. Old names are re-exported but deprecated in v4. Use the new names in v4 repos, the classic names in v2/v3. (See `version-guide.md`.)

---

## Serialization

Values that cross the JS↔UI boundary are serialized ("made shareable"). Plain data (numbers/strings/booleans/objects/arrays), shared values, and worklets serialize fine. Class instances, functions that aren't worklets, and live JS objects do not — pass primitives, or call back via `runOnJS`.

---

## The gotchas that cause most bugs

1. **`.value` read in render** → use a worklet / `useDerivedValue`.
2. **JS fn called from worklet** without `runOnJS`/`scheduleOnRN` → crash.
3. **In-place mutation** of object/array shared values doesn't update → reassign or `modify()`.
4. **Stale closure** — a worklet captured an old value; recreate it or read a shared value instead of a plain variable.
5. **Plugin missing/not last** → "Reanimated failed to create a worklet". (`installation-and-setup.md`)
6. **Animating a non-Animated component** → must use `Animated.View` etc. or `createAnimatedComponent`.

See `troubleshooting.md` for exact-error fixes.
