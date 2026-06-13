import Phaser from "phaser";
import { PLAYER_SPEED } from "../config/gameConfig.js";
import { ensureGlowTexture, addVignette, addColorGrade, addFireflies } from "../art/effects.js";
import { Character } from "../entities/Character.js";
import { heading, topScrim } from "../ui/ui.js";
import { addSettings } from "../ui/settings.js";
import { hallOfFame } from "../config/hallOfFame.js";

// The Hall of Fame — a walk-through gallery. Each family "Happy Father's Day"
// clip stands on its own lit pedestal along a long hall. Dad strolls left→right
// and the clip in front of him starts playing (and pauses when he moves on).
// Only the pedestal he's standing at runs a live <video>; the rest show a quiet
// "now showing" panel. Walking off the right end rolls into the ending.

const FLOOR_Y   = 430;          // where the gallery floor starts
const SCREEN     = { w: 188, h: 280, cy: 232 };  // portrait clip screen
const GAP        = 400;          // spacing between pedestals
const FIRST_X    = 360;          // x of the first pedestal
const ACT_RANGE  = 150;          // how close Dad must be to start a clip
const DEPTH = { fireflies: 50000, grade: 90000, vignette: 95000, ui: 100000 };

export class HallOfFameScene extends Phaser.Scene {
  constructor() { super({ key: "HallOfFameScene" }); }

  create() {
    const { width, height } = this.scale;
    this.features = hallOfFame.length ? hallOfFame
      : [{ name: "The Family", caption: "Happy Father's Day!" }];

    this.pedestals = [];
    this.activeIdx = -1;
    this._leaving = false;

    const lastX = FIRST_X + (this.features.length - 1) * GAP;
    this.exitX = lastX + 300;
    this.worldW = this.exitX + 160;

    this.events.once("shutdown", () => this._deactivate());

    // No background music in the Hall of Fame — the family clips carry their own
    // audio. Pause it here; the ending resumes it.
    const music = this.sound.get("music_main");
    if (music && music.isPlaying) music.pause();

    this._buildHall(width, height);
    this.features.forEach((f, i) => this._buildPedestal(i, FIRST_X + i * GAP, f));
    this._buildExit(this.exitX, height);

    // ── Character ──
    this.player = new Character(this, 120, FLOOR_Y + 120, { scale: 1.12, depth: FLOOR_Y + 120 });

    // ── Camera (scrolls horizontally with Dad) ──
    this.cameras.main.setBounds(0, 0, this.worldW, height);
    this.cameras.main.startFollow(this.player.root, true, 0.12, 0.12);
    this.cameras.main.setDeadzone(220, height);
    this.cameras.main.fadeIn(700, 4, 3, 8);

    // ── Atmosphere (fixed to screen) ──
    addFireflies(this, { count: 16, color: 0xffe2a0, depth: DEPTH.fireflies,
      area: { x: 0, y: 90, w: width, h: height - 160 } });
    addColorGrade(this, 0x2a2150, 0.10).setDepth(DEPTH.grade);
    addVignette(this, 0.55).setDepth(DEPTH.vignette);

    // ── UI (fixed) ──
    topScrim(this, { height: 92, depth: DEPTH.ui - 1 });
    const h = heading(this, width / 2, 36, "Hall of Fame", { size: 28 });
    h.t.setScrollFactor(0).setDepth(DEPTH.ui);
    h.shadow.setScrollFactor(0).setDepth(DEPTH.ui);
    this.add.text(width / 2, 64, "Walk the gallery  ·  stand in front of a screen to play it", {
      fontFamily: '"Nunito", sans-serif', fontSize: "13px", fontStyle: "700",
      color: "#ffffff", stroke: "#000000", strokeThickness: 3
    }).setOrigin(0.5).setScrollFactor(0).setDepth(DEPTH.ui).setAlpha(0.92);
    this.add.text(20, 30, "ESC  ·  skip to the end", {
      fontFamily: '"Nunito", sans-serif', fontSize: "13px", fontStyle: "600",
      color: "#ffffff", stroke: "#000000", strokeThickness: 3
    }).setOrigin(0, 0.5).setScrollFactor(0).setDepth(DEPTH.ui).setAlpha(0.85);

    addSettings(this);

    // ── Input ──
    this.cursors = this.input.keyboard.createCursorKeys();
    this.wasd = this.input.keyboard.addKeys({ up: "W", down: "S", left: "A", right: "D" });
    this.escKey = this.input.keyboard.addKey("ESC");
  }

  // ── Hall environment ───────────────────────────────────────────────────────
  _buildHall(width, height) {
    const w = this.worldW;
    // deep auditorium walls
    const bg = this.add.graphics().setDepth(-100);
    bg.fillGradientStyle(0x140f22, 0x140f22, 0x0a0a14, 0x0a0a14, 1);
    bg.fillRect(0, 0, w, height);

    // wainscot band + floor
    const wains = this.add.graphics().setDepth(-96);
    wains.fillStyle(0x241a30, 1); wains.fillRect(0, FLOOR_Y - 26, w, 26);
    wains.fillStyle(0x32243f, 1); wains.fillRect(0, FLOOR_Y - 26, w, 5);

    const floor = this.add.graphics().setDepth(-95);
    floor.fillGradientStyle(0x201826, 0x201826, 0x120d18, 0x120d18, 1);
    floor.fillRect(0, FLOOR_Y, w, height - FLOOR_Y);
    // floorboard sheen lines receding
    floor.lineStyle(2, 0x2c2236, 0.5);
    for (let y = FLOOR_Y + 26; y < height; y += 30) floor.lineBetween(0, y, w, y);

    // a long red runner down the middle of the hall
    const rug = this.add.graphics().setDepth(-94);
    rug.fillStyle(0x6e1722, 0.9); rug.fillRect(0, height - 86, w, 70);
    rug.fillStyle(0x8a1f2e, 0.9); rug.fillRect(0, height - 80, w, 8);
    rug.lineStyle(3, 0xb8902f, 0.5); rug.strokeRect(24, height - 84, w - 48, 66);
  }

  _buildPedestal(i, x, f) {
    const screenTop = SCREEN.cy - SCREEN.h / 2;
    const screenBot = SCREEN.cy + SCREEN.h / 2;
    const baseY = FLOOR_Y + 8;
    const c = this.add.container(x, 0).setDepth(baseY - 2);
    const key = ensureGlowTexture(this);

    // spotlight cone from the ceiling onto the screen
    const cone = this.add.graphics();
    cone.fillStyle(0xfff3d0, 0.05);
    cone.fillPoints([
      new Phaser.Geom.Point(-26, 92), new Phaser.Geom.Point(26, 92),
      new Phaser.Geom.Point(SCREEN.w / 2 + 26, screenBot),
      new Phaser.Geom.Point(-SCREEN.w / 2 - 26, screenBot)
    ], true);
    c.add(cone);
    c.add(this.add.image(0, SCREEN.cy, key).setScale(4, 3).setTint(0xbfd0ff)
      .setAlpha(0.05).setBlendMode(Phaser.BlendModes.ADD));

    // plinth / column under the screen
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.3); g.fillEllipse(0, baseY + 4, 150, 26);
    g.fillStyle(0x2a2030, 1);  g.fillRect(-46, screenBot, 92, baseY - screenBot);
    g.fillStyle(0x352942, 1);  g.fillRect(-46, screenBot, 92, 8);
    g.fillStyle(0x1d1526, 1);  g.fillRect(-58, baseY - 12, 116, 14);   // base
    g.fillStyle(0x3a2c4a, 1);  g.fillRect(-58, baseY - 12, 116, 4);

    // framed screen
    g.fillStyle(0x000000, 0.5);
    g.fillRoundedRect(-SCREEN.w / 2 - 12, screenTop - 12, SCREEN.w + 24, SCREEN.h + 24, 8);
    g.fillStyle(0x2a2620, 1);
    g.fillRoundedRect(-SCREEN.w / 2 - 8, screenTop - 8, SCREEN.w + 16, SCREEN.h + 16, 6); // bezel
    g.fillStyle(0x0c0c14, 1);
    g.fillRect(-SCREEN.w / 2, screenTop, SCREEN.w, SCREEN.h);
    c.add(g);

    // quiet "screen" content shown when not playing: a play glyph + soft glow
    const idle = this.add.container(0, SCREEN.cy);
    idle.add(this.add.image(0, 0, key).setScale(2.2, 3.2).setTint(0x6a78c0)
      .setAlpha(0.10).setBlendMode(Phaser.BlendModes.ADD));
    idle.add(this.add.text(0, 0, "▶", {
      fontFamily: '"Fredoka", sans-serif', fontSize: "30px", color: "#cdd6ff"
    }).setOrigin(0.5).setAlpha(0.5));
    c.add(idle);

    // brass name plaque on the plinth
    const plaqueY = baseY - 30;
    const pg = this.add.graphics();
    pg.fillStyle(0x2a1c0e, 1); pg.fillRoundedRect(-70, plaqueY - 14, 140, 28, 4);
    pg.lineStyle(1.5, 0xb8902f, 0.85); pg.strokeRoundedRect(-70, plaqueY - 14, 140, 28, 4);
    c.add(pg);
    c.add(this.add.text(0, plaqueY, f.name || `Feature ${i + 1}`, {
      fontFamily: '"Fredoka", sans-serif', fontSize: "14px", fontStyle: "700",
      color: "#ffe6ac", align: "center", wordWrap: { width: 132 }
    }).setOrigin(0.5));

    // caption under the plaque
    const cap = this.add.text(x, baseY + 34, f.caption ? `"${f.caption}"` : "", {
      fontFamily: '"Caveat", cursive', fontSize: "20px", color: "#ffe6ac",
      align: "center", wordWrap: { width: SCREEN.w + 60 }
    }).setOrigin(0.5, 0).setDepth(baseY - 2);

    // "coming soon" tag if there is no real clip
    const comingSoon = !f.src ? this.add.text(x, screenTop - 26, "🎬 clip coming soon", {
      fontFamily: '"Nunito", sans-serif', fontSize: "12px", fontStyle: "700",
      color: "#9a93a8"
    }).setOrigin(0.5).setDepth(baseY) : null;

    this.pedestals.push({
      i, x, f, idle, cap, comingSoon,
      screenTop, screenBot,
      // world-space rect of the live screen, for aligning the DOM <video>
      rect: { x, cy: SCREEN.cy, w: SCREEN.w, h: SCREEN.h }
    });
  }

  _buildExit(x, height) {
    const key = ensureGlowTexture(this);
    const glow = this.add.image(x, height - 60, key).setScale(2.4, 2).setTint(0xffd56b)
      .setAlpha(0.3).setBlendMode(Phaser.BlendModes.ADD).setDepth(FLOOR_Y);
    this.tweens.add({ targets: glow, alpha: 0.6, duration: 1200, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
    const t = this.add.text(x, height - 150, "EXIT  →", {
      fontFamily: '"Fredoka", sans-serif', fontSize: "22px", fontStyle: "700",
      color: "#fff8ec", stroke: "#000000", strokeThickness: 4
    }).setOrigin(0.5).setDepth(FLOOR_Y + 60);
    this.tweens.add({ targets: t, x: x + 10, duration: 900, yoyo: true, repeat: -1, ease: "Sine.easeInOut" });
  }

  // ── Live clip playback ─────────────────────────────────────────────────────
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
      ped.idle.setAlpha(0.001);          // hide the idle glyph behind the clip
    });
    video.addEventListener("error", () => { if (this._videoEl === video) this._deactivate(); });
  }

  _deactivate() {
    if (this._videoEl) { this._videoEl.pause(); this._videoEl.remove(); this._videoEl = null; }
    if (this._videoPed) { this._videoPed.idle.setAlpha(1); this._videoPed = null; }
    this.activeIdx = -1;
  }

  // Align the DOM <video> over its pedestal's screen, accounting for camera scroll.
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

  update(time, delta) {
    if (this._leaving) return;
    const p = this.player;
    let vx = 0, vy = 0;
    if (this.cursors.left.isDown || this.wasd.left.isDown)   vx = -PLAYER_SPEED;
    if (this.cursors.right.isDown || this.wasd.right.isDown) vx =  PLAYER_SPEED;
    if (this.cursors.up.isDown || this.wasd.up.isDown)       vy = -PLAYER_SPEED;
    if (this.cursors.down.isDown || this.wasd.down.isDown)   vy =  PLAYER_SPEED;

    const nx = Phaser.Math.Clamp(p.x + vx * (delta / 1000), 28, this.worldW - 28);
    const ny = Phaser.Math.Clamp(p.y + vy * (delta / 1000), FLOOR_Y + 60, this.scale.height - 30);
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

    // off the right end → into the ending
    if (p.x >= this.exitX) {
      this._leaving = true;
      this._deactivate();
      this.cameras.main.fadeOut(700, 4, 3, 8);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("EndingScene"));
      return;
    }

    if (Phaser.Input.Keyboard.JustDown(this.escKey)) {
      this._leaving = true;
      this._deactivate();
      this.cameras.main.fadeOut(450, 4, 3, 8);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("EndingScene"));
    }
  }
}
