import Phaser from "phaser";

// A friendly, illustrated little character drawn entirely with graphics.
// Supports left/right facing (horizontal flip), a "facing away" pose when
// walking up, a bouncy walk cycle, and a soft ground shadow.

const SKIN   = 0xf0c19b;
const SKIN_D = 0xd9a47c;
const HAIR   = 0x3a2a20;
const SHIRT  = 0x4a86c4;
const SHIRT_D= 0x396a9c;
const PANTS  = 0x394452;
const PANTS_D= 0x2a323d;
const SHOE   = 0x2a2a2a;

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
    this.facing = 1; // 1 = right, -1 = left
  }

  _build() {
    // back leg
    this.backLeg = this.scene.add.container(-5, -14);
    this.backLeg.add(this._leg(PANTS_D, 0x222));
    this.bob.add(this.backLeg);

    // back arm
    this.backArm = this.scene.add.container(-9, -34);
    this.backArm.add(this._arm(SHIRT_D));
    this.bob.add(this.backArm);

    // torso
    const torso = this.scene.add.graphics();
    torso.fillStyle(SHIRT_D, 1); torso.fillRoundedRect(-12, -38, 24, 30, 8);
    torso.fillStyle(SHIRT, 1);   torso.fillRoundedRect(-12, -38, 18, 30, 8);
    torso.fillStyle(0xffffff, 0.12); torso.fillRoundedRect(-10, -36, 8, 24, 6);
    this.bob.add(torso);

    // front leg
    this.frontLeg = this.scene.add.container(5, -14);
    this.frontLeg.add(this._leg(PANTS, SHOE));
    this.bob.add(this.frontLeg);

    // front arm
    this.frontArm = this.scene.add.container(9, -34);
    this.frontArm.add(this._arm(SHIRT));
    this.bob.add(this.frontArm);

    // head
    this.head = this.scene.add.container(0, -46);
    const hg = this.scene.add.graphics();
    // neck
    hg.fillStyle(SKIN_D, 1); hg.fillRect(-4, 4, 8, 6);
    // face
    hg.fillStyle(SKIN, 1); hg.fillCircle(0, -4, 13);
    hg.fillStyle(SKIN_D, 0.35); hg.fillCircle(4, -2, 11);
    // hair cap
    hg.fillStyle(HAIR, 1);
    hg.slice(0, -4, 14, Phaser.Math.DegToRad(180), Phaser.Math.DegToRad(360), false);
    hg.fillPath();
    hg.fillRect(-14, -6, 28, 4);
    this.head.add(hg);

    // face features (hidden when facing up)
    this.face = this.scene.add.graphics();
    this.face.fillStyle(0x2a2438, 1);
    this.face.fillCircle(-4, -4, 1.8);
    this.face.fillCircle(5, -4, 1.8);
    this.face.lineStyle(1.6, 0x2a2438, 1);
    this.face.beginPath();
    this.face.arc(0.5, 0, 4, Phaser.Math.DegToRad(20), Phaser.Math.DegToRad(160));
    this.face.strokePath();
    // rosy cheeks
    this.face.fillStyle(0xff9e9e, 0.5);
    this.face.fillCircle(-7, 0, 2.4);
    this.face.fillCircle(8, 0, 2.4);
    this.head.add(this.face);

    // back-of-head hair (shown when facing up)
    this.backHair = this.scene.add.graphics();
    this.backHair.fillStyle(HAIR, 1);
    this.backHair.fillCircle(0, -4, 13);
    this.backHair.setVisible(false);
    this.head.add(this.backHair);

    this.bob.add(this.head);
  }

  _leg(col, shoe) {
    const g = this.scene.add.graphics();
    g.fillStyle(col, 1); g.fillRoundedRect(-4, 0, 8, 18, 4);
    g.fillStyle(shoe, 1); g.fillRoundedRect(-5, 14, 11, 7, 3);
    return g;
  }

  _arm(col) {
    const g = this.scene.add.graphics();
    g.fillStyle(col, 1); g.fillRoundedRect(-3.5, 0, 7, 18, 3.5);
    g.fillStyle(SKIN, 1); g.fillCircle(0, 18, 3.5);
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

    if (Math.abs(vx) > 0.1) {
      this.facing = vx < 0 ? -1 : 1;
    }
    this.facingUp = vy < -0.1 && Math.abs(vy) >= Math.abs(vx);

    // apply horizontal flip smoothly
    this.flip.scaleX = this.facing;

    // facing-away pose
    this.face.setVisible(!this.facingUp);
    this.backHair.setVisible(this.facingUp);

    if (this.moving) {
      this.phase += (dt / 1000) * 9;
      const s = Math.sin(this.phase);
      const c = Math.cos(this.phase);
      this.frontLeg.y = -14 + Math.max(0, s) * 3;
      this.backLeg.y  = -14 + Math.max(0, -s) * 3;
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
      this.frontLeg.y = ease(this.frontLeg.y, -14);
      this.backLeg.y  = ease(this.backLeg.y, -14);
      this.bob.y = ease(this.bob.y, 0);
      // gentle idle breathing
      this.head.y = -46 + Math.sin(this.scene.time.now / 600) * 0.6;
    }
  }
}
