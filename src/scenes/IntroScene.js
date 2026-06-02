import Phaser from "phaser";

const INTRO_LINES = [
  "Every great adventure",
  "starts at home."
];

export class IntroScene extends Phaser.Scene {
  constructor() {
    super({ key: "IntroScene" });
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#000000");

    const style = {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "18px",
      color: "#ffffff",
      align: "center",
      wordWrap: { width: width * 0.8 }
    };

    const line1 = this.add.text(width / 2, height / 2 - 20, INTRO_LINES[0], style)
      .setOrigin(0.5)
      .setAlpha(0);

    const line2 = this.add.text(width / 2, height / 2 + 20, INTRO_LINES[1], style)
      .setOrigin(0.5)
      .setAlpha(0);

    this.tweens.add({
      targets: line1,
      alpha: 1,
      duration: 1200,
      ease: "Sine.easeIn",
      onComplete: () => {
        this.tweens.add({
          targets: line2,
          alpha: 1,
          duration: 1200,
          ease: "Sine.easeIn",
          onComplete: () => {
            this.time.delayedCall(1800, () => {
              this.tweens.add({
                targets: [line1, line2],
                alpha: 0,
                duration: 1000,
                onComplete: () => this.scene.start("TitleScene")
              });
            });
          }
        });
      }
    });
  }
}
