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

Pick any method — all drop the skill into `~/.claude/skills/reanimated`. Then open Claude Code; it **auto-activates** whenever your request is about Reanimated. No build step.

### `npx skills` (the [skills.sh](https://skills.sh) CLI — recommended)
```bash
npx skills add ulugbekeshnazarov409/reanimated
```
GitHub is the registry — installing this way also surfaces the skill on **skills.sh** automatically.

### curl (one-liner)
```bash
curl -fsSL https://raw.githubusercontent.com/ulugbekeshnazarov409/reanimated/main/install.sh | bash
```
Re-run anytime to update. Override the target with `CLAUDE_SKILLS_DIR=…` or a ref with `REANIMATED_SKILL_REF=…`.

### npm
```bash
npx reanimated-claude-skill          # copies the skill into ~/.claude/skills
# or, after a global install:
npm i -g reanimated-claude-skill && reanimated-claude-skill
```

### Claude Code plugin (marketplace)
```text
/plugin marketplace add ulugbekeshnazarov409/reanimated
/plugin install reanimated@reanimated
```

### git clone (manual)
```bash
git clone https://github.com/ulugbekeshnazarov409/reanimated.git ~/.claude/skills/reanimated
```
**Windows (PowerShell):**
```powershell
git clone https://github.com/ulugbekeshnazarov409/reanimated.git `
  "$env:USERPROFILE\.claude\skills\reanimated"
```

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

SKILL.md + **39 reference files**, loaded on demand (progressive disclosure — the agent opens only the 1–3 it needs per task, so a small always-loaded `SKILL.md` keeps token cost low while depth stays one hop away):

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
    ├── blur-and-liquid-glass.md       # expo-blur, animated iOS 26 Liquid Glass + cross-platform smart glass (Android via Skia)
    ├── device-motion-sensors.md       # useAnimatedSensor: tilt parallax, gravity, gyroscope, shake
    ├── web-and-platform-support.md    # Web caveats, which props animate, 120fps, platform specifics
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
    ├── api-reference.md               # full hook/function index + v4 deltas
    ├── swiftui-and-swift.md           # Native iOS: SwiftUI/UIKit animation + native Liquid Glass
    ├── jetpack-compose-and-kotlin.md  # Native Android: Compose animation + Haze glassmorphism
    └── flutter-and-dart.md            # Flutter: animation + BackdropFilter blur + Liquid Glass packages
```

The last three are **cross-framework companions**: when the project is native iOS (Swift), native Android (Kotlin/Compose), or Flutter instead of React Native, they carry the same senior motion bar + Apple Liquid Glass model into that stack.

---

## 🗺️ Official-docs coverage

Mirrors the [official Reanimated docs](https://docs.swmansion.com/react-native-reanimated/) sidebar so nothing falls through the cracks:

| Docs section | Covered by |
| --- | --- |
| Fundamentals (getting started, installation, glossary, your first animation) | `installation-and-setup`, `core-concepts`, `version-guide`, `version-decision-tree` |
| Core (`useSharedValue`, `useAnimatedStyle/Props/Ref/DerivedValue/Reaction`, `useFrameCallback`, `measure`) | `shared-values`, `animated-styles`, `frame-loops-and-realtime` |
| Animations (`withTiming/Spring/Decay/Delay/Sequence/Repeat/Clamp`, `Easing`) | `animation-functions`, `easing-and-springs` |
| Scroll (`useAnimatedScrollHandler`, `useScrollOffset`) | `scroll-and-reactions` |
| Layout Animations (entering/exiting, list, transitions incl. Curved/EntryExit, Keyframe, custom, `LayoutAnimationConfig`) | `layout-animations`, `custom-animations` |
| Shared Element Transitions | `shared-element-transitions` |
| Device (`useAnimatedSensor`, `useAnimatedKeyboard`, `useReducedMotion`, `ReducedMotionConfig`) | `device-motion-sensors`, `keyboard-and-input-motion` |
| CSS Animations & Transitions (v4) | `css-animations-v4` |
| Threading / Worklets (`runOnJS/UI`, `scheduleOnRN/UI`, runtimes) | `core-concepts`, `advanced-runtimes` |
| Guides (performance, web support, supported properties, testing, troubleshooting, migration, compatibility) | `performance`, `web-and-platform-support`, `testing`, `troubleshooting`, `version-guide` |
| Gestures (react-native-gesture-handler integration) | `gestures` |

Plus senior-level material the docs don't ship: component recipes (`buttons-and-microinteractions`, `cards`, `overlays-and-modals`, `inputs-and-indicators`), `screen-choreography`, `blur-and-liquid-glass` (frosted/glass UI + iOS 26 Liquid Glass), `native-interop`, and `typescript-and-clean-code`.

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
```
Add an animated iOS 26 Liquid Glass card that morphs on press, with an Android Skia-glass fallback.
```
```
Make the nav bar frost in as the user scrolls (blur intensity 0→100).
```

---

## 🔧 Version-aware by design

Most live apps are on **v3**; new Expo SDK 54+ apps are on **v4** (New Architecture, separate `react-native-worklets` package, CSS animations, renamed APIs). The skill detects which from `package.json` and writes the correct API — never mixing v3 and v4 names.

---

## 📈 Get it discovered (climb the rankings)

skills.sh ranks by install telemetry, and the Claude plugin directories favor clear metadata + activity. To get this skill to the top:

1. **Drive real installs.** The `npx skills add …` one-liner is what feeds skills.sh ranking — put it first in the README, share it, and pin it in the repo description.
2. **Sharp frontmatter & keywords.** `SKILL.md`'s `name`/`description` and the `keywords` in `package.json` / `.claude-plugin/*.json` are the search surface — keep them specific (already tuned for Reanimated triggers).
3. **Set GitHub repo topics:** `claude-code`, `claude-skill`, `agent-skills`, `react-native`, `reanimated`, `expo`, `animation` — and a one-line description with the install command.
4. **List on community marketplaces & directories:** open a PR/submission to [anthropics/claude-plugins-official](https://github.com/anthropics/claude-plugins-official), [claudemarketplaces.com](https://claudemarketplaces.com), tonsofskills.com, and lobehub's skills directory. Each links back and adds installs.
5. **Publish to npm** (`npm publish`) so `npx reanimated-claude-skill` works and the package shows up in npm search under the keywords above.
6. **Stars & proof.** A clear README (badges, GIFs of the recipes), example prompts, and version-correctness are what convert a listing view into an install and a star.

## 🤝 Contributing

Issues / PRs welcome — more recipes, framework integrations, version notes. Keep examples on the UI thread, version-correct, and minimal.

## 📄 License

MIT.

<div align="center">

**Built for [Claude Code](https://claude.com/claude-code).** Smooth at 120fps.

</div>
