# Native Interop — animating native/third-party props, and when to write native code

Reanimated already runs on the **native side** via JSI — your worklets execute on the UI thread in C++, not bridged. So you rarely need to write native code for *performance*. You reach for native interop when a value you want to animate **isn't reachable from JS animation yet**: a third-party component's prop, a brand-new native view (Skia, maps, charts), or a platform animation you must integrate. The senior instinct: exhaust the JS-side ladder first; drop to native only when measured/required, and keep the native surface tiny.

---

## The ladder (try these in order)

| Level | Use when | How |
| --- | --- | --- |
| 1. Animated built-in | Standard RN view | `Animated.View/Text/ScrollView/Image/FlatList` |
| 2. `createAnimatedComponent` | Any third-party component | Wrap once at module scope; pass `animatedProps` |
| 3. `useAnimatedProps` | Animate a **native prop** (SVG `d`, `stroke`, `TextInput.text`, slider value) | Worklet returning the prop(s) |
| 4. Whitelist a native prop (old arch) | Prop not recognized as animatable on Paper | `addWhitelistedNativeProps({ prop: true })` (removed/automatic in v4 Fabric) |
| 5. Fabric native component | A custom native view you own | Expose the prop as a Fabric prop; Reanimated updates it natively |
| 6. Imperative from a worklet | One-off native command | `dispatchCommand(ref, name, args)` / `setNativeProps(ref, props)` |

Most "I need native" turns out to be level 2–3.

---

## Level 2–3: animate any component's native prop

```tsx
import Animated, { useAnimatedProps, useSharedValue } from 'react-native-reanimated';
import { Circle } from 'react-native-svg';

const AnimatedCircle = Animated.createAnimatedComponent(Circle); // module scope, once
const r = useSharedValue(20);
const props = useAnimatedProps(() => ({ r: r.value })); // 'r' is a native SVG prop → animates on the UI thread
return <AnimatedCircle cx={50} cy={50} fill="tomato" animatedProps={props} />;
```
This works because `r` is a **native prop** of the SVG view. The rule: `useAnimatedProps` can animate any prop the underlying native view actually reads natively. If it doesn't animate, the prop isn't a native prop (see level 4/5).

---

## Level 4: old architecture whitelist

On the **old architecture** (Paper), Reanimated only updates a known set of native props off the UI thread. If a custom native prop won't animate, register it once:
```ts
import { addWhitelistedNativeProps } from 'react-native-reanimated'; // v2/v3 only
addWhitelistedNativeProps({ myCustomProp: true });
```
> **v4 / New Architecture (Fabric):** `addWhitelistedNativeProps`/`addWhitelistedUIProps` were **removed** — Fabric resolves animatable props automatically, so you don't whitelist. If you're on v4 and a prop won't animate, the fix is at the Fabric component level (level 5), not a whitelist.

---

## Level 5: a custom Fabric native component that accepts animated props

When you own a native view (e.g., a custom gauge, a native chart) and want Reanimated to drive one of its props at 120fps, the contract is:

1. Define the prop as a normal **Fabric component prop** (codegen `NativeComponent` spec — `float`/`Int32`/`ColorValue`/etc.).
2. Implement the view (iOS: `RCTViewComponentView` / Swift; Android: `ViewManager`/`ViewGroup`) so the prop setter applies the value to the layer/canvas cheaply (no layout pass per update).
3. Wrap with `createAnimatedComponent` and drive the prop via `useAnimatedProps`. Reanimated's native updater pushes new values straight to the view on the UI thread — no JS re-render.

```tsx
// JS side — once the native prop exists, it's just useAnimatedProps:
const AnimatedGauge = Animated.createAnimatedComponent(NativeGauge);
const value = useSharedValue(0);
const gaugeProps = useAnimatedProps(() => ({ progress: value.value })); // 'progress' is the Fabric prop
<AnimatedGauge animatedProps={gaugeProps} />
```
Keep the native setter O(1) (set a layer property / request redraw). The heavy lifting stays native; JS only owns the shared value. (Full native module authoring is React Native's Turbo/Fabric codegen — out of scope here; this is the Reanimated-facing contract.)

---

## Level 6: imperative native calls from a worklet

From inside a worklet you can command a native view directly — useful for native scroll/list/camera controls that expose commands:
```ts
import { useAnimatedRef, dispatchCommand, setNativeProps } from 'react-native-reanimated';
const ref = useAnimatedRef();
// in a worklet (gesture/scroll/reaction):
dispatchCommand(ref, 'scrollToOffset', [{ offset: 200, animated: true }]);
setNativeProps(ref, { opacity: 0.5 }); // imperative one-off; prefer useAnimatedProps for continuous
```
`scrollTo(ref, x, y, animated)` and `measure(ref)` are the common worklet-native helpers (see `animated-styles.md`).

---

## Gestures are native too

`react-native-gesture-handler` recognizers run on the native/UI side and hand events to worklets — that's already "native" gesture handling with zero native code from you. Configure recognition natively via the builder (`activeOffsetX`, `failOffsetY`, `simultaneousWithExternalGesture`, `requireExternalGestureToFail`) rather than reaching for a native module. → `gestures.md`.

---

## When NOT to write native code
- Performance alone — Reanimated worklets are already native/JSI; profile first (`performance.md`).
- A prop that's already animatable via `useAnimatedProps`.
- Anything `interpolate`/spring/decay/frame-loop covers.
- Heavy background compute → a worklet runtime is usually enough (`advanced-runtimes.md`), not a new native module.

Write native only to (a) expose a prop on a view you own, (b) integrate an existing native rendering surface, or (c) reach a platform capability with no JS path. Then keep the bridge to a single animatable prop and let Reanimated drive it.

---

## Checklist
- [ ] Climbed the ladder: built-in → `createAnimatedComponent` → `useAnimatedProps` before considering native.
- [ ] Won't-animate prop: old arch → whitelist; v4/Fabric → fix at the component spec (no whitelist).
- [ ] Custom Fabric prop setter is O(1) (no per-update layout); JS owns only the shared value.
- [ ] Imperative one-offs via `dispatchCommand`/`setNativeProps`; continuous via `useAnimatedProps`.
- [ ] Native surface kept minimal and version-correct; profiled before deciding native was needed.
