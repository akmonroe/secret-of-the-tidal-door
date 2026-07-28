import type { ClueId } from "../progress/state";
import type { HazardKind } from "../entities3d/Hazard";
import type { MovingObstacleDef } from "../entities3d/MovingObstacle";
import { LEVEL1_MAP } from "./level1Map";
import { LEVEL2_MAP } from "./level2Map";
import { LEVEL3_MAP } from "./level3Map";
import { LEVEL4_MAP } from "./level4Map";
import { refineMap } from "./mapRefine";

export type HazardSpawn = {
  kind: HazardKind;
  c: number;
  r: number;
  /** World units per second */
  speed?: number;
  axis?: "x" | "z" | "diag";
};

export type LevelDef = {
  id: number;
  key: string;
  title: string;
  biome: string;
  storyBefore: { title: string; body: string };
  map: string[];
  clue: ClueId;
  clueText: string;
  scuba: boolean;
  hazards: HazardSpawn[];
  /** Sliding gates — timing challenges (place on OPEN cells, not walls) */
  movers?: MovingObstacleDef[];
  objective: string;
  hint: string;
};

/**
 * Difficulty design (kid-friendly, mildly hard, timing-sensitive):
 * - L1 teach: slow readable gates, sparse slow animals
 * - L2 halls: staggered crate rhythm + medium birds
 * - L3 reef: scuba + coral chokes, medium density
 * - L4 wreck: corridor gates on every major lane, densest but fair i-frames
 *
 * Mover rule: centers must sit on walkable corridors so they never permanently
 * seal spawn or clue tiles. Speeds ~1.6–2.4 with travel 4–6 give ~4–8s cycles.
 *
 * Coords are on the refined (2×) grid — place on OPEN cells only.
 * Chase is short-range + brief burst (see Hazard); patrol speeds stay under
 * player walk (~6.5) / swim (~4.2) so timing + dodge wins.
 */
export const LEVELS: LevelDef[] = [
  {
    id: 1,
    key: "level1",
    title: "Sunset Beach",
    biome: "beach",
    storyBefore: {
      title: "Level 1 — Sunset Beach",
      body:
        "Locals whisper about the Rainbow Coral — found only by gathering clues from every sea.\n\n" +
        "Your first clue waits at a secret house on stilts far across the water.\n" +
        "Cross the beach, swim the rock maze, dodge sharks — and watch for drifting debris gates.",
    },
    map: refineMap(LEVEL1_MAP, 1),
    clue: "SUN",
    clueText: "Begin where light first touches sand.",
    scuba: false,
    objective: "Reach the stilt house · Clue SUN",
    hint: "Stay on the map — falling off the edge ends your adventure! Watch yellow gates.",
    hazards: [
      // Water maze patrols — learnable speeds, not a swarm
      { kind: "shark", c: 20, r: 28, speed: 1.75, axis: "x" },
      { kind: "shark", c: 44, r: 20, speed: 1.7, axis: "z" },
      { kind: "shark", c: 32, r: 14, speed: 1.85, axis: "x" },
      { kind: "jelly", c: 12, r: 24, speed: 1.1, axis: "z" },
      { kind: "jelly", c: 40, r: 26, speed: 1.15, axis: "x" },
      { kind: "jelly", c: 28, r: 8, speed: 1.05, axis: "diag" },
      { kind: "ray", c: 36, r: 22, speed: 1.5, axis: "x" },
      { kind: "ray", c: 16, r: 16, speed: 1.45, axis: "z" },
    ],
    movers: [
      // First lesson: open water just north of the beach (clear of spawn & rocks)
      { c: 28, r: 42, axis: "x", travel: 5.5, speed: 1.65, phase: 0.15, color: 0x8b7355, width: 2.0, depth: 1.3 },
      // Mid maze — staggered phases so two gates rarely close together
      { c: 24, r: 28, axis: "x", travel: 5, speed: 1.85, phase: 0.0, color: 0x8b7355, width: 2.1, depth: 1.35 },
      { c: 40, r: 22, axis: "z", travel: 4.5, speed: 1.7, phase: 0.4, color: 0x6b705c, width: 1.4, depth: 2.1 },
      { c: 20, r: 14, axis: "x", travel: 4.5, speed: 2.0, phase: 0.65, color: 0x8b7355, width: 2.0, depth: 1.3 },
      // Approach house — slower, readable before clue
      { c: 32, r: 8, axis: "z", travel: 4, speed: 1.55, phase: 0.25, color: 0x5c6b4a, width: 1.35, depth: 2.2 },
    ],
  },
  {
    id: 2,
    key: "level2",
    title: "Stilt House Aviary",
    biome: "house",
    storyBefore: {
      title: "Level 2 — Birds of the Hidden Door",
      body:
        "Inside the house, salt air and creaking wood fill long halls.\n\n" +
        "Pelicans and gulls patrol the corridors — they turn at walls.\n" +
        "Sliding crates block passages on a rhythm. Time your dash for the SALT clue.",
    },
    map: refineMap(LEVEL2_MAP, 2),
    clue: "SALT",
    clueText: "Cross the house that walks on water.",
    scuba: false,
    objective: "Find the secret chamber · Clue SALT",
    hint: "Wider halls! Birds may chase briefly — time crate gaps, then dash.",
    hazards: [
      // Lower density near spawn (south); denser mid/north — mild bird speeds
      { kind: "pelican", c: 20, r: 56, speed: 1.9, axis: "x" },
      { kind: "pelican", c: 30, r: 50, speed: 1.85, axis: "z" },
      { kind: "pelican", c: 38, r: 34, speed: 2.0, axis: "x" },
      { kind: "pelican", c: 44, r: 24, speed: 1.9, axis: "z" },
      { kind: "gull", c: 32, r: 60, speed: 2.35, axis: "x" },
      { kind: "gull", c: 50, r: 42, speed: 2.45, axis: "z" },
      { kind: "gull", c: 20, r: 30, speed: 2.3, axis: "z" },
      { kind: "gull", c: 36, r: 18, speed: 2.4, axis: "x" },
      { kind: "gull", c: 28, r: 10, speed: 2.35, axis: "diag" },
    ],
    movers: [
      // OPEN halls only (r32, r30, r23, r21, r17) — never wall rows
      { c: 32, r: 64, axis: "x", travel: 5, speed: 1.75, phase: 0.0, color: 0x8b5a2b, width: 1.7, depth: 1.15, height: 1.2 },
      { c: 24, r: 60, axis: "x", travel: 4.5, speed: 1.9, phase: 0.45, color: 0xa67c52, width: 1.7, depth: 1.15, height: 1.2 },
      { c: 32, r: 46, axis: "x", travel: 6, speed: 2.0, phase: 0.2, color: 0x8b5a2b, width: 1.8, depth: 1.15, height: 1.2 },
      { c: 36, r: 34, axis: "x", travel: 4.5, speed: 2.1, phase: 0.7, color: 0xa67c52, width: 1.7, depth: 1.15, height: 1.2 },
      // Horizontal pinch on open mid-hall (was wall cell)
      { c: 34, r: 42, axis: "x", travel: 4, speed: 1.85, phase: 0.35, color: 0x8b5a2b, width: 1.7, depth: 1.15, height: 1.2 },
    ],
  },
  {
    id: 3,
    key: "level3",
    title: "First Descent",
    biome: "reef",
    storyBefore: {
      title: "Level 3 — Scuba Under the Sea",
      body:
        "The Tidal Door opens onto racks of scuba gear!\n\n" +
        "Coral mazes and drifting stone slabs force careful timing.\n" +
        "Sea creatures patrol lanes and bounce off coral walls.",
    },
    map: refineMap(LEVEL3_MAP, 1),
    clue: "BREATH",
    clueText: "Wear the tank that drinks the deep.",
    scuba: true,
    objective: "Scuba dive · reach Clue BREATH",
    hint: "Sharks hunt nearby divers. Use wider coral lanes and gate timing.",
    hazards: [
      { kind: "shark", c: 20, r: 40, speed: 1.9, axis: "x" },
      { kind: "shark", c: 42, r: 30, speed: 1.85, axis: "z" },
      { kind: "shark", c: 32, r: 20, speed: 2.0, axis: "x" },
      { kind: "shark", c: 14, r: 14, speed: 1.8, axis: "z" },
      { kind: "jelly", c: 28, r: 48, speed: 1.2, axis: "diag" },
      { kind: "jelly", c: 52, r: 36, speed: 1.25, axis: "x" },
      { kind: "jelly", c: 24, r: 24, speed: 1.15, axis: "z" },
      { kind: "ray", c: 34, r: 42, speed: 1.65, axis: "z" },
      { kind: "ray", c: 10, r: 26, speed: 1.6, axis: "x" },
      { kind: "ray", c: 48, r: 20, speed: 1.7, axis: "z" },
    ],
    movers: [
      // Open channels (not solid coral / rock cells)
      { c: 36, r: 64, axis: "x", travel: 5, speed: 1.7, phase: 0.1, color: 0x4a6741, width: 1.9, depth: 1.25, height: 1.5 },
      { c: 32, r: 46, axis: "x", travel: 5.5, speed: 1.85, phase: 0.4, color: 0x5c4033, width: 1.9, depth: 1.25, height: 1.55 },
      { c: 14, r: 36, axis: "x", travel: 4, speed: 2.0, phase: 0.0, color: 0x4a6741, width: 1.8, depth: 1.25, height: 1.5 },
      { c: 40, r: 22, axis: "z", travel: 3.5, speed: 1.9, phase: 0.55, color: 0x5c4033, width: 1.25, depth: 1.9, height: 1.55 },
      { c: 28, r: 14, axis: "x", travel: 4.5, speed: 1.75, phase: 0.75, color: 0x6b4226, width: 1.9, depth: 1.25, height: 1.5 },
      // Slow approach to clue chamber (r3 open water under C)
      { c: 32, r: 6, axis: "x", travel: 4, speed: 1.6, phase: 0.3, color: 0x4a6741, width: 1.8, depth: 1.2, height: 1.45 },
    ],
  },
  {
    id: 4,
    key: "level4",
    title: "Wreck of the Amber Gull",
    biome: "wreck",
    storyBefore: {
      title: "Level 4 — Wreck of the Amber Gull",
      body:
        "A wooden ship rests on its side in the gloom — the Amber Gull.\n\n" +
        "Sliding bulkheads and prowling creatures make every corridor a timing puzzle.\n" +
        "Find the GOLD clue in the captain’s cabin.",
    },
    map: refineMap(LEVEL4_MAP, 2),
    clue: "GOLD",
    clueText: "Past the coins the wreck still keeps.",
    scuba: true,
    objective: "Explore the wreck · Clue GOLD",
    hint: "Roomier decks. Hunters pursue close-up — bulkhead rhythm + side channels save you.",
    hazards: [
      // Corridor patrols — axis aligned with the open lanes they live in
      { kind: "shark", c: 28, r: 66, speed: 1.9, axis: "x" },
      { kind: "shark", c: 40, r: 46, speed: 1.95, axis: "x" },
      { kind: "shark", c: 24, r: 26, speed: 2.0, axis: "x" },
      { kind: "jelly", c: 36, r: 56, speed: 1.2, axis: "x" },
      { kind: "jelly", c: 32, r: 36, speed: 1.15, axis: "x" },
      { kind: "jelly", c: 44, r: 16, speed: 1.25, axis: "x" },
      { kind: "ray", c: 20, r: 56, speed: 1.7, axis: "x" },
      { kind: "ray", c: 48, r: 36, speed: 1.75, axis: "x" },
      { kind: "ray", c: 32, r: 16, speed: 1.8, axis: "x" },
      { kind: "ray", c: 36, r: 6, speed: 1.65, axis: "x" },
    ],
    movers: [
      // All on OPEN horizontal corridors (r33,28,23,18,13,8,3) — never bulkhead/wall rows
      { c: 32, r: 66, axis: "x", travel: 5.5, speed: 1.85, phase: 0.0, color: 0x5c4033, width: 2.2, depth: 1.15, height: 1.7 },
      { c: 40, r: 56, axis: "x", travel: 5, speed: 2.0, phase: 0.35, color: 0x6b4226, width: 2.1, depth: 1.15, height: 1.7 },
      { c: 24, r: 46, axis: "x", travel: 5.5, speed: 2.05, phase: 0.15, color: 0x5c4033, width: 2.2, depth: 1.15, height: 1.75 },
      { c: 44, r: 36, axis: "x", travel: 4.5, speed: 2.15, phase: 0.55, color: 0x6b4226, width: 2.0, depth: 1.15, height: 1.7 },
      { c: 28, r: 26, axis: "x", travel: 5, speed: 2.1, phase: 0.75, color: 0x5c4033, width: 2.1, depth: 1.15, height: 1.7 },
      { c: 36, r: 16, axis: "x", travel: 5.5, speed: 2.2, phase: 0.25, color: 0x8b5a2b, width: 2.2, depth: 1.15, height: 1.65 },
      // Pre-clue corridor — slower so the GOLD room feels earned, not sniped
      { c: 32, r: 6, axis: "x", travel: 4.5, speed: 1.7, phase: 0.5, color: 0x5c4033, width: 2.0, depth: 1.15, height: 1.6 },
    ],
  },
];

/** Duplicate every spawn with a small offset so density doubles without stacking. */
function doubleHazards(list: HazardSpawn[]): HazardSpawn[] {
  const extra: HazardSpawn[] = list.map((h, i) => ({
    ...h,
    c: h.c + (i % 2 === 0 ? 4 : -4),
    r: h.r + (i % 3 === 0 ? 3 : -3),
    axis:
      h.axis === "x" ? "z" : h.axis === "z" ? "x" : h.axis === "diag" ? "x" : "diag",
    speed: h.speed !== undefined ? h.speed * (0.92 + (i % 3) * 0.04) : h.speed,
  }));
  return [...list, ...extra];
}

function doubleMovers(list: MovingObstacleDef[] | undefined): MovingObstacleDef[] | undefined {
  if (!list?.length) return list;
  const extra: MovingObstacleDef[] = list.map((m, i) => ({
    ...m,
    c: m.c + (i % 2 === 0 ? 5 : -5),
    r: m.r + (i % 2 === 0 ? -4 : 4),
    axis: m.axis === "x" ? "z" : "x",
    phase: ((m.phase ?? 0) + 0.5) % 1,
    speed: m.speed * 0.95,
    travel: m.travel * 0.9,
  }));
  return [...list, ...extra];
}

// Apply double density to all levels
for (const level of LEVELS) {
  level.hazards = doubleHazards(level.hazards);
  level.movers = doubleMovers(level.movers);
}

export function getLevel(id: number): LevelDef | undefined {
  return LEVELS.find((l) => l.id === id);
}

export function getNextLevel(id: number): LevelDef | undefined {
  return getLevel(id + 1);
}

export function totalLevelsBuilt(): number {
  return LEVELS.length;
}
