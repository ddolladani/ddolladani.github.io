import Phaser from "phaser";
import { ensureGlowTexture } from "./effects.js";

// ── Sky: smooth 3-stop vertical gradient ──────────────────────────────────
export function drawSky(scene, palette, depth = -100) {
  const { width, height } = scene.scale;
  const g = scene.add.graphics().setDepth(depth).setScrollFactor(0);
  const horizon = height * 0.62;

  // top half: top -> mid
  g.fillGradientStyle(palette.top, palette.top, palette.mid, palette.mid, 1);
  g.fillRect(0, 0, width, horizon * 0.6);
  // lower sky: mid -> low
  g.fillGradientStyle(palette.mid, palette.mid, palette.low, palette.low, 1);
  g.fillRect(0, horizon * 0.6 - 1, width, horizon - horizon * 0.6 + 2);
  return g;
}

// ── Sun / moon with soft halo ─────────────────────────────────────────────
export function addSun(scene, x, y, opts = {}) {
  const { color = 0xfff3c4, glow = 0xffe9a8, radius = 34, depth = -90 } = opts;
  const key = ensureGlowTexture(scene);
  const halo = scene.add.image(x, y, key)
    .setScale(radius / 14)
    .setTint(glow)
    .setAlpha(0.3)
    .setDepth(depth)
    .setBlendMode(Phaser.BlendModes.ADD);
  const disc = scene.add.circle(x, y, radius, color).setDepth(depth);
  scene.tweens.add({
    targets: halo, scale: radius / 13, alpha: 0.4,
    duration: 3500, yoyo: true, repeat: -1, ease: "Sine.easeInOut"
  });
  return { halo, disc };
}

// Stars for night scenes
export function addStars(scene, count = 70, depth = -95) {
  const { width, height } = scene.scale;
  for (let i = 0; i < count; i++) {
    const x = Math.random() * width;
    const y = Math.random() * height * 0.55;
    const r = Phaser.Math.FloatBetween(0.6, 1.8);
    const star = scene.add.circle(x, y, r, 0xffffff, Phaser.Math.FloatBetween(0.5, 1))
      .setDepth(depth);
    scene.tweens.add({
      targets: star, alpha: 0.2,
      duration: Phaser.Math.Between(1200, 3000),
      yoyo: true, repeat: -1, delay: Math.random() * 2000
    });
  }
}

// ── Fluffy cloud that drifts across the sky ───────────────────────────────
export function addCloud(scene, x, y, scale = 1, depth = -85) {
  const c = scene.add.container(x, y).setDepth(depth).setScrollFactor(0.3);
  const g = scene.add.graphics();
  const puff = (px, py, r) => {
    g.fillStyle(0xffffff, 0.95); g.fillCircle(px, py, r);
    g.fillStyle(0xe8eef5, 0.6);  g.fillCircle(px, py + r * 0.4, r * 0.85);
  };
  puff(-34, 4, 20); puff(-12, -6, 26); puff(14, -2, 24); puff(34, 6, 18);
  g.fillStyle(0xffffff, 0.95);
  g.fillRoundedRect(-46, 4, 92, 18, 9);
  c.add(g);
  c.setScale(scale);

  const { width } = scene.scale;
  const speed = Phaser.Math.Between(28000, 52000);
  scene.tweens.add({
    targets: c, x: width + 120,
    duration: speed, repeat: -1,
    onRepeat: () => { c.x = -120; }
  });
  return c;
}

// ── Ground: grass with gradient + subtle blade texture ────────────────────
export function drawGround(scene, palette, topY, depth = -70) {
  const { width, height } = scene.scale;
  const g = scene.add.graphics().setDepth(depth);
  g.fillGradientStyle(palette.top, palette.top, palette.bot, palette.bot, 1);
  g.fillRect(0, topY, width, height - topY);

  // soft horizon band
  g.fillStyle(palette.top, 0.5);
  g.fillRect(0, topY, width, 10);

  // scattered grass tufts for texture
  const tuft = scene.add.graphics().setDepth(depth + 1);
  for (let i = 0; i < 90; i++) {
    const x = Math.random() * width;
    const y = topY + 14 + Math.random() * (height - topY - 14);
    const shade = Phaser.Display.Color.IntegerToColor(palette.bot);
    tuft.fillStyle(Phaser.Display.Color.GetColor(
      Math.min(255, shade.red + 22),
      Math.min(255, shade.green + 26),
      Math.min(255, shade.blue + 18)
    ), 0.5);
    const h = 4 + Math.random() * 5;
    tuft.fillTriangle(x, y, x + 2, y - h, x + 4, y);
  }
  return g;
}

// ── Tree: tapered trunk + irregular naturalistic canopy, gentle sway ──────
export function addTree(scene, x, y, opts = {}) {
  const {
    scale = 1, depth = 0,
    foliage = [0x2c5429, 0x3a6b34, 0x47803f],
    trunk = 0x5e442e, trunkDark = 0x432f1f
  } = opts;

  const c = scene.add.container(x, y).setDepth(depth);

  // grounding shadow
  c.add(scene.add.ellipse(0, 6, 130 * scale, 28 * scale, 0x000000, 0.2));

  // tapered, slightly curved trunk with a couple of limbs
  const tg = scene.add.graphics();
  tg.fillStyle(trunkDark, 1);
  tg.beginPath();
  tg.moveTo(-16, 6); tg.lineTo(-9, -118); tg.lineTo(9, -118); tg.lineTo(16, 6);
  tg.closePath(); tg.fillPath();
  tg.fillStyle(trunk, 1);
  tg.beginPath();
  tg.moveTo(-14, 6); tg.lineTo(-8, -116); tg.lineTo(2, -116); tg.lineTo(6, 6);
  tg.closePath(); tg.fillPath();
  // limbs
  tg.lineStyle(7, trunkDark, 1);
  tg.lineBetween(-2, -80, -34, -104);
  tg.lineBetween(0, -92, 30, -118);
  c.add(tg);

  // canopy: many small overlapping clumps for an organic silhouette
  const crown = scene.add.container(0, -118);
  const fg = scene.add.graphics();
  const rnd = Phaser.Math.Between;
  // dark base mass
  const clumps = [];
  for (let i = 0; i < 26; i++) {
    const ang = (i / 26) * Math.PI * 2;
    const rad = 40 + rnd(-10, 14);
    clumps.push({
      x: Math.cos(ang) * rad * 1.15,
      y: Math.sin(ang) * rad * 0.82 - 18,
      r: rnd(20, 32)
    });
  }
  // underside (darkest)
  clumps.forEach(b => { fg.fillStyle(foliage[0], 1); fg.fillCircle(b.x, b.y + 6, b.r); });
  // mid tone
  clumps.forEach(b => { fg.fillStyle(foliage[1], 1); fg.fillCircle(b.x, b.y, b.r * 0.92); });
  // sunlit top-left highlights
  clumps.forEach(b => {
    if (b.y < -18 && b.x < 12) { fg.fillStyle(foliage[2], 1); fg.fillCircle(b.x - 4, b.y - 5, b.r * 0.6); }
  });
  fg.fillStyle(0xffffff, 0.07); fg.fillCircle(-16, -44, 30);
  crown.add(fg);
  c.add(crown);

  c.setScale(scale);
  scene.tweens.add({
    targets: crown, angle: 1.6,
    duration: 3000, yoyo: true, repeat: -1, ease: "Sine.easeInOut"
  });
  return c;
}

// ── Bush / shrub: irregular clustered mound ───────────────────────────────
export function addBush(scene, x, y, opts = {}) {
  const { scale = 1, depth = 0, color = 0x416f37, dark = 0x30562b } = opts;
  const c = scene.add.container(x, y).setDepth(depth);
  c.add(scene.add.ellipse(0, 16, 100, 22, 0x000000, 0.18));
  const g = scene.add.graphics();
  const rnd = Phaser.Math.Between;
  const pts = [];
  for (let i = 0; i < 9; i++) pts.push({ x: rnd(-34, 34), y: rnd(-6, 8), r: rnd(16, 24) });
  pts.forEach(p => { g.fillStyle(dark, 1); g.fillCircle(p.x, p.y + 4, p.r); });
  pts.forEach(p => { g.fillStyle(color, 1); g.fillCircle(p.x, p.y, p.r * 0.85); });
  g.fillStyle(0xffffff, 0.08); g.fillCircle(-10, -10, 14);
  c.add(g);
  c.setScale(scale);
  return c;
}

// ── Subtle wildflowers / clover speckle (small, not cartoonish) ───────────
export function addFlowers(scene, x, y, depth = 1) {
  const colors = [0xe8d28a, 0xf0ead0, 0xd9b8d0, 0xc9d6a0];
  const c = scene.add.container(x, y).setDepth(depth);
  const g = scene.add.graphics();
  for (let i = 0; i < 7; i++) {
    const fx = Phaser.Math.Between(-22, 22);
    const fy = Phaser.Math.Between(-10, 10);
    g.fillStyle(0x3a5a2c, 0.7);
    g.fillEllipse(fx, fy + 4, 3, 6);
    g.fillStyle(Phaser.Utils.Array.GetRandom(colors), 0.95);
    g.fillCircle(fx, fy, Phaser.Math.FloatBetween(1.4, 2.4));
  }
  c.add(g);
  return c;
}

// ── Treehouse: trunk + plank platform, railing, roof, and ladder ──────────
export function addTreehouse(scene, x, y, opts = {}) {
  const { scale = 1, depth = 0 } = opts;
  const WOOD = 0x7a5230, WOOD_D = 0x5e3d22, WOOD_L = 0x946541, ROOF = 0x6b4a2f;
  const c = scene.add.container(x, y).setDepth(depth);
  const g = scene.add.graphics();

  // thick trunk
  g.fillStyle(WOOD_D, 1); g.fillRect(-26, -150, 52, 156);
  g.fillStyle(WOOD, 1);   g.fillRect(-26, -150, 34, 156);
  g.lineStyle(2, WOOD_D, 0.6);
  g.lineBetween(-10, -150, -10, 6); g.lineBetween(8, -150, 8, 6);

  // platform
  g.fillStyle(WOOD_D, 1); g.fillRect(-92, -150, 184, 16);
  g.fillStyle(WOOD, 1);   g.fillRect(-92, -152, 184, 8);
  // plank seams
  g.lineStyle(1, WOOD_D, 0.5);
  for (let px = -88; px < 92; px += 16) g.lineBetween(px, -152, px, -136);
  // support brace
  g.lineStyle(7, WOOD, 1);
  g.lineBetween(-70, -136, -30, -100); g.lineBetween(70, -136, 30, -100);

  // cabin wall
  g.fillStyle(WOOD_L, 1); g.fillRoundedRect(-72, -252, 144, 102, 6);
  g.fillStyle(WOOD, 1);   g.fillRoundedRect(-72, -252, 90, 102, 6);
  g.lineStyle(1, WOOD_D, 0.5);
  for (let py = -244; py < -150; py += 14) g.lineBetween(-72, py, 72, py);
  // door + window
  g.fillStyle(WOOD_D, 1); g.fillRoundedRect(-20, -214, 36, 64, 4);
  g.fillStyle(0x2c3e50, 1); g.fillRect(28, -226, 30, 28);
  g.lineStyle(3, WOOD_L, 1); g.strokeRect(28, -226, 30, 28);
  g.lineBetween(43, -226, 43, -198); g.lineBetween(28, -212, 58, -212);

  // A-frame roof
  g.fillStyle(ROOF, 1);
  g.fillTriangle(-86, -252, 0, -300, 86, -252);
  g.fillStyle(0x53371f, 1);
  g.fillTriangle(0, -300, 86, -252, 0, -252);

  // little railing posts on the exposed left edge of the platform
  g.fillStyle(WOOD, 1);
  g.fillRect(-90, -168, 4, 18);
  g.fillRect(-74, -168, 4, 18);
  g.lineStyle(4, WOOD, 1);
  g.lineBetween(-92, -168, -70, -168);

  // ladder to the ground
  g.fillStyle(WOOD, 1);
  g.fillRect(34, -134, 4, 134); g.fillRect(58, -134, 4, 134);
  g.lineStyle(4, WOOD_L, 1);
  for (let ry = -120; ry < 6; ry += 20) g.lineBetween(34, ry, 62, ry);

  c.add(g);
  c.setScale(scale);
  return c;
}

// ── Far rolling hills: a slow-parallax silhouette for real distance ───────
// Lighter, lower-contrast colors read as "far away" (atmospheric perspective);
// a low scrollFactor makes them drift slowly behind the action.
export function addHills(scene, baseY, opts = {}) {
  const {
    color = 0x9fb6a8, alpha = 0.5, depth = -80, scroll = 0.4,
    amp = 38, step = 150, height = 260
  } = opts;
  const { width } = scene.scale;
  const g = scene.add.graphics().setDepth(depth).setScrollFactor(scroll);
  g.fillStyle(color, alpha);
  g.beginPath();
  g.moveTo(-60, baseY + height);
  g.lineTo(-60, baseY);
  const seed = Math.random() * 10;
  for (let x = -60; x <= width + 60; x += 12) {
    const y = baseY - (Math.sin(x / step + seed) * 0.5 + 0.5) * amp;
    g.lineTo(x, y);
  }
  g.lineTo(width + 60, baseY + height);
  g.closePath();
  g.fillPath();
  return g;
}

// ── Horizon haze: soft light band sitting on the horizon line ─────────────
// Sells atmospheric depth by lifting the value where sky meets ground.
export function addHazeBand(scene, y, opts = {}) {
  const { color = 0xffffff, alpha = 0.16, height = 110, depth = -76, scroll = 0.5 } = opts;
  const { width } = scene.scale;
  const g = scene.add.graphics().setDepth(depth).setScrollFactor(scroll);
  // brightest at the horizon (bottom of the band), fading up to nothing
  g.fillGradientStyle(color, color, color, color, 0, 0, alpha, alpha);
  g.fillRect(0, y - height, width, height);
  return g;
}

// ── Foreground fronds: dark leaves framing the screen edges ───────────────
// A near-camera layer in front of gameplay (but behind motes/grade/vignette)
// that frames the shot and adds a strong sense of depth. Screen-fixed.
export function addForegroundFronds(scene, opts = {}) {
  const { color = 0x152611, alpha = 0.92, depth = 45000 } = opts;
  const { width, height } = scene.scale;
  const g = scene.add.graphics().setDepth(depth).setScrollFactor(0);
  const frond = (ox, oy, dir, scale, lean = 0) => {
    const len = 250 * scale, wid = 64 * scale;
    g.fillStyle(color, alpha);
    g.beginPath();
    g.moveTo(ox, oy);
    g.lineTo(ox + dir * wid + lean, oy - len * 0.38);
    g.lineTo(ox + dir * wid * 0.55 + lean, oy - len);
    g.lineTo(ox - dir * wid * 0.18 + lean, oy - len * 0.72);
    g.closePath();
    g.fillPath();
  };
  // bottom-left cluster, fanning right
  frond(-14, height + 24, 1, 1.25, 10);
  frond(46,  height + 32, 1, 0.95, 24);
  frond(104, height + 24, 1, 0.72, 30);
  // bottom-right cluster, fanning left
  frond(width + 14, height + 24, -1, 1.25, -10);
  frond(width - 46, height + 32, -1, 0.95, -24);
  frond(width - 104, height + 24, -1, 0.72, -30);
  return g;
}

// ── Foreground grass: dark blade band along the very bottom edge ──────────
// Same idea as fronds but for open lawns/gardens — a soft near-camera frame.
export function addForegroundGrass(scene, opts = {}) {
  const { color = 0x223a18, alpha = 0.9, depth = 45000, count = 46, max = 64 } = opts;
  const { width, height } = scene.scale;
  const g = scene.add.graphics().setDepth(depth).setScrollFactor(0);
  g.fillStyle(color, alpha);
  for (let i = 0; i < count; i++) {
    const x = (i / count) * (width + 40) - 20 + Phaser.Math.Between(-8, 8);
    const h = Phaser.Math.Between(max * 0.4, max);
    const lean = Phaser.Math.Between(-10, 10);
    const w = Phaser.Math.Between(5, 9);
    g.beginPath();
    g.moveTo(x - w, height + 6);
    g.lineTo(x + lean, height - h);
    g.lineTo(x + w, height + 6);
    g.closePath();
    g.fillPath();
  }
  return g;
}

// ── Distant tree-line silhouette (atmospheric background depth) ───────────
export function addTreeline(scene, y, opts = {}) {
  const { color = 0x9fb6a8, alpha = 0.5, depth = -75, height = 90 } = opts;
  const { width } = scene.scale;
  const g = scene.add.graphics().setDepth(depth).setScrollFactor(0.5);
  g.fillStyle(color, alpha);
  let x = -20;
  while (x < width + 40) {
    const r = Phaser.Math.Between(36, 70);
    g.fillCircle(x, y, r);
    g.fillCircle(x + r * 0.7, y + 6, r * 0.8);
    x += r * 1.1;
  }
  g.fillRect(0, y, width, height);
  return g;
}

// ── String lights (for the "Together" night scene) ────────────────────────
export function addStringLights(scene, x1, y1, x2, y2, bulbs = 9, depth = 5) {
  const c = scene.add.container(0, 0).setDepth(depth);
  const g = scene.add.graphics();
  // sagging wire
  g.lineStyle(2, 0x2a2a2a, 0.8);
  const sag = 40;
  g.beginPath();
  g.moveTo(x1, y1);
  for (let t = 0; t <= 1; t += 0.05) {
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t + Math.sin(Math.PI * t) * sag;
    g.lineTo(x, y);
  }
  g.strokePath();
  c.add(g);

  const key = ensureGlowTexture(scene);
  for (let i = 0; i < bulbs; i++) {
    const t = (i + 0.5) / bulbs;
    const x = x1 + (x2 - x1) * t;
    const y = y1 + (y2 - y1) * t + Math.sin(Math.PI * t) * sag + 6;
    const glow = scene.add.image(x, y, key).setScale(1.1).setTint(0xffdf8a)
      .setAlpha(0.7).setBlendMode(Phaser.BlendModes.ADD);
    const bulb = scene.add.circle(x, y, 4, 0xffe9a8);
    c.add([glow, bulb]);
    scene.tweens.add({
      targets: [glow, bulb], alpha: 0.45,
      duration: Phaser.Math.Between(1400, 2600),
      yoyo: true, repeat: -1, delay: Math.random() * 1500
    });
  }
  return c;
}
