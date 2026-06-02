import Phaser from "phaser";
import { SKY } from "../art/palette.js";
import { drawSky, addStars, addCloud } from "../art/Scenery.js";
import { addHouse1166 } from "../art/House1166.js";
import { addVignette, addColorGrade, addFireflies, ensureGlowTexture } from "../art/effects.js";

export class TitleScene extends Phaser.Scene {
  constructor() { super({ key: "TitleScene" }); }

  create() {
    const { width, height } = this.scale;

    // dusk sky behind a softly lit 1166
    drawSky(this, SKY.dusk);
    addStars(this, 50);
    addCloud(this, 260, 90, 0.7);

    // house silhouette, dim and warm-windowed
    const house = addHouse1166(this, width / 2 - 192, 150, { scale: 0.62, depth: 5, lit: true });
    house.setAlpha(0.96);

    addFireflies(this, { count: 18, color: 0xffe2a0 });
    addColorGrade(this, 0x5a3a6a, 0.14);
    addVignette(this, 0.55);

    // start music if loaded
    if (this.cache.audio.exists("music_main") && !this.sound.get("music_main")) {
      this.sound.add("music_main", { loop: true, volume: 0.5 }).play();
    }

    // glow behind title
    const key = ensureGlowTexture(this);
    this.add.image(width / 2, height * 0.30, key).setScale(8, 4)
      .setTint(0xffd56b).setAlpha(0.14).setBlendMode(Phaser.BlendModes.ADD).setDepth(100);

    // Title
    const shadow = this.add.text(width / 2 + 3, height * 0.27 + 4, "DAD", {
      fontFamily: '"Fredoka", sans-serif', fontSize: "82px", fontStyle: "700",
      color: "#000000"
    }).setOrigin(0.5).setAlpha(0.4).setDepth(101);
    this.add.text(width / 2, height * 0.27, "DAD", {
      fontFamily: '"Fredoka", sans-serif', fontSize: "82px", fontStyle: "700",
      color: "#ffd56b"
    }).setOrigin(0.5).setDepth(102);

    this.add.text(width / 2, height * 0.45, "The Book of Derrick", {
      fontFamily: '"Caveat", cursive', fontSize: "40px", fontStyle: "700",
      color: "#fdf3df"
    }).setOrigin(0.5).setDepth(102);

    this.add.text(width / 2, height * 0.55, "A Father's Day Adventure", {
      fontFamily: '"Nunito", sans-serif', fontSize: "15px", fontStyle: "700",
      color: "#e8d8ff"
    }).setOrigin(0.5).setDepth(102).setAlpha(0.85);

    // start prompt
    const start = this.add.text(width / 2, height * 0.74, "Press ENTER to begin", {
      fontFamily: '"Nunito", sans-serif', fontSize: "18px", fontStyle: "800",
      color: "#ffffff"
    }).setOrigin(0.5).setDepth(102);
    this.tweens.add({ targets: start, alpha: 0.2, duration: 800, yoyo: true, repeat: -1 });

    this.add.text(width / 2, height * 0.93, "made with love by DJ & Danielle", {
      fontFamily: '"Caveat", cursive', fontSize: "22px",
      color: "#cdbce0"
    }).setOrigin(0.5).setDepth(102);

    this.cameras.main.fadeIn(800, 6, 8, 16);

    this.input.keyboard.once("keydown-ENTER", () => {
      this.cameras.main.fadeOut(600, 6, 8, 16);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("HubScene"));
    });
  }
}
