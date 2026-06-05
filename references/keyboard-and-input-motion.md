# Keyboard & Input Motion

Where many real apps break: chat composers, payment forms, sticky CTAs that must sit above the keyboard and move **in sync** with it. Reanimated's `useAnimatedKeyboard` gives the keyboard height/state as shared values on the UI thread, so content tracks the keyboard perfectly (no lag, no jump) — far smoother than `KeyboardAvoidingView`.

---

## useAnimatedKeyboard

```tsx
import Animated, { useAnimatedKeyboard, useAnimatedStyle } from 'react-native-reanimated';

function Composer() {
  const keyboard = useAnimatedKeyboard(); // { height: SharedValue<number>, state: SharedValue<KeyboardState> }

  const liftStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: -keyboard.height.value }], // move up by exactly the keyboard height
  }));

  return (
    <Animated.View style={[styles.composer, liftStyle]}>
      <TextInput placeholder="Message…" />
      <SendButton />
    </Animated.View>
  );
}
```
- `keyboard.height.value` tracks the live keyboard height frame-by-frame (including the open/close animation) on the UI thread.
- `keyboard.state.value`: opening / open / closing / closed.
- Because it's a shared value, the content moves *with* the keyboard, not after it — the key to a premium chat feel.

> Android: set `android:windowSoftInputMode="adjustResizeshortEdges"`/`adjustResize` appropriately and Expo `softwareKeyboardLayoutMode`. iOS handles it via the hook. Test both.

---

## Patterns

### Sticky CTA above the keyboard (forms)
Pin a bottom button that rises with the keyboard, staying above it:
```tsx
const keyboard = useAnimatedKeyboard();
const insets = useSafeAreaInsets();
const barStyle = useAnimatedStyle(() => ({
  transform: [{ translateY: -Math.max(keyboard.height.value - insets.bottom, 0) }],
}));
// <Animated.View style={[styles.bottomBar, barStyle]}><PrimaryButton/></Animated.View>
```
Subtract the bottom safe-area inset so it doesn't over-lift on devices with a home indicator.

### Chat composer lift + list follow
- Lift the input bar by `keyboard.height`.
- Keep the message list pinned to the bottom: the list's bottom padding/translation also tracks `keyboard.height`, so the latest message stays visible as the keyboard opens.
- Scroll to bottom on send and when the keyboard opens while already at bottom.

### Interactive keyboard dismiss (drag down to close)
Pair with a `Gesture.Pan` on the scroll content; as the user drags down, you can interpolate the composer position toward closed. For full interactive dismissal, `react-native-keyboard-controller` (below) provides dedicated APIs.

---

## When to use react-native-keyboard-controller

For heavy keyboard work (interactive dismiss, precise cross-platform parity, `KeyboardAvoidingView` replacement, sticky toolbars), **`react-native-keyboard-controller`** is built on Reanimated and offers `useKeyboardHandler`, `KeyboardAvoidingView`, `KeyboardStickyView`, and reanimated-driven values. Prefer it for production chat/forms; it smooths the Android edge cases. `useAnimatedKeyboard` is enough for simple lifts.

---

## Gotchas
- **Android input mode** must be `adjustResize`-style or the hook won't report height correctly. Expo: `expo.android.softwareKeyboardLayoutMode`.
- Subtract **safe-area bottom inset** when lifting pinned bars.
- Don't combine `KeyboardAvoidingView` with a manual `useAnimatedKeyboard` lift on the same element — pick one.
- Multiline growing inputs: animate the composer height alongside the lift; keep send/mic button aligned.
- Test with a hardware keyboard toggled and with autofill bars.

## Checklist
- [ ] `useAnimatedKeyboard` drives the lift (UI-thread, in sync), not `KeyboardAvoidingView` + manual.
- [ ] Safe-area bottom inset accounted for on pinned bars.
- [ ] Android soft-input mode configured.
- [ ] List stays pinned to bottom as keyboard opens; scroll-to-bottom on send.
- [ ] Consider `react-native-keyboard-controller` for production chat/forms.
