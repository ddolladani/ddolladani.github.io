// ============================================================
// MEMORY CONFIGURATION
//
// For each memory:
//   type      : "image" or "video"  (the MAIN piece of media)
//   src       : path to the main file inside /public/assets/memories/
//   secondary : OPTIONAL path to a second piece of media shown small in the
//               corner. If the main is a video, the secondary photo sits in
//               the corner of the video. If the main is a photo, the secondary
//               photo is shown as a little inset.
//   date      : shown as a sticker in the corner  (e.g. "Summer 1995")
//   caption   : shown underneath the photo/video
//
// NOTE: captions/dates marked "Add ... here" are placeholders to fill in by
// hand — the photo/video itself already shows.
// ============================================================

export const memories = {
  // DJ — captions/dates are placeholders for now (the photos/videos all show).
  dj: [
    { type: "image", src: "assets/memories/dj/memory1.jpg",
      date: "Add date here", caption: "Add caption here" },
    // DJ2: video is the main piece, the photo rides in the corner.
    { type: "video", src: "assets/memories/dj/memory2.mp4",
      secondary: "assets/memories/dj/memory2_b.jpg",
      date: "Add date here", caption: "Add caption here" },
    { type: "image", src: "assets/memories/dj/memory3.jpg",
      date: "Add date here", caption: "Add caption here" },
    // DJ4: video main + photo in the corner.
    { type: "video", src: "assets/memories/dj/memory4.mp4",
      secondary: "assets/memories/dj/memory4_b.jpg",
      date: "Add date here", caption: "Add caption here" },
    { type: "image", src: "assets/memories/dj/memory5.jpg",
      date: "Add date here", caption: "Add caption here" },
    { type: "image", src: "assets/memories/dj/memory6.jpg",
      date: "Add date here", caption: "Add caption here" },
    { type: "image", src: "assets/memories/dj/memory7.jpg",
      date: "Add date here", caption: "Add caption here" },
    { type: "image", src: "assets/memories/dj/memory8.jpg",
      date: "Add date here", caption: "Add caption here" },
    { type: "image", src: "assets/memories/dj/memory9.jpg",
      date: "Add date here", caption: "Add caption here" },
    { type: "image", src: "assets/memories/dj/memory10.jpg",
      date: "Add date here", caption: "Add caption here" },
    { type: "image", src: "assets/memories/dj/memory11.jpg",
      date: "Add date here", caption: "Add caption here" }
  ],

  danielle: [
    // Two photos from the same trip: ATV ride (main) + the suspension bridge (inset).
    { type: "image", src: "assets/memories/danielle/memory1.jpg",
      secondary: "assets/memories/danielle/memory1_b.jpg",
      date: "April 2021",
      caption: "Cabo San Lucas — a really fun family vacation, right before you moved to Boston for your new job!" },
    { type: "image", src: "assets/memories/danielle/memory2.jpg",
      date: "2015",
      caption: "Junior year prom — the personality pic that describes us well!" },
    { type: "video", src: "assets/memories/danielle/memory3.mp4",
      date: "July 2017",
      caption: "Cancun — our first family vacation after I started college. First time I felt like an adult, LOL. So fun making memories with my dad." },
    { type: "image", src: "assets/memories/danielle/memory4.jpg",
      date: "2021",
      caption: "My 1st apartment — couldn't have gotten it without you co-signing for me. I'm still so grateful, Dad." },
    { type: "image", src: "assets/memories/danielle/memory5.jpg",
      date: "July 2025",
      caption: "Antonio & Danielle's wedding — you telling Antonio to take care of me before you gave me away. So much love. So touching." },
    { type: "image", src: "assets/memories/danielle/memory6.jpg",
      date: "Add date here", caption: "Add caption here" },
    { type: "image", src: "assets/memories/danielle/memory7.jpg",
      date: "Add date here", caption: "Add caption here" },
    { type: "image", src: "assets/memories/danielle/memory8.jpg",
      date: "Add date here", caption: "Add caption here" },
    { type: "image", src: "assets/memories/danielle/memory9.jpg",
      date: "Add date here", caption: "Add caption here" },
    { type: "image", src: "assets/memories/danielle/memory10.jpg",
      date: "Add date here", caption: "Add caption here" },
    { type: "image", src: "assets/memories/danielle/memory11.jpg",
      date: "Add date here", caption: "Add caption here" },
    { type: "image", src: "assets/memories/danielle/memory12.jpg",
      date: "Add date here", caption: "Add caption here" }
  ],

  together: [
    { type: "image", src: "assets/memories/together/memory1.jpg",
      date: "Add date here", caption: "Add caption here" },
    { type: "image", src: "assets/memories/together/memory2.jpg",
      date: "August 2023", caption: "Moving DJ into his freshman dorm 💛" },
    { type: "image", src: "assets/memories/together/memory3.jpg",
      date: "Add date here", caption: "Add caption here" },
    { type: "image", src: "assets/memories/together/memory4.jpg",
      date: "2021", caption: "Daddy's birthday 🎂" },
    { type: "image", src: "assets/memories/together/memory5.jpg",
      date: "June 2024", caption: "Father's Day in Boston 💛" },
    { type: "image", src: "assets/memories/together/memory6.jpg",
      date: "2018", caption: "Father's Day — Best Dad Ever!" }
  ]
};
