import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_SPEED } from "../config/gameConfig.js";
import { CHAPTER_THEME, FOLIAGE } from "../art/palette.js";
import {
  drawSky, addSun, addCloud, addStars, drawGround,
  addTree, addBush, addFlowers, addStringLights
} from "../art/Scenery.js";
import { addVignette, addColorGrade, addFireflies } from "../art/effects.js";
import { Character } from "../entities/Character.js";
import { MemorySpot } from "../entities/MemorySpot.js";
import { memories } from "../config/memories.js";
import { heading, hintPill } from "../ui/ui.js";

const HORIZON = 300;
const MEMORY_RADIUS = 70;

const SPOT_LAYOUTS = {
  dj: [
    { x: 170, y: 380 }, { x: 360, y: 470 }, { x: 540, y: 380 },
    { x: 720, y: 470 }, { x: 850, y: 380 }
  ],
  danielle: [
    { x: 150, y: 400 }, { x: 330, y: 360 }, { x: 500, y: 460 },
    { x: 680, y: 370 }, { x: 850, y: 440 }
  ],
  together: [
    { x: 160, y: 420 }, { x: 340, y: 380 }, { x: 500, y: 470 },
    { x: 660, y: 380 }, { x: 840, y: 430 }
  ]
};

export class ChapterScene extends Phaser.Scene {
  constructor() { super({ key: "ChapterScene" }); }

  init(data) {
    this.chapterKey = data.chapter;
    this.theme = CHAPTER_THEME[data.chapter];
    this.found = new Set(this.registry.get(`found_${data.chapter}`) || []);
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
      if (this.found.has(i)) spot.markFound();
      this.spots.push(spot);
    });

    // ── Character ──
    this.player = new Character(this, width / 2, height - 60, { scale: 1.05, depth: 50 });

    // ── UI ──
    heading(this, width / 2, 34, `${this.theme.label}`, { size: 26 });
    this.progressText = this.add.text(width - 20, 30,
      `${this.found.size} / 5`, {
        fontFamily: '"Fredoka", sans-serif', fontSize: "18px", fontStyle: "600",
        color: "#ffffff"
      }).setOrigin(1, 0.5).setDepth(110);
    this.add.text(20, 30, "ESC  ·  back to 1166", {
      fontFamily: '"Nunito", sans-serif', fontSize: "13px", fontStyle: "600",
      color: "#ffffff"
    }).setOrigin(0, 0.5).setDepth(110).setAlpha(0.7);

    this.hint = hintPill(this, 0, 0, "Press  E  to open", { accent: this.theme.accent });
    this.hint.setVisible(false);

    addVignette(this, 0.45);

    // ── Input ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({ up: "W", down: "S", left: "A", right: "D" });
    this.eKey = this.input.keyboard.addKey("E");
    this.escKey = this.input.keyboard.addKey("ESC");

    // memory closed → mark found
    this.events.on("memory-closed", ({ chapter, index }) => {
      this.found.add(index);
      this.registry.set(`found_${chapter}`, [...this.found]);
      this.spots[index]?.markFound();
      this.progressText.setText(`${this.found.size} / 5`);
      this._checkComplete();
    });

    this.cameras.main.fadeIn(700, 6, 8, 16);
  }

  _buildEnvironment(width, height) {
    const t = this.theme;
    drawSky(this, t.sky);

    if (this.chapterKey === "dj") {
      addSun(this, 800, 110, { radius: 38 });
      addCloud(this, 200, 90, 0.9);
      addCloud(this, 560, 70, 0.7);
    } else if (this.chapterKey === "danielle") {
      addSun(this, 480, 150, { color: 0xfff0d0, glow: 0xffb877, radius: 46 });
      addCloud(this, 720, 80, 0.8);
    } else {
      addStars(this, 90);
      addSun(this, 150, 90, { color: 0xfdf6e3, glow: 0xcfd8ff, radius: 30 }); // moon
    }

    drawGround(this, t.ground, HORIZON);

    // themed foliage
    if (this.chapterKey === "dj") {
      addTree(this, 70, HORIZON + 30, { scale: 1.2, depth: 8 });
      addTree(this, 910, HORIZON + 20, { scale: 1.0, depth: 8 });
      addBush(this, 470, HORIZON + 8, { scale: 0.8, depth: 9 });
      for (let i = 0; i < 6; i++) addFlowers(this, 80 + i * 150, HORIZON + 50, 9);
    } else if (this.chapterKey === "danielle") {
      addTree(this, 850, HORIZON + 24, { scale: 1.1, depth: 8,
        foliage: [0x6a8a3a, 0x7fa148, 0x8db854] });
      addBush(this, 120, HORIZON + 14, { scale: 0.9, depth: 9, color: 0x7a9a48, dark: 0x5f7e36 });
      addBush(this, 760, HORIZON + 16, { scale: 0.7, depth: 9, color: 0x7a9a48, dark: 0x5f7e36 });
      for (let i = 0; i < 10; i++) addFlowers(this, 60 + i * 95, HORIZON + 30 + (i % 3) * 18, 9);
    } else {
      addTree(this, 90, HORIZON + 30, { scale: 1.1, depth: 8,
        foliage: [0x2a4a32, 0x355c3c, 0x3f6e46] });
      addTree(this, 880, HORIZON + 26, { scale: 1.0, depth: 8,
        foliage: [0x2a4a32, 0x355c3c, 0x3f6e46] });
      addStringLights(this, 60, HORIZON - 20, 900, HORIZON - 30, 11, 12);
    }

    // ambience tuned per theme
    if (this.chapterKey === "together") {
      addFireflies(this, { count: 34, color: 0xffe9a8 });
      addColorGrade(this, 0x4a5a9a, 0.1);
    } else if (this.chapterKey === "danielle") {
      addFireflies(this, { count: 20, color: 0xffd9a8, area: { x: 0, y: HORIZON, w: width, h: height - HORIZON } });
      addColorGrade(this, 0xffcf9a, 0.1);
    } else {
      addFireflies(this, { count: 16, color: 0xfff6c0, area: { x: 0, y: HORIZON, w: width, h: height - HORIZON } });
      addColorGrade(this, 0xfff6d0, 0.05);
    }
  }

  _checkComplete() {
    if (this.found.size < 5) return;
    const completed = this.registry.get("completedChapters") || [];
    if (!completed.includes(this.chapterKey)) {
      completed.push(this.chapterKey);
      this.registry.set("completedChapters", completed);
    }
    this.time.delayedCall(900, () => {
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

    const nx = Phaser.Math.Clamp(p.x + vx * (delta / 1000), 30, GAME_WIDTH - 30);
    const ny = Phaser.Math.Clamp(p.y + vy * (delta / 1000), HORIZON + 20, GAME_HEIGHT - 24);
    p.setPosition(nx, ny);
    p.setDepth(40 + ny * 0.01);
    p.update(vx, vy, delta);

    // nearest unopened memory
    let near = null, nearDist = Infinity;
    for (const s of this.spots) {
      if (s.found) continue;
      const d = s.distanceTo(p.x, p.y);
      if (d < MEMORY_RADIUS && d < nearDist) { near = s; nearDist = d; }
    }
    if (near) {
      this.hint.setVisible(true);
      this.hint.setPosition(near.x, near.y - 58);
    } else {
      this.hint.setVisible(false);
    }

    if (near && Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.input.keyboard.resetKeys();
      this.scene.launch("MemoryScene", {
        chapter: this.chapterKey,
        index: near.index,
        memData: near.memData,
        callerScene: "ChapterScene"
      });
    }

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.cameras.main.fadeOut(450, 6, 8, 16);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("HubScene"));
    }
  }
}
