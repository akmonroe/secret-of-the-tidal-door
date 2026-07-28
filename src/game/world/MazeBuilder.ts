import * as THREE from "three";
import type { BiomePalette } from "./biomes";
import type { Blocker } from "./collision";
import { resolveCircle } from "./collision";
import {
  makeCoralProp,
  makeCrate,
  makeFloorTile,
  makeGround,
  makeHouse,
  makePalm,
  makeRock,
  makeWallBox,
  makeWater,
  type GroundStyle,
  type WallStyle,
} from "./meshes";

/** Half the old edge length (was 2) → double map resolution for finer paths. */
export const CELL = 1;
export type { Blocker };

/**
 * Grid legend:
 * # wall
 * . walkable floor / sand (dry)
 * ~ water (swimmable)
 * P player spawn (dry unless on ~)
 * H decorative house prop + dry deck ring
 * C clue pedestal (walkable, inherits water only if cell is ~ — use . path to C indoors)
 * T palm (blocks)
 * R rock (blocks)
 * F furniture/crate (blocks)
 * O coral prop (blocks, decorative)
 * space = water outdoors / void
 */
export type MazeBuild = {
  group: THREE.Group;
  blockers: Blocker[];
  waterSet: Set<string>;
  spawn: THREE.Vector3;
  housePos: THREE.Vector3 | null;
  cluePos: THREE.Vector3 | null;
  cols: number;
  rows: number;
  originX: number;
  originZ: number;
  /** Grid cell edge length in world units (same as CELL). */
  cellSize: number;
};

function key(c: number, r: number): string {
  return `${c},${r}`;
}

export function cellToWorld(
  c: number,
  r: number,
  originX: number,
  originZ: number,
): { x: number; z: number } {
  return {
    x: originX + c * CELL + CELL / 2,
    z: originZ + r * CELL + CELL / 2,
  };
}

export function worldToCell(
  x: number,
  z: number,
  originX: number,
  originZ: number,
): { c: number; r: number } {
  return {
    c: Math.floor((x - originX) / CELL),
    r: Math.floor((z - originZ) / CELL),
  };
}

export function buildMazeFromRows(rows: string[], biome: BiomePalette): MazeBuild {
  const rowCount = rows.length;
  const colCount = Math.max(...rows.map((r) => r.length));
  const originX = -(colCount * CELL) / 2;
  const originZ = -(rowCount * CELL) / 2;

  const group = new THREE.Group();
  const blockers: MazeBuild["blockers"] = [];
  const waterSet = new Set<string>();
  let spawn = new THREE.Vector3(0, 0, 0);
  let housePos: THREE.Vector3 | null = null;
  let cluePos: THREE.Vector3 | null = null;

  const indoor = biome.id === "house";
  const undersea = biome.id === "reef" || biome.id === "wreck";

  const worldW = colCount * CELL + 24;
  const worldD = rowCount * CELL + 24;

  let groundStyle: GroundStyle = "sand";
  let wallStyle: WallStyle = "rock";
  let floorStyle: GroundStyle = "sand";
  if (indoor) {
    groundStyle = "wood";
    wallStyle = "stucco";
    floorStyle = "wood";
  } else if (biome.id === "reef") {
    groundStyle = "seafloor";
    wallStyle = "coral";
    floorStyle = "seafloor";
  } else if (biome.id === "wreck") {
    // Hull plate far-field + brick bulkheads + metal-grate catwalks
    groundStyle = "hull";
    wallStyle = "brick";
    floorStyle = "grate";
  }

  const ground = makeGround(Math.max(worldW, worldD), biome.ground, groundStyle);
  ground.position.y = 0;
  group.add(ground);

  if (!indoor) {
    const water = makeWater(Math.max(worldW, worldD) * 1.15, biome.water);
    water.position.y = undersea ? 0.08 : 0.02;
    if (undersea) {
      (water.material as THREE.MeshToonMaterial).opacity = 0.4;
    }
    group.add(water);
  }

  const wallH = indoor ? 1.9 : undersea ? 1.35 : 1.2;
  const walkableDry = new Set([".", "P", "T", "C", "F", "O"]);

  for (let r = 0; r < rowCount; r++) {
    const line = rows[r].padEnd(colCount, indoor ? "#" : " ");
    for (let c = 0; c < colCount; c++) {
      const ch = line[c];
      const { x, z } = cellToWorld(c, r, originX, originZ);

      // Floors
      if (walkableDry.has(ch) || (indoor && ch !== "#") || ch === "H") {
        if (ch !== "#" && ch !== " ") {
          const tile = makeFloorTile(
            CELL * 0.98,
            biome.groundB,
            floorStyle,
            indoor ? 0.16 : 0.1,
          );
          tile.position.set(x, indoor ? 0.08 : 0.05, z);
          group.add(tile);
        }
      }

      // Water cells
      if (ch === "~" || ch === " " || (ch === "H" && !indoor)) {
        waterSet.add(key(c, r));
      }
      // Undersea: almost everything is "in water" for swim anim except walls
      if (undersea && ch !== "#") {
        waterSet.add(key(c, r));
      }

      if (ch === "#") {
        const wall = makeWallBox(CELL * 0.95, wallH, CELL * 0.95, biome.wall, wallStyle);
        wall.position.x = x;
        wall.position.z = z;
        group.add(wall);
        blockers.push(block(x, z, CELL * 0.42));
      }

      if (ch === "R") {
        const rock = makeRock(biome.wall);
        rock.position.set(x, 0, z);
        rock.scale.setScalar(0.55 + ((c + r) % 3) * 0.08);
        group.add(rock);
        blockers.push(block(x, z, CELL * 0.38));
      }

      if (ch === "T") {
        const palm = makePalm();
        palm.position.set(x, 0, z);
        palm.scale.setScalar(0.65);
        group.add(palm);
        blockers.push(block(x, z, 0.35));
      }

      if (ch === "F") {
        const crate = makeCrate();
        crate.position.set(x, 0, z);
        crate.scale.setScalar(0.7);
        group.add(crate);
        blockers.push(block(x, z, 0.4));
      }

      if (ch === "O") {
        const coral = makeCoralProp(biome.accent);
        coral.position.set(x, 0, z);
        coral.scale.setScalar(0.65);
        group.add(coral);
        blockers.push(block(x, z, 0.45));
      }

      if (ch === "P") {
        spawn = new THREE.Vector3(x, 0, z);
      }
      if (ch === "H") {
        housePos = new THREE.Vector3(x, 0, z);
        if (!indoor) {
          const house = makeHouse();
          house.position.set(x, 0, z);
          group.add(house);
          blockers.push({
            minX: x - 2.2,
            maxX: x + 2.2,
            minZ: z - 1.4,
            maxZ: z + 0.6,
          });
        }
      }
      if (ch === "C") {
        cluePos = new THREE.Vector3(x, 0, z);
        // Indoor clue is dry; outdoor C on water stays swimmable if water-marked above
        if (indoor) waterSet.delete(key(c, r));
      }
    }
  }

  return {
    group,
    blockers,
    waterSet,
    spawn,
    housePos,
    cluePos,
    cols: colCount,
    rows: rowCount,
    originX,
    originZ,
    cellSize: CELL,
  };
}

function block(x: number, z: number, half: number) {
  return {
    minX: x - half,
    maxX: x + half,
    minZ: z - half,
    maxZ: z + half,
  };
}

export function isWaterAt(x: number, z: number, maze: MazeBuild): boolean {
  const { c, r } = worldToCell(x, z, maze.originX, maze.originZ);
  if (c < 0 || r < 0 || c >= maze.cols || r >= maze.rows) return true;
  return maze.waterSet.has(key(c, r));
}

export function resolveCollision(
  x: number,
  z: number,
  radius: number,
  blockers: Blocker[],
): { x: number; z: number } {
  return resolveCircle(x, z, radius, blockers);
}
