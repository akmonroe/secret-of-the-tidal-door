export type BiomeId =
  | "beach"
  | "house"
  | "reef"
  | "wreck"
  | "kelp"
  | "ice"
  | "vent"
  | "current"
  | "coral_city"
  | "storm"
  | "mirror"
  | "lagoon";

export type BiomePalette = {
  id: BiomeId;
  fog: number;
  sky: number;
  ground: number;
  groundB: number;
  water: number;
  wall: number;
  accent: number;
  hemiSky: number;
  hemiGround: number;
};

export const BIOMES: Record<string, BiomePalette> = {
  // Crossy Castle–bright: saturated skies, soft fog, toy colors
  beach: {
    id: "beach",
    fog: 0xd4f4fc,
    sky: 0x7ad4ff,
    ground: 0xffe4b5,
    groundB: 0xffd89a,
    water: 0x4ecfff,
    wall: 0xc4b8b0,
    accent: 0x3dd68c,
    hemiSky: 0xfff8ec,
    hemiGround: 0xffe0a8,
  },
  house: {
    // Cozy indoor — warm, not muddy brown cave
    id: "house",
    fog: 0xf0dcc4,
    sky: 0xe8c9a0,
    ground: 0xd4a574,
    groundB: 0xe8bc88,
    water: 0x4ecbb5,
    wall: 0xfff5e8,
    accent: 0xf08a4b,
    hemiSky: 0xfff0d8,
    hemiGround: 0xd4a06a,
  },
  reef: {
    // Bright aqua underwater — toy aquarium, not murky deep
    id: "reef",
    fog: 0x5eb8d8,
    sky: 0x3a9ec4,
    ground: 0x3db87a,
    groundB: 0x55d094,
    water: 0x5ad4f0,
    wall: 0xff7a8a,
    accent: 0xd4a0ff,
    hemiSky: 0xb8f0ff,
    hemiGround: 0x2a8a60,
  },
  wreck: {
    // Sunlit wreck — teal water, warm wood, not grey sludge
    id: "wreck",
    fog: 0x5a9ab8,
    sky: 0x2f6f90,
    ground: 0x8b5a30,
    groundB: 0xb07040,
    water: 0x3a9ec0,
    wall: 0xc4783a,
    accent: 0xffe066,
    hemiSky: 0xa0dff5,
    hemiGround: 0x6b4020,
  },
};

export function getBiome(id: string): BiomePalette {
  return BIOMES[id] ?? BIOMES.beach;
}
