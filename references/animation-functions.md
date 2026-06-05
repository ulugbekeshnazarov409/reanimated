# Animation Functions & Modifiers

Assign one of these to a shared value's `.value` to animate it. They all return a special value Reanimated drives frame-by-frame on the UI thread.

```ts
x.value = withTiming(100);          // animate to 100
x.value = withSpring(100);          // spring to 100
```

---

## withTiming(toValue, config?, callback?)

Duration + easing based. The default, predictable choice.
```ts
import { withTiming, Easing } from 'react-native-reanimated';
x.value = withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
```
- `duration` (ms, default 300), `easing` (default `Easing.inOut(Easing.quad)`). See `easing-and-springs.md`.
- Good for opacity, color, precise UI transitions where you want an exact duration.

## withSpring(toValue, config?, callback?)

Physics-based; the natural, "alive" feel. The default for interactive/gesture-driven motion.
```ts
import { withSpring } from 'react-native-reanimated';
x.value = withSpring(1, { damping: 15, stiffness: 150, mass: 1 });
```
- Common config: `damping` (higher = less oscillation), `stiffness` (higher = faster), `mass`. Or duration-based spring: `{ duration: 500, dampingRatio: 0.7 }`.
- v4: rest threshold is a single `energyThreshold` (replaces `restDisplacementThreshold`/`restSpeedThreshold`).
- Use for press feedback, drag release, sheets, anything that should feel tactile. See spring presets in `easing-and-springs.md`.

## withDecay(config, callback?)

Momentum/deceleration — continue from a velocity (fling, scroll-like). Almost always fed by a gesture's velocity.
```ts
import { withDecay } from 'react-native-reanimated';
// in a Pan gesture onEnd:
x.value = withDecay({
  velocity: e.velocityX,
  clamp: [0, maxX],          // optional bounds (snaps/stops at edges)
  deceleration: 0.998,        // optional
  rubberBandEffect: true,     // optional overscroll feel within clamp
});
```

---

## Modifiers — compose animations

### withSequence(...animations)
Run animations one after another:
```ts
import { withSequence, withTiming } from 'react-native-reanimated';
// shake
x.value = withSequence(
  withTiming(-10, { duration: 50 }),
  withTiming(10, { duration: 50 }),
  withTiming(-6, { duration: 50 }),
  withTiming(0, { duration: 50 }),
);
```

### withDelay(ms, animation)
Delay before starting (great for staggering):
```ts
opacity.value = withDelay(index * 40, withTiming(1));
```

### withRepeat(animation, count?, reverse?, callback?)
Repeat N times (`-1` = infinite); `reverse` ping-pongs.
```ts
// infinite pulse
scale.value = withRepeat(withTiming(1.1, { duration: 700 }), -1, true);
// to stop: cancelAnimation(scale); scale.value = withTiming(1);
```

### withClamp(config, animation) — v3.5+/v4
Constrain an animation (esp. a spring) to a min/max:
```ts
import { withClamp, withSpring } from 'react-native-reanimated';
x.value = withClamp({ min: 0, max: 100 }, withSpring(target));
```

Modifiers nest freely: `withDelay(100, withRepeat(withSequence(...), 3))`.

---

## Callbacks (run on the UI thread)

The last arg is a worklet called when the animation **finishes or is cancelled**. `finished` is `true` only if it completed naturally.
```ts
x.value = withTiming(1, { duration: 300 }, (finished) => {
  'worklet';
  if (finished) runOnJS(onComplete)(); // hop to JS thread for state/nav
});
```
Don't call JS functions directly in the callback — use `runOnJS`/`scheduleOnRN`.

---

## Cancelling

```ts
import { cancelAnimation } from 'react-native-reanimated';
cancelAnimation(x);          // stops where it is
x.value = x.value;           // (optional) settle/hold current value
```
Cancel before re-driving a value from a new source, and on unmount, to avoid fighting/looping animations and leaks.

---

## Picking a function
- Exact duration / opacity / color / deterministic → **withTiming**.
- Interactive, tactile, gesture release, sheets → **withSpring**.
- Fling / momentum after a swipe → **withDecay** (feed gesture velocity).
- Sequence / stagger / loop / shake / pulse → **withSequence / withDelay / withRepeat**.
- Bound a spring → **withClamp**.

## Checklist
- [ ] Spring for interaction, timing for deterministic transitions, decay for momentum.
- [ ] Infinite `withRepeat` is cancelled on unmount.
- [ ] Completion callbacks use `runOnJS`/`scheduleOnRN` for JS-thread work.
- [ ] Re-driving a value cancels the previous animation if they could fight.
