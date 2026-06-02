import Phaser from "phaser";
import { HOUSE } from "./palette.js";
import { ensureGlowTexture } from "./effects.js";

// Draws an illustrated elevation of 1166 — a two-story brick home with
// gabled roofs, a beige-sided gable accent, front entry portico, and a
// two-car garage. Returns a container anchored at its TOP-LEFT (x, y).
// Footprint: 620 x 330 (before scaling).

const W = 620;
const H = 330;

export function addHouse1166(scene, x, y, opts = {}) {
  const { scale = 1, depth = 0, lit = true } = opts;
  const c = scene.add.container(x, y).setDepth(depth);

  // ground shadow
  c.add(scene.add.ellipse(W / 2, H - 6, W * 0.96, 40, 0x000000, 0.18));

  const g = scene.add.graphics();

  // ── Roofs (drawn first, behind walls' top edge) ─────────────────────────
  drawGableRoof(g, -12, 250, 116, 18,  HOUSE.roof, HOUSE.roofDark);   // left wing
  drawGableRoof(g, 348, 632, 478, 42,  HOUSE.roof, HOUSE.roofDark);   // garage wing

  // ── Walls ───────────────────────────────────────────────────────────────
  // left wing (brick, two stories)
  drawBrick(g, 8, 120, 222, 210);
  // garage wing (brick)
  drawBrick(g, 360, 132, 252, 198);
  // center entry recess (beige siding)
  g.fillStyle(HOUSE.siding, 1);
  g.fillRect(230, 156, 130, 174);
  drawSidingLines(g, 230, 156, 130, 174);

  // left gable face (beige siding accent inside the peak)
  g.fillStyle(HOUSE.siding, 1);
  g.fillTriangle(40, 132, 116, 36, 192, 132);
  drawSidingLines(g, 40, 60, 152, 72, 132);
  g.fillStyle(HOUSE.sidingDark, 0.5);
  g.fillTriangle(116, 36, 192, 132, 150, 132);

  c.add(g);

  // ── Garage doors ────────────────────────────────────────────────────────
  addGarageDoor(scene, c, 372, 196, 108, 132);
  addGarageDoor(scene, c, 490, 196, 108, 132);

  // ── Windows ─────────────────────────────────────────────────────────────
  // left wing: upper + lower
  addWindow(scene, c, 60,  150, 50, 64, lit);
  addWindow(scene, c, 150, 150, 50, 64, lit);
  addWindow(scene, c, 60,  238, 50, 70, lit);
  // garage wing upper windows
  addWindow(scene, c, 396, 150, 46, 56, lit);
  addWindow(scene, c, 510, 150, 46, 56, lit);

  // ── Front entry: portico + door ─────────────────────────────────────────
  addEntry(scene, c, 268, 196, lit);

  // ── Address plaque "1166" ───────────────────────────────────────────────
  const plaque = scene.add.container(W / 2, 150);
  const pg = scene.add.graphics();
  pg.fillStyle(0x000000, 0.25); pg.fillRoundedRect(-46, -14, 92, 30, 8);
  pg.fillStyle(HOUSE.trim, 1);  pg.fillRoundedRect(-44, -16, 88, 30, 8);
  plaque.add(pg);
  plaque.add(scene.add.text(0, -2, "1166", {
    fontFamily: '"Fredoka", sans-serif', fontSize: "18px",
    fontStyle: "700", color: "#7a4a2f"
  }).setOrigin(0.5));
  c.add(plaque);

  c.setScale(scale);
  c.footprint = { w: W * scale, h: H * scale };
  return c;
}

// ── helpers ───────────────────────────────────────────────────────────────

function drawGableRoof(g, xL, xR, peakX, peakY, col, dark) {
  // main triangle
  g.fillStyle(col, 1);
  g.fillTriangle(xL, 132, peakX, peakY, xR, 132);
  // shaded right slope
  g.fillStyle(dark, 1);
  g.fillTriangle(peakX, peakY, xR, 132, peakX, 132);
  // eave trim
  g.fillStyle(HOUSE.trim, 1);
  g.fillRect(xL, 130, xR - xL, 8);
}

function drawBrick(g, x, y, w, h) {
  g.fillStyle(HOUSE.brick, 1);
  g.fillRect(x, y, w, h);
  // vertical shading on the right third
  g.fillStyle(HOUSE.brickDark, 0.35);
  g.fillRect(x + w * 0.66, y, w * 0.34, h);
  g.fillStyle(HOUSE.brickLight, 0.25);
  g.fillRect(x, y, w * 0.3, h);
  // mortar courses
  g.lineStyle(1, HOUSE.mortar, 0.35);
  for (let ry = y + 12; ry < y + h; ry += 13) {
    g.lineBetween(x, ry, x + w, ry);
  }
  // staggered head joints
  let offset = 0;
  for (let ry = y; ry < y + h; ry += 13) {
    for (let rx = x + (offset ? 13 : 0); rx < x + w; rx += 26) {
      g.lineBetween(rx, ry, rx, Math.min(ry + 13, y + h));
    }
    offset = offset ? 0 : 1;
  }
}

function drawSidingLines(g, x, y, w, h, clipBottom) {
  g.lineStyle(1, HOUSE.sidingDark, 0.5);
  const bottom = clipBottom || (y + h);
  for (let ry = y + 10; ry < bottom; ry += 11) {
    g.lineBetween(x, ry, x + w, ry);
  }
}

function addWindow(scene, parent, x, y, w, h, lit) {
  const win = scene.add.container(x, y);
  const g = scene.add.graphics();
  // trim
  g.fillStyle(HOUSE.trim, 1);
  g.fillRoundedRect(-4, -4, w + 8, h + 8, 4);
  // glass
  if (lit) {
    g.fillGradientStyle(HOUSE.windowLit, HOUSE.windowLit, 0xffc15e, 0xffb347, 1);
  } else {
    g.fillGradientStyle(0x4a6178, 0x4a6178, HOUSE.windowGlass, HOUSE.windowGlass, 1);
  }
  g.fillRect(0, 0, w, h);
  // reflection streak
  g.fillStyle(0xffffff, 0.18);
  g.fillTriangle(0, 0, w * 0.5, 0, 0, h * 0.6);
  // mullions
  g.lineStyle(3, HOUSE.trim, 1);
  g.lineBetween(w / 2, 0, w / 2, h);
  g.lineBetween(0, h / 2, w, h / 2);
  win.add(g);

  if (lit) {
    const key = ensureGlowTexture(scene);
    const glow = scene.add.image(w / 2, h / 2, key)
      .setScale(w / 30).setTint(0xffd98a).setAlpha(0.16)
      .setBlendMode(Phaser.BlendModes.ADD);
    win.addAt(glow, 0);
  }
  parent.add(win);
  return win;
}

function addGarageDoor(scene, parent, x, y, w, h) {
  const g = scene.add.graphics();
  // frame
  g.fillStyle(HOUSE.garageLine, 1);
  g.fillRect(x - 4, y - 4, w + 8, h + 8);
  // door
  g.fillStyle(HOUSE.garage, 1);
  g.fillRect(x, y, w, h);
  // panel seams
  g.lineStyle(2, HOUSE.garageLine, 0.9);
  for (let r = 1; r < 4; r++) g.lineBetween(x, y + (h / 4) * r, x + w, y + (h / 4) * r);
  for (let cc = 1; cc < 3; cc++) g.lineBetween(x + (w / 3) * cc, y, x + (w / 3) * cc, y + h);
  // top row of little windows
  g.fillStyle(0x9fb3c4, 1);
  for (let cc = 0; cc < 3; cc++) g.fillRect(x + 8 + cc * (w / 3), y + 8, w / 3 - 16, h / 4 - 16);
  // shading
  g.fillStyle(0x000000, 0.06);
  g.fillRect(x, y, w, h);
  parent.add(g);
}

function addEntry(scene, parent, x, y, lit) {
  const g = scene.add.graphics();
  const doorW = 56, doorH = 100;
  const dx = x, dy = y;

  // steps
  g.fillStyle(0xcfc6b6, 1); g.fillRect(dx - 22, dy + doorH, doorW + 44, 14);
  g.fillStyle(0xbdb4a3, 1); g.fillRect(dx - 12, dy + doorH + 14, doorW + 24, 12);

  // portico columns
  g.fillStyle(HOUSE.trim, 1);
  g.fillRect(dx - 18, dy - 6, 8, doorH + 6);
  g.fillRect(dx + doorW + 10, dy - 6, 8, doorH + 6);
  // pediment
  g.fillStyle(HOUSE.trim, 1);
  g.fillTriangle(dx - 26, dy - 6, dx + doorW / 2, dy - 40, dx + doorW + 26, dy - 6);

  // door frame
  g.fillStyle(HOUSE.doorDark, 1);
  g.fillRoundedRect(dx - 4, dy - 4, doorW + 8, doorH + 8, 4);
  // door
  g.fillStyle(HOUSE.door, 1);
  g.fillRoundedRect(dx, dy, doorW, doorH, 3);
  // panels
  g.lineStyle(2, HOUSE.doorDark, 1);
  g.strokeRect(dx + 8, dy + 10, doorW - 16, doorH * 0.4 - 8);
  g.strokeRect(dx + 8, dy + doorH * 0.45, doorW - 16, doorH * 0.45);
  // knob
  g.fillStyle(0xe7c66b, 1); g.fillCircle(dx + doorW - 12, dy + doorH / 2, 3);
  parent.add(g);

  // warm light spilling from entry
  if (lit) {
    const key = ensureGlowTexture(scene);
    parent.add(scene.add.image(dx + doorW / 2, dy + doorH, key)
      .setScale(2.6).setTint(0xffdf9a).setAlpha(0.12)
      .setBlendMode(Phaser.BlendModes.ADD));
  }
}
