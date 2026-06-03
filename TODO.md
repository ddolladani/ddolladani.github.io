# Dad: The Book of Derrick — TODO / Pick-up Notes

A Father's Day adventure game for Derrick. Dad plays as himself, walks through
1166 and its yard, and unlocks memories across three chapters (DJ, Danielle,
Together). Built to run in the browser / GitHub Pages.

Last worked on: 2026-06-02.

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
- No real photos/videos or music added yet — placeholders show "photo coming
  soon" and music is skipped until a real file exists.

---

## TODO — when I come back

### 1. Fix lingering memory pop-up on the last memory
- The content pop-up lingers/doesn't clean up properly on the **last** memory
  of a chapter. Investigate `src/scenes/MemoryScene.js` (`_close`) and how it
  interacts with chapter completion in `ChapterScene._completeChapter` — likely
  a race between the memory closing and the completion transition firing.

### 2. Ending → "Hall of Fame" easter egg (instead of ending right away)
- After the final memory, don't go straight to the end. Open an **easter egg**:
  a **Hall of Fame** that plays videos of different family members saying
  "Happy Father's Day."
- Concept: maybe a **movie theater** scene (screen + seats), each video a
  "feature." Theater styling possibly themed like **NCG** (decide later).
- Needs: collect the family video clips; decide theater layout + how he
  advances between clips.

### 3. Make the avatar look like Dad
- Provide a photo of Dad → restyle the `Character` (hair, skin tone, clothing,
  maybe glasses/facial hair) in `src/entities/Character.js` to resemble him.

### 4. Fix unreadable text
- Title/start screen text and the **top-of-screen HUD during play** are hard to
  read. Add stronger contrast: backing plate/panel behind text, outline/shadow,
  or reposition. Affects `TitleScene` and the HUD in `HubScene` / `ChapterScene`.

### 5. More depth in the art/illustrations
- Add more layering/parallax, atmospheric perspective, shadows, and detail
  across scenes to make them feel richer and more three-dimensional.

### 6. Music (NOT retro/chiptune anymore)
- Find fitting background music — warm/cinematic/acoustic, since the art is
  illustrated now, not pixel. Drop the file at
  `public/assets/audio/chiptune_main.mp3` (or rename + update `BootScene`).
- Should still duck/fade under video memories (already wired in MemoryScene).

### 7. Fix head/facing movement following controls
- The character's head/facing direction tied to keyboard input feels off on
  desktop. Revisit facing logic in `src/entities/Character.js` (`update`,
  the `facing` / `facingUp` handling).

### 8. Decide replacement for the Danielle sign
- Ask Danielle what she wants her entry to be (instead of the signpost), then
  build it — mirror of how DJ got the tree and Together got the house.

---

## Content checklist (gather these)
- [ ] ~5 photos/videos each for DJ, Danielle, Together (+ dates & captions)
- [ ] Family "Happy Father's Day" video clips (for the Hall of Fame)
- [ ] A clear photo of Dad (for the avatar)
- [ ] Background music track
- [ ] Danielle's entry idea
