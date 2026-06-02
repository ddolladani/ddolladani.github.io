import Phaser from "phaser";

// ── Soft radial glow texture (generated once, reused everywhere) ──────────
export function ensureGlowTexture(scene, key = "soft-glow", size = 128) {
  if (scene.textures.exists(key)) return key;
  const c = scene.textures.createCanvas(key, size, size);
  const ctx = c.getContext();
  const r = size / 2;
  const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0,    "rgba(255,255,255,0.8)");
  grad.addColorStop(0.35, "rgba(255,255,255,0.32)");
  grad.addColorStop(0.7,  "rgba(255,255,255,0.08)");
  grad.addColorStop(1,    "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  c.refresh();
  return key;
}

// Round soft dot (for particles, fireflies)
export function ensureDotTexture(scene, key = "soft-dot", size = 32) {
  if (scene.textures.exists(key)) return key;
  const c = scene.textures.createCanvas(key, size, size);
  const ctx = c.getContext();
  const r = size / 2;
  const grad = ctx.createRadialGradient(r, r, 0, r, r, r);
  grad.addColorStop(0,   "rgba(255,255,255,1)");
  grad.addColorStop(0.5, "rgba(255,255,255,0.6)");
  grad.addColorStop(1,   "rgba(255,255,255,0)");
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, size, size);
  c.refresh();
  return key;
}

// ── Vignette: darkened edges for cinematic depth ──────────────────────────
export function addVignette(scene, strength = 0.55) {
  const { width, height } = scene.scale;
  const key = "vignette-tex";
  if (!scene.textures.exists(key)) {
    const c = scene.textures.createCanvas(key, width, height);
    const ctx = c.getContext();
    const grad = ctx.createRadialGradient(
      width / 2, height / 2, height * 0.35,
      width / 2, height / 2, height * 0.8
    );
    grad.addColorStop(0, "rgba(0,0,0,0)");
    grad.addColorStop(1, "rgba(0,0,0,1)");
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, width, height);
    c.refresh();
  }
  return scene.add.image(width / 2, height / 2, key)
    .setAlpha(strength)
    .setDepth(900)
    .setScrollFactor(0);
}

// ── Color grade overlay (warm/cool wash) ──────────────────────────────────
export function addColorGrade(scene, color, alpha = 0.12) {
  const { width, height } = scene.scale;
  return scene.add.rectangle(width / 2, height / 2, width, height, color, alpha)
    .setDepth(880)
    .setScrollFactor(0)
    .setBlendMode(Phaser.BlendModes.SCREEN);
}

// ── Ambient floating motes / fireflies ────────────────────────────────────
export function addFireflies(scene, opts = {}) {
  const {
    count = 26,
    color = 0xffe9a8,
    minAlpha = 0.06,
    maxAlpha = 0.34,
    depth = 800,
    area = null
  } = opts;
  const { width, height } = scene.scale;
  const key = ensureDotTexture(scene);
  const bounds = area || { x: 0, y: 0, w: width, h: height };

  for (let i = 0; i < count; i++) {
    const x = bounds.x + Math.random() * bounds.w;
    const y = bounds.y + Math.random() * bounds.h;
    const s = Phaser.Math.FloatBetween(0.14, 0.36);
    const dot = scene.add.image(x, y, key)
      .setScale(s)
      .setTint(color)
      .setAlpha(minAlpha)
      .setDepth(depth)
      .setBlendMode(Phaser.BlendModes.ADD);

    scene.tweens.add({
      targets: dot,
      alpha: Phaser.Math.FloatBetween(maxAlpha * 0.6, maxAlpha),
      duration: Phaser.Math.Between(900, 2200),
      yoyo: true,
      repeat: -1,
      delay: Math.random() * 2000,
      ease: "Sine.easeInOut"
    });
    scene.tweens.add({
      targets: dot,
      x: x + Phaser.Math.Between(-40, 40),
      y: y + Phaser.Math.Between(-30, 30),
      duration: Phaser.Math.Between(4000, 9000),
      yoyo: true,
      repeat: -1,
      ease: "Sine.easeInOut"
    });
  }
}
