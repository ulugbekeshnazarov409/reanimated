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

SKILL.md + **23 reference files**, loaded on demand:

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
    ├── navigation-animations.md       # React Navigation / Expo Router transitions, tabs, shared elements
    ├── frame-loops-and-realtime.md    # useFrameCallback — game loops, physics, scrubbers
    ├── advanced-runtimes.md           # createWorkletRuntime, off-UI-thread computation (expert)
    ├── patterns-recipes.md            # 11 production recipes (swipe-delete, parallax, sheet, shimmer…)
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
