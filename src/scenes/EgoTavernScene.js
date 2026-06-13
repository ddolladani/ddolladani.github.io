import Phaser from "phaser";
import { PLAYER_SPEED } from "../config/gameConfig.js";
import { ensureGlowTexture, addVignette, addColorGrade, addFireflies } from "../art/effects.js";
import { addStringLights } from "../art/Scenery.js";
import { Character } from "../entities/Character.js";
import { heading, topScrim, hintPill } from "../ui/ui.js";
import { addSettings } from "../ui/settings.js";

// The Ego Tavern — a cozy gallery Dad walks into that is all about him. One big
// framed portrait fills the wall; he walks to a button and presses E to cycle
// through the pictures (counter shows x / n). After 3 cycles the lights dim so
// the picture is easier to admire. A loving joke: a shrine to Dad.

const DEPTH = { dim: 11, viewer: 12, fireflies: 50000, grade: 90000, vignette: 95000, ui: 100000 };

const WAINSCOT = 330;   // top of the wood paneling
const FLOOR_Y  = 360;   // where the floor begins

// Curated photos in public/assets/ego/p1..p5.jpg, each with a tongue-in-cheek title.
const PHOTOS = [
  { key: "ego_p1", title: "The Legend" },
  { key: "ego_p2", title: "Awesome Dad" },
  { key: "ego_p3", title: "Chaos Coordinator" },
  { key: "ego_p4", title: "Hooked a Big One" },
  { key: "ego_p5", title: "El Capitán" },
  { key: "ego_p6", title: "Certified Icon" },
  { key: "ego_p7", title: "Man, Myth, Legend" },
  { key: "ego_p8", title: "Simply the Best" },
  { key: "ego_p9", title: "The G.O.A.T." },
  { key: "ego_p10", title: "Cooler Than You" },
  { key: "ego_p11", title: "Father of the Year" },
  { key: "ego_p12", title: "Living Legend" },
  { key: "ego_p13", title: "Simply Iconic" },
  { key: "ego_p14", title: "The One & Only" }
];

export class EgoTavernScene extends Phaser.Scene {
  constructor() { super({ key: "EgoTavernScene" }); }

  preload() {
    PHOTOS.forEach((p, i) => {
      if (!this.textures.exists(p.key)) this.load.image(p.key, `assets/ego/p${i + 1}.jpg`);
    });
  }

  create() {
    const { width, height } = this.scale;

    this.photos = PHOTOS.filter(p => this.textures.exists(p.key));
    if (this.photos.length === 0) this.photos = PHOTOS; // show placeholders
    this.idx = 0;
    this.streak = 0;     // consecutive cycles → dims the room at 3
    this.dimmed = false;

    this._buildRoom(width, height);

    // dimmer sits just under the big picture: dims the room, not the artwork
    this.dimmer = this.add.rectangle(width / 2, height / 2, width, height, 0x000000, 0)
      .setScrollFactor(0).setDepth(DEPTH.dim);

    this._buildViewer(width);
    this._buildButton(width / 2, 548);
    this._showPhoto(0);

    // ── warm lighting / atmosphere ──
    this.lights = addStringLights(this, 40, 30, width - 40, 30, 11, 8);
    addFireflies(this, { count: 16, color: 0xffd184, depth: DEPTH.fireflies,
      area: { x: 0, y: 60, w: width, h: height - 120 } });
    addColorGrade(this, 0xffb968, 0.12).setDepth(DEPTH.grade);
    addVignette(this, 0.5).setDepth(DEPTH.vignette);

    // ── Character ──
    this.player = new Character(this, width / 2, height - 70, { scale: 1.12, depth: height - 70 });

    // ── UI ──
    topScrim(this, { height: 92, depth: DEPTH.ui - 1 });
    const h = heading(this, width / 2, 34, "Ego Tavern", { size: 26 });
    h.t.setScrollFactor(0).setDepth(DEPTH.ui);
    h.shadow.setScrollFactor(0).setDepth(DEPTH.ui);
    this.add.text(20, 30, "ESC  ·  back to 1166", {
      fontFamily: '"Nunito", sans-serif', fontSize: "13px", fontStyle: "600",
      color: "#ffffff", stroke: "#000000", strokeThickness: 3
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(DEPTH.ui).setAlpha(0.85);
    this.add.text(width / 2, 62, "Population: him.", {
      fontFamily: '"Caveat", cursive', fontSize: "22px", color: "#ffe6ac",
      stroke: "#000000", strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.ui).setAlpha(0.9);

    // ── Input ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({ up: "W", down: "S", left: "A", right: "D" });
    this.eKey = this.input.keyboard.addKey("E");
    this.escKey = this.input.keyboard.addKey("ESC");

    addSettings(this);

    this.cameras.main.fadeIn(600, 6, 4, 2);
  }

  _buildRoom(width, height) {
    const wall = this.add.graphics().setDepth(-100);
    wall.fillGradientStyle(0x3a2418, 0x3a2418, 0x281710, 0x281710, 1);
    wall.fillRect(0, 0, width, WAINSCOT);
    wall.fillStyle(0x000000, 0.06);
    for (let x = 0; x < width; x += 34) wall.fillRect(x, 0, 14, WAINSCOT);

    const wains = this.add.graphics().setDepth(-98);
    wains.fillStyle(0x5e3d22, 1); wains.fillRect(0, WAINSCOT, width, FLOOR_Y - WAINSCOT);
    wains.fillStyle(0x6e4a2b, 1); wains.fillRect(0, WAINSCOT, width, 6);
    wains.lineStyle(2, 0x3f2916, 0.6);
    for (let x = 40; x < width; x += 80) wains.lineBetween(x, WAINSCOT + 6, x, FLOOR_Y);

    const floor = this.add.graphics().setDepth(-96);
    floor.fillGradientStyle(0x4a3322, 0x4a3322, 0x2f2015, 0x2f2015, 1);
    floor.fillRect(0, FLOOR_Y, width, height - FLOOR_Y);
    floor.lineStyle(2, 0x241810, 0.5);
    for (let y = FLOOR_Y + 24; y < height; y += 30) floor.lineBetween(0, y, width, y);
    for (let x = 60; x < width; x += 120) floor.lineBetween(x, FLOOR_Y, x + 40, height);

    const rug = this.add.graphics().setDepth(-95);
    rug.fillStyle(0x7a2230, 0.85); rug.fillEllipse(width / 2, height - 56, 360, 110);
    rug.lineStyle(4, 0xb8902f, 0.6); rug.strokeEllipse(width / 2, height - 56, 330, 96);

    this._neonSign(width / 2, 64);
  }

  _neonSign(x, y) {
    const key = ensureGlowTexture(this);
    this.neonGlow = this.add.image(x, y, key).setScale(7, 2.4).setTint(0xff5aa0)
      .setAlpha(0.18).setBlendMode(Phaser.BlendModes.ADD).setDepth(-90);
    const sign = this.add.text(x, y, "EGO  TAVERN", {
      fontFamily: '"Fredoka", sans-serif', fontSize: "34px", fontStyle: "700",
      color: "#ffd9ec", stroke: "#ff3d8b", strokeThickness: 4
    }).setOrigin(0.5).setDepth(-89);
    sign.setShadow(0, 0, "#ff5aa0", 16, false, true);
    this.tweens.add({ targets: sign, alpha: 0.78, duration: 1300,
      yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  // The big wall-filling gold frame; the photo inside is swapped by _showPhoto.
  _buildViewer(width) {
    const cx = width / 2, cy = 246;
    const ow = 300, oh = 400;
    const fw = ow + 34, fh = oh + 64; // extra at the bottom for the nameplate
    const c = this.add.container(cx, cy).setDepth(DEPTH.viewer);

    const sh = this.add.graphics();
    sh.fillStyle(0x000000, 0.5); sh.fillRoundedRect(-fw / 2 + 6, -fh / 2 + 10, fw, fh, 6);
    c.add(sh);

    const g = this.add.graphics();
    g.fillStyle(0xb8902f, 1); g.fillRoundedRect(-fw / 2, -fh / 2, fw, fh, 6);
    g.lineStyle(3, 0xe7c876, 0.7); g.strokeRoundedRect(-fw / 2 + 3, -fh / 2 + 3, fw - 6, fh - 6, 5);
    g.fillStyle(0x8a6a1e, 1); g.fillRoundedRect(-fw / 2 + 9, -fh / 2 + 9, fw - 18, fh - 18, 4);
    const yTop = -fh / 2 + 16;
    g.fillStyle(0x120d0a, 1); g.fillRect(-ow / 2, yTop, ow, oh); // matte
    c.add(g);

    this.viewer = c;
    this.viewerOpening = { w: ow, h: oh, cy: yTop + oh / 2 };

    const plate = this.add.graphics();
    plate.fillStyle(0x2a1c0e, 1); plate.fillRoundedRect(-ow / 2, fh / 2 - 40, ow, 30, 4);
    plate.lineStyle(1.5, 0xb8902f, 0.8); plate.strokeRoundedRect(-ow / 2, fh / 2 - 40, ow, 30, 4);
    c.add(plate);
    this.titleText = this.add.text(0, fh / 2 - 25, "", {
      fontFamily: '"Fredoka", sans-serif', fontSize: "16px", fontStyle: "700",
      color: "#ffe6ac", align: "center"
    }).setOrigin(0.5);
    c.add(this.titleText);
  }

  _showPhoto(i) {
    const p = this.photos[i];
    const oc = this.viewerOpening;
    if (this._img) { this._img.destroy(); this._img = null; }

    if (this.textures.exists(p.key)) {
      const src = this.textures.get(p.key).getSourceImage();
      const ar = (src.width || 3) / (src.height || 4);
      let dw = oc.w - 12, dh = (oc.w - 12) / ar;
      if (dh > oc.h - 12) { dh = oc.h - 12; dw = dh * ar; }
      this._img = this.add.image(0, oc.cy, p.key).setDisplaySize(dw, dh);
      this.viewer.add(this._img);
    } else {
      this._img = this.add.text(0, oc.cy, "photo coming soon", {
        fontFamily: '"Caveat", cursive', fontSize: "24px", color: "#b3ab97"
      }).setOrigin(0.5);
      this.viewer.add(this._img);
    }
    // a gentle pop on swap
    this._img.setScale(this._img.scaleX * 0.96, this._img.scaleY * 0.96);
    this.tweens.add({ targets: this._img, scaleX: this._img.scaleX / 0.96,
      scaleY: this._img.scaleY / 0.96, duration: 260, ease: "Back.easeOut" });

    this.titleText.setText(p.title);
    this.buttonLabel.setText(`${i + 1} / ${this.photos.length}`);
  }

  _buildButton(x, y) {
    const c = this.add.container(x, y).setDepth(y);
    c.add(this.add.ellipse(0, 10, 72, 16, 0x000000, 0.25));
    const g = this.add.graphics();
    g.fillStyle(0x3a2a1c, 1); g.fillRoundedRect(-24, -6, 48, 20, 4);   // podium
    g.fillStyle(0x5e3d22, 1); g.fillRoundedRect(-30, -18, 60, 14, 5);
    g.fillStyle(0x7a2230, 1); g.fillCircle(0, -12, 13);                 // button ring
    g.fillStyle(0xff5a7a, 1); g.fillCircle(0, -13, 9);                  // button face
    c.add(g);

    const key = ensureGlowTexture(this);
    const glow = this.add.image(0, -12, key).setScale(1.0).setTint(0xff7aa0)
      .setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD);
    c.add(glow);
    this.tweens.add({ targets: glow, alpha: 0.18, scale: 1.3, duration: 1200,
      yoyo: true, repeat: -1, ease: "Sine.easeInOut" });

    this.buttonLabel = this.add.text(0, -13, "1 / 1", {
      fontFamily: '"Fredoka", sans-serif', fontSize: "11px", fontStyle: "700", color: "#ffffff"
    }).setOrigin(0.5);
    c.add(this.buttonLabel);

    this.buttonX = x; this.buttonY = y;
    this.cyclePill = hintPill(this, x, y - 46, "Press  E  to cycle", { accent: 0xff8ac0 });
    this.cyclePill.setDepth(y + 1).setVisible(false);
  }

  _cycle() {
    this.idx = (this.idx + 1) % this.photos.length;
    this._showPhoto(this.idx);
    this.streak += 1;
    if (this.streak >= 3 && !this.dimmed) this._dimLights();
  }

  // After a few cycles, dim the room so the artwork is easier to see.
  _dimLights() {
    this.dimmed = true;
    this.tweens.add({ targets: this.dimmer, fillAlpha: 0.55, duration: 900, ease: "Sine.easeInOut" });
    if (this.lights) this.tweens.add({ targets: this.lights, alpha: 0.45, duration: 900 });
    if (this.neonGlow) this.tweens.add({ targets: this.neonGlow, alpha: 0.32, duration: 900 });
  }

  update(time, delta) {
    const p = this.player;
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown)   vx = -PLAYER_SPEED;
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx =  PLAYER_SPEED;
    if (this.cursors.up.isDown || this.wasd.up.isDown)       vy = -PLAYER_SPEED;
    if (this.cursors.down.isDown || this.wasd.down.isDown)   vy =  PLAYER_SPEED;

    const nx = Phaser.Math.Clamp(p.x + vx * (delta / 1000), 36, this.scale.width - 36);
    const ny = Phaser.Math.Clamp(p.y + vy * (delta / 1000), FLOOR_Y + 18, this.scale.height - 28);
    p.setPosition(nx, ny);
    p.setDepth(ny);
    p.update(vx, vy, delta);

    const near = Phaser.Math.Distance.Between(p.x, p.y, this.buttonX, this.buttonY) < 84;
    this.cyclePill.setVisible(near);
    if (near && Phaser.Input.Keyboard.JustDown(this.eKey)) this._cycle();

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this.cameras.main.fadeOut(450, 6, 4, 2);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("HubScene", { from: "egotavern" }));
    }
  }
}
