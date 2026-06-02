import Phaser from "phaser";

const LINES = [
  "You did it, Dad.",
  " ",
  "Every memory we've shared",
  "made us who we are.",
  " ",
  "Thank you for every moment.",
  "We love you.",
  " ",
  "— DJ & Danielle"
];

export class EndingScene extends Phaser.Scene {
  constructor() {
    super({ key: "EndingScene" });
  }

  create() {
    const { width, height } = this.scale;

    this.cameras.main.setBackgroundColor("#000000");
    this.cameras.main.fadeIn(1000, 0, 0, 0);

    // Soft music fade down at the end
    const music = this.sound.get("music_main");
    if (music) {
      this.tweens.add({ targets: music, volume: 0.2, duration: 2000 });
    }

    const startY = height * 0.12;
    const lineH  = 44;

    LINES.forEach((line, i) => {
      const isSignature = line.startsWith("—");
      const text = this.add.text(width / 2, startY + i * lineH, line, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: isSignature ? "13px" : "12px",
        color: isSignature ? "#ffd700" : "#ffffff",
        align: "center",
        wordWrap: { width: width * 0.8 }
      })
        .setOrigin(0.5)
        .setAlpha(0);

      this.tweens.add({
        targets: text,
        alpha: 1,
        duration: 900,
        delay: 600 + i * 500,
        ease: "Sine.easeIn"
      });
    });

    // Replay prompt
    const replay = this.add.text(width / 2, height - 36,
      "Press ENTER to play again",
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "9px",
        color: "#555555"
      }
    ).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: replay,
      alpha: 1,
      duration: 800,
      delay: 600 + LINES.length * 500 + 1000
    });

    this.input.keyboard.once("keydown-ENTER", () => {
      // Reset progress
      this.registry.set("completedChapters", []);
      this.registry.set("found_dj", []);
      this.registry.set("found_danielle", []);
      this.registry.set("found_together", []);

      this.cameras.main.fadeOut(600, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("TitleScene");
      });
    });
  }
}
