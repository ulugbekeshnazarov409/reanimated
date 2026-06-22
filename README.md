<div align="center">

# 🌀 reanimated

### A Claude Code skill that makes the agent an expert in **React Native Reanimated** — the UI-thread animation + gesture library for React Native & Expo.

Covers **v2 / v3 / v4** and always writes version-correct code. Worklets, shared values, springs, interpolation, gestures, scroll, layout animations, Reanimated 4 CSS animations, keyboard & navigation motion, frame loops, performance, and the exact-error → fix tables.

Grounded in the official docs: https://docs.swmansion.com/react-native-reanimated/

</div>

---

## ✨ What it is

[`reanimated`](https://github.com/ulugbekeshnazarov409/reanimated) is an [Agent Skill](https://docs.claude.com/en/docs/claude-code/skills) for **Claude Code**. When you ask Claude to build or debug a React Native animation, this skill loads deep, version-aware references so the output is smooth (60/120fps, on the UI thread), idiomatic, and correct for the Reanimated version your project actually uses.

It's the **implementation** companion to the [`mobile-design`](https://github.com/ulugbekeshnazarov409/mobile-design) skill:

| Skill | Question it answers |
| --- | --- |
| 🎨 `mobile-design` | **What** to animate — feel, timing, choreography (Design Architect) |
| 🌀 `reanimated` | **How** to animate it — `withSpring`, worklets, gestures (Motion Engineer) |

---

## 🎯 Why it exists

AI gets Reanimated wrong in predictable ways: forgets the Babel plugin, reads `.value` during render, calls JS from a worklet without `runOnJS`, mutates objects in place, mixes v3 and v4 API names, animates layout props instead of transforms, never cancels loops. This skill encodes the correct mental model + the fixes for every one of those.

---

## 🚀 Install

A skill is a folder under `~/.claude/skills/`. Clone it there:

```bash
git clone https://github.com/ulugbekeshnazarov409/reanimated.git \
  ~/.claude/skills/reanimated
```

**Windows (PowerShell):**
```powershell
git clone https://github.com/ulugbekeshnazarov409/reanimated.git `
  "$env:USERPROFILE\.claude\skills\reanimated"
```

Open Claude Code — the skill activates automatically when your request is about Reanimated (or any of its APIs). No build step.

---

## 🧠 The mental model it enforces

Reanimated's whole design follows from one idea: **animations run on the UI thread via worklets.**

- **Two threads** — JS (your React code) and UI (renders frames). Animation work goes on the UI thread so a busy JS thread doesn't drop frames.
- **Worklets** — small JS functions that run on the UI thread (auto-marked by the Babel/worklets plugin).
- **Shared values** (`useSharedValue`) — reactive state read/written via `.value`; changing it re-runs dependent worklets.
- **Crossing threads** — `runOnJS` / `scheduleOnRN` (v4) to call JS from a worklet; `runOnUI` / `scheduleOnUI` the other way.

Plus 7 non-negotiable rules (plugin last, never read `.value` in render, never call JS from a worklet directly, reassign objects, one source of truth, cancel on unmount, stable closures).

---

## 📚 What's inside

SKILL.md + **33 reference files**, loaded on demand (progressive disclosure — the agent opens only the 1–3 it needs per task, so a small always-loaded `SKILL.md` keeps token cost low while depth stays one hop away):

```
reanimated/
├── SKILL.md
└── references/
    ├── installation-and-setup.md      # Babel/worklets plugin, New Arch, GestureHandlerRootView
    ├── version-guide.md               # v2 → v3 → v4 differences (renames, removals)
    ├── version-decision-tree.md       # Which version am I on? → which API to write
    ├── core-concepts.md               # Worklets, threads, runOnJS/runOnUI, gotchas
    ├── shared-values.md               # useSharedValue, .value rules, modify()
    ├── animated-styles.md             # useAnimatedStyle/Props/DerivedValue/Ref, measure
    ├── animation-functions.md         # withTiming/Spring/Decay + modifiers + callbacks
    ├── easing-and-springs.md          # Easing + spring presets (snappy/gentle/bouncy/heavy)
    ├── interpolation.md               # interpolate, Extrapolation, interpolateColor, clamp
    ├── scroll-and-reactions.md        # useScrollOffset, useAnimatedScrollHandler, useAnimatedReaction
    ├── gestures.md                    # RNGH Gesture API + composition + velocity hand-off
    ├── layout-animations.md           # entering/exiting/layout, Keyframe, FlatList
    ├── shared-element-transitions.md  # tag-based shared elements
    ├── css-animations-v4.md           # Reanimated 4 CSS animations/transitions
    ├── keyboard-and-input-motion.md   # useAnimatedKeyboard, composer lift, sticky CTA
    ├── navigation-animations.md       # Navigation overview: Reanimated × React Navigation / Expo Router
    ├── react-navigation-transitions.md # Deep: native-stack presets vs JS-stack cardStyleInterpolator/transitionSpec
    ├── expo-router-transitions.md      # Expo Router route animations, modals/sheets, custom transitions
    ├── frame-loops-and-realtime.md    # useFrameCallback — game loops, physics, scrubbers
    ├── advanced-runtimes.md           # createWorkletRuntime, off-UI-thread computation (expert)
    ├── patterns-recipes.md            # 11 production recipes (swipe-delete, parallax, sheet, shimmer…)
    ├── buttons-and-microinteractions.md # Press/loading/success morphs, toggle, like burst, FAB, ripple
    ├── cards.md                       # Press & lift, swipe stack, expand-to-detail, 3D flip, tilt
    ├── overlays-and-modals.md         # Modal, alert, action sheet, drawer, dropdown, tooltip, toast
    ├── inputs-and-indicators.md       # Slider, carousel/pager + dots, dropdown, stepper, badge, progress
    ├── screen-choreography.md         # Whole-screen orchestration: staggered reveal, state continuity, interruptibility
    ├── custom-animations.md           # Build bespoke effects from primitives when no preset fits
    ├── native-interop.md              # Animate native/third-party props; when (& how) to drop to native code
    ├── typescript-and-clean-code.md   # Team-grade typing, reusable hooks, clean-code rules
    ├── performance.md                 # 60/120fps, transforms over layout, runOnJS hygiene
    ├── troubleshooting.md             # exact error → fix tables
    ├── testing.md                     # jest mock + patterns
    └── api-reference.md               # full hook/function index + v4 deltas
```

---

## 💬 Example prompts

```
Build a swipe-to-delete row in React Native with Reanimated + gesture-handler.
```
```
Make a collapsing parallax header that fades the title into the nav bar on scroll.
```
```
My chat composer doesn't move with the keyboard — fix it with useAnimatedKeyboard.
```
```
I'm getting "Reanimated failed to create a worklet" — what's wrong?
```
```
Animate the balance number rolling up, with tabular figures. We're on Reanimated 4.
```
```
Make this submit button morph into a spinner, then draw a success checkmark.
```
```
Build a Tinder-style swipeable card stack with rotation and velocity throw.
```
```
Choreograph this screen's entrance — stagger the sections and cross-fade the skeleton into content.
```
```
No preset fits — build a custom magnetic snap animation from scratch.
```
```
Animate a prop on my custom native chart view at 120fps.
```
```
Build a swipe-to-dismiss toast that auto-hides and stacks cleanly.
```
```
Make a carousel where the centered card scales up and the pagination dot widens.
```
```
Animate this side drawer to open on edge-swipe with a fading backdrop.
```

---

## 🔧 Version-aware by design

Most live apps are on **v3**; new Expo SDK 54+ apps are on **v4** (New Architecture, separate `react-native-worklets` package, CSS animations, renamed APIs). The skill detects which from `package.json` and writes the correct API — never mixing v3 and v4 names.

---

## 🤝 Contributing

Issues / PRs welcome — more recipes, framework integrations, version notes. Keep examples on the UI thread, version-correct, and minimal.

## 📄 License

MIT.

<div align="center">

**Built for [Claude Code](https://claude.com/claude-code).** Smooth at 120fps.

</div>
