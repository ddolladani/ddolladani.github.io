import Phaser from "phaser";

// Launched on top of a chapter scene to reveal a memory as a polaroid
// (image) or a framed video. Music ducks under video and restores after.

export class MemoryScene extends Phaser.Scene {
  constructor() { super({ key: "MemoryScene" }); }

  init(data) {
    this.chapter    = data.chapter;
    this.memIndex   = data.index;
    this.memData    = data.memData;
    this._callerKey = data.callerScene;
  }

  create() {
    const { width, height } = this.scale;

    // dim, slightly warm backdrop
    this.add.rectangle(0, 0, width, height, 0x140f0a, 0.88)
      .setOrigin(0).setInteractive();

    const key = `memory_${this.chapter}_${this.memIndex}`;

    if (this.memData.type === "image") {
      if (!this.textures.exists(key)) {
        this.load.image(key, this.memData.src);
        this.load.once("complete", () => {
          this.textures.exists(key)
            ? this._showImage(width, height, key)
            : this._showPolaroid(width, height, null);
        });
        this.load.once("loaderror", () => this._showPolaroid(width, height, null));
        this.load.start();
      } else {
        this._showImage(width, height, key);
      }
    } else {
      this._showVideo(width, height);
    }

    this.cameras.main.fadeIn(450, 0, 0, 0);
  }

  _showImage(width, height, key) {
    const src  = this.textures.get(key).getSourceImage();
    this._showPolaroid(width, height, { key, w: src.width || 400, h: src.height || 300 });
  }

  // photo === null renders a "coming soon" placeholder in the same frame
  _showPolaroid(width, height, photo) {
    const maxW = width * 0.6;
    const maxH = height * 0.62;
    const iw = photo ? photo.w : 360;
    const ih = photo ? photo.h : 270;
    const scale = Math.min(maxW / iw, maxH / ih);
    const dW = iw * scale;
    const dH = ih * scale;

    const padX = 26, padTop = 22, padBot = 84;
    const frameW = dW + padX * 2;
    const frameH = dH + padTop + padBot;
    const cx = width / 2;
    const cy = height / 2 - 6;
    const fx = cx - frameW / 2;
    const fy = cy - frameH / 2;
    const tilt = Phaser.Math.Between(-3, 3);

    const container = this.add.container(cx, cy).setAlpha(0).setAngle(tilt);

    // drop shadow + paper
    const g = this.add.graphics();
    g.fillStyle(0x000000, 0.45);
    g.fillRoundedRect(-frameW / 2 + 6, -frameH / 2 + 10, frameW, frameH, 6);
    g.fillStyle(0xfffdf5, 1);
    g.fillRoundedRect(-frameW / 2, -frameH / 2, frameW, frameH, 6);
    // photo well
    g.fillStyle(0xe8e2d2, 1);
    g.fillRect(-dW / 2, -frameH / 2 + padTop, dW, dH);
    container.add(g);

    if (photo) {
      const img = this.add.image(0, -frameH / 2 + padTop + dH / 2, photo.key)
        .setDisplaySize(dW, dH);
      container.add(img);
    } else {
      container.add(this.add.text(0, -frameH / 2 + padTop + dH / 2, "photo coming soon", {
        fontFamily: '"Caveat", cursive', fontSize: "26px", color: "#b3ab97"
      }).setOrigin(0.5));
    }

    // caption (handwritten)
    container.add(this.add.text(0, frameH / 2 - padBot / 2 - 4, this.memData.caption, {
      fontFamily: '"Caveat", cursive', fontSize: "26px", fontStyle: "600",
      color: "#3a3326", align: "center", wordWrap: { width: dW }
    }).setOrigin(0.5));

    // date sticker (tape-like, top-right)
    const sticker = this.add.container(frameW / 2 - 30, -frameH / 2 + 6).setAngle(-6);
    const sg = this.add.graphics();
    sg.fillStyle(0xffd56b, 0.95); sg.fillRoundedRect(-52, -15, 104, 30, 4);
    sg.fillStyle(0xffffff, 0.25); sg.fillRoundedRect(-52, -15, 104, 8, 4);
    sticker.add(sg);
    sticker.add(this.add.text(0, 0, this.memData.date, {
      fontFamily: '"Nunito", sans-serif', fontSize: "13px", fontStyle: "800",
      color: "#5a3a14"
    }).setOrigin(0.5));
    container.add(sticker);

    // tape corners
    [[-frameW / 2, -frameH / 2, -18], [frameW / 2, -frameH / 2, 18]].forEach(([tx, ty, a]) => {
      const tape = this.add.rectangle(tx, ty, 54, 20, 0xffffff, 0.4).setAngle(a);
      container.add(tape);
    });

    // entrance
    container.setScale(0.85);
    this.tweens.add({ targets: container, alpha: 1, scale: 1, duration: 450, ease: "Back.easeOut" });

    this._prompt(width, height);
    this._waitForClose();
  }

  _showVideo(width, height) {
    const music = this.sound.get("music_main");
    if (music) this.tweens.add({ targets: music, volume: 0, duration: 500 });

    const maxW = width * 0.74, maxH = height * 0.66;

    const video = document.createElement("video");
    video.src = this.memData.src;
    video.autoplay = true;
    video.playsInline = true;
    video.style.cssText = `
      position: fixed; top: 50%; left: 50%;
      transform: translate(-50%, -56%);
      max-width: ${maxW}px; max-height: ${maxH}px;
      z-index: 100; border: 8px solid #fffdf5; border-radius: 4px;
      box-shadow: 0 16px 50px rgba(0,0,0,0.7);
    `;
    document.body.appendChild(video);
    this._videoEl = video;

    const sticker = document.createElement("div");
    sticker.textContent = this.memData.date;
    sticker.style.cssText = `
      position: fixed; top: calc(50% - ${maxH * 0.5 + 8}px);
      left: calc(50% + ${maxW * 0.28}px); transform: rotate(-6deg);
      background: #ffd56b; padding: 6px 12px; border-radius: 4px;
      font-family: 'Nunito', sans-serif; font-weight: 800; font-size: 14px;
      color: #5a3a14; z-index: 101;
    `;
    document.body.appendChild(sticker);
    this._stickerEl = sticker;

    const caption = document.createElement("div");
    caption.textContent = this.memData.caption;
    caption.style.cssText = `
      position: fixed; top: calc(50% + ${maxH * 0.42}px);
      left: 50%; transform: translateX(-50%);
      font-family: 'Caveat', cursive; font-weight: 600; font-size: 28px;
      color: #fdf3df; text-align: center; z-index: 101; max-width: ${maxW}px;
      text-shadow: 0 2px 8px rgba(0,0,0,0.6);
    `;
    document.body.appendChild(caption);
    this._captionEl = caption;

    this._prompt(width, height);
    this._waitForClose();
  }

  _prompt(width, height) {
    const p = this.add.text(width / 2, height - 34, "Press any key to continue", {
      fontFamily: '"Nunito", sans-serif', fontSize: "14px", fontStyle: "700",
      color: "#cfc6b8"
    }).setOrigin(0.5).setDepth(200);
    this.tweens.add({ targets: p, alpha: 0.3, duration: 800, yoyo: true, repeat: -1 });
  }

  _waitForClose() {
    this.time.delayedCall(650, () => {
      this.input.keyboard.once("keydown", () => this._close());
      this.input.once("pointerdown", () => this._close());
    });
  }

  _close() {
    if (this._videoEl) {
      this._videoEl.pause();
      this._videoEl.remove();
      this._stickerEl?.remove();
      this._captionEl?.remove();
      const music = this.sound.get("music_main");
      if (music) this.tweens.add({ targets: music, volume: 0.5, duration: 900 });
    }
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.stop();
      this.scene.get(this._callerKey)?.events.emit("memory-closed", {
        chapter: this.chapter, index: this.memIndex
      });
    });
  }
}
