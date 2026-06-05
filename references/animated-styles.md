# Animated Styles, Props & Derived Values

The hooks that turn shared values into what's on screen.

---

## useAnimatedStyle

Returns a style object computed in a worklet; re-runs when any read shared value changes. Apply it to an `Animated.*` component.

```tsx
import Animated, { useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';

const x = useSharedValue(0);
const animatedStyle = useAnimatedStyle(() => ({
  transform: [{ translateX: x.value }, { scale: 1 + x.value / 1000 }],
  opacity: 1 - x.value / 500,
}));

return <Animated.View style={[styles.box, animatedStyle]} onTouchEnd={() => (x.value = withSpring(120))} />;
```

Rules:
- **Animate transforms & opacity first** — they're cheapest and run purely on the UI thread. Prefer `translateX/Y`, `scale`, `rotate`, `opacity` over animating `width`/`height`/`top`/`left` (layout) when possible.
- Don't drive the same property from both `useAnimatedStyle` and a static/inline style — one source of truth. The animated style goes **last** in the `style` array so it wins.
- Keep the worklet pure: compute from shared values, return a style. No side effects (use `useAnimatedReaction` for those).
- `transform` must be an **array of single-property objects**: `[{ translateX }, { scale }]`, not `{ translateX, scale }`.

---

## useAnimatedProps

Animate **props** that aren't styles (SVG attributes, `TextInput` text, `ScrollView` props, etc.). Wrap non-RN components with `createAnimatedComponent`.

```tsx
import Animated, { useAnimatedProps, useSharedValue } from 'react-native-reanimated';
import { Circle } from 'react-native-svg';
const AnimatedCircle = Animated.createAnimatedComponent(Circle);

const r = useSharedValue(20);
const animatedProps = useAnimatedProps(() => ({ r: r.value }));
return <AnimatedCircle cx={50} cy={50} animatedProps={animatedProps} fill="tomato" />;
```

Animated text without re-rendering (numeric counters):
```tsx
const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);
const count = useSharedValue(0);
const props = useAnimatedProps(() => ({ text: String(Math.round(count.value)) } as any));
<AnimatedTextInput editable={false} value={String(0)} animatedProps={props} />;
```

---

## useDerivedValue

A read-only shared value computed from others. Use it to share a derived quantity across multiple styles/props, or to keep logic DRY.

```ts
const scroll = useSharedValue(0);
const headerOpacity = useDerivedValue(() =>
  interpolate(scroll.value, [0, 100], [1, 0], Extrapolation.CLAMP)
);
// reuse headerOpacity.value in several useAnimatedStyle blocks
```
- Re-runs when its read shared values change. For non-shared external deps, pass a deps array: `useDerivedValue(() => f(prop), [prop])`.
- It can also be a place to call `runOnJS` on a threshold (though `useAnimatedReaction` is cleaner for side effects).

---

## useAnimatedRef + measure + scrollTo

`useAnimatedRef` gives a ref usable inside worklets for layout reads and imperative scroll.

```ts
import { useAnimatedRef, measure, scrollTo } from 'react-native-reanimated';
const aref = useAnimatedRef<Animated.ScrollView>();

// measure synchronously on the UI thread (inside a worklet)
const onPress = () => {
  runOnUI(() => {
    'worklet';
    const m = measure(aref); // {x,y,width,height,pageX,pageY} or null
    if (m) scrollTo(aref, 0, m.height, true);
  })();
};
<Animated.ScrollView ref={aref}>…</Animated.ScrollView>
```
`measure` returns `null` if the node isn't ready — always null-check.

---

## Choosing the hook
- Visual style (transform/opacity/colors/size) → **useAnimatedStyle**.
- Non-style props (SVG, text value, component props) → **useAnimatedProps**.
- A shared computed value reused in several places, or a derived quantity → **useDerivedValue**.
- Need a ref inside worklets / `measure` / imperative `scrollTo` → **useAnimatedRef**.

## Checklist
- [ ] Animated styles applied to `Animated.*` components, placed last in the style array.
- [ ] Prefer transform/opacity; transforms are an array of single-prop objects.
- [ ] One source of truth per animated property.
- [ ] Worklet callbacks are pure (no side effects); deps listed where needed.
- [ ] `measure` results null-checked.
