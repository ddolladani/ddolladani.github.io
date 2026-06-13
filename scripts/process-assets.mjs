// One-off asset pipeline: converts the raw iPhone source files staged in
// images/<Chapter>/ into browser-safe files under public/assets/.
//   - HEIC  -> JPEG            (browsers can't show HEIC)
//   - MOV    -> MP4 (H.264/AAC) (broad browser playback, smaller for Pages)
//   - JPG    -> re-saved with EXIF orientation BAKED IN (Phaser ignores EXIF)
//
// Run:  node scripts/process-assets.mjs
//
// Idempotent: safe to re-run; it overwrites outputs. Source originals are kept
// in images/<Chapter>/ as the archival copy and are not shipped.

import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { readFile, mkdir, writeFile } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import heicConvert from "heic-convert";
import ffmpegPath from "ffmpeg-static";

const execFileP = promisify(execFile);
const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const IMG = (p) => path.join(ROOT, "images", p);
const OUT = (p) => path.join(ROOT, "public", "assets", p);

// width caps
const MAIN_W = 1400;   // primary photos
const CORNER_W = 900;  // secondary corner insets
const VIDEO_W = 1280;

async function toJpeg(srcRel, outRel, maxW = MAIN_W) {
  const src = IMG(srcRel);
  if (!existsSync(src)) { console.warn("  ! missing", srcRel); return; }
  let input = src;
  if (/\.heic$/i.test(src)) {
    const buf = await readFile(src);
    const jpg = await heicConvert({ buffer: buf, format: "JPEG", quality: 0.92 });
    input = Buffer.from(jpg);
  } else {
    // extension-less HEIC (e.g. DJ2Pic) — sniff the ftyp box
    const head = await readFile(src);
    if (head.slice(4, 12).toString("latin1") === "ftypheic") {
      const jpg = await heicConvert({ buffer: head, format: "JPEG", quality: 0.92 });
      input = Buffer.from(jpg);
    }
  }
  const out = OUT(outRel);
  await mkdir(path.dirname(out), { recursive: true });
  await sharp(input)
    .rotate()                                  // bake EXIF orientation
    .resize({ width: maxW, withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(out);
  console.log("  img", srcRel, "->", outRel);
}

async function toMp4(srcRel, outRel) {
  const src = IMG(srcRel);
  if (!existsSync(src)) { console.warn("  ! missing", srcRel); return; }
  const out = OUT(outRel);
  await mkdir(path.dirname(out), { recursive: true });
  await execFileP(ffmpegPath, [
    "-y", "-i", src,
    "-vf", `scale='min(${VIDEO_W},iw)':-2`,
    "-c:v", "libx264", "-preset", "veryfast", "-crf", "24",
    "-pix_fmt", "yuv420p",
    "-c:a", "aac", "-b:a", "128k",
    "-movflags", "+faststart",
    out
  ]);
  console.log("  vid", srcRel, "->", outRel);
}

const JOBS = async () => {
  console.log("DJ");
  await toJpeg("DJ/DJ1.JPG",     "memories/dj/memory1.jpg");
  await toMp4 ("DJ/DJ2Vid.mov",  "memories/dj/memory2.mp4");
  await toJpeg("DJ/DJ2Pic",      "memories/dj/memory2_b.jpg", CORNER_W);
  await toJpeg("DJ/DJ3.HEIC",    "memories/dj/memory3.jpg");
  await toMp4 ("DJ/DJ4Vid.mp4",  "memories/dj/memory4.mp4");
  await toJpeg("DJ/DJ4Pic.heic", "memories/dj/memory4_b.jpg", CORNER_W);
  await toJpeg("DJ/DJ5.heic",    "memories/dj/memory5.jpg");
  await toJpeg("DJ/DJ6.HEIC",    "memories/dj/memory6.jpg");
  await toJpeg("DJ/DJ7.jpg",     "memories/dj/memory7.jpg");
  await toJpeg("DJ/DJ8.jpg",     "memories/dj/memory8.jpg");
  await toJpeg("DJ/DJ9.jpg",     "memories/dj/memory9.jpg");
  await toJpeg("DJ/DJ10.heic",   "memories/dj/memory10.jpg");
  await toJpeg("DJ/DJ11.heic",   "memories/dj/memory11.jpg");

  console.log("Danielle");
  await toJpeg("Danielle/Dani1a.JPG", "memories/danielle/memory1.jpg");
  await toJpeg("Danielle/Dani1b.JPG", "memories/danielle/memory1_b.jpg", CORNER_W);
  await toJpeg("Danielle/Dani2.JPG",  "memories/danielle/memory2.jpg");
  await toMp4 ("Danielle/Dani3.mov",  "memories/danielle/memory3.mp4");
  await toJpeg("Danielle/Dani4.JPG",  "memories/danielle/memory4.jpg");
  await toJpeg("Danielle/Dani5.JPG",  "memories/danielle/memory5.jpg");
  await toJpeg("Danielle/Dani6.jpg",   "memories/danielle/memory6.jpg");
  await toJpeg("Danielle/Dani7.jpg",   "memories/danielle/memory7.jpg");
  await toJpeg("Danielle/Dani8.jpg",   "memories/danielle/memory8.jpg");
  await toJpeg("Danielle/Dani9.heic",  "memories/danielle/memory9.jpg");
  await toJpeg("Danielle/Dani10.heic", "memories/danielle/memory10.jpg");
  await toJpeg("Danielle/Dani11.heic", "memories/danielle/memory11.jpg");
  await toJpeg("Danielle/Dani12.heic", "memories/danielle/memory12.jpg");

  console.log("Together");
  await toJpeg("Together/To1.JPG",  "memories/together/memory1.jpg");
  await toJpeg("Together/To2.JPG",  "memories/together/memory2.jpg");
  await toJpeg("Together/To3.jpeg", "memories/together/memory3.jpg");
  await toJpeg("Together/To4.JPG",  "memories/together/memory4.jpg");
  await toJpeg("Together/To5.JPG",  "memories/together/memory5.jpg");
  await toJpeg("Together/To6.JPG",  "memories/together/memory6.jpg");

  console.log("Ego (appended after existing p1-p5)");
  await toJpeg("Ego/Ego1.jpg",       "ego/p6.jpg");
  await toJpeg("Ego/IMG_2539.jpeg",  "ego/p7.jpg");
  await toJpeg("Ego/b946b47d-b3dc-491f-9708-4ec4f60edcf8.jpg", "ego/p8.jpg");
  await toJpeg("Ego/Ego4.heic",      "ego/p9.jpg");
  await toJpeg("Ego/Ego5.heic",      "ego/p10.jpg");
  await toJpeg("Ego/Ego6.heic",      "ego/p11.jpg");
  await toJpeg("Ego/Ego7.heic",      "ego/p12.jpg");
  await toJpeg("Ego/Ego8.heic",      "ego/p13.jpg");
  await toJpeg("Ego/Ego9.heic",      "ego/p14.jpg");

  console.log("Hall of Fame");
  await toMp4("Family/HOF1.mov", "family/hof1.mp4");
  await toMp4("Family/HOF2.mov", "family/hof2.mp4");
  await toMp4("Family/HOF3.MOV", "family/hof3.mp4");
  await toMp4("Family/HOF4.mov", "family/hof4.mp4");
  await toMp4("Family/HOF5.mov", "family/hof5.mp4");
};

await JOBS();
console.log("done.");
