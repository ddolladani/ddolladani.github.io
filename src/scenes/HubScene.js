import Phaser from "phaser";
import { PLAYER_SPEED } from "../config/gameConfig.js";
import { SKY, GROUND, CHAPTER_THEME, FOLIAGE } from "../art/palette.js";
import {
  drawSky, addSun, addCloud, addTree, addBush, addFlowers, addTreeline
} from "../art/Scenery.js";
import { addVignette, addColorGrade, addFireflies } from "../art/effects.js";
import { addHouse1166 } from "../art/House1166.js";
import { Character } from "../entities/Character.js";
import { signpost, hintPill, heading } from "../ui/ui.js";

// Vertical-scrolling yard: the camera follows Dad as he walks up the lawn
// toward the house, giving the scene real depth.
const WORLD_W = 960;
const WORLD_H = 1340;
const GROUND_TOP = 300;     // grass starts here (house plants into it)
const HOUSE_BASE = 380;     // y where the house meets the lawn

// Entry points
const HOUSE_X = 276, HOUSE_Y = 162, HOUSE_SCALE = 0.66;
const DOOR = { x: 471, y: 384 };
const TREE = { x: 96, y: 1130 };   // big DJ tree, partly off the left edge
const SIGN = { x: 772, y: 900 };   // Danielle's signpost

const DEPTH = { fireflies: 50000, grade: 90000, vignette: 95000, ui: 100000 };

// TEMP: set to true to walk into the house without finishing DJ + Danielle.
// Flip back to false for the real, gated experience.
const PREVIEW_UNLOCK_TOGETHER = true;

export class HubScene extends Phaser.Scene {
  constructor() { super({ key: "HubScene" }); }

  create() {
    const { width, height } = this.scale;
    this.completed = this.registry.get("completedChapters") || [];
    this.togetherUnlocked = PREVIEW_UNLOCK_TOGETHER ||
      (this.completed.includes("dj") && this.completed.includes("danielle"));

    // ── Fixed sky behind everything ──
    drawSky(this, SKY.golden);
    const sun = addSun(this, 150, 108, { color: 0xfff0cf, glow: 0xffcf8f, radius: 40 });
    sun.halo.setScrollFactor(0); sun.disc.setScrollFactor(0);
    addCloud(this, 300, 90, 0.8);
    addCloud(this, 660, 130, 0.6);

    // ── Distant tree-line behind the house ──
    const tl = addTreeline(this, 300, { color: 0x8fa893, alpha: 0.55, height: 120 });
    tl.setScrollFactor(0.6).setDepth(-78);

    // ── Ground spanning the whole tall world ──
    this._drawWorldGround();
    this._drawWalkway();

    // ── House (grounded), planted with foundation shrubs ──
    const house = addHouse1166(this, HOUSE_X, HOUSE_Y, { scale: HOUSE_SCALE, depth: HOUSE_BASE, lit: true });
    addBush(this, 360, HOUSE_BASE - 6, { scale: 0.8, depth: HOUSE_BASE + 1 });
    addBush(this, 600, HOUSE_BASE - 6, { scale: 0.7, depth: HOUSE_BASE + 1 });
    addBush(this, 305, HOUSE_BASE - 4, { scale: 0.6, depth: HOUSE_BASE + 1 });

    // ── DJ: the big tree, front-left, spilling off screen ──
    addTree(this, TREE.x, TREE.y, { scale: 2.2, depth: TREE.y, foliage: [FOLIAGE.treeC, FOLIAGE.treeA, FOLIAGE.treeB] });
    // a few midground trees for depth
    addTree(this, 880, 720, { scale: 1.3, depth: 720 });
    addTree(this, 60, 560, { scale: 1.0, depth: 560 });

    // scattered foliage
    [[250, 520], [700, 600], [430, 700], [820, 980], [180, 860], [560, 1050], [350, 1180]]
      .forEach(([fx, fy]) => addFlowers(this, fx, fy, fy));

    // ── Entry markers ──
    this.entries = [];

    // DJ — glowing marker at the base of the tree
    this._entry("dj", TREE.x + 70, TREE.y - 30, CHAPTER_THEME.dj.accent, "DJ", false);

    // Danielle — signpost
    const dSign = signpost(this, SIGN.x, SIGN.y, CHAPTER_THEME.danielle.label, CHAPTER_THEME.danielle.accent, SIGN.y);
    this._entry("danielle", SIGN.x, SIGN.y, CHAPTER_THEME.danielle.accent, "Danielle", false, dSign);

    // Together — the house door (locked until DJ + Danielle done)
    this._entry("together", DOOR.x, DOOR.y, CHAPTER_THEME.together.accent, "Together", !this.togetherUnlocked);

    // ── Character ──
    this.player = new Character(this, WORLD_W / 2, WORLD_H - 130, { scale: 1.15, depth: WORLD_H - 130 });

    // ── Camera ──
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player.root, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(width, 150);
    this.cameras.main.fadeIn(700, 8, 6, 10);

    // ── Atmosphere overlays (fixed to screen) ──
    addFireflies(this, { count: 26, color: 0xffe6ac, depth: DEPTH.fireflies,
      area: { x: 0, y: GROUND_TOP, w: WORLD_W, h: WORLD_H - GROUND_TOP } });
    addColorGrade(this, 0xffdca8, 0.08).setDepth(DEPTH.grade);
    addVignette(this, 0.42).setDepth(DEPTH.vignette);

    // ── UI (fixed) ──
    const h = heading(this, width / 2, 34, "Welcome home, Dad", { size: 24 });
    h.t.setScrollFactor(0).setDepth(DEPTH.ui);
    h.shadow.setScrollFactor(0).setDepth(DEPTH.ui);
    this.add.text(width / 2, 62, "Use arrow keys to explore  ·  press E at a glowing spot", {
      fontFamily: '"Nunito", sans-serif', fontSize: "13px", fontStyle: "700", color: "#ffffff"
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.ui).setAlpha(0.85);

    this.toast = this.add.text(width / 2, height - 80, "", {
      fontFamily: '"Nunito", sans-serif', fontSize: "16px", fontStyle: "800",
      color: "#ffe6ac", backgroundColor: "#00000088", padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.ui).setAlpha(0);

    // ── Input ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({ up: "W", down: "S", left: "A", right: "D" });
    this.eKey = this.input.keyboard.addKey("E");
  }

  _entry(key, x, y, accent, label, locked, signObj = null) {
    const done = this.completed.includes(key);
    const e = { key, x, y, accent, locked, signObj };

    if (!signObj) {
      // glowing pedestal marker (tree / door)
      const c = this.add.container(x, y).setDepth(y);
      const glow = this.add.image(0, 0, "soft-glow").setScale(2.4)
        .setTint(locked ? 0x9aa0b0 : accent).setAlpha(locked ? 0.25 : 0.5)
        .setBlendMode(Phaser.BlendModes.ADD);
      c.add(glow);
      if (!locked) {
        this.tweens.add({ targets: glow, scale: 3.0, alpha: 0.7, duration: 1500, yoyo: true, repeat: -1 });
      }
      const tag = this.add.text(0, -54, locked ? `🔒 ${label}` : label, {
        fontFamily: '"Fredoka", sans-serif', fontSize: "16px", fontStyle: "600",
        color: locked ? "#c9c9d6" : "#fff8ec", stroke: "#000000", strokeThickness: 3
      }).setOrigin(0.5);
      c.add(tag);
      e.glow = glow;
    }

    if (done) {
      this.add.text(x, y - 76, "✓", {
        fontFamily: '"Fredoka", sans-serif', fontSize: "20px", fontStyle: "700", color: "#bfe3a8"
      }).setOrigin(0.5).setDepth(y);
    }

    const pill = hintPill(this, x, y + 26, "Press  E", { accent: locked ? 0x9aa0b0 : accent });
    pill.setDepth(y).setVisible(false);
    e.pill = pill;
    this.entries.push(e);
  }

  _drawWorldGround() {
    const g = this.add.graphics().setDepth(-70);
    g.fillGradientStyle(GROUND.grass.top, GROUND.grass.top, GROUND.grass.bot, GROUND.grass.bot, 1);
    g.fillRect(0, GROUND_TOP, WORLD_W, WORLD_H - GROUND_TOP);
    g.fillStyle(GROUND.grass.top, 0.5);
    g.fillRect(0, GROUND_TOP, WORLD_W, 12);
    // texture tufts
    const t = this.add.graphics().setDepth(-69);
    for (let i = 0; i < 320; i++) {
      const x = Math.random() * WORLD_W;
      const y = GROUND_TOP + 14 + Math.random() * (WORLD_H - GROUND_TOP - 14);
      t.fillStyle(0x5a7e3c, 0.4);
      const hh = 3 + Math.random() * 5;
      t.fillTriangle(x, y, x + 2, y - hh, x + 4, y);
    }
  }

  _drawWalkway() {
    const g = this.add.graphics().setDepth(-65);
    // perspective path: narrow at the door, wider toward the foreground
    g.fillStyle(0xc6bda8, 1);
    g.fillPoints([
      new Phaser.Geom.Point(DOOR.x - 26, HOUSE_BASE),
      new Phaser.Geom.Point(DOOR.x + 26, HOUSE_BASE),
      new Phaser.Geom.Point(WORLD_W / 2 + 78, WORLD_H),
      new Phaser.Geom.Point(WORLD_W / 2 - 78, WORLD_H)
    ], true);
    // edge shading for a touch of depth
    g.fillStyle(0xb3aa94, 0.5);
    g.fillPoints([
      new Phaser.Geom.Point(DOOR.x + 18, HOUSE_BASE),
      new Phaser.Geom.Point(DOOR.x + 26, HOUSE_BASE),
      new Phaser.Geom.Point(WORLD_W / 2 + 78, WORLD_H),
      new Phaser.Geom.Point(WORLD_W / 2 + 54, WORLD_H)
    ], true);
  }

  _toast(msg) {
    this.toast.setText(msg).setAlpha(1);
    this.tweens.killTweensOf(this.toast);
    this.tweens.add({ targets: this.toast, alpha: 0, delay: 1800, duration: 600 });
  }

  update(time, delta) {
    const p = this.player;
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown)   vx = -PLAYER_SPEED;
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx =  PLAYER_SPEED;
    if (this.cursors.up.isDown || this.wasd.up.isDown)       vy = -PLAYER_SPEED;
    if (this.cursors.down.isDown || this.wasd.down.isDown)   vy =  PLAYER_SPEED;

    const nx = Phaser.Math.Clamp(p.x + vx * (delta / 1000), 28, WORLD_W - 28);
    const ny = Phaser.Math.Clamp(p.y + vy * (delta / 1000), HOUSE_BASE + 16, WORLD_H - 30);
    p.setPosition(nx, ny);
    p.setDepth(ny);
    p.update(vx, vy, delta);

    let near = null;
    for (const e of this.entries) {
      const inRange = Phaser.Math.Distance.Between(p.x, p.y, e.x, e.y) < 96;
      e.pill.setVisible(inRange);
      if (inRange) near = e;
    }

    if (near && Phaser.Input.Keyboard.JustDown(this.eKey)) {
      if (near.locked) {
        this._toast("Finish DJ and Danielle's chapters first 💛");
        return;
      }
      this.cameras.main.fadeOut(450, 8, 6, 10);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("ChapterScene", { chapter: near.key });
      });
    }
  }
}
