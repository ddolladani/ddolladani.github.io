import Phaser from "phaser";
import { ensureDadHead } from "./avatarHead.js";

// A friendly, illustrated little character drawn entirely with graphics.
// Supports left/right facing (horizontal flip), a "facing away" pose when
// walking up, a bouncy walk cycle, and a soft ground shadow.

// Styled to resemble Dad: warm medium-brown skin, short dark textured hair,
// his signature thick black rectangular glasses, and a burgundy shirt.
const SKIN   = 0xc68a55;
const SKIN_D = 0x9c6a3d;
const HAIR   = 0x241a14;
const SHIRT  = 0x7c2736;  // burgundy (his recurring color)
const SHIRT_D= 0x5c1c28;
const PANTS  = 0x2f3640;
const PANTS_D= 0x232931;
const SHOE   = 0x222222;
const GLASS  = 0x141414;  // thick black frames

export class Character {
  constructor(scene, x, y, opts = {}) {
    this.scene = scene;
    this.scaleBase = opts.scale ?? 1;

    // root container (position lives here)
    this.root = scene.add.container(x, y).setDepth(opts.depth ?? 50);

    // shadow (not flipped, not bobbed)
    this.shadow = scene.add.ellipse(0, 2, 40, 12, 0x000000, 0.22);
    this.root.add(this.shadow);

    // flip wrapper (scaleX flips horizontally for left-facing)
    this.flip = scene.add.container(0, 0);
    this.root.add(this.flip);

    // bob wrapper (whole body bounces while walking)
    this.bob = scene.add.container(0, 0);
    this.flip.add(this.bob);

    this._build();

    this.root.setScale(this.scaleBase);

    this.phase = 0;
    this.moving = false;
    this.facingUp = false;
    this.facing = 1;        // target facing: 1 = right, -1 = left
    this.facingVisual = 1;  // smoothed flip, eases toward `facing`
  }

  _build() {
    // back leg
    this.backLeg = this.scene.add.container(-6, -18);
    this.backLeg.add(this._leg(PANTS_D, 0x1f1f1f));
    this.bob.add(this.backLeg);

    // back arm
    this.backArm = this.scene.add.container(-11, -46);
    this.backArm.add(this._arm(SHIRT_D));
    this.bob.add(this.backArm);

    // torso (taller, narrower — more adult proportions)
    const torso = this.scene.add.graphics();
    torso.fillStyle(SHIRT_D, 1); torso.fillRoundedRect(-12, -50, 24, 42, 9);
    torso.fillStyle(SHIRT, 1);   torso.fillRoundedRect(-12, -50, 18, 42, 9);
    torso.fillStyle(0xffffff, 0.10); torso.fillRoundedRect(-10, -48, 7, 34, 6);
    this.bob.add(torso);

    // front leg
    this.frontLeg = this.scene.add.container(6, -18);
    this.frontLeg.add(this._leg(PANTS, SHOE));
    this.bob.add(this.frontLeg);

    // front arm
    this.frontArm = this.scene.add.container(11, -46);
    this.frontArm.add(this._arm(SHIRT));
    this.bob.add(this.frontArm);

    // head — oversized for a fun bobblehead look (his real face, large on the body)
    this.head = this.scene.add.container(0, -64);
    // `frontParts` are hidden when walking away; backHair shows instead.
    this.frontParts = [];

    const headKey = ensureDadHead(this.scene);
    if (headKey) this._buildPhotoHead(headKey);
    else this._buildDrawnHead();

    // back-of-head hair (shown when facing up) — shared by both head styles
    this.backHair = this.scene.add.graphics();
    this.backHair.fillStyle(HAIR, 1);
    this.backHair.fillCircle(0, -6, 19);
    [[-13, -19], [-5, -23], [5, -23], [13, -19], [0, -22]]
      .forEach(([cx, cy]) => this.backHair.fillCircle(cx, cy, 5));
    this.backHair.setVisible(false);
    this.head.add(this.backHair);

    this.bob.add(this.head);
  }

  // Dad's real face, circular-masked, on top of the drawn body.
  _buildPhotoHead(headKey) {
    const neck = this.scene.add.graphics();
    neck.fillStyle(SKIN_D, 1); neck.fillRect(-4.5, 6, 9, 10);
    this.head.add(neck);

    const shadow = this.scene.add.graphics();
    shadow.fillStyle(0x000000, 0.18); shadow.fillCircle(0.7, -4, 20);
    this.head.add(shadow);

    const photo = this.scene.add.image(0, -5, headKey).setDisplaySize(40, 40);
    this.head.add(photo);

    const ring = this.scene.add.graphics();
    ring.lineStyle(2, 0x2a1f18, 0.55); ring.strokeCircle(0, -5, 20);
    this.head.add(ring);

    this.frontParts.push(photo, shadow, ring);
  }

  // Fallback: the friendly drawn head styled to resemble Dad.
  _buildDrawnHead() {
    const hg = this.scene.add.graphics();
    hg.fillStyle(SKIN_D, 1); hg.fillRect(-3.5, 3, 7, 7);
    hg.fillStyle(SKIN, 1); hg.fillCircle(0, -4, 11);
    hg.fillStyle(SKIN_D, 0.3); hg.fillCircle(4, -2, 9);
    hg.fillStyle(HAIR, 1);
    hg.slice(0, -4, 12, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
    hg.fillPath();
    hg.fillRect(-12, -6, 24, 4);
    [[-8, -12], [-3, -15], [3, -15], [8, -12], [0, -14]]
      .forEach(([cx, cy]) => hg.fillCircle(cx, cy, 3.2));
    this.head.add(hg);
    this.frontParts.push(hg);

    const face = this.scene.add.graphics();
    face.fillStyle(0x2a2438, 1);
    face.fillCircle(-4, -3, 1.5);
    face.fillCircle(4, -3, 1.5);
    face.fillStyle(0x9fb4c4, 0.16);
    face.fillRect(-7.6, -5.6, 6.8, 5.2);
    face.fillRect(0.8, -5.6, 6.8, 5.2);
    face.lineStyle(1.4, GLASS, 1);
    face.strokeRect(-7.6, -5.6, 6.8, 5.2);
    face.strokeRect(0.8, -5.6, 6.8, 5.2);
    face.lineBetween(-0.8, -3.4, 0.8, -3.4);
    face.lineBetween(-7.6, -4.8, -10.5, -5.2);
    face.lineBetween(7.6, -4.8, 10.5, -5.2);
    face.fillStyle(0x241a14, 0.5);
    face.fillEllipse(0, 0.4, 6.5, 1.7);
    face.lineStyle(1.4, 0x4a2f28, 1);
    face.beginPath();
    face.arc(0, 1.6, 3.1, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160));
    face.strokePath();
    face.fillStyle(0xd98a6a, 0.28);
    face.fillCircle(-6.5, 1, 1.8);
    face.fillCircle(6.5, 1, 1.8);
    this.head.add(face);
    this.frontParts.push(face);
  }

  _leg(col, shoe) {
    const g = this.scene.add.graphics();
    g.fillStyle(col, 1); g.fillRoundedRect(-4, 0, 8, 22, 4);
    g.fillStyle(shoe, 1); g.fillRoundedRect(-5, 18, 11, 7, 3);
    return g;
  }

  _arm(col) {
    const g = this.scene.add.graphics();
    g.fillStyle(col, 1); g.fillRoundedRect(-3.5, 0, 7, 22, 3.5);
    g.fillStyle(SKIN, 1); g.fillCircle(0, 22, 3.5);
    return g;
  }

  get x() { return this.root.x; }
  get y() { return this.root.y; }
  setPosition(x, y) { this.root.setPosition(x, y); return this; }
  setDepth(d) { this.root.setDepth(d); return this; }

  // vx, vy are the current velocity components (px/s); dt in ms
  update(vx, vy, dt) {
    const speed = Math.hypot(vx, vy);
    this.moving = speed > 1;
    const DEAD = 1; // ignore sub-pixel jitter

    // Horizontal facing: only update when there's real horizontal input,
    // otherwise keep the last facing (so pure up/down doesn't reset it).
    if (Math.abs(vx) > DEAD) this.facing = vx < 0 ? -1 : 1;

    // Show the back-of-head pose only when movement is clearly upward —
    // a diagonal (up + sideways) keeps the side/front view so it doesn't
    // flicker to the back when vx and vy are equal.
    this.facingUp = vy < -DEAD && Math.abs(vy) > Math.abs(vx) * 1.3;

    // Ease the horizontal flip toward the target so quick direction changes
    // read as a turn instead of an instant mirror snap.
    const flipLerp = 1 - Math.pow(0.001, dt / 1000);
    this.facingVisual += (this.facing - this.facingVisual) * flipLerp;
    // keep a minimum width so the body never fully collapses mid-turn
    this.flip.scaleX = Math.abs(this.facingVisual) < 0.12
      ? Math.sign(this.facingVisual || this.facing) * 0.12
      : this.facingVisual;

    // facing-away pose: hide the front of the head, show the back hair
    for (const p of this.frontParts) p.setVisible(!this.facingUp);
    this.backHair.setVisible(this.facingUp);

    if (this.moving) {
      this.phase += (dt / 1000) * 9;
      const s = Math.sin(this.phase);
      const c = Math.cos(this.phase);
      this.frontLeg.y = -18 + Math.max(0, s) * 3;
      this.backLeg.y  = -18 + Math.max(0, -s) * 3;
      this.frontLeg.rotation =  s * 0.5;
      this.backLeg.rotation  = -s * 0.5;
      this.frontArm.rotation = -s * 0.6;
      this.backArm.rotation  =  s * 0.6;
      this.bob.y = -Math.abs(c) * 2.5;
      this.head.rotation = s * 0.04;
    } else {
      // ease back to rest
      const ease = (v, t) => v + (t - v) * 0.2;
      this.frontLeg.rotation = ease(this.frontLeg.rotation, 0);
      this.backLeg.rotation  = ease(this.backLeg.rotation, 0);
      this.frontArm.rotation = ease(this.frontArm.rotation, 0);
      this.backArm.rotation  = ease(this.backArm.rotation, 0);
      this.frontLeg.y = ease(this.frontLeg.y, -18);
      this.backLeg.y  = ease(this.backLeg.y, -18);
      this.bob.y = ease(this.bob.y, 0);
      this.head.rotation = ease(this.head.rotation, 0);
      // gentle idle breathing
      this.head.y = -64 + Math.sin(this.scene.time.now / 600) * 0.6;
    }
  }
}
