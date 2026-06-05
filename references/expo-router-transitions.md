# Expo Router — Screen & Router Transitions (deep)

Expo Router is file-based routing **built on React Navigation** (native-stack/tabs under the hood). So screen-transition animation = setting React Navigation options through Router's layout components. This covers the Router-specific way to animate routes, modals, tabs, and shared elements.

> The underlying transition engine, presets, and interpolators are React Navigation's — see `react-navigation-transitions.md` for the deep mechanics. This file is how to express them in Expo Router's file-based API.

---

## Stack route transitions

In a layout file (`app/_layout.tsx`, `app/(stack)/_layout.tsx`):
```tsx
import { Stack } from 'expo-router';

export default function Layout() {
  return (
    <Stack screenOptions={{ animation: 'slide_from_right', animationDuration: 300 }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="details" options={{ animation: 'fade' }} />
      <Stack.Screen name="modal" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
      <Stack.Screen name="lightbox" options={{ presentation: 'transparentModal', animation: 'fade' }} />
    </Stack>
  );
}
```
- `animation`: same native-stack strings (`fade`, `slide_from_right/left/bottom`, `flip`, `none`, …).
- `presentation`: `card` | `modal` | `transparentModal` | `formSheet` | `containedModal`.
- Per-route: set `options` on `<Stack.Screen>` **or** inside the route file with `<Stack.Screen options={{…}} />` rendered at the top, or export route options.

Dynamic options from a screen:
```tsx
// inside app/details.tsx
import { Stack } from 'expo-router';
export default function Details() {
  return (<><Stack.Screen options={{ animation: 'slide_from_bottom', gestureEnabled: true }} />{/* … */}</>);
}
```

---

## Modals & sheets (file-based)

- A route with `presentation: 'modal'` slides up and stacks (iOS card modal).
- **Native iOS form sheet** with detents:
  ```tsx
  <Stack.Screen name="filters" options={{
    presentation: 'formSheet',
    sheetAllowedDetents: [0.5, 1],   // half + full
    sheetGrabberVisible: true,
    sheetCornerRadius: 20,
  }} />
  ```
- **`transparentModal`** for custom dialogs/lightboxes/toasts you animate yourself with Reanimated (the background stays visible; you fade a scrim + animate content).
- Convention: a `(modal)` group or a route opened via `router.push('/modal')`.

---

## Tabs

```tsx
import { Tabs } from 'expo-router';
<Tabs screenOptions={{ animation: 'shift' /* fade | none */ }} />
```
Custom **animated tab bar**: pass `tabBar={(props) => <AnimatedTabBar {...props} />}` and drive an indicator shared value from `props.state.index` with `withSpring` (Reanimated) — see `patterns-recipes.md §5` and `navigation-animations.md`. Hide the default bar per route with `options={{ tabBarStyle: { display: 'none' } }}` or `href: null`.

---

## Fully custom transitions

Expo Router's `Stack` maps to **native-stack**, which only takes preset `animation` strings (no `cardStyleInterpolator`). For arbitrary custom screen transitions you have options:
1. **Use the JS stack via React Navigation directly** for that navigator (drop to a custom navigator) and apply `cardStyleInterpolator`/`transitionSpec` (see `react-navigation-transitions.md`).
2. **Animate within the screen** — fade/slide the screen content on mount with Reanimated layout animations / `useFocusEffect`, independent of the navigator transition (`animation: 'none'` on the route, then animate the content yourself for full control).
3. **`react-native-screens` config** — advanced `ScreenStackItem` props for custom native behavior.

In-screen content transition (works with any router):
```tsx
import Animated, { FadeInDown, FadeOut } from 'react-native-reanimated';
<Animated.View entering={FadeInDown.springify()} exiting={FadeOut} style={{ flex: 1 }}>
  {/* screen content */}
</Animated.View>
```

---

## Shared element transitions

- Reanimated **`sharedTransitionTag`** on the same element across two routes (native-stack) — see `shared-element-transitions.md`. Verify on your version; Router uses native-stack so it's compatible in principle.
- For complex morphs, a measured hero overlay or a dedicated lib is steadier.

---

## Focus-aware & gesture

- `import { useFocusEffect } from 'expo-router';` — run/reset screen animations on focus/blur; pause frame loops on blur (`navigation-animations.md`).
- Gesture dismiss: `gestureEnabled`, `fullScreenGestureEnabled` (iOS) on the route options; keep swipe-back intact.

---

## Gotchas
- Expo Router transitions ARE React Navigation transitions — you can't get JS-stack interpolators from `<Stack>` (it's native-stack); animate content in-screen or drop to a custom navigator for that.
- Put `<Stack.Screen options={{…}} />` once; don't fight it with conflicting global `screenOptions`.
- `react-native-screens` must be enabled (it is by default in Expo).
- Test modal/sheet on both platforms (formSheet is iOS-native; Android approximates).

## Checklist
- [ ] Route `animation`/`presentation` set in the layout `<Stack>` / per `<Stack.Screen>`.
- [ ] Native sheet detents for iOS form sheets; `transparentModal` for custom-animated overlays.
- [ ] Custom motion done in-screen (Reanimated) or via a dropped-to JS-stack navigator.
- [ ] Animated tab bar driven from `state.index`.
- [ ] Focus-aware animations; swipe-back preserved.
