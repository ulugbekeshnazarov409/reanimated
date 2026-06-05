# Shared Element Transitions

Animate an element so it appears to **persist and morph** between two screens — e.g. a list thumbnail that grows into the detail header. Reanimated provides a tag-based API.

> Status: shared element transitions are **experimental / evolving** across Reanimated 3 → 4. Verify behavior on your version and on device; for production-critical flows, a mature library or a hand-built hero (measure + shared values) is sometimes more reliable. Check the docs for your installed version.

---

## Tag-based API

Give the same `sharedTransitionTag` to the element on both the source and destination screens. When navigating, Reanimated interpolates position/size/style between them.

```tsx
// Screen A (list)
<Animated.Image
  source={item.image}
  sharedTransitionTag={`photo-${item.id}`}
  style={styles.thumb}
/>

// Screen B (detail) — same tag
<Animated.Image
  source={item.image}
  sharedTransitionTag={`photo-${item.id}`}
  style={styles.hero}
/>
```
- The tag must be **unique per shared element** and **identical** on both screens.
- Works with React Navigation native-stack (the transition fires during the stack push/pop).

### Custom transition
Provide a `SharedTransition` to control how it interpolates (progress-based worklet over width/height/x/y/etc.):
```ts
import { SharedTransition, withSpring } from 'react-native-reanimated';
const transition = SharedTransition.custom((values) => {
  'worklet';
  return {
    width: withSpring(values.targetWidth),
    height: withSpring(values.targetHeight),
    originX: withSpring(values.targetOriginX),
    originY: withSpring(values.targetOriginY),
  };
});
<Animated.View sharedTransitionTag="card" sharedTransitionStyle={transition} />
```
(API surface varies by version — confirm names against your installed docs.)

---

## When to prefer alternatives

- **`@gorhom/...` / library heroes** or **React Navigation's** built-in shared element solutions may be steadier for complex cases.
- **Hand-built hero** (most control, any version): `measure()` the source on the UI thread, store its rect in shared values, render an absolutely-positioned overlay, animate it to the destination rect with `withSpring`, then swap to the real element. More work, but fully predictable. See `animated-styles.md` (`measure`) + `patterns-recipes.md`.

---

## Gotchas
- Tags must match exactly and be unique; duplicate/stale tags break the morph.
- Native-stack navigator is required for the navigation-driven version.
- Test push **and** pop, and interruptions (fast back). Behavior differs iOS/Android.
- Keep the two elements visually similar (same content/aspect) so the morph reads cleanly.

## Checklist
- [ ] Same unique `sharedTransitionTag` on source + destination.
- [ ] Native-stack navigation in use.
- [ ] Verified on your Reanimated version + on device (push, pop, interrupt).
- [ ] Fallback to a measured hero if the API is unstable for the case.
