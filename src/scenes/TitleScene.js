import Phaser from "phaser";

export class TitleScene extends Phaser.Scene {
  constructor() {
    super({ key: "TitleScene" });
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#0a0a1a");

    // Start music
    if (!this.sound.get("music_main")) {
      this.sound.add("music_main", { loop: true, volume: 0.5 }).play();
    }

    // Title
    this.add.text(width / 2, height * 0.28, "DAD", {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "52px",
      color: "#ffd700",
      stroke: "#000000",
      strokeThickness: 6
    }).setOrigin(0.5);

    this.add.text(width / 2, height * 0.42, "The Book of Derrick", {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "18px",
      color: "#ffffff"
    }).setOrigin(0.5);

    // Subtitle
    this.add.text(width / 2, height * 0.55, "A Father's Day Adventure", {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "11px",
      color: "#aaaaaa"
    }).setOrigin(0.5);

    // Blinking start prompt
    const startText = this.add.text(width / 2, height * 0.74, "PRESS ENTER TO BEGIN", {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "14px",
      color: "#ffd700"
    }).setOrigin(0.5);

    this.tweens.add({
      targets: startText,
      alpha: 0,
      duration: 600,
      yoyo: true,
      repeat: -1
    });

    // Credits
    this.add.text(width / 2, height * 0.92, "Made with love by DJ & Danielle", {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "9px",
      color: "#666666"
    }).setOrigin(0.5);

    this.input.keyboard.once("keydown-ENTER", () => {
      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("HubScene");
      });
    });
  }
}
