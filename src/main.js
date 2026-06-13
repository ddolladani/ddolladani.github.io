import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "./config/gameConfig.js";
import { BootScene }    from "./scenes/BootScene.js";
import { IntroScene }   from "./scenes/IntroScene.js";
import { TitleScene }   from "./scenes/TitleScene.js";
import { HubScene }     from "./scenes/HubScene.js";
import { ChapterScene } from "./scenes/ChapterScene.js";
import { EndingScene }  from "./scenes/EndingScene.js";
import { MemoryScene }  from "./scenes/MemoryScene.js";
import { EgoTavernScene } from "./scenes/EgoTavernScene.js";
import { ParkingLotScene } from "./scenes/ParkingLotScene.js";
import { HallOfFameScene } from "./scenes/HallOfFameScene.js";

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#0a0a14",
  // Illustrated style: smooth shapes, antialiased, high-DPI crisp
  pixelArt: false,
  antialias: true,
  roundPixels: false,
  resolution: window.devicePixelRatio || 1,
  parent: document.body,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: GAME_WIDTH,
    height: GAME_HEIGHT
  },
  scene: [
    BootScene,
    IntroScene,
    TitleScene,
    HubScene,
    ChapterScene,
    EndingScene,
    MemoryScene,
    EgoTavernScene,
    ParkingLotScene,
    HallOfFameScene
  ],
  physics: {
    default: "arcade",
    arcade: { debug: false }
  }
};

// ── Simple unlock gate ──────────────────────────────────────────────────────
// Basic protection so a public link isn't wide open. NOTE: this is client-side
// only — it deters casual visitors but isn't real security. The unlock is
// remembered on the device so Dad only types it once.
const PASSWORD   = "1166";
const UNLOCK_KEY = "dad_unlocked";

function safeGet(key) { try { return localStorage.getItem(key); } catch { return null; } }
function safeSet(key, val) { try { localStorage.setItem(key, val); } catch {} }

function startGame() {
  const game = new Phaser.Game(config);
  // Exposed for quick debugging / smoke tests (harmless in this personal build).
  window.__GAME__ = game;
}

function showGate() {
  const overlay = document.createElement("div");
  overlay.style.cssText = `
    position: fixed; inset: 0; background: #000; z-index: 99999;
    display: flex; flex-direction: column; align-items: center; justify-content: center;
    font-family: 'Nunito', sans-serif; color: #fdf3df;`;
  overlay.innerHTML = `
    <div style="font-size:34px; margin-bottom:6px;">🔒</div>
    <div style="font-family:'Fredoka',sans-serif; font-size:22px; color:#ffd56b; margin-bottom:18px;">
      Enter password to begin
    </div>
    <input id="gate-input" type="password" autocomplete="off" autofocus
      style="width:220px; padding:10px 14px; font-size:18px; text-align:center;
             border:2px solid #ffd56b; border-radius:8px; background:#14101c;
             color:#fff; outline:none;" />
    <div id="gate-msg" style="height:20px; margin-top:12px; font-size:14px; color:#e06a78;"></div>
  `;
  document.body.appendChild(overlay);

  const input = overlay.querySelector("#gate-input");
  const msg   = overlay.querySelector("#gate-msg");
  const tryUnlock = () => {
    if (input.value.trim() === PASSWORD) {
      safeSet(UNLOCK_KEY, "1");
      overlay.remove();
      startGame();
    } else {
      msg.textContent = "Hmm, that's not it. Try again.";
      input.value = "";
      input.style.borderColor = "#e06a78";
      setTimeout(() => { input.style.borderColor = "#ffd56b"; }, 600);
    }
  };
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") tryUnlock(); });
  input.focus();
}

if (safeGet(UNLOCK_KEY) === "1") startGame();
else showGate();
