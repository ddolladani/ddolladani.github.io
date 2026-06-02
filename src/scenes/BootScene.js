import Phaser from "phaser";

// Boots the game. Music is only loaded if a real audio file is actually
// present — this avoids the "unable to decode" error during development
// when the file hasn't been added yet (the dev server serves index.html
// in place of missing files, which isn't valid audio).

const MUSIC_SRC = "assets/audio/chiptune_main.mp3";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  create() {
    fetch(MUSIC_SRC, { method: "HEAD" })
      .then((res) => {
        const ct = res.headers.get("content-type") || "";
        if (res.ok && /audio|mpeg|ogg|octet-stream/i.test(ct)) {
          this.load.audio("music_main", MUSIC_SRC);
          this.load.once("complete", () => this.scene.start("IntroScene"));
          this.load.once("loaderror", () => this.scene.start("IntroScene"));
          this.load.start();
        } else {
          this.scene.start("IntroScene");
        }
      })
      .catch(() => this.scene.start("IntroScene"));
  }
}
