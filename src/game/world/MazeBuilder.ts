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
  const undersea =
    biome.id === "reef" ||
    biome.id === "wreck" ||
    biome.id === "kelp" ||
    biome.id === "ice" ||
    biome.id === "vent" ||
    biome.id === "current" ||
    biome.id === "coral_city" ||
    biome.id === "storm" ||
    biome.id === "mirror" ||
    biome.id === "lagoon";

  // Footprint matches the playable grid so solid ground doesn't invite walking into the void
  const worldW = colCount * CELL + 2;
  const worldD = rowCount * CELL + 2;

  let groundStyle: GroundStyle = "sand";
  let wallStyle: WallStyle = "rock";
  let floorStyle: GroundStyle = "sand";
  if (indoor) {
    groundStyle = "wood";
    wallStyle = "stucco";
    floorStyle = "wood";
  } else if (biome.id === "kelp") {
    // Emerald kelp trunks — coral texture tinted green for wall read
    groundStyle = "seafloor";
    wallStyle = "coral";
    floorStyle = "seafloor";
  } else if (biome.id === "reef" || biome.id === "coral_city" || biome.id === "lagoon") {
    groundStyle = "seafloor";
    wallStyle = "coral";
    floorStyle = "seafloor";
  } else if (biome.id === "wreck") {
    // Hull plate far-field + brick bulkheads + metal-grate catwalks
    groundStyle = "hull";
    wallStyle = "brick";
    floorStyle = "grate";
  } else if (biome.id === "vent") {
    // Volcanic vents — dark hull plates, rock pillars (not brick bulkheads)
    groundStyle = "hull";
    wallStyle = "rock";
    floorStyle = "hull";
  } else if (biome.id === "ice") {
    // Bright ice shelves — smooth rock walls tinted white via palette
    groundStyle = "sand";
    wallStyle = "rock";
    floorStyle = "sand";
  } else if (biome.id === "mirror") {
    // Looking-glass — cool metal sheen underfoot
    groundStyle = "grate";
    wallStyle = "stucco";
    floorStyle = "grate";
  } else if (biome.id === "current") {
    // Raceway lanes — seafloor + rock cliffs
    groundStyle = "seafloor";
    wallStyle = "rock";
    floorStyle = "seafloor";
  } else if (biome.id === "storm") {
    // Storm-tossed sand bars + rock
    groundStyle = "sand";
    wallStyle = "rock";
    floorStyle = "sand";
  }

  const ground = makeGround(Math.max(worldW, worldD), biome.ground, groundStyle);
  ground.position.y = 0;
  group.add(ground);

  if (!indoor) {
    // Water only under the map — not a huge plate that looks safe past the edge
    const water = makeWater(Math.max(worldW, worldD) * 1.02, biome.water);
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

  // Bold fall-edge: kids must see where the world ends before they die
  group.add(buildWorldEdgeGuard(originX, originZ, colCount, rowCount));

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

/**
 * Super-clear map boundary so falling off is never a surprise.
 * - Dark void past the playable rect (no “fake ground”)
 * - Yellow/black hazard lip exactly on the fall line
 * - Inner warning strip (soft red glow) just inside the edge
 * - Corner posts with red tops for high-camera landmarks
 */
function buildWorldEdgeGuard(
  originX: number,
  originZ: number,
  cols: number,
  rows: number,
): THREE.Group {
  const g = new THREE.Group();
  g.name = "world-edge-guard";

  const minX = originX;
  const maxX = originX + cols * CELL;
  const minZ = originZ;
  const maxZ = originZ + rows * CELL;
  const midX = (minX + maxX) / 2;
  const midZ = (minZ + maxZ) / 2;
  const mapW = maxX - minX;
  const mapD = maxZ - minZ;

  // Huge dark void under & around the map — reads as “nothing” from high camera
  const voidSize = Math.max(mapW, mapD) + 80;
  const voidPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(voidSize, voidSize),
    new THREE.MeshBasicMaterial({
      color: 0x0a0c14,
      depthWrite: true,
    }),
  );
  voidPlane.rotation.x = -Math.PI / 2;
  voidPlane.position.y = -0.35;
  voidPlane.renderOrder = -2;
  g.add(voidPlane);

  // Soft abyss fog ring just outside (slightly lighter so edge contrast pops)
  const abyss = new THREE.Mesh(
    new THREE.RingGeometry(
      Math.hypot(mapW, mapD) * 0.48,
      Math.hypot(mapW, mapD) * 0.48 + 18,
      48,
    ),
    new THREE.MeshBasicMaterial({
      color: 0x1a1028,
      transparent: true,
      opacity: 0.85,
      side: THREE.DoubleSide,
      depthWrite: false,
    }),
  );
  abyss.rotation.x = -Math.PI / 2;
  abyss.position.set(midX, -0.2, midZ);
  g.add(abyss);

  const STRIPE_YEL = 0xffdd33;
  const STRIPE_BLK = 0x1a1410;
  const WARN_RED = 0xff3344;

  /** One long edge: curb + striped top + outer cliff face */
  const addEdge = (
    cx: number,
    cz: number,
    length: number,
    alongX: boolean,
  ): void => {
    // Raised hazard curb (sits on the fall line)
    const curbW = alongX ? length + 0.6 : 0.85;
    const curbD = alongX ? 0.85 : length + 0.6;
    const curb = new THREE.Mesh(
      new THREE.BoxGeometry(curbW, 0.55, curbD),
      new THREE.MeshToonMaterial({ color: STRIPE_BLK }),
    );
    curb.position.set(cx, 0.22, cz);
    curb.castShadow = true;
    g.add(curb);

    // Yellow/black chevron stripes on top of curb
    const segs = Math.max(4, Math.floor(length / 1.4));
    for (let i = 0; i < segs; i++) {
      if (i % 2 !== 0) continue;
      const t = (i + 0.5) / segs - 0.5;
      const stripe = new THREE.Mesh(
        new THREE.BoxGeometry(
          alongX ? length / segs + 0.02 : 0.72,
          0.12,
          alongX ? 0.72 : length / segs + 0.02,
        ),
        new THREE.MeshToonMaterial({
          color: STRIPE_YEL,
          emissive: STRIPE_YEL,
          emissiveIntensity: 0.35,
        }),
      );
      stripe.position.set(
        alongX ? cx + t * length : cx,
        0.52,
        alongX ? cz : cz + t * length,
      );
      g.add(stripe);
    }

    // Outer cliff face — bright red rim so “death side” is obvious
    const face = new THREE.Mesh(
      new THREE.BoxGeometry(
        alongX ? length + 0.8 : 0.35,
        1.1,
        alongX ? 0.35 : length + 0.8,
      ),
      new THREE.MeshToonMaterial({
        color: WARN_RED,
        emissive: 0xaa0011,
        emissiveIntensity: 0.45,
      }),
    );
    // Push slightly outward from playable area
    let fx = cx;
    let fz = cz;
    if (alongX) {
      // north or south edge: cz is already outside-ish
      fz = cz + (cz < midZ ? -0.35 : 0.35);
    } else {
      fx = cx + (cx < midX ? -0.35 : 0.35);
    }
    face.position.set(fx, -0.15, fz);
    g.add(face);
  };

  // Four edges — curb sits ON the fall line so you step on yellow before you die
  const lip = 0.05;
  addEdge(midX, minZ - lip, mapW, true); // north (-Z)
  addEdge(midX, maxZ + lip, mapW, true); // south (+Z)
  addEdge(minX - lip, midZ, mapD, false); // west (-X)
  addEdge(maxX + lip, midZ, mapD, false); // east (+X)

  // Inner warning band (on the floor, last cells) — soft red glow strip
  const warnMat = new THREE.MeshBasicMaterial({
    color: 0xff2244,
    transparent: true,
    opacity: 0.38,
    depthWrite: false,
  });
  const band = 1.15;
  const bands: Array<[number, number, number, number]> = [
    [midX, minZ + band * 0.5, mapW - 1.2, band], // north inner
    [midX, maxZ - band * 0.5, mapW - 1.2, band], // south
    [minX + band * 0.5, midZ, band, mapD - 1.2], // west
    [maxX - band * 0.5, midZ, band, mapD - 1.2], // east
  ];
  for (const [bx, bz, bw, bd] of bands) {
    const strip = new THREE.Mesh(new THREE.PlaneGeometry(bw, bd), warnMat.clone());
    strip.rotation.x = -Math.PI / 2;
    strip.position.set(bx, 0.12, bz);
    strip.renderOrder = 1;
    g.add(strip);
  }

  // Corner danger posts — tall so the high Switch camera always sees them
  const corners: Array<[number, number]> = [
    [minX - lip, minZ - lip],
    [maxX + lip, minZ - lip],
    [minX - lip, maxZ + lip],
    [maxX + lip, maxZ + lip],
  ];
  for (const [px, pz] of corners) {
    const post = new THREE.Mesh(
      new THREE.CylinderGeometry(0.22, 0.28, 2.4, 8),
      new THREE.MeshToonMaterial({ color: STRIPE_BLK }),
    );
    post.position.set(px, 1.15, pz);
    post.castShadow = true;
    g.add(post);
    // Alternating yellow rings
    for (let k = 0; k < 3; k++) {
      const ring = new THREE.Mesh(
        new THREE.TorusGeometry(0.3, 0.07, 6, 12),
        new THREE.MeshToonMaterial({
          color: STRIPE_YEL,
          emissive: STRIPE_YEL,
          emissiveIntensity: 0.5,
        }),
      );
      ring.rotation.x = Math.PI / 2;
      ring.position.set(px, 0.5 + k * 0.55, pz);
      g.add(ring);
    }
    // Red warning ball on top
    const cap = new THREE.Mesh(
      new THREE.SphereGeometry(0.32, 10, 8),
      new THREE.MeshToonMaterial({
        color: WARN_RED,
        emissive: 0xff0022,
        emissiveIntensity: 0.7,
      }),
    );
    cap.position.set(px, 2.5, pz);
    g.add(cap);
  }

  return g;
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
