# Buttons & Micro-interactions

The small stuff that separates a senior build: every interactive element acknowledges touch, animates between states (idle → loading → success), and gives physical feedback. None of it should block the JS thread; all of it should honor Reduce Motion. Pair these with haptics (`expo-haptics` via `runOnJS`/`scheduleOnRN`) at the moment of commit.

---

## 1. Press feedback (the baseline every button needs)

Scale + optional opacity on press-in, spring back on release. → recipe 1 in `patterns-recipes.md` for the full `Gesture.Tap` version.

```tsx
const pressed = useSharedValue(0);
const style = useAnimatedStyle(() => ({
  transform: [{ scale: interpolate(pressed.value, [0, 1], [1, 0.95]) }],
  opacity: interpolate(pressed.value, [0, 1], [1, 0.9]),
}));
// onBegin → pressed = withTiming(1,{duration:90}); onFinalize → pressed = withSpring(0)
```
Snappy spring back (`damping: 18, stiffness: 300`). Selection haptic on `onBegin`, not `onEnd` — it should feel like the press, not the result.

---

## 2. Loading button (idle → spinner → done)

A submit button that morphs in place instead of swapping to a separate spinner. Cross-fade the label out, a spinner in; optionally shrink the width to a circle.

```tsx
const progress = useSharedValue(0); // 0 idle, 1 loading
const onSubmit = async () => {
  progress.value = withTiming(1, { duration: 200 });
  try { await doWork(); } finally { progress.value = withTiming(0, { duration: 200 }); }
};
const labelStyle   = useAnimatedStyle(() => ({ opacity: 1 - progress.value }));
const spinnerStyle = useAnimatedStyle(() => ({ opacity: progress.value }));
const widthStyle   = useAnimatedStyle(() => ({ width: interpolate(progress.value, [0, 1], [FULL_W, 56]) }));
```
Animating `width` is a layout prop (cost) — acceptable for a one-shot button morph, not per-frame scroll. For the spinner itself, rotate a shared value in a `withRepeat` loop, or just use `<ActivityIndicator>`. Disable the button while `progress > 0` to block double-submits.

---

## 3. Success checkmark (draw-on)

Confirm an action by drawing an SVG checkmark stroke, then a gentle scale pop. Drive `strokeDashoffset` with `useAnimatedProps`.

```tsx
import Svg, { Path } from 'react-native-svg';
const AnimatedPath = Animated.createAnimatedComponent(Path);
const LEN = 100;                       // path length (measure or approximate)
const draw = useSharedValue(LEN);      // start fully hidden
const pop = useSharedValue(0.6);

const reveal = () => {
  draw.value = withTiming(0, { duration: 350, easing: Easing.out(Easing.cubic) });
  pop.value  = withSpring(1, { damping: 10, stiffness: 200 });
};
const pathProps = useAnimatedProps(() => ({ strokeDashoffset: draw.value }));
const popStyle  = useAnimatedStyle(() => ({ transform: [{ scale: pop.value }] }));

<Animated.View style={popStyle}>
  <Svg viewBox="0 0 24 24">
    <AnimatedPath d="M4 12 l5 5 L20 6" stroke="#fff" strokeWidth={3} fill="none"
      strokeDasharray={LEN} animatedProps={pathProps} strokeLinecap="round" strokeLinejoin="round" />
  </Svg>
</Animated.View>
```
Success haptic (`Haptics.notificationAsync(Success)`) fires when `reveal()` is called.

---

## 4. Toggle / switch

Knob translates across the track with a no-overshoot spring; track color interpolates. Toggles should **not** bounce — they're binary.

```tsx
const on = useSharedValue(props.value ? 1 : 0);
useEffect(() => { on.value = withSpring(props.value ? 1 : 0, { damping: 26, stiffness: 240 }); }, [props.value]);

const knobStyle = useAnimatedStyle(() => ({ transform: [{ translateX: on.value * TRAVEL }] }));
const trackStyle = useAnimatedStyle(() => ({
  backgroundColor: interpolateColor(on.value, [0, 1], ['#d1d5db', '#34c759']),
}));
```
`interpolateColor` requires importing from `react-native-reanimated`. Fire a light selection haptic on change.

---

## 5. Checkbox / radio

Box fills (scale a colored inner square from 0→1) while the checkmark draws (same SVG technique as §3). Radio: inner dot scales `withSpring` from 0; outer ring color interpolates.

```tsx
const checked = useSharedValue(0);
const fillStyle = useAnimatedStyle(() => ({ transform: [{ scale: checked.value }], opacity: checked.value }));
const toggle = () => (checked.value = withSpring(checked.value ? 0 : 1, { damping: 14, stiffness: 220 }));
```

---

## 6. Like / heart burst

The dopamine moment: scale pop with overshoot + color flip, optionally a ring/particle burst.

```tsx
const scale = useSharedValue(1);
const like = () => {
  scale.value = withSequence(
    withTiming(0.8, { duration: 80 }),
    withSpring(1.2, { damping: 6, stiffness: 250 }),
    withSpring(1,   { damping: 12, stiffness: 200 }),
  );
  runOnJS(Haptics.impactAsync)(Haptics.ImpactFeedbackStyle.Light);
};
const style = useAnimatedStyle(() => ({ transform: [{ scale: scale.value }] }));
// Ring burst: a sibling circle that scales 0→1.6 while opacity 1→0 over ~400ms.
```
`withSequence` chains: shrink, overshoot, settle — the classic "pop".

---

## 7. Segmented control / tab indicator

A pill/underline slides under the active segment. → recipe 5 in `patterns-recipes.md` (drive a `translateX` index with a snappy spring; for an equal-width set, also interpolate the indicator `width` if segment widths differ).

---

## 8. FAB & expanding speed-dial

FAB press: scale + slight rotate. Expand: child actions stagger out with `entering={FadeInDown.delay(i*40)}` (or animate each `translateY`/opacity from a shared `open` 0..1), and the FAB icon morphs (＋ rotates 45° into ✕).

```tsx
const open = useSharedValue(0);
const fabIcon = useAnimatedStyle(() => ({ transform: [{ rotate: `${open.value * 45}deg` }] }));
const toggle = () => (open.value = withSpring(open.value ? 0 : 1, { damping: 16, stiffness: 200 }));
```

---

## 9. Ripple (Android-style touch feedback)

A circle grows from the touch point and fades. Capture `e.x/e.y` in `Gesture.Tap().onBegin`, animate a shared `r` (radius) and `o` (opacity).

```tsx
const cx = useSharedValue(0), cy = useSharedValue(0), r = useSharedValue(0), o = useSharedValue(0);
const tap = Gesture.Tap().onBegin((e) => {
  cx.value = e.x; cy.value = e.y; r.value = 0; o.value = 0.25;
  r.value = withTiming(MAX_R, { duration: 350 });
  o.value = withTiming(0, { duration: 400 });
});
```
Clip the parent (`overflow: 'hidden'`, `borderRadius`) so the ripple stays inside the button.

---

## 10. Icon morphs

Play↔pause, hamburger↔close, chevron rotate: animate `rotate`/cross-fade two icons, or interpolate an SVG path's `d`-driven props. Cheapest reliable version is a cross-fade + rotate of two icons driven by one 0..1 value.

---

## Checklist
- [ ] Every interactive element acknowledges touch (scale/opacity), ≤100ms in.
- [ ] State morphs (loading/success) animate **in place**, not by swapping components abruptly.
- [ ] Toggles/checkboxes use **no-overshoot** springs; likes/celebrations may overshoot.
- [ ] Color changes via `interpolateColor`; SVG draw via `strokeDashoffset` + `useAnimatedProps`.
- [ ] Haptics at the moment of commit/threshold, on the right lifecycle callback.
- [ ] Disable buttons during async work; cancel any `withRepeat` spinner loop on unmount.
- [ ] Reduce Motion: fall back to instant state change / simple fade.
