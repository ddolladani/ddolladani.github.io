import Phaser from "phaser";
import { ensureGlowTexture } from "./effects.js";

// Draws the inside of 1166 as a cozy living room: vaulted ceiling, a large
// arched (Palladian) window with warm evening light, a white fireplace, crown
// molding, baseboard, and carpet. Inspired by the real living-room photo.
// Everything sits BEHIND the player and memory frames (depths < 40).

const WALL_TOP    = 0xeadfca;
const WALL_BOT    = 0xdccfb6;
const CEIL_LIGHT  = 0xf2ebda;
const CEIL_SHADE  = 0xe2d8c2;
const TRIM        = 0xfbf7ee;
const TRIM_SHADE  = 0xddd5c4;
const CARPET_TOP  = 0xcdbfa1;
const CARPET_BOT  = 0xb4a384;

export function drawLivingRoom(scene, opts = {}) {
  const { width, height } = scene.scale;
  const floorY = opts.floorY ?? 300;
  const key = ensureGlowTexture(scene);

  // ── Walls ──
  const wall = scene.add.graphics().setDepth(-90);
  wall.fillGradientStyle(WALL_TOP, WALL_TOP, WALL_BOT, WALL_BOT, 1);
  wall.fillRect(0, 0, width, floorY);

  // ── Vaulted ceiling (two angled planes meeting at a ridge) ──
  const ceil = scene.add.graphics().setDepth(-88);
  const peakX = width * 0.5, ridgeY = 0, eaveY = 84;
  ceil.fillStyle(CEIL_LIGHT, 1);
  ceil.fillPoints([
    new Phaser.Geom.Point(0, ridgeY),
    new Phaser.Geom.Point(peakX, ridgeY),
    new Phaser.Geom.Point(peakX, eaveY),
    new Phaser.Geom.Point(0, eaveY + 18)
  ], true);
  ceil.fillStyle(CEIL_SHADE, 1);
  ceil.fillPoints([
    new Phaser.Geom.Point(peakX, ridgeY),
    new Phaser.Geom.Point(width, ridgeY),
    new Phaser.Geom.Point(width, eaveY + 18),
    new Phaser.Geom.Point(peakX, eaveY)
  ], true);
  // ridge + rafter lines
  ceil.lineStyle(2, TRIM_SHADE, 0.6);
  ceil.lineBetween(peakX, ridgeY, peakX, eaveY);
  ceil.lineBetween(0, eaveY + 18, peakX, eaveY);
  ceil.lineBetween(width, eaveY + 18, peakX, eaveY);

  // crown molding
  const crown = scene.add.graphics().setDepth(-86);
  crown.fillStyle(TRIM, 1);      crown.fillRect(0, eaveY + 16, width, 10);
  crown.fillStyle(TRIM_SHADE, 1); crown.fillRect(0, eaveY + 26, width, 3);

  // ── Arched Palladian window (right of center) ──
  drawArchedWindow(scene, width * 0.62, 104, 232, floorY - 150, key);

  // ── Fireplace (left) ──
  drawFireplace(scene, width * 0.2, floorY, key);

  // ── Baseboard ──
  const base = scene.add.graphics().setDepth(-52);
  base.fillStyle(TRIM, 1);       base.fillRect(0, floorY - 16, width, 16);
  base.fillStyle(TRIM_SHADE, 1); base.fillRect(0, floorY - 4, width, 4);

  // ── Carpet ──
  const floor = scene.add.graphics().setDepth(-70);
  floor.fillGradientStyle(CARPET_TOP, CARPET_TOP, CARPET_BOT, CARPET_BOT, 1);
  floor.fillRect(0, floorY, width, height - floorY);
  // subtle carpet speckle
  for (let i = 0; i < 220; i++) {
    const x = Math.random() * width;
    const y = floorY + Math.random() * (height - floorY);
    floor.fillStyle(0xffffff, 0.04);
    floor.fillRect(x, y, 2, 2);
  }

  // ── Area rug for warmth ──
  const rug = scene.add.graphics().setDepth(-68);
  const rx = width * 0.5 - 230, ry = floorY + 70, rw = 460, rh = height - floorY - 90;
  rug.fillStyle(0x8a5a4a, 1);  rug.fillRoundedRect(rx, ry, rw, rh, 16);
  rug.fillStyle(0x9c6a54, 1);  rug.fillRoundedRect(rx + 12, ry + 12, rw - 24, rh - 24, 12);
  rug.lineStyle(3, 0xc99a78, 0.8); rug.strokeRoundedRect(rx + 24, ry + 24, rw - 48, rh - 48, 10);
}

function drawArchedWindow(scene, cx, top, w, h, glowKey) {
  const g = scene.add.graphics().setDepth(-62);
  const left = cx - w / 2, right = cx + w / 2;
  const r = w / 2;
  const archBase = top + r;
  const sill = top + h;

  // warm evening light spilling in
  scene.add.image(cx, top + h * 0.4, glowKey).setScale(w / 22)
    .setTint(0xffdf9a).setAlpha(0.16).setBlendMode(Phaser.BlendModes.ADD).setDepth(-63);

  // glass (arched top + rectangular body) — warm gradient sky outside
  g.fillStyle(0xf6d49a, 1);
  g.slice(cx, archBase, r, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
  g.fillPath();
  g.fillGradientStyle(0xf6d49a, 0xf6d49a, 0xcfe0d6, 0xcfe0d6, 1);
  g.fillRect(left, archBase, w, sill - archBase);

  // distant tree silhouettes outside
  g.fillStyle(0x9fae8e, 0.7);
  g.fillCircle(left + 50, sill - 40, 38);
  g.fillCircle(left + 95, sill - 30, 30);
  g.fillStyle(0x8a9c7a, 0.7);
  g.fillCircle(right - 60, sill - 36, 34);

  // frame + muntins
  g.lineStyle(10, TRIM, 1);
  g.strokeRect(left, archBase, w, sill - archBase);
  g.beginPath();
  g.arc(cx, archBase, r, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
  g.strokePath();
  g.lineStyle(5, TRIM, 1);
  g.lineBetween(cx, archBase, cx, sill);                 // vertical
  g.lineBetween(left, (archBase + sill) / 2, right, (archBase + sill) / 2); // horizontal
  g.lineBetween(cx, top, cx, archBase);                  // arch divider
  // outer trim + sill
  g.lineStyle(6, TRIM_SHADE, 1);
  g.strokeRect(left - 6, top - 6, w + 12, h + 12);
  g.fillStyle(TRIM, 1);
  g.fillRect(left - 16, sill, w + 32, 12);
}

function drawFireplace(scene, cx, floorY, glowKey) {
  const g = scene.add.graphics().setDepth(-55);
  const w = 220, mantelY = floorY - 200;
  const left = cx - w / 2, right = cx + w / 2;

  // surround (white)
  g.fillStyle(TRIM, 1);
  g.fillRect(left, mantelY, w, floorY - mantelY);
  g.fillStyle(TRIM_SHADE, 0.5);
  g.fillRect(right - 18, mantelY, 18, floorY - mantelY);

  // mantel shelf
  g.fillStyle(TRIM, 1);
  g.fillRect(left - 14, mantelY - 14, w + 28, 16);
  g.fillStyle(TRIM_SHADE, 1);
  g.fillRect(left - 14, mantelY + 2, w + 28, 3);

  // firebox
  const fbX = left + 30, fbW = w - 60, fbY = mantelY + 40, fbH = floorY - mantelY - 56;
  g.fillStyle(0x2a2320, 1);
  g.fillRect(fbX, fbY, fbW, fbH);

  // fire glow
  scene.add.image(cx, fbY + fbH - 18, glowKey).setScale(2.6)
    .setTint(0xff9a3c).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(-54);

  // logs + flames
  g.fillStyle(0x5e3a22, 1);
  g.fillRoundedRect(fbX + 20, fbY + fbH - 22, fbW - 40, 12, 4);
  const flame = scene.add.graphics().setDepth(-53);
  const drawFlames = (t) => {
    flame.clear();
    const baseY = fbY + fbH - 20;
    const cxs = [fbX + fbW * 0.35, fbX + fbW * 0.5, fbX + fbW * 0.65];
    cxs.forEach((fx, i) => {
      const hgt = 30 + Math.sin(t / 200 + i) * 8;
      flame.fillStyle(0xff7a1a, 0.9);
      flame.fillTriangle(fx - 12, baseY, fx, baseY - hgt, fx + 12, baseY);
      flame.fillStyle(0xffd24a, 0.95);
      flame.fillTriangle(fx - 6, baseY, fx, baseY - hgt * 0.6, fx + 6, baseY);
    });
  };
  drawFlames(0);
  scene.tweens.addCounter({
    from: 0, to: 1000, duration: 1000, repeat: -1,
    onUpdate: (tw) => drawFlames(tw.getValue() * 6.28)
  });

  // a small framed photo on the mantel
  g.fillStyle(0x6b4a2f, 1); g.fillRect(cx - 16, mantelY - 44, 32, 30);
  g.fillStyle(0xfff8ec, 1); g.fillRect(cx - 12, mantelY - 40, 24, 22);
}
