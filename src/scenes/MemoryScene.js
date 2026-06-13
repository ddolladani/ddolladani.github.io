import Phaser from "phaser";
import { getStoredVolume } from "../ui/settings.js";

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

    this._closing = false;   // guards against _close() running twice
    this._rendered = false;  // guards against the content rendering twice

    // Make sure DOM/video cleanup always runs, even if the scene is torn
    // down by something other than our own _close() (e.g. a chapter change).
    this.events.once("shutdown", () => this._cleanupDom());

    // dim, slightly warm backdrop
    this.add.rectangle(0, 0, width, height, 0x140f0a, 0.88)
      .setOrigin(0).setInteractive();

    const key = `memory_${this.chapter}_${this.memIndex}`;
    const secKey = this.memData.secondary ? `${key}_b` : null;

    if (this.memData.type === "image") {
      // Queue whatever isn't already loaded (the main photo and, if present,
      // the secondary corner photo) and render once after a single "complete".
      const toLoad = [];
      if (!this.textures.exists(key)) toLoad.push([key, this.memData.src]);
      if (secKey && !this.textures.exists(secKey)) toLoad.push([secKey, this.memData.secondary]);

      if (toLoad.length) {
        // The loader's "complete" fires once whether files loaded or errored,
        // so we render from that single event and decide based on whether the
        // texture actually exists. (Listening to "loaderror" separately caused
        // the polaroid to render twice on placeholders.)
        toLoad.forEach(([k, s]) => this.load.image(k, s));
        this.load.once("complete", () => {
          this.textures.exists(key)
            ? this._showImage(width, height, key, secKey)
            : this._showPolaroid(width, height, null, secKey);
        });
        this.load.start();
      } else {
        this._showImage(width, height, key, secKey);
      }
    } else {
      this._showVideo(width, height);
    }

    this.cameras.main.fadeIn(450, 0, 0, 0);
  }

  _showImage(width, height, key, secKey) {
    const src  = this.textures.get(key).getSourceImage();
    this._showPolaroid(width, height, { key, w: src.width || 400, h: src.height || 300 }, secKey);
  }

  // photo === null renders a "coming soon" placeholder in the same frame.
  // secKey (optional) is a second photo tucked into the corner as a mini inset.
  _showPolaroid(width, height, photo, secKey) {
    if (this._rendered) return;   // never render the content twice
    this._rendered = true;
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

    // secondary photo — a smaller "snapshot" tucked into the bottom-right corner
    if (secKey && this.textures.exists(secKey)) {
      const ssrc = this.textures.get(secKey).getSourceImage();
      const sar = (ssrc.width || 4) / (ssrc.height || 3);
      const insetW = Math.min(dW * 0.36, 160);
      const insetH = insetW / sar;
      const bw = 8;                              // little white border
      const photoBottom = -frameH / 2 + padTop + dH;
      const ix = dW / 2 - insetW / 2 - 8;
      const iy = photoBottom - insetH / 2 - 8;
      const inset = this.add.container(ix, iy).setAngle(Phaser.Math.Between(-6, -3));
      const ig = this.add.graphics();
      ig.fillStyle(0x000000, 0.4);
      ig.fillRoundedRect(-insetW / 2 - bw + 3, -insetH / 2 - bw + 4, insetW + bw * 2, insetH + bw * 2, 3);
      ig.fillStyle(0xfffdf5, 1);
      ig.fillRoundedRect(-insetW / 2 - bw, -insetH / 2 - bw, insetW + bw * 2, insetH + bw * 2, 3);
      inset.add(ig);
      inset.add(this.add.image(0, 0, secKey).setDisplaySize(insetW, insetH));
      container.add(inset);
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
    if (this._rendered) return;   // never render the content twice
    this._rendered = true;
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

    // secondary photo — a taped snapshot in the bottom-left corner of the video
    if (this.memData.secondary) {
      const inset = document.createElement("img");
      inset.src = this.memData.secondary;
      inset.style.cssText = `
        position: fixed; top: calc(50% + ${maxH * 0.5 - 104}px);
        left: calc(50% - ${maxW * 0.5 - 14}px);
        width: ${Math.min(maxW * 0.24, 150)}px; transform: rotate(-5deg);
        border: 6px solid #fffdf5; border-radius: 3px;
        box-shadow: 0 10px 26px rgba(0,0,0,0.65); z-index: 102;
      `;
      document.body.appendChild(inset);
      this._insetEl = inset;
    }

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
    if (this._closing) return;   // ignore a second key/pointer press
    this._closing = true;

    this._cleanupDom();
    this.cameras.main.fadeOut(400, 0, 0, 0);
    this.cameras.main.once("camerafadeoutcomplete", () => {
      this.scene.stop();
      this.scene.get(this._callerKey)?.events.emit("memory-closed", {
        chapter: this.chapter, index: this.memIndex
      });
    });
  }

  // Tears down any DOM the video memory created and restores the music.
  // Safe to call more than once (refs are nulled after removal).
  _cleanupDom() {
    if (!this._videoEl) return;
    this._videoEl.pause();
    this._videoEl.remove();
    this._stickerEl?.remove();
    this._captionEl?.remove();
    this._insetEl?.remove();
    this._videoEl = this._stickerEl = this._captionEl = this._insetEl = null;
    const music = this.sound.get("music_main");
    if (music) this.tweens.add({ targets: music, volume: getStoredVolume(), duration: 900 });
  }
}
