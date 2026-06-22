# TypeScript & Clean Code — write it like a team owns it

Reanimated code that ships on a team is **typed, minimal, and reusable** — no `any` soup, no magic numbers, no copy-pasted gesture blocks. This file is the code-quality contract: correct types, the few sanctioned escape hatches, and the patterns that keep animation code clean.

---

## Typing the core primitives

```ts
import { useSharedValue, SharedValue } from 'react-native-reanimated';

const x = useSharedValue(0);                    // SharedValue<number> — inferred
const open = useSharedValue<boolean>(false);    // booleans/unions: annotate
const pos = useSharedValue<{ x: number; y: number }>({ x: 0, y: 0 }); // objects: always annotate
```
- Scalars infer fine; **annotate objects/unions** so `.value` writes are checked.
- Pass a shared value to a child as `SharedValue<number>` — never unwrap it to a number prop (that reads `.value` in render — forbidden).

```tsx
function Knob({ progress }: { progress: SharedValue<number> }) {
  const style = useAnimatedStyle(() => ({ opacity: progress.value })); // read inside the worklet
  return <Animated.View style={style} />;
}
```

---

## Typing styles & props

```ts
// useAnimatedStyle infers ViewStyle/TextStyle/ImageStyle from what you return — usually leave it.
const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));

// useAnimatedProps: pass the target component's prop type for safety
import type { TextInputProps } from 'react-native';
const props = useAnimatedProps<TextInputProps>(() => ({ /* ... */ }));

// Typing a custom animated component
import Svg, { Path, PathProps } from 'react-native-svg';
const AnimatedPath = Animated.createAnimatedComponent(Path); // props typed from Path
const pathProps = useAnimatedProps<PathProps>(() => ({ strokeDashoffset: dash.value }));
```
For a component that receives an animated style prop, type it with `StyleProp` — Reanimated styles are assignable:
```ts
import { StyleProp, ViewStyle } from 'react-native';
type Props = { style?: StyleProp<ViewStyle>; children?: React.ReactNode };
```

---

## Gesture types — already inferred, don't annotate

The `Gesture` builder infers event types per callback. **Don't** manually type `e` — it's correct automatically:
```ts
const pan = Gesture.Pan()
  .onUpdate((e) => { tx.value = e.translationX; }) // e is PanGestureHandlerEventPayload — inferred
  .onEnd((e) => { tx.value = withSpring(0, { velocity: e.velocityX }); });
```
Adding `: any` here is a regression — it throws away the inference RNGH gives you.

---

## The sanctioned `as any` (and how to avoid it)

There is exactly **one** common place `as any` is legitimate: the undocumented `text` prop on an animated `TextInput` (it's a real native prop RN's types don't expose). Contain it behind a typed helper so it doesn't leak:

```tsx
type CounterProps = { value: SharedValue<number>; format?: (n: number) => string };
function AnimatedNumber({ value, format = (n) => String(Math.round(n)) }: CounterProps) {
  const props = useAnimatedProps(() => ({ text: format(value.value) } as Partial<TextInputProps>));
  return <AnimatedTextInput editable={false} defaultValue={format(0)} animatedProps={props} style={styles.num} />;
}
```
Use `as Partial<TextInputProps>` (narrow) over `as any` (nuclear). Everywhere else, a needed `any` means the wrong type import — fix the import, don't cast.

---

## Reusable animation hooks (the team multiplier)

Don't repeat gesture/shared-value blocks. Extract a typed hook that returns a `gesture` + `style`. This is the single highest-leverage clean-code move in Reanimated.

```ts
import { Gesture } from 'react-native-gesture-handler';
import { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';

export function usePressScale(to = 0.96) {
  const scale = useSharedValue(1);
  const gesture = Gesture.Tap()
    .onBegin(() => { scale.value = withTiming(to, { duration: 90 }); })
    .onFinalize(() => { scale.value = withSpring(1, SPRINGS.snappy); });
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return { gesture, style };
}

// usage:
const { gesture, style } = usePressScale();
<GestureDetector gesture={gesture}><Animated.View style={style}>…</Animated.View></GestureDetector>
```
Good candidates to hookify: press scale, toggle, bottom-sheet controller, collapsible header offset, entrance progress. Return shared values/gestures/styles — never read `.value` to return a plain number.

---

## Centralize the motion vocabulary

Magic numbers scattered across files = inconsistent feel. Define springs/durations once and import them — the app gets a coherent motion language for free.

```ts
// motion.ts
export const SPRINGS = {
  snappy: { damping: 20, stiffness: 300 },
  gentle: { damping: 18, stiffness: 120 },
  noBounce: { damping: 26, stiffness: 200 },
} as const;
export const DURATIONS = { fast: 120, base: 250, slow: 400 } as const;
```
→ presets live in `easing-and-springs.md`; this is just "put them in one module."

---

## Clean-code rules specific to Reanimated

- **`useAnimatedStyle` is pure.** No side effects, no `runOnJS`, no allocations beyond the returned style. Side effects → `useAnimatedReaction`.
- **One source of truth per property.** Never drive the same transform from both a `useAnimatedStyle` and an inline/state style.
- **Name shared values for meaning** (`scrollY`, `isOpen`, `dragX`) — not `sv1`, `val`.
- **No magic numbers in worklets** — pull thresholds/targets into named consts.
- **Keep worklets small;** extract a named worklet (`function clampToBounds(v){ 'worklet'; … }`) and reuse it.
- **Pass `SharedValue<T>`, not `.value`,** across component boundaries.
- **Dependency arrays** on `useDerivedValue`/handlers to avoid stale captures.
- **Delete, don't comment out.** No dead animation code; no unused shared values (they still allocate).

---

## Checklist
- [ ] Objects/unions in `useSharedValue` are annotated; scalars inferred.
- [ ] Children receive `SharedValue<T>`, read `.value` only inside worklets.
- [ ] `useAnimatedProps` typed to the target component's props; gesture `e` left inferred.
- [ ] `as any` appears nowhere except a contained `TextInput.text` helper (prefer `as Partial<…>`).
- [ ] Repeated interactions extracted into typed reusable hooks.
- [ ] Springs/durations centralized; no scattered magic numbers.
- [ ] `useAnimatedStyle` pure; one source of truth per property; no dead code.
