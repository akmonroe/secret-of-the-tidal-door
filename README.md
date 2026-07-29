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

## Current build (12 of 12 seas)

Maps grow larger each level. Start direction changes so kids learn the compass:

| Level | Region | Go | Clue | Specials |
|-------|--------|-----|------|----------|
| 1 | Sunset Beach | EAST | SUN | sharks, gates |
| 2 | Stilt House Aviary | WEST | SALT | birds, crates |
| 3 | First Descent | SOUTH | BREATH | scuba |
| 4 | Wreck of the Amber Gull | NE | GOLD | bulkheads |
| 5 | Emerald Kelp Forest | EAST | GREEN | currents, sea lions |
| 6 | Ice Shelf Labyrinth | WEST | WHITE | currents, ice gates |
| 7 | Midnight Vent Gardens | SOUTH | BLACK | **thermal vents** |
| 8 | Silver Current Raceway | NORTH | SILVER | strong currents, **lethal marlin** |
| 9 | Coral Stair City | WEST | PURPLE | vents + **lethal angler** |
| 10 | Storm-Churn Shoals | SE | STORM | waves, vents, marlins |
| 11 | Mirror Grotto | NORTH | MIRROR | false mirror path, anglers |
| 12 | Eye of the Lagoon | NE spiral | RAINBOW | finale guardians |

**Danger key:** blue arrows = currents · orange plumes = vents (pulse — cross when dim) · marlin/angler = **one-hit** in late seas.

Progress auto-continues after each clue.

## Build / deploy

```bash
npm run build
# host dist/ on Cloudflare Pages, Netlify, GitHub Pages, etc.
```
