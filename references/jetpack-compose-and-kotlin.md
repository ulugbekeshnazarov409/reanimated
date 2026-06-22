# Jetpack Compose (Kotlin) — animation + frosted glass / glassmorphism

When the project is **native Android (Kotlin/Compose)**, hit the same senior motion bar — spring physics, interruptibility, hero continuity, the glass design model in `blur-and-liquid-glass.md` — with Compose's animation APIs. Android has **no native Liquid Glass**; you emulate the *intent* (backdrop blur + tint + edge highlight + spring physics).

---

## Compose animation model

- **Implicit (value → animated):** `animateFloatAsState`, `animateDpAsState`, `animateColorAsState`, `animateOffsetAsState` — change the target, Compose tweens it. Interruptible: retarget mid-flight and it continues from the current value.
- **Visibility / content:** `AnimatedVisibility(visible) { … }` (enter/exit transitions), `AnimatedContent` (animate between different content/state), `Crossfade`.
- **Layout:** `Modifier.animateContentSize()` (size changes), `Modifier.animateItemPlacement()` / `animateItem()` in lazy lists (reorder).
- **Coordinated:** `updateTransition(state)` drives many child animations off one source; `rememberInfiniteTransition` for loops (pulse/shimmer).
- **Imperative:** `Animatable` (a suspend-based value you `animateTo`/`snapTo` with full control — gesture hand-off, velocity).
- **Specs:** `spring(dampingRatio = …, stiffness = …)` (prefer for interactions — interruptible, physical), `tween(durationMillis, easing)`, `keyframes { … }`. `Spring.DampingRatioMediumBouncy`, `StiffnessLow/Medium/High`.
- **Shared element / hero:** `SharedTransitionLayout` + `Modifier.sharedElement(...)` / `sharedBounds(...)` (the native expand-to-detail).
- **GPU transforms:** `Modifier.graphicsLayer { scaleX/Y, translationX/Y, rotationZ, alpha }` — composited, cheap (Compose's equivalent of staying on the UI thread).

```kotlin
val scale by animateFloatAsState(if (pressed) 0.96f else 1f, spring(stiffness = Spring.StiffnessMedium))
Box(Modifier.graphicsLayer { scaleX = scale; scaleY = scale })

AnimatedVisibility(visible, enter = fadeIn() + slideInVertically(), exit = fadeOut()) { Sheet() }

val t = rememberInfiniteTransition()
val x by t.animateFloat(0f, 1f, infiniteRepeatable(tween(1200), RepeatMode.Restart)) // shimmer
```

## Frosted glass / glassmorphism on Android

There is no backdrop blur in core Compose for real glass — pick the right tool:

- **`Modifier.blur(radius)`** — Android **12+ only**, blurs the **composable's own content**, *not* the backdrop. Fine for blurring an image you own; **not** glassmorphism.
- **`Modifier.graphicsLayer { renderEffect = RenderEffect.createBlurEffect(...) }`** — lower-level blur (12+).
- **Haze (`dev.chrisbanes.haze`)** — the practical choice for **true backdrop blur**: mark the background with `Modifier.hazeSource(state)` and the glass surface with `Modifier.hazeEffect(state) { … }` (tint, blurRadius, noise). This is the glassmorphic bottom-nav / top-bar pattern.
- **No-blur fallback (pre-12 / perf):** simulate glass with a semi-transparent fill + subtle gradient + a thin light-catching border + shadow (the four glassmorphism properties).

```kotlin
// Haze: blurred glass top bar over scrolling content
val haze = remember { HazeState() }
Box {
  LazyColumn(Modifier.hazeSource(haze)) { /* content */ }
  TopBar(Modifier
    .hazeEffect(haze) { tint = HazeTint(Color.White.copy(alpha = .15f)); blurRadius = 20.dp })
}
```

### "Liquid Glass" on Android = emulation
No `UIGlassEffect` equivalent. Approximate Apple's behaviors (`blur-and-liquid-glass.md`): Haze backdrop blur + `animateColorAsState` tint that responds to content, a gradient edge highlight, a spring scale/bounce on touch, and `animateContentSize`/shared transitions for the morph. Drive it all from one state/`Animatable` so it reads coherently.

## Accessibility & performance
- **Reduce Motion:** respect the system animator scale — `ValueAnimator.areAnimatorsEnabled()`, and check `Settings.Global.ANIMATOR_DURATION_SCALE`; when off/zero, snap or cross-fade instead of large motion.
- Blur/Haze is **GPU-heavy** — bound the blurred area, don't animate huge blurs per frame; prefer `graphicsLayer` transforms over layout where possible.
- Provide the non-blur glass fallback for Android < 12 and low-end devices.

## Checklist
- [ ] `spring(...)` for interactions (interruptible); `tween` for exact-duration; `graphicsLayer` for transforms.
- [ ] `AnimatedVisibility`/`AnimatedContent`/`animateContentSize` for enter-exit/size; `updateTransition`/`Animatable` for coordinated/gesture.
- [ ] Shared element via `SharedTransitionLayout` + `sharedElement`/`sharedBounds`.
- [ ] Glass via **Haze** backdrop blur (not `Modifier.blur`, which blurs own content); fallback = translucent fill + gradient + border + shadow.
- [ ] Liquid Glass emulated (Haze + tint + edge + spring); driven from one state.
- [ ] Reduce-motion / animator-scale honored; blurred areas bounded; pre-12 fallback shipped.
