# Inputs & Indicators — slider, carousel, dropdown, stepper, badge, progress

Controls and status elements that earn their polish through motion: a slider thumb that springs under the finger, a carousel where the centered card breathes, a badge that pops when the count changes, a progress bar that fills smoothly. All UI-thread; values cross to React only on discrete events, never per frame (`performance.md`). Honor Reduce Motion.

---

## 1. Slider

Thumb follows the drag (clamped to the track), the fill tracks the thumb, the thumb scales up while held, and a haptic ticks on each step. Push the committed value to React only on release (or on integer-step changes), not every frame.

```tsx
const TRACK = trackWidth;                 // measured
const x = useSharedValue(valueToX(initial));   // thumb offset 0..TRACK
const pressed = useSharedValue(0);

const pan = Gesture.Pan()
  .onBegin(() => { pressed.value = withTiming(1, { duration: 120 }); })
  .onChange((e) => { x.value = clamp(x.value + e.changeX, 0, TRACK); })
  .onFinalize(() => { pressed.value = withSpring(0); runOnJS(onChange)(xToValue(x.value)); });

const thumbStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: x.value }, { scale: interpolate(pressed.value, [0, 1], [1, 1.25]) }],
}));
const fillStyle = useAnimatedStyle(() => ({ width: x.value }));   // fill = thumb offset
```
- Stepped slider: snap `x` to the nearest step in `onFinalize` (`withSpring`), and fire a selection haptic when the step index changes (track it with `useAnimatedReaction`).
- Range slider: two thumbs sharing the track; clamp each against the other.

---

## 2. Carousel / pager (with depth + dots)

A paged horizontal list where the focused item is full-size and neighbors recede. Drive everything from one `scrollX` shared value.

```tsx
const scrollX = useSharedValue(0);
const onScroll = useAnimatedScrollHandler((e) => { scrollX.value = e.contentOffset.x; });

<Animated.FlatList
  data={data} horizontal pagingEnabled showsHorizontalScrollIndicator={false}
  onScroll={onScroll} scrollEventThrottle={16}
  renderItem={({ item, index }) => <Card item={item} index={index} scrollX={scrollX} />}
/>

// inside Card:
const style = useAnimatedStyle(() => {
  const input = [(index - 1) * W, index * W, (index + 1) * W];
  return {
    transform: [{ scale: interpolate(scrollX.value, input, [0.88, 1, 0.88], Extrapolation.CLAMP) }],
    opacity: interpolate(scrollX.value, input, [0.6, 1, 0.6], Extrapolation.CLAMP),
  };
});
```
- **Pagination dots:** the active dot widens / brightens, driven by `scrollX`:
  ```tsx
  const dotStyle = useAnimatedStyle(() => {
    const input = [(i - 1) * W, i * W, (i + 1) * W];
    return { width: interpolate(scrollX.value, input, [6, 18, 6], Extrapolation.CLAMP),
             opacity: interpolate(scrollX.value, input, [0.4, 1, 0.4], Extrapolation.CLAMP) };
  });
  ```
- **Auto-advance:** a timer that `scrollToIndex`es the next page; **cancel it on touch** (`onScrollBeginDrag`) so it never fights the user.
- For heavy carousels, `react-native-reanimated-carousel` handles loop/parallax/autoplay.

---

## 3. Dropdown / select (inline expand)

An inline select expands its option list with a height/opacity reveal and a chevron rotate; for a floating menu over content use `overlays-and-modals.md` §5. → accordion mechanics in `patterns-recipes.md` §10.

```ts
const open = useSharedValue(0);
const toggle = () => (open.value = withSpring(open.value ? 0 : 1, { damping: 18, stiffness: 220 }));
const listStyle = useAnimatedStyle(() => ({ height: open.value * listHeight, opacity: open.value }));
const chevron = useAnimatedStyle(() => ({ transform: [{ rotate: `${open.value * 180}deg` }] }));
// selected check: animate the row's checkmark (buttons-and-microinteractions.md §3)
```

---

## 4. Stepper (− value +)

Buttons press-scale (`buttons-and-microinteractions.md` §1); the number **rolls** on change (`patterns-recipes.md` §8). Direction-aware: increment slides the old digit up / new up from below, decrement reverses. Disable −/＋ at min/max with an opacity transition.

---

## 5. Badge & notification dot

A count badge should **pop** when it changes and zoom in/out when it appears/disappears — motion signals "something happened."

```tsx
const scale = useSharedValue(1);
useEffect(() => { scale.value = withSequence(
  withTiming(1.3, { duration: 120 }), withSpring(1, { damping: 8, stiffness: 260 })
); }, [count]);

{count > 0 && (
  <Animated.View entering={ZoomIn.springify()} exiting={ZoomOut.duration(150)}
    style={[styles.badge, useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }))]}>
    <Text style={styles.badgeText}>{count > 99 ? '99+' : count}</Text>
  </Animated.View>
)}
```
- **Live notification dot:** a subtle pulse ring (a sibling circle scaling 1→2 while fading), looped — but keep it gentle and **cancel on unmount**:
  ```ts
  ring.value = withRepeat(withTiming(1, { duration: 1400, easing: Easing.out(Easing.ease) }), -1);
  // scale: 1 + ring*1, opacity: 1 - ring
  ```

---

## 6. Progress bar (determinate + indeterminate)

```tsx
// determinate: fill from a 0..1 progress value
const p = useSharedValue(0);                          // set p.value = withTiming(ratio)
const fill = useAnimatedStyle(() => ({ transform: [{ scaleX: p.value }] }));
// anchor the scale to the left edge:
<Animated.View style={[styles.fill, { transformOrigin: 'left' }, fill]} />
```
Prefer `scaleX` over animating `width` (transform is composited, width triggers layout). Anchor left via `transformOrigin: 'left'` (RN 0.74+/v4) or a translate trick on older RN.

```tsx
// indeterminate: a bar sweeping across, looped
const t = useSharedValue(-1);
useEffect(() => { t.value = withRepeat(withTiming(1, { duration: 1100, easing: Easing.inOut(Easing.ease) }), -1); return () => cancelAnimation(t); }, []);
const sweep = useAnimatedStyle(() => ({ transform: [{ translateX: t.value * BAR_W }] }));
```

---

## 7. Progress ring (circular)

Animate an SVG circle's `strokeDashoffset` via `useAnimatedProps` (same draw technique as the checkmark, `buttons-and-microinteractions.md` §3).

```tsx
const C = 2 * Math.PI * radius;            // circumference
const p = useSharedValue(0);               // 0..1
const ringProps = useAnimatedProps(() => ({ strokeDashoffset: C * (1 - p.value) }));
<AnimatedCircle r={radius} cx={cx} cy={cy} stroke="#4f46e5" strokeWidth={6} fill="none"
  strokeDasharray={C} animatedProps={ringProps} strokeLinecap="round"
  transform={`rotate(-90 ${cx} ${cy})`} /> {/* start at 12 o'clock */}
```

---

## Checklist
- [ ] Slider: thumb clamped to track, scales while held, commits to React on **release/step** (not per frame), step haptic via `useAnimatedReaction`.
- [ ] Carousel: one `scrollX` drives item scale/opacity **and** dots; auto-advance cancels on touch.
- [ ] Dropdown: inline = height/opacity + chevron; floating = `overlays-and-modals.md` §5.
- [ ] Badge pops on change (`withSequence`) and zooms on appear/disappear; dot pulse cancelled on unmount.
- [ ] Progress: `scaleX` + `transformOrigin: 'left'` over `width`; indeterminate loop cancelled on unmount.
- [ ] Ring via `strokeDashoffset` + `useAnimatedProps`, rotated −90° to start at top.
- [ ] Reduce Motion honored; per-frame work stays on the UI thread.
