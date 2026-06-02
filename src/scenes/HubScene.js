import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_SPEED } from "../config/gameConfig.js";
import { SKY, GROUND, CHAPTER_THEME, FOLIAGE, HOUSE } from "../art/palette.js";
import { drawSky, addSun, addCloud, drawGround, addTree, addBush, addFlowers } from "../art/Scenery.js";
import { addVignette, addColorGrade, addFireflies } from "../art/effects.js";
import { addHouse1166 } from "../art/House1166.js";
import { Character } from "../entities/Character.js";
import { signpost, hintPill, heading } from "../ui/ui.js";

const HORIZON = 286;

const DOORS = [
  { key: "dj",       x: 196, y: 452 },
  { key: "together", x: 480, y: 540 },
  { key: "danielle", x: 764, y: 452 }
];

export class HubScene extends Phaser.Scene {
  constructor() { super({ key: "HubScene" }); }

  create() {
    const { width, height } = this.scale;
    this.completed = this.registry.get("completedChapters") || [];

    // ── Sky & atmosphere ──
    drawSky(this, SKY.day);
    addSun(this, 130, 90, { radius: 36 });
    addCloud(this, 260, 80, 1);
    addCloud(this, 640, 120, 0.8);
    addCloud(this, 480, 60, 0.6);

    // ── Ground ──
    drawGround(this, GROUND.grass, HORIZON);
    this._drawDriveway();

    // ── House ──
    addHouse1166(this, 286, 70, { scale: 0.62, depth: 5 });

    // ── Landscaping ──
    addTree(this, 80, HORIZON + 26, { scale: 1.15, depth: 8 });
    addTree(this, 902, HORIZON + 36, { scale: 1.0, depth: 8,
      foliage: [FOLIAGE.treeC, FOLIAGE.treeA, FOLIAGE.treeB] });
    addBush(this, 338, HORIZON + 18, { scale: 1.0, depth: 9 });
    addBush(this, 615, HORIZON + 14, { scale: 0.7, depth: 9 });
    addFlowers(this, 250, HORIZON + 40, 9);
    addFlowers(this, 690, HORIZON + 36, 9);
    addFlowers(this, 430, HORIZON + 30, 9);

    // ── Chapter signposts ──
    this._signs = [];
    DOORS.forEach(d => {
      const theme = CHAPTER_THEME[d.key];
      const done = this.completed.includes(d.key);
      const post = signpost(this, d.x, d.y, theme.label, theme.accent, 30);
      if (done) {
        this.add.text(d.x, d.y - 78, "✓ " + theme.label, {
          fontFamily: '"Fredoka", sans-serif', fontSize: "15px", fontStyle: "600",
          color: "#bfe3a8"
        }).setOrigin(0.5).setDepth(31);
      }
      const pill = hintPill(this, d.x, d.y + 22, "Press  E", { accent: theme.accent });
      pill.setVisible(false);
      this._signs.push({ ...d, post, pill, theme });
    });

    // ── Character ──
    this.player = new Character(this, width / 2, height - 70, { scale: 1.05, depth: 50 });

    // ── Ambience & framing ──
    addFireflies(this, { count: 22, color: 0xfff0b0, area: { x: 0, y: HORIZON, w: width, h: height - HORIZON } });
    addColorGrade(this, 0xfff2d0, 0.06);
    addVignette(this, 0.4);

    // ── Title banner ──
    heading(this, width / 2, 36, "Welcome home, Dad", { size: 26 });
    this.add.text(width / 2, 64, "Walk to a signpost and press E to relive your memories", {
      fontFamily: '"Nunito", sans-serif', fontSize: "14px", fontStyle: "600",
      color: "#ffffff"
    }).setOrigin(0.5).setDepth(110).setAlpha(0.85);

    // ── Input ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({ up: "W", down: "S", left: "A", right: "D" });
    this.eKey = this.input.keyboard.addKey("E");

    this.cameras.main.fadeIn(700, 6, 8, 16);
  }

  _drawDriveway() {
    const g = this.add.graphics().setDepth(4);
    g.fillStyle(0xcbc6ba, 1);
    g.fillPoints([
      new Phaser.Geom.Point(560, HORIZON - 6),
      new Phaser.Geom.Point(672, HORIZON - 6),
      new Phaser.Geom.Point(900, GAME_HEIGHT),
      new Phaser.Geom.Point(660, GAME_HEIGHT)
    ], true);
    g.fillStyle(0xb8b3a6, 0.6);
    g.fillRect(0, 0, 0, 0);
    // expansion seams
    g.lineStyle(2, 0xa8a294, 0.5);
    g.lineBetween(600, HORIZON + 30, 740, GAME_HEIGHT);
    g.lineBetween(630, HORIZON + 30, 820, GAME_HEIGHT);
  }

  update(time, delta) {
    const p = this.player;
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown)   vx = -PLAYER_SPEED;
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx =  PLAYER_SPEED;
    if (this.cursors.up.isDown || this.wasd.up.isDown)       vy = -PLAYER_SPEED;
    if (this.cursors.down.isDown || this.wasd.down.isDown)   vy =  PLAYER_SPEED;

    const nx = Phaser.Math.Clamp(p.x + vx * (delta / 1000), 30, GAME_WIDTH - 30);
    const ny = Phaser.Math.Clamp(p.y + vy * (delta / 1000), HORIZON + 10, GAME_HEIGHT - 24);
    p.setPosition(nx, ny);
    p.setDepth(40 + ny * 0.01);
    p.update(vx, vy, delta);

    // nearest signpost hint
    let near = null;
    this._signs.forEach(s => {
      const inRange = Phaser.Math.Distance.Between(p.x, p.y, s.x, s.y) < 90;
      s.pill.setVisible(inRange);
      if (inRange) near = s;
    });

    if (near && Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.cameras.main.fadeOut(450, 6, 8, 16);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("ChapterScene", { chapter: near.key });
      });
    }
  }
}
