# Device Motion — useAnimatedSensor (gyroscope, accelerometer, gravity)

`useAnimatedSensor` streams device sensor data into shared values on the UI thread, so you can drive motion from how the phone is **held and moved** — tilt parallax, a gravity-following element, a gyroscope background, shake-to-undo. Mobile only (iOS/Android); on web/unsupported it returns zeros. Sensors sample up to ~100Hz. Always provide a Reduce-Motion fallback — sensor motion can be nauseating.

```ts
import { useAnimatedSensor, SensorType } from 'react-native-reanimated';

const gyro = useAnimatedSensor(SensorType.ROTATION, { interval: 'auto' });
//        ^ { sensor: SharedValue<…> }  — read gyro.sensor.value inside a worklet
```

---

## Sensor types & what `.value` holds

| `SensorType` | `sensor.value` fields | Meaning |
| --- | --- | --- |
| `ACCELEROMETER` | `{ x, y, z, interfaceOrientation }` | Acceleration **excluding** gravity (m/s²) |
| `GRAVITY` | `{ x, y, z, interfaceOrientation }` | Gravity vector (m/s²) — best for "which way is down" / tilt |
| `GYROSCOPE` | `{ x, y, z, interfaceOrientation }` | Rotation rate (rad/s) |
| `MAGNETIC_FIELD` | `{ x, y, z, interfaceOrientation }` | Magnetometer (µT) — compass |
| `ROTATION` | `{ qw, qx, qy, qz, yaw, pitch, roll, interfaceOrientation }` | Device orientation (quaternion + Euler angles, radians) |

`interfaceOrientation` lets you correct for the current screen rotation.

---

## Config

```ts
useAnimatedSensor(SensorType.GRAVITY, {
  interval: 'auto',                 // 'auto' (display refresh) or ms between samples
  adjustToInterfaceOrientation: true, // auto-rotate axes to match screen orientation
  iosReferenceFrame: IOSReferenceFrame.Auto, // Auto | XArbitraryZVertical | XArbitraryCorrectedZVertical | XMagneticNorthZVertical | XTrueNorthZVertical
});
```
`interval: 'auto'` matches the display (smoothest for animation). Larger ms = fewer updates = less battery.

---

## 1. Tilt parallax (the signature effect)

Use `ROTATION` pitch/roll (or `GRAVITY` x/y) to shift layers by different amounts — foreground moves more than background, selling depth. Clamp and smooth so jitter doesn't show.

```tsx
const rot = useAnimatedSensor(SensorType.ROTATION, { interval: 'auto' });
const MAX = 18; // px of travel

const layer = (depth: number) => useAnimatedStyle(() => {
  'worklet';
  const { pitch, roll } = rot.sensor.value;
  return {
    transform: [
      { translateX: clamp(-roll * MAX * depth, -MAX, MAX) },
      { translateY: clamp(-pitch * MAX * depth, -MAX, MAX) },
    ],
  };
});
// bgStyle = layer(0.3); midStyle = layer(0.6); fgStyle = layer(1);
```
Smooth raw sensor noise by easing toward the value in a `useDerivedValue` (`withTiming(target, { duration: 80 })`) or a small low-pass, rather than binding transforms directly to the raw signal.

---

## 2. Gravity-following element

```tsx
const g = useAnimatedSensor(SensorType.GRAVITY);
const ballStyle = useAnimatedStyle(() => {
  'worklet';
  const { x, y } = g.sensor.value;     // points toward ground
  return { transform: [{ translateX: clamp(-x * 12, -W, W) }, { translateY: clamp(y * 12, -H, H) }] };
});
```
For physics (the ball should accelerate, not snap), feed gravity into a `useFrameCallback` integrator → `frame-loops-and-realtime.md`.

---

## 3. Shake detection (discrete trigger)

Read acceleration magnitude; cross a threshold → fire JS once (haptic + undo). Use `useAnimatedReaction` so the JS hop happens only on the event, not every frame.

```ts
const acc = useAnimatedSensor(SensorType.ACCELEROMETER);
useAnimatedReaction(
  () => { const { x, y, z } = acc.sensor.value; return Math.sqrt(x*x + y*y + z*z); },
  (mag, prev) => { if (mag > 25 && (prev ?? 0) <= 25) runOnJS(onShake)(); }, // debounce in onShake
);
```

---

## Reduce Motion & lifecycle
- Gate sensor-driven motion on `useReducedMotion()` — when on, hold a neutral state (no tilt).
- The hook unregisters the listener on unmount automatically; don't bind heavy per-frame work to raw values (smooth first).
- Test on a real device — simulators don't emit real sensor data.

## Checklist
- [ ] Right sensor for the job (`GRAVITY`/`ROTATION` for tilt, `ACCELEROMETER` for shake).
- [ ] Read `sensor.value` only inside worklets; smooth/clamp before driving transforms.
- [ ] Discrete triggers via `useAnimatedReaction` + `runOnJS`, debounced — not per frame.
- [ ] `adjustToInterfaceOrientation` set if the UI rotates.
- [ ] Reduce-Motion neutral fallback; tested on a physical device.
