# Secret of the Tidal Door

A **Nintendo Switch–style** top-down ocean adventure (Three.js diorama look) for grade-school and middle-school kids.

Collect **12 clues** across the seas and find the **Rainbow Coral**.

## Play online (iPad / phone / laptop)

**https://akmonroe.github.io/secret-of-the-tidal-door/**

Open that link in Safari on an iPad (touch controls work). Landscape is best.

Repo: https://github.com/akmonroe/secret-of-the-tidal-door

## Stack

- **Vite + TypeScript + Three.js** (stylized low-poly / toon materials)
- Keyboard + touch controls
- Storyboard: `docs/STORYBOARD.md`
- Graphics guide: `docs/GRAPHICS_BIBLE.md`

Legacy Phaser prototype kept in `src/phaser-legacy/` (not built).

## Play

```bash
export NVM_DIR="$HOME/.nvm" && . "$NVM_DIR/nvm.sh"
cd ~/ai-coding/ipad-game-development
npm install
npm run dev
```

- Laptop: http://localhost:5173/
- Phone (same Wi‑Fi): use the Network URL Vite prints

## Controls

| Input | Action |
|-------|--------|
| WASD / Arrows | Move |
| Space / Shift | Dodge jump |
| Touch | Left drag = stick · Right **JUMP DODGE** |

## Current build (4 of 12 seas)

Maps are **much wider** with varied start directions:
- L1 → travel **EAST** (west beach → house)
- L2 → travel **WEST** (east halls → secret chamber)
- L3 → travel **SOUTH** (north reef → BREATH)
- L4 → travel **NORTH-EAST** (SW wreck → cabin)


| Level | Region | Clue |
|-------|--------|------|
| 1 | Sunset Beach (expanded maze) | SUN |
| 2 | Stilt House Aviary (corridor maze + birds) | SALT |
| 3 | First Descent (scuba reef maze) | BREATH |
| 4 | Wreck of the Amber Gull | GOLD |
| 5–12 | Storyboarded — longer biomes next | … → Rainbow Coral |

Progress auto-continues after each clue. Maps will keep growing for longer play.

## Build / deploy

```bash
npm run build
# host dist/ on Cloudflare Pages, Netlify, GitHub Pages, etc.
```
