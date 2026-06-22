# Cards — press, lift, swipe, expand, flip

Cards are the workhorse of mobile UIs, and they're where junior vs senior motion shows most. A junior fades a card in; a senior makes it feel **physical**: it lifts under your finger, throws with momentum, and expands into its detail screen as one continuous object. Everything here runs on the UI thread (transforms + opacity); see `performance.md` before animating `shadow`/`elevation`.

> Shadow caveat: animating `shadowOpacity`/`shadowRadius` (iOS) repaints each frame and `elevation` (Android) barely animates. For a "lift", prefer **scale + a second pre-rendered shadow layer you fade in** (or animate `shadowOpacity` only on iOS, kept subtle). Don't animate elevation per frame.

---

## 1. Press & lift (the tactile card)

A card should depress slightly and raise its shadow on touch — confirms the tap before navigation.

```tsx
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming, interpolate } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';

function PressableCard({ onPress, children }) {
  const pressed = useSharedValue(0); // 0..1

  const tap = Gesture.Tap()
    .maxDuration(10000)
    .onBegin(() => { pressed.value = withTiming(1, { duration: 120 }); })
    .onFinalize(() => { pressed.value = withSpring(0, { damping: 18, stiffness: 280 }); })
    .onEnd(() => { runOnJS(onPress)(); });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.97]) }],
  }));
  // iOS-only lift on a wrapper that owns the shadow:
  const shadowStyle = useAnimatedStyle(() => ({
    shadowOpacity: interpolate(pressed.value, [0, 1], [0.12, 0.22]),
    shadowRadius:  interpolate(pressed.value, [0, 1], [8, 16]),
  }));

  return (
    <GestureDetector gesture={tap}>
      <Animated.View style={[styles.shadowWrap, shadowStyle]}>
        <Animated.View style={[styles.card, cardStyle]}>{children}</Animated.View>
      </Animated.View>
    </GestureDetector>
  );
}
```
Keep scale subtle (0.96–0.98). One `pressed` value drives both scale and shadow — one source of truth.

---

## 2. Swipeable card stack (Tinder-style)

The signature "throw" interaction: drag, rotate toward the throw direction, reveal like/nope labels by drag distance, and fling off with the gesture's own velocity on commit.

```tsx
const { width } = Dimensions.get('window');
const SWIPE = width * 0.3;            // commit threshold
const tx = useSharedValue(0);
const ty = useSharedValue(0);

const pan = Gesture.Pan()
  .onUpdate((e) => { tx.value = e.translationX; ty.value = e.translationY; })
  .onEnd((e) => {
    const dir = tx.value > SWIPE || e.velocityX > 800 ? 1
              : tx.value < -SWIPE || e.velocityX < -800 ? -1 : 0;
    if (dir !== 0) {
      tx.value = withSpring(dir * width * 1.5, { velocity: e.velocityX, damping: 16 },
        (f) => { 'worklet'; if (f) runOnJS(onSwiped)(dir); }); // pop card after it leaves
      ty.value = withSpring(ty.value + 40, { velocity: e.velocityY });
    } else {
      tx.value = withSpring(0, { velocity: e.velocityX }); // snap back
      ty.value = withSpring(0, { velocity: e.velocityY });
    }
  });

const cardStyle = useAnimatedStyle(() => ({
  transform: [
    { translateX: tx.value },
    { translateY: ty.value },
    { rotate: `${interpolate(tx.value, [-width, 0, width], [-12, 0, 12], Extrapolation.CLAMP)}deg` },
  ],
}));
const likeStyle = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [0, SWIPE], [0, 1], Extrapolation.CLAMP) }));
const nopeStyle = useAnimatedStyle(() => ({ opacity: interpolate(tx.value, [-SWIPE, 0], [1, 0], Extrapolation.CLAMP) }));
```
- The **card behind** should scale up / fade in as the top card leaves: drive it from `Math.abs(tx.value)`.
- Fire a haptic when crossing `SWIPE` (via `useAnimatedReaction` on the sign of `tx.value - SWIPE`).
- Programmatic buttons (the ❤️ / ✕ row) animate the same `tx` to `±width*1.5` so they share the exit.

---

## 3. Expand card → detail (hero / shared element)

The premium "card grows into the full screen" transition. Two correct approaches:

- **Shared element transitions** (tag-based): give the card and the detail's hero the same `sharedTransitionTag`. → `shared-element-transitions.md` (note its v3/v4 status caveats).
- **Navigation-driven hero** with React Navigation / Expo Router custom transitions, or `measure()` the card's on-screen rect, then animate an absolutely-positioned overlay from that rect to fullscreen. → `react-navigation-transitions.md`, `animated-styles.md` (`measure`).

```ts
// measure-based hero (works everywhere, more manual):
const aref = useAnimatedRef();
const open = () => {
  runOnUI(() => {
    'worklet';
    const m = measure(aref);                 // {pageX, pageY, width, height}
    if (m) { /* set overlay shared values from m, then animate to fullscreen rect */ }
  })();
};
```
Keep the card's content layout identical between states so nothing jumps; animate the container rect + cross-fade any differing content.

---

## 4. Card flip (3D)

Reveal a back face (e.g. payment card → CVC). Use `perspective` + `rotateY`, two stacked faces with `backfaceVisibility: 'hidden'`.

```tsx
const spin = useSharedValue(0); // degrees
const flip = () => (spin.value = withSpring(spin.value < 90 ? 180 : 0, { damping: 14, stiffness: 120 }));

const frontStyle = useAnimatedStyle(() => ({
  transform: [{ perspective: 1000 }, { rotateY: `${spin.value}deg` }],
  backfaceVisibility: 'hidden',
}));
const backStyle = useAnimatedStyle(() => ({
  transform: [{ perspective: 1000 }, { rotateY: `${spin.value + 180}deg` }],
  backfaceVisibility: 'hidden',
}));
// both faces absolutely positioned in the same box; back is pre-rotated 180°
```
`perspective` must come **before** `rotateY` in the transform array, or the 3D depth is lost.

---

## 5. Parallax tilt (depth on press / drag)

Subtle 3D tilt that follows the finger — great for feature/hero cards. Keep angles small (≤8°).

```tsx
const rx = useSharedValue(0), ry = useSharedValue(0);
const pan = Gesture.Pan()
  .onUpdate((e) => {
    ry.value = interpolate(e.x, [0, CARD_W], [8, -8], Extrapolation.CLAMP);  // horizontal → rotateY
    rx.value = interpolate(e.y, [0, CARD_H], [-8, 8], Extrapolation.CLAMP);  // vertical → rotateX
  })
  .onFinalize(() => { rx.value = withSpring(0); ry.value = withSpring(0); });

const style = useAnimatedStyle(() => ({
  transform: [{ perspective: 800 }, { rotateX: `${rx.value}deg` }, { rotateY: `${ry.value}deg` }],
}));
```
Layer inner elements at different `translateZ`/scale to sell the depth.

---

## 6. Card grid / list entrances

Stagger cards in, capped so long grids don't crawl. → `layout-animations.md`, recipe 9 in `patterns-recipes.md`.

```tsx
<Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 50).springify().damping(16)}>
  <Card item={item} />
</Animated.View>
```
For a grid, stagger by visual row (`Math.floor(index / columns)`) so a whole row arrives together — reads as more intentional than per-cell.

---

## Checklist
- [ ] Press = subtle scale (0.96–0.98) + (iOS) shadow lift from **one** `pressed` value.
- [ ] Don't animate Android `elevation` per frame; use scale + a faded shadow layer.
- [ ] Swipe stack: rotate from `translateX`, reveal labels by distance, **fling with gesture velocity**, pop card in the spring callback.
- [ ] Expand-to-detail via shared-element tag or measured hero; layouts match so nothing jumps.
- [ ] Flip/tilt: `perspective` first in the transform array; `backfaceVisibility: 'hidden'` on faces.
- [ ] Grid entrances staggered **by row** and capped.
- [ ] Reduce Motion honored (cross-fade instead of 3D/throw).
