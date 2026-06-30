# Custom Animations — when no preset or recipe fits

Presets and recipes cover the common 80%. When the design asks for something bespoke — a magnetic snap, a custom reveal curve, a physics the built-in spring can't express, a one-of-a-kind entrance — you build it from primitives. The senior move is knowing **which primitive** the effect decomposes into, then writing the minimum code to express it.

---

## The decision: which tool expresses this?

| The motion is… | Build it with |
| --- | --- |
| A pure function of one progress (0→1) | `useSharedValue` + `withTiming/withSpring` + **`interpolate`** to many outputs |
| Responding to a gesture/scroll continuously | gesture/scroll handler writes a shared value; styles `interpolate` from it |
| Physical / momentum (fling, settle, snap) | `withSpring` / `withDecay`, fed gesture **velocity** |
| Multi-step / choreographed in time | `withSequence` + `withDelay` + `withRepeat` (+ callbacks) |
| A bespoke entrance/exit on mount/unmount | **custom `Keyframe`** or a custom entering/exiting builder |
| Physics the built-ins can't express | **`useFrameCallback`** integrating your own equation (`frame-loops-and-realtime.md`) |

If you can write the look as `f(progress)`, you almost never need anything fancier than one shared value + `interpolate`.

---

## 1. One progress value → many outputs (the core technique)

Most "complex" animations are several `interpolate` calls reading one driver. This is cheaper and more controllable than many independent animations.

```tsx
const p = useSharedValue(0);
const play = () => (p.value = withTiming(1, { duration: 500, easing: Easing.out(Easing.cubic) }));

const style = useAnimatedStyle(() => ({
  opacity: interpolate(p.value, [0, 0.3, 1], [0, 1, 1]),
  transform: [
    { translateY: interpolate(p.value, [0, 1], [24, 0]) },
    { scale:      interpolate(p.value, [0, 0.6, 1], [0.9, 1.03, 1]) }, // tiny overshoot via the curve
    { rotate: `${interpolate(p.value, [0, 1], [-6, 0])}deg` },
  ],
}));
```
Overshoot, stagger, and "personality" all come from **the shape of the input/output ranges**, not extra animations.

---

## 2. Custom Keyframe (bespoke entrance/exit)

When the multi-stop motion is for mount/unmount, a `Keyframe` is more declarative than imperative chaining. → also `layout-animations.md`.

```ts
import { Keyframe } from 'react-native-reanimated';

const popIn = new Keyframe({
  0:   { opacity: 0, transform: [{ scale: 0.8 }, { rotate: '-8deg' }] },
  70:  { opacity: 1, transform: [{ scale: 1.05 }, { rotate: '2deg' }] },
  100: { opacity: 1, transform: [{ scale: 1 }, { rotate: '0deg' }] },
}).duration(450);

<Animated.View entering={popIn} />
```

---

## 3. Custom entering/exiting builder (full control)

For reusable, parametric mount animations beyond what `Keyframe` expresses, write the builder function form — a worklet returning `initialValues`, `animations`, and an optional `callback`.

```ts
import { withTiming, withSpring } from 'react-native-reanimated';

const EnterFromSide = (sign: 1 | -1) => (values) => {
  'worklet';
  return {
    initialValues: { opacity: 0, transform: [{ translateX: sign * 60 }] },
    animations: {
      opacity: withTiming(1, { duration: 250 }),
      transform: [{ translateX: withSpring(0, { damping: 16, stiffness: 200 }) }],
    },
  };
};

<Animated.View entering={EnterFromSide(1)} />
```
`values` carries target layout metrics (`targetWidth`, `targetHeight`, `targetOriginX/Y`) so you can compute from the final position.

---

## 4. Custom easing

Built-in `Easing.*` not matching the spec? Use a cubic-bezier from the design tool, or write a worklet easing function.

```ts
withTiming(1, { duration: 300, easing: Easing.bezier(0.2, 0.9, 0.1, 1).factory() });

// fully custom (must be a worklet, pure, 0→1):
const easeCustom = (t: number) => { 'worklet'; return t * t * (3 - 2 * t); }; // smoothstep
withTiming(1, { duration: 300, easing: easeCustom });
```

---

## 5. Custom physics with a frame loop

When `withSpring`/`withDecay` can't express it — gravity, magnetism, attraction to multiple snap points, an inertial scrubber — integrate your own equation per frame. → `frame-loops-and-realtime.md`.

```ts
const y = useSharedValue(0), v = useSharedValue(0);
useFrameCallback((info) => {
  const dt = (info.timeSincePreviousFrame ?? 16) / 1000;
  const k = 120, damping = 14;            // your own spring toward target
  const a = -k * (y.value - target.value) - damping * v.value;
  v.value += a * dt;
  y.value += v.value * dt;
});
```
Use `timeSincePreviousFrame` (delta time) so motion is frame-rate independent across 60/120Hz.

---

## 6. Orchestrate in time (sequence / repeat / callbacks)

```ts
// attention nudge: shrink, overshoot, settle, then pause and repeat twice
scale.value = withRepeat(
  withSequence(
    withTiming(0.92, { duration: 90 }),
    withSpring(1.08, { damping: 6 }),
    withSpring(1, { damping: 12 }),
    withDelay(600, withTiming(1)),
  ), 2, false,
);
// run JS after a custom animation completes:
p.value = withTiming(1, { duration: 400 }, (finished) => { 'worklet'; if (finished) runOnJS(onDone)(); });
```

---

## How to approach a "make me X" request

1. **Decompose** the look into properties over time (opacity? translate? rotate? scale? color?).
2. **Pick the driver:** time (`withTiming`), physics (`withSpring/withDecay`), gesture/scroll, or frame loop.
3. **Express each property** as `interpolate(driver, …)` (or a Keyframe stop).
4. **Tune the feel** via ranges/easing/spring config (`easing-and-springs.md`), not by piling on animations.
5. **Make it reusable** — wrap in a typed hook/builder (`typescript-and-clean-code.md`).
6. **Guard:** Reduce Motion fallback, cancel loops on unmount, keep it on the UI thread.

---

## Checklist
- [ ] Expressed as `f(progress)` via one driver + `interpolate` where possible (not many parallel animations).
- [ ] Bespoke mount/unmount → `Keyframe` or custom entering/exiting builder.
- [ ] Custom curve via `Easing.bezier` or a pure worklet easing fn.
- [ ] True custom physics → `useFrameCallback` with delta-time integration.
- [ ] Personality comes from ranges/curves, not extra moving parts.
- [ ] Reusable (hook/builder), typed, Reduce-Motion-safe, loops cancelled.
