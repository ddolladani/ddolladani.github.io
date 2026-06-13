import Phaser from "phaser";

// A small, reusable music settings control pinned to the bottom-right corner.
// A gear icon opens a little panel with a mute toggle and a volume slider.
// The chosen level is stored on the device and applied to the global music.

const VOL_KEY  = "dad_music_vol";
const MUTE_KEY = "dad_music_muted";
const DEFAULT_VOL = 0.5;

function safeGet(k) { try { return localStorage.getItem(k); } catch { return null; } }
function safeSet(k, v) { try { localStorage.setItem(k, v); } catch {} }

export function isMuted() { return safeGet(MUTE_KEY) === "1"; }

// The volume the music should actually play at (0 when muted).
export function getStoredVolume() {
  if (isMuted()) return 0;
  const v = parseFloat(safeGet(VOL_KEY));
  return isNaN(v) ? DEFAULT_VOL : Phaser.Math.Clamp(v, 0, 1);
}

function storeVolume(vol, muted) {
  safeSet(VOL_KEY, String(vol));
  safeSet(MUTE_KEY, muted ? "1" : "0");
}

// Push the stored level onto the currently-playing music (if any).
export function applyStoredVolume(scene) {
  const m = scene.sound.get("music_main");
  if (m) m.setVolume(getStoredVolume());
}

export function addSettings(scene, opts = {}) {
  const { width, height } = scene.scale;
  const depth = opts.depth ?? 100001;
  applyStoredVolume(scene);

  // gear toggle
  const gear = scene.add.text(width - 28, height - 26, "⚙", {
    fontFamily: '"Nunito", sans-serif', fontSize: "24px", color: "#ffffff"
  }).setOrigin(0.5).setScrollFactor(0).setDepth(depth).setAlpha(0.82)
    .setInteractive({ useHandCursor: true });
  gear.setShadow(0, 1, "#000000", 4);

  // panel geometry (absolute, fixed to screen)
  const pLeft = width - 214, pRight = width - 16;
  const pTop  = height - 122, pBot = height - 50;
  const cx = (pLeft + pRight) / 2;
  const trackX0 = pLeft + 50, trackX1 = pRight - 20, trackY = pTop + 46;
  const trackW = trackX1 - trackX0;

  const parts = [];
  const reg = (o) => { o.setScrollFactor(0).setDepth(depth).setVisible(false); parts.push(o); return o; };

  const bg = scene.add.graphics();
  bg.fillStyle(0x14101c, 0.95); bg.fillRoundedRect(pLeft, pTop, pRight - pLeft, pBot - pTop, 10);
  bg.lineStyle(2, 0xffd56b, 0.5); bg.strokeRoundedRect(pLeft, pTop, pRight - pLeft, pBot - pTop, 10);
  reg(bg);

  reg(scene.add.text(cx, pTop + 16, "Music", {
    fontFamily: '"Fredoka", sans-serif', fontSize: "14px", fontStyle: "700", color: "#ffe6ac"
  }).setOrigin(0.5));

  const muteBtn = reg(scene.add.text(pLeft + 24, trackY, isMuted() ? "🔇" : "🔊", {
    fontFamily: '"Nunito", sans-serif', fontSize: "20px", color: "#ffffff"
  }).setOrigin(0.5).setInteractive({ useHandCursor: true }));

  const track = reg(scene.add.graphics());
  const knob  = reg(scene.add.circle(trackX0, trackY, 7, 0xffd56b)
    .setInteractive({ useHandCursor: true }));
  scene.input.setDraggable(knob);
  // a wide hit zone over the track so a click anywhere on it jumps the level
  const zone = reg(scene.add.zone(trackX0 + trackW / 2, trackY, trackW + 16, 24)
    .setOrigin(0.5).setInteractive({ useHandCursor: true }));

  const redraw = () => {
    const muted = isMuted();
    const vol = muted ? 0 : getStoredVolume();
    muteBtn.setText(muted ? "🔇" : "🔊");
    track.clear();
    track.fillStyle(0x3a3348, 1); track.fillRoundedRect(trackX0, trackY - 3, trackW, 6, 3);
    track.fillStyle(0xffd56b, 1); track.fillRoundedRect(trackX0, trackY - 3, trackW * vol, 6, 3);
    knob.x = trackX0 + trackW * vol;
  };

  const setVol = (v) => {
    v = Phaser.Math.Clamp(v, 0, 1);
    storeVolume(v, v <= 0.001);          // dragging fully left mutes
    const m = scene.sound.get("music_main");
    if (m) m.setVolume(v);
    redraw();
  };

  muteBtn.on("pointerdown", () => {
    const nowMuted = !isMuted();
    const vol = parseFloat(safeGet(VOL_KEY));
    storeVolume(isNaN(vol) ? DEFAULT_VOL : vol, nowMuted);
    const m = scene.sound.get("music_main");
    if (m) m.setVolume(getStoredVolume());
    redraw();
  });

  knob.on("drag", (_p, dragX) => setVol((dragX - trackX0) / trackW));
  zone.on("pointerdown", (p) => setVol((p.x - trackX0) / trackW));

  let open = false;
  const setOpen = (v) => { open = v; parts.forEach((o) => o.setVisible(v)); if (v) redraw(); };
  gear.on("pointerdown", () => setOpen(!open));
  // tapping elsewhere closes the panel
  scene.input.on("pointerdown", (p, targets) => {
    if (!open) return;
    if (targets.includes(gear) || parts.some((o) => targets.includes(o))) return;
    setOpen(false);
  });

  redraw();
  return { gear };
}
