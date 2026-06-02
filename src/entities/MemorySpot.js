import Phaser from "phaser";
import { ensureGlowTexture } from "../art/effects.js";

// A floating, glowing framed "memory" the player walks up to and opens.
// Looks like a little golden picture frame / locket hovering above a pedestal
// of light. Bobs gently and pulses until collected, then dims with a check.

export class MemorySpot {
  constructor(scene, x, y, index, accent) {
    this.scene = scene;
    this.x = x;
    this.y = y;
    this.index = index;
    this.accent = accent;
    this.found = false;

    this.root = scene.add.container(x, y).setDepth(40);

    const key = ensureGlowTexture(scene);

    // light pool on the ground
    this.pool = scene.add.image(0, 18, key).setScale(1.6)
      .setTint(accent).setAlpha(0.35).setBlendMode(Phaser.BlendModes.ADD);

    // big soft glow halo
    this.glow = scene.add.image(0, -18, key).setScale(2.0)
      .setTint(accent).setAlpha(0.4).setBlendMode(Phaser.BlendModes.ADD);

    // floating frame
    this.frame = scene.add.container(0, -18);
    const g = scene.add.graphics();
    g.fillStyle(0x000000, 0.2); g.fillRoundedRect(-17, -19, 34, 42, 6);
    g.fillStyle(0xffd56b, 1);   g.fillRoundedRect(-18, -20, 34, 42, 6);   // gold frame
    g.fillStyle(0xe0a93c, 1);   g.fillRoundedRect(-15, -17, 28, 36, 4);   // inner bevel
    g.fillStyle(0xfff8ec, 1);   g.fillRoundedRect(-13, -15, 24, 32, 3);   // photo mat
    this.frame.add(g);

    // little heart on the mat
    const heart = scene.add.text(0, 0, "♥", {
      fontFamily: "sans-serif", fontSize: "16px", color: "#e86a8c"
    }).setOrigin(0.5);
    this.frame.add(heart);

    // number badge
    this.badge = scene.add.container(14, -34);
    const bg = scene.add.graphics();
    bg.fillStyle(0x2a2438, 0.9); bg.fillCircle(0, 0, 10);
    bg.lineStyle(2, accent, 1);  bg.strokeCircle(0, 0, 10);
    this.badgeLabel = scene.add.text(0, 0, `${index + 1}`, {
      fontFamily: '"Fredoka", sans-serif', fontSize: "12px",
      fontStyle: "700", color: "#ffffff"
    }).setOrigin(0.5);
    this.badge.add([bg, this.badgeLabel]);

    this.root.add([this.pool, this.glow, this.frame, this.badge]);

    // float + pulse
    this.bobTween = scene.tweens.add({
      targets: this.frame, y: -28,
      duration: 1600, yoyo: true, repeat: -1, ease: "Sine.easeInOut"
    });
    this.glowTween = scene.tweens.add({
      targets: this.glow, scale: 2.5, alpha: 0.6,
      duration: 1400, yoyo: true, repeat: -1, ease: "Sine.easeInOut"
    });
    this.frame.setAngle(-3);
    scene.tweens.add({
      targets: this.frame, angle: 3,
      duration: 2400, yoyo: true, repeat: -1, ease: "Sine.easeInOut"
    });
  }

  distanceTo(px, py) {
    return Phaser.Math.Distance.Between(this.x, this.y, px, py);
  }

  markFound() {
    if (this.found) return;
    this.found = true;
    this.bobTween?.stop();
    this.glowTween?.stop();
    this.scene.tweens.add({ targets: this.glow, alpha: 0.08, scale: 1.4, duration: 400 });
    this.scene.tweens.add({ targets: this.pool, alpha: 0.12, duration: 400 });
    this.frame.setAngle(0);
    this.badgeLabel.setText("✓");
    this.frame.setAlpha(0.55);
  }
}
