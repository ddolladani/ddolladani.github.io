import Phaser from "phaser";
import { UI, hex } from "../art/palette.js";

// Rounded panel with drop shadow.
export function panel(scene, x, y, w, h, opts = {}) {
  const { radius = 16, fill = UI.panel, alpha = 0.92, depth = 100 } = opts;
  const c = scene.add.container(x, y).setDepth(depth);
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.35); g.fillRoundedRect(-w / 2 + 4, -h / 2 + 6, w, h, radius);
  g.fillStyle(fill, alpha);    g.fillRoundedRect(-w / 2, -h / 2, w, h, radius);
  g.lineStyle(2, 0xffffff, 0.08); g.strokeRoundedRect(-w / 2, -h / 2, w, h, radius);
  c.add(g);
  return c;
}

// A soft dark gradient bar pinned to the top of the screen. Sits behind the
// HUD so white text reads cleanly over bright skies, fading to nothing so it
// doesn't look like a hard banner.
export function topScrim(scene, opts = {}) {
  const { height = 96, alpha = 0.55, depth = 99999 } = opts;
  const { width } = scene.scale;
  const g = scene.add.graphics().setScrollFactor(0).setDepth(depth);
  g.fillGradientStyle(0x000000, 0x000000, 0x000000, 0x000000, alpha, alpha, 0, 0);
  g.fillRect(0, 0, width, height);
  return g;
}

// A small "hint" pill at a position (e.g. "Press E to open").
export function hintPill(scene, x, y, text, opts = {}) {
  const { depth = 120, accent = UI.gold } = opts;
  const c = scene.add.container(x, y).setDepth(depth);
  const label = scene.add.text(0, 0, text, {
    fontFamily: '"Nunito", sans-serif', fontSize: "14px", fontStyle: "700",
    color: "#ffffff"
  }).setOrigin(0.5);
  const w = label.width + 28;
  const h = 30;
  const g = scene.add.graphics();
  g.fillStyle(0x000000, 0.3); g.fillRoundedRect(-w / 2 + 2, -h / 2 + 3, w, h, h / 2);
  g.fillStyle(UI.ink, 0.9);   g.fillRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  g.lineStyle(2, accent, 0.9); g.strokeRoundedRect(-w / 2, -h / 2, w, h, h / 2);
  c.add([g, label]);
  c.setScale(0.9);
  c.labelText = label;   // exposed so callers can swap the text
  scene.tweens.add({ targets: c, y: y - 6, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  return c;
}

// Heading text with our display font + soft shadow.
export function heading(scene, x, y, text, opts = {}) {
  const { size = 28, color = hex(UI.cream), depth = 110, origin = 0.5 } = opts;
  const shadow = scene.add.text(x + 2, y + 3, text, {
    fontFamily: '"Fredoka", sans-serif', fontSize: `${size}px`, fontStyle: "700",
    color: "#000000"
  }).setOrigin(origin).setAlpha(0.35).setDepth(depth);
  const t = scene.add.text(x, y, text, {
    fontFamily: '"Fredoka", sans-serif', fontSize: `${size}px`, fontStyle: "700",
    color, stroke: "#000000", strokeThickness: Math.max(3, size * 0.14)
  }).setOrigin(origin).setDepth(depth);
  t.setShadow(0, 2, "#000000", 4, false, true);
  return { t, shadow };
}

// Wooden chapter signpost used in the hub.
export function signpost(scene, x, y, label, accent, depth = 30) {
  const c = scene.add.container(x, y).setDepth(depth);
  c.add(scene.add.ellipse(0, 4, 60, 16, 0x000000, 0.18));
  const g = scene.add.graphics();
  // post
  g.fillStyle(0x6b4a2f, 1); g.fillRoundedRect(-6, -70, 12, 78, 4);
  g.fillStyle(0x4f3622, 1); g.fillRoundedRect(0, -70, 6, 78, 3);
  // board
  g.fillStyle(0x8a623d, 1); g.fillRoundedRect(-52, -98, 104, 40, 8);
  g.fillStyle(0x6b4a2f, 1);  g.fillRoundedRect(-52, -98, 104, 40, 8);
  g.lineStyle(3, accent, 1); g.strokeRoundedRect(-50, -96, 100, 36, 7);
  c.add(g);
  c.add(scene.add.text(0, -78, label, {
    fontFamily: '"Fredoka", sans-serif', fontSize: "16px", fontStyle: "600",
    color: "#fff8ec"
  }).setOrigin(0.5));
  return c;
}
