# Easing & Spring Configs

The feel of an animation lives here. Timing animations use `Easing`; springs use physics or duration config.

---

## Easing (for withTiming)

```ts
import { Easing } from 'react-native-reanimated';
withTiming(1, { duration: 300, easing: Easing.out(Easing.cubic) });
```

Common, premium-feeling choices:
| Easing | Feel | Use |
| --- | --- | --- |
| `Easing.out(Easing.cubic)` | decelerate, soft landing | **entrances / appear** (default for things arriving) |
| `Easing.in(Easing.cubic)` | accelerate away | **exits / dismiss** |
| `Easing.inOut(Easing.cubic)` | smooth both ends | moves between two states |
| `Easing.out(Easing.quad)` | gentle decel | subtle UI |
| `Easing.bezier(0.25, 0.1, 0.25, 1)` | custom curve | match a design spec / Material |
| `Easing.linear` | constant | progress bars, continuous loops |
| `Easing.elastic(1.2)` / `Easing.bounce` | overshoot/bounce | playful only |

Rule (from motion design): **enter = ease-out, exit = ease-in.** Durations 150–300ms for most UI; see `mobile-design`'s motion tiers.

Modifiers: `Easing.in(fn)`, `Easing.out(fn)`, `Easing.inOut(fn)` wrap a base curve (`quad`, `cubic`, `sin`, `circle`, `exp`, `poly(n)`, `bezier(...)`, `elastic(b)`, `bounce`, `back(s)`).

---

## Springs (for withSpring)

Two ways to configure:

### Physics-based
```ts
withSpring(target, { damping: 15, stiffness: 150, mass: 1 });
```
- `stiffness` ↑ → faster, snappier (default ~100).
- `damping` ↑ → less oscillation/bounce (default ~10). Low damping = bouncy.
- `mass` ↑ → heavier, slower (default 1).
- `velocity` — initial velocity (feed gesture velocity for continuity).
- `overshootClamping: true` — never overshoot past target.
- v4: `energyThreshold` controls when it's considered at rest (replaces `restDisplacementThreshold`/`restSpeedThreshold`).

### Duration-based (easier to reason about)
```ts
withSpring(target, { duration: 500, dampingRatio: 0.7 });
```
- `dampingRatio`: 1 = critically damped (no bounce), <1 = bouncy, >1 = sluggish.
- `duration`: approximate settle time.

---

## Spring presets (copy these)

| Preset | Config | Feel / use |
| --- | --- | --- |
| **Snappy** | `{ damping: 20, stiffness: 300 }` | quick, precise, no wobble — buttons, pro UI |
| **Gentle** | `{ damping: 18, stiffness: 120 }` | calm settle — content, sheets |
| **Bouncy / playful** | `{ damping: 9, stiffness: 180 }` | energetic bounce — delight moments only |
| **Heavy** | `{ damping: 20, stiffness: 120, mass: 1.4 }` | weighty — large cards, finance |
| **No-overshoot** | `{ damping: 26, stiffness: 200 }` or `dampingRatio: 1` | settles exactly, no bounce — toggles |

Default to **Snappy** for interaction, **Gentle** for content. Reserve bounce for intentionally playful apps.

---

## Timing vs spring — which?
- **Spring** when the motion responds to the user (gesture release, press, drag, sheets) or should feel physical/alive.
- **Timing** when you need an exact duration or animate opacity/color/progress deterministically.
- Feed `velocity` into `withSpring`/`withDecay` from a gesture's `velocityX/Y` for seamless hand-off (no visual stutter at release).

## Reduce Motion
Honor the OS setting; degrade to instant/fade. Check `AccessibilityInfo.isReduceMotionEnabled()` (or Reanimated's reduced-motion config) and skip springs/large transforms when enabled.
