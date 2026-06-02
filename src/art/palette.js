// Central color palette for the illustrated storybook look.
// Warm, slightly desaturated, nostalgic.

export const SKY = {
  day:    { top: 0x7ec8f2, mid: 0xa9dcf5, low: 0xe9f6fb },
  golden: { top: 0xf6a96b, mid: 0xf9c98b, low: 0xfde7c0 },
  dusk:   { top: 0x2b2350, mid: 0x5b3f73, low: 0xc77b8b },
  night:  { top: 0x0e1230, mid: 0x1d2350, low: 0x3a3a6b }
};

export const GROUND = {
  grass:      { top: 0x7ab85a, bot: 0x4f8a3c },
  grassDusk:  { top: 0x5f7e4a, bot: 0x3c5a30 },
  grassNight: { top: 0x35506a, bot: 0x223648 }
};

export const HOUSE = {
  brick:       0xa4503a,
  brickDark:   0x8a3f2e,
  brickLight:  0xb86b52,
  mortar:      0xc9b8a8,
  siding:      0xd9cdb3,
  sidingDark:  0xc3b596,
  roof:        0x4a4f57,
  roofDark:    0x363a40,
  roofLight:   0x5d636c,
  trim:        0xf4efe4,
  garage:      0xeceae2,
  garageLine:  0xc4c2ba,
  windowGlass: 0x2c3e50,
  windowLit:   0xffd98a,
  door:        0x5c3a24,
  doorDark:    0x3f2716
};

export const FOLIAGE = {
  treeA: 0x3f7d3a,
  treeB: 0x4f9446,
  treeC: 0x356b32,
  trunk: 0x6b4a2f,
  trunkDark: 0x4f3622,
  bush:  0x4a8a40,
  bushDark: 0x3a6e33
};

export const UI = {
  panel:      0x2a2640,
  panelLight: 0x3a3556,
  gold:       0xffd56b,
  goldDeep:   0xe0a93c,
  cream:      0xfff8ec,
  ink:        0x2c2438,
  shadow:     0x000000
};

export const CHAPTER_THEME = {
  dj: {
    label: "DJ",
    accent: 0x5fb0e8,
    sky: SKY.day,
    ground: GROUND.grass
  },
  danielle: {
    label: "Danielle",
    accent: 0xf2a0c4,
    sky: SKY.golden,
    ground: GROUND.grassDusk
  },
  together: {
    label: "Together",
    accent: 0xffd56b,
    sky: SKY.night,
    ground: GROUND.grassNight
  }
};

// Convert 0xRRGGBB to "#rrggbb"
export function hex(n) {
  return "#" + n.toString(16).padStart(6, "0");
}
