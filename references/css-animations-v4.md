# CSS Animations & Transitions (Reanimated 4)

Reanimated **4** adds a CSS-style animation API on `Animated.*` components — declarative `animation*` and `transition*` props that feel like web CSS. They run on the UI thread and work **alongside** shared-value animations (you can mix both). Use them for simple, declarative motion where you don't need a shared value.

> v4 only (requires New Architecture + `react-native-worklets`). Not available in v2/v3 — there, use shared values + animation functions. Confirm API names against your installed v4 docs, as this area is new and evolving.

---

## CSS transitions (animate on style change)

Declare which properties animate and how; then just change the style prop — Reanimated tweens it.

```tsx
import Animated from 'react-native-reanimated';

<Animated.View
  style={{
    width: open ? 200 : 100,
    opacity: open ? 1 : 0.5,
    transitionProperty: ['width', 'opacity'],
    transitionDuration: 250,            // ms (or per-property array)
    transitionTimingFunction: 'ease-out',
  }}
/>
```
- `transitionProperty`: which style keys animate (`'all'` or an array).
- `transitionDuration`, `transitionDelay`, `transitionTimingFunction` (`'ease' | 'ease-in' | 'ease-out' | 'ease-in-out' | 'linear' | cubicBezier(...)`).
- Change the style (e.g. via React state) and it animates — no shared value, no `useAnimatedStyle`.

Great for: hover-less press/selected states, expand/collapse, simple show/hide driven by React state.

---

## CSS animations (keyframes)

Define keyframes and attach an animation:
```tsx
<Animated.View
  style={{
    animationName: {
      from: { opacity: 0, transform: [{ translateY: 20 }] },
      to:   { opacity: 1, transform: [{ translateY: 0 }] },
    },
    animationDuration: 300,
    animationTimingFunction: 'ease-out',
    animationIterationCount: 1,          // or 'infinite'
    animationDirection: 'normal',        // 'reverse' | 'alternate' | ...
    animationFillMode: 'forwards',
    animationDelay: 0,
  }}
/>
```
- `animationName` takes a keyframes object (`from`/`to` or percentage stops `'0%','50%','100%'`).
- Looping: `animationIterationCount: 'infinite'` + `animationDirection: 'alternate'` (e.g. pulse/shimmer) — no `withRepeat` needed.

```tsx
// infinite pulse, pure CSS
animationName: { '0%': { transform: [{ scale: 1 }] }, '50%': { transform: [{ scale: 1.1 }] }, '100%': { transform: [{ scale: 1 }] } },
animationDuration: 1200,
animationIterationCount: 'infinite',
```

---

## CSS vs shared values — which?

| Use CSS (v4) when… | Use shared values when… |
| --- | --- |
| Motion is driven by React **state** changing (open/closed, selected) | Motion is driven by a **gesture** or continuous input |
| Simple enter/transition/loop (pulse, fade, expand) | You need velocity hand-off, interpolation of one value into many outputs |
| You want declarative, less boilerplate | You need precise frame control, `useAnimatedReaction`, scroll-linking |

They interoperate — a component can have a CSS transition for its resting states and a shared-value `useAnimatedStyle` for gesture-driven transforms. Don't drive the **same property** from both.

---

## Checklist (v4)
- [ ] Project is v4 (New Arch + `react-native-worklets`) before using this.
- [ ] Use CSS for state-driven/simple/looping motion; shared values for gestures/continuous.
- [ ] No property driven by both CSS and `useAnimatedStyle`.
- [ ] Verify prop names against the installed v4 docs (new API).
