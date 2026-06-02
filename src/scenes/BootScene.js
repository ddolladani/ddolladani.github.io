import Phaser from "phaser";

// BootScene only loads assets that actually exist.
// Memory images are loaded lazily in ChapterScene when a chapter begins.
// Sprite sheets and tilemaps are loaded here once you have the art assets —
// see the commented-out section below.

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  preload() {
    // Background music — add your chiptune MP3 to /public/assets/audio/
    this.load.audio("music_main", "assets/audio/chiptune_main.mp3");

    // ── Uncomment when you have pixel art assets ────────────────────────
    // this.load.spritesheet("player", "assets/sprites/player.png", {
    //   frameWidth: 32, frameHeight: 48
    // });
    // ────────────────────────────────────────────────────────────────────

    // Suppress missing-file errors so the game boots even without assets
    this.load.on("loaderror", (file) => {
      console.warn("Asset not found (skipping):", file.src);
    });
  }

  create() {
    this.scene.start("IntroScene");
  }
}
