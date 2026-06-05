# React Navigation — Screen & Router Transitions (deep)

How to control and fully customize the animation of screens entering/leaving in **React Navigation** (the engine under Expo Router too). Two stacks exist with very different animation models — know which you're on.

- **`@react-navigation/native-stack`** — uses **native** platform transitions (UINavigationController / Fragments). Best performance, correct platform feel, but limited customization (preset `animation` strings, not arbitrary interpolators).
- **`@react-navigation/stack`** (JS stack) — JS-driven; **fully customizable** via interpolators and transition specs. Use when you need bespoke motion.

---

## native-stack (preferred default)

```tsx
<Stack.Navigator screenOptions={{
  animation: 'slide_from_right',       // 'default'|'fade'|'fade_from_bottom'|'slide_from_right'|'slide_from_left'|'slide_from_bottom'|'flip'|'none'
  animationDuration: 300,              // ms (where supported)
  presentation: 'card',                // 'card'|'modal'|'transparentModal'|'formSheet'(iOS 16+/Android)|'containedModal'
  gestureEnabled: true,
  fullScreenGestureEnabled: true,      // iOS: swipe-back from anywhere
  animationTypeForReplace: 'push',     // 'push'|'pop' animation when replacing
}}>
  <Stack.Screen name="Home" component={Home} />
  <Stack.Screen name="Details" component={Details} options={{ animation: 'slide_from_bottom' }} />
  <Stack.Screen name="Sheet" component={Sheet} options={{ presentation: 'formSheet', sheetAllowedDetents: [0.5, 1], sheetGrabberVisible: true }} />
</Stack.Navigator>
```
- Per-screen override via `options`. Dynamic: `options={({ route }) => ({ animation: route.params?.modal ? 'slide_from_bottom' : 'default' })}`.
- iOS native sheets (`formSheet`) get detents/grabber via `sheetAllowedDetents`, `sheetGrabberVisible`, `sheetCornerRadius`.
- Powered by **react-native-screens** — keep it installed/enabled.

native-stack does **not** support `cardStyleInterpolator`. For arbitrary custom transitions, use the JS stack.

---

## JS stack (`@react-navigation/stack`) — full custom transitions

### Built-in presets
```tsx
import { TransitionPresets } from '@react-navigation/stack';
<Stack.Navigator screenOptions={{ ...TransitionPresets.SlideFromRightIOS }}>
// also: ModalSlideFromBottomIOS, ModalPresentationIOS, FadeFromBottomAndroid, RevealFromBottomAndroid, ScaleFromCenterAndroid, DefaultTransition, ModalFadeTransition
```

### Custom `cardStyleInterpolator`
A function `({ current, next, layouts, progress }) => ({ cardStyle, overlayStyle })`. `current.progress` is a Navigation Animated value 0→1.
```tsx
const forSlideScale = ({ current, next, layouts }) => {
  const translateX = current.progress.interpolate({ inputRange: [0, 1], outputRange: [layouts.screen.width, 0] });
  const scalePrev = next
    ? next.progress.interpolate({ inputRange: [0, 1], outputRange: [1, 0.92] })  // shrink the screen below
    : 1;
  return {
    cardStyle: { transform: [{ translateX }] },
    // apply scalePrev to the previous card via `next`
  };
};

<Stack.Screen name="Details" options={{
  cardStyleInterpolator: forSlideScale,
  transitionSpec: {
    open:  { animation: 'spring', config: { stiffness: 1000, damping: 80, mass: 3 } },
    close: { animation: 'timing', config: { duration: 250 } },
  },
  gestureEnabled: true,
  gestureDirection: 'horizontal',     // or 'vertical' for swipe-down dismiss
}} />
```
- `headerStyleInterpolator` customizes the header transition similarly.
- `transitionSpec` sets the timing/spring for open & close independently.
- `gestureDirection`, `gestureResponseDistance` tune the dismiss gesture.

### Common custom transitions
- **Fade:** `cardStyle: { opacity: current.progress }`.
- **Scale-from-center (modal):** interpolate scale 0.9→1 + opacity.
- **Shrink-back parent:** use `next.progress` to scale/translate the outgoing screen for an iOS-13-modal stacked effect.

> JS stack runs interpolations on the JS thread (Animated, native-driver where possible). For the smoothest feel, native-stack + preset is usually better; reach for the JS stack only when the motion must be custom.

---

## Shared element transitions across screens

- **Reanimated tag-based** (`sharedTransitionTag`) with **native-stack** — see `shared-element-transitions.md` (experimental, verify per version).
- **`react-navigation-shared-element`** — a dedicated library for shared element transitions on the JS stack; mature for complex morphs.
- Fallback: a measured hero overlay (most control, any setup).

---

## Modals, sheets, transparent overlays

- `presentation: 'modal'` (card slides up, stacks on iOS), `'transparentModal'` (see-through bg — for custom dialogs/toasts you animate yourself), `'formSheet'` (native iOS sheet with detents).
- For fully custom bottom sheets as routes, render `@gorhom/bottom-sheet` inside a `transparentModal` screen.

---

## Gesture-driven dismiss

- native-stack: `gestureEnabled`, `fullScreenGestureEnabled` (iOS), `gestureDirection`.
- JS stack: `gestureDirection: 'vertical'` + `gestureResponseDistance` for swipe-down-to-close modals.
- Don't break the iOS edge swipe-back; custom in-screen pans must use `activeOffsetX`/`failOffsetY` to coexist.

---

## Tab transitions

- `@react-navigation/bottom-tabs`: `screenOptions={{ animation: 'shift' | 'fade' | 'none' }}` (newer versions) and a custom `tabBar` for animated indicators (Reanimated — drive from `state.index`).
- Material top tabs (`@react-navigation/material-top-tabs`) use `react-native-pager-view` — swipeable with a synced indicator.

## Checklist
- [ ] native-stack + preset `animation`/`presentation` for standard, performant transitions.
- [ ] JS stack only when motion must be custom → `cardStyleInterpolator` + `transitionSpec`.
- [ ] Shared elements via Reanimated tag (native-stack) or `react-navigation-shared-element`.
- [ ] Modal/sheet via `presentation`; custom sheets in `transparentModal`.
- [ ] Gesture dismiss configured; iOS swipe-back intact.
- [ ] `react-native-screens` enabled.
