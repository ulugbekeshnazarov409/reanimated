# Navigation Animations — React Navigation & Expo Router

Many devs know Reanimated but not how it meets navigation. Screen transitions, animated tab bars, scroll-driven headers, and shared elements all live at the navigation layer. This covers how Reanimated integrates with **React Navigation** and **Expo Router** (which is built on React Navigation).

---

## Screen transitions (stack)

Stack transitions are configured on the navigator, not hand-animated:

```tsx
// React Navigation native-stack
<Stack.Navigator screenOptions={{ animation: 'slide_from_right' }}>
// options: 'default' | 'fade' | 'slide_from_right' | 'slide_from_bottom' | 'fade_from_bottom' | 'none'
```
```tsx
// Expo Router
<Stack screenOptions={{ animation: 'slide_from_right' }} />
// or per-screen: <Stack.Screen name="modal" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
```
- **native-stack** uses native transitions (best performance, platform-correct). Prefer it.
- **JS stack** (`@react-navigation/stack`) exposes `cardStyleInterpolator` for fully custom Reanimated-style transitions when you need bespoke motion.

Custom transition (JS stack):
```ts
cardStyleInterpolator: ({ current, layouts }) => ({
  cardStyle: {
    transform: [{ translateX: current.progress.interpolate({ inputRange: [0,1], outputRange: [layouts.screen.width, 0] }) }],
  },
}),
```
(`current.progress` here is a Navigation Animated value; for Reanimated-native interpolation, drive your own shared values inside the screen.)

---

## Modals & sheets

- Native modal: `presentation: 'modal'` / `'formSheet'` / `'transparentModal'`.
- Custom bottom-sheet routes: use `@gorhom/bottom-sheet` inside a transparent modal screen, or a sheet library — these are Reanimated-powered and handle the gesture+snap.

---

## Animated tab bar

Build a custom tab bar and animate the indicator/icons with Reanimated:
```tsx
<Tab.Navigator tabBar={(props) => <AnimatedTabBar {...props} />}>
```
Inside `AnimatedTabBar`, drive an indicator shared value from `props.state.index` (`withSpring(index)`) and animate icon scale/color per focused tab. See `patterns-recipes.md §5`. Expo Router: pass `tabBar` to `<Tabs>` the same way.

---

## Scroll-driven headers across navigation

- The header lives in the navigator; to animate it from a screen's scroll, either:
  - Use `headerTransparent: true` + render your own animated header in the screen (full control with `useScrollOffset`/`useAnimatedScrollHandler`), or
  - Use `react-native-reanimated`-friendly libs like `@react-navigation/...` large-title behavior (iOS) and drive supplementary motion yourself.
- Collapsing/parallax header recipe: `patterns-recipes.md §4`.

---

## Shared element transitions across screens

- Reanimated's tag-based shared element transitions work with **native-stack** — give the same `sharedTransitionTag` on both screens (see `shared-element-transitions.md`); the morph fires on push/pop.
- Status is experimental/evolving — verify on your version; a measured hero is the reliable fallback.

---

## Focus-aware animations

Run/reset animations when a screen gains/loses focus:
```tsx
import { useFocusEffect } from '@react-navigation/native'; // Expo Router: same, or useFocusEffect from expo-router
useFocusEffect(useCallback(() => {
  progress.value = withTiming(1);            // animate in on focus
  return () => { progress.value = 0; };       // reset on blur
}, []));
```
Also `useIsFocused()` to gate expensive frame loops to the active screen (pause when blurred).

---

## Gestures + navigation

- iOS **swipe-back** is provided by native-stack — don't break it. Custom full-screen gestures should use `activeOffsetX`/`failOffsetY` so they don't fight the back gesture.
- `gestureEnabled`, `fullScreenGestureEnabled` (iOS) on screen options control the native back gesture.

---

## Gotchas
- Prefer **native-stack** for performance + correct platform transitions; only drop to JS stack for fully custom interpolators.
- Pause frame loops / heavy animations on blurred screens (`useIsFocused`).
- Reset or cancel screen animations on blur to avoid running offscreen.
- Shared element transitions need native-stack and matching tags; test push/pop/interrupt.

## Checklist
- [ ] Stack `animation`/`presentation` set via navigator options (native-stack preferred).
- [ ] Custom tab bar drives an indicator shared value from `state.index`.
- [ ] Screen-owned animated header for scroll-driven motion (`headerTransparent`).
- [ ] Animations tied to focus (`useFocusEffect`/`useIsFocused`); paused when blurred.
- [ ] iOS swipe-back intact; custom gestures don't fight it.
