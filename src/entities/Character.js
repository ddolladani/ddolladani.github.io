import Phaser from "phaser";

// A friendly, illustrated little character: a drawn body with Dad's real head
// (a transparent cutout PNG) on top. The body flips left/right and does a bouncy
// walk cycle; the head is always forward-facing (it lives outside the flip
// wrapper, so it never mirrors or turns around) for a fun bobblehead look.

const SKIN   = 0xc68a55;
const SKIN_D = 0x9c6a3d;
const HAIR   = 0x241a14;
const SHIRT  = 0x7c2736;  // burgundy (his recurring color)
const SHIRT_D= 0x5c1c28;
const PANTS  = 0x2f3640;
const PANTS_D= 0x232931;
const SHOE   = 0x222222;
const GLASS  = 0x141414;  // thick black frames

const HEAD_KEY = "dad_head";
const HEAD_H   = 74;       // displayed head height (big, bobblehead-style)
const HEAD_Y   = -80;      // head rest position above the body

export class Character {
  constructor(scene, x, y, opts = {}) {
    this.scene = scene;
    this.scaleBase = opts.scale ?? 1;

    // root container (position lives here)
    this.root = scene.add.container(x, y).setDepth(opts.depth ?? 50);

    // shadow (not flipped, not bobbed)
    this.shadow = scene.add.ellipse(0, 2, 40, 12, 0x000000, 0.22);
    this.root.add(this.shadow);

    // flip wrapper (scaleX flips horizontally for left-facing) — body only
    this.flip = scene.add.container(0, 0);
    this.root.add(this.flip);

    // bob wrapper (whole body bounces while walking)
    this.bob = scene.add.container(0, 0);
    this.flip.add(this.bob);

    this._build();

    this.root.setScale(this.scaleBase);

    this.phase = 0;
    this.moving = false;
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

    // head — Dad's real cutout, forward-facing, on TOP of the body (added to
    // root, not the flip wrapper, so it never mirrors or turns away).
    this.head = this.scene.add.container(0, HEAD_Y);
    if (this.scene.textures.exists(HEAD_KEY)) {
      const src = this.scene.textures.get(HEAD_KEY).getSourceImage();
      const w = HEAD_H * ((src.width || 3) / (src.height || 4));
      // soft contact shadow so the head doesn't look pasted on
      const sh = this.scene.add.ellipse(0, HEAD_H * 0.42, w * 0.7, 8, 0x000000, 0.18);
      this.head.add(sh);
      this.head.add(this.scene.add.image(0, 0, HEAD_KEY).setDisplaySize(w, HEAD_H));
    } else {
      this._buildDrawnHead();
    }
    this.root.add(this.head);
  }

  // Fallback head if the cutout PNG isn't available — a simple forward-facing
  // drawn head styled to resemble Dad.
  _buildDrawnHead() {
    const g = this.scene.add.graphics();
    g.fillStyle(SKIN_D, 1); g.fillRect(-7, 22, 14, 12);   // neck
    g.fillStyle(SKIN, 1);   g.fillCircle(0, 0, 26);        // face
    g.fillStyle(HAIR, 1);                                  // hair cap
    g.slice(0, 0, 27, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false); g.fillPath();
    g.fillRect(-27, -2, 54, 6);
    // glasses
    g.fillStyle(0x9fb4c4, 0.18); g.fillRect(-17, -8, 15, 12); g.fillRect(2, -8, 15, 12);
    g.lineStyle(3, GLASS, 1); g.strokeRect(-17, -8, 15, 12); g.strokeRect(2, -8, 15, 12);
    g.lineBetween(-2, -3, 2, -3);
    // mouth
    g.lineStyle(2, 0x4a2f28, 1);
    g.beginPath(); g.arc(0, 9, 6, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160)); g.strokePath();
    this.head.add(g);
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

    // Horizontal facing of the BODY only (the head stays forward).
    if (Math.abs(vx) > DEAD) this.facing = vx < 0 ? -1 : 1;

    // Ease the horizontal flip toward the target so quick direction changes
    // read as a turn instead of an instant mirror snap.
    const flipLerp = 1 - Math.pow(0.001, dt / 1000);
    this.facingVisual += (this.facing - this.facingVisual) * flipLerp;
    // keep a minimum width so the body never fully collapses mid-turn
    this.flip.scaleX = Math.abs(this.facingVisual) < 0.12
      ? Math.sign(this.facingVisual || this.facing) * 0.12
      : this.facingVisual;

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
      this.head.rotation = s * 0.03;            // gentle bobblehead wobble
      this.head.y = HEAD_Y + this.bob.y;
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
      this.head.y = HEAD_Y + this.bob.y + Math.sin(this.scene.time.now / 600) * 0.6;
    }
  }
}
