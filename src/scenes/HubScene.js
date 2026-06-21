import Phaser from "phaser";
import { PLAYER_SPEED } from "../config/gameConfig.js";
import { SKY, GROUND, CHAPTER_THEME, FOLIAGE } from "../art/palette.js";
import {
  drawSky, addSun, addCloud, addTree, addBush, addFlowers, addTreeline,
  addHills, addHazeBand, addForegroundGrass, addFlowerBed
} from "../art/Scenery.js";
import { addVignette, addColorGrade, addFireflies } from "../art/effects.js";
import { addHouse1166 } from "../art/House1166.js";
import { Character } from "../entities/Character.js";
import { signpost, hintPill, heading, topScrim } from "../ui/ui.js";
import { addSettings } from "../ui/settings.js";

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
// Ego Tavern building — moved left so the right-side tree doesn't block it.
const TAVERN = { x: 680, baseY: 648, doorX: 680, doorY: 656, markerDepth: 720 };

// The street at the very bottom of the yard. A "ROAD CLOSED" barricade blocks
// the way out until all the memories are collected; then the road to the
// theater opens and walking past ROAD_EXIT_Y leaves for the parking lot.
const STREET_TOP = WORLD_H - 72;
const ROAD_EXIT_Y = WORLD_H - 34;

const DEPTH = { fireflies: 50000, grade: 90000, vignette: 95000, ui: 100000 };

// TEMP: set to true to walk into the house without finishing DJ + Danielle.
// Flip back to false for the real, gated experience.
const PREVIEW_UNLOCK_TOGETHER = false;

export class HubScene extends Phaser.Scene {
  constructor() { super({ key: "HubScene" }); }

  init(data) {
    // When returning from a building/chapter, remember which one so we can drop
    // Dad right outside its door instead of back at the bottom of the yard.
    this._from = data && data.from ? data.from : null;
  }

  // Where to place Dad when he comes back out of a given entry.
  _spawnPoint() {
    const pts = {
      dj:        { x: TREE.x + 90,    y: TREE.y },
      danielle:  { x: SIGN.x,         y: SIGN.y + 46 },
      together:  { x: DOOR.x,         y: DOOR.y + 80 },
      egotavern: { x: TAVERN.doorX,   y: TAVERN.doorY + 46 }
    };
    const p = (this._from && pts[this._from]) || { x: WORLD_W / 2, y: WORLD_H - 130 };
    return {
      x: Phaser.Math.Clamp(p.x, 28, WORLD_W - 28),
      y: Phaser.Math.Clamp(p.y, HOUSE_BASE + 16, this.lowerY)
    };
  }

  create() {
    const { width, height } = this.scale;
    this.completed = this.registry.get("completedChapters") || [];
    this.togetherUnlocked = PREVIEW_UNLOCK_TOGETHER ||
      (this.completed.includes("dj") && this.completed.includes("danielle"));
    this.allDone = ["dj", "danielle", "together"].every(k => this.completed.includes(k));
    this.lowerY = this.allDone ? (WORLD_H - 30) : (STREET_TOP - 16);
    this._leaving = false;

    // ── Fixed sky behind everything ──
    drawSky(this, SKY.golden);
    const sun = addSun(this, 150, 108, { color: 0xfff0cf, glow: 0xffcf8f, radius: 40 });
    sun.halo.setScrollFactor(0); sun.disc.setScrollFactor(0);
    addCloud(this, 300, 90, 0.8);
    addCloud(this, 660, 130, 0.6);

    // ── Layered distance: far hills, tree-line, horizon haze ──
    addHills(this, GROUND_TOP - 4, { color: 0xb7c3c0, alpha: 0.45, scroll: 0.3, depth: -82, amp: 30 });
    addHills(this, GROUND_TOP + 6, { color: 0x9aaea4, alpha: 0.5, scroll: 0.45, depth: -80, amp: 48, step: 200 });
    const tl = addTreeline(this, 300, { color: 0x8fa893, alpha: 0.55, height: 120 });
    tl.setScrollFactor(0.6).setDepth(-78);
    addHazeBand(this, GROUND_TOP + 8, { color: 0xffe7c4, alpha: 0.2, scroll: 0.55 });

    // ── Ground spanning the whole tall world ──
    this._drawWorldGround();
    this._drawWalkway();

    // ── House (grounded), planted with foundation shrubs ──
    const house = addHouse1166(this, HOUSE_X, HOUSE_Y, { scale: HOUSE_SCALE, depth: HOUSE_BASE, lit: true });
    addBush(this, 360, HOUSE_BASE - 6, { scale: 0.8, depth: HOUSE_BASE + 1 });
    addBush(this, 600, HOUSE_BASE - 6, { scale: 0.7, depth: HOUSE_BASE + 1 });
    addBush(this, 305, HOUSE_BASE - 4, { scale: 0.6, depth: HOUSE_BASE + 1 });

    // porch light — on only when the house (Together) is unlocked
    this._addPorchLights(this.togetherUnlocked);

    // ── DJ: the big staple tree, front-left, spilling off screen ──
    addTree(this, TREE.x, TREE.y, { scale: 3.7, depth: TREE.y, foliage: [FOLIAGE.treeC, FOLIAGE.treeA, FOLIAGE.treeB] });
    // a few midground trees for depth
    addTree(this, 900, 740, { scale: 1.4, depth: 740 });
    addTree(this, 50, 600, { scale: 1.1, depth: 600 });

    // scattered foliage
    [[250, 520], [700, 600], [430, 700], [820, 980], [180, 860], [560, 1050], [350, 1180]]
      .forEach(([fx, fy]) => addFlowers(this, fx, fy, fy));

    // ── Entry markers ──
    this.entries = [];

    // DJ — glowing marker at the base/stump of the tree, the "DJ" label up on
    // the trunk and the "Press E" prompt tucked below the stump.
    this._entry("dj", TREE.x, TREE.y + 10, CHAPTER_THEME.dj.accent, "DJ", false, null, null,
      { labelDY: -150, labelSize: 22, pillDY: 40, doneDY: -182 });

    // Danielle — a flower bed beneath her signpost (matches her garden chapter)
    addFlowerBed(this, SIGN.x, SIGN.y + 8, { depth: SIGN.y - 2, width: 150 });
    const dSign = signpost(this, SIGN.x, SIGN.y, CHAPTER_THEME.danielle.label, CHAPTER_THEME.danielle.accent, SIGN.y);
    this._entry("danielle", SIGN.x, SIGN.y, CHAPTER_THEME.danielle.accent, "Danielle", false, dSign);

    // Together — the house door (locked until DJ + Danielle done)
    this._entry("together", DOOR.x, DOOR.y, CHAPTER_THEME.together.accent, "Together", !this.togetherUnlocked);

    // Ego Tavern — a fun side-room, always open
    this._addTavern(TAVERN.x, TAVERN.baseY);
    this._entry("egotavern", TAVERN.doorX, TAVERN.doorY, 0xff8ac0, "Ego Tavern", false, null, TAVERN.markerDepth);

    // street + barricade / open road to the theater
    this._addStreet(this.allDone);

    // ── Character (spawns just outside whichever building Dad just left) ──
    const start = this._spawnPoint();
    this.player = new Character(this, start.x, start.y, { scale: 1.15, depth: start.y });

    // ── Camera ──
    this.cameras.main.setBounds(0, 0, WORLD_W, WORLD_H);
    this.cameras.main.startFollow(this.player.root, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(width, 150);
    this.cameras.main.centerOn(start.x, start.y);
    this.cameras.main.fadeIn(700, 8, 6, 10);

    // ── Atmosphere overlays (fixed to screen) ──
    addFireflies(this, { count: 26, color: 0xffe6ac, depth: DEPTH.fireflies,
      area: { x: 0, y: GROUND_TOP, w: WORLD_W, h: WORLD_H - GROUND_TOP } });
    addColorGrade(this, 0xffdca8, 0.08).setDepth(DEPTH.grade);
    addVignette(this, 0.42).setDepth(DEPTH.vignette);

    // foreground framing: near-camera grass along the bottom edge
    addForegroundGrass(this, { color: 0x2c4a1e, alpha: 0.85 });

    // ── UI (fixed) ──
    topScrim(this, { height: 100, depth: DEPTH.ui - 1 });
    const h = heading(this, width / 2, 34, "Welcome home, Dad", { size: 24 });
    h.t.setScrollFactor(0).setDepth(DEPTH.ui);
    h.shadow.setScrollFactor(0).setDepth(DEPTH.ui);
    this.add.text(width / 2, 62, "Use arrow keys to explore  ·  press E at a glowing spot", {
      fontFamily: '"Nunito", sans-serif', fontSize: "13px", fontStyle: "700", color: "#ffffff",
      stroke: "#000000", strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.ui).setAlpha(0.95);

    this.toast = this.add.text(width / 2, height - 80, "", {
      fontFamily: '"Nunito", sans-serif', fontSize: "16px", fontStyle: "800",
      color: "#ffe6ac", backgroundColor: "#00000088", padding: { x: 14, y: 8 }
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.ui).setAlpha(0);

    if (this.allDone) {
      this.time.delayedCall(700, () => this._toast("The road's open — head down to the theater 🎬"));
    }

    // ── Input ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({ up: "W", down: "S", left: "A", right: "D" });
    this.eKey = this.input.keyboard.addKey("E");

    addSettings(this);
  }

  _entry(key, x, y, accent, label, locked, signObj = null, depthOverride = null, opts = {}) {
    const { labelDX = 0, labelDY = -54, labelSize = 16,
            pillDX = 0, pillDY = 26, doneDY = -76 } = opts;
    const done = this.completed.includes(key);
    const e = { key, x, y, accent, locked, signObj };
    // markers can be forced in front of a tall building (e.g. the tavern)
    const d = depthOverride ?? y;

    if (!signObj) {
      // glowing pedestal marker (tree / door)
      const c = this.add.container(x, y).setDepth(d);
      const glow = this.add.image(0, 0, "soft-glow").setScale(1.9)
        .setTint(locked ? 0x9aa0b0 : accent).setAlpha(locked ? 0.14 : 0.28)
        .setBlendMode(Phaser.BlendModes.ADD);
      c.add(glow);
      if (!locked) {
        this.tweens.add({ targets: glow, scale: 2.4, alpha: 0.42, duration: 1600, yoyo: true, repeat: -1 });
      }
      const tag = this.add.text(labelDX, labelDY, locked ? `🔒 ${label}` : label, {
        fontFamily: '"Fredoka", sans-serif', fontSize: `${labelSize}px`, fontStyle: "600",
        color: locked ? "#c9c9d6" : "#fff8ec", stroke: "#000000", strokeThickness: 3
      }).setOrigin(0.5);
      c.add(tag);
      e.glow = glow;
    }

    if (done) {
      this.add.text(x + labelDX, y + doneDY, "✓", {
        fontFamily: '"Fredoka", sans-serif', fontSize: "20px", fontStyle: "700", color: "#bfe3a8"
      }).setOrigin(0.5).setDepth(d);
    }

    const pill = hintPill(this, x + pillDX, y + pillDY, "Press  E", { accent: locked ? 0x9aa0b0 : accent });
    pill.setDepth(d).setVisible(false);
    e.pill = pill;
    this.entries.push(e);
  }

  // Two carriage-style sconces flanking the front door. They glow warmly when
  // the house is unlocked, and sit dark when it's still locked.
  _addPorchLights(on) {
    const depth = HOUSE_BASE + 3;
    [-46, 46].forEach((dx) => {
      const lx = DOOR.x + dx, ly = DOOR.y - 64;
      const g = this.add.graphics().setDepth(depth);
      // bracket + lantern body
      g.fillStyle(0x2b2b2b, 1); g.fillRect(lx - 1, ly - 16, 2, 10);
      g.fillStyle(0x35302a, 1); g.fillRoundedRect(lx - 6, ly - 6, 12, 18, 3);
      // glass
      g.fillStyle(on ? 0xffe6a3 : 0x4a4a4a, 1);
      g.fillRoundedRect(lx - 4, ly - 4, 8, 14, 2);
      // cap
      g.fillStyle(0x2b2b2b, 1); g.fillTriangle(lx - 7, ly - 6, lx, ly - 13, lx + 7, ly - 6);

      if (on) {
        const glow = this.add.image(lx, ly + 2, "soft-glow").setScale(1.3)
          .setTint(0xffd483).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth);
        // soft downward light spill onto the porch
        const spill = this.add.image(lx, ly + 30, "soft-glow").setScale(1.6, 2.2)
          .setTint(0xffcf7a).setAlpha(0.16).setBlendMode(Phaser.BlendModes.ADD).setDepth(depth);
        this.tweens.add({ targets: [glow, spill], alpha: "-=0.08", duration: 1700,
          yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
      }
    });
  }

  // A cozy Tudor-style pub planted in the yard, base at (x, baseY).
  _addTavern(x, baseY) {
    const c = this.add.container(x, baseY).setDepth(baseY);
    const PLASTER = 0xe9dcc0, BEAM = 0x5e3d22, ROOF = 0x4a3322, ROOF_HI = 0x5d4630;
    const g = this.add.graphics();

    // grounding shadow
    g.fillStyle(0x000000, 0.2); g.fillEllipse(0, 4, 180, 26);

    // walls
    g.fillStyle(PLASTER, 1); g.fillRect(-74, -150, 148, 150);
    g.fillStyle(0x000000, 0.06); g.fillRect(-74, -150, 148, 150);
    // timber framing
    g.fillStyle(BEAM, 1);
    g.fillRect(-74, -150, 148, 8);   // top plate
    g.fillRect(-74, -8, 148, 8);     // sill
    g.fillRect(-74, -150, 8, 150);   // left post
    g.fillRect(66, -150, 8, 150);    // right post
    g.fillRect(-4, -150, 8, 150);    // center post
    // cross braces
    g.lineStyle(6, BEAM, 1);
    g.lineBetween(-66, -142, -10, -80);
    g.lineBetween(66, -142, 10, -80);

    // pitched roof (overhanging)
    g.fillStyle(ROOF, 1);
    g.fillTriangle(-92, -150, 0, -210, 92, -150);
    g.fillStyle(ROOF_HI, 1);
    g.fillTriangle(-92, -150, -84, -150, -8, -206);
    g.fillStyle(0x3a2a1c, 1); g.fillRect(-92, -150, 184, 6);

    // a little brick chimney with a warm glow
    g.fillStyle(0x7a4a34, 1); g.fillRect(44, -206, 16, 30);
    g.fillStyle(0x5e3726, 1); g.fillRect(44, -206, 16, 5);

    // windows (warm, lit)
    [-40, 40].forEach((wx) => {
      g.fillStyle(0x3a2a1c, 1); g.fillRoundedRect(wx - 16, -118, 32, 34, 3);
      g.fillStyle(0xffd98a, 1); g.fillRoundedRect(wx - 13, -115, 26, 28, 2);
      g.lineStyle(2, 0x3a2a1c, 1);
      g.lineBetween(wx, -115, wx, -87); g.lineBetween(wx - 13, -101, wx + 13, -101);
    });

    // arched door (the entry)
    g.fillStyle(0x3f2716, 1); g.fillRoundedRect(-20, -64, 40, 64, 6);
    g.fillStyle(0x5c3a24, 1); g.fillRoundedRect(-16, -58, 32, 58, 5);
    g.fillStyle(0x3f2716, 1); g.fillCircle(9, -30, 2); // handle
    g.lineStyle(2, 0x3f2716, 0.6); g.lineBetween(0, -58, 0, 0);
    c.add(g);

    // warm window glow + a lantern by the door
    const key = "soft-glow";
    [-40, 40].forEach((wx) => {
      c.add(this.add.image(wx, -100, key).setScale(1.1).setTint(0xffce7a)
        .setAlpha(0.28).setBlendMode(Phaser.BlendModes.ADD));
    });
    const lantern = this.add.image(28, -66, key).setScale(0.9).setTint(0xffb86a)
      .setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD);
    c.add(lantern);
    this.tweens.add({ targets: lantern, alpha: 0.3, duration: 1500, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    // hanging sign board: "EGO TAVERN"
    const sign = this.add.container(-90, -120);
    const sg = this.add.graphics();
    sg.fillStyle(BEAM, 1); sg.fillRect(0, -36, 26, 5);       // bracket
    sg.fillStyle(0x6b4a2f, 1); sg.fillRoundedRect(-30, -30, 50, 34, 4);
    sg.lineStyle(2, 0xb8902f, 1); sg.strokeRoundedRect(-30, -30, 50, 34, 4);
    sign.add(sg);
    sign.add(this.add.text(-5, -13, "EGO\nTAVERN", {
      fontFamily: '"Fredoka", sans-serif', fontSize: "9px", fontStyle: "700",
      color: "#ffe6ac", align: "center", lineSpacing: -1
    }).setOrigin(0.5));
    sign.setAngle(-4);
    c.add(sign);
    this.tweens.add({ targets: sign, angle: 4, duration: 2600, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
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

  // The street across the bottom of the yard, with either a barricade (locked)
  // or a glowing open road to the theater (all memories done).
  _addStreet(open) {
    const g = this.add.graphics().setDepth(-60);
    g.fillStyle(0xbdb6a4, 1); g.fillRect(0, STREET_TOP - 10, WORLD_W, 10);      // curb
    g.fillStyle(0x2c2c33, 1); g.fillRect(0, STREET_TOP, WORLD_W, WORLD_H - STREET_TOP); // asphalt
    g.fillStyle(0xd8d2bf, 0.5);
    for (let x = 20; x < WORLD_W; x += 70) g.fillRect(x, WORLD_H - 30, 36, 5);  // lane dashes
    open ? this._theaterRoad() : this._roadblock();
  }

  _roadblock() {
    const y = STREET_TOP - 4;
    const c = this.add.container(WORLD_W / 2, y).setDepth(y + 60);
    const g = this.add.graphics();
    [-150, 0, 150].forEach((bx) => {
      g.fillStyle(0xe0a030, 1); g.fillRoundedRect(bx - 70, -6, 140, 16, 3);
      g.fillStyle(0x2a2a2a, 1);
      for (let s = -64; s < 70; s += 24) g.fillRect(bx + s, -6, 11, 16);
      g.fillStyle(0x6b4a2f, 1); g.fillRect(bx - 58, 8, 8, 26); g.fillRect(bx + 50, 8, 8, 26);
    });
    c.add(g);
    c.add(this.add.text(0, -44, "ROAD CLOSED", {
      fontFamily: '"Fredoka", sans-serif', fontSize: "18px", fontStyle: "700",
      color: "#ffe1a8", backgroundColor: "#8a1f2e", padding: { x: 10, y: 5 },
      stroke: "#000000", strokeThickness: 3
    }).setOrigin(0.5));
    c.add(this.add.text(0, -20, "collect all the memories to open the road", {
      fontFamily: '"Nunito", sans-serif', fontSize: "12px", fontStyle: "700",
      color: "#ffffff", stroke: "#000000", strokeThickness: 2
    }).setOrigin(0.5).setAlpha(0.85));
  }

  _theaterRoad() {
    const y = WORLD_H - 40;
    const glow = this.add.image(WORLD_W / 2, y, "soft-glow").setScale(3, 1.6)
      .setTint(0xffd56b).setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(y);
    this.tweens.add({ targets: glow, alpha: 0.55, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    const arrow = this.add.text(WORLD_W / 2, y - 30, "🎬  To the theater  ↓", {
      fontFamily: '"Fredoka", sans-serif', fontSize: "18px", fontStyle: "700",
      color: "#fff8ec", stroke: "#000000", strokeThickness: 4
    }).setOrigin(0.5).setDepth(y + 60);
    this.tweens.add({ targets: arrow, y: y - 22, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
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
    const ny = Phaser.Math.Clamp(p.y + vy * (delta / 1000), HOUSE_BASE + 16, this.lowerY);
    p.setPosition(nx, ny);
    p.setDepth(ny);
    p.update(vx, vy, delta);

    // walk down the open road → off to the theater
    if (this.allDone && !this._leaving && p.y >= ROAD_EXIT_Y) {
      this._leaving = true;
      this.cameras.main.fadeOut(600, 8, 6, 10);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("ParkingLotScene"));
      return;
    }

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
        if (near.key === "egotavern") this.scene.start("EgoTavernScene");
        else this.scene.start("ChapterScene", { chapter: near.key });
      });
    }
  }
}
