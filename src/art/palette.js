// Central color palette for the illustrated storybook look.
// Warm, slightly desaturated, nostalgic.

export const SKY = {
  // warm late-afternoon, softer and more atmospheric (less primary-blue)
  day:    { top: 0x6f9fc4, mid: 0xa9c6d6, low: 0xe7d9c2 },
  golden: { top: 0xc98a5e, mid: 0xe3ab78, low: 0xf3d3a0 },
  dusk:   { top: 0x2b2748, mid: 0x584063, low: 0xb87b7e },
  night:  { top: 0x0c1130, mid: 0x1b2148, low: 0x35395f }
};

export const GROUND = {
  // deeper, more natural greens with less saturation
  grass:      { top: 0x6f9851, bot: 0x47692f },
  grassDusk:  { top: 0x5a7344, bot: 0x39512c },
  grassNight: { top: 0x324a5e, bot: 0x1f2f3f }
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
  // richer, deeper, slightly desaturated greens
  treeA: 0x3a6b34,
  treeB: 0x47803f,
  treeC: 0x2c5429,
  trunk: 0x5e442e,
  trunkDark: 0x432f1f,
  bush:  0x416f37,
  bushDark: 0x30562b
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
