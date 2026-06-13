# Dad: The Book of Derrick — TODO / Pick-up Notes

A Father's Day adventure game for Derrick. Dad plays as himself, walks through
1166 and its yard, and unlocks memories across three chapters (DJ, Danielle,
Together). Built to run in the browser / GitHub Pages.

Last worked on: 2026-06-03.

---

## How to run it

```
npm install        # first time only
npm run dev        # local dev server (Vite) — open the printed localhost URL
npm run build      # outputs to /docs for GitHub Pages
```

## Where things live

- `src/main.js` — Phaser game config (renderer, scale, scene list)
- `src/scenes/` — BootScene, IntroScene, TitleScene, HubScene, ChapterScene,
  MemoryScene, EndingScene
- `src/art/` — palette, Scenery (sky/trees/etc.), House1166 (exterior),
  HouseInterior (living room), effects (glow/vignette/fireflies)
- `src/entities/` — Character (the avatar), MemorySpot (the glowing frames)
- `src/ui/` — panels, hint pills, headings, signpost
- `src/config/memories.js` — **all photo/video content goes here** (one entry
  per memory: type image/video, src, date, caption)
- `public/assets/` — drop real files here: `memories/<chapter>/...`,
  `audio/chiptune_main.mp3` (music), sprites, etc.

## Notes / current state

- `PREVIEW_UNLOCK_TOGETHER` in `src/scenes/HubScene.js` is currently **false**
  (real gated experience: the house/Together stays locked until DJ + Danielle
  are finished). Set true to preview the interior without finishing them.
- Together (house door) = interior living room. DJ (tree) = forest/treehouse.
  Danielle (sign) = golden-hour garden — placeholder until she decides.
- Music is in: `public/assets/audio/gameMusic.wav` (wired in `BootScene`).
  NOTE: it's a 31 MB WAV — works, but should be compressed to mp3/ogg
  (~2–4 MB) before shipping to GitHub Pages for fast loads.
- Avatar restyled to resemble Dad (brown skin, short textured hair, black
  rectangular glasses, burgundy shirt) in `src/entities/Character.js`, using
  the reference photos in `images/`.
- No real memory photos/videos added yet — placeholders show "photo coming
  soon" for each memory spot.

---

## TODO

### ✅ Done (2026-06-03)
- **1. Lingering memory pop-up** — fixed the double-render, made `_close`
  idempotent, DOM cleanup on shutdown, listener no longer stacks on re-entry,
  and the chapter now pauses under the open memory. (`MemoryScene.js`,
  `ChapterScene.js`)
- **3. Avatar looks like Dad** — brown skin, short textured hair, black
  rectangular glasses, burgundy shirt. (`Character.js`) — being upgraded
  further, see #10.
- **4. Unreadable text** — added a top HUD scrim + strokes/shadows on HUD and
  title-screen text. (`ui.js`, `TitleScene`, `HubScene`, `ChapterScene`)
- **5. More art depth** — parallax hills, horizon haze, and foreground framing
  (fronds/grass). (`Scenery.js` + the outdoor scenes)
- **6. Music** — `gameMusic.wav` wired in `BootScene`. (compress to mp3/ogg
  before shipping — it's a 31 MB WAV)
- **7. Head/facing movement** — fixed the diagonal back-view flicker and
  smoothed the left/right turn. (`Character.js`)
- **9. Ego Tavern** — new walk-in gallery room wall-to-wall with framed photos
  of Dad + neon sign. Entered via a tavern building in the yard.
  (`EgoTavernScene.js`, building/entry in `HubScene.js`). Photos:
  `public/assets/ego/p1–p5.jpg` (from `images/Ego/`).
- **10. Better avatar** — Dad's real face photo, circular-masked, on the drawn
  body. (`avatarHead.js`, `Character.js`; `dad_face` loaded in `BootScene`).
  Falls back to the drawn head if the photo is missing. Tune the face crop via
  the `fx/fy/fz` defaults in `ensureDadHead`.

### Open

### ✅ 2. Hall of Fame easter egg (DONE 2026-06-04)
- DONE: he travels there now. Flow: finish 3rd chapter → back in the **yard**,
  where the **ROAD CLOSED barricade lifts** and a glowing "🎬 To the theater ↓"
  opens at the street → walk down past it → **ParkingLotScene** (dusk lot with
  parked cars, lampposts, and the lit **NCG** theater + marquee) → press E at
  the doors → **HallOfFameScene** (marquee, red curtains, screen, projector
  beam, audience) → **EndingScene**. In the theater SPACE/E/→/ENTER advances a
  feature, ESC skips. Driven by `src/config/hallOfFame.js`.
- TO FINISH: add the real clips. Drop `.mp4` files in **`public/assets/family/`**
  and point each `src` in `hallOfFame.js` at them (e.g. `assets/family/dj.mp4`).
  Until then each person shows a polished "clip coming soon" card. Source clips
  can be staged in `images/Family/` first (see [asset pipeline]).

### ✅ 11. Ego Tavern v2 — big "cycle viewer" (DONE 2026-06-03)
- DONE: one wall-sized gold frame; Dad walks to a glowing button and presses E
  to cycle photos; button shows `x / n`; after 3 cycles the room dims (dark
  overlay up + string lights/neon down). Driven by the `PHOTOS` list in
  `EgoTavernScene.js`, so new Ego photos just drop in as `public/assets/ego/pN.jpg`.
- Root-cause of the blur (for reference): ~2700px sources downscaled to tiny
  frames with no mipmaps + the 960×640 canvas upscaled to the monitor. The big
  viewer fixes the perceived blur. (A global crispness pass is still possible
  later if wanted.)

### 8. Decide replacement for the Danielle sign
- Ask Danielle what she wants her entry to be (instead of the signpost), then
  build it — mirror of how DJ got the tree and Together got the house.

---

## Content checklist (gather these)
Drop source files in the `images/<Chapter>/` folders (DJ, Danielle, Together,
Ego, Family, Misc). To wire them into the game they must be copied into
`public/assets/...` and referenced (memories in `src/config/memories.js`).
- [ ] ~5 photos/videos each for DJ, Danielle, Together (+ dates & captions)
      — `images/DJ`, `images/Danielle`, `images/Together` are still empty
- [ ] Family "Happy Father's Day" video clips (for the Hall of Fame) — `images/Family`
- [x] A clear photo of Dad (for the avatar) — `public/assets/avatar/dad_face.jpg`
- [x] Ego Tavern photos — `images/Ego/` → `public/assets/ego/p1–p5.jpg`
- [x] Background music track — `gameMusic.wav` (compress before shipping)
- [ ] Danielle's entry idea
