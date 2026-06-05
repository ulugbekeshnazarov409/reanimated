# Patterns & Recipes — production-ready building blocks

Copy-paste starting points for the animations apps actually ship. All use the modern API (shared values + `Gesture`). Adapt `withSpring` configs from `easing-and-springs.md`; for v4 swap `runOnJS`→`scheduleOnRN`, `useScrollViewOffset`→`useScrollOffset`.

---

## 1. Press scale + haptic (every button)

```tsx
import Animated, { useSharedValue, useAnimatedStyle, withSpring, withTiming } from 'react-native-reanimated';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import * as Haptics from 'expo-haptics';
import { runOnJS } from 'react-native-reanimated';

function Pressable({ onPress, children }) {
  const scale = useSharedValue(1);
  const tap = Gesture.Tap()
    .onBegin(() => {
      scale.value = withTiming(0.96, { duration: 90 });
      runOnJS(Haptics.selectionAsync)();
    })
    .onFinalize(() => { scale.value = withSpring(1, { damping: 18, stiffness: 300 }); })
    .onEnd(() => { runOnJS(onPress)(); });
  const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
  return <GestureDetector gesture={tap}><Animated.View style={style}>{children}</Animated.View></GestureDetector>;
}
```

---

## 2. Swipe-to-delete row

```tsx
const tx = useSharedValue(0);
const itemHeight = useSharedValue(72);
const THRESH = -120;

const pan = Gesture.Pan()
  .activeOffsetX([-10, 10])          // don't fight vertical list scroll
  .onUpdate((e) => { tx.value = Math.min(0, e.translationX); })
  .onEnd((e) => {
    if (tx.value < THRESH || e.velocityX < -800) {
      tx.value = withTiming(-500);
      itemHeight.value = withTiming(0, { duration: 200 }, (f) => {
        'worklet'; if (f) runOnJS(onDelete)(item.id);   // remove from data after collapse
      });
    } else {
      tx.value = withSpring(0);       // snap back
    }
  });

const rowStyle = useAnimatedStyle(() => ({ transform: [{ translateX: tx.value }], height: itemHeight.value }));
// red delete background behind the row, revealed as it slides
```
Add a `useAnimatedReaction` to fire a haptic when `tx.value` first crosses `THRESH`.

---

## 3. Drag-to-reorder list

Prefer **`react-native-draggable-flatlist`** (built on Reanimated + RNGH) over hand-rolling — it handles measurement, autoscroll, and reflow. Hand-built: track each item's translateY in shared values, use `Gesture.Pan` with a long-press activation, `measure` positions, and `withSpring` items into place; fire a haptic on pickup and on each slot crossing.

---

## 4. Parallax / collapsing header

```tsx
const aref = useAnimatedRef<Animated.ScrollView>();
const scroll = useScrollViewOffset(aref); // v4: useScrollOffset
const H = 240;

const headerStyle = useAnimatedStyle(() => ({
  transform: [
    { translateY: interpolate(scroll.value, [-H, 0, H], [-H / 2, 0, -H * 0.7], Extrapolation.CLAMP) },
    { scale: interpolate(scroll.value, [-H, 0], [1.6, 1], Extrapolation.CLAMP) }, // overscroll zoom
  ],
}));
const titleStyle = useAnimatedStyle(() => ({
  opacity: interpolate(scroll.value, [H * 0.4, H * 0.7], [0, 1], Extrapolation.CLAMP), // title fades into bar
}));

<Animated.ScrollView ref={aref} scrollEventThrottle={16}>
  <Animated.Image style={[{ height: H }, headerStyle]} source={cover} />
  {/* content */}
</Animated.ScrollView>
```

---

## 5. Animated tab indicator

```tsx
const indicator = useSharedValue(0);   // index
const TAB_W = width / tabs.length;
const onSelect = (i: number) => { indicator.value = withSpring(i, { damping: 18, stiffness: 220 }); setActive(i); };
const indicatorStyle = useAnimatedStyle(() => ({ transform: [{ translateX: indicator.value * TAB_W }] }));
// <Animated.View style={[{ width: TAB_W, height: 3 }, indicatorStyle]} />
```
For a scroll-synced pager, drive `indicator` from `scrollX / pageWidth` via `useAnimatedScrollHandler`.

---

## 6. Bottom sheet

**Use `@gorhom/bottom-sheet`** (Reanimated + RNGH, handles snap points, keyboard, backdrop, scroll). Hand-rolling a sheet correctly (pan + velocity snap + scroll coexistence) is a lot of edge cases. Minimal hand-built core:
```tsx
const ty = useSharedValue(SHEET_HEIGHT); // hidden
const open = () => (ty.value = withSpring(0, { damping: 20, stiffness: 200 }));
const close = () => (ty.value = withTiming(SHEET_HEIGHT, { duration: 200 }, (f) => { 'worklet'; if (f) runOnJS(setMounted)(false); }));
const pan = Gesture.Pan()
  .onUpdate((e) => { ty.value = Math.max(0, e.translationY); })
  .onEnd((e) => { (ty.value > SHEET_HEIGHT * 0.3 || e.velocityY > 800) ? close() : (ty.value = withSpring(0)); });
const sheetStyle = useAnimatedStyle(() => ({ transform: [{ translateY: ty.value }] }));
const backdropStyle = useAnimatedStyle(() => ({ opacity: interpolate(ty.value, [0, SHEET_HEIGHT], [0.5, 0]) }));
```

---

## 7. Skeleton shimmer (loading)

```tsx
const x = useSharedValue(-1);
useEffect(() => { x.value = withRepeat(withTiming(1, { duration: 1200, easing: Easing.inOut(Easing.ease) }), -1); return () => cancelAnimation(x); }, []);
const shimmer = useAnimatedStyle(() => ({ transform: [{ translateX: x.value * SKELETON_WIDTH }] }));
// an absolutely-positioned LinearGradient (expo-linear-gradient) sweeping across a gray block
```
v4 alternative: pure CSS `animationName` loop (see `css-animations-v4.md`).

---

## 8. Numeric roll (animated counter/balance)

```tsx
const AnimatedText = Animated.createAnimatedComponent(TextInput);
const value = useSharedValue(0);
useEffect(() => { value.value = withTiming(target, { duration: 600 }); }, [target]);
const props = useAnimatedProps(() => ({ text: `$${value.value.toFixed(2)}` } as any));
<AnimatedText editable={false} value={`$0.00`} animatedProps={props} style={{ fontVariant: ['tabular-nums'] }} />
```
Tabular figures so digit widths don't jitter.

---

## 9. FlatList item entrances

```tsx
<Animated.FlatList
  data={data}
  itemLayoutAnimation={LinearTransition}      // smooth reorder/removal
  renderItem={({ item, index }) => (
    <Animated.View entering={FadeInDown.delay(Math.min(index, 8) * 40).springify()} exiting={FadeOut}>
      <Row item={item} />
    </Animated.View>
  )}
/>
```
Cap the stagger (`Math.min(index, 8)`) so long lists don't wait seconds.

---

## 10. Accordion / expand-collapse

```tsx
const open = useSharedValue(0); // 0..1
const toggle = () => (open.value = withSpring(open.value ? 0 : 1, { damping: 18, stiffness: 200 }));
const bodyStyle = useAnimatedStyle(() => ({
  height: open.value * measuredHeight,           // measure content height once
  opacity: open.value,
}));
const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${open.value * 180}deg` }] }));
```
For unknown content height, render off-screen / `onLayout` to capture it, then animate. Or use `LinearTransition` on the container with conditional children.

---

## 11. Pull-to-refresh (custom feel)

Use the list's `refreshControl` for standard behavior; for a branded indicator, track overscroll via `useAnimatedScrollHandler` (`onScroll` negative offset), animate a custom indicator, fire a **medium haptic** when crossing the trigger threshold (via `useAnimatedReaction`), and `runOnJS(onRefresh)` on release past threshold.

---

## Recipe rules
- Feed gesture **velocity** into release springs/decay (continuity).
- Fire **haptics** at commit/threshold via `runOnJS`/`scheduleOnRN` + `useAnimatedReaction`.
- Remove list data **after** the collapse animation completes (in the callback), not before.
- Cap list stagger; cancel infinite loops on unmount.
- For sheets/reorder, prefer the battle-tested libraries (`@gorhom/bottom-sheet`, `react-native-draggable-flatlist`).
