# SwiftUI & UIKit (Swift) — native animation + Liquid Glass

When the project is **native iOS (Swift)**, apply the same senior motion bar — spring physics, interruptibility, hero continuity, Apple's Liquid Glass model (`blur-and-liquid-glass.md` for the design ground truth) — using SwiftUI/UIKit's own tools. Native is where Liquid Glass is *first-class*: `glassEffect` is the real material, not an emulation.

---

## SwiftUI animation model

- **Implicit:** `withAnimation { state = … }` animates any view that depends on the changed state; or `.animation(_:value:)` on a view.
- **Springs (prefer these):** `.spring(response:dampingFraction:)`, or the iOS 17+ presets `.smooth`, `.snappy`, `.bouncy`. Springs are interruptible by default — re-triggering mid-flight continues from the current value/velocity (the senior default).
- **Curves:** `.easeOut`, `.easeInOut`, `.linear`, `.timingCurve(...)`. Enter = ease-out, exit = ease-in.
- **Transitions:** `.transition(.move(edge:).combined(with: .opacity))`, `.asymmetric(insertion:removal:)` for views added/removed.
- **Hero / shared element:** `matchedGeometryEffect(id:in:)` with `@Namespace` — moves a view smoothly between two layouts (the native version of `cards.md` expand-to-detail).
- **Multi-step:** `PhaseAnimator` (cycles a sequence of phases automatically — pulse, attention) and `KeyframeAnimator` (independent multi-track timelines, mixing spring/linear/cubic per property). iOS 17/18+.
- **Custom:** conform to `Animatable` / use a `GeometryEffect` for bespoke effects.

```swift
@State private var expanded = false
@Namespace private var ns

withAnimation(.snappy) { expanded.toggle() }              // interruptible spring
.matchedGeometryEffect(id: "hero", in: ns)               // shared-element morph
.transition(.scale.combined(with: .opacity))             // insertion/removal
```

## Liquid Glass in SwiftUI (iOS 26 — the real thing)

```swift
// a glass control
Button("Play") { … }
  .glassEffect(.regular.tint(.blue).interactive())       // Regular/Clear, selective tint, scale+bounce+shimmer

// morphing group: shapes merge/split as layout changes
@Namespace private var glassNS
GlassEffectContainer(spacing: 24) {
  ForEach(items) { item in
    ItemView(item)
      .glassEffect()
      .glassEffectID(item.id, in: glassNS)               // matched-geometry morph between glass shapes
  }
}
// merge several into one: .glassEffectUnion(id:namespace:)
// concentric corners: RoundedRectangle(cornerRadius: .containerConcentric)
```
- **Regular vs Clear**, floating-plane separation, scroll edge effect, interactivity, flex-to-thicker, concentricity, selective tint, accessibility — the model in `blur-and-liquid-glass.md` applies verbatim; here it's native.
- **Morph transitions:** `GlassEffectTransition.matchedGeometry` drives the fluid merge/split when glass views are added/removed in a container; `spacing` + shape geometry decide what morphs.

## UIKit (Swift)

- **Animation:** `UIView.animate(withDuration:delay:usingSpringWithDamping:initialSpringVelocity:)` or the interruptible, scrubbable `UIViewPropertyAnimator` (pause/reverse/`fractionComplete` — good for gesture-driven). `CADisplayLink` for per-frame; Core Animation (`CABasicAnimation`/`CAKeyframeAnimation`) for layer work.
- **Blur:** `UIVisualEffectView` + `UIBlurEffect(style:)` (`.systemUltraThinMaterial`…), `UIVibrancyEffect` for legible content over it.
- **Liquid Glass (iOS 26):** create a `UIVisualEffectView` with a **`UIGlassEffect`**; customize shape, appearance, tint; it's the interactive floating layer above content.

```swift
let glass = UIGlassEffect()
glass.tintColor = .systemBlue
let view = UIVisualEffectView(effect: glass)             // iOS 26 Liquid Glass on a custom view
```

## Accessibility & performance
- **Reduce Motion:** `@Environment(\.accessibilityReduceMotion)` (SwiftUI) / `UIAccessibility.isReduceMotionEnabled` — drop large transforms/morphs, cross-fade instead.
- **Reduce Transparency / Increase Contrast:** glass adapts automatically, but verify legibility; raise opacity/contrast for custom glass.
- **Limit concurrent glass** (Apple) — few `GlassEffectContainer`s; group with one container over many separate effects.

## Checklist
- [ ] Springs (`.snappy`/`.smooth`/custom) for interactions; interruptible by default; enter=ease-out / exit=ease-in for timed motion.
- [ ] Shared element via `matchedGeometryEffect`; multi-step via `Phase`/`KeyframeAnimator`.
- [ ] Liquid Glass via `.glassEffect` (Regular/Clear, `.interactive()`, selective tint), morph via `GlassEffectContainer` + `glassEffectID`; concentric corners.
- [ ] UIKit: `UIViewPropertyAnimator` for gesture/scrub; `UIGlassEffect` on `UIVisualEffectView` for glass.
- [ ] Reduce Motion / Transparency honored; concurrent glass limited.
