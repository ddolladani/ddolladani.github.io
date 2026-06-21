import Phaser from "phaser";
import { PLAYER_SPEED } from "../config/gameConfig.js";
import { ensureGlowTexture, addVignette, addColorGrade, addFireflies } from "../art/effects.js";
import { Character } from "../entities/Character.js";
import { heading, topScrim } from "../ui/ui.js";
import { addSettings } from "../ui/settings.js";
import { fromTheKids } from "../config/fromTheKids.js";

// The finale — shown after the Hall of Fame, before the credits. Same walk-up-
// to-play mechanic as the Hall of Fame, but just the two kids on big screens
// side by side under a "Happy Father's Day" banner. Dad steps in front of a
// screen and that clip plays; walking off the right end rolls the credits.

const FLOOR_Y  = 470;            // where the floor starts
const SCREEN   = { w: 256, h: 340, cy: 276 };   // big portrait clip screens
const CENTERS  = [330, 730];     // x of the two screens
const ACT_RANGE = 170;           // how close Dad must be to start a clip
const DEPTH = { fireflies: 50000, grade: 90000, vignette: 95000, ui: 100000 };

export class FromTheKidsScene extends Phaser.Scene {
  constructor() { super({ key: "FromTheKidsScene" }); }

  create() {
    const { width, height } = this.scale;
    this.clips = (fromTheKids.clips && fromTheKids.clips.length)
      ? fromTheKids.clips
      : [{ name: "DJ" }, { name: "Danielle" }];

    this.pedestals = [];
    this.activeIdx = -1;
    this._leaving = false;
    this.exitX = CENTERS[CENTERS.length - 1] + 300;
    this.worldW = this.exitX + 160;

    this.events.once("shutdown", () => this._deactivate());

    // The kids' clips carry their own audio — pause the background music.
    const music = this.sound.get("music_main");
    if (music && music.isPlaying) music.pause();

    this._buildRoom(width, height);
    this.clips.slice(0, CENTERS.length).forEach((c, i) => this._buildScreen(i, CENTERS[i], c));
    this._buildExit(this.exitX, height);

    // ── Character ──
    this.player = new Character(this, 120, FLOOR_Y + 110, { scale: 1.12, depth: FLOOR_Y + 110 });

    // ── Camera (scrolls horizontally with Dad) ──
    this.cameras.main.setBounds(0, 0, this.worldW, height);
    this.cameras.main.startFollow(this.player.root, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(220, height);
    this.cameras.main.fadeIn(700, 4, 3, 8);

    // ── Atmosphere (fixed to screen) ──
    addFireflies(this, { count: 18, color: 0xffe2a0, depth: DEPTH.fireflies,
      area: { x: 0, y: 90, w: width, h: height - 160 } });
    addColorGrade(this, 0x3a2150, 0.10).setDepth(DEPTH.grade);
    addVignette(this, 0.5).setDepth(DEPTH.vignette);

    // ── Title banner (fixed) ──
    topScrim(this, { height: 104, depth: DEPTH.ui - 1 });
    const h = heading(this, width / 2, 40, fromTheKids.title || "Happy Father's Day", { size: 34 });
    h.t.setScrollFactor(0).setDepth(DEPTH.ui);
    h.shadow.setScrollFactor(0).setDepth(DEPTH.ui);
    this.add.text(width / 2, 74, fromTheKids.subtitle || "from your kids 💛", {
      fontFamily: '"Caveat", cursive', fontSize: "24px", fontStyle: "700",
      color: "#ffe6ac", stroke: "#000000", strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.ui).setAlpha(0.95);
    this.add.text(20, 30, "ESC  ·  skip to the credits", {
      fontFamily: '"Nunito", sans-serif', fontSize: "13px", fontStyle: "600",
      color: "#ffffff", stroke: "#000000", strokeThickness: 3
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(DEPTH.ui).setAlpha(0.85);

    addSettings(this);

    // ── Input ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({ up: "W", down: "S", left: "A", right: "D" });
    this.escKey = this.input.keyboard.addKey("ESC");
  }

  // ── Room environment ─────────────────────────────────────────────────────
  _buildRoom(width, height) {
    const w = this.worldW;
    const bg = this.add.graphics().setDepth(-100);
    bg.fillGradientStyle(0x1a1230, 0x1a1230, 0x0b0a16, 0x0b0a16, 1);
    bg.fillRect(0, 0, w, height);

    const wains = this.add.graphics().setDepth(-96);
    wains.fillStyle(0x2a1d3a, 1); wains.fillRect(0, FLOOR_Y - 26, w, 26);
    wains.fillStyle(0x3a2a4f, 1); wains.fillRect(0, FLOOR_Y - 26, w, 5);

    const floor = this.add.graphics().setDepth(-95);
    floor.fillGradientStyle(0x241a2c, 0x241a2c, 0x140d1a, 0x140d1a, 1);
    floor.fillRect(0, FLOOR_Y, w, height - FLOOR_Y);
    floor.lineStyle(2, 0x322640, 0.5);
    for (let y = FLOOR_Y + 26; y < height; y += 30) floor.lineBetween(0, y, w, y);

    const rug = this.add.graphics().setDepth(-94);
    rug.fillStyle(0x6e1722, 0.9); rug.fillRect(0, height - 86, w, 70);
    rug.fillStyle(0x8a1f2e, 0.9); rug.fillRect(0, height - 80, w, 8);
    rug.lineStyle(3, 0xb8902f, 0.5); rug.strokeRect(24, height - 84, w - 48, 66);
  }

  _buildScreen(i, x, clip) {
    const screenTop = SCREEN.cy - SCREEN.h / 2;
    const screenBot = SCREEN.cy + SCREEN.h / 2;
    const baseY = FLOOR_Y + 8;
    const c = this.add.container(x, 0).setDepth(baseY - 2);
    const key = ensureGlowTexture(this);

    // spotlight cone
    const cone = this.add.graphics();
    cone.fillStyle(0xfff3d0, 0.05);
    cone.fillPoints([
      new Phaser.Geom.Point(-34, 96), new Phaser.Geom.Point(34, 96),
      new Phaser.Geom.Point(SCREEN.w / 2 + 30, screenBot),
      new Phaser.Geom.Point(-SCREEN.w / 2 - 30, screenBot)
    ], true);
    c.add(cone);
    c.add(this.add.image(0, SCREEN.cy, key).setScale(5, 3.6).setTint(0xbfd0ff)
      .setAlpha(0.05).setBlendMode(Phaser.BlendModes.ADD));

    // plinth + framed screen
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3); g.fillEllipse(0, baseY + 4, 190, 28);
    g.fillStyle(0x2a2030, 1);  g.fillRect(-52, screenBot, 104, baseY - screenBot);
    g.fillStyle(0x352942, 1);  g.fillRect(-52, screenBot, 104, 8);
    g.fillStyle(0x000000, 0.5);
    g.fillRoundedRect(-SCREEN.w / 2 - 12, screenTop - 12, SCREEN.w + 24, SCREEN.h + 24, 8);
    g.fillStyle(0x2a2620, 1);
    g.fillRoundedRect(-SCREEN.w / 2 - 8, screenTop - 8, SCREEN.w + 16, SCREEN.h + 16, 6);
    g.fillStyle(0x0c0c14, 1);
    g.fillRect(-SCREEN.w / 2, screenTop, SCREEN.w, SCREEN.h);
    c.add(g);

    // idle screen content (play glyph) shown when not playing
    const idle = this.add.container(0, SCREEN.cy);
    idle.add(this.add.image(0, 0, key).setScale(3, 4).setTint(0x6a78c0)
      .setAlpha(0.10).setBlendMode(Phaser.BlendModes.ADD));
    idle.add(this.add.text(0, 0, "▶", {
      fontFamily: '"Fredoka", sans-serif', fontSize: "40px", color: "#cdd6ff"
    }).setOrigin(0.5).setAlpha(0.5));
    c.add(idle);

    // brass name plaque
    const plaqueY = baseY - 34;
    const pg = this.add.graphics();
    pg.fillStyle(0x2a1c0e, 1); pg.fillRoundedRect(-80, plaqueY - 16, 160, 32, 4);
    pg.lineStyle(1.5, 0xb8902f, 0.85); pg.strokeRoundedRect(-80, plaqueY - 16, 160, 32, 4);
    c.add(pg);
    c.add(this.add.text(0, plaqueY, clip.name || `Kid ${i + 1}`, {
      fontFamily: '"Fredoka", sans-serif', fontSize: "16px", fontStyle: "700",
      color: "#ffe6ac", align: "center", wordWrap: { width: 150 }
    }).setOrigin(0.5));

    // "coming soon" tag if there is no real clip yet — placed inside the screen,
    // just below the play glyph, so it never collides with the title banner.
    const comingSoon = !clip.src ? this.add.text(x, SCREEN.cy + 54, "🎬 clip coming soon", {
      fontFamily: '"Nunito", sans-serif', fontSize: "13px", fontStyle: "700",
      color: "#9a93a8"
    }).setOrigin(0.5).setDepth(baseY) : null;

    this.pedestals.push({
      i, x, f: clip, idle, comingSoon,
      rect: { x, cy: SCREEN.cy, w: SCREEN.w, h: SCREEN.h }
    });
  }

  _buildExit(x, height) {
    const key = ensureGlowTexture(this);
    const glow = this.add.image(x, height - 60, key).setScale(2.4, 2).setTint(0xffd56b)
      .setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(FLOOR_Y);
    this.tweens.add({ targets: glow, alpha: 0.6, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    const t = this.add.text(x, height - 150, "to the credits  →", {
      fontFamily: '"Fredoka", sans-serif', fontSize: "20px", fontStyle: "700",
      color: "#fff8ec", stroke: "#000000", strokeThickness: 4
    }).setOrigin(0.5).setDepth(FLOOR_Y + 60);
    this.tweens.add({ targets: t, x: x + 10, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  // ── Live clip playback (one <video> at a time, like the Hall of Fame) ──────
  _activate(idx) {
    if (this.activeIdx === idx) return;
    this._deactivate();
    const ped = this.pedestals[idx];
    if (!ped || !ped.f.src) return;     // nothing to play (coming soon)
    this.activeIdx = idx;

    const video = document.createElement("video");
    video.src = ped.f.src;
    video.playsInline = true;
    video.autoplay = true;
    video.loop = true;
    video.style.cssText = "position:fixed; object-fit:cover; z-index:40; opacity:0; transition:opacity .3s; pointer-events:none; border-radius:2px; background:#0c0c14;";
    document.body.appendChild(video);
    this._videoEl = video;
    this._videoPed = ped;

    video.addEventListener("canplay", () => {
      if (this._videoEl !== video) return;
      this._placeVideo();
      video.style.opacity = "1";
      ped.idle.setAlpha(0.001);
    });
    video.addEventListener("error", () => { if (this._videoEl === video) this._deactivate(); });
  }

  _deactivate() {
    if (this._videoEl) { this._videoEl.pause(); this._videoEl.remove(); this._videoEl = null; }
    if (this._videoPed) { this._videoPed.idle.setAlpha(1); this._videoPed = null; }
    this.activeIdx = -1;
  }

  _placeVideo() {
    if (!this._videoEl || !this._videoPed) return;
    const cam = this.cameras.main;
    const r = this.game.canvas.getBoundingClientRect();
    const sx = r.width / this.scale.width, sy = r.height / this.scale.height;
    const { x, cy, w, h } = this._videoPed.rect;
    const left = r.left + (x - w / 2 - cam.scrollX) * sx;
    const top  = r.top  + (cy - h / 2 - cam.scrollY) * sy;
    this._videoEl.style.left   = `${left}px`;
    this._videoEl.style.top    = `${top}px`;
    this._videoEl.style.width  = `${w * sx}px`;
    this._videoEl.style.height = `${h * sy}px`;
  }

  _toCredits(fadeMs) {
    if (this._leaving) return;
    this._leaving = true;
    this._deactivate();
    this.cameras.main.fadeOut(fadeMs, 4, 3, 8);
    this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("EndingScene"));
  }

  update(time, delta) {
    if (this._leaving) return;
    const p = this.player;
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown)   vx = -PLAYER_SPEED;
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx =  PLAYER_SPEED;
    if (this.cursors.up.isDown || this.wasd.up.isDown)       vy = -PLAYER_SPEED;
    if (this.cursors.down.isDown || this.wasd.down.isDown)   vy =  PLAYER_SPEED;

    const nx = Phaser.Math.Clamp(p.x + vx * (delta / 1000), 28, this.worldW - 28);
    const ny = Phaser.Math.Clamp(p.y + vy * (delta / 1000), FLOOR_Y + 50, this.scale.height - 30);
    p.setPosition(nx, ny);
    p.setDepth(ny);
    p.update(vx, vy, delta);

    // play the clip Dad is standing in front of; stop it when he moves away
    let nearest = -1, nd = ACT_RANGE;
    for (const ped of this.pedestals) {
      const d = Math.abs(p.x - ped.x);
      if (d < nd) { nd = d; nearest = ped.i; }
    }
    if (nearest >= 0) this._activate(nearest);
    else if (this.activeIdx >= 0) this._deactivate();
    if (this._videoEl) this._placeVideo();

    if (p.x >= this.exitX) { this._toCredits(700); return; }
    if (Phaser.Input.Keyboard.JustDown(this.escKey)) this._toCredits(450);
  }
}
