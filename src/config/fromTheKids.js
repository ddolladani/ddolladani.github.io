// ============================================================
// FROM THE KIDS — the finale, shown after the Hall of Fame and before the
// closing credits. Two big screens (DJ + Danielle) in their own little room;
// Dad walks up to a screen and that "Happy Father's Day" clip plays — same
// walk-up-to-play feel as the Hall of Fame, just two larger screens.
//
// For each clip:
//   name : the label on the screen's plaque
//   src  : path to the clip in /public/assets/kids/
//
// PLACEHOLDERS: `src` is omitted for now, so each screen shows a polished
// "clip coming soon" card and the finale still plays through. When the videos
// are ready, just:
//   1. drop the files at  public/assets/kids/dj.mp4  and  .../danielle.mp4
//   2. add the matching  src: "assets/kids/dj.mp4"  line below
// (No other code changes needed.)
// ============================================================

export const fromTheKids = {
  title: "Happy Father's Day",
  subtitle: "from your kids 💛",
  clips: [
    { name: "DJ" /* , src: "assets/kids/dj.mp4" */ },
    { name: "Danielle" /* , src: "assets/kids/danielle.mp4" */ }
  ]
};
