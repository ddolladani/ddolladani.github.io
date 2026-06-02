import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_SPEED, CHAPTERS } from "../config/gameConfig.js";

const HOUSE_COLOR  = 0x8b7355;
const GRASS_COLOR  = 0x4a7c3f;
const PATH_COLOR   = 0xc8a96e;
const DOOR_COLOR   = 0x5c3d1a;

// Chapter door positions
const DOORS = [
  { key: "dj",       x: 280, y: 260, label: "DJ",       color: CHAPTERS.dj.color },
  { key: "danielle", x: 480, y: 260, label: "Danielle",  color: CHAPTERS.danielle.color },
  { key: "together", x: 680, y: 260, label: "Together",  color: CHAPTERS.together.color }
];

export class HubScene extends Phaser.Scene {
  constructor() {
    super({ key: "HubScene" });
  }

  create() {
    const { width, height } = this.scale;
    this._completedChapters = this.registry.get("completedChapters") || [];

    this._drawWorld(width, height);
    this._createPlayer(width, height);
    this._createDoors();
    this._createUI(width);

    this.cameras.main.fadeIn(600, 0, 0, 0);

    // Listen for chapter completions coming back
    this.events.on("memory-closed", () => {});
  }

  _drawWorld(width, height) {
    const g = this.add.graphics();

    // Sky/background
    g.fillStyle(0x87ceeb);
    g.fillRect(0, 0, width, height * 0.45);

    // Grass
    g.fillStyle(GRASS_COLOR);
    g.fillRect(0, height * 0.45, width, height);

    // House facade
    g.fillStyle(HOUSE_COLOR);
    g.fillRect(140, 100, width - 280, 240);

    // Roof
    g.fillStyle(0x5c3324);
    g.fillTriangle(120, 100, width / 2, 20, width - 120, 100);

    // Walkway
    g.fillStyle(PATH_COLOR);
    g.fillRect(width / 2 - 60, 340, 120, 160);

    // House address sign
    this.add.text(width / 2, 52, "1166", {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "14px",
      color: "#ffd700",
      stroke: "#000000",
      strokeThickness: 3
    }).setOrigin(0.5);
  }

  _createDoors() {
    this._doorZones = [];

    DOORS.forEach(d => {
      const g = this.add.graphics();

      // Door frame
      g.fillStyle(DOOR_COLOR);
      g.fillRect(d.x - 30, d.y - 50, 60, 90);

      // Door color accent
      g.fillStyle(d.color);
      g.fillRect(d.x - 24, d.y - 44, 48, 78);

      // Checkmark if completed
      const done = this._completedChapters.includes(d.key);
      if (done) {
        this.add.text(d.x, d.y - 8, "✓", {
          fontFamily: "monospace",
          fontSize: "22px",
          color: "#ffffff"
        }).setOrigin(0.5);
      }

      // Label above door
      this.add.text(d.x, d.y - 64, d.label, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "9px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 3
      }).setOrigin(0.5);

      // Interaction zone
      const zone = this.add.zone(d.x, d.y, 70, 100).setOrigin(0.5);
      this._doorZones.push({ zone, key: d.key, x: d.x, y: d.y });
    });
  }

  _createPlayer(width, height) {
    // Placeholder rectangle player until sprite sheet is ready
    this._player = this.add.rectangle(width / 2, height * 0.72, 24, 36, 0xf5c842)
      .setDepth(10);

    this._cursors = this.input.keyboard.createCursorKeys();
    this._wasd    = this.input.keyboard.addKeys({ up: "W", down: "S", left: "A", right: "D" });
    this._eKey    = this.input.keyboard.addKey("E");
  }

  _createUI(width) {
    this.add.text(width / 2, 16,
      "Walk to a door and press E to enter",
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "9px",
        color: "#ffffff",
        stroke: "#000000",
        strokeThickness: 2
      }
    ).setOrigin(0.5).setScrollFactor(0);
  }

  update() {
    const speed = PLAYER_SPEED;
    const p     = this._player;
    const keys  = this._cursors;
    const wasd  = this._wasd;

    let vx = 0;
    let vy = 0;

    if (keys.left.isDown  || wasd.left.isDown)  vx = -speed;
    if (keys.right.isDown || wasd.right.isDown) vx =  speed;
    if (keys.up.isDown    || wasd.up.isDown)    vy = -speed;
    if (keys.down.isDown  || wasd.down.isDown)  vy =  speed;

    p.x = Phaser.Math.Clamp(p.x + vx * (1 / 60), 20, GAME_WIDTH  - 20);
    p.y = Phaser.Math.Clamp(p.y + vy * (1 / 60), 20, GAME_HEIGHT - 20);

    // Check door proximity + E press
    if (Phaser.Input.Keyboard.JustDown(this._eKey)) {
      this._doorZones.forEach(({ x, y, key }) => {
        const dist = Phaser.Math.Distance.Between(p.x, p.y, x, y);
        if (dist < 70) {
          this.cameras.main.fadeOut(500, 0, 0, 0);
          this.cameras.main.once("camerafadeoutcomplete", () => {
            this.scene.start("ChapterScene", { chapter: key });
          });
        }
      });
    }
  }
}
