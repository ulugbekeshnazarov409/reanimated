# Interpolation

Map one range of values to another inside a worklet — the workhorse for scroll effects, gesture-driven UI, and deriving many outputs from one progress value.

---

## interpolate(value, inputRange, outputRange, extrapolation?)

```ts
import { interpolate, Extrapolation } from 'react-native-reanimated';

const opacity = useAnimatedStyle(() => ({
  opacity: interpolate(scroll.value, [0, 100], [1, 0]),           // 0→1, 100→0
}));
```

- `inputRange` and `outputRange` are arrays of equal length, **inputRange monotonically increasing**.
- Multi-stop (keyframe-like):
  ```ts
  const scale = interpolate(p.value, [0, 0.5, 1], [1, 1.5, 1]); // up then back
  ```

### Extrapolation (what happens outside the input range)
4th arg, default `EXTEND`:
- `Extrapolation.CLAMP` — hold the edge value (most common for scroll/opacity; prevents going past 0/1).
- `Extrapolation.EXTEND` — keep extrapolating (default).
- `Extrapolation.IDENTITY` — return the input unchanged outside range.
```ts
interpolate(scroll.value, [0, 100], [0, 1], Extrapolation.CLAMP);
// per-edge: { extrapolateLeft: 'clamp', extrapolateRight: 'extend' }
```
**Almost always use `CLAMP`** for scroll-driven opacity/scale so values don't overshoot.

---

## interpolateColor(value, inputRange, outputRange, colorSpace?)

Animate between colors (returns a color string):
```ts
import { interpolateColor } from 'react-native-reanimated';
const style = useAnimatedStyle(() => ({
  backgroundColor: interpolateColor(p.value, [0, 1], ['#1E88E5', '#E53935']),
}));
```
- `outputRange` = color strings (hex/rgb/rgba/named). Multi-stop supported.
- `colorSpace`: `'RGB'` (default) or `'HSV'` (smoother hue transitions through the color wheel).

---

## clamp(value, min, max) — utility worklet

```ts
import { clamp } from 'react-native-reanimated'; // available in recent versions; else write inline
const bounded = clamp(x.value, 0, width);
```
Inline equivalent (any version):
```ts
const bounded = Math.min(Math.max(x.value, 0), width); // inside a worklet
```

---

## Patterns

**Scroll-driven header fade + shrink**
```ts
const headerStyle = useAnimatedStyle(() => {
  const o = interpolate(scroll.value, [0, 80], [1, 0], Extrapolation.CLAMP);
  const ty = interpolate(scroll.value, [0, 80], [0, -20], Extrapolation.CLAMP);
  return { opacity: o, transform: [{ translateY: ty }] };
});
```

**Drag progress → multiple outputs**
```ts
// one shared `progress` (0..1) drives scale, opacity, rotation, color together
const s = interpolate(progress.value, [0, 1], [0.8, 1]);
const r = `${interpolate(progress.value, [0, 1], [0, 360])}deg`;
```

**Carousel/pager active dot**
```ts
const dot = useAnimatedStyle(() => ({
  width: interpolate(scrollX.value, [(i-1)*W, i*W, (i+1)*W], [8, 24, 8], Extrapolation.CLAMP),
  opacity: interpolate(scrollX.value, [(i-1)*W, i*W, (i+1)*W], [0.4, 1, 0.4], Extrapolation.CLAMP),
}));
```

---

## Checklist
- [ ] `inputRange` strictly increasing; ranges equal length.
- [ ] `Extrapolation.CLAMP` for scroll/gesture-driven opacity/scale/size.
- [ ] `interpolateColor` for color (consider `'HSV'` for hue sweeps).
- [ ] Heavy multi-output mappings derived once (`useDerivedValue`) and reused.
