# Screen Choreography — orchestrating a whole screen

Component recipes make one element move. **Choreography** is the senior skill: making a *whole screen* feel composed — elements arrive in a deliberate order, state changes (loading → content → empty/error) flow instead of snap, and motion stays continuous and interruptible. This is what reads as "premium" vs. "a bunch of animations."

> Companion: for the *design* decisions (what to animate, timing tiers, feel), use the `mobile-design` skill. This file is the Reanimated *implementation* of choreography.

---

## Senior vs junior — the tells

| Junior | Senior |
| --- | --- |
| Everything fades in at once (or nothing does) | Elements arrive in a **deliberate order** (hierarchy: nav → hero → content → actions) |
| Animations can't be interrupted; tapping mid-animation does nothing or snaps | Motion is **interruptible** — a new gesture/state takes over from the *current* value with its velocity |
| Loading spinner → hard cut to content | Loading state **transitions into** content (skeleton cross-fades, layout settles) |
| Same generic 300ms fade everywhere | Motion has **hierarchy** — primary content gets presence, chrome is quick/quiet |
| Decorative motion everywhere | **Restraint**: motion has a job (guide attention, show relationships, confirm action) |
| Elements pop in from random directions | **Spatial logic** — things move from where they come from / go to where they belong |

Internalize these six: **order, interruptibility, state continuity, hierarchy, restraint, spatial logic.**

---

## 1. Entrance choreography (staggered reveal)

A screen shouldn't arrive all at once. Stagger by hierarchy, with a **capped, small** step so it feels alive, not slow (total entrance budget ~300–500ms).

```tsx
import Animated, { FadeInDown } from 'react-native-reanimated';

const items = [Header, Hero, StatsRow, ActionButtons]; // visual order
{items.map((El, i) => (
  <Animated.View key={i} entering={FadeInDown.delay(80 + i * 60).springify().damping(16)}>
    <El />
  </Animated.View>
))}
```
Or drive everything from **one** `progress` shared value (no per-component layout-animation overhead) and offset each element's interpolation window — gives you precise control over overlap:

```tsx
const progress = useSharedValue(0);
useEffect(() => { progress.value = withTiming(1, { duration: 600, easing: Easing.out(Easing.cubic) }); }, []);

const reveal = (start: number, end: number) =>
  useAnimatedStyle(() => {
    const t = interpolate(progress.value, [start, end], [0, 1], Extrapolation.CLAMP);
    return { opacity: t, transform: [{ translateY: (1 - t) * 16 }] };
  });
// header = reveal(0, 0.4); hero = reveal(0.15, 0.6); content = reveal(0.3, 0.8); actions = reveal(0.5, 1)
```
Overlapping windows (each starts before the previous ends) is what makes a stagger feel connected rather than mechanical.

---

## 2. Loading → content (state continuity)

Never hard-cut a spinner to content. Two solid patterns:

- **Skeleton → content cross-fade.** Render skeletons (see `patterns-recipes.md` §7) in the *same layout* as the real content; when data lands, cross-fade skeleton out / content in over ~250ms. Matching layout means nothing reflows.
- **Container settle.** Put `layout={LinearTransition}` on the container so when content replaces the loading state and sizes change, the box animates to its new size instead of jumping. → `layout-animations.md`.

```tsx
{loading
  ? <Animated.View exiting={FadeOut.duration(200)}><Skeleton /></Animated.View>
  : <Animated.View entering={FadeIn.duration(250)}><Content /></Animated.View>}
```
Keep the exiting child conditionally rendered with the parent mounted (exiting gotcha).

---

## 3. Empty / error / success states

Treat these as first-class, not afterthoughts. Animate the transition *between* states so the screen feels responsive even when there's no data:
- Empty state illustration: gentle `entering={FadeInUp}` + a one-shot float (`withRepeat(withSequence(...), 2)`), not an infinite loop that distracts.
- Error → retry: shake the affected element with `withSequence` of small `translateX`, fire a warning haptic.
- Optimistic success: animate the success state immediately on tap (checkmark, item insert via `FadeInDown`), reconcile if the request fails (animate back out).

```tsx
// error shake
const shake = () => (x.value = withSequence(
  withTiming(-8, { duration: 40 }), withTiming(8, { duration: 40 }),
  withTiming(-5, { duration: 40 }), withTiming(0, { duration: 40 }),
));
```

---

## 4. Scroll-driven reveals (content earns attention as you scroll)

Reveal sections as they enter the viewport — subtle, once each. Cheapest: `FlatList`'s `onViewableItemsChanged` to flip a per-item `shown` flag that triggers an `entering` animation, or drive opacity/translateY from `useScrollOffset` for parallax sections. Don't re-animate on every scroll pass; reveal **once**.

For coordinated header/content (collapsing header, title hand-off into the nav bar), see `patterns-recipes.md` §4 and `react-navigation-transitions.md`.

---

## 5. Cross-screen continuity (hero / shared element)

The screen transition itself is choreography: a tapped card should *become* the detail screen, not be replaced by it. Use shared-element tags or a measured hero overlay. → `cards.md` §3, `shared-element-transitions.md`, `react-navigation-transitions.md`, `expo-router-transitions.md`.

---

## 6. Interruptibility (the hardest senior detail)

Premium motion never feels "locked." Any animation must yield to a new interaction **from its current position and velocity** — no snap-to-end, no ignored taps.

- **Animate from the live value.** `withSpring`/`withTiming` already start from the shared value's current value, so re-driving mid-flight is continuous — *as long as you don't reset it first*.
- **Feed velocity on hand-off.** Gesture → release: pass `e.velocityX/Y` into `withSpring`/`withDecay` so there's no stutter frame (see `gestures.md`).
- **Cancel before re-sourcing.** If a *different* driver takes over (e.g. a tap interrupts a scroll-driven value), `cancelAnimation(sv)` first so they don't fight.
- **Gesture mid-animation.** In `Gesture.Pan().onStart`, capture the current value (`start.value = sv.value`) even if it's mid-animation — the drag picks up exactly where the motion was.

```ts
const pan = Gesture.Pan()
  .onStart(() => { cancelAnimation(ty); start.value = ty.value; }) // take over a running spring
  .onUpdate((e) => { ty.value = start.value + e.translationY; })
  .onEnd((e) => { ty.value = withSpring(snap, { velocity: e.velocityY }); });
```

---

## 7. Reduce Motion (non-negotiable for senior work)

Honor the OS accessibility setting everywhere: degrade transforms/springs to instant or a quick opacity fade. Don't ship motion that can trigger vestibular discomfort with no escape hatch.

```tsx
import { ReduceMotion } from 'react-native-reanimated';
// Layout animations: entering={FadeInDown.reduceMotion(ReduceMotion.System)}
// Imperative: gate on AccessibilityInfo.isReduceMotionEnabled() and skip large transforms.
```
Pattern: a `useReducedMotion()` hook (Reanimated exposes one) → when true, swap big translate/scale/3D for a plain fade or instant set.

---

## Putting it together — a screen entrance, end to end

1. Screen transition brings the frame in (navigator). Hero element continues from the previous screen if there's a shared element.
2. On focus, run the staggered reveal (§1) — nav/header first, primary content next, actions last, windows overlapping.
3. Data still loading? Show skeletons in the final layout; cross-fade to content when it lands (§2), container settles via `LinearTransition`.
4. Every interactive element is press-responsive (`buttons-and-microinteractions.md`) and interruptible (§6).
5. All of the above respects Reduce Motion (§7) and stays on the UI thread (`performance.md`).

---

## Checklist
- [ ] Elements arrive in **hierarchy order** with overlapping, capped stagger (entrance budget ≤500ms).
- [ ] Loading **transitions into** content (skeleton cross-fade / `LinearTransition` settle), never hard-cuts.
- [ ] Empty/error/success states are animated, purposeful, and not infinitely distracting.
- [ ] Scroll reveals fire **once**, subtly.
- [ ] Cross-screen elements feel continuous (shared element / measured hero).
- [ ] Motion is **interruptible**: re-drive from live value, feed velocity, cancel before re-sourcing.
- [ ] Reduce Motion honored screen-wide; everything stays on the UI thread.
