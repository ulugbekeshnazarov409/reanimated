# Overlays & Modals — modal, dialog, action sheet, drawer, menu, tooltip, toast

Everything that appears **over** the screen shares one DNA: it mounts, animates in with a backdrop, can be dismissed (button, tap-outside, swipe), and animates out **before** unmounting. Get that lifecycle right once and every overlay feels native. All transforms/opacity run on the UI thread; honor Reduce Motion (cross-fade instead of large slides).

> For a full-featured bottom sheet, prefer **`@gorhom/bottom-sheet`** (snap points, keyboard, scroll coexistence) — see `patterns-recipes.md` §6. The hand-built patterns here are for the rest (modals, drawers, menus, toasts) and for understanding the mechanics.

---

## The overlay DNA (reusable controller)

The one trap: if you unmount on close, the exit never plays. Keep it mounted, animate out, **then** unmount in the animation callback.

```ts
import { useSharedValue, withTiming, withSpring, runOnJS } from 'react-native-reanimated';

export function useOverlay(onClosed?: () => void) {
  const progress = useSharedValue(0);            // 0 hidden, 1 shown
  const [mounted, setMounted] = useState(false);

  const open = () => { setMounted(true); requestAnimationFrame(() => { progress.value = withSpring(1, { damping: 22, stiffness: 240 }); }); };
  const close = () => {
    progress.value = withTiming(0, { duration: 200 }, (f) => {
      'worklet';
      if (f) { runOnJS(setMounted)(false); if (onClosed) runOnJS(onClosed)(); }
    });
  };
  return { progress, mounted, open, close };
}
```
`progress` drives **both** the backdrop and the content — one source of truth. (v4: `runOnJS` → `scheduleOnRN`.)

---

## 1. Modal / dialog (center)

Scale up slightly + fade, dimmed backdrop. Tap-outside and the close button both call `close()`.

```tsx
const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value * 0.5 }));
const cardStyle = useAnimatedStyle(() => ({
  opacity: progress.value,
  transform: [{ scale: interpolate(progress.value, [0, 1], [0.92, 1]) }],
}));

{mounted && (
  <View style={StyleSheet.absoluteFill}>
    <AnimatedPressable style={[StyleSheet.absoluteFill, styles.backdrop, backdropStyle]} onPress={close} />
    <View style={styles.centerWrap} pointerEvents="box-none">
      <Animated.View style={[styles.dialog, cardStyle]}>{children}</Animated.View>
    </View>
  </View>
)}
```
Don't start scale at 0 (feels like a zoom from nothing) — 0.92→1 reads as "stepping forward." Declarative shortcut: `entering={ZoomIn.springify()}` / `exiting={ZoomOut}` on the dialog when you don't need a dismiss gesture.

---

## 2. Alert / confirmation dialog

Same as the modal, plus: focus the primary action, and on invalid confirm **shake** the dialog and fire a warning haptic instead of closing.

```ts
const x = useSharedValue(0);
const reject = () => { x.value = withSequence(
  withTiming(-8,{duration:40}), withTiming(8,{duration:40}), withTiming(-5,{duration:40}), withTiming(0,{duration:40})
); runOnJS(Haptics.notificationAsync)(Haptics.NotificationFeedbackType.Warning); };
// add { translateX: x.value } to the dialog transform
```

---

## 3. Action sheet (bottom list of actions)

Slides up from the bottom, options stagger in, cancel separated. Swipe-down or backdrop tap dismisses.

```tsx
const sheetStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: interpolate(progress.value, [0, 1], [SHEET_H, 0]) }],
}));
// options: each <Animated.View entering={FadeInDown.delay(i*30)}>
const pan = Gesture.Pan()
  .onUpdate((e) => { if (e.translationY > 0) progress.value = 1 - e.translationY / SHEET_H; })
  .onEnd((e) => { (e.translationY > SHEET_H * 0.3 || e.velocityY > 800) ? close() : (progress.value = withSpring(1)); });
```

---

## 4. Side drawer (left / right sheet)

Translates in from the edge; backdrop fades; edge-swipe opens, swipe/tap closes. Right sheet mirrors the sign.

```tsx
const W = DRAWER_WIDTH;
const FROM = side === 'left' ? -W : W;                 // off-screen origin
const drawerStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: interpolate(progress.value, [0, 1], [FROM, 0]) }],
}));
const backdropStyle = useAnimatedStyle(() => ({ opacity: progress.value * 0.4 }));

const pan = Gesture.Pan()
  .onUpdate((e) => {
    const raw = side === 'left' ? e.translationX : -e.translationX; // drag toward closing edge
    progress.value = clamp(1 + Math.min(0, raw) / W, 0, 1);
  })
  .onEnd((e) => {
    const v = side === 'left' ? e.velocityX : -e.velocityX;
    (progress.value < 0.5 || v < -600) ? close() : (progress.value = withSpring(1, { velocity: v }));
  });
```
For an app-wide navigation drawer, `@react-navigation/drawer` (Reanimated-backed) handles this — hand-roll only for custom in-screen panels.

---

## 5. Dropdown / menu / popover (anchored)

Anchored overlays should grow **from the anchor**, not the screen center. `measure()` the trigger, position the menu, and set `transformOrigin` toward the anchor edge so the scale feels attached.

```tsx
// measure the trigger in a worklet, store its rect, then:
const menuStyle = useAnimatedStyle(() => ({
  opacity: progress.value,
  transform: [{ scale: interpolate(progress.value, [0, 1], [0.9, 1]) }, { translateY: interpolate(progress.value, [0,1], [-6, 0]) }],
  transformOrigin: 'top right',     // toward the anchor (RN 0.74+/v4; else fake with translate)
}));
// items stagger: entering={FadeInDown.delay(i*20).duration(140)}
```
Keep it fast (120–160ms) — menus should feel instant. Close on item select and on outside tap.

---

## 6. Tooltip / coachmark

Tiny fade + scale from the anchor, optional pointer. Auto-dismiss after a few seconds or on tap; never block interaction.

```ts
const reveal = () => { progress.value = withSpring(1, { damping: 16, stiffness: 220 }); };
useEffect(() => { const t = setTimeout(close, 2500); return () => clearTimeout(t); }, []);
// style: opacity: progress, scale: 0.85→1, translateY a few px from the anchor side
```

---

## 7. Toast / snackbar

Slides + fades in from an edge, **auto-dismisses** on a timer, supports **swipe-to-dismiss**, and stacks cleanly. Pause the timer while the user is touching it.

```tsx
const ty = useSharedValue(-120);            // top toast hidden above
const show = () => (ty.value = withSpring(insets.top + 8, { damping: 20, stiffness: 220 }));
const hide = (cb?: () => void) => (ty.value = withTiming(-120, { duration: 220 }, (f) => { 'worklet'; if (f && cb) runOnJS(cb)(); }));

const swipe = Gesture.Pan()
  .onUpdate((e) => { ty.value = base + Math.min(0, e.translationY); })   // drag up to dismiss
  .onEnd((e) => { (e.translationY < -40 || e.velocityY < -600) ? hide(onDismiss) : show(); });

useEffect(() => { const t = setTimeout(() => hide(onDismiss), duration); return () => clearTimeout(t); }, []);
```
- **Stacking:** keep a queue; offset each toast's `translateY` by the heights above it; animate offsets with `LinearTransition` when one leaves.
- Don't cover the keyboard or nav bar; respect safe-area insets.

---

## Checklist
- [ ] Stay mounted through the exit; unmount in the animation **callback**, never before.
- [ ] One `progress`/offset drives backdrop **and** content (single source of truth).
- [ ] Dismissible by all expected paths: button, backdrop tap, swipe (with **velocity** fed into the spring).
- [ ] Anchored overlays (menu/tooltip) grow from the anchor via `measure` + `transformOrigin`.
- [ ] Toasts auto-dismiss (timer paused on touch), swipe-dismissable, stack with `LinearTransition`, respect insets.
- [ ] Reduce Motion → cross-fade instead of large slides/zooms; keep durations short.
- [ ] Prefer `@gorhom/bottom-sheet` / `@react-navigation/drawer` for the heavy cases.
