import Phaser from "phaser";
import { PLAYER_SPEED } from "../config/gameConfig.js";
import { CHAPTER_THEME } from "../art/palette.js";
import {
  drawSky, addSun, addCloud, addTree, addBush, addFlowers, addTreehouse
} from "../art/Scenery.js";
import { drawLivingRoom } from "../art/HouseInterior.js";
import { addVignette, addColorGrade, addFireflies } from "../art/effects.js";
import { Character } from "../entities/Character.js";
import { MemorySpot } from "../entities/MemorySpot.js";
import { memories } from "../config/memories.js";
import { heading, hintPill } from "../ui/ui.js";

const MEMORY_RADIUS = 70;
const DEPTH = { fireflies: 50000, grade: 90000, vignette: 95000, ui: 100000 };

// Outdoor chapters scroll vertically; the interior is one fixed room.
const INTERIOR_FLOOR = 300;
const OUTDOOR_WORLD_H = 1200;
const OUTDOOR_GROUND_TOP = 320;

// Memory spot positions (outdoor ones are spread down a tall world)
const SPOT_LAYOUTS = {
  dj: [
    { x: 220, y: 560 }, { x: 700, y: 650 }, { x: 380, y: 800 },
    { x: 760, y: 940 }, { x: 240, y: 1060 }
  ],
  danielle: [
    { x: 260, y: 580 }, { x: 690, y: 660 }, { x: 440, y: 830 },
    { x: 750, y: 980 }, { x: 210, y: 1070 }
  ],
  together: [
    { x: 180, y: 430 }, { x: 370, y: 520 }, { x: 520, y: 430 },
    { x: 670, y: 525 }, { x: 810, y: 445 }
  ]
};

export class ChapterScene extends Phaser.Scene {
  constructor() { super({ key: "ChapterScene" }); }

  init(data) {
    this.chapterKey = data.chapter;
    this.theme = CHAPTER_THEME[data.chapter];
    this.found = new Set(this.registry.get(`found_${data.chapter}`) || []);
    this.isInterior = data.chapter === "together";
    this.worldH = this.isInterior ? this.scale.height : OUTDOOR_WORLD_H;
    this.topLimit = this.isInterior ? INTERIOR_FLOOR + 20 : OUTDOOR_GROUND_TOP + 40;
  }

  create() {
    const { width, height } = this.scale;

    this._buildEnvironment(width, height);

    // ── Memory spots ──
    this.spots = [];
    const layout = SPOT_LAYOUTS[this.chapterKey];
    const mems = memories[this.chapterKey];
    layout.forEach((pos, i) => {
      const spot = new MemorySpot(this, pos.x, pos.y, i, this.theme.accent);
      spot.memData = mems[i];
      spot.root.setDepth(pos.y);
      if (this.found.has(i)) spot.markFound();
      this.spots.push(spot);
    });

    // ── Character ──
    const startY = this.isInterior ? height - 70 : this.worldH - 110;
    this.player = new Character(this, width / 2, startY, { scale: 1.1, depth: startY });

    // ── Camera ──
    if (!this.isInterior) {
      this.cameras.main.setBounds(0, 0, width, this.worldH);
      this.cameras.main.startFollow(this.player.root, true, 0.12, 0.12);
      this.cameras.main.setDeadzone(width, 150);
    }

    // ── Overlays (fixed to screen) ──
    const area = { x: 0, y: this.isInterior ? 80 : OUTDOOR_GROUND_TOP, w: width, h: this.worldH };
    addFireflies(this, { count: this.isInterior ? 16 : 22, color: this._moteColor(), depth: DEPTH.fireflies, area });
    addColorGrade(this, this._gradeColor(), 0.08).setDepth(DEPTH.grade);
    addVignette(this, 0.45).setDepth(DEPTH.vignette);

    // ── UI (fixed) ──
    const h = heading(this, width / 2, 34, this.theme.label, { size: 26 });
    h.t.setScrollFactor(0).setDepth(DEPTH.ui);
    h.shadow.setScrollFactor(0).setDepth(DEPTH.ui);
    this.progressText = this.add.text(width - 20, 30, `${this.found.size} / 5`, {
      fontFamily: '"Fredoka", sans-serif', fontSize: "18px", fontStyle: "600", color: "#ffffff"
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(DEPTH.ui);
    this.add.text(20, 30, "ESC  ·  back to 1166", {
      fontFamily: '"Nunito", sans-serif', fontSize: "13px", fontStyle: "600", color: "#ffffff"
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(DEPTH.ui).setAlpha(0.7);

    this.hint = hintPill(this, 0, 0, "Press  E  to revisit", { accent: this.theme.accent });
    this.hint.setVisible(false);

    // ── Input ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({ up: "W", down: "S", left: "A", right: "D" });
    this.eKey = this.input.keyboard.addKey("E");
    this.escKey = this.input.keyboard.addKey("ESC");

    this.completedOnce = this.found.size >= 5;
    this.events.on("memory-closed", ({ chapter, index }) => {
      const wasNew = !this.found.has(index);
      this.found.add(index);
      this.registry.set(`found_${chapter}`, [...this.found]);
      this.spots[index]?.markFound();
      this.progressText.setText(`${this.found.size} / 5`);
      if (wasNew && this.found.size >= 5 && !this.completedOnce) {
        this.completedOnce = true;
        this._completeChapter();
      }
    });

    this.cameras.main.fadeIn(700, 6, 8, 16);
  }

  _moteColor() {
    if (this.isInterior) return 0xffe2b0;
    if (this.chapterKey === "danielle") return 0xffd9a8;
    return 0xe6eaa6; // dj forest: soft green-gold pollen
  }
  _gradeColor() {
    if (this.isInterior) return 0xffcf8f;
    if (this.chapterKey === "danielle") return 0xffcf9a;
    return 0xcfe0a8; // dj forest: gentle green wash
  }

  _buildEnvironment(width, height) {
    if (this.isInterior) { drawLivingRoom(this, { floorY: INTERIOR_FLOOR }); return; }
    if (this.chapterKey === "dj") { this._buildForest(width); return; }
    this._buildGarden(width);
  }

  // DJ's world is up in the trees — a dense, sun-dappled wood with a treehouse.
  _buildForest(width) {
    const FGREEN = [0x244a23, 0x315c2e, 0x3f6e3a];
    drawSky(this, this.theme.sky);

    // dense forest edge across the far top so the sky barely peeks through
    const edge = this.add.graphics().setDepth(-72);
    for (let x = -20; x < width + 40; x += 46) {
      const r = Phaser.Math.Between(54, 88);
      edge.fillStyle(0x1f3d20, 1); edge.fillCircle(x, OUTDOOR_GROUND_TOP - 20, r);
      edge.fillStyle(0x2a4d28, 1); edge.fillCircle(x + 16, OUTDOOR_GROUND_TOP - 36, r * 0.7);
    }
    edge.fillStyle(0x1f3d20, 1); edge.fillRect(0, 0, width, OUTDOOR_GROUND_TOP - 24);

    // mossy forest floor
    this._drawTallGround({ top: 0x59693a, bot: 0x3a4a24 });

    // big trees crowding both sides + a few mid trees, all depth-sorted
    const T = (x, y, s) => addTree(this, x, y, { scale: s, depth: y, foliage: FGREEN });
    T(36, 520, 1.9);  T(60, 820, 2.2);  T(20, 1080, 1.8);
    T(936, 560, 2.0); T(956, 900, 2.3); T(910, 1140, 1.8);
    T(250, 470, 1.2); T(720, 470, 1.3);

    // the treehouse — centerpiece
    addTreehouse(this, 470, 770, { scale: 1.2, depth: 770 });

    // ferns / undergrowth
    [[150, 980], [820, 1020], [360, 1120], [640, 1160], [200, 640]]
      .forEach(([x, y]) => addBush(this, x, y, { scale: 0.7, depth: y, color: 0x3f6e3a, dark: 0x2a4d28 }));

    // a couple of very soft dappled light shafts (kept subtle)
    const shafts = this.add.graphics().setDepth(-66);
    [[300, 0.05], [620, 0.04]].forEach(([sx, a]) => {
      shafts.fillStyle(0xfff3c0, a);
      shafts.fillPoints([
        new Phaser.Geom.Point(sx, OUTDOOR_GROUND_TOP),
        new Phaser.Geom.Point(sx + 70, OUTDOOR_GROUND_TOP),
        new Phaser.Geom.Point(sx + 160, this.worldH),
        new Phaser.Geom.Point(sx - 30, this.worldH)
      ], true);
    });
  }

  // Danielle's world — a flower garden at golden hour.
  _buildGarden(width) {
    drawSky(this, this.theme.sky);
    const sun = addSun(this, 480, 140, { color: 0xfff0d0, glow: 0xffb877, radius: 46 });
    sun.halo.setScrollFactor(0); sun.disc.setScrollFactor(0);
    addCloud(this, 720, 80, 0.8);

    this._drawTallGround();

    const gardenGreen = [0x6a8a3a, 0x7fa148, 0x8db854];
    addTree(this, 900, OUTDOOR_GROUND_TOP + 90, { scale: 1.6, depth: OUTDOOR_GROUND_TOP + 90, foliage: gardenGreen });
    addTree(this, 80, 820, { scale: 1.4, depth: 820, foliage: gardenGreen });
    addBush(this, 160, OUTDOOR_GROUND_TOP + 24, { scale: 1.0, depth: OUTDOOR_GROUND_TOP + 24, color: 0x7a9a48, dark: 0x5f7e36 });
    addBush(this, 720, 640, { scale: 0.8, depth: 640, color: 0x7a9a48, dark: 0x5f7e36 });
    for (let i = 0; i < 22; i++) {
      addFlowers(this, 60 + Math.random() * 840,
        OUTDOOR_GROUND_TOP + 40 + Math.random() * (OUTDOOR_WORLD_H - OUTDOOR_GROUND_TOP - 80));
    }
  }

  _drawTallGround(palOverride) {
    const { width } = this.scale;
    const pal = palOverride || this.theme.ground;
    const g = this.add.graphics().setDepth(-70);
    g.fillGradientStyle(pal.top, pal.top, pal.bot, pal.bot, 1);
    g.fillRect(0, OUTDOOR_GROUND_TOP, width, this.worldH - OUTDOOR_GROUND_TOP);
    g.fillStyle(pal.top, 0.5);
    g.fillRect(0, OUTDOOR_GROUND_TOP, width, 12);
    const t = this.add.graphics().setDepth(-69);
    for (let i = 0; i < 300; i++) {
      const x = Math.random() * width;
      const y = OUTDOOR_GROUND_TOP + 14 + Math.random() * (this.worldH - OUTDOOR_GROUND_TOP - 14);
      t.fillStyle(0xffffff, 0.05);
      const hh = 3 + Math.random() * 5;
      t.fillTriangle(x, y, x + 2, y - hh, x + 4, y);
    }
  }

  _completeChapter() {
    const completed = this.registry.get("completedChapters") || [];
    if (!completed.includes(this.chapterKey)) {
      completed.push(this.chapterKey);
      this.registry.set("completedChapters", completed);
    }
    this.add.text(this.scale.width / 2, this.scale.height / 2, "Chapter complete  💛", {
      fontFamily: '"Fredoka", sans-serif', fontSize: "30px", fontStyle: "700",
      color: "#ffe6ac", stroke: "#000000", strokeThickness: 4
    }).setOrigin(0.5).setDepth(DEPTH.ui).setScrollFactor(0);
    this.time.delayedCall(1500, () => {
      this.cameras.main.fadeOut(700, 6, 8, 16);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start(completed.length >= 3 ? "EndingScene" : "HubScene");
      });
    });
  }

  update(time, delta) {
    const p = this.player;
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown)   vx = -PLAYER_SPEED;
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx =  PLAYER_SPEED;
    if (this.cursors.up.isDown || this.wasd.up.isDown)       vy = -PLAYER_SPEED;
    if (this.cursors.down.isDown || this.wasd.down.isDown)   vy =  PLAYER_SPEED;

    const nx = Phaser.Math.Clamp(p.x + vx * (delta / 1000), 28, this.scale.width - 28);
    const ny = Phaser.Math.Clamp(p.y + vy * (delta / 1000), this.topLimit, this.worldH - 30);
    p.setPosition(nx, ny);
    p.setDepth(ny);
    p.update(vx, vy, delta);

    let near = null, nearDist = Infinity;
    for (const s of this.spots) {
      const d = s.distanceTo(p.x, p.y);
      if (d < MEMORY_RADIUS && d < nearDist) { near = s; nearDist = d; }
    }
    if (near) {
      this.hint.setVisible(true);
      this.hint.labelText.setText(near.found ? "Press  E  to revisit" : "Press  E  to open");
      this.hint.setPosition(near.x, near.y - 58);
    } else {
      this.hint.setVisible(false);
    }

    if (near && Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.input.keyboard.resetKeys();
      this.scene.launch("MemoryScene", {
        chapter: this.chapterKey, index: near.index,
        memData: near.memData, callerScene: "ChapterScene"
      });
    }

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.cameras.main.fadeOut(450, 6, 8, 16);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("HubScene"));
    }
  }
}
