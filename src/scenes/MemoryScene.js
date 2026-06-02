import Phaser from "phaser";

// Launched on top of the active chapter/hub scene.
// data: { chapter: "dj"|"danielle"|"together", index: 0-4 }

export class MemoryScene extends Phaser.Scene {
  constructor() {
    super({ key: "MemoryScene" });
  }

  create() {
    const { width, height } = this.scale;

    // Dim overlay
    this.add.rectangle(0, 0, width, height, 0x000000, 0.85)
      .setOrigin(0)
      .setInteractive();

    const key = `memory_${this.chapter}_${this.memIndex}`;

    if (this.memData.type === "image") {
      // Load the image now if not already in the texture cache
      if (!this.textures.exists(key)) {
        this.load.image(key, this.memData.src);
        this.load.once("complete", () => this._showImage(width, height, key));
        this.load.once("loaderror", () => this._showImagePlaceholder(width, height, key));
        this.load.start();
      } else {
        this._showImage(width, height, key);
      }
    } else {
      this._showVideo(width, height);
    }

    this.cameras.main.fadeIn(400, 0, 0, 0);
  }

  _showImagePlaceholder(width, height) {
    const frameW = 400, frameH = 340;
    const frameX = (width - frameW) / 2;
    const frameY = (height - frameH) / 2 - 10;
    const tilt   = Phaser.Math.Between(-3, 3);

    this.add.rectangle(frameX, frameY, frameW, frameH, 0xfffef2).setOrigin(0).setAngle(tilt);
    this.add.text(width / 2, frameY + 100, "[ photo coming soon ]", {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "11px",
      color: "#aaaaaa"
    }).setOrigin(0.5).setAngle(tilt);
    this.add.text(width / 2, frameY + frameH - 40, this.memData.caption, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "11px",
      color: "#555555",
      align: "center",
      wordWrap: { width: 340 }
    }).setOrigin(0.5).setAngle(tilt);

    const stickerBg = this.add.rectangle(frameX + frameW - 30, frameY + 14, 110, 28, 0xffd700)
      .setOrigin(0.5).setAngle(tilt - 4);
    this.add.text(stickerBg.x, stickerBg.y, this.memData.date, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "8px",
      color: "#000000"
    }).setOrigin(0.5).setAngle(tilt - 4);

    this.add.text(width / 2, frameY + frameH + 24, "Press any key to continue", {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "10px",
      color: "#ffffff"
    }).setOrigin(0.5);

    this._waitForClose();
  }

  _showImage(width, height, key) {
    const tex    = this.textures.get(key);
    const src    = tex.getSourceImage();
    const imgW   = src.width  || 400;
    const imgH   = src.height || 300;

    // Polaroid frame sizing
    const maxW   = width  * 0.72;
    const maxH   = height * 0.68;
    const scale  = Math.min(maxW / imgW, maxH / imgH);
    const dW     = imgW * scale;
    const dH     = imgH * scale;

    const padX   = 24;
    const padTop = 18;
    const padBot = 72; // space for caption

    const frameW = dW + padX * 2;
    const frameH = dH + padTop + padBot;
    const frameX = (width  - frameW) / 2;
    const frameY = (height - frameH) / 2 - 10;

    // Polaroid background
    const frame = this.add.rectangle(
      frameX, frameY, frameW, frameH, 0xfffef2
    ).setOrigin(0).setAlpha(0);

    // Slight rotation for charm
    const tilt  = Phaser.Math.Between(-3, 3);
    frame.setAngle(tilt);

    // Photo
    const photo = this.add.image(
      frameX + padX + dW / 2,
      frameY + padTop + dH / 2,
      key
    ).setDisplaySize(dW, dH).setAlpha(0).setAngle(tilt);

    // Caption
    const caption = this.add.text(
      frameX + frameW / 2,
      frameY + padTop + dH + 36,
      this.memData.caption,
      {
        fontFamily: '"Patrick Hand", "Press Start 2P", monospace',
        fontSize: "13px",
        color: "#333333",
        align: "center",
        wordWrap: { width: dW }
      }
    ).setOrigin(0.5, 0).setAlpha(0).setAngle(tilt);

    // Date sticker
    const stickerBg = this.add.rectangle(0, 0, 110, 28, 0xffd700, 1)
      .setOrigin(0.5).setAlpha(0).setAngle(tilt - 4);

    const stickerText = this.add.text(0, 0, this.memData.date, {
      fontFamily: '"Press Start 2P", monospace',
      fontSize: "8px",
      color: "#000000"
    }).setOrigin(0.5).setAlpha(0).setAngle(tilt - 4);

    // Position sticker at top-right corner of frame
    const sx = frameX + frameW - 30;
    const sy = frameY + 14;
    stickerBg.setPosition(sx, sy);
    stickerText.setPosition(sx, sy);

    // Prompt
    const prompt = this.add.text(
      width / 2,
      frameY + frameH + 24,
      "Press any key to continue",
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "10px",
        color: "#ffffff"
      }
    ).setOrigin(0.5).setAlpha(0);

    this.tweens.add({
      targets: [frame, photo, caption, stickerBg, stickerText, prompt],
      alpha: 1,
      duration: 500,
      ease: "Sine.easeOut"
    });

    this._waitForClose();
  }

  _showVideo(width, height) {
    // Fade out game music
    const music = this.sound.get("music_main");
    if (music) {
      this.tweens.add({ targets: music, volume: 0, duration: 500 });
    }

    const maxW  = width  * 0.78;
    const maxH  = height * 0.70;

    // HTML5 video element overlaid on the canvas
    const video = document.createElement("video");
    video.src   = this.memData.src;
    video.controls = false;
    video.autoplay = true;
    video.style.cssText = `
      position: fixed;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -58%);
      max-width: ${maxW}px;
      max-height: ${maxH}px;
      z-index: 100;
      border: 6px solid #fffef2;
      box-shadow: 0 0 40px rgba(0,0,0,0.8);
    `;
    document.body.appendChild(video);
    this._videoEl = video;

    // Date sticker (HTML overlay)
    const sticker = document.createElement("div");
    sticker.textContent = this.memData.date;
    sticker.style.cssText = `
      position: fixed;
      top: calc(50% - ${maxH * 0.5 + 16}px);
      left: calc(50% + ${maxW * 0.3}px);
      transform: rotate(-4deg);
      background: #ffd700;
      padding: 4px 10px;
      font-family: 'Press Start 2P', monospace;
      font-size: 10px;
      color: #000;
      z-index: 101;
    `;
    document.body.appendChild(sticker);
    this._stickerEl = sticker;

    // Caption
    const caption = document.createElement("div");
    caption.textContent = this.memData.caption;
    caption.style.cssText = `
      position: fixed;
      top: calc(50% + ${maxH * 0.5 * 0.62}px);
      left: 50%;
      transform: translateX(-50%);
      font-family: 'Press Start 2P', monospace;
      font-size: 12px;
      color: #ffffff;
      text-align: center;
      z-index: 101;
      max-width: ${maxW}px;
    `;
    document.body.appendChild(caption);
    this._captionEl = caption;

    const prompt = this.add.text(width / 2, height * 0.94,
      "Press any key to continue",
      {
        fontFamily: '"Press Start 2P", monospace',
        fontSize: "10px",
        color: "#aaaaaa"
      }
    ).setOrigin(0.5);

    this.tweens.add({ targets: prompt, alpha: 0, duration: 600, yoyo: true, repeat: -1 });

    this._waitForClose();
  }

  _waitForClose() {
    this.time.delayedCall(600, () => {
      this.input.keyboard.once("keydown", () => this._close());
      this.input.once("pointerdown", () => this._close());
    });
  }

  _close() {
    // Clean up video DOM elements if present
    if (this._videoEl) {
      this._videoEl.pause();
      this._videoEl.remove();
      this._stickerEl?.remove();
      this._captionEl?.remove();

      // Restore music
      const music = this.sound.get("music_main");
      if (music) {
        this.tweens.add({ targets: music, volume: 0.5, duration: 800 });
      }
    }

    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.stop();
      // Notify the calling scene that this memory is done
      this.scene.get(this._callerKey)?.events.emit("memory-closed", {
        chapter: this.chapter,
        index: this.memIndex
      });
    });
  }

  init(data) {
    this.chapter    = data.chapter;
    this.memIndex   = data.index;
    this.memData    = data.memData;
    this._callerKey = data.callerScene;
  }
}
