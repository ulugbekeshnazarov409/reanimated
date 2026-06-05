# Layout Animations

Animate components **entering**, **exiting**, and **moving** (layout changes) declaratively — no shared values needed. Apply built-in presets to `Animated.*` components.

```tsx
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';

{visible && (
  <Animated.View entering={FadeIn} exiting={FadeOut} layout={LinearTransition}>
    <Text>Hello</Text>
  </Animated.View>
)}
```
- `entering` — when the component mounts.
- `exiting` — when it unmounts (Reanimated holds it in the tree to animate out).
- `layout` — when its position/size changes (sibling added/removed, reflow).

---

## Entering / exiting presets

Families (each has directional variants): **Fade**, **Slide**, **Zoom**, **Bounce**, **Flip**, **Stretch**, **Pinwheel**, **Roll**, **Lightspeed**.

```ts
import {
  FadeIn, FadeInDown, FadeInUp, FadeOut, FadeOutDown,
  SlideInLeft, SlideInRight, SlideInDown, SlideOutDown,
  ZoomIn, ZoomOut, ZoomInRotate,
  BounceIn, BounceOut,
} from 'react-native-reanimated';
```

### Modifiers (chainable)
```ts
entering={FadeInDown
  .duration(300)
  .delay(index * 40)        // stagger lists
  .springify().damping(15)  // make it a spring
  .withInitialValues({ opacity: 0, transform: [{ translateY: 20 }] })
  .withCallback((finished) => { 'worklet'; })
}
```
`.duration()`, `.delay()`, `.springify()`, `.damping()`, `.stiffness()`, `.mass()`, `.easing()`, `.randomDelay()`, `.withInitialValues()`, `.withCallback()`, `.reduceMotion(ReduceMotion.System)`.

---

## Layout transitions

Apply to a component whose position/size changes so it animates smoothly instead of jumping:
```ts
import { LinearTransition, FadingTransition, SequencedTransition, JumpingTransition } from 'react-native-reanimated';
<Animated.View layout={LinearTransition.springify()} />
```
- `LinearTransition` (was `Layout` in older versions) — the common choice; interpolates position/size.
- `FadingTransition`, `SequencedTransition`, `JumpingTransition` — alternate styles.
- v4 removed `combineTransition`.

---

## Lists (FlatList item animations)

- Item **enter/exit/reorder**: give items `entering`/`exiting`/`layout`. For reordering, use `Animated.FlatList` with `itemLayoutAnimation={LinearTransition}`:
  ```tsx
  <Animated.FlatList data={data} itemLayoutAnimation={LinearTransition}
    renderItem={({ item, index }) => (
      <Animated.View entering={FadeInDown.delay(index * 30)} exiting={FadeOut}>…</Animated.View>
    )} />
  ```
- Stagger with `.delay(index * n)` but cap it (don't stagger 100 rows for 4s).
- Keep stable `keyExtractor` — layout animations rely on identity.

---

## Keyframe (custom multi-step)

For bespoke entrances/exits:
```ts
import { Keyframe } from 'react-native-reanimated';

const enter = new Keyframe({
  0:   { opacity: 0, transform: [{ translateY: 40 }, { scale: 0.9 }] },
  60:  { opacity: 1, transform: [{ translateY: -4 }, { scale: 1.02 }] },
  100: { opacity: 1, transform: [{ translateY: 0 }, { scale: 1 }] },
}).duration(400);

<Animated.View entering={enter} />
```
Percentages are keyframe stops; each lists the style at that point.

---

## Gotchas

- **Exiting needs the parent to stay mounted** — conditional render the child, not the whole tree; Reanimated keeps the exiting node briefly.
- **Android + some nested layouts**: layout animations can be finicky inside certain containers; test on device. If a parent clips, exiting animations may be cut.
- **Don't combine** a layout animation with a conflicting `useAnimatedStyle` transform on the same property.
- **Reduce Motion**: presets accept `.reduceMotion(...)`; honor the OS setting.
- Navigation transitions are separate (React Navigation / Expo Router) — layout animations are for in-screen mount/reflow.

## Checklist
- [ ] `entering`/`exiting`/`layout` on `Animated.*` components.
- [ ] Lists: `itemLayoutAnimation` + staggered (capped) entrances + stable keys.
- [ ] Custom motion via `Keyframe`; presets tuned with modifiers (`.springify()`, `.delay()`).
- [ ] Exiting child is conditionally rendered with parent kept mounted.
- [ ] Reduce Motion honored; tested on Android device.
