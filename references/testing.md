# Testing

Reanimated ships a Jest mock so components using it render in tests. Animations don't actually run frame-by-frame under Jest; you assert on final/began states and that callbacks fire.

---

## Jest setup

`jest.config.js` (or `package.json` jest field) — use a setup file:
```js
module.exports = {
  preset: 'jest-expo',                 // or 'react-native'
  setupFiles: ['./jest.setup.js'],
};
```

`jest.setup.js`:
```js
// Official Reanimated mock — registers Animated.*, hooks, animation fns as no-op-ish
require('react-native-reanimated').setUpTests?.(); // some versions
// Common form:
jest.mock('react-native-reanimated', () => require('react-native-reanimated/mock'));

// Gesture handler jestSetup (if using gestures)
require('react-native-gesture-handler/jestSetup');
```
> The exact mock path/util varies by version: older versions use `react-native-reanimated/mock`; some setups call `require('react-native-reanimated').setUpTests()`. Check your installed version's docs. For v4, ensure `react-native-worklets` is mocked too if needed.

---

## What you can test

- **Renders without crashing** with animated components.
- **Final layout/style** after state changes (the mock applies end values).
- **Callbacks reach JS** — `runOnJS`/`scheduleOnRN` targets get called (mock invokes them).
- **Conditional rendering** driven by `useAnimatedReaction` → `runOnJS(setState)`.

You generally **don't** assert intermediate frames — animations are mocked, not timed.

---

## Fake timers for timing-based logic

```ts
import { render, fireEvent } from '@testing-library/react-native';

jest.useFakeTimers();

test('opens on press', () => {
  const { getByTestId } = render(<Sheet />);
  fireEvent.press(getByTestId('open'));
  jest.advanceTimersByTime(400);     // advance past the animation duration
  // assert resulting state / visible element
});
```

For worklet-driven completion callbacks, the mock typically invokes them synchronously or via timers — advance timers and assert the `runOnJS` side effect (e.g. a mocked navigation/setState was called).

---

## Tips

- Mock haptics/navigation so `runOnJS(Haptics.x)` / nav calls are assertable: `jest.mock('expo-haptics')`.
- Test the **logic** (does it call onDelete after swipe threshold? does page index update?), not the pixels.
- For visual/interaction correctness, use a device/Storybook/Maestro E2E — unit tests can't see real motion.
- Keep animation thresholds/config in plain constants so tests can import and assert against them.

## Checklist
- [ ] Reanimated (and gesture-handler) mock wired in jest setup for the installed version.
- [ ] Tests assert end-state + that `runOnJS` side effects fire, not intermediate frames.
- [ ] Fake timers advanced past durations; haptics/nav mocked.
