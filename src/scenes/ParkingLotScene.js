import Phaser from "phaser";
import { PLAYER_SPEED } from "../config/gameConfig.js";
import { SKY } from "../art/palette.js";
import { drawSky, addStars } from "../art/Scenery.js";
import { ensureGlowTexture, addVignette, addColorGrade, addFireflies } from "../art/effects.js";
import { Character } from "../entities/Character.js";
import { heading, hintPill, topScrim } from "../ui/ui.js";
import { addSettings } from "../ui/settings.js";

// The drive to the movies. Dad arrives in the NCG parking lot at dusk and walks
// up to the lit entrance; pressing E at the doors takes him into the Hall of
// Fame. Reached from the yard once the road opens (all memories collected).

const DEPTH = { fireflies: 50000, grade: 90000, vignette: 95000, ui: 100000 };
const LOT_TOP = 330;                 // where the building meets the asphalt
const DOOR = { x: 480, y: 322 };     // entrance

export class ParkingLotScene extends Phaser.Scene {
  constructor() { super({ key: "ParkingLotScene" }); }

  create() {
    const { width, height } = this.scale;

    drawSky(this, SKY.dusk);
    addStars(this, 40);
    this._buildLot(width, height);
    this._buildTheater(width);
    this._lampposts();

    addFireflies(this, { count: 16, color: 0xffe2a0, depth: DEPTH.fireflies,
      area: { x: 0, y: 40, w: width, h: height - 80 } });
    addColorGrade(this, 0x3a2f5a, 0.12).setDepth(DEPTH.grade);
    addVignette(this, 0.5).setDepth(DEPTH.vignette);

    // ── Character (arrives at the bottom) ──
    this.player = new Character(this, width / 2, height - 60, { scale: 1.12, depth: height - 60 });

    // ── door marker ──
    this.doorPill = hintPill(this, DOOR.x, DOOR.y + 40, "Press  E", { accent: 0xffd56b });
    this.doorPill.setDepth(99000).setVisible(false);

    // ── UI ──
    topScrim(this, { height: 88, depth: DEPTH.ui - 1 });
    const h = heading(this, width / 2, 34, "NCG  ·  Hall of Fame", { size: 24 });
    h.t.setScrollFactor(0).setDepth(DEPTH.ui);
    h.shadow.setScrollFactor(0).setDepth(DEPTH.ui);
    this.add.text(width / 2, 62, "Walk up to the doors  ·  press E to go in", {
      fontFamily: '"Nunito", sans-serif', fontSize: "13px", fontStyle: "700",
      color: "#ffffff", stroke: "#000000", strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.ui).setAlpha(0.9);

    // ── Input ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({ up: "W", down: "S", left: "A", right: "D" });
    this.eKey = this.input.keyboard.addKey("E");
    this.escKey = this.input.keyboard.addKey("ESC");

    addSettings(this);

    this.entering = false;
    this.cameras.main.fadeIn(700, 6, 8, 16);
  }

  _buildLot(width, height) {
    // asphalt
    const a = this.add.graphics().setDepth(-70);
    a.fillGradientStyle(0x2b2b31, 0x2b2b31, 0x1c1c21, 0x1c1c21, 1);
    a.fillRect(0, LOT_TOP, width, height - LOT_TOP);

    // parking space lines + a couple of directional arrows
    const m = this.add.graphics().setDepth(-69);
    m.fillStyle(0xc9c4b4, 0.5);
    for (let x = 40; x < width; x += 92) m.fillRect(x, height - 150, 4, 80);
    m.fillStyle(0xd8d2bf, 0.35);
    m.fillRect(width / 2 - 2, LOT_TOP + 20, 4, 24);
    m.fillTriangle(width / 2 - 9, LOT_TOP + 44, width / 2 + 9, LOT_TOP + 44, width / 2, LOT_TOP + 58);

    // a few parked cars in the back row
    this._car(150, LOT_TOP + 70, 0x6a3b3b);
    this._car(330, LOT_TOP + 70, 0x33415c);
    this._car(640, LOT_TOP + 70, 0x3c5a3f);
    this._car(820, LOT_TOP + 70, 0x55506a);
  }

  _car(x, y, color) {
    const c = this.add.container(x, y).setDepth(y);
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.25); g.fillEllipse(0, 20, 96, 18);
    g.fillStyle(color, 1); g.fillRoundedRect(-44, -6, 88, 30, 8);      // body
    g.fillStyle(color, 1); g.fillRoundedRect(-30, -22, 58, 22, 8);     // cabin
    g.fillStyle(0x9fb4c4, 0.6); g.fillRoundedRect(-26, -18, 50, 15, 5); // windows
    g.fillStyle(0x15151a, 1); g.fillCircle(-26, 24, 9); g.fillCircle(26, 24, 9); // wheels
    g.fillStyle(0xffe9a8, 0.85); g.fillCircle(42, 6, 3); g.fillCircle(-42, 6, 3); // lights
    c.add(g);
  }

  _buildTheater(width) {
    const baseY = LOT_TOP;
    const top = 120;
    const left = width / 2 - 320, right = width / 2 + 320;

    const g = this.add.graphics().setDepth(-60);
    // facade
    g.fillStyle(0x2a2533, 1); g.fillRect(left, top, right - left, baseY - top);
    g.fillStyle(0x332d40, 1); g.fillRect(left, top, right - left, 20);
    // entrance bay (lighter, glassy)
    g.fillStyle(0x1c2a3a, 1); g.fillRect(width / 2 - 110, top + 40, 220, baseY - top - 40);
    // glass doors with warm interior glow
    g.fillStyle(0x3a5570, 1); g.fillRoundedRect(width / 2 - 70, baseY - 92, 140, 92, 4);
    g.fillStyle(0xffdf9e, 0.85); g.fillRect(width / 2 - 64, baseY - 86, 128, 84);
    g.fillStyle(0x2a2533, 1);
    g.fillRect(width / 2 - 2, baseY - 92, 4, 92);     // door split
    g.lineStyle(2, 0x2a2533, 1);
    g.strokeRect(width / 2 - 64, baseY - 86, 64, 84);
    g.strokeRect(width / 2, baseY - 86, 64, 84);
    g.fillStyle(0xdfe6ee, 1); g.fillRect(width / 2 - 10, baseY - 52, 6, 16); g.fillRect(width / 2 + 4, baseY - 52, 6, 16); // handles
    g.fillStyle(0xffdf9e, 0.16);
    g.fillRect(width / 2 - 110, baseY - 6, 220, 6); // light spill on pavement

    // entrance canopy with bulbs
    const canopy = this.add.graphics().setDepth(-58);
    canopy.fillStyle(0x14101a, 1); canopy.fillRoundedRect(width / 2 - 130, top + 70, 260, 22, 6);
    canopy.fillStyle(0x8a1f2e, 1); canopy.fillRoundedRect(width / 2 - 130, top + 70, 260, 8, 4);
    const key = ensureGlowTexture(this);
    for (let i = 0; i < 13; i++) {
      const bx = width / 2 - 118 + i * 20;
      const bulb = this.add.circle(bx, top + 90, 2.5, 0xffe9a8).setDepth(-57);
      const glow = this.add.image(bx, top + 90, key).setScale(0.45).setTint(0xffd56b)
        .setAlpha(0.5).setBlendMode(Phaser.BlendModes.ADD).setDepth(-57);
      this.tweens.add({ targets: [bulb, glow], alpha: 0.25, duration: Phaser.Math.Between(700, 1500),
        yoyo: true, repeat: -1, delay: Math.random() * 1000 });
    }

    // big illuminated NCG sign on a pylon
    const sg = this.add.graphics().setDepth(-56);
    sg.fillStyle(0x14101a, 1); sg.fillRect(width / 2 - 70, top - 70, 140, 66);
    sg.fillStyle(0xb01f2e, 1); sg.fillRoundedRect(width / 2 - 64, top - 64, 128, 54, 6);
    sg.lineStyle(3, 0xffd56b, 0.9); sg.strokeRoundedRect(width / 2 - 64, top - 64, 128, 54, 6);
    this.add.image(width / 2, top - 37, key).setScale(5, 2).setTint(0xff5a5a)
      .setAlpha(0.22).setBlendMode(Phaser.BlendModes.ADD).setDepth(-57);
    this.add.text(width / 2, top - 37, "NCG", {
      fontFamily: '"Fredoka", sans-serif', fontSize: "40px", fontStyle: "700",
      color: "#fff3df"
    }).setOrigin(0.5).setDepth(-55);

    // marquee letterboard
    const mb = this.add.graphics().setDepth(-56);
    mb.fillStyle(0x0d0d12, 1); mb.fillRoundedRect(width / 2 - 200, top + 18, 400, 48, 6);
    mb.lineStyle(2, 0xffd56b, 0.7); mb.strokeRoundedRect(width / 2 - 200, top + 18, 400, 48, 6);
    this.add.text(width / 2, top + 32, "★  HALL OF FAME  ★", {
      fontFamily: '"Fredoka", sans-serif', fontSize: "18px", fontStyle: "700", color: "#ffe6ac"
    }).setOrigin(0.5).setDepth(-55);
    this.add.text(width / 2, top + 54, "HAPPY FATHER'S DAY, DAD", {
      fontFamily: '"Nunito", sans-serif', fontSize: "12px", fontStyle: "800", color: "#ffd9ec"
    }).setOrigin(0.5).setDepth(-55);

    // a soft warm glow pooling out of the doorway
    this.add.image(width / 2, baseY + 6, key).setScale(3.2, 1.4).setTint(0xffce7a)
      .setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(-55);
  }

  _lampposts() {
    const key = ensureGlowTexture(this);
    [120, 840].forEach((x) => {
      const y = LOT_TOP + 150;
      const g = this.add.graphics().setDepth(y);
      g.fillStyle(0x15151a, 1); g.fillRect(x - 3, y - 120, 6, 120);
      g.fillStyle(0x23232b, 1); g.fillRoundedRect(x - 16, y - 132, 32, 14, 4);
      g.fillStyle(0xffe9a8, 1); g.fillRoundedRect(x - 12, y - 128, 24, 8, 3);
      c_at(this, x, y - 124, key, 1.6, 0xffd483, 0.4);
      c_at(this, x, y - 90, key, 2.0, 0xffcf7a, 0.12); // light spill
    });
  }

  update(time, delta) {
    const p = this.player;
    if (this.entering) return;
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown)   vx = -PLAYER_SPEED;
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx =  PLAYER_SPEED;
    if (this.cursors.up.isDown || this.wasd.up.isDown)       vy = -PLAYER_SPEED;
    if (this.cursors.down.isDown || this.wasd.down.isDown)   vy =  PLAYER_SPEED;

    const nx = Phaser.Math.Clamp(p.x + vx * (delta / 1000), 36, this.scale.width - 36);
    const ny = Phaser.Math.Clamp(p.y + vy * (delta / 1000), LOT_TOP + 20, this.scale.height - 26);
    p.setPosition(nx, ny);
    p.setDepth(ny);
    p.update(vx, vy, delta);

    const near = Phaser.Math.Distance.Between(p.x, p.y, DOOR.x, DOOR.y) < 96;
    this.doorPill.setVisible(near);

    if (near && Phaser.Input.Keyboard.JustDown(this.eKey)) {
      this.entering = true;
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("HallOfFameScene"));
    }
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.cameras.main.fadeOut(450, 6, 8, 16);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("HubScene"));
    }
  }
}

// small helper for additive glow images
function c_at(scene, x, y, key, scale, tint, alpha) {
  scene.add.image(x, y, key).setScale(scale).setTint(tint).setAlpha(alpha)
    .setBlendMode(Phaser.BlendModes.ADD).setDepth(-55);
}
