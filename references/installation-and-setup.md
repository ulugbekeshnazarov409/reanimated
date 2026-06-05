# Installation & Setup

Get this wrong and nothing animates / the app red-screens with "Reanimated failed to create a worklet". Setup differs by version. Detect the installed version first (`package.json` → `react-native-reanimated`), then follow the matching path.

---

## Expo (managed) — recommended path

Always install with `npx expo install` so the version matches your SDK:

```bash
npx expo install react-native-reanimated
# Reanimated 4 also needs the worklets package (Expo SDK 54+ / RN New Arch):
npx expo install react-native-worklets
```

Reanimated 4 requires the **New Architecture** (default on recent Expo SDKs). Reanimated 3 works on old or new arch.

### Babel config
`babel.config.js` — the plugin must be **LAST** in the `plugins` array.

```js
// Reanimated 3.x (and 2.x)
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-reanimated/plugin'], // MUST be last
  };
};
```

```js
// Reanimated 4.x — plugin moved to the worklets package
module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: ['react-native-worklets/plugin'], // MUST be last
  };
};
```

> `babel-preset-expo` already includes Reanimated's plugin on recent SDKs — adding it again can warn/double-apply. If the preset handles it, don't add the plugin line. Check your SDK's docs; when in doubt, one source only.

After changing Babel config: **restart with cache cleared** — `npx expo start -c`.

---

## Bare React Native

```bash
yarn add react-native-reanimated
# v4:
yarn add react-native-worklets
cd ios && pod install   # iOS native step
```

`babel.config.js` — same plugin rule (last). For v4 use `react-native-worklets/plugin`.

Rebuild the native app after installing (`npx react-native run-ios|run-android`) — Reanimated has native code; a JS-only reload is not enough.

---

## Root component setup

### GestureHandlerRootView (required for gestures)
If you use gestures (almost always with Reanimated), wrap the app root once:

```tsx
import { GestureHandlerRootView } from 'react-native-gesture-handler';

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      {/* app */}
    </GestureHandlerRootView>
  );
}
```
Expo Router: put it in the root layout. Install gestures with `npx expo install react-native-gesture-handler`.

### Animated components
Animate only Reanimated's animated components:
```tsx
import Animated from 'react-native-reanimated';
<Animated.View style={animatedStyle} />
<Animated.Text /> <Animated.ScrollView /> <Animated.FlatList /> <Animated.Image />
```
Wrap a third-party component:
```tsx
const AnimatedThing = Animated.createAnimatedComponent(Thing);
// animate props via useAnimatedProps (see animated-styles.md)
```

---

## New Architecture (v4)

- Reanimated **4.x requires the New Architecture**; it dropped Legacy Architecture and `react-native-v8`.
- Recent Expo SDKs enable New Arch by default. Bare RN: ensure `newArchEnabled=true` (Android `gradle.properties`) / `RCT_NEW_ARCH_ENABLED=1` (iOS), then rebuild.
- If the project is still on Legacy Arch, stay on Reanimated **3.x** (or migrate the arch first). See `version-guide.md`.

---

## Quick verification

A 5-line smoke test — if this animates, setup is correct:
```tsx
import Animated, { useSharedValue, useAnimatedStyle, withTiming } from 'react-native-reanimated';
function Test() {
  const w = useSharedValue(100);
  const style = useAnimatedStyle(() => ({ width: w.value }));
  return <Animated.View onTouchStart={() => (w.value = withTiming(w.value === 100 ? 200 : 100))}
    style={[{ height: 100, backgroundColor: 'tomato' }, style]} />;
}
```

---

## Setup checklist

- [ ] Version detected (v2/v3/v4); `react-native-worklets` present ⇒ v4.
- [ ] Installed via `npx expo install` (Expo) / pod install (bare).
- [ ] Babel plugin present and **LAST**: `react-native-reanimated/plugin` (v2/3) or `react-native-worklets/plugin` (v4) — unless `babel-preset-expo` already adds it.
- [ ] Metro cache cleared after Babel change (`expo start -c`); native rebuilt.
- [ ] `GestureHandlerRootView` at the root if using gestures.
- [ ] v4 ⇒ New Architecture enabled.
