import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT } from "./config/gameConfig.js";
import { BootScene }    from "./scenes/BootScene.js";
import { IntroScene }   from "./scenes/IntroScene.js";
import { TitleScene }   from "./scenes/TitleScene.js";
import { HubScene }     from "./scenes/HubScene.js";
import { ChapterScene } from "./scenes/ChapterScene.js";
import { EndingScene }  from "./scenes/EndingScene.js";
import { MemoryScene }  from "./scenes/MemoryScene.js";

const config = {
  type: Phaser.AUTO,
  width: GAME_WIDTH,
  height: GAME_HEIGHT,
  backgroundColor: "#000000",
  pixelArt: true,
  parent: document.body,
  scene: [
    BootScene,
    IntroScene,
    TitleScene,
    HubScene,
    ChapterScene,
    EndingScene,
    MemoryScene
  ],
  physics: {
    default: "arcade",
    arcade: { debug: false }
  }
};

new Phaser.Game(config);
