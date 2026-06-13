import Phaser from "phaser";

// Builds a circular, face-framed head texture from Dad's real photo ("dad_face"),
// generated once and cached in the global TextureManager so every scene reuses it.
// Returns the texture key, or null if the source photo isn't loaded (callers then
// fall back to the drawn head).
//
// The focal box (fx, fy = center as fractions of the image; fz = box size as a
// fraction of the image's shorter side) is tuned for the car-selfie headshot.
// Tweak these if the crop sits too high/low or too tight/loose on his face.
export function ensureDadHead(scene, opts = {}) {
  const srcKey = "dad_face";
  const outKey = "dad-head";
  if (scene.textures.exists(outKey)) return outKey;
  if (!scene.textures.exists(srcKey)) return null;

  // Defaults tuned for the tight face crop in avatar.JPG (forehead→chin).
  const { fx = 0.5, fy = 0.46, fz = 1.0, size = 160 } = opts;
  const src = scene.textures.get(srcKey).getSourceImage();
  const cw = src.width, ch = src.height;
  const box = Math.min(cw, ch) * fz;
  const sx = Phaser.Math.Clamp(fx * cw - box / 2, 0, Math.max(0, cw - box));
  const sy = Phaser.Math.Clamp(fy * ch - box / 2, 0, Math.max(0, ch - box));

  const cv = scene.textures.createCanvas(outKey, size, size);
  const ctx = cv.getContext();
  ctx.imageSmoothingEnabled = true;
  ctx.imageSmoothingQuality = "high";   // sharper downscale than WebGL bilinear
  ctx.clearRect(0, 0, size, size);
  ctx.save();
  ctx.beginPath();
  ctx.arc(size / 2, size / 2, size / 2 - 1, 0, Math.PI * 2);
  ctx.closePath();
  ctx.clip();
  ctx.drawImage(src, sx, sy, box, box, 0, 0, size, size);
  ctx.restore();
  cv.refresh();
  return outKey;
}
