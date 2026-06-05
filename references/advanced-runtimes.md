# Advanced — Worklet Runtimes

A **worklet runtime** is a separate JS context (powered by Worklets) where worklets can run **off both the JS thread and the main UI thread** — for background computation that must not jank the UI. This is expert-tier; ~90% of apps never need it. Reach for it only when you have heavy, continuous work (image processing, large simulations, parsing, frame analysis) that would otherwise block the UI thread.

> Most "background" needs are better solved with `runOnJS` to the JS thread, a native module, or a server. Use a custom runtime when the work must be a **worklet** (shares shared values, runs near native) yet shouldn't compete with rendering.

---

## Creating a runtime

```ts
import { createWorkletRuntime } from 'react-native-worklets'; // v4 (v3: from react-native-reanimated)
const runtime = createWorkletRuntime('background');
```

## Running on it

```ts
// v3:
import { runOnRuntime } from 'react-native-reanimated';
runOnRuntime(runtime, () => {
  'worklet';
  const result = heavyCompute();        // runs off the UI thread
  runOnJS(onResult)(result);            // hop back to JS thread for the result
})();

// v4:
import { scheduleOnRuntime, scheduleOnRN } from 'react-native-worklets';
scheduleOnRuntime(runtime, () => {
  'worklet';
  const result = heavyCompute();
  scheduleOnRN(onResult)(result);
});
```

- Work on the custom runtime does **not** block the UI thread → animations stay smooth while it runs.
- Communicate results back with `runOnJS`/`scheduleOnRN` (to JS thread) or `runOnUI`/`scheduleOnUI` (to UI thread).

---

## Synchronous UI execution

`executeOnUIRuntimeSync` (v3) / `runOnUISync` (v4) runs a worklet on the UI thread and **returns its result synchronously** — rare, for cases needing an immediate UI-thread value. Use sparingly; synchronous cross-thread calls can stall.

---

## Mappers / reactions (mental model)

Internally, shared values notify dependent worklets ("mappers") when they change — that's what re-runs `useAnimatedStyle`/`useDerivedValue`. You don't manage mappers directly; `useAnimatedReaction` is the public way to react to value changes (see `scroll-and-reactions.md`).

---

## When to use a custom runtime
- Continuous heavy computation that must stay off the UI thread (e.g. per-frame image analysis paired with a frame loop on the UI runtime).
- Background parsing/transform of large data as worklets that touch shared values.
- You measured UI-thread jank caused by worklet work and need to offload it.

## When NOT to
- One-off heavy JS work → `runOnJS` to JS thread or a native module.
- Anything a normal animation/interpolation handles.
- "Just to be safe" — the extra runtime has overhead and complexity.

## Checklist
- [ ] Confirmed the work must be a worklet AND must not block UI — else simpler option.
- [ ] Results marshalled back via `runOnJS`/`scheduleOnRN`.
- [ ] Avoided synchronous cross-thread calls except where truly required.
- [ ] Version-correct imports (`react-native-worklets` in v4).
