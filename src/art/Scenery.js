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
    .setScale(radius / 12)
    .setTint(glow)
    .setAlpha(0.55)
    .setDepth(depth)
    .setBlendMode(Phaser.BlendModes.ADD);
  const disc = scene.add.circle(x, y, radius, color).setDepth(depth);
  scene.tweens.add({
    targets: halo, scale: radius / 11, alpha: 0.7,
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

// ── Tree: trunk + layered foliage, gentle sway ────────────────────────────
export function addTree(scene, x, y, opts = {}) {
  const {
    scale = 1, depth = 0,
    foliage = [0x356b32, 0x3f7d3a, 0x4f9446],
    trunk = 0x6b4a2f, trunkDark = 0x4f3622
  } = opts;

  const c = scene.add.container(x, y).setDepth(depth);

  // shadow
  const shadow = scene.add.ellipse(0, 6, 120 * scale, 26 * scale, 0x000000, 0.18);
  c.add(shadow);

  // trunk
  const tg = scene.add.graphics();
  tg.fillStyle(trunkDark); tg.fillRoundedRect(-13, -120, 26, 124, 8);
  tg.fillStyle(trunk);     tg.fillRoundedRect(-13, -120, 16, 124, 8);
  c.add(tg);

  // foliage clusters (drawn in a sub-container so it can sway)
  const crown = scene.add.container(0, -120);
  const fg = scene.add.graphics();
  const blob = (bx, by, r, col) => { fg.fillStyle(col, 1); fg.fillCircle(bx, by, r); };
  blob(0,   -30, 58, foliage[0]);
  blob(-42, -6, 44, foliage[0]);
  blob(42,  -6, 44, foliage[0]);
  blob(-18, -44, 46, foliage[1]);
  blob(22,  -40, 44, foliage[1]);
  blob(0,   -58, 40, foliage[2]);
  blob(-30, -28, 30, foliage[2]);
  blob(30,  -24, 30, foliage[2]);
  // highlight
  fg.fillStyle(0xffffff, 0.10); fg.fillCircle(-10, -56, 34);
  crown.add(fg);
  c.add(crown);

  c.setScale(scale);

  scene.tweens.add({
    targets: crown, angle: 2.2,
    duration: 2600, yoyo: true, repeat: -1, ease: "Sine.easeInOut"
  });
  return c;
}

// ── Bush / shrub: rounded clustered blob ──────────────────────────────────
export function addBush(scene, x, y, opts = {}) {
  const { scale = 1, depth = 0, color = 0x4a8a40, dark = 0x3a6e33 } = opts;
  const c = scene.add.container(x, y).setDepth(depth);
  const shadow = scene.add.ellipse(0, 16, 96, 22, 0x000000, 0.16);
  const g = scene.add.graphics();
  g.fillStyle(dark, 1);
  g.fillCircle(-26, 4, 26); g.fillCircle(26, 4, 26); g.fillCircle(0, -2, 32);
  g.fillStyle(color, 1);
  g.fillCircle(-22, -2, 22); g.fillCircle(22, -2, 22); g.fillCircle(0, -10, 26);
  g.fillStyle(0xffffff, 0.10);
  g.fillCircle(-8, -14, 16);
  c.add([shadow, g]);
  c.setScale(scale);
  return c;
}

// ── Small flower cluster ──────────────────────────────────────────────────
export function addFlowers(scene, x, y, depth = 1) {
  const colors = [0xff7aa2, 0xffd56b, 0xfff3c4, 0xb892ff, 0xff9e6b];
  const c = scene.add.container(x, y).setDepth(depth);
  const g = scene.add.graphics();
  for (let i = 0; i < 5; i++) {
    const fx = Phaser.Math.Between(-16, 16);
    const fy = Phaser.Math.Between(-8, 8);
    g.lineStyle(2, 0x3a6e33, 1);
    g.lineBetween(fx, fy, fx, fy + 10);
    const col = Phaser.Utils.Array.GetRandom(colors);
    g.fillStyle(col, 1);
    for (let p = 0; p < 5; p++) {
      const a = (p / 5) * Math.PI * 2;
      g.fillCircle(fx + Math.cos(a) * 3.4, fy + Math.sin(a) * 3.4, 2.6);
    }
    g.fillStyle(0xffffff, 0.9);
    g.fillCircle(fx, fy, 1.8);
  }
  c.add(g);
  return c;
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
