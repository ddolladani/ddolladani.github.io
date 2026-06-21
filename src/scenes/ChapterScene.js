import Phaser from "phaser";
import { PLAYER_SPEED } from "../config/gameConfig.js";
import { CHAPTER_THEME } from "../art/palette.js";
import {
  drawSky, addSun, addCloud, addTree, addBush, addTreehouse,
  addHills, addHazeBand, addForegroundFronds, addForegroundGrass, addFlowerField,
  bakeGraphics
} from "../art/Scenery.js";
import { drawLivingRoom } from "../art/HouseInterior.js";
import { addVignette, addColorGrade, addFireflies } from "../art/effects.js";
import { Character } from "../entities/Character.js";
import { MemorySpot } from "../entities/MemorySpot.js";
import { memories } from "../config/memories.js";
import { heading, hintPill, topScrim } from "../ui/ui.js";
import { addSettings } from "../ui/settings.js";

const MEMORY_RADIUS = 70;
const DEPTH = { fireflies: 50000, grade: 90000, vignette: 95000, ui: 100000 };

// Outdoor chapters scroll vertically; the interior is one fixed room.
const INTERIOR_FLOOR = 300;
const OUTDOOR_WORLD_H = 1200;
const OUTDOOR_GROUND_TOP = 320;

// Memory spot positions (outdoor ones are spread down a tall world)
const SPOT_LAYOUTS = {
  dj: [
    { x: 200, y: 500 }, { x: 720, y: 560 }, { x: 380, y: 660 },
    { x: 760, y: 770 }, { x: 220, y: 850 }, { x: 560, y: 960 },
    { x: 330, y: 1080 }
  ],
  danielle: [
    { x: 470, y: 1090 }, { x: 250, y: 1015 }, { x: 710, y: 985 },
    { x: 410, y: 905 },  { x: 620, y: 835 },  { x: 190, y: 800 },
    { x: 780, y: 720 },  { x: 360, y: 690 },  { x: 560, y: 605 },
    { x: 230, y: 545 },  { x: 690, y: 525 },  { x: 450, y: 445 }
  ],
  together: [
    { x: 160, y: 430 }, { x: 330, y: 520 }, { x: 480, y: 430 },
    { x: 640, y: 525 }, { x: 810, y: 445 }, { x: 480, y: 560 }
  ]
};

export class ChapterScene extends Phaser.Scene {
  constructor() { super({ key: "ChapterScene" }); }

  init(data) {
    this.chapterKey = data.chapter;
    this.theme = CHAPTER_THEME[data.chapter];
    this.found = new Set(this.registry.get(`found_${data.chapter}`) || []);
    this.total = memories[data.chapter].length;
    this.isInterior = data.chapter === "together";
    this.worldH = this.isInterior ? this.scale.height : OUTDOOR_WORLD_H;
    this.topLimit = this.isInterior ? INTERIOR_FLOOR + 20 : OUTDOOR_GROUND_TOP + 40;
  }

  create() {
    const { width, height } = this.scale;

    this._buildEnvironment(width, height);

    // ── Memory spots ──
    // Driven by the actual memories list, so adding/removing photos by hand in
    // memories.js "just works" — hand-placed positions in SPOT_LAYOUTS are used
    // when present, and any extras are auto-spaced.
    this.spots = [];
    const layout = SPOT_LAYOUTS[this.chapterKey] || [];
    const mems = memories[this.chapterKey];
    mems.forEach((memData, i) => {
      const pos = layout[i] || this._fallbackSpot(i, mems.length);
      const spot = new MemorySpot(this, pos.x, pos.y, i, this.theme.accent);
      spot.memData = memData;
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
    topScrim(this, { height: 92, depth: DEPTH.ui - 1 });
    const h = heading(this, width / 2, 34, this.theme.label, { size: 26 });
    h.t.setScrollFactor(0).setDepth(DEPTH.ui);
    h.shadow.setScrollFactor(0).setDepth(DEPTH.ui);
    this.progressText = this.add.text(width - 20, 30, `${this.found.size} / ${this.total}`, {
      fontFamily: '"Fredoka", sans-serif', fontSize: "18px", fontStyle: "600", color: "#ffffff",
      stroke: "#000000", strokeThickness: 4
    }).setOrigin(1, 0.5).setScrollFactor(0).setDepth(DEPTH.ui);
    this.add.text(20, 30, "ESC  ·  back to 1166", {
      fontFamily: '"Nunito", sans-serif', fontSize: "13px", fontStyle: "600", color: "#ffffff",
      stroke: "#000000", strokeThickness: 3
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(DEPTH.ui).setAlpha(0.85);

    this.hint = hintPill(this, 0, 0, "Press  E  to revisit", { accent: this.theme.accent });
    this.hint.setVisible(false);

    // ── Input ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({ up: "W", down: "S", left: "A", right: "D" });
    this.eKey = this.input.keyboard.addKey("E");
    this.escKey = this.input.keyboard.addKey("ESC");

    this.completedOnce = this.found.size >= this.total;
    // Re-bind cleanly: scene custom events persist across restarts, so without
    // this an old listener would stack on every re-entry and double-count.
    this.events.off("memory-closed", this._onMemoryClosed, this);
    this.events.on("memory-closed", this._onMemoryClosed, this);

    addSettings(this);

    this.cameras.main.fadeIn(700, 6, 8, 16);
  }

  _onMemoryClosed({ chapter, index }) {
    // Resume first: a paused scene's tweens/timers (the completion sequence)
    // won't run until it's awake again.
    if (this.scene.isPaused()) this.scene.resume();
    const wasNew = !this.found.has(index);
    this.found.add(index);
    this.registry.set(`found_${chapter}`, [...this.found]);
    this.spots[index]?.markFound();
    this.progressText.setText(`${this.found.size} / ${this.total}`);
    if (wasNew && this.found.size >= this.total && !this.completedOnce) {
      this.completedOnce = true;
      this._completeChapter();
    }
  }

  // Auto-placed position for a memory spot when SPOT_LAYOUTS has no entry for it.
  _fallbackSpot(i, n) {
    const w = this.scale.width;
    if (this.isInterior) {
      const perRow = 5;
      const col = i % perRow, row = Math.floor(i / perRow);
      return { x: 150 + col * ((w - 300) / (perRow - 1)), y: 430 + (row % 2 ? 95 : 0) };
    }
    const top = OUTDOOR_GROUND_TOP + 160, bot = this.worldH - 140;
    return {
      x: (i % 2 === 0) ? w * 0.28 : w * 0.72,
      y: top + (bot - top) * (i / Math.max(1, n - 1))
    };
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

    // near-camera leaves framing the shot — strong depth cue for the woods
    addForegroundFronds(this, { color: 0x122310, alpha: 0.95 });
  }

  // Danielle's world — a flower garden at golden hour.
  _buildGarden(width) {
    drawSky(this, this.theme.sky);
    const sun = addSun(this, 480, 140, { color: 0xfff0d0, glow: 0xffb877, radius: 46 });
    sun.halo.setScrollFactor(0); sun.disc.setScrollFactor(0);
    addCloud(this, 720, 80, 0.8);

    // layered golden-hour distance + horizon haze
    addHills(this, OUTDOOR_GROUND_TOP - 6, { color: 0xe9b98a, alpha: 0.45, scroll: 0.3, depth: -82, amp: 30 });
    addHills(this, OUTDOOR_GROUND_TOP + 8, { color: 0xcf9a6b, alpha: 0.5, scroll: 0.45, depth: -80, amp: 50, step: 210 });
    addHazeBand(this, OUTDOOR_GROUND_TOP + 10, { color: 0xffe2b0, alpha: 0.26, scroll: 0.55 });

    this._drawTallGround();

    const gardenGreen = [0x6a8a3a, 0x7fa148, 0x8db854];
    addTree(this, 900, OUTDOOR_GROUND_TOP + 90, { scale: 1.6, depth: OUTDOOR_GROUND_TOP + 90, foliage: gardenGreen });
    addTree(this, 80, 820, { scale: 1.4, depth: 820, foliage: gardenGreen });
    addBush(this, 160, OUTDOOR_GROUND_TOP + 24, { scale: 1.0, depth: OUTDOOR_GROUND_TOP + 24, color: 0x7a9a48, dark: 0x5f7e36 });
    addBush(this, 720, 640, { scale: 0.8, depth: 640, color: 0x7a9a48, dark: 0x5f7e36 });
    // a whole field of flowers carpeting the garden
    addFlowerField(this, { top: OUTDOOR_GROUND_TOP + 16, bottom: OUTDOOR_WORLD_H - 30, density: 340 });

    // near-camera grass framing the bottom edge
    addForegroundGrass(this, { color: 0x4a5a26, alpha: 0.82 });
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
    // Static speckle layer — bake it so it isn't re-tessellated every frame.
    bakeGraphics(this, t, width, this.worldH, -69);
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
        // Always return to the yard. When all three are done the road to the
        // theater opens there, and Dad walks to the Hall of Fame himself.
        this.scene.start("HubScene", { from: this.chapterKey });
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
      this.hint.setVisible(false);
      // Pause underneath the memory so the player can't walk or re-trigger,
      // and so the close keypress can't leak back into this update loop.
      this.scene.launch("MemoryScene", {
        chapter: this.chapterKey, index: near.index,
        memData: near.memData, callerScene: "ChapterScene"
      });
      this.scene.pause();
    }

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.cameras.main.fadeOut(450, 6, 8, 16);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("HubScene", { from: this.chapterKey }));
    }
  }
}
