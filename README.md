# Harsha Biyyapu — Portfolio

A responsive portfolio with an on-demand GeoPulse live preview, interactive physics skills, photo gallery, and certificate viewer. There is no tracking or analytics.

The design uses bold condensed type (Anton) with Inter Tight, rounded colour panels on black, outlined pills, sticker illustrations (`assets/stickers/`), and springy motion. `motion.js` drives Lenis smooth scrolling and GSAP (ScrollTrigger, SplitText, Draggable, Inertia) effects; all of it reverts when the footer Motion toggle is off or the visitor prefers reduced motion. Libraries are self-hosted in `assets/vendor/`.

## Local preview

```sh
npm install
npm start
```

Open http://localhost:4173.

## Validate and build

```sh
npm run check
npm run build
```

Static output is written to `dist/` and deployed on Vercel (`vercel.json`).

## Content

Personal photos are in `assets/gallery/`; captions and slideshow settings are in `app.js`. GeoPulse opens in an embedded viewer with a direct-site fallback. External websites may restrict embedded authentication or navigation.

Personal photographs, certificates, and project media belong to their respective owners. Institutional logos are used for identification. Font and library licenses are retained under `assets/licenses/`.
