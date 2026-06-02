import Phaser from "phaser";
import { drawSky, addStars } from "../art/Scenery.js";
import { SKY } from "../art/palette.js";
import { addVignette, addColorGrade, addFireflies } from "../art/effects.js";

const LINES = [
  { t: "You did it, Dad.",                 s: 30, c: "#fdf3df", f: "Fredoka" },
  { t: "Every memory we've shared",         s: 22, c: "#e8d8ff", f: "Nunito" },
  { t: "made us who we are.",               s: 22, c: "#e8d8ff", f: "Nunito" },
  { t: "Thank you for every moment,",       s: 22, c: "#e8d8ff", f: "Nunito" },
  { t: "and for being our hero.",           s: 22, c: "#e8d8ff", f: "Nunito" },
  { t: "We love you.",                      s: 26, c: "#ffd56b", f: "Fredoka" },
  { t: "— DJ & Danielle",                   s: 30, c: "#ffd56b", f: "Caveat" }
];

export class EndingScene extends Phaser.Scene {
  constructor() { super({ key: "EndingScene" }); }

  create() {
    const { width, height } = this.scale;

    drawSky(this, SKY.night);
    addStars(this, 110);
    addFireflies(this, { count: 24, color: 0xffe9a8 });
    addColorGrade(this, 0x3a4a8a, 0.12);
    addVignette(this, 0.5);

    const music = this.sound.get("music_main");
    if (music) this.tweens.add({ targets: music, volume: 0.28, duration: 2500 });

    const startY = height * 0.2;
    const gap = 56;

    LINES.forEach((ln, i) => {
      const fam = ln.f === "Caveat" ? '"Caveat", cursive'
                : ln.f === "Fredoka" ? '"Fredoka", sans-serif'
                : '"Nunito", sans-serif';
      const txt = this.add.text(width / 2, startY + i * gap, ln.t, {
        fontFamily: fam, fontSize: `${ln.s}px`, fontStyle: "700",
        color: ln.c, align: "center"
      }).setOrigin(0.5).setAlpha(0);
      this.tweens.add({
        targets: txt, alpha: 1, y: startY + i * gap - 4,
        duration: 1100, delay: 700 + i * 650, ease: "Sine.easeOut"
      });
    });

    const replay = this.add.text(width / 2, height - 34, "Press ENTER to play again", {
      fontFamily: '"Nunito", sans-serif', fontSize: "14px", fontStyle: "700",
      color: "#9a93b8"
    }).setOrigin(0.5).setAlpha(0);
    this.tweens.add({ targets: replay, alpha: 1, duration: 900, delay: 700 + LINES.length * 650 + 800 });

    this.input.keyboard.once("keydown-ENTER", () => {
      ["completedChapters", "found_dj", "found_danielle", "found_together"]
        .forEach(k => this.registry.set(k, []));
      this.cameras.main.fadeOut(700, 6, 8, 16);
      this.cameras.main.once("camerafadeoutcomplete", () => this.scene.start("TitleScene"));
    });
  }
}
