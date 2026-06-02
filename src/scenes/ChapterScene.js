import Phaser from "phaser";
import { GAME_WIDTH, GAME_HEIGHT, PLAYER_SPEED, CHAPTERS } from "../config/gameConfig.js";
import { memories } from "../config/memories.js";

const MEMORY_RADIUS = 55;

// Layout of memory spots per chapter (x, y positions on the map)
const SPOT_LAYOUTS = {
  dj: [
    { x: 160, y: 180 }, { x: 380, y: 120 }, { x: 600, y: 200 },
    { x: 260, y: 380 }, { x: 720, y: 380 }
  ],
  danielle: [
    { x: 180, y: 200 }, { x: 420, y: 140 }, { x: 660, y: 200 },
    { x: 300, y: 400 }, { x: 700, y: 410 }
  ],
  together: [
    { x: 140, y: 160 }, { x: 380, y: 100 }, { x: 640, y: 160 },
    { x: 240, y: 420 }, { x: 740, y: 420 }
  ]
};

// Chapter background colors (placeholder until tilesets are ready)
const BG_COLORS = {
  dj:       0x1a2a4a,
  danielle: 0x2a1a3a,
  together: 0x1a3a2a
};

export class ChapterScene extends Phaser.Scene {
  constructor() {
    super({ key: "ChapterScene" });
  }

  init(data) {
    this.chapterKey  = data.chapter;
    this.chapterData = CHAPTERS[data.chapter];
    this._found      = new Set(this.registry.get(`found_${data.chapter}`) || []);
  }

  create() {
    const { width, height } = this.scale;

    this._drawBackground(width, height);
    this._createMemorySpots();
    this._createPlayer(width, height);
    this._createUI(width);

    this.cameras.main.fadeIn(600, 0, 0, 0);

    // When MemoryScene closes, mark memory found
    this.events.on("memory-closed", ({ chapter, index }) => {
      this._found.add(index);
      this.registry.set(`found_${chapter}`, [...this._found]);
      this._updateSpots();
      this._checkComplete();
    });

    this._eKey = this.input.keyboard.addKey("E");
    this._backKey = this.input.keyboard.addKey("ESC");
  }

  _drawBackground(width, height) {
    const g = this.add.graphics();
    g.fillStyle(BG_COLORS[this.chapterKey]);
    g.fillRect(0, 0, width, height);

    // Decorative ground
    g.fillStyle(0x2d4a2d);
    g.fillRect(0, height * 0.78, width, height * 0.22);

    // Chapter title banner
    g.fillStyle(0x000000, 0.5);
    g.fillRect(0, 0, width, 44);
  }

  _createMemorySpots() {
    const spots  = SPOT_LAYOUTS[this.chapterKey];
    const mems   = memories[this.chapterKey];
    this._spots  = [];

    spots.forEach((pos, i) => {
      const found = this._found.has(i);
      const color = found ? 0x888888 : this.chapterData.color;

      // Glow ring
      const ring = this.add.circle(pos.x, pos.y, 28, color, 0.3);

      // Icon circle
      const dot = this.add.circle(pos.x, pos.y, 14, color, found ? 0.4 : 1);

      // Number label
      const label = this.add.text(pos.x, pos.y, found ? "✓" : `${i + 1}`, {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "10px",
        color: "#ffffff"
      }).setOrigin(0.5);

      if (!found) {
        // Pulse animation
        this.tweens.add({
          targets: ring,
          scaleX: 1.4, scaleY: 1.4,
          alpha: 0,
          duration: 1200,
          repeat: -1,
          ease: "Sine.easeOut"
        });
      }

      this._spots.push({ x: pos.x, y: pos.y, i, ring, dot, label, memData: mems[i] });
    });
  }

  _createPlayer(width, height) {
    this._player = this.add.rectangle(width / 2, height * 0.6, 24, 36, 0xf5c842)
      .setDepth(10);

    this._cursors = this.input.keyboard.createCursorKeys();
    this._wasd    = this.input.keyboard.addKeys({ up: "W", down: "S", left: "A", right: "D" });
  }

  _createUI(width) {
    // Chapter title
    this.add.text(width / 2, 22,
      `Chapter: ${this.chapterData.label}`,
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "12px",
        color: "#ffffff"
      }
    ).setOrigin(0.5).setScrollFactor(0);

    // Progress counter
    this._progressText = this.add.text(width - 12, 22,
      `${this._found.size} / 5`,
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "10px",
        color: "#ffffff"
      }
    ).setOrigin(1, 0.5).setScrollFactor(0);

    // Back hint
    this.add.text(12, 22, "ESC = back", {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "8px",
      color: "#888888"
    }).setOrigin(0, 0.5).setScrollFactor(0);
  }

  _updateSpots() {
    this._spots.forEach(s => {
      if (this._found.has(s.i)) {
        s.dot.setFillStyle(0x888888, 0.4);
        s.label.setText("✓");
        s.ring.setFillStyle(0x888888, 0.1);
      }
    });
    this._progressText.setText(`${this._found.size} / 5`);
  }

  _checkComplete() {
    if (this._found.size >= 5) {
      // Mark chapter complete
      const completed = this.registry.get("completedChapters") || [];
      if (!completed.includes(this.chapterKey)) {
        completed.push(this.chapterKey);
        this.registry.set("completedChapters", completed);
      }

      this.time.delayedCall(800, () => {
        if (completed.length >= 3) {
          this.cameras.main.fadeOut(600, 0, 0, 0);
          this.cameras.main.once("camerafadeoutcomplete", () => {
            this.scene.start("EndingScene");
          });
        } else {
          this.cameras.main.fadeOut(600, 0, 0, 0);
          this.cameras.main.once("camerafadeoutcomplete", () => {
            this.scene.start("HubScene");
          });
        }
      });
    }
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

    // Interact
    if (Phaser.Input.Keyboard.JustDown(this._eKey)) {
      for (const s of this._spots) {
        if (this._found.has(s.i)) continue;
        const dist = Phaser.Math.Distance.Between(p.x, p.y, s.x, s.y);
        if (dist < MEMORY_RADIUS) {
          this.input.keyboard.resetKeys();
          this.scene.launch("MemoryScene", {
            chapter:     this.chapterKey,
            index:       s.i,
            memData:     s.memData,
            callerScene: "ChapterScene"
          });
          break;
        }
      }
    }

    // Back to hub
    if (Phaser.Input.Keyboard.JustDown(this._backKey)) {
      this.cameras.main.fadeOut(400, 0, 0, 0);
      this.cameras.main.once("camerafadeoutcomplete", () => {
        this.scene.start("HubScene");
      });
    }
  }
}
