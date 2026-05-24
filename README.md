# 🎯 Neon Darts VR

A holodeck-style VR darts game built with [IWSDK](https://iwsdk.dev) (Immersive Web SDK). Play classic darts in a glowing neon arena — works in VR headsets and desktop browsers.

🔗 **[Play Live](https://ellyz2426.github.io/neon-darts/)**

## Features

### 🎮 5 Game Modes
- **501** — Count down from 501, finish on a double. Checkout calculator shows optimal finish routes.
- **Cricket** — Close 15–20 and bulls. Score on your opponent's open numbers. Live scoreboard tracks marks.
- **Around the Clock** — Hit 1 through 20 in sequence.
- **Shanghai** — Score only on the round number. Hit single + double + triple for an instant win!
- **Free Practice** — Throw freely with running averages. No opponent, no pressure.

### 🤖 AI Opponent
- 3 difficulty levels: Easy, Medium, Hard
- Strategic targeting per mode (T20 setup, cricket priority, etc.)

### 👥 Multiplayer
- **VS CPU** — Challenge the AI at any difficulty
- **VS Friend** — Local 2-player mode with turn alternation

### 🎨 Visual Design
- Holodeck neon environment: glowing grid floor/ceiling, ambient particles, wireframe decorations
- Accurate dartboard geometry with segment numbers and glowing wire dividers
- Neon dart trails with skin-specific colors
- Hit particle effects colored by multiplier
- 6 dart skins: Neon Classic, Inferno, Frost Bite, Golden Arrow, Phantom, Toxic Surge

### 📊 Tracking & Progress
- 20 achievements (bullseye, 180, hat trick, streaks, and more)
- Persistent statistics (games, wins, accuracy, triples, doubles, best turn, etc.)
- Leaderboard with top 50 results
- Throw history HUD showing current turn's darts
- Combo system with streak feedback

### 🎧 Audio
- Procedural Web Audio: throw whoosh, board thud, score chimes, miss thud
- Game start/end fanfares, achievement arpeggio, turn change pips
- Ambient drone (55Hz sine + triangle pad + LFO)
- Volume controls: Master, SFX, Music

### 🕶️ XR + Browser
- Full VR controller support: right trigger charge/release, controller aim, B pause
- Browser fallback: mouse aim, left-click charge/release, ESC pause
- Dual-runtime: works in VR headsets and desktop/mobile browsers

## Controls

| Action | VR | Browser |
|--------|----|----- ---|
| Aim | Point controller at board | Move mouse |
| Charge | Hold right trigger | Hold left click |
| Throw | Release trigger | Release click |
| Pause | B button | ESC key |

## Spatial UI

All UI is built with IWSDK PanelUI — 17 `.uikitml` spatial panels, zero HTML DOM overlays. Menus, HUDs, scoreboards, and settings all render correctly in XR.

## Tech Stack

- **IWSDK 0.4.1** — WebXR framework
- **PanelUI / UIKit** — Spatial UI system
- **Procedural Web Audio API** — All sounds generated at runtime
- **Three.js** (via @iwsdk/core) — 3D rendering

## Build

```bash
npm install
npm run build    # Production build → dist/
npm run dev      # Development server with IWSDK CLI
```

## Project Structure

```
src/
  index.ts         — Main entry, input handling, game loop
  game.ts          — Game state machine, rules for 5 modes
  dartboard.ts     — Board geometry, scoring math, number labels
  darts.ts         — Dart throwing, flight physics, trails
  ai.ts            — AI opponent targeting and noise model
  ui.ts            — 17 PanelUI panels, all game UI
  audio.ts         — Procedural Web Audio manager
  achievements.ts  — 20 achievements with persistence
  stats.ts         — Statistics tracking with localStorage
  effects.ts       — Hit particle system
  checkout.ts      — 501 checkout route calculator
  skins.ts         — 6 dart skin definitions and manager
  combo.ts         — Combo/streak tracking system
  environment.ts   — Holodeck neon environment
ui/
  17 .uikitml templates (title, modeselect, difficulty, hud, power,
  throwhistory, checkout, cricket, announce, pause, gameover,
  leaderboard, achievements, settings, help, stats, message)
```

## Build Stats

- **Round 1**: 24 files, 3,023 lines — core game with 4 modes, AI, VR controls, 13 panels
- **Round 2**: 28+ files, 5,800+ lines — practice mode, VS friend, cricket scoreboard, checkout calculator, dart skins, combo system, number labels, 17 panels

---

Built with IWSDK 0.4.1 by [ellyz2426](https://github.com/ellyz2426)
