# Shared Values

`useSharedValue` is the reactive state of Reanimated — the value worklets read and animate. It lives on the UI thread, persists across renders, and does **not** trigger React re-renders.

```ts
import { useSharedValue } from 'react-native-reanimated';
const progress = useSharedValue(0);        // number
const offset = useSharedValue({ x: 0, y: 0 }); // object
```

---

## Reading & writing `.value`

```ts
progress.value;                 // read (inside a worklet / event handler — NOT during render)
progress.value = 1;             // instant write
progress.value = withTiming(1); // animated write
```

- Writing `.value` updates the UI thread and re-runs every worklet that reads it (`useAnimatedStyle`, `useDerivedValue`, etc.).
- A shared value is like a `ref`: stable identity across renders, no re-render on change.

### Rule: never read `.value` during render
```tsx
function Bad() {
  const x = useSharedValue(0);
  return <Text>{x.value}</Text>; // ❌ warns; reads UI-thread state on JS thread, won't update
}
```
Read it where it belongs:
- Inside a worklet (`useAnimatedStyle(() => ({ width: x.value }))`).
- Derive another shared value with `useDerivedValue`.
- To **display** an animated number as text, use `useAnimatedProps` on a `TextInput` (see `patterns-recipes.md` → numeric roll) or `react-native-redash`'s `ReText`.

---

## Objects & arrays — reassign, don't mutate in place

In-place mutation does **not** notify dependents:
```ts
const pos = useSharedValue({ x: 0, y: 0 });
pos.value.x = 10;             // ❌ no update
pos.value = { ...pos.value, x: 10 }; // ✅ reassign whole object
```

For partial updates on objects/arrays, use `modify()` (runs a worklet, mutates, and notifies):
```ts
import { useSharedValue } from 'react-native-reanimated';
const list = useSharedValue<number[]>([]);
list.modify((arr) => {
  'worklet';
  arr.push(1);
  return arr;
});
```

---

## Writing from different places

- **From JS thread** (event handlers, effects): just assign — `x.value = withTiming(1)`. Reanimated marshals it to the UI thread.
- **From a worklet** (gesture/handler/derived): assign directly — same syntax.
- **From the JS thread imperatively in bulk**: wrap in `runOnUI`/`scheduleOnUI` only when you need it to execute as one UI-thread batch.

---

## Initializing from props / state

`useSharedValue(initial)` only uses `initial` on first render (like `useState`). To sync a shared value when a prop changes, use an effect or a reaction:
```ts
useEffect(() => { x.value = withTiming(propValue); }, [propValue]);
// or react to another shared value with useAnimatedReaction (see scroll-and-reactions.md)
```

---

## Deriving values

`useDerivedValue` builds a read-only shared value from others (memoized worklet):
```ts
const scale = useSharedValue(1);
const opacity = useDerivedValue(() => interpolate(scale.value, [1, 1.2], [1, 0.5]));
```
List external (non-shared) dependencies in the optional second arg. See `animated-styles.md`.

---

## Cancelling

Stop an in-flight animation (before re-driving, or on unmount):
```ts
import { cancelAnimation } from 'react-native-reanimated';
cancelAnimation(progress); // leaves the value where it stopped
useEffect(() => () => cancelAnimation(progress), []); // cleanup
```

---

## Checklist
- [ ] Never read `.value` in the component body / JSX.
- [ ] Reassign whole objects/arrays (or use `modify()`); no in-place mutation.
- [ ] Sync from props via effect/reaction, not by reading `.value` in render.
- [ ] Cancel long-running animations on unmount / before restarting.
