# Gestures — react-native-gesture-handler + Reanimated

Gestures come from **react-native-gesture-handler (RNGH)**, animations from Reanimated. The modern, correct API is RNGH v2's **`Gesture` builder** + `GestureDetector`, with worklet callbacks that write shared values directly. The old `useAnimatedGestureHandler` is **deprecated in v3 and removed in v4** — don't use it for new code.

Setup: `npx expo install react-native-gesture-handler`, wrap the app in `<GestureHandlerRootView style={{flex:1}}>` once (see `installation-and-setup.md`).

---

## The pattern

```tsx
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

function Draggable() {
  const tx = useSharedValue(0);
  const ty = useSharedValue(0);
  const start = useSharedValue({ x: 0, y: 0 });

  const pan = Gesture.Pan()
    .onStart(() => { start.value = { x: tx.value, y: ty.value }; })
    .onUpdate((e) => {
      tx.value = start.value.x + e.translationX;
      ty.value = start.value.y + e.translationY;
    })
    .onEnd((e) => {
      tx.value = withSpring(0, { velocity: e.velocityX }); // snap back with momentum
      ty.value = withSpring(0, { velocity: e.velocityY });
    });

  const style = useAnimatedStyle(() => ({
    transform: [{ translateX: tx.value }, { translateY: ty.value }],
  }));

  return (
    <GestureDetector gesture={pan}>
      <Animated.View style={[styles.box, style]} />
    </GestureDetector>
  );
}
```
Gesture callbacks are **worklets** — write shared values directly; call JS with `runOnJS`/`scheduleOnRN`.

---

## Gesture types

| Builder | Use | Key event fields |
| --- | --- | --- |
| `Gesture.Pan()` | drag, swipe, sheets, sliders | `translationX/Y`, `velocityX/Y`, `x/y` |
| `Gesture.Tap()` | taps; `.numberOfTaps(2)` for double | `x/y` |
| `Gesture.LongPress()` | long press / context menu | `.minDuration(ms)` |
| `Gesture.Pinch()` | zoom | `scale`, `velocity` |
| `Gesture.Rotation()` | rotate | `rotation` |
| `Gesture.Fling()` | quick directional swipe | `.direction(Directions.RIGHT)` |
| `Gesture.Native()` | wrap a native scroll/list | — |

Lifecycle callbacks: `.onBegin`, `.onStart`, `.onUpdate`, `.onChange`, `.onEnd`, `.onFinalize`. Config: `.enabled()`, `.hitSlop()`, `.activeOffsetX([-10,10])`, `.failOffsetY()`, `.minDistance()`, `.shouldCancelWhenOutside()`, `.runOnJS(true)` (run callbacks on JS thread — rarely needed).

---

## Composing gestures

```ts
import { Gesture } from 'react-native-gesture-handler';

// both at once (pinch + pan to zoom & move)
const composed = Gesture.Simultaneous(pinch, pan);

// only one wins (pan OR tap)
const either = Gesture.Race(pan, tap);

// one must wait for another (double-tap before single-tap)
const ordered = Gesture.Exclusive(doubleTap, singleTap);

<GestureDetector gesture={composed}>…</GestureDetector>
```
- `Simultaneous` — recognize together.
- `Race` — first to activate wins, cancels others.
- `Exclusive` — priority order (first has precedence).

---

## Velocity hand-off (the premium detail)

Always pass gesture velocity into the release animation so motion is continuous:
```ts
.onEnd((e) => {
  tx.value = withDecay({ velocity: e.velocityX, clamp: [0, maxX] }); // fling
  // or: tx.value = withSpring(snapPoint, { velocity: e.velocityX });
})
```

---

## Pan inside a ScrollView / nested gestures

- Use `.activeOffsetX([-10, 10])` / `.failOffsetY([-5, 5])` so a horizontal pan doesn't fight vertical scroll.
- Wrap the scrollable with `Gesture.Native()` and compose with `Simultaneous`/`Race` when a gesture must coexist with scrolling.
- Bottom sheets: `@gorhom/bottom-sheet` handles this composition for you — prefer it over hand-rolling.

---

## Legacy → modern

`useAnimatedGestureHandler` + `PanGestureHandler` (RNGH v1) → replace with `Gesture.Pan()` + `GestureDetector`. The `context` param becomes a `start` shared value you set in `.onStart`.

## Checklist
- [ ] RNGH installed; `GestureHandlerRootView` at the root.
- [ ] `Gesture` API + `GestureDetector` (never `useAnimatedGestureHandler` in new/v4 code).
- [ ] Callbacks write shared values; JS work via `runOnJS`/`scheduleOnRN`.
- [ ] Release feeds `velocity` into `withSpring`/`withDecay`.
- [ ] Nested scroll handled with `activeOffsetX`/`failOffsetY` or gesture composition.
