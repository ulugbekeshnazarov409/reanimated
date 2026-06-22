# Web & Platform Support — what runs where, and which props animate

Reanimated runs on **iOS, Android, and the Web** (Expo web / React Native Web), but the web is a different beast and not every property animates cheaply on any platform. Know these so you don't ship code that silently no-ops on web or janks because it animates a layout prop.

---

## Web support — the caveats that bite

On the web there is **no separate UI thread**, so Reanimated implements everything in pure JS — animations are real but less efficient than native, and some native-only features are missing.

- **Worklets become plain JS functions.** They still run, but on the main JS thread.
- **The `'worklet'` directive is still required**, because the Worklets Babel plugin captures closure dependencies. Keep marking worklets / using the plugin.
- **Or pass explicit dependency arrays.** Without the Babel plugin you must pass the dependency array to every Reanimated hook (`useAnimatedStyle(fn, [dep])`, `useDerivedValue(fn, [dep])`). This is valid on native too — a good habit for web-targeting code.
- **`measure()` is not available on web** — guard platform-specific measure code, or use `onLayout`.
- **Layout Animations are limited/unavailable on web** — entering/exiting/layout presets may not run; provide a CSS or opacity fallback for web builds.
- **Reanimated 4's CSS animations/transitions** map naturally to the web and are a good choice for cross-platform declarative motion (`css-animations-v4.md`).

```ts
import { Platform } from 'react-native';
if (Platform.OS !== 'web') { /* measure()/layout-animation-only path */ }
```

---

## Which style properties to animate (and which to avoid)

Reanimated can animate most style props, but **cost differs**. The premium-feel rule: prefer composited props.

| Cheap (composited, UI-thread) | Costly (triggers layout each frame) |
| --- | --- |
| `opacity` | `width`, `height` |
| `transform`: `translateX/Y`, `scale`, `scaleX/Y`, `rotate`, `rotateX/Y/Z`, `skew`, `perspective`, `matrix` | `top`, `left`, `right`, `bottom`, `margin*`, `padding*` |
| `backgroundColor`, `borderColor`, `color`, `tintColor`, `shadowColor` (via `interpolateColor`) | `flex`, `flexBasis`, layout-affecting props |
| `borderRadius`, `borderWidth` (cheap-ish) | `shadowOpacity`/`shadowRadius` per frame (repaint), Android `elevation` |

- Animate a "grow" as `scaleX/Y` with `transformOrigin`, not `width`/`height`, wherever the look allows (`performance.md`).
- **Colors** must go through `interpolateColor` (you can't tween a string directly).
- A one-shot layout-prop animation (e.g. a button morph) is acceptable; **per-frame** layout animation (scroll/gesture) is not.
- v4 CSS animations have their own **supported-properties** set — check the v4 docs' "Supported style properties" page when using `animationName`/`transition*`.

---

## Platform specifics

- **120fps (iOS ProMotion):** set `CADisableMinimumFrameDurationOnPhone = true` in `Info.plist` to let animations run above 60fps. Android high-refresh is automatic.
- **Shadows:** iOS uses `shadow*`; Android uses `elevation` (barely animatable). For an animated "lift", use `scale` + a faded pre-rendered shadow layer rather than animating `elevation` (`cards.md` §1).
- **`transformOrigin`:** available on RN 0.74+ / Reanimated v4. On older RN, fake it with `translate → scale/rotate → translate back`.
- **New Architecture:** v4 **requires** Fabric + `react-native-worklets`. On the old architecture you're on v2/v3 (different thread-helper names, no CSS animations) — `version-guide.md`.
- **Backface/3D:** `perspective` must precede `rotateX/Y` in the transform array; set `backfaceVisibility: 'hidden'` for flips.

---

## Checklist
- [ ] Web build: worklets still marked (or dependency arrays passed); no reliance on `measure`/layout animations without a fallback.
- [ ] Prefer transforms/opacity/color over layout props; colors via `interpolateColor`.
- [ ] Per-frame animations never touch `width/height/top/left/margin/padding`.
- [ ] 120fps flag set on iOS if targeting ProMotion; shadows handled per-platform.
- [ ] `transformOrigin` guarded for older RN; v4 features gated behind New-Arch detection.
