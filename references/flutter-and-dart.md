# Flutter (Dart) — animation + blur / Liquid Glass

When the project is **Flutter**, apply the same senior motion bar — spring/physics, interruptibility, hero continuity, the glass design model in `blur-and-liquid-glass.md` — with Flutter's animation system. Flutter has **real cross-platform backdrop blur** (`BackdropFilter`) on every platform via Impeller, so glassmorphism is first-class; iOS 26 Liquid Glass is reached through shader packages, not (yet) a native Flutter widget.

---

## Flutter animation model

- **Implicit (easiest):** `AnimatedContainer`, `AnimatedOpacity`, `AnimatedPositioned`, `AnimatedAlign`, `AnimatedScale/Rotation/Slide`, and the general `TweenAnimationBuilder` — set a new value with a `duration` + `curve` and Flutter tweens it. Use for state-driven UI changes.
- **Explicit (full control):** `AnimationController` (`vsync: this`, `with SingleTickerProviderStateMixin`) + a `Tween` + `AnimatedBuilder`/`AnimatedWidget`. For gestures, scrubbing, repeats, chaining (`CurvedAnimation`, `Interval` for stagger).
- **Springs / physics:** `SpringSimulation` / `controller.animateWith(simulation)` for elastic, velocity-aware motion (gesture release, snap). Feed gesture velocity for continuity.
- **Curves:** `Curves.easeOut` (enter), `Curves.easeIn` (exit), `Curves.easeInOutCubic`, `Curves.elasticOut` (playful only).
- **Hero / shared element:** wrap both screens' widgets in `Hero(tag:)` — automatic shared-element flight across a route push (the native expand-to-detail).
- **Declarative shortcut:** the **`flutter_animate`** package — `widget.animate().fadeIn().scale().slideY()` with `.then()` chaining; great for entrance choreography with minimal boilerplate.
- **Interruptibility:** drive from an `AnimationController` and re-target/`animateTo` from its current value; don't reset to 0 first.

```dart
// implicit
AnimatedScale(scale: pressed ? 0.96 : 1, duration: const Duration(milliseconds: 120), curve: Curves.easeOut, child: card);

// explicit spring on release
controller.animateWith(SpringSimulation(SpringDescription(mass: 1, stiffness: 200, damping: 18), from, to, velocity));

// stagger via flutter_animate
Column(children: items.mapIndexed((i, w) => w.animate().fadeIn(delay: (i * 50).ms).slideY(begin: .1)).toList());
```

## Blur / glass in Flutter

- **`BackdropFilter(filter: ImageFilter.blur(sigmaX: n, sigmaY: n))`** — real-time backdrop blur of whatever is behind, clipped to the widget's shape. This is the glassmorphism workhorse; **clip it** (`ClipRRect`) so the blur stays bounded.
- **Animate the blur:** drive `sigma` from an `AnimationController`/`Tween` inside an `AnimatedBuilder` (e.g. a top bar that frosts in on scroll via a `ScrollController` listener → `setState`/animation).

```dart
ClipRRect(
  borderRadius: BorderRadius.circular(24),
  child: BackdropFilter(
    filter: ImageFilter.blur(sigmaX: blur, sigmaY: blur),   // animate `blur`
    child: Container(color: Colors.white.withOpacity(0.14), child: child), // tint = the glass
  ),
);
```

### iOS 26 Liquid Glass in Flutter
Flutter doesn't expose Apple's native `UIGlassEffect` as a widget yet — use packages that recreate it: **`liquid_glass_widgets`** (shader-based blur with refraction/edge-lighting/chromatic aberration + physics-driven "jelly" morphing) or **`cupertino_liquid_glass`** (BackdropFilter + multi-layer `CustomPainter` + `SpringSimulation`, no native bridge). Map the Apple model from `blur-and-liquid-glass.md`: Regular/Clear (tint + transparency), floating-plane separation, interactive spring, flex-to-thicker (raise sigma + shadow on grow), container morph (spring physics), concentric radii, selective tint.

## Accessibility & performance
- **Reduce Motion:** `MediaQuery.of(context).disableAnimations` (and `accessibleNavigation`) — when true, shorten/skip large motion, cross-fade instead.
- `BackdropFilter` is **GPU-expensive** and Gaussian blur cost scales with area — keep blurred regions small/bounded, avoid stacking many; Impeller (default on iOS and Android API 29+, Flutter 3.27+) helps but isn't free.
- Prefer transform-based motion (`Transform`/implicit animated widgets) over expensive layout rebuilds each frame; reuse one controller for many `Tween`s.

## Checklist
- [ ] Implicit animated widgets for simple state changes; `AnimationController`+`Tween` for gesture/scrub/chain.
- [ ] Springs (`SpringSimulation`) with fed velocity for releases; enter=easeOut / exit=easeIn.
- [ ] Shared element via `Hero(tag:)`; entrance choreography via `flutter_animate` or `Interval` stagger (capped).
- [ ] Glass via `BackdropFilter(ImageFilter.blur)` inside a `ClipRRect`; animate `sigma`; tint layer on top.
- [ ] Liquid Glass via `liquid_glass_widgets` / `cupertino_liquid_glass`, following the Apple model.
- [ ] `disableAnimations` honored; blurred areas bounded; controllers disposed in `dispose()`.
