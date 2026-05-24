# Neon Darts VR

Holodeck-themed precision darts game built with [IWSDK](https://iwsdk.dev) 0.4.1. Play classic dart games in VR or in your browser.

**[Play Live](https://ellyz2426.github.io/neon-darts/)**

## Game Modes

- **501** — Count down from 501 to zero. Must finish on a double or bullseye.
- **Cricket** — Close numbers 15–20 and bulls. Score points on open numbers.
- **Around the Clock** — Hit 1 through 20 in sequence.
- **Shanghai** — Score only on the round number. Hit single + double + triple in one turn for instant win!

## Features

- Standard dartboard with accurate scoring zones (singles, doubles, triples, inner/outer bull)
- AI opponent with 3 difficulty levels (Easy, Medium, Hard)
- Charge-and-release throw mechanic with power bar
- VR controller support (trigger throw, laser pointer aim)
- Browser fallback (mouse aim, click-hold throw)
- 13 PanelUI spatial UI templates (zero HTML DOM)
- Head-following HUD with score, round, darts remaining
- 20 achievements with toast notifications
- Leaderboard and comprehensive stats tracking
- Procedural Web Audio (throw whoosh, board hit, score chimes, ambient drone)
- Particle hit effects
- Holodeck neon environment (grid floor/ceiling, floating wireframe decorations)
- Dual runtime (XR + browser)

## Controls

### Browser
| Action | Control |
|--------|---------|
| Aim | Mouse |
| Charge throw | Left click + hold |
| Throw | Release click |
| Pause | ESC |

### VR
| Action | Control |
|--------|---------|
| Aim | Point controller |
| Charge throw | Right trigger hold |
| Throw | Release trigger |
| Pause | B button |
| Confirm | A button |

## Tech Stack

- IWSDK 0.4.1 (WebXR framework)
- TypeScript + Vite
- PanelUI spatial UI system (.uikitml templates)
- Web Audio API (procedural sound)
- Dual runtime: VR headset + browser

## Project Structure

```
src/
  index.ts        — Entry point, world setup, input handling
  dartboard.ts    — Board geometry, scoring math
  darts.ts        — Dart creation, flight, collision
  game.ts         — Game modes, state machine, rules engine
  ai.ts           — AI opponent targeting and noise
  audio.ts        — Procedural Web Audio effects
  environment.ts  — Holodeck environment setup
  effects.ts      — Particle effects
  ui.ts           — PanelUI manager (all panels)
  stats.ts        — Statistics tracker (localStorage)
  achievements.ts — 20 achievements system
ui/
  title.uikitml, modeselect.uikitml, difficulty.uikitml,
  hud.uikitml, power.uikitml, pause.uikitml, gameover.uikitml,
  leaderboard.uikitml, achievements.uikitml, settings.uikitml,
  help.uikitml, stats.uikitml, message.uikitml
```

## Build Stats

- 11 TypeScript source files
- 13 .uikitml spatial UI templates
- Zero HTML DOM UI elements
- 20 achievements
- 4 game modes
- 3 AI difficulty levels
- Procedural audio (12+ SFX + ambient drone)

## Development

```bash
npm run dev     # Start dev server
npm run build   # Production build
```

## License

Built with IWSDK. For demo/portfolio purposes.
