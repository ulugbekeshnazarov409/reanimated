# Scroll & Reactions

How to drive animations from scrolling, and how to run side effects when a shared value crosses a threshold.

---

## useScrollOffset (v4) / useScrollViewOffset (v2/v3)

The simplest way to track a scroll position as a shared value:
```tsx
import Animated, { useAnimatedRef, useScrollOffset /* v2/3: useScrollViewOffset */, useAnimatedStyle, interpolate, Extrapolation } from 'react-native-reanimated';

const aref = useAnimatedRef<Animated.ScrollView>();
const scroll = useScrollOffset(aref); // shared value of vertical offset

const headerStyle = useAnimatedStyle(() => ({
  opacity: interpolate(scroll.value, [0, 100], [1, 0], Extrapolation.CLAMP),
}));

return (
  <>
    <Animated.View style={[styles.header, headerStyle]} />
    <Animated.ScrollView ref={aref} scrollEventThrottle={16}>{/* content */}</Animated.ScrollView>
  </>
);
```
- v4 renamed `useScrollViewOffset` → `useScrollOffset` (old name deprecated). Use the right one for the version.

---

## useAnimatedScrollHandler (full control)

When you need the raw scroll event (x & y, velocity, begin/end, momentum):
```tsx
import Animated, { useSharedValue, useAnimatedScrollHandler, useAnimatedStyle } from 'react-native-reanimated';

const scrollX = useSharedValue(0);
const scrollHandler = useAnimatedScrollHandler({
  onScroll: (e) => { scrollX.value = e.contentOffset.x; },
  onBeginDrag: (e) => {},
  onEndDrag: (e) => {},
  onMomentumEnd: (e) => {},
});

return (
  <Animated.ScrollView
    horizontal pagingEnabled
    onScroll={scrollHandler}
    scrollEventThrottle={16}   // 16 = ~60fps event cadence
  >{/* pages */}</Animated.ScrollView>
);
```
- Shorthand: pass a single worklet → treated as `onScroll`.
- Use for carousels/pagers (`scrollX`), parallax, sticky headers, scroll-linked anything.
- Works on `Animated.ScrollView` and `Animated.FlatList`. Set `scrollEventThrottle={16}`.

---

## useAnimatedReaction (side effects on value change)

Run a worklet whenever a derived value changes — the clean way to trigger effects (haptics, state, callbacks) from a shared value crossing a threshold, without polluting `useAnimatedStyle`.

```ts
import { useAnimatedReaction, runOnJS } from 'react-native-reanimated';

useAnimatedReaction(
  () => scrollX.value > threshold,        // prepare: compute the thing to watch
  (isPast, wasPast) => {                  // react: runs when prepare's result changes
    if (isPast !== wasPast) {
      runOnJS(onCrossThreshold)(isPast);  // hop to JS thread for state/haptics
    }
  },
  [threshold]                              // deps
);
```
- First fn (prepare) returns a value; second fn (react) runs when it changes, with `(current, previous)`.
- Keep `useAnimatedStyle` for visuals only; put **side effects** here.
- Common uses: snap detection, "scrolled past header" boolean → setState, haptic when a drag crosses a delete threshold, syncing two shared values.

---

## Syncing a shared value to React state (when you must)

Sometimes UI outside the animation needs the value as React state. Don't poll `.value`; react to it:
```ts
const [page, setPage] = useState(0);
useAnimatedReaction(
  () => Math.round(scrollX.value / width),
  (p, prev) => { if (p !== prev) runOnJS(setPage)(p); }
);
```
Minimize JS-thread crossings — only when state truly drives non-animated UI.

---

## Checklist
- [ ] Right scroll hook for the version (`useScrollOffset` v4 / `useScrollViewOffset` v2-3).
- [ ] `scrollEventThrottle={16}` on animated scrollables.
- [ ] Side effects in `useAnimatedReaction`, not in `useAnimatedStyle`.
- [ ] Threshold crossings hop to JS via `runOnJS`/`scheduleOnRN`, guarded by change detection.
