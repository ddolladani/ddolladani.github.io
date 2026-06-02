import Phaser from "phaser";
import { addStars } from "../art/Scenery.js";
import { addVignette } from "../art/effects.js";

const LINES = [
  "Every great adventure",
  "begins at home."
];

export class IntroScene extends Phaser.Scene {
  constructor() { super({ key: "IntroScene" }); }

  create() {
    const { width, height } = this.scale;

    // deep night gradient
    const g = this.add.graphics();
    g.fillGradientStyle(0x070a18, 0x070a18, 0x16203f, 0x16203f, 1);
    g.fillRect(0, 0, width, height);
    addStars(this, 60);
    addVignette(this, 0.6);

    const style = {
      fontFamily: '"Caveat", cursive', fontSize: "44px", fontStyle: "600",
      color: "#fdf3df", align: "center"
    };

    const line1 = this.add.text(width / 2, height / 2 - 26, LINES[0], style)
      .setOrigin(0.5).setAlpha(0);
    const line2 = this.add.text(width / 2, height / 2 + 30, LINES[1], style)
      .setOrigin(0.5).setAlpha(0);

    this.tweens.chain({
      tweens: [
        { targets: line1, alpha: 1, duration: 1400, ease: "Sine.easeIn" },
        { targets: line2, alpha: 1, duration: 1400, ease: "Sine.easeIn", delay: 200 },
        { targets: [line1, line2], alpha: 0, duration: 1100, delay: 1700,
          onComplete: () => this.scene.start("TitleScene") }
      ]
    });

    // allow skipping
    this.input.keyboard.once("keydown", () => this.scene.start("TitleScene"));
  }
}
