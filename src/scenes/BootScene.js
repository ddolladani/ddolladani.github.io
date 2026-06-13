import Phaser from "phaser";

// Boots the game. Music is only loaded if a real audio file is actually
// present — this avoids the "unable to decode" error during development
// when the file hasn't been added yet (the dev server serves index.html
// in place of missing files, which isn't valid audio).

const MUSIC_SRC = "assets/audio/gameMusic.wav";

export class BootScene extends Phaser.Scene {
  constructor() {
    super({ key: "BootScene" });
  }

  create() {
    // The avatar face photo always loads (used to build Dad's head texture).
    this.load.image("dad_face", "assets/avatar/dad_face.jpg");

    const begin = () => {
      // Proceed to the game whether or not every file loaded; a missing
      // photo just falls back to the drawn head, missing music is skipped.
      this.load.once("complete", () => this.scene.start("IntroScene"));
      this.load.once("loaderror", () => this.scene.start("IntroScene"));
      this.load.start();
    };

    // Only queue music if a real, decodable audio file is actually present.
    fetch(MUSIC_SRC, { method: "HEAD" })
      .then((res) => {
        const ct = res.headers.get("content-type") || "";
        if (res.ok && /audio|mpeg|ogg|wav|octet-stream/i.test(ct)) {
          this.load.audio("music_main", MUSIC_SRC);
        }
        begin();
      })
      .catch(begin);
  }
}
