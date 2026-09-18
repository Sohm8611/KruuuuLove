# Kruuuu Love — Private Digital Romantic Website & Memory Archive

A standalone, production-quality, personal romantic storytelling website and digital memory archive built exclusively for **Kruuuu**.

Designed with modern Apple-like simplicity, cinematic editorial typography, delicate scrapbook intimacy, and a high-refresh-rate canvas particle physics climax.

---

## 1. How to Run the Website Locally

1. Open your terminal or PowerShell in the project directory:
   ```powershell
   cd E:\KruuuuLove
   ```
2. Start the high-speed local dev server:
   ```powershell
   npm run dev
   ```
3. Open your browser to:
   ```
   http://localhost:5173
   ```

To build a production bundle at any time:
```powershell
npm run build
```

---

## 2. Where to Place Real Photographs

The website architecture is completely decoupled from placeholder images. All images are stored locally in:
```
E:\KruuuuLove\assets\images\
```

### Replacing Placeholder Images:
When you have the real photographs ready, simply copy them into `/assets/images/` and rename them or update the path:
- **Streets of Europe, Pune**: Replace `memory-01.jpg`
- **ISKCON Pune**: Replace `memory-02.jpg`
- **The Scooty 5km Walk**: Replace `memory-03.jpg`
- **14 August Confession Day**: Replace `memory-04.jpg`
- **15 August The Last Night in Pune & First Kiss**: Replace `first-night.jpg`
- **Additional Future Memories**: Replace `placeholder.jpg`
- **Travel Cards**: Replace `travel-korea.jpg`, `travel-italy.jpg`, `travel-dubai.jpg`, `travel-singapore.jpg`, `travel-thailand.jpg`, `travel-japan.jpg`

The images use `object-fit: cover` with responsive aspect ratios, so your real photos will look stunning without stretching or distortion.

---

## 3. Where to Place Music

The polite audio player is pre-configured for:
```
E:\KruuuuLove\assets\music\meri-banogi-kya.mp3
```

- Song: **"Meri Banogi Kya" — Eshaas (acoustic)**
- Drop your `.mp3` file directly into `/assets/music/` and name it `meri-banogi-kya.mp3`.
- **Intelligent Fallback**: If no MP3 is present, the website automatically utilizes a warm, procedural Web Audio synthesizer playing the acoustic guitar arpeggios in D Major (D - F#m - G - A) whenever the play button is clicked, ensuring the experience is never broken or silent.
- **Polite Playback**: The player **never autoplays** without user interaction, respecting browser policies and personal preference.

---

## 4. How Memories Can Be Edited

All memory items are stored as clean JavaScript objects in:
```
E:\KruuuuLove\src\data\memories.js
```

Each memory contains:
```javascript
{
  id: "unique-id",
  title: "Memory Title",
  date: "Month Year",
  location: "City, Place",
  category: "Tag",
  image: "/assets/images/your-photo.jpg",
  caption: "Short editorial caption",
  details: "Extended memory description"
}
```
You can add, reorder, or edit as many memories as you want. The gallery grid automatically renders them!

---

## 5. How Relationship Dates Can Be Changed

The relationship start date and core metadata are defined in:
```
E:\KruuuuLove\src\data\config.js
```

```javascript
export const CONFIG = {
  partnerName: "Kruuuu",
  partnerFullName: "Krutika",
  startDate: "2026-08-14T00:00:00+05:30", // Confession date: 14 August 2026
  // ...
};
```
The live counter automatically calculates elapsed days, hours, minutes, and seconds in real-time.

---

## 6. How Future Content & Letters Can Be Edited

- **Story Timeline**: Edit `src/data/story.js`
- **Things I Love & Notice**: Edit `src/data/loves.js` (includes hair twirling, "mar khashil", recess calls, dark humor, Indian hip-hop, etc.)
- **Floating Thoughts in "Inside My Head"**: Edit `src/data/thoughts.js`
- **Bucket List & Travel Wishlist**: Edit `src/data/future.js`
- **Personal Letter**: Edit the paragraphs array in `FINAL_LETTER` within `src/data/future.js`

---

## 7. Performance & 144 FPS Display Optimization

- Built for 60 to 144 FPS refresh rates (delta-time normalized physics on both canvases).
- Viewport-aware culling stops background canvas loops when off-screen.
- Zero layout thrashing, zero memory leaks.
- Full reduced-motion support via `@media (prefers-reduced-motion: reduce)`.
