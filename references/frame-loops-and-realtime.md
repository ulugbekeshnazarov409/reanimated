# Frame Loops & Real-time — useFrameCallback

`useFrameCallback` runs a **worklet on every frame** on the UI thread. Use it when motion isn't a simple A→B animation but a continuous, per-frame computation: game loops, physics, custom progress engines, canvas/Skia sync, video scrubbers, audio visualizers, particle systems.

> If `withTiming`/`withSpring`/`interpolate` can express it, prefer them — they're declarative and cheaper. Reach for `useFrameCallback` only for genuinely per-frame logic.

---

## API

```ts
import { useFrameCallback, useSharedValue } from 'react-native-reanimated';

const x = useSharedValue(0);

const frame = useFrameCallback((info) => {
  'worklet';
  // info.timeSincePreviousFrame: ms since last frame (null on first frame)
  // info.timeSinceFirstFrame:    ms since the loop started
  // info.timestamp:              absolute frame time
  const dt = (info.timeSincePreviousFrame ?? 0) / 1000; // seconds
  x.value += velocity * dt;   // integrate by real elapsed time, not a fixed step
});

// control
frame.setActive(true);   // start
frame.setActive(false);  // stop (e.g. when offscreen / paused)
frame.isActive;          // boolean
```

Always integrate using `timeSincePreviousFrame` (delta time), not a constant per-frame increment — otherwise speed varies with refresh rate (60 vs 120Hz).

---

## Patterns

### Physics / inertia loop
```ts
const pos = useSharedValue(0);
const vel = useSharedValue(0);
const frame = useFrameCallback((i) => {
  'worklet';
  const dt = (i.timeSincePreviousFrame ?? 16) / 1000;
  vel.value *= 0.98;                 // friction
  pos.value += vel.value * dt;
  if (Math.abs(vel.value) < 0.1) frame.setActive(false); // stop when settled
});
// kick off from a gesture: vel.value = e.velocityX; frame.setActive(true);
```
> For simple fling, `withDecay` is simpler. Use a frame loop when you need custom forces (gravity, collisions, springs between many bodies).

### Continuous progress / scrubber
Drive a Skia/canvas value or a video position each frame:
```ts
const frame = useFrameCallback((i) => {
  'worklet';
  progress.value = (i.timeSinceFirstFrame % LOOP_MS) / LOOP_MS; // 0..1 loop
});
```

### Audio visualizer / Skia
Pair with `@shopify/react-native-skia` — read amplitude shared values per frame and update the canvas inside the frame worklet (Skia values live on the UI thread too).

---

## Performance & lifecycle

- A frame callback is the **hottest** code path — keep the worklet tiny. No allocations, no `runOnJS` per frame, no heavy math.
- **Stop the loop** when not needed: `setActive(false)` when offscreen, backgrounded, or settled. A running loop burns the UI thread and battery.
- Clean up on unmount: `useEffect(() => () => frame.setActive(false), [])`.
- Respects the display refresh rate; delta-time integration keeps behavior identical at 60/120Hz.
- Don't drive React state from it — keep everything in shared values / Skia.

## Checklist
- [ ] Used only for genuinely per-frame logic (else use animation functions).
- [ ] Integrates with `timeSincePreviousFrame` (delta time), not fixed steps.
- [ ] Worklet is minimal; no `runOnJS`/allocations per frame.
- [ ] `setActive(false)` on settle/offscreen/unmount.
