# Performance — keep it on the UI thread at 60/120fps

Reanimated is fast *if* you keep animation work on the UI thread and avoid forcing JS-thread round-trips per frame. Jank instantly kills the premium feel.

---

## The golden rules

1. **Animate transforms & opacity**, not layout. `translateX/Y`, `scale`, `rotate`, `opacity` are cheap and composited on the UI thread. Animating `width`, `height`, `top`, `left`, `margin`, `padding` triggers layout each frame — avoid where a transform achieves the same look. (A horizontal "grow" is often `scaleX` + transform-origin tricks, not `width`.)
2. **Do the math in worklets.** All per-frame logic (`useAnimatedStyle`, `useDerivedValue`, gesture/scroll handlers) runs on the UI thread. Don't compute animation values on the JS thread and push them over.
3. **Minimize `runOnJS` / `scheduleOnRN`.** Each call hops to the JS thread. Don't call it every frame — only on discrete events (gesture end, threshold crossing, completion). Guard with change detection in `useAnimatedReaction`.
4. **No `setState` per frame.** Driving React state on every scroll/gesture frame re-renders and janks. Keep the value in a shared value; only setState on coarse changes (page index, open/closed).
5. **Virtualize long lists** (`FlatList`/`FlashList`), never `.map()` thousands of rows in a `ScrollView`. Animate item entrances with capped stagger.

---

## Hooks & deps hygiene

- `useAnimatedStyle` re-runs when its read shared values change — keep it lean and **pure** (no side effects, no allocations beyond the returned style). Put side effects in `useAnimatedReaction`.
- Pass dependency arrays where supported (`useDerivedValue(fn, [deps])`) to avoid stale captures and unnecessary recreation.
- Don't create new functions/objects inside the worklet each frame unnecessarily; compute scalars, return the style.
- Reuse one `progress` shared value to drive many outputs via `interpolate`, instead of many independent animations.

---

## Components

- Only `Animated.*` components accept animated styles/props. Wrap third-party with `Animated.createAnimatedComponent` once (module scope), not inside render.
- For animating non-style props (SVG, text), use `useAnimatedProps` — avoids React re-renders for per-frame value display (e.g. counters via `TextInput`).

---

## Gestures & scroll

- `scrollEventThrottle={16}` on animated scrollables (≈60fps event cadence).
- Feed gesture **velocity** into `withSpring`/`withDecay` for continuity (also avoids a stutter frame at release).
- Use `activeOffsetX`/`failOffsetY` to prevent gesture/scroll conflicts that cause dropped interactions.

---

## Memory & lifecycle

- **Cancel infinite/long animations on unmount**: `useEffect(() => () => cancelAnimation(sv), [])`. Leaked `withRepeat(-1)` loops keep running.
- Cancel before re-driving a value from a new source so animations don't fight.
- Avoid retaining large objects in worklet closures (they get serialized).

---

## 120Hz (ProMotion / high-refresh Android)

- Reanimated drives frames at the display's refresh rate automatically. Keep worklets cheap so you can hold 120fps; the same rules apply, just a tighter frame budget (~8ms).
- Profile with the dev menu's perf monitor; watch the **UI thread FPS** (Reanimated work shows there), not just JS FPS.

---

## Diagnosing jank

- JS FPS drops but UI FPS fine → too much JS work / `runOnJS` spam; move logic into worklets, batch JS calls.
- UI FPS drops → expensive worklet, animating layout props, huge shadow/blur, or too many simultaneous animations; switch to transforms, reduce concurrent animations, simplify.
- Stutter only at gesture release → not feeding velocity, or a `runOnJS` setState on release; hand off velocity, defer state.

## Checklist
- [ ] Transforms/opacity over layout props.
- [ ] All per-frame math in worklets; no JS-thread compute per frame.
- [ ] `runOnJS`/`setState` only on discrete events, not per frame.
- [ ] Long lists virtualized; stagger capped.
- [ ] `createAnimatedComponent` at module scope; `useAnimatedProps` for value display.
- [ ] `scrollEventThrottle={16}`; velocity fed into release animations.
- [ ] Infinite animations cancelled on unmount; UI-thread FPS profiled.
